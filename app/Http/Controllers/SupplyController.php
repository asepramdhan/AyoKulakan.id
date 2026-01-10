<?php

namespace App\Http\Controllers;

use App\Models\Supply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SupplyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $supplies = Supply::where('user_id', Auth::id())->get();

        return Inertia::render('supplies/index', [
            'supplyData' => $supplies
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
        // 1. Validasi Input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'initial_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'reduction_type' => 'required|in:per_transaction,per_item',
            'min_stock_alert' => 'nullable|integer|min:0',
        ]);

        // 2. Simpan ke Database
        Supply::create([
            'user_id' => Auth::id(), // Simpan berdasarkan user yang login
            'name' => $validated['name'],
            'initial_stock' => $validated['initial_stock'],
            // Saat baru buat, stok sekarang sama dengan stok awal
            'current_stock' => $validated['initial_stock'],
            'unit' => $validated['unit'],
            'reduction_type' => $validated['reduction_type'],
            'min_stock_alert' => $request->min_stock_alert ?? 10,
        ]);

        // 3. Kembali
        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Supply $supply)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Supply $supply)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        // 1. Validasi Input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'initial_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'reduction_type' => 'required|in:per_transaction,per_item',
            'min_stock_alert' => 'nullable|integer|min:0',
        ]);

        // 2. Simpan ke Database
        Supply::where('id', $id)->where('user_id', Auth::id())->update([
            'name' => $validated['name'],
            'initial_stock' => $validated['initial_stock'],
            'unit' => $validated['unit'],
            'reduction_type' => $validated['reduction_type'],
            'min_stock_alert' => $request->min_stock_alert ?? 10,
        ]);

        // 3. Kembali
        return back();
    }

    // Metode untuk menambah stok
    public function restock(Request $request, Supply $supply)
    {
        dd($request->all());
        if ($supply->user_id !== Auth::id()) abort(403);

        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
        ]);

        $newStock = $supply->current_stock + $validated['amount'];

        $supply->update([
            'current_stock' => $newStock,
            // Kita update initial_stock juga agar persentase sisa stok kembali akurat
            'initial_stock' => $newStock,
        ]);

        return back();
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        Supply::where('id', $id)->where('user_id', Auth::id())->delete();
        return back();
    }
}
