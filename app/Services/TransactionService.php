<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SalesRecord;
use App\Models\Store;
use App\Models\Supply;
use App\Models\SupplyHistory;
use Illuminate\Support\Facades\DB;

class TransactionService
{
  /**
   * Mencatat transaksi baru (Sales Record) dan mengupdate stok terkait.
   */
  public function recordTransaction($userId, array $data)
  {
    return DB::transaction(function () use ($userId, $data) {
      // 1. Pastikan Toko Ada
      $storeId = $data['store_id'];
      if (!is_numeric($storeId)) {
        $store = Store::firstOrCreate(
          ['user_id' => $userId, 'name' => $data['store_name']],
          [
            'default_admin_fee' => 0,
            'default_promo_fee' => 0,
            'default_process_fee' => 0
          ]
        );
        $storeId = $store->id;
      }

      // 2. Kalkulasi Profit
      $quantity = $data['qty'];
      $buyPrice = $data['buy_price'];
      $sellPrice = $data['sell_price'];

      $totalSellPrice = $sellPrice * $quantity;
      $totalBuyPrice = $buyPrice * $quantity;

      $totalPercent = ($data['marketplace_fee_percent'] ?? 0) + ($data['promo_extra_percent'] ?? 0);
      $percentageFee = ($totalSellPrice * $totalPercent) / 100;

      $flatFees = $data['flat_fees'] ?? 0;
      $extraCosts = $data['extra_costs'] ?? 0;
      $shippingCost = $data['shipping_cost'] ?? 0;

      $totalPotongan = $percentageFee + $flatFees + $extraCosts;
      $profit = $totalSellPrice - $totalBuyPrice - $totalPotongan - $shippingCost;

      // 3. Update Master Produk
      $product = Product::where('user_id', $userId)
        ->where('name', $data['product_name'])
        ->first();

      if ($product) {
        $product->update([
          'last_price'      => $buyPrice,
          'last_sell_price' => $sellPrice,
          'stock'           => $product->stock - $quantity
        ]);
      } else {
        $product = Product::create([
          'user_id'         => $userId,
          'store_id'        => $storeId,
          'name'            => $data['product_name'],
          'last_price'      => $buyPrice,
          'last_sell_price' => $sellPrice,
          'stock'           => -$quantity,
          'stock_warning'   => 5
        ]);
      }

      // 4. Simpan Sales Record
      $salesRecord = SalesRecord::create([
        'user_id'                 => $userId,
        'created_at'              => $data['created_at'] ?? now(),
        'product_name'            => $data['product_name'],
        'qty'                     => $quantity,
        'buy_price'               => $buyPrice,
        'sell_price'              => $sellPrice,
        'marketplace_fee_percent' => $data['marketplace_fee_percent'] ?? 0,
        'promo_extra_percent'     => $data['promo_extra_percent'] ?? 0,
        'store_id'                => $storeId,
        'marketplace_name'        => $data['marketplace_name'] ?? 'Shopee',
        'shipping_cost'           => $shippingCost,
        'flat_fees'               => $flatFees,
        'extra_costs'             => $extraCosts,
        'profit'                  => $profit,
        'external_order_id'       => $data['external_order_id'] ?? null,
      ]);

      // 5. Potong Bahan Operasional (Multiple Supply Support)
      $this->deductSupplies($userId, $product, $quantity, $data['product_name']);

      return $salesRecord;
    });
  }

  /**
   * Logika pemotongan stok bahan operasional
   */
  private function deductSupplies($userId, $product, $qty, $productName)
  {
    // 1. Cek Supply apa saja yang DIATUR KHUSUS di produk ini (Packing Rules)
    $productSpecificSupplyIds = [];
    if ($product) {
      $productSpecificSupplyIds = DB::table('product_packagings')
        ->where('product_id', $product->id)
        ->pluck('supply_id')
        ->toArray();
    }

    // 2. A. Potong bahan 'per_transaction' GLOBAL (Seperti Resi/Thermal/Lakban)
    // FIX: Kecualikan (Exclude) supply yang sudah terdaftar di aturan produk
    // Supaya Plastik Packing (yang statusnya per_transaction) tidak ikut terpotong di sini.
    $transactionSupplies = Supply::where('user_id', $userId)
      ->where('reduction_type', 'per_transaction')
      ->whereNotIn('id', $productSpecificSupplyIds) // <--- INI KUNCI PERBAIKANNYA
      ->get();

    foreach ($transactionSupplies as $s) {
      $s->decrement('current_stock');
      SupplyHistory::create([
        'supply_id'   => $s->id,
        'amount'      => -1,
        'stock_after' => $s->current_stock,
        'note'        => 'Auto Global: ' . $productName,
      ]);
    }

    // 3. B. Potong Supply Terikat Produk (Sesuai Aturan Min/Max)
    if ($product) {
      // Ambil supply yang COCOK dengan Qty
      $matchingSupplies = $this->getMatchingSupplyRules($product->id, $qty);

      foreach ($matchingSupplies as $rule) {
        $pSupply = Supply::where('id', $rule->supply_id)
          ->where('user_id', $userId)
          ->lockForUpdate()
          ->first();

        if ($pSupply) {
          $deductionAmount = 1;

          // Jika supply 'per_item' (Plastik PP), kurangi sejumlah Qty
          if ($pSupply->reduction_type === 'per_item') {
            $deductionAmount = $qty;
          }

          $pSupply->decrement('current_stock', $deductionAmount);

          SupplyHistory::create([
            'supply_id'   => $pSupply->id,
            'amount'      => -1 * $deductionAmount,
            'stock_after' => $pSupply->current_stock,
            'note'        => 'Auto Rule: ' . $pSupply->name . ' (Order: ' . $qty . ')',
          ]);
        }
      }
    }
  }

  /**
   * Helper: Mencari SEMUA aturan packing yang cocok dengan Qty
   * Mengembalikan Collection (Daftar), bukan single value.
   */
  private function getMatchingSupplyRules($productId, $qty)
  {
    return DB::table('product_packagings')
      ->where('product_id', $productId)
      // Cek Batas Bawah
      ->where('min_qty', '<=', $qty)
      // Cek Batas Atas (Harus >= Qty ATAU Null/Tak Terbatas)
      ->where(function ($query) use ($qty) {
        $query->where('max_qty', '>=', $qty)
          ->orWhereNull('max_qty');
      })
      ->get(); // PENTING: Pakai get() untuk ambil semua, bukan value/first
  }
}
