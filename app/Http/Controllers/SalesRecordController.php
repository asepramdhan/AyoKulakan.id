<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\SalesRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('sales/index', [
            'products' => Auth::user()->products,
            'salesRecords' => SalesRecord::latest()->get(),
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
        // 1. Bersihkan format harga dari titik ribuan sebelum Validasi
        $request->merge([
            'buy_price' => (float) str_replace(['.', ','], '', (string)$request->buy_price),
            'sell_price' => (float) str_replace(['.', ','], '', (string)$request->sell_price),
            'shipping_cost' => $request->shipping_cost
                ? (float) str_replace(['.', ','], '', (string)$request->shipping_cost)
                : 0,
        ]);

        // 2. Validasi (Sekarang data sudah bersih/numeric)
        $validated = $request->validate([
            'product_name'            => 'required|string',
            'buy_price'               => 'required|numeric|min:0',
            'sell_price'              => 'required|numeric|min:0',
            'marketplace_fee_percent' => 'required|numeric|min:0',
            'marketplace_name'        => 'required|string',
            'shipping_cost'           => 'nullable|numeric',
        ]);

        // 3. Kalkulasi Profit (Menggunakan data yang sudah divalidasi)
        $fee = ($validated['sell_price'] * $validated['marketplace_fee_percent']) / 100;
        $profit = $validated['sell_price'] - $validated['buy_price'] - $fee - ($validated['shipping_cost'] ?? 0);

        try {
            DB::transaction(function () use ($validated, $profit) {
                // 4. Update harga di master produk
                Product::updateOrCreate(
                    [
                        'user_id' => Auth::id(),
                        'name'    => $validated['product_name']
                    ],
                    [
                        'last_price' => $validated['buy_price']
                    ]
                );

                // 5. Simpan ke Sales Record
                SalesRecord::create([
                    'user_id'                 => Auth::id(), // Pastikan simpan user_id-nya
                    'product_name'            => $validated['product_name'],
                    'buy_price'               => $validated['buy_price'],
                    'sell_price'              => $validated['sell_price'],
                    'marketplace_fee_percent' => $validated['marketplace_fee_percent'],
                    'marketplace_name'        => $validated['marketplace_name'],
                    'shipping_cost'           => $validated['shipping_cost'] ?? 0,
                    'profit'                  => $profit,
                ]);
            });

            return back()->with('message', 'Data penjualan berhasil disimpan!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // 1. Cari datanya
        $sales = SalesRecord::findOrFail($id);

        // 2. Hapus datanya
        $sales->delete();

        return back()->with('message', 'Data penjualan berhasil dihapus!');
    }
}
