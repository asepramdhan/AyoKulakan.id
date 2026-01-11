<?php

namespace App\Http\Controllers;

use App\Models\DailyCost;
use App\Models\Product;
use App\Models\SalesRecord;
use App\Models\Store;
use App\Models\Supply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $today = now()->toDateString();

        return Inertia::render('sales/index', [
            'products' => Auth::user()->products,
            'stores' => Store::where('user_id', Auth::id())->get(),
            'salesRecords' => SalesRecord::where('user_id', Auth::id())
                ->with('store')
                ->latest()
                ->get(),
            'todayAdCost' => DailyCost::where('user_id', Auth::id())->where('date', $today)->first(),
        ]);
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
    public function store(Request $request)
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

        // 3. Kalkulasi Profit yang Akurat dengan Qty
        $quantity = $validated['qty'];
        $totalSellPrice = $validated['sell_price'] * $quantity;
        $totalBuyPrice = $validated['buy_price'] * $quantity;

        // Admin Fee dihitung dari Total Harga Jual
        $adminFee = ($totalSellPrice * $validated['marketplace_fee_percent']) / 100;

        // Total potongan (Biaya tetap biasanya per resi/transaksi)
        $totalPotongan = $adminFee + ($validated['flat_fees'] ?? 0) + ($validated['extra_costs'] ?? 0);

        // Profit = (Total Jual - Total Modal) - Potongan - Ongkir (jika ditanggung seller)
        $profit = $totalSellPrice - $totalBuyPrice - $totalPotongan - ($validated['shipping_cost'] ?? 0);

        $totalPercent = (float)$validated['marketplace_fee_percent'] + (float)$validated['promo_extra_percent'];
        $totalSellPrice = $validated['sell_price'] * $quantity;

        // Hitung potongan persen (Admin + Promo Extra)
        $percentageFee = ($totalSellPrice * $totalPercent) / 100;

        // Total potongan = Biaya Persen + Biaya Flat + Biaya Lainnya
        $totalPotongan = $percentageFee + ($validated['flat_fees'] ?? 0) + ($validated['extra_costs'] ?? 0);

        // Profit
        $profit = $totalSellPrice - ($validated['buy_price'] * $quantity) - $totalPotongan - ($validated['shipping_cost'] ?? 0);

        try {
            // SEMUA PROSES PERUBAHAN DATA HARUS DI DALAM TRANSACTION
            DB::transaction(function () use ($validated, $profit, $quantity) {
                // A. Update/Create Produk Master & Potong Stok Produk
                $product = Product::where('user_id', Auth::id())
                    ->where('name', $validated['product_name'])
                    ->first();

                if ($product) {
                    $product->update([
                        'last_price'      => $validated['buy_price'],
                        'last_sell_price' => $validated['sell_price'],
                        'stock'           => $product->stock - $quantity // Potong stok di sini
                    ]);
                } else {
                    // Jika produk belum ada di master, buat baru dengan stok minus (atau 0)
                    Product::create([
                        'user_id'         => Auth::id(),
                        'store_id'        => $validated['store_id'],
                        'name'            => $validated['product_name'],
                        'last_price'      => $validated['buy_price'],
                        'last_sell_price' => $validated['sell_price'],
                        'stock'           => -$quantity // Karena terjual tapi master belum ada stoknya
                    ]);
                }

                // B. Simpan data transaksi
                SalesRecord::create([
                    'user_id'                 => Auth::id(),
                    'created_at'              => $validated['created_at'] ?? now(),
                    'product_name'            => $validated['product_name'],
                    'qty'                     => $quantity, // Pastikan kolom qty ada di table sales_records
                    'buy_price'               => $validated['buy_price'],
                    'sell_price'              => $validated['sell_price'],
                    'marketplace_fee_percent' => $validated['marketplace_fee_percent'],
                    'promo_extra_percent'     => $validated['promo_extra_percent'],
                    'store_id'                => $validated['store_id'],
                    'marketplace_name'        => $validated['marketplace_name'],
                    'shipping_cost'           => $validated['shipping_cost'] ?? 0,
                    'flat_fees'               => $validated['flat_fees'] ?? 0,
                    'extra_costs'             => $validated['extra_costs'] ?? 0,
                    'profit'                  => $profit,
                ]);

                // C. LOGIKA OTOMATIS POTONG STOK BAHAN PACKING (Pindahkan ke sini)
                $supplies = Supply::where('user_id', Auth::id())->get();

                foreach ($supplies as $supply) {
                    if ($supply->reduction_type === 'per_transaction') {
                        // Kertas Thermal / Lakban (Apapun QTY-nya, potong 1 resi)
                        $supply->decrement('current_stock', 1);
                    } elseif ($supply->reduction_type === 'per_item') {
                        // Plastik Packing (Potong sesuai jumlah barang yang dibeli)
                        $supply->decrement('current_stock', $quantity);
                    }
                }
            });

            return back();
        } catch (\Exception $e) {
            return back();
        }
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
        // 1. Pembersihan format harga (sama seperti store)
        $request->merge([
            'buy_price' => (float) str_replace(['.', ','], '', (string)$request->buy_price),
            'sell_price' => (float) str_replace(['.', ','], '', (string)$request->sell_price),
            'shipping_cost' => (float) str_replace(['.', ','], '', (string)$request->shipping_cost),
            'flat_fees' => (float) str_replace(['.', ','], '', (string)$request->flat_fees),
            'extra_costs' => (float) str_replace(['.', ','], '', (string)$request->extra_costs),
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

        try {
            $record = SalesRecord::findOrFail($id);
            $oldQty = $record->qty; // Simpan qty lama
            $newQty = $validated['qty']; // Qty baru dari input

            DB::transaction(function () use ($validated, $record, $oldQty, $newQty) {

                // 2. Kalkulasi ulang profit
                $totalPercent = $validated['marketplace_fee_percent'] + $validated['promo_extra_percent'];
                $totalSell = $validated['sell_price'] * $validated['qty'];
                $totalPotongan = ($totalSell * $totalPercent / 100) + $validated['flat_fees'] + $validated['extra_costs'];
                $profit = $totalSell - ($validated['buy_price'] * $validated['qty']) - $totalPotongan - ($validated['shipping_cost'] ?? 0);

                $product = Product::where('user_id', Auth::id())
                    ->where('name', $validated['product_name'])
                    ->first();

                if ($product) {
                    $product->user_id = Auth::id();
                    $product->name = $validated['product_name'];
                    // Balikkan stok lama, lalu kurangi dengan stok baru
                    // Rumus: Stok Sekarang + Qty Lama - Qty Baru
                    $product->stock = ($product->stock + $oldQty) - $newQty;
                    $product->last_price = $validated['buy_price'];
                    $product->last_sell_price = $validated['sell_price'];
                    $product->save();
                }

                // --- START: TAMBAHAN LOGIKA UPDATE STOK SUPPLY (Bahan Packing) ---
                $supplies = Supply::where('user_id', Auth::id())->get();

                foreach ($supplies as $supply) {
                    if ($supply->reduction_type === 'per_item') {
                        // Plastik Packing: Balikkan Qty lama, kurangi Qty baru
                        $supply->current_stock = ($supply->current_stock + $oldQty) - $newQty;
                        $supply->save();
                    }
                    // Catatan: untuk 'per_transaction' (Kertas Thermal), 
                    // kita tidak edit stoknya karena update Qty barang tidak mengubah jumlah resi.
                }
                // --- END: TAMBAHAN LOGIKA UPDATE STOK SUPPLY ---

                // 3. Update data
                $record->update(array_merge($validated, [
                    'created_at' => $validated['created_at'] ?? $record->created_at,
                    'store_id' => $validated['store_id'],
                    'profit' => $profit
                ]));
            });

            return back();
        } catch (\Exception $e) {
            return back();
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

        return back()->with('message', 'Biaya iklan berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // 1. Cari datanya
        $sales = SalesRecord::findOrFail($id);

        DB::transaction(function () use ($sales) {
            // Kembalikan stok ke master produk
            $product = Product::where('user_id', Auth::id())
                ->where('name', $sales->product_name)
                ->first();

            if ($product) {
                $product->increment('stock', $sales->qty);
            }

            $supplies = Supply::where('user_id', Auth::id())->get();

            foreach ($supplies as $supply) {
                if ($supply->reduction_type === 'per_transaction') {
                    // Kembalikan 1 unit (karena 1 transaksi = 1 resi/kertas)
                    $supply->increment('current_stock', 1);
                } elseif ($supply->reduction_type === 'per_item') {
                    // PERBAIKAN: Gunakan $sales->qty (bukan $record)
                    $supply->increment('current_stock', $sales->qty);
                }
            }
            // 2. Hapus datanya
            $sales->delete();
        });

        return back();
    }
}
