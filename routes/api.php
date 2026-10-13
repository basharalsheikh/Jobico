
<?php

use App\Http\Controllers\Api\V1\Admin\ContactMessageController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Public\ContactController;
use App\Http\Controllers\Api\V1\Public\HomeController;
use App\Http\Controllers\Api\V1\Public\MediaController;
use App\Http\Controllers\Api\V1\Public\PageController;
use App\Http\Controllers\Api\V1\Public\ProjectCategoryController;
use App\Http\Controllers\Api\V1\Public\ProjectController;
use App\Http\Controllers\Api\V1\Public\SiteController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Get the general website settings.
    Route::get('/site', [SiteController::class, 'index']);

    // Get a public page by its slug.
    Route::get('/pages/{slug}', [PageController::class, 'show']);

    // Get all data required for the public home page.
    Route::get('/home', [HomeController::class, 'index']);

    // Get all active project categories.
    Route::get('/project-categories', [ProjectCategoryController::class, 'index']);

    // Get all public projects.
    Route::get('/projects', [ProjectController::class, 'index']);

    // Get a single public project by its ID.
    Route::get('/projects/{id}', [ProjectController::class, 'show']);

    // Send a new contact message.
    Route::post('/contact', [ContactController::class, 'store']);

    // Get a media file by its ID and variant.
    Route::get('/media/{id}/{variant}', [MediaController::class, 'show']);

    // Admin protected API routes.
    Route::middleware(['auth:sanctum', 'admin'])->group(function () {

        // Get the currently authenticated admin user.
        Route::get('/me', [SessionController::class, 'me']);

        // Get dashboard statistics and the latest project edits.
        Route::get('/admin/dashboard', [DashboardController::class, 'index']);

        // Get contact messages with optional read-status filtering and pagination.
        Route::get('/admin/contact-messages', [ContactMessageController::class, 'index']);

        // Get the details of a single contact message.
        Route::get('/admin/contact-messages/{id}', [ContactMessageController::class, 'show']);

        // Mark a contact message as read.
        Route::patch('/admin/contact-messages/{id}/read', [ContactMessageController::class, 'markAsRead']);
    });
});
