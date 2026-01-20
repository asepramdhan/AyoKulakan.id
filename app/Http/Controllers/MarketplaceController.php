<?php

namespace App\Http\Controllers;

use App\Services\ShopeeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Models\SalesRecord;
use App\Models\Product;
use App\Models\Store;
use App\Services\TransactionService;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    private $partnerId;
    private $partnerKey;
    private $shopId;
    private $host;

    public function __construct()
    {
        $this->partnerId = config('services.shopee.partner_id');
        $this->partnerKey = config('services.shopee.partner_key');
        $this->shopId = config('services.shopee.shop_id');
        $this->host = config('services.shopee.host');
    }
    // FUNGSI OTOMATIS REFRESH TOKEN (Panggil ini sebelum panggil API lain)
    private function getFreshToken($shopId)
    {
        // Ambil data token terbaru dari database
        $tokenData = DB::table('shopee_tokens')->where('shop_id', $shopId)->first();

        if (!$tokenData) return null;

        // Cek apakah token sudah berumur lebih dari 3 jam (10800 detik)
        // Kita kasih toleransi 5 menit (berarti cek jika sudah lewat 10500 detik)
        $isExpired = time() > (strtotime($tokenData->updated_at) + 10500);

        if ($isExpired) {
            $path = "/api/v2/auth/access_token/get";
            $timestamp = time();
            $sign = hash_hmac('sha256', $this->partnerId . $path . $timestamp, $this->partnerKey);

            $response = Http::withoutVerifying()->post($this->host . $path . "?partner_id={$this->partnerId}&timestamp=$timestamp&sign=$sign", [
                'refresh_token' => $tokenData->refresh_token,
                'partner_id' => (int)$this->partnerId,
                'shop_id' => (int)$shopId
            ])->json();

            if (isset($response['access_token'])) {
                // Simpan token baru ke database
                DB::table('shopee_tokens')->where('shop_id', $shopId)->update([
                    'access_token' => $response['access_token'],
                    'refresh_token' => $response['refresh_token'],
                    'updated_at' => now()
                ]);

                // Ambil ulang data yang sudah di-update agar tetap berupa Object
                return DB::table('shopee_tokens')->where('shop_id', $shopId)->first();
            }
        }

        // Jika belum expired, kembalikan object yang lama
        return $tokenData;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // 1. Ambil semua toko yang terdaftar di database untuk pilihan di dropdown
        $availableShops = DB::table('shopee_tokens')
            ->select('shop_id', 'shop_name')
            ->where('user_id', Auth::id())
            ->get();

        // 2. Ambil shopId dari URL (?shop_id=...), jika tidak ada pakai default dari .env
        $shopId = $request->query('shop_id', $this->shopId);

        // 3. Ambil token berdasarkan shopId yang dipilih
        // Panggil Service
        $shopeeService = new ShopeeService();
        $token = $shopeeService->refreshShopToken($shopId);

        // Jika toko tidak ditemukan di database
        if (!$token) {
            return Inertia::render('marketplace/index', [
                'orders' => [],
                'shops' => $availableShops,
                'currentShopId' => (string)$shopId
            ]);
        }

        $host = $this->host;
        $timestamp = time();
        // Siapkan Signature
        $partnerId = $this->partnerId;
        $partnerKey = $this->partnerKey;
        $accessToken = $token->access_token;

        $pathList = "/api/v2/order/get_order_list";
        $signList = hash_hmac('sha256', $partnerId . $pathList . $timestamp . $accessToken . $shopId, $partnerKey);

        $resList = Http::withoutVerifying()->get($host . $pathList, [
            'partner_id' => (int)$partnerId,
            'timestamp' => $timestamp,
            'access_token' => $accessToken,
            'shop_id' => (int)$shopId,
            'sign' => $signList,
            'time_range_field' => 'create_time',
            'time_from' => $timestamp - (15 * 24 * 60 * 60),
            'time_to' => $timestamp,
            'page_size' => 20
        ])->body();

        $resList = json_decode($resList, true);

        $orderIds = collect($resList['response']['order_list'] ?? [])->pluck('order_sn')->toArray();

        $finalOrders = [];

        // 3. JIKA ADA ORDER, TARIK DETAILNYA (Agar total_amount muncul)
        if (!empty($orderIds)) {
            $pathDetail = "/api/v2/order/get_order_detail";
            $signDetail = hash_hmac('sha256', $partnerId . $pathDetail . $timestamp . $accessToken . $shopId, $partnerKey);

            $resDetail = Http::withoutVerifying()->get($host . $pathDetail, [
                'partner_id' => (int)$partnerId,
                'timestamp' => $timestamp,
                'access_token' => $accessToken,
                'shop_id' => (int)$shopId,
                'sign' => $signDetail,
                'order_sn_list' => implode(',', $orderIds),
                // PENTING: Minta field tambahan di sini
                'response_optional_fields' => 'buyer_user_id,buyer_username,recipient_address,item_list,logistics_channel,order_status,pay_time,total_amount,tracking_number,payment_method'
            ])->json();

            if (isset($resDetail['response']['order_list'])) {
                foreach ($resDetail['response']['order_list'] as $order) {
                    $this->autoImportToSalesRecord(Auth::id(), $order, $token->shop_name ?? 'Shopee Store');
                    // Jika tracking_number kosong di detail, biarkan tetap ambil dari field itu dulu
                    $resi = $order['tracking_number'] ?? '';

                    // PERBAIKAN LOGIKA RESI: Cek ulang jika status bukan READY_TO_SHIP tapi resi kosong
                    if (empty($resi) && $order['order_status'] !== 'READY_TO_SHIP' && $order['order_status'] !== 'CANCELLED') {
                        $pathResi = "/api/v2/logistics/get_tracking_number";
                        $signResi = hash_hmac('sha256', $partnerId . $pathResi . $timestamp . $accessToken . $shopId, $partnerKey);

                        $resResi = Http::withoutVerifying()->get($host . $pathResi, [
                            'partner_id' => (int)$partnerId,
                            'timestamp' => $timestamp,
                            'access_token' => $accessToken,
                            'shop_id' => (int)$shopId,
                            'sign' => $signResi,
                            'order_sn' => $order['order_sn']
                        ])->json();

                        $resi = $resResi['response']['tracking_number'] ?? 'BELUM ADA RESI';
                    } else if (empty($resi)) {
                        $resi = 'BELUM ADA RESI';
                    }

                    $finalOrders[] = [
                        'id' => $order['order_sn'],
                        'store' => 'Shopee SG',
                        'product' => $order['item_list'][0]['item_name'] ?? 'No Product Name',
                        'variant' => $order['item_list'][0]['model_name'] ?? '-',
                        // Cek apakah key total_amount ada, jika tidak beri 0
                        'price' => ($order['currency'] ?? 'SGD') . ' ' . number_format($order['total_amount'] ?? 0, 2),
                        'quantity' => $order['item_list'][0]['model_quantity_purchased'] ?? 1,
                        'status' => $order['order_status'],
                        'courier' => $order['logistics_channel'] ?? 'Standard Express',
                        'resi' => $resi,
                        'date' => date('d M, H:i', $order['create_time']),
                        'customer' => $order['recipient_address']['name'] ?? ($order['buyer_username'] ?? 'Buyer'),
                        'address' => $order['recipient_address']['full_address'] ?? '-',
                        'phone' => $order['recipient_address']['phone'] ?? '-',
                        'deadline' => date('d M', $order['ship_by_date'] ?? time()),
                        // Field mentah untuk perhitungan JavaScript (Sangat Penting)
                        'deadline_raw' => $order['ship_by_date'] ?? null,
                        // MENGAMBIL DATA ASLI DARI SHOPEE
                        'paymentMethod' => $order['payment_method'] ?? 'Online Payment',
                    ];
                }
            }
        }

        // Hitung statistik berdasarkan status dari array $finalOrders
        $stats = [
            'perlu_diproses' => collect($finalOrders)->whereIn('status', ['READY_TO_SHIP', 'PROCESSED'])->count(),
            'dalam_pengiriman' => collect($finalOrders)->whereIn('status', ['SHIPPED', 'TO_CONFIRM_RECEIVED'])->count(),
            'selesai' => collect($finalOrders)->where('status', 'COMPLETED')->count(),
            'pembatalan' => collect($finalOrders)->where('status', 'CANCELLED')->count(),
        ];

        return Inertia::render('marketplace/index', [
            'orders' => $finalOrders,
            'stats' => $stats,
            'shops' => $availableShops, // Kirim daftar toko
            'currentShopId' => (string)$shopId, // Kirim ID toko yang sedang 
        ]);
    }
    public function shipOrder(Request $request)
    {
        $request->validate([
            'order_sn' => 'required',
            'method' => 'required' // 'pickup' atau 'dropoff'
        ]);

        $orderSn = $request->order_sn; // Kirim dari Frontend
        $shopId = $this->shopId;
        $token = $this->getFreshToken($shopId);

        $host = $this->host;
        $path = "/api/v2/logistics/ship_order";
        $timestamp = time();
        $partnerId = $this->partnerId;
        $partnerKey = $this->partnerKey;

        $sign = hash_hmac('sha256', $partnerId . $path . $timestamp . $token->access_token . $shopId, $partnerKey);

        // Untuk Sandbox SG, biasanya pakai metode 'dropoff' atau 'pickup'
        // Kita coba Dropoff dulu karena paling simple (tidak butuh setup alamat pickup)
        $body = [
            'order_sn' => $orderSn,
            'dropoff' => [
                'branch_id' => 0 // Di sandbox bisa diisi 0
            ]
        ];

        $response = Http::withoutVerifying()
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($host . $path . "?partner_id=$partnerId&timestamp=$timestamp&access_token={$token->access_token}&shop_id=$shopId&sign=$sign", $body)
            ->json();

        if (isset($response['error']) && $response['error'] !== "") {
            return back()->with('error', 'Gagal atur pengiriman: ' . $response['message']);
        }

        return back()->with('success', 'Berhasil atur pengiriman! Silakan refresh untuk cek nomor resi.');
    }
    private function autoImportToSalesRecord($userId, $orderDetail, $shopName)
    {
        // 1. Cek apakah pesanan ini sudah pernah dicatat?
        // $exists = SalesRecord::where('external_order_id', $orderDetail['order_sn'])->exists();
        // if ($exists) return; // Skip jika sudah ada

        // 2. Ambil Data Produk (Shopee item_list bisa banyak, kita loop)
        $items = $orderDetail['item_list'] ?? [];

        // Service Instance
        $transactionService = new TransactionService();

        foreach ($items as $index => $item) {
            // --- FIX ERROR DUPLICATE ENTRY ---
            // Kita buat ID Unik per Item: OrderSN + Index
            // Contoh: 260120H0BV5S94-0, 260120H0BV5S94-1
            $uniqueExternalId = $orderDetail['order_sn'] . '-' . ($index + 1);

            // Cek apakah item spesifik ini sudah ada? Jika ada, skip item ini saja
            if (SalesRecord::where('external_order_id', $uniqueExternalId)->exists()) {
                continue;
            }
            // ---------------------------------
            $productName = $item['item_name'];
            $modelName = $item['model_name'] ?? ''; // Variasi
            $fullName = $productName . ($modelName ? " ($modelName)" : "");
            $qty = $item['model_quantity_purchased'] ?? $item['model_quantity'] ?? 1;
            $sellPrice = $item['model_discounted_price'] ?? $item['model_original_price'];

            // 3. Cari Harga Modal (Buy Price) dari Master Produk
            // Sistem akan mencoba mencari produk dengan nama yang SAMA PERSIS.
            // Jika tidak ketemu, buy_price = 0 (User harus edit nanti untuk isi modal).
            $masterProduct = Product::where('user_id', $userId)
                ->where('name', $fullName) // Usahakan nama di Shopee sama dengan di Master
                ->orWhere('name', $productName) // Coba cari tanpa variasi
                ->first();

            $buyPrice = $masterProduct ? $masterProduct->last_price : 0;

            // 4. Estimasi Potongan (Fee)
            // Shopee API v2 Order Detail punya field `escrow_tax` atau `estimated_shipping_fee`.
            // Tapi fee detail biasanya baru muncul setelah pesanan selesai (escrow details).
            // Untuk saat ini, kita pakai DEFAULT Fee dari Toko yang sudah diset di `StoreController`.

            // Cari Toko lokal berdasarkan nama toko Shopee
            $localStore = Store::where('user_id', $userId)->where('name', $shopName)->first();
            $adminFeePercent = $localStore ? $localStore->default_admin_fee : 6.0; // Default 6% jika tidak ketemu
            $promoFeePercent = $localStore ? $localStore->default_promo_fee : 0;
            $flatFee = $localStore ? $localStore->default_process_fee : 0;

            // 5. Simpan Transaksi via Service
            $transactionService->recordTransaction($userId, [
                'store_id' => $localStore ? $localStore->id : $shopName, // Service akan handle jika string
                'store_name' => $shopName, // Kirim nama toko untuk jaga-jaga create baru
                'created_at' => date('Y-m-d H:i:s', $orderDetail['create_time']),
                'product_name' => $fullName, // Nama produk dari Shopee
                'qty' => $qty,
                'buy_price' => $buyPrice, // Otomatis dari master atau 0
                'sell_price' => $sellPrice, // Dari Shopee
                'marketplace_fee_percent' => $adminFeePercent,
                'promo_extra_percent' => $promoFeePercent,
                'marketplace_name' => 'Shopee',
                'shipping_cost' => 0, // Biasanya seller tidak nanggung ongkir kecuali free shipping max
                'flat_fees' => $flatFee,
                'extra_costs' => 0, // Iklan dll susah dilacak per transaksi API Order
                'external_order_id' => $uniqueExternalId, // KUNCI AGAR TIDAK DUPLIKAT
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
    public function store(Request $request)
    {
        //
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
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
