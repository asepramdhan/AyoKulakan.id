<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ShoppingListController;
use App\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('shopping', ShoppingListController::class);
    Route::get('/shopping/{id}/check', [ShoppingListController::class, 'check'])->name('shopping.check');
    Route::post('/shopping-item/{id}/toggle', [ShoppingListController::class, 'toggleItem'])->name('shopping.item.toggle');

    Route::get('/shopping/{id}/export', [ShoppingListController::class, 'exportTxt'])->name('shopping.export');

    Route::resource('products', ProductController::class);
    Route::resource('stores', StoreController::class);
});

require __DIR__ . '/settings.php';
