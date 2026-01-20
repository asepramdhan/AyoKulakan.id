<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SalesRecord;
use App\Models\Store;
use App\Models\Supply;
use App\Models\SupplyHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionService
{
  /**
   * Mencatat transaksi baru (Sales Record) dan mengupdate stok terkait.
   * * @param int $userId ID User pemilik data
   * @param array $data Data transaksi yang sudah divalidasi/dibersihkan
   * @return SalesRecord
   */
  public function recordTransaction($userId, array $data)
  {
    return DB::transaction(function () use ($userId, $data) {
      // 1. Pastikan Toko Ada (Jika dari Shopee, nama tokonya mungkin string)
      // Jika input manual, store_id sudah integer ID.
      $storeId = $data['store_id'];
      if (!is_numeric($storeId)) {
        // Cari atau buat toko jika nama toko dikirim (kasus Shopee)
        $store = Store::firstOrCreate(
          ['user_id' => $userId, 'name' => $data['store_name']],
          [
            'default_admin_fee' => 0, // Default nilai jika baru dibuat
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

      // Perhitungan biaya
      $totalSellPrice = $sellPrice * $quantity;
      $totalBuyPrice = $buyPrice * $quantity;

      // Fee Persentase (Admin + Promo)
      $totalPercent = ($data['marketplace_fee_percent'] ?? 0) + ($data['promo_extra_percent'] ?? 0);
      $percentageFee = ($totalSellPrice * $totalPercent) / 100;

      // Total Potongan
      $flatFees = $data['flat_fees'] ?? 0;
      $extraCosts = $data['extra_costs'] ?? 0;
      $shippingCost = $data['shipping_cost'] ?? 0;

      $totalPotongan = $percentageFee + $flatFees + $extraCosts;

      // Profit Bersih
      $profit = $totalSellPrice - $totalBuyPrice - $totalPotongan - $shippingCost;

      // 3. Update/Create Master Produk & Potong Stok Produk
      // Cari produk berdasarkan nama dan user_id
      $product = Product::where('user_id', $userId)
        ->where('name', $data['product_name'])
        ->first();

      if ($product) {
        // Update harga terakhir & potong stok
        $product->update([
          'last_price'      => $buyPrice,
          'last_sell_price' => $sellPrice,
          'stock'           => $product->stock - $quantity
        ]);
      } else {
        // Buat produk baru jika belum ada (Stok jadi minus)
        $product = Product::create([
          'user_id'         => $userId,
          'store_id'        => $storeId,
          'name'            => $data['product_name'],
          'last_price'      => $buyPrice,
          'last_sell_price' => $sellPrice,
          'stock'           => -$quantity, // Minus karena belum ada stok awal
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
        // Simpan ID pesanan asli dari marketplace agar tidak duplikat
        'external_order_id'       => $data['external_order_id'] ?? null,
      ]);

      // 5. Potong Bahan Operasional (Supply)
      $this->deductSupplies($userId, $product, $quantity, $data['product_name']);

      return $salesRecord;
    });
  }

  /**
   * Logika pemotongan stok bahan operasional (Kertas Resi & Plastik)
   */
  private function deductSupplies($userId, $product, $qty, $productName)
  {
    // A. Potong bahan 'per_transaction' (Kertas Thermal/Resi)
    // Logika: 1 Transaksi = 1 Resi.
    // TODO: Jika 1 pesanan terdiri dari banyak produk, harusnya resi cuma 1. 
    // Ini perlu penanganan khusus (misal cek apakah external_order_id sudah pernah diproses supplies-nya).
    // Untuk simplifikasi saat ini, kita anggap setiap record mengurangi 1 resi (bisa disesuaikan nanti).

    $transactionSupplies = Supply::where('user_id', $userId)
      ->where('reduction_type', 'per_transaction')
      ->get();

    foreach ($transactionSupplies as $s) {
      $newStock = $s->current_stock - 1;
      $s->update(['current_stock' => $newStock]);

      SupplyHistory::create([
        'supply_id'   => $s->id,
        'amount'      => -1,
        'stock_after' => $newStock,
        'note'        => 'Auto Penjualan: ' . $productName,
      ]);
    }

    // B. Potong Plastik Packing (Berdasarkan Qty Produk)
    if ($product) {
      $supplyId = $this->getAppropriateSupplyId($product->id, $qty);

      if ($supplyId) {
        $pSupply = Supply::where('id', $supplyId)
          ->where('user_id', $userId)
          ->first();

        if ($pSupply) {
          $newStockP = $pSupply->current_stock - 1; // Asumsi 1 jenis produk dalam qty berapapun pakai 1 plastik, ATAU sesuaikan logikanya
          // Jika 10 pcs pakai 1 plastik besar, logic ini benar.
          // Jika 10 pcs pakai 10 plastik kecil, ubah -1 jadi -$qty.
          // Berdasarkan kode awalmu: $newStockP = $pSupply->current_stock - 1; (berarti logicnya per batch produk)

          $pSupply->update(['current_stock' => $newStockP]);

          SupplyHistory::create([
            'supply_id'   => $pSupply->id,
            'amount'      => -1,
            'stock_after' => $newStockP,
            'note'        => 'Auto Packing: ' . $productName . ' (Qty: ' . $qty . ')',
          ]);
        }
      }
    }
  }

  private function getAppropriateSupplyId($productId, $qty)
  {
    return DB::table('product_packagings')
      ->where('product_id', $productId)
      ->where('min_qty', '<=', $qty)
      ->where(function ($query) use ($qty) {
        $query->where('max_qty', '>=', $qty)
          ->orWhereNull('max_qty');
      })
      ->value('supply_id');
  }
}
