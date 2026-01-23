<?php

namespace App\Http\Controllers;

use App\Models\DailyCost;
use App\Models\Product;
use App\Models\SalesRecord;
use App\Models\Store;
use App\Models\Supply;
use App\Models\SupplyHistory;
use App\Services\ShopeeService;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SalesRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $today = now()->toDateString();
        $userId = Auth::id();
        // Cek apakah user sudah punya token Shopee
        $shopeeConnected = DB::table('shopee_tokens')->where('user_id', $userId)->exists();

        return Inertia::render('sales/index', [
            'products' => Auth::user()->products,
            'stores' => Store::where('user_id', $userId)->get(),
            'salesRecords' => SalesRecord::where('user_id', $userId)
                ->with('store')
                ->latest()
                ->get(),
            'todayAdCost' => DailyCost::where('user_id', $userId)->where('date', $today)->first(),
            // Kirim status koneksi ke frontend
            'shopeeConnected' => $shopeeConnected
        ]);
    }

    /**
     * FUNGSI BARU: SINKRONISASI SHOPEE LANGSUNG DI HALAMAN SALES
     */
    public function syncShopee()
    {
        $userId = Auth::id();
        $tokenData = DB::table('shopee_tokens')->where('user_id', $userId)->first();

        if (!$tokenData) {
            return back()->with('error', 'Akun Shopee belum terhubung.');
        }

        $shopeeService = new ShopeeService();
        $token = $shopeeService->refreshShopToken($tokenData->shop_id);

        if (!$token) {
            return back()->with('error', 'Gagal refresh token Shopee.');
        }

        $host = config('services.shopee.host');
        $partnerId = (int)config('services.shopee.partner_id');
        $partnerKey = config('services.shopee.partner_key');
        $shopId = (int)$token->shop_id;
        $accessToken = $token->access_token;
        $timestamp = time();

        // 1. Ambil Order List (Looping Pagination jika perlu)
        $pathList = "/api/v2/order/get_order_list";
        $timeFrom = $timestamp - (15 * 24 * 60 * 60); // 15 hari ke belakang
        $timeTo = $timestamp;
        $cursor = ""; // Gunakan cursor untuk pagination Shopee V2
        $allOrderIds = [];

        do {
            $signList = hash_hmac('sha256', $partnerId . $pathList . $timestamp . $accessToken . $shopId, $partnerKey);

            $resList = Http::withoutVerifying()->get($host . $pathList, [
                'partner_id' => $partnerId,
                'timestamp' => $timestamp,
                'access_token' => $accessToken,
                'shop_id' => $shopId,
                'sign' => $signList,
                'time_range_field' => 'create_time',
                'time_from' => $timeFrom,
                'time_to' => $timeTo,
                'page_size' => 50, // Maksimal 50 atau 100
                'cursor' => $cursor
            ])->json();

            if (isset($resList['response']['order_list'])) {
                $currentBatch = collect($resList['response']['order_list'])->pluck('order_sn')->toArray();
                $allOrderIds = array_merge($allOrderIds, $currentBatch);
            }

            // Cek jika ada halaman berikutnya
            $cursor = $resList['response']['next_cursor'] ?? "";
        } while ($cursor !== "");

        // 2. Ambil Detail Order
        if (!empty($allOrderIds)) {
            $pathDetail = "/api/v2/order/get_order_detail";
            // Sign untuk detail (karena path berbeda, sign harus dihitung ulang)
            $signDetail = hash_hmac('sha256', $partnerId . $pathDetail . $timestamp . $accessToken . $shopId, $partnerKey);

            $chunks = array_chunk($allOrderIds, 50);
            foreach ($chunks as $chunkIds) {
                $resDetail = Http::withoutVerifying()->get($host . $pathDetail, [
                    'partner_id' => $partnerId,
                    'timestamp' => $timestamp,
                    'access_token' => $accessToken,
                    'shop_id' => $shopId,
                    'sign' => $signDetail,
                    // Shopee minta order_sn_list dipisah koma
                    'order_sn_list' => implode(',', $chunkIds),
                    'response_optional_fields' => 'item_list,order_status,total_amount,buyer_username'
                ])->json();

                if (isset($resDetail['response']['order_list'])) {
                    foreach ($resDetail['response']['order_list'] as $order) {
                        // Filter status sesuai kebutuhan bisnis Anda 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 
                        $statusValid = ['PROCESSED'];
                        if (in_array($order['order_status'], $statusValid)) {
                            $this->autoImportToSalesRecord($userId, $order, $token->shop_name ?? 'Shopee Store');
                        }
                    }
                }
            }
        }

        return back()->with('success', 'Berhasil menarik ' . count($allOrderIds) . ' data order.');
    }
    // fungsi hapus token shopee
    public function deleteShopeeToken(Request $request)
    {
        $tokenData = DB::table('shopee_tokens')->where('user_id', Auth::id())->first();

        if (!$tokenData) {
            return back()->with('error', 'Akun Shopee belum terhubung.');
        }
        DB::table('shopee_tokens')->where('user_id', Auth::id())->delete();
        return back()->with('success', 'Token Shopee berhasil dihapus.');
    }

    // LOGIKA PENYIMPANAN (DENGAN FIX DUPLIKAT ID)
    private function autoImportToSalesRecord($userId, $orderDetail, $shopName)
    {
        $items = $orderDetail['item_list'] ?? [];
        $transactionService = new TransactionService();

        // 1. Pastikan Store Ada (Cegah Error Foreign Key)
        $localStore = Store::firstOrCreate(
            ['user_id' => $userId, 'name' => $shopName],
            [
                'default_admin_fee' => 6.0,
                'default_process_fee' => 0,
                'default_promo_fee' => 0
            ]
        );

        foreach ($items as $index => $item) {
            // ID UNIK: order_sn + item_id + model_id (paling aman)
            $uniqueExternalId = $orderDetail['order_sn'] . '-' . ($item['item_id']) . '-' . ($item['model_id'] ?? '0');

            // Cek apakah item spesifik ini sudah ada
            if (SalesRecord::where('external_order_id', $uniqueExternalId)->exists()) {
                continue;
            }

            $productName = $item['item_name'];
            // Shopee V2 menggunakan 'model_quantity_purchased'
            $qty = $item['model_quantity_purchased'] ?? 1;

            // Harga jual: Gunakan harga diskon jika ada, jika tidak gunakan harga original
            $sellPrice = $item['model_discounted_price'] > 0 ? $item['model_discounted_price'] : $item['model_original_price'];

            // 2. Cari Master Produk (Gunakan Nama Lengkap agar lebih akurat)
            $masterProduct = Product::where('user_id', $userId)
                ->where('name', $productName) // Coba cari yang persis dulu
                ->first();

            if (!$masterProduct) {
                // Jika tidak ada yang persis, baru gunakan LIKE
                $masterProduct = Product::where('user_id', $userId)
                    ->where('name', 'LIKE', '%' . substr($productName, 0, 20) . '%')
                    ->first();
            }

            $buyPrice = $masterProduct ? $masterProduct->last_price : 0;

            // 3. Eksekusi Simpan
            $transactionService->recordTransaction($userId, [
                'store_id' => $localStore->id, // Pastikan ID Integer
                'store_name' => $shopName,
                'created_at' => date('Y-m-d H:i:s', $orderDetail['create_time']),
                'product_name' => $productName,
                'qty' => $qty,
                'buy_price' => $buyPrice,
                'sell_price' => $sellPrice,
                'marketplace_fee_percent' => $localStore->default_admin_fee ?? 6.0,
                'promo_extra_percent' => $localStore->default_promo_fee ?? 0,
                'marketplace_name' => 'Shopee',
                'shipping_cost' => 0,
                'flat_fees' => $localStore->default_process_fee ?? 0,
                'extra_costs' => 0,
                'external_order_id' => $uniqueExternalId,
            ]);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, TransactionService $transactionService) // Inject Service
    {
        // 1. Bersihkan format harga
        $request->merge([
            'buy_price' => (float) str_replace(['.', ','], '', (string)$request->buy_price),
            'sell_price' => (float) str_replace(['.', ','], '', (string)$request->sell_price),
            'shipping_cost' => (float) str_replace(['.', ','], '', (string)$request->shipping_cost ?? 0),
            'flat_fees' => (float) str_replace(['.', ','], '', (string)$request->flat_fees ?? 0),
            'extra_costs' => (float) str_replace(['.', ','], '', (string)$request->extra_costs ?? 0),
        ]);

        // 2. Validasi Lengkap
        $validated = $request->validate([
            'created_at'              => 'nullable|date',
            'product_name'            => 'required|string',
            'qty'                     => 'required|integer|min:1', // Pastikan Qty ada
            'buy_price'               => 'required|numeric|min:0',
            'sell_price'              => 'required|numeric|min:0',
            'marketplace_fee_percent' => 'required|numeric|min:0',
            'promo_extra_percent'     => 'required|numeric',
            'store_id'                => 'required|exists:stores,id',
            'marketplace_name'        => 'required|string',
            'shipping_cost'           => 'nullable|numeric',
            'flat_fees'               => 'nullable|numeric',
            'extra_costs'             => 'nullable|numeric',
        ]);
        // Panggil Service untuk simpan
        $transactionService->recordTransaction(Auth::id(), [
            'store_id' => $validated['store_id'], // ID Toko Manual
            'created_at' => $validated['created_at'],
            'product_name' => $validated['product_name'],
            'qty' => $validated['qty'],
            'buy_price' => $validated['buy_price'],
            'sell_price' => $validated['sell_price'],
            'marketplace_fee_percent' => $validated['marketplace_fee_percent'],
            'promo_extra_percent' => $validated['promo_extra_percent'],
            'marketplace_name' => $validated['marketplace_name'],
            'shipping_cost' => $validated['shipping_cost'] ?? 0,
            'flat_fees' => $validated['flat_fees'] ?? 0,
            'extra_costs' => $validated['extra_costs'] ?? 0,
            'external_order_id' => null // Manual input tidak punya ID eksternal
        ]);

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // 1. Pembersihan format harga
        $request->merge([
            'buy_price' => (float) str_replace(['.', ','], '', (string)$request->buy_price),
            'sell_price' => (float) str_replace(['.', ','], '', (string)$request->sell_price),
            'shipping_cost' => (float) str_replace(['.', ','], '', (string)$request->shipping_cost),
            'flat_fees' => (float) str_replace(['.', ','], '', (string)$request->flat_fees),
            'extra_costs' => (float) str_replace(['.', ','], '', (string)$request->extra_costs),
        ]);

        // 2. Validasi Lengkap
        $validated = $request->validate([
            'created_at'            => 'nullable|date',
            'product_name'          => 'required|string',
            'qty'                   => 'required|integer|min:1',
            'buy_price'             => 'required|numeric|min:0',
            'sell_price'            => 'required|numeric|min:0',
            'marketplace_fee_percent' => 'required|numeric|min:0',
            'promo_extra_percent'   => 'required|numeric',
            'store_id'              => 'required',
            'marketplace_name'      => 'required|string',
            'shipping_cost'         => 'nullable|numeric',
            'flat_fees'             => 'nullable|numeric',
            'extra_costs'           => 'nullable|numeric',
        ]);

        try {
            $record = SalesRecord::findOrFail($id);
            $oldQty = $record->qty; // Simpan qty lama
            $newQty = $validated['qty']; // Qty baru dari input

            DB::transaction(function () use ($validated, $record, $oldQty, $newQty) {

                // A. Kalkulasi ulang profit
                $totalPercent = $validated['marketplace_fee_percent'] + $validated['promo_extra_percent'];
                $totalSell = $validated['sell_price'] * $newQty;
                $totalPotongan = ($totalSell * $totalPercent / 100) + ($validated['flat_fees'] ?? 0) + ($validated['extra_costs'] ?? 0);
                $profit = $totalSell - ($validated['buy_price'] * $newQty) - $totalPotongan - ($validated['shipping_cost'] ?? 0);

                // B. Update Master Produk
                $product = Product::where('user_id', Auth::id())
                    ->where('name', $validated['product_name'])
                    ->first();

                if ($product) {
                    $product->update([
                        'name' => $validated['product_name'],
                        'last_price' => $validated['buy_price'],
                        'last_sell_price' => $validated['sell_price'],
                        // Rumus: Stok Sekarang + Qty Lama - Qty Baru
                        'stock' => ($product->stock + $oldQty) - $newQty
                    ]);
                }

                // --- C. LOGIKA UPDATE STOK SUPPLY (FULL UPGRADE) ---
                if ($product) {

                    // 1. ROLLBACK Stok Lama (Kembalikan Supply berdasarkan Qty LAMA)
                    // Pakai Helper Baru: getMatchingSupplyRules
                    $oldRules = $this->getMatchingSupplyRules($product->id, $oldQty);

                    foreach ($oldRules as $rule) {
                        $pSupply = Supply::find($rule->supply_id);
                        if ($pSupply) {
                            $restoreAmount = 1; // Default
                            if ($pSupply->reduction_type === 'per_item') {
                                $restoreAmount = $oldQty; // Kembalikan sebanyak qty lama
                            }

                            $pSupply->increment('current_stock', $restoreAmount);

                            SupplyHistory::create([
                                'supply_id' => $pSupply->id,
                                'amount' => $restoreAmount,
                                'stock_after' => $pSupply->current_stock,
                                'note' => 'Edit Trx (Rollback): ' . $pSupply->name,
                            ]);
                        }
                    }

                    // 2. APPLY Stok Baru (Potong Supply berdasarkan Qty BARU)
                    $newRules = $this->getMatchingSupplyRules($product->id, $newQty);

                    foreach ($newRules as $rule) {
                        $pSupply = Supply::find($rule->supply_id);
                        if ($pSupply) {
                            $deductAmount = 1; // Default
                            if ($pSupply->reduction_type === 'per_item') {
                                $deductAmount = $newQty; // Potong sebanyak qty baru
                            }

                            $pSupply->decrement('current_stock', $deductAmount);

                            SupplyHistory::create([
                                'supply_id' => $pSupply->id,
                                'amount' => -1 * $deductAmount,
                                'stock_after' => $pSupply->current_stock,
                                'note' => 'Edit Trx (Apply): ' . $pSupply->name,
                            ]);
                        }
                    }
                }
                // --- END LOGIKA SUPPLY ---

                // D. Update Data Penjualan
                $storeName = $validated['store_id'];
                if (is_numeric($validated['store_id'])) {
                    $s = Store::find($validated['store_id']);
                    if ($s) $storeName = $s->name;
                }

                $record->update(array_merge($validated, [
                    'created_at' => $validated['created_at'] ?? $record->created_at,
                    'store_name' => $storeName, // Update nama toko juga
                    'profit' => $profit
                ]));
            });

            return back()->with('success', 'Transaksi berhasil diupdate!');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal update: ' . $e->getMessage());
        }
    }
    // Tambahkan fungsi untuk simpan/update biaya iklan
    public function updateAdCost(Request $request)
    {
        // Bersihkan format rupiah agar menjadi angka murni
        $cleanAmount = (float) str_replace(['.', ','], '', (string)$request->amount);

        DailyCost::updateOrCreate(
            // 1. Cari berdasarkan user_id DAN tanggal
            [
                'user_id' => Auth::id(),
                'date'    => $request->date,
            ],
            // 2. Data yang diupdate/simpan
            [
                'amount' => $cleanAmount,
                'note'   => $request->note ?? 'Biaya Iklan Harian'
            ]
        );

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $sales = SalesRecord::findOrFail($id);

        DB::transaction(function () use ($sales) {
            // 1. Cari Produk Terkait
            $product = Product::where('user_id', Auth::id())
                ->where('name', $sales->product_name)
                ->first();

            // 2. IDENTIFIKASI SUPPLY KHUSUS (Agar tidak double dengan Global)
            $productSpecificSupplyIds = [];
            if ($product) {
                // A. Kembalikan Stok Produk Utama
                $product->increment('stock', $sales->qty);

                // Ambil ID supply yang terikat produk ini
                $productSpecificSupplyIds = DB::table('product_packagings')
                    ->where('product_id', $product->id)
                    ->pluck('supply_id')
                    ->toArray();
            }

            // 3. KEMBALIKAN GLOBAL SUPPLY (Lakban, Resi)
            // Logic: Ambil yang per_transaction TAPI KECUALIKAN yang ada di aturan produk
            $globalSupplies = Supply::where('user_id', Auth::id())
                ->where('reduction_type', 'per_transaction')
                ->whereNotIn('id', $productSpecificSupplyIds) // PENTING: Filter Exclude
                ->get();

            foreach ($globalSupplies as $s) {
                $s->increment('current_stock'); // Selalu +1

                SupplyHistory::create([
                    'supply_id'   => $s->id,
                    'amount'      => 1, // Positif karena dikembalikan
                    'stock_after' => $s->current_stock,
                    'note'        => 'Hapus Trx (Global): ' . $sales->product_name,
                ]);
            }

            // 4. KEMBALIKAN SPECIFIC SUPPLY (Plastik PP, Packing Luar)
            if ($product) {
                // Gunakan Helper yang sama logic-nya dengan Service
                $matchingRules = $this->getMatchingSupplyRules($product->id, $sales->qty);

                foreach ($matchingRules as $rule) {
                    $pSupply = Supply::where('id', $rule->supply_id)->first();

                    if ($pSupply) {
                        // LOGIKA PINTAR: Cek tipe pengembalian
                        $restoreAmount = 1; // Default +1

                        // Jika tipe supply adalah PER ITEM (Plastik PP), kembalikan sejumlah Qty
                        if ($pSupply->reduction_type === 'per_item') {
                            $restoreAmount = $sales->qty;
                        }

                        $pSupply->increment('current_stock', $restoreAmount);

                        SupplyHistory::create([
                            'supply_id'   => $pSupply->id,
                            'amount'      => $restoreAmount,
                            'stock_after' => $pSupply->current_stock,
                            'note'        => 'Hapus Trx (Rule): ' . $pSupply->name,
                        ]);
                    }
                }
            }

            // 5. Hapus Data Penjualan
            $sales->delete();
        });

        return back()->with('success', 'Transaksi dihapus & Stok dikembalikan.');
    }

    // --- HELPER WAJIB (Copy ke dalam Controller) ---
    // Pastikan fungsi ini ada di dalam class SalesRecordController (paling bawah)
    private function getMatchingSupplyRules($productId, $qty)
    {
        return DB::table('product_packagings')
            ->where('product_id', $productId)
            ->where('min_qty', '<=', $qty)
            ->where(function ($query) use ($qty) {
                $query->where('max_qty', '>=', $qty)
                    ->orWhereNull('max_qty');
            })
            ->get();
    }
}
