<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShoppingList extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'shopping_date' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ShoppingItem::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
