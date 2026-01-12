<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Store;
use App\Models\Supply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::with(['store', 'packagings.supply'])
            ->where('user_id', Auth::id())
            // --- TAMBAHKAN LOGIC INI ---
            ->withCount(['shopping_list_items as active_shopping_items_count' => function ($query) {
                $query->whereHas('shoppingList', function ($q) {
                    // Pastikan status 'active' sesuai dengan enum/string status di tabel shopping_lists Anda
                    // GANTI 'active' MENJADI 'draft' sesuai migrasi Anda
                    $q->where('status', 'draft');
                });
            }])
            ->withSum(['shopping_list_items as active_shopping_items_sum_quantity' => function ($query) {
                $query->whereHas('shoppingList', function ($q) {
                    $q->where('status', 'draft');
                });
            }], 'quantity');
        // ---------------------------

        // Filter jika ada store_id di request
        if ($request->has('store_id') && $request->store_id != '') {
            $query->where('store_id', $request->store_id);
        }

        $products = $query->orderBy('name', 'asc')->get();
        $stores = Store::where('user_id', Auth::id())->get();
        return Inertia::render('products/index', [
            'products' => $products,
            'stores' => $stores,
            'filters' => $request->only(['store_id'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        return Inertia::render('products/edit', [
            'product' => $product->load('packagings'),
            // Filter di sini: Hanya ambil yang BUKAN per_transaction
            'supplies' => Supply::where('user_id', Auth::id())
                ->where('reduction_type', 'per_item') // Hanya tampilkan plastik
                ->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        // 1. Validasi data (disesuaikan dengan array packagings)
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'last_price' => 'required',
            'packagings' => 'required|array|min:1',
            'packagings.*.supply_id' => 'required|exists:supplies,id',
            'packagings.*.min_qty' => 'required|integer|min:1',
            'packagings.*.max_qty' => 'nullable|integer|min:1',
        ]);

        // 2. Bersihkan titik dari harga
        $price = (int) str_replace('.', '', $request->last_price);

        // 3. Gunakan DB Transaction agar update produk & packing sinkron
        DB::transaction(function () use ($product, $validated, $price) {
            // Update data utama produk
            $product->update([
                'name' => $validated['name'],
                'last_price' => $price,
            ]);

            // Hapus aturan packing lama
            $product->packagings()->delete();

            // Simpan aturan packing baru
            foreach ($validated['packagings'] as $pack) {
                $product->packagings()->create([
                    'supply_id' => $pack['supply_id'],
                    'min_qty'   => $pack['min_qty'],
                    'max_qty'   => $pack['max_qty'] ?: null, // Ubah string kosong jadi null
                ]);
            }
        });

        return to_route('products.index');
    }

    public function adjustStock(Request $request, $id)
    {
        $request->validate([
            'actual_stock' => 'required|integer|min:0',
            'reason' => 'required|string|max:255',
        ]);

        $product = Product::findOrFail($id);

        // Hitung selisih untuk pesan notifikasi
        $diff = $request->actual_stock - $product->stock;
        $status = $diff >= 0 ? "bertambah" : "berkurang";

        // Update stok
        $product->update([
            'stock' => $request->actual_stock
        ]);

        // Berikan response kembali ke Inertia
        return back()->with('message', "Stok {$product->name} berhasil diupdate. Selisih: {$diff} ({$status})");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        Product::where('id', $product->id)->where('user_id', Auth::id())->delete();
        return back();
    }
}
