<?php

use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin', function () {
    return view('admin');
});

Route::post('/login', [SessionController::class, 'store'])
    ->middleware('throttle:login');

Route::post('/logout', [SessionController::class, 'destroy'])
    ->middleware(['auth', 'admin']);
