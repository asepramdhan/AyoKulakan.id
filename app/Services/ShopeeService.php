<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ShopeeService
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
  public function refreshShopToken($shopId)
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
}
