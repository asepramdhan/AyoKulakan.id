<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ShoppingItem;
use App\Models\ShoppingList;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

use function Symfony\Component\String\b;

class ShoppingListController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $shoppingLists = ShoppingList::with('store')
            ->where('user_id', Auth::id())
            ->withCount('items') // Ini akan menghasilkan 'items_count'
            ->withCount(['items as completed_items_count' => function ($query) {
                $query->where('is_bought', true);
            }])
            // Menghitung total harga yang sudah diceklis
            ->withSum(['items as total_bought_price' => function ($query) {
                $query->where('is_bought', true);
            }], 'subtotal')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Ambil toko milik user yang sedang login
        $stores = Store::where('user_id', Auth::id())->get();

        return Inertia::render('shopping/index', [
            'products' => Auth::user()->products, // Kirim daftar produk milik user
            'shoppingLists' => $shoppingLists,
            'stores' => $stores
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // dd('create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Bersihkan data price dari titik jika seandainya terkirim sebagai string berformat
        $items = $request->items;
        foreach ($items as $key => $item) {
            if (isset($item['price']) && is_string($item['price'])) {
                $items[$key]['price'] = (float) str_replace(['.', ','], '', $item['price']);
            }
        }
        $request->merge(['items' => $items]);

        // 1. Validasi Input
        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'title' => 'required|string|max:255',
            'shopping_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        try {
            // 2. Gunakan Transaction (Wajib diaktifkan agar aman)
            DB::transaction(function () use ($validated) {
                // Buat Induk
                $list = ShoppingList::create([
                    'user_id' => Auth::id(),
                    'store_id' => $validated['store_id'],
                    'title' => $validated['title'],
                    'shopping_date' => $validated['shopping_date'],
                    'total_estimated_price' => 0,
                    'status' => 'draft',
                ]);

                $totalAmount = 0;

                foreach ($validated['items'] as $item) {
                    // Konversi harga ke integer murni untuk membuang desimal
                    $pricePerUnit = (float) $item['price'];
                    $qty = (int) $item['quantity'];
                    $subtotal = $qty * $pricePerUnit;

                    $totalAmount += $subtotal;

                    // Cari atau buat produk
                    $product = Product::firstOrCreate(
                        [
                            'user_id' => Auth::id(),
                            'name' => $item['product_name'],
                        ],
                        [
                            'store_id' => $validated['store_id'],
                            'last_price' => $item['price'],
                            'stock' => 0, // Produk baru mulai dari 0, nanti bertambah saat di-check
                            'stock_warning' => 5 // Default warning
                        ]
                    );

                    // Simpan Item
                    $list->items()->create([
                        'product_id' => $product->id,
                        'product_name_snapshot' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'price_per_unit' => $item['price'],
                        'subtotal' => $subtotal,
                    ]);

                    // Update harga terakhir di tabel products jika ID produk diketahui
                    if (!empty($item['product_id']) || $product->wasRecentlyCreated) {
                        $product->update(['last_price' => $item['price']]);
                    }
                }

                // 3. Update total harga setelah looping selesai
                $list->update(['total_estimated_price' => $totalAmount]);

                return $list;
            });

            return back();
        } catch (\Exception $e) {
            return back();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ShoppingList $shoppingList)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ShoppingList $shoppingList, $id)
    {
        $list = $shoppingList->findOrFail($id)->load('items');

        return Inertia::render('shopping/edit', [
            'store' => $list->store,
            'stores' => Store::where('user_id', Auth::id())->get(),
            'products' => Auth::user()->products,
            'list' => $list
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $shoppingList = ShoppingList::findOrFail($id);

        // 1. Bersihkan format harga (hilangkan titik ribuan)
        $items = $request->items;
        foreach ($items as $key => $item) {
            if (isset($item['price'])) {
                $items[$key]['price'] = (float) str_replace(['.', ','], '', (string)$item['price']);
            }
        }
        $request->merge(['items' => $items]);

        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'title' => 'required|string|max:255',
            'shopping_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $shoppingList) {
            // 2. Update data induk
            $shoppingList->update([
                'store_id' => $validated['store_id'],
                'title' => $validated['title'],
                'shopping_date' => $validated['shopping_date'],
            ]);

            $totalAmount = 0;
            $keptItemIds = []; // Untuk mencatat item mana saja yang masih ada

            foreach ($validated['items'] as $itemData) {
                $subtotal = $itemData['quantity'] * $itemData['price'];
                $totalAmount += $subtotal;

                // Cari atau buat produk di master data
                $product = Product::updateOrCreate(
                    ['user_id' => Auth::id(), 'name' => $itemData['product_name']],
                    [
                        'store_id' => $validated['store_id'],
                        'last_price' => $itemData['price'],
                        'stock' => 0, // Produk baru mulai dari 0, nanti bertambah saat di-check
                        'stock_warning' => 5 // Default warning
                    ]
                );

                // LOGIKA SYNC ITEM:
                // Coba cari apakah barang dengan nama yang sama sudah ada di list ini
                $existingItem = $shoppingList->items()
                    ->where('product_name_snapshot', $itemData['product_name'])
                    ->first();

                if ($existingItem) {
                    // Jika ADA, update saja (status is_bought tetap terjaga)
                    $existingItem->update([
                        'product_id' => $product->id,
                        'quantity' => $itemData['quantity'],
                        'price_per_unit' => $itemData['price'],
                        'subtotal' => $subtotal,
                    ]);
                    $keptItemIds[] = $existingItem->id;
                } else {
                    // Jika TIDAK ADA, buat baru
                    $newItem = $shoppingList->items()->create([
                        'product_id' => $product->id,
                        'product_name_snapshot' => $itemData['product_name'],
                        'quantity' => $itemData['quantity'],
                        'price_per_unit' => $itemData['price'],
                        'subtotal' => $subtotal,
                        'is_bought' => false // Barang baru default belum dibeli
                    ]);
                    $keptItemIds[] = $newItem->id;
                }
            }

            // 3. HAPUS item yang tidak ada lagi di form (user menghapus baris di UI)
            $shoppingList->items()->whereNotIn('id', $keptItemIds)->delete();

            // 4. Update total harga di tabel induk
            $shoppingList->update(['total_estimated_price' => $totalAmount]);

            // --- LOGIKA UPDATE STATUS DI SINI ---
            // 1. Ambil data items terbaru setelah sinkronisasi
            $items = $shoppingList->items()->get();
            $totalItems = $items->count();
            $boughtItems = $items->where('is_bought', true)->count();

            // 2. Tentukan status baru
            // Jika semua barang sudah diceklis, status = completed. Jika belum, status = draft.
            $newStatus = ($totalItems > 0 && $boughtItems === $totalItems) ? 'completed' : 'draft';

            // 3. Update total harga DAN status sekaligus
            $shoppingList->update([
                'total_estimated_price' => $totalAmount,
                'status' => $newStatus
            ]);
        });

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ShoppingList $shoppingList, $id)
    {
        $list = $shoppingList->findOrFail($id);

        DB::transaction(function () use ($list) {
            // Hapus item-itemnya dulu (jika tidak pakai cascade delete di database)
            $list->items()->delete();
            $list->delete();
        });

        return back();
    }

    public function check($id)
    {
        $list = ShoppingList::with(['items', 'store'])->findOrFail($id);

        // Ambil daftar lain yang statusnya masih draft
        $otherLists = ShoppingList::with(['store'])
            ->where('user_id', Auth::id())
            ->where('status', 'draft')
            ->where('id', '!=', $id) // Kecuali yang sedang dibuka
            ->withCount('items')
            ->withCount(['items as completed_items_count' => function ($q) {
                $q->where('is_bought', true);
            }])
            // Tambahkan ini untuk menghitung total uang estimasi (semua item)
            ->withSum('items as total_estimated_price', 'subtotal')
            // Tambahkan ini untuk menghitung total uang yang sudah dibeli (is_bought = true)
            ->withSum(['items as total_bought_price' => function ($q) {
                $q->where('is_bought', true);
            }], 'subtotal')
            ->latest()
            ->get();

        return Inertia::render('shopping/check', [
            'shoppingList' => $list,
            'otherLists' => $otherLists
        ]);
    }

    public function toggleItem($itemId)
    {
        // 1. Cari item yang dimaksud
        $item = ShoppingItem::findOrFail($itemId);

        $previousStatus = $item->is_bought;

        // 2. Toggle status is_bought
        $item->update([
            'is_bought' => !$item->is_bought
        ]);

        // --- LOGIKA UPDATE STOK MASTER ---
        // Cari produk di master data berdasarkan product_id
        $product = Product::find($item->product_id);

        if ($product) {
            if ($item->is_bought && !$previousStatus) {
                // JIKA: Baru saja diceklis (is_bought jadi true)
                // MAKA: Tambah stok di master produk
                $product->increment('stock', $item->quantity);
            } elseif (!$item->is_bought && $previousStatus) {
                // JIKA: Ceklis dibatalkan (is_bought jadi false)
                // MAKA: Kurangi kembali stok di master produk (koreksi)
                $product->decrement('stock', $item->quantity);
            }
        }
        // ---------------------------------

        // 3. Ambil Shopping List terkait
        $shoppingList = ShoppingList::with('items')->find($item->shopping_list_id);

        // 4. Hitung apakah semua item sudah dibeli
        $totalItems = $shoppingList->items->count();
        $boughtItems = $shoppingList->items->where('is_bought', true)->count();

        // 5. Update status Shopping List secara otomatis
        if ($boughtItems === $totalItems) {
            $shoppingList->update(['status' => 'completed']);
        } else {
            // Jika ada yang belum diceklis, kembali ke draft (atau status lain yang kamu mau)
            $shoppingList->update(['status' => 'draft']);
        }

        return back();
    }

    public function exportTxt($id)
    {
        $list = ShoppingList::with(['items', 'store'])->findOrFail($id);

        $filename = "Note_Belanja_" . str_replace(' ', '_', $list->store->name) . "_" . $list->shopping_date . ".txt";

        $content = "============================== <br/>";
        $content .= "      AYOKULAKAN DAFTAR BELANJA       <br/>";
        $content .= "============================== <br/>";
        $content .= "Toko    : " . Str::title($list->store->name) . "<br/>";
        $content .= "Judul   : " . Str::title($list->title) . "<br/>";
        $content .= "Tanggal : " . $list->shopping_date . "<br/>";
        $content .= "------------------------------ <br/>";
        $content .= sprintf("%-15s %-3s <br/>", "Barang |", "Qty");
        $content .= "------------------------------ <br/>";

        foreach ($list->items as $item) {
            $content .= sprintf(
                "%-15s %-3d <br/>",
                Str::title($item->product_name_snapshot) . ":",
                $item->quantity,
            );
        }

        $content .= "------------------------------ <br/>";
        $content .= "TOTAL ESTIMASI: Rp " . number_format($list->total_estimated_price, 0, ',', '.') . "<br/>";
        $content .= "============================== <br/>";
        $content .= "Generated by AyoKulakan.id <br/>";

        return response($content)
            ->withHeaders([
                'Content-Type' => 'text/plain',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
    }

    // Halaman Sedang Berjalan
    public function activeLists()
    {
        $lists = ShoppingList::with(['store', 'items'])
            ->where('user_id', Auth::id())
            ->where('status', 'draft') // Filter hanya yang belum selesai
            ->withCount('items')
            ->withCount(['items as completed_items_count' => function ($q) {
                $q->where('is_bought', true);
            }])
            ->withSum('items as total_estimated_price', 'subtotal')
            ->withSum(['items as total_bought_price' => function ($q) {
                $q->where('is_bought', true);
            }], 'subtotal')
            ->latest()
            ->get();

        return Inertia::render('shopping/active', [
            'lists' => $lists
        ]);
    }

    // Halaman Riwayat
    public function historyLists()
    {
        $lists = ShoppingList::with(['store'])
            ->where('user_id', Auth::id())
            ->where('status', 'completed')
            ->withCount('items')
            ->withSum(['items as total_price' => function ($q) {
                $q->where('is_bought', true);
            }], 'subtotal')
            ->latest('shopping_date')
            ->simplePaginate(50); // Ambil agak banyak di awal agar search enak

        return Inertia::render('shopping/history', [
            'lists' => $lists
        ]);
    }

    public function duplicate(ShoppingList $shoppingList)
    {
        // 1. Duplikasi data utama Shopping List
        $newList = $shoppingList->replicate();
        $newList->title = $shoppingList->title . ' (Copy)';
        $newList->status = 'draft'; // Set ke aktif kembali
        $newList->shopping_date = now(); // Set tanggal ke hari ini
        $newList->save();

        // 2. Duplikasi semua item di dalamnya
        foreach ($shoppingList->items as $item) {
            $newItem = $item->replicate();
            $newItem->shopping_list_id = $newList->id;
            $newItem->is_bought = false; // Reset status belanja
            $newItem->save();
        }

        // 3. Update total estimasi pada list baru (jika diperlukan)
        $newList->update([
            'total_estimated_price' => $newList->items()->sum('subtotal')
        ]);

        return to_route('shopping.active')->with('message', 'Daftar berhasil diduplikasi!');
    }
}
