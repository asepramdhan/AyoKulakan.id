<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StoreController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('stores/index', [
            'stores' => Auth::user()->stores
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
        // bersihkan dulu untuk data input default_process_fee agar angkanya murni
        $request->merge([
            'default_process_fee' => (float) str_replace(['.', ','], '', (string)$request->default_process_fee ?? 0),
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'default_admin_fee' => 'nullable|numeric',
            'default_promo_fee' => 'nullable|numeric',
            'default_process_fee' => 'nullable|numeric',
        ]);

        Auth::user()->stores()->create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'default_admin_fee' => $request->default_admin_fee ?? 0,
            'default_promo_fee' => $request->default_promo_fee ?? 0,
            'default_process_fee' => $request->default_process_fee ?? 0,
        ]);

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Store $store)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Store $store)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Store $store)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Store $store)
    {
        $store->delete();
        return back()->with('message', 'Toko berhasil dihapus');
    }
}
