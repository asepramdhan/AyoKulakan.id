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
            $table->integer('qty')->default(1)->after('sell_price');
            // Biaya tetap seperti Biaya Proses & Promo XTRA
            $table->decimal('promo_extra_percent', 5, 2)->default(0)->after('marketplace_fee_percent');
            $table->decimal('flat_fees', 15, 2)->default(0)->after('shipping_cost');
            // Biaya variabel seperti Iklan atau Affiliate
            $table->decimal('extra_costs', 15, 2)->default(0)->after('flat_fees');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_records', function (Blueprint $table) {
            $table->dropColumn(['qty', 'promo_extra_percent', 'flat_fees', 'extra_costs']);
        });
    }
};
