<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\ProjectCategory;

class ProjectCategoryController extends Controller
{
    // Get all active project categories
    public function index()
    {
        // Get only active categories ordered by their sort order
        $categories = ProjectCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        // Return the categories as a JSON response
        return response()->json([
            'data' => $categories,
        ]);
    }
}
