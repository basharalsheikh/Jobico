<?php

use App\Http\Controllers\Api\V1\Admin\ContactMessageController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\HeroSlideController as AdminHeroSlideController;
use App\Http\Controllers\Api\V1\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Api\V1\Admin\PageController as AdminPageController;
use App\Http\Controllers\Api\V1\Admin\ProjectCategoryController as AdminProjectCategoryController;
use App\Http\Controllers\Api\V1\Admin\ProjectController as AdminProjectController;
use App\Http\Controllers\Api\V1\Admin\SettingsController;
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
        // Get Admin Pages
        Route::get('/admin/pages', [AdminPageController::class, 'index']);
        // Update an existing website page.
        Route::put('/admin/pages/{page:slug}', [AdminPageController::class, 'update']);
        // Admin project management.
        Route::get('/admin/projects', [AdminProjectController::class, 'index']);
        Route::post('/admin/projects', [AdminProjectController::class, 'store']);
        Route::get('/admin/projects/{project}', [AdminProjectController::class, 'show']);
        Route::put('/admin/projects/{project}', [AdminProjectController::class, 'update']);
        Route::patch('/admin/projects/{project}', [AdminProjectController::class, 'update']);
        Route::delete('/admin/projects/{project}', [AdminProjectController::class, 'destroy']);
        // Admin project category management.
        Route::get('/admin/project-categories', [AdminProjectCategoryController::class, 'index']);
        Route::post('/admin/project-categories', [AdminProjectCategoryController::class, 'store']);
        Route::get('/admin/project-categories/{projectCategory}', [AdminProjectCategoryController::class, 'show']);
        Route::put('/admin/project-categories/{projectCategory}', [AdminProjectCategoryController::class, 'update']);
        Route::patch('/admin/project-categories/{projectCategory}', [AdminProjectCategoryController::class, 'update']);
        Route::delete('/admin/project-categories/{projectCategory}', [AdminProjectCategoryController::class, 'destroy']);
      // Admin project media.
        Route::get('/admin/media', [AdminMediaController::class, 'index']);
        Route::post('/admin/media', [AdminMediaController::class, 'store']);
        Route::delete('/admin/media/{media}', [AdminMediaController::class, 'destroy']);

        // Admin hero media upload.
        Route::post(
            '/admin/hero-media',
            [AdminMediaController::class, 'storeHeroMedia']
        );
        // Admin hero slide management.
        Route::get('/admin/hero-slides', [AdminHeroSlideController::class, 'index']);
        Route::post('/admin/hero-slides', [AdminHeroSlideController::class, 'store']);
        Route::get('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'show']);
        Route::put('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'update']);
        Route::patch('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'update']);
        Route::delete('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'destroy']);
        // Get and update website settings.
        Route::get('/admin/settings', [SettingsController::class, 'show']);
        Route::put('/admin/settings', [SettingsController::class, 'update']);
        // Get and update footer settings.
        Route::get('/admin/footer-settings', [
            \App\Http\Controllers\Api\V1\Admin\FooterSettingsController::class,
            'show',
        ]);

        Route::put('/admin/footer-settings', [
            \App\Http\Controllers\Api\V1\Admin\FooterSettingsController::class,
            'update',
        ]);
        // Admin hero slide management.
        Route::get('/admin/hero-slides', [AdminHeroSlideController::class, 'index']);
        Route::post('/admin/hero-slides', [AdminHeroSlideController::class, 'store']);
        Route::put('/admin/hero-slides/actions/reorder', [AdminHeroSlideController::class, 'reorder']);
        Route::get('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'show']);
        Route::patch('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'update']);
        Route::delete('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'destroy']);
    });
});
