<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supply extends Model
{
    protected $guarded = ['id'];

    public function reduceStock($qtySold)
    {
        // Jika tipe per_transaction, kurangi 1 saja (misal 1 resi)
        // Jika tipe per_item, kurangi sebanyak jumlah barang yang dibeli
        $amountToReduce = ($this->reduction_type === 'per_transaction') ? 1 : $qtySold;

        $newStock = $this->current_stock - $amountToReduce;

        // Simpan ke tabel history
        $this->histories()->create([
            'amount' => -$amountToReduce, // Simpan sebagai angka negatif
            'stock_after' => $newStock,
            'note' => 'Penjualan', // Bisa ditambah ID Transaksi jika perlu
        ]);

        // Update stok saat ini
        $this->update(['current_stock' => $newStock]);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(SupplyHistory::class);
    }
}
