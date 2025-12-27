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
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        //
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
