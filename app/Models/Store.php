<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str; // <--- Pastikan import ini ada

class Store extends Model
{
    protected $guarded = ['id'];
    // --- TAMBAHKAN KODE INI ---
    protected static function booted()
    {
        static::creating(function ($store) {
            // Jika slug kosong, otomatis buat dari nama toko
            if (empty($store->slug)) {
                $store->slug = Str::slug($store->name);
            }
        });
    }
    // --- SAMPAI SINI ---
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function shoppingLists(): HasMany
    {
        return $this->hasMany(ShoppingList::class);
    }
}
