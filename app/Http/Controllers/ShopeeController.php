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
        $this->partnerId = config('services.shopee.partner_id');
        $this->partnerKey = config('services.shopee.partner_key');
        $this->host = config('services.shopee.host');
        $this->callbackUrl = config('services.shopee.callback_url');
    }
    // Kredensial (Sebaiknya simpan di .env, tapi saya taruh sini biar kamu gampang tes)
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
        $shopId = $request->query('shop_id');
        $mainAccountId = $request->query('main_account_id'); // Ambil ini juga

        if (!$code) return "Menunggu callback...";
        // 1. Ambil Access Token
        $path = "/api/v2/auth/token/get";
        $timestamp = time();
        $sign = hash_hmac('sha256', $this->partnerId . $path . $timestamp, $this->partnerKey);
        $url = "{$this->host}{$path}?partner_id={$this->partnerId}&timestamp={$timestamp}&sign={$sign}";
        // Susun Body secara dinamis
        $body = [
            "code" => $code,
            "partner_id" => (int)$this->partnerId
        ];

        if ($mainAccountId) {
            $body["main_account_id"] = (int)$mainAccountId;
        } else {
            $body["shop_id"] = (int)$shopId;
        }

        $response = Http::withoutVerifying()->post($url, $body);
        $res = $response->json();

        if (isset($res['access_token'])) {
            // Jika main_account_id digunakan, shop_id_list akan berisi banyak ID (ID dan MY)
            $shopIds = $res['shop_id_list'] ?? [$shopId];

            foreach ($shopIds as $idToko) {
                // Simpan atau update token untuk setiap toko yang ditemukan
                DB::table('shopee_tokens')->updateOrInsert(
                    ['shop_id' => $idToko],
                    [
                        'user_id'       => Auth::id(),
                        'partner_id'    => $this->partnerId,
                        'access_token'  => $res['access_token'],
                        'refresh_token' => $res['refresh_token'],
                        'expire_in'     => $res['expire_in'],
                        'updated_at'    => now()
                    ]
                );
            }

            return to_route('sales-record.index');
        }

        return $response->json();
    }
}
