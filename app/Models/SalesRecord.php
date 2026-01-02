<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesRecord extends Model
{
    protected $guarded = ['id'];

    // Tambahkan relasi agar bisa panggil nama toko dengan mudah
    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
