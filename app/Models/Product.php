<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $guarded = ['id'];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Relasi ke item daftar belanja
     */
    public function shopping_list_items(): HasMany
    {
        // Pastikan nama model 'ShoppingListItem' sesuai dengan yang Anda punya
        // Dan pastikan di tabel shopping_list_items ada kolom 'product_id'
        return $this->hasMany(ShoppingItem::class);
    }
    // Relasi ke model ProductPackaging
    public function packagings(): HasMany
    {
        return $this->hasMany(ProductPackaging::class);
    }
}
