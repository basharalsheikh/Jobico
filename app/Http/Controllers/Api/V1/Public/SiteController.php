<?php
namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\FooterSetting;
use App\Models\SiteSetting;

class SiteController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::with('logoMedia')->first();
        $footerSettings = FooterSetting::firstOrCreate([]);

        if ($settings) {
            $settings->setAttribute('footer', $footerSettings);
        }

        return response()->json([
            'data' => $settings,
        ]);
    }
}
