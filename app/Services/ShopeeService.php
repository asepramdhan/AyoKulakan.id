<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ShopeeService
{
  public function refreshShopToken($shopId)
  {
    $tokenData = DB::table('shopee_tokens')->where('shop_id', $shopId)->first();
    if (!$tokenData) return null;

    $partnerId = config('services.shopee.partner_id');
    $partnerKey = config('services.shopee.partner_key');
    $host = config('services.shopee.host');

    $path = "/api/v2/auth/access_token/get";
    $timestamp = time();
    $sign = hash_hmac('sha256', $partnerId . $path . $timestamp, $partnerKey);

    $response = Http::withoutVerifying()->post($host . $path . "?partner_id={$partnerId}&timestamp=$timestamp&sign=$sign", [
      'refresh_token' => $tokenData->refresh_token,
      'partner_id' => (int)$partnerId,
      'shop_id' => (int)$shopId
    ])->json();

    if (isset($response['access_token'])) {
      DB::table('shopee_tokens')->where('shop_id', $shopId)->update([
        'access_token' => $response['access_token'],
        'refresh_token' => $response['refresh_token'],
        'updated_at' => now()
      ]);
      return DB::table('shopee_tokens')->where('shop_id', $shopId)->first();
    }

    return null;
  }
}
