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
        Schema::create('supplies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Kertas Thermal, Plastik Packing, Lakban
            $table->integer('current_stock'); // Stok saat ini (misal 500 lembar / 500 plastik)
            $table->integer('initial_stock'); // Stok awal untuk hitung persentase
            $table->integer('min_stock_alert'); // Batas minimal (misal 50) untuk notifikasi
            $table->enum('reduction_type', ['per_transaction', 'per_item']); // Cara berkurangnya
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplies');
    }
};
