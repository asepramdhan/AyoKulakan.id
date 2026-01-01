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
        // 1. Bersihkan format harga (Cegah error jika input mengandung titik/koma)
        $request->merge([
            'buy_price' => (float) str_replace(['.', ','], '', (string)$request->buy_price),
            'sell_price' => (float) str_replace(['.', ','], '', (string)$request->sell_price),
            'shipping_cost' => (float) str_replace(['.', ','], '', (string)$request->shipping_cost ?? 0),
            'flat_fees' => (float) str_replace(['.', ','], '', (string)$request->flat_fees ?? 0),
            'extra_costs' => (float) str_replace(['.', ','], '', (string)$request->extra_costs ?? 0),
        ]);

        // 2. Validasi Lengkap
        $validated = $request->validate([
            'product_name'            => 'required|string',
            'qty'                     => 'required|integer|min:1', // Pastikan Qty ada
            'buy_price'               => 'required|numeric|min:0',
            'sell_price'              => 'required|numeric|min:0',
            'marketplace_fee_percent' => 'required|numeric|min:0',
            'promo_extra_percent'     => 'required|numeric',
            'marketplace_name'        => 'required|string',
            'shipping_cost'           => 'nullable|numeric',
            'flat_fees'               => 'nullable|numeric',
            'extra_costs'             => 'nullable|numeric',
        ]);

        // 3. Kalkulasi Profit yang Akurat dengan Qty
        $quantity = $validated['qty'];
        $totalSellPrice = $validated['sell_price'] * $quantity;
        $totalBuyPrice = $validated['buy_price'] * $quantity;

        // Admin Fee dihitung dari Total Harga Jual
        $adminFee = ($totalSellPrice * $validated['marketplace_fee_percent']) / 100;

        // Total potongan (Biaya tetap biasanya per resi/transaksi)
        $totalPotongan = $adminFee + ($validated['flat_fees'] ?? 0) + ($validated['extra_costs'] ?? 0);

        // Profit = (Total Jual - Total Modal) - Potongan - Ongkir (jika ditanggung seller)
        $profit = $totalSellPrice - $totalBuyPrice - $totalPotongan - ($validated['shipping_cost'] ?? 0);

        $totalPercent = (float)$validated['marketplace_fee_percent'] + (float)$validated['promo_extra_percent'];
        $totalSellPrice = $validated['sell_price'] * $quantity;

        // Hitung potongan persen (Admin + Promo Extra)
        $percentageFee = ($totalSellPrice * $totalPercent) / 100;

        // Total potongan = Biaya Persen + Biaya Flat + Biaya Lainnya
        $totalPotongan = $percentageFee + ($validated['flat_fees'] ?? 0) + ($validated['extra_costs'] ?? 0);

        // Profit
        $profit = $totalSellPrice - ($validated['buy_price'] * $quantity) - $totalPotongan - ($validated['shipping_cost'] ?? 0);

        try {
            DB::transaction(function () use ($validated, $profit, $quantity) {
                // Update harga terakhir produk (selalu gunakan harga satuan untuk master produk)
                Product::updateOrCreate(
                    ['user_id' => Auth::id(), 'name' => $validated['product_name']],
                    ['last_price' => $validated['buy_price']]
                );

                // Simpan data transaksi
                SalesRecord::create([
                    'user_id'                 => Auth::id(),
                    'product_name'            => $validated['product_name'],
                    'qty'                     => $quantity, // Pastikan kolom qty ada di table sales_records
                    'buy_price'               => $validated['buy_price'],
                    'sell_price'              => $validated['sell_price'],
                    'marketplace_fee_percent' => $validated['marketplace_fee_percent'],
                    'promo_extra_percent'     => $validated['promo_extra_percent'],
                    'marketplace_name'        => $validated['marketplace_name'],
                    'shipping_cost'           => $validated['shipping_cost'] ?? 0,
                    'flat_fees'               => $validated['flat_fees'] ?? 0,
                    'extra_costs'             => $validated['extra_costs'] ?? 0,
                    'profit'                  => $profit,
                ]);
            });

            return back()->with('message', 'Data penjualan berhasil disimpan!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal: ' . $e->getMessage()]);
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
        // 1. Pembersihan format harga (sama seperti store)
        $request->merge([
            'buy_price' => (float) str_replace(['.', ','], '', (string)$request->buy_price),
            'sell_price' => (float) str_replace(['.', ','], '', (string)$request->sell_price),
            'shipping_cost' => (float) str_replace(['.', ','], '', (string)$request->shipping_cost),
            'flat_fees' => (float) str_replace(['.', ','], '', (string)$request->flat_fees),
            'extra_costs' => (float) str_replace(['.', ','], '', (string)$request->extra_costs),
        ]);

        // 2. Validasi Lengkap
        $validated = $request->validate([
            'product_name'            => 'required|string',
            'qty'                     => 'required|integer|min:1', // Pastikan Qty ada
            'buy_price'               => 'required|numeric|min:0',
            'sell_price'              => 'required|numeric|min:0',
            'marketplace_fee_percent' => 'required|numeric|min:0',
            'promo_extra_percent'     => 'required|numeric',
            'marketplace_name'        => 'required|string',
            'shipping_cost'           => 'nullable|numeric',
            'flat_fees'               => 'nullable|numeric',
            'extra_costs'             => 'nullable|numeric',
        ]);

        $record = SalesRecord::findOrFail($id);

        // 2. Kalkulasi ulang profit
        $totalPercent = $validated['marketplace_fee_percent'] + $validated['promo_extra_percent'];
        $totalSell = $validated['sell_price'] * $validated['qty'];
        $totalPotongan = ($totalSell * $totalPercent / 100) + $validated['flat_fees'] + $validated['extra_costs'];
        $profit = $totalSell - ($validated['buy_price'] * $validated['qty']) - $totalPotongan - ($validated['shipping_cost'] ?? 0);

        // 3. Update data
        $record->update(array_merge($validated, ['profit' => $profit]));

        return back()->with('message', 'Data berhasil diperbarui!');
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
