<?php

use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
Route::post('/login',[SessionController::class,'store'])
->middleware('throttle:login');
Route::post('/logout',[SessionController::class,'destroy'])
->middleware(['auth','admin']);
Route::get('/test-admin',function(){
    return 'Admin Access granted';
})->middleware(['admin']);
Route::get('/test-web-session', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'session_id' => $request->session()->getId(),
        'authenticated' => auth()->check(),
        'user' => $request->user(),
    ]);
});
Route::get('/debug-auth', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'session_id' => $request->session()->getId(),
        'authenticated' => auth()->check(),
        'user_id' => auth()->id(),
        'user' => $request->user(),
    ]);
});
