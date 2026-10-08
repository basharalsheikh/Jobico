<?php

use App\Http\Controllers\Api\V1\Public\SiteController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\Api\V1\Public\PageController;
use App\Http\Controllers\Api\V1\Public\HomeController;
use App\Http\Controllers\Api\V1\Public\ProjectController;
use App\Http\Controllers\Api\V1\Public\ContactController;
use App\Http\Controllers\Api\V1\Public\ProjectCategoryController;
use App\Http\Controllers\Api\V1\Public\MediaController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Get the general website settings
    Route::get('/site', [SiteController::class, 'index']);

    // Get a public page by its slug
    Route::get('/pages/{slug}', [PageController::class, 'show']);

    // Get all data required for the public home page
    Route::get('/home', [HomeController::class, 'index']);

    // Get all active project categories
    Route::get('/project-categories', [ProjectCategoryController::class, 'index']);

    // Get all public projects
    Route::get('/projects', [ProjectController::class, 'index']);

    // Get a single public project by its ID
    Route::get('/projects/{id}', [ProjectController::class, 'show']);

    // Send a new contact message
    Route::post('/contact', [ContactController::class, 'store']);

    // Get a media file by its ID and variant
    Route::get('/media/{id}/{variant}', [MediaController::class, 'show']);

    // Admin protected API routes
    Route::middleware(['auth:sanctum', 'admin'])->group(function () {

        // Get the currently authenticated admin user
        Route::get('/me', [SessionController::class, 'me']);

    });

});
