<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first(); // Pastikan kamu sudah register 1 user

        $stores = [
            ['name' => 'MeowMeal.id', 'slug' => 'meowmeal-id'],
            ['name' => 'KicauMeal.id', 'slug' => 'kicaumeal-id'],
            ['name' => 'FishyMeal.id', 'slug' => 'fishymeal-id'],
        ];

        foreach ($stores as $store) {
            Store::create([
                'user_id' => $user->id,
                'name' => $store['name'],
                'slug' => $store['slug'],
            ]);
        }
    }
}
