<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;

class SiteController extends Controller
{
    // Get the general settings of the website
    public function index()
    {
        // Get the main site settings with the logo information
        $settings = SiteSetting::with('logoMedia')->first();

        // Return the settings as a JSON response
        return response()->json([
            'data' => $settings,
        ]);
    }
}
