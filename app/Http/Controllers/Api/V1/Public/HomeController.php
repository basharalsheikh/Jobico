<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use App\Models\SiteSetting;
use App\Models\Page;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    //Get All Data Required for the public home page
    public function index()
    {
        //Home page data will be added here
        // 1- Get the general website setting
        $setting = SiteSetting::with('logoMedia')->first();
        // 2- Get the home page content
        $page = Page::where('slug', 'home')->firstOrFail();
        // 3- Get Only active hero slides orderd by their sort order
        $heroSlides = HeroSlide::with('media')
        ->where('is_active',true)
        ->orderBy('sort_order')
        ->get();
        // 4- Return all home page data as a JSON response
        return response() -> json([
            'data' => [
                'settings' => $setting,
                'page' => $page,
                'hero_slides' => $heroSlides,
            ]
        ]);

    }
}
