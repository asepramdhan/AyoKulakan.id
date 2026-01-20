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
        $partnerId = $this->partnerId; // ID terbaru kamu
        $baseUrl = "https://open.sandbox.test-stable.shopee.com/auth";

        // Gunakan root domain sesuai yang kamu whitelist di Console Shopee
        $redirectUri = $this->callbackUrl;

        $queryParams = http_build_query([
            'auth_type'    => 'seller',
            'partner_id'   => $partnerId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
        ]);

        return redirect()->away($baseUrl . "?" . $queryParams);
    }

    public function getAccessToken(Request $request)
    {
        $code = $request->query('code');
        $shopId = (int) $request->query('shop_id');
        if (!$code) return "Menunggu callback...";

        // 1. Ambil Access Token
        $path = "/api/v2/auth/token/get";
        $timestamp = time();
        $sign = hash_hmac('sha256', $this->partnerId . $path . $timestamp, $this->partnerKey);

        $url = "{$this->host}{$path}?partner_id={$this->partnerId}&timestamp={$timestamp}&sign={$sign}";

        $response = Http::withoutVerifying()->post($url, [
            "code" => $code,
            "shop_id" => $shopId,
            "partner_id" => $this->partnerId
        ]);

        $res = $response->json();

        if (isset($res['access_token'])) {
            $accessToken = $res['access_token'];
            $actualShopId = (int)$res['shop_id_list'][0];
            $shopName = "Toko " . $actualShopId; // Fallback

            // 2. AMBIL INFO TOKO (Signature harus pakai Access Token & Shop ID)
            $pathShop = "/api/v2/shop/get_shop_info";

            // PENTING: Perhatikan urutan baseString untuk API Shop level:
            // partner_id + path + timestamp + access_token + shop_id
            $baseStringShop = $this->partnerId . $pathShop . $timestamp . $accessToken . $actualShopId;
            $signShop = hash_hmac('sha256', $baseStringShop, $this->partnerKey);

            $resShop = Http::withoutVerifying()->get("{$this->host}{$pathShop}", [
                'partner_id'   => (int)$this->partnerId,
                'timestamp'    => $timestamp,
                'access_token' => $accessToken,
                'shop_id'      => $actualShopId,
                'sign'         => $signShop,
            ])->json();

            // Debugging: Jika masih gagal, aktifkan dd di bawah ini untuk melihat error dari Shopee
            // dd($resShop); 

            if (isset($resShop['shop_name'])) {
                $shopName = $resShop['shop_name'];
            }

            // 3. SIMPAN KE DATABASE
            DB::table('shopee_tokens')->updateOrInsert(
                ['shop_id' => $actualShopId],
                [
                    'shop_name'     => $shopName,
                    'user_id'       => Auth::id(),
                    'partner_id'    => $this->partnerId,
                    'access_token'  => $accessToken,
                    'refresh_token' => $res['refresh_token'],
                    'expire_in'     => $res['expire_in'],
                    'updated_at'    => now()
                ]
            );

            // return response()->json([
            //     'status'  => 'success',
            //     'message' => "Toko $shopName berhasil terhubung!",
            //     'shop_info_raw' => $resShop // Untuk memastikan kamu lihat hasil dari Shopee
            // ]);

            return to_route('sales-record.index', ['shop_id' => $actualShopId]);
        }

        return $response->json();
    }
}
