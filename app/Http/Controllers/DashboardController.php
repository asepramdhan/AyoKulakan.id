<?php

namespace App\Http\Controllers;

use App\Models\ShoppingItem;
use App\Models\ShoppingList;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();
        $today = now()->today();
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        // 1. Ringkasan Pengeluaran (Harian, Mingguan, Bulanan)
        $summary = [
            'daily' => ShoppingList::where('user_id', $userId)
                ->where('status', 'completed') // Tambahkan ini
                ->whereDate('shopping_date', $today)
                ->sum('total_estimated_price'),

            'weekly' => ShoppingList::where('user_id', $userId)
                ->where('status', 'completed') // Tambahkan ini
                ->whereBetween('shopping_date', [$startOfWeek, now()])
                ->sum('total_estimated_price'),

            'monthly' => ShoppingList::where('user_id', $userId)
                ->where('status', 'completed') // Tambahkan ini
                ->whereMonth('shopping_date', now()->month)
                ->whereYear('shopping_date', now()->year)
                ->sum('total_estimated_price'),
        ];

        // 2. Data Pengeluaran per Toko (Tetap Bulanan)
        $statsPerToko = Store::where('user_id', $userId)
            ->withSum(['shoppingLists as pengeluaran' => function ($query) {
                $query->where('status', 'completed') // Tambahkan ini
                    ->whereMonth('shopping_date', now()->month)
                    ->whereYear('shopping_date', now()->year);
            }], 'total_estimated_price')
            ->get()
            // Opsional: urutkan dari pengeluaran terbesar
            ->sortByDesc('pengeluaran')
            ->values();

        // 3. Toko Teraktif (Sepanjang Masa/Bulan Ini)
        $mostActiveStore = Store::where('user_id', $userId)
            ->withCount(['shoppingLists' => function ($query) {
                $query->whereMonth('shopping_date', now()->month)
                    ->whereYear('shopping_date', now()->year);
            }])
            ->orderBy('shopping_lists_count', 'desc')
            ->first();

        // 4. Barang Terpopuler
        $topProducts = ShoppingItem::query()
            ->select('product_name_snapshot', DB::raw('COUNT(*) as total_bought'))
            ->where('is_bought', true) // Hanya barang yang diceklis
            ->whereHas('shoppingList', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->where('status', 'completed'); // Dari daftar yang sudah selesai
            })
            ->groupBy('product_name_snapshot')
            ->orderBy('total_bought', 'desc')
            ->limit(5)
            ->get();

        $status = $request->query('status'); // Mengambil 'ongoing' atau 'completed'

        $query = ShoppingList::with('store')->where('user_id', Auth::id());

        // Jika ada parameter status, filter datanya
        if ($status) {
            $query->where('status', $status);
        }

        // Ambil 5 daftar belanja terbaru beserta nama tokonya
        $recentLists = ShoppingList::with('store')
            ->where('user_id', $userId)
            ->latest() // Mengurutkan berdasarkan yang terbaru dibuat
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'summary' => $summary,
                'per_store' => $statsPerToko,
                'top_products' => $topProducts,
                'most_active_store' => $mostActiveStore,
                'recent_lists' => $recentLists,
            ]
        ]);
    }
}
