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
            $shoppingList = DB::transaction(function () use ($validated) {
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
                            'last_price' => $item['price']
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

            return to_route('shopping.index')->with('message', 'Daftar belanja berhasil disimpan!');
        } catch (\Exception $e) {
            return back()->withErrors(['items' => 'Terjadi kesalahan sistem saat menyimpan data.']);
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
        $list = $shoppingList->findOrFail($id);

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
    public function update(Request $request, ShoppingList $shoppingList)
    {
        if ($shoppingList->user_id !== Auth::id()) abort(403);

        // Format harga agar titik ribuan hilang sebelum validasi
        $items = $request->items;
        foreach ($items as $key => $item) {
            if (isset($item['price']) && is_string($item['price'])) {
                $items[$key]['price'] = (float) str_replace(['.', ','], '', $item['price']);
            }
        }
        $request->merge(['items' => $items]);

        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'title' => 'required|string|max:255',
            'shopping_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $shoppingList) {
            // 1. Update data utama
            $shoppingList->update([
                'store_id' => $validated['store_id'],
                'title' => $validated['title'],
                'shopping_date' => $validated['shopping_date'],
            ]);

            // 2. Hapus item lama, ganti dengan yang baru (cara paling bersih)
            $shoppingList->items()->delete();

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $subtotal = $item['quantity'] * $item['price'];
                $totalAmount += $subtotal;

                // Cari/Buat Produk & Update harga terakhir
                $product = Product::firstOrCreate(
                    ['user_id' => Auth::id(), 'name' => $item['product_name']],
                    ['store_id' => $validated['store_id'], 'last_price' => $item['price']]
                );
                $product->update(['last_price' => $item['price']]);

                $shoppingList->items()->create([
                    'product_id' => $product->id,
                    'product_name_snapshot' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'price_per_unit' => $item['price'],
                    'subtotal' => $subtotal,
                ]);
            }

            $shoppingList->update(['total_estimated_price' => $totalAmount]);
        });

        return to_route('shopping.index')->with('message', 'Daftar belanja berhasil diperbarui!');
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

        return back()->with('delete', 'Riwayat belanja berhasil dihapus.');
    }

    public function check($id)
    {
        $list = ShoppingList::with(['items', 'store'])->findOrFail($id);

        return Inertia::render('shopping/check', [
            'shoppingList' => $list
        ]);
    }

    public function toggleItem($itemId)
    {
        // 1. Cari item yang dimaksud
        $item = ShoppingItem::findOrFail($itemId);

        // 2. Toggle status is_bought
        $item->update([
            'is_bought' => !$item->is_bought
        ]);

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
}
