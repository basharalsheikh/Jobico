<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Project;

class ProjectController extends Controller
{
    /**
     * Get published projects for public visitors.
     */
    public function index()
    {
        $projects = Project::with([
            'category',
            'coverMedia',
        ])
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $projects,
        ]);
    }

    /**
     * Get a single published project by its ID.
     */
    public function show(int $id)
    {
        $project = Project::with([
            'category',
            'coverMedia',
        ])
            ->where('status', 'published')
            ->findOrFail($id);

        return response()->json([
            'data' => $project,
        ]);
    }
}
