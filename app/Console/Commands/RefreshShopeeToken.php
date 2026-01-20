<?php

namespace App\Console\Commands;

use App\Http\Controllers\MarketplaceController;
use App\Services\ShopeeService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RefreshShopeeToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shopee:refresh-token';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $service = new ShopeeService();
        $shops = DB::table('shopee_tokens')->get();

        foreach ($shops as $shop) {
            $this->info("Refreshing: {$shop->shop_name}");
            $service->refreshShopToken($shop->shop_id);
        }

        $this->info("Semua token berhasil diperbarui.");
    }
}
