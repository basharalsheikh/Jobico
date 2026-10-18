<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use App\Models\Page;
use App\Models\SiteSetting;

class HomeController extends Controller
{
    // Get All Data Required for the public home page
    public function index()
    {
        // Get the general website settings and related logo media.
        $setting = SiteSetting::with('logoMedia')->first();

        // Get the home page content or return 404 if it does not exist.
        $page = Page::where('slug', 'home')->firstOrFail();

        // Retrieve active hero slides that have an associated media record.
        // Sort them by display order, then by ID for consistent ordering.
        $heroSlidesQuery = HeroSlide::with('media')
            ->where('is_active', true)
            ->whereHas('media')
            ->orderBy('sort_order')
            ->orderBy('id');

        // In image mode, display only the first active hero slide.
        // In slider mode, return all active hero slides.
        if ($setting?->hero_mode === 'image') {
            $heroSlidesQuery->limit(1);
        }

        // Execute the query and retrieve the hero slides.
        $heroSlides = $heroSlidesQuery->get();

        // Return all data required by the public home page.
        return response()->json([
            'data' => [
                'settings' => $setting,
                'page' => $page,
                'hero_slides' => $heroSlides,
            ],
        ]);
    }
}
