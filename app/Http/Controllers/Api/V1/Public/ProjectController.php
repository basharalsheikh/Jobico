<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Project;

class ProjectController extends Controller
{
    // Get all public projects
    public function index()
    {
        // Get projects ordered by their sort order
        $projects = Project::with([
            'category',
            'coverMedia',
        ])
            ->orderBy('sort_order')
            ->get();

        // Return the projects as a JSON response
        return response()->json([
            'data' => $projects,
        ]);
    }

    // Get a single public project by its ID
    public function show(int $id)
    {
        // Find the project with its related category and cover image
        // If the project does not exist, Laravel returns 404
        $project = Project::with([
            'category',
            'coverMedia',
        ])->findOrFail($id);

        // Return the project as a JSON response
        return response()->json([
            'data' => $project,
        ]);
    }
}
