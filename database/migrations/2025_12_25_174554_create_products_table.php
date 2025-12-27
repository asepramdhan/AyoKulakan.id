<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            // Kita hubungkan ke store_id agar user bisa memisahkan produk per toko
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('category')->nullable(); // Misal: Pakan Kering, Aksesoris
            $table->decimal('last_price', 15, 2)->default(0); // Harga terakhir beli (untuk referensi)
            $table->integer('stock_warning')->default(0); // Batas minimal stok untuk pengingat
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
