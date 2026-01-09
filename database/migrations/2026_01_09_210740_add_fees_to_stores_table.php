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
        Schema::table('stores', function (Blueprint $table) {
            $table->decimal('default_admin_fee', 5, 2)->default(0)->after('slug');
            $table->decimal('default_promo_fee', 5, 2)->default(0)->after('default_admin_fee');
            $table->bigInteger('default_process_fee')->default(0)->after('default_promo_fee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('default_admin_fee');
            $table->dropColumn('default_promo_fee');
            $table->dropColumn('default_process_fee');
        });
    }
};
