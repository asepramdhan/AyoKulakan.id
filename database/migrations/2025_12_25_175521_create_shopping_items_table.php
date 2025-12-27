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
        Schema::create('shopping_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shopping_list_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');
            $table->string('product_name_snapshot'); // Menyimpan nama produk saat itu (jika produk asli dihapus, history tetap ada)
            $table->integer('quantity');
            $table->decimal('price_per_unit', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->boolean('is_bought')->default(false); // Untuk checklist saat belanja di toko
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopping_items');
    }
};
