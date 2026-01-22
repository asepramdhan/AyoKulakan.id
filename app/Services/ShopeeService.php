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

    // Sign: partner_id + path + timestamp
    $baseString = sprintf("%s%s%s", $partnerId, $path, $timestamp);
    $sign = hash_hmac('sha256', $baseString, $partnerKey);

    $url = sprintf("%s%s?partner_id=%s&timestamp=%s&sign=%s", $host, $path, $partnerId, $timestamp, $sign);

    $response = Http::withoutVerifying()->post($url, [
      'refresh_token' => $tokenData->refresh_token,
      'partner_id' => $partnerId,
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
