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
        Schema::table('sales_records', function (Blueprint $table) {
            $table->string('external_order_id')->nullable()->unique()->after('id'); // ID Pesanan Shopee (sn)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_records', function (Blueprint $table) {
            $table->dropColumn('external_order_id');
        });
    }
};
