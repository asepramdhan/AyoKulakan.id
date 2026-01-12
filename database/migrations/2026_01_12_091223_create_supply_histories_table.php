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
        Schema::create('supply_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supply_id')->constrained()->onDelete('cascade');
            $table->integer('amount'); // Jumlah masuk (+) atau keluar (-)
            $table->integer('stock_after'); // Stok setelah kejadian
            $table->string('note'); // Contoh: "Restok", "Penjualan #123", dll
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supply_histories');
    }
};
