<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class ShopeeController extends Controller
{
    private $partnerId;
    private $partnerKey;
    private $host;
    private $callbackUrl;

    public function __construct()
    {
        // Pastikan Partner ID di-cast ke Integer (PENTING untuk Signature)
        $this->partnerId = (int) config('services.shopee.partner_id');
        $this->partnerKey = config('services.shopee.partner_key');

        // Hapus slash di akhir host agar tidak double slash nanti
        $this->host = rtrim(config('services.shopee.host'), '/');

        $this->callbackUrl = config('services.shopee.callback_url');
    }

    /**
     * PERBAIKAN: Fungsi Redirect Wajib Pakai Signature (V2)
     */
    public function redirect()
    {
        $path = "/api/v2/shop/auth_partner"; // Path Resmi V2
        $timestamp = time();

        // 1. Buat Signature Base String
        // Rumus: partner_id + path + timestamp
        $baseString = sprintf("%s%s%s", $this->partnerId, $path, $timestamp);

        // 2. Enkripsi dengan Partner Key
        $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

        // 3. Susun URL Akhir
        // Perhatikan: Parameternya 'redirect', BUKAN 'redirect_uri'
        $url = sprintf(
            "%s%s?partner_id=%s&timestamp=%s&sign=%s&redirect=%s",
            $this->host,
            $path,
            $this->partnerId,
            $timestamp,
            $sign,
            $this->callbackUrl
        );

        // Redirect User ke Shopee
        return redirect()->away($url);
    }

    public function getAccessToken(Request $request)
    {
        $code = $request->query('code');
        $shopId = (int) $request->query('shop_id');

        if (!$code) return to_route('sales-record.index')->with('error', 'Gagal: Code tidak ditemukan.');

        // --- 1. Ambil Access Token ---
        $path = "/api/v2/auth/token/get";
        $timestamp = time();

        // Sign untuk Token: partner_id + path + timestamp
        $baseString = sprintf("%s%s%s", $this->partnerId, $path, $timestamp);
        $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

        $url = sprintf("%s%s?partner_id=%s&timestamp=%s&sign=%s", $this->host, $path, $this->partnerId, $timestamp, $sign);

        $response = Http::withoutVerifying()->post($url, [
            "code" => $code,
            "shop_id" => $shopId,
            "partner_id" => $this->partnerId
        ]);

        $res = $response->json();

        // Cek Error dari Shopee
        if (isset($res['error'])) {
            return to_route('sales-record.index')->with('error', 'Shopee Error: ' . ($res['message'] ?? 'Unknown'));
        }

        if (isset($res['access_token'])) {
            $accessToken = $res['access_token'];
            $actualShopId = (int)$res['shop_id_list'][0];
            $shopName = "Toko " . $actualShopId;

            // --- 2. Ambil Info Toko (Opsional) ---
            $pathShop = "/api/v2/shop/get_shop_info";

            // Sign untuk Shop Info: partner_id + path + timestamp + access_token + shop_id
            $baseStringShop = sprintf("%s%s%s%s%s", $this->partnerId, $pathShop, $timestamp, $accessToken, $actualShopId);
            $signShop = hash_hmac('sha256', $baseStringShop, $this->partnerKey);

            $resShop = Http::withoutVerifying()->get("{$this->host}{$pathShop}", [
                'partner_id'   => $this->partnerId,
                'timestamp'    => $timestamp,
                'access_token' => $accessToken,
                'shop_id'      => $actualShopId,
                'sign'         => $signShop,
            ])->json();

            if (isset($resShop['shop_name'])) {
                $shopName = $resShop['shop_name'];
            }

            // --- 3. Simpan ke Database ---
            // --- BAGIAN INI KITA UBAH UNTUK DEBUGGING ---
            try {
                // Cek apakah user login terdeteksi?
                $userId = Auth::id();

                if (!$userId) {
                    // Jika null, kita paksa error biar ketahuan
                    dd("ERROR FATAL: Sesi Login Hilang! User ID tidak terdeteksi saat callback.");
                }

                DB::table('shopee_tokens')->updateOrInsert(
                    ['shop_id' => $actualShopId],
                    [
                        'shop_name'     => $shopName,
                        'user_id'       => $userId,
                        'partner_id'    => $this->partnerId,
                        'access_token'  => $accessToken,
                        'refresh_token' => $res['refresh_token'],
                        'expire_in'     => $res['expire_in'],
                        'updated_at'    => now()
                    ]
                );

                // Jika berhasil lewat sini
                return to_route('sales-record.index')->with('success', "Berhasil! Toko $shopName disimpan.");
            } catch (\Exception $e) {
                // Tampilkan error database yang sebenarnya di layar
                dd("ERROR DATABASE GAGAL SIMPAN:", $e->getMessage());
            }
        }

        return to_route('sales-record.index')->with('error', 'Gagal mendapatkan akses token.');
    }
}
