<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MarginAnalysisController extends Controller
{
    public function index()
    {
        // Ambil produk dengan harga terakhirnya
        $products = Product::where('user_id', Auth::id())
            ->with('store')
            ->get()
            ->map(function ($product) {
                $adminFeePercent = 6;
                $sellPrice = (float) $product->last_sell_price;
                $buyPrice = (float) $product->last_price;

                $adminFeeAmount = ($sellPrice * $adminFeePercent) / 100;
                $netProfit = $sellPrice - $buyPrice - $adminFeeAmount;

                $marginPercent = $sellPrice > 0 ? ($netProfit / $sellPrice) * 100 : 0;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'store_name' => $product->store?->name,
                    'buy_price' => $buyPrice,
                    'sell_price' => $sellPrice,
                    'stock' => (int) $product->stock, // <--- TAMBAHKAN INI AGAR REACT BISA MENGHITUNG
                    'admin_fee_percent' => $adminFeePercent,
                    'admin_fee_amount' => $adminFeeAmount,
                    'net_profit' => $netProfit,
                    'margin_percent' => round($marginPercent, 2),
                    'status' => $marginPercent < 10 ? 'Tipis' : ($marginPercent < 20 ? 'Sehat' : 'Sangat Bagus'),
                ];
            });

        return Inertia::render('analysis/margin', [
            'analysisData' => $products
        ]);
    }

    public function updatePrice(Request $request, $id)
    {
        // dd($request->all());
        $validated = $request->validate([
            'sell_price' => 'required|numeric|min:0'
        ]);
        $product = Product::where('user_id', Auth::id())->findOrFail($id);
        $product->update([
            'last_sell_price' => $validated['sell_price']
        ]);

        return back()->with('message', "Harga jual {$product->name} berhasil diperbarui!");
    }
}
