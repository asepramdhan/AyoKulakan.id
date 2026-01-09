<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Matikan pengecekan foreign key agar tidak dicegat database
        Schema::disableForeignKeyConstraints();

        // 2. Hapus foreign key secara manual lewat SQL (agar tidak error jika nama tidak cocok)
        // Kita bungkus dalam try-catch supaya kalau gagal dia tetap lanjut
        try {
            DB::statement('ALTER TABLE sales_records DROP FOREIGN KEY sales_records_store_id_foreign');
        } catch (\Exception $e) {
        }

        try {
            DB::statement('ALTER TABLE sales_records DROP INDEX sales_records_store_id_foreign');
        } catch (\Exception $e) {
        }

        // 3. Modifikasi kolom dan buat foreign key baru dengan CASCADE
        Schema::table('sales_records', function (Blueprint $table) {
            // Pastikan kolom store_id tipenya cocok dan nullable
            $table->unsignedBigInteger('store_id')->nullable()->change();

            // Buat foreign key baru
            $table->foreign('store_id')
                ->references('id')
                ->on('stores')
                ->onDelete('cascade');
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::table('sales_records', function (Blueprint $table) {
            $table->dropForeign(['store_id']);
            $table->foreign('store_id')
                ->references('id')
                ->on('stores')
                ->onDelete('set null');
        });
    }
};
