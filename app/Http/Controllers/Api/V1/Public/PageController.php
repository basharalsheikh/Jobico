<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Page;

class PageController extends Controller
{
    // Get a public page by its slug
    public function show(string $slug)
    {
        // Find the page using its slug
        $page = Page::where('slug', $slug)->firstOrFail();

        // Return the page as a JSON response
        return response()->json([
            'data' => $page,
        ]);
    }
}
