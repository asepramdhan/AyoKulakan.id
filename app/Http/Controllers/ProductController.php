<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::with('store')
            ->where('user_id', Auth::id());

        // Filter jika ada store_id di request
        if ($request->has('store_id') && $request->store_id != '') {
            $query->where('store_id', $request->store_id);
        }

        $products = $query->orderBy('name', 'asc')->get();
        $stores = Store::where('user_id', Auth::id())->get();

        return Inertia::render('products/index', [
            'products' => $products,
            'stores' => $stores,
            'filters' => $request->only(['store_id']) // Kirim balik status filter ke UI
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
            'product' => $product
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        // 1. Validasi data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'last_price' => 'required', // Kita validasi string dulu karena ada titiknya
        ]);

        // 2. Bersihkan titik dari harga sebelum disimpan
        // str_replace akan mengubah "15.000" menjadi "15000"
        $validated['last_price'] = (int) str_replace('.', '', $request->last_price);

        // 3. Update produk dengan data yang sudah dibersihkan
        $product->update($validated);

        // 4. Kembali dengan pesan sukses
        return to_route('products.index')->with('message', 'Produk berhasil diperbarui');
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
        return back()->with('message', 'Produk berhasil dihapus');
    }
}
