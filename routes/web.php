<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MarginAnalysisController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SalesRecordController;
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
    Route::get('/shopping/active', [ShoppingListController::class, 'activeLists'])->name('shopping.active');
    Route::get('/shopping/history', [ShoppingListController::class, 'historyLists'])->name('shopping.history');

    Route::get('/shopping/{id}/check', [ShoppingListController::class, 'check'])->name('shopping.check');
    Route::post('/shopping-item/{id}/toggle', [ShoppingListController::class, 'toggleItem'])->name('shopping.item.toggle');

    Route::get('/shopping/{id}/export', [ShoppingListController::class, 'exportTxt'])->name('shopping.export');

    Route::post('/shopping/{shoppingList}/duplicate', [ShoppingListController::class, 'duplicate'])
        ->name('shopping.duplicate');

    route::get('/analysis/margin', [MarginAnalysisController::class, 'index'])->name('analysis.margin.index');
    route::patch('/analysis/margin/{id}/update-price', [MarginAnalysisController::class, 'updatePrice'])
        ->name('analysis.margin.update-price');

    Route::resource('shopping', ShoppingListController::class);
    Route::resource('products', ProductController::class);
    Route::resource('stores', StoreController::class);
    Route::resource('sales-record', SalesRecordController::class);
});

require __DIR__ . '/settings.php';
