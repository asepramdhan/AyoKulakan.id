<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPackaging extends Model
{
    protected $guarded = ['id'];
    // Relasi ke model Supply
    public function supply(): BelongsTo
    {
        // Hubungkan supply_id di tabel ini ke id di tabel supplies
        return $this->belongsTo(Supply::class, 'supply_id');
    }
    // Relasi ke model Product
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
