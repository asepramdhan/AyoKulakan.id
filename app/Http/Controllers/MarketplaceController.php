<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
        $token = $this->getFreshToken($shopId);

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
                'response_optional_fields' => 'buyer_user_id,buyer_username,recipient_address,item_list,logistics_channel,order_status,pay_time,total_amount,tracking_number'
            ])->json();

            if (isset($resDetail['response']['order_list'])) {
                foreach ($resDetail['response']['order_list'] as $order) {
                    // Jika tracking_number kosong di detail, biarkan tetap ambil dari field itu dulu
                    $resi = $order['tracking_number'] ?? '';

                    // LOGIKA CADANGAN: Jika resi masih kosong, kita tidak menyerah
                    if (empty($resi)) {
                        $pathResi = "/api/v2/logistics/get_tracking_number";
                        $signResi = hash_hmac('sha256', $partnerId . $pathResi . $timestamp . $token->access_token . $shopId, $partnerKey);

                        $resResi = Http::withoutVerifying()->get($host . $pathResi, [
                            'partner_id' => (int)$partnerId,
                            'timestamp' => $timestamp,
                            'access_token' => $token->access_token,
                            'shop_id' => (int)$shopId,
                            'sign' => $signResi,
                            'order_sn' => $order['order_sn']
                        ])->json();

                        $resi = $resResi['response']['tracking_number'] ?? 'BELUM ADA RESI';
                    }

                    $finalOrders[] = [
                        'id' => $order['order_sn'],
                        'store' => 'Shopee SG',
                        'product' => $order['item_list'][0]['item_name'] ?? 'No Product Name',
                        'variant' => $order['item_list'][0]['model_name'] ?? '-',
                        // Cek apakah key total_amount ada, jika tidak beri 0
                        'price' => ($order['currency'] ?? 'SGD') . ' ' . number_format($order['total_amount'] ?? 0, 2),
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
                        'paymentMethod' => 'LUNAS',
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
            'currentShopId' => (string)$shopId // Kirim ID toko yang sedang aktif
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
