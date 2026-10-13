<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Project;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    // Get dashboard statistics and the latest project edits.
    public function index(): JsonResponse
    {
        return response()->json([
            // Count projects by publication status.
            'projects' => [
                'published' => Project::where('status', 'published')->count(),
                'draft' => Project::where('status', 'draft')->count(),
            ],

            // Count all contact messages and identify unread messages.
            'messages' => [
                'total' => ContactMessage::count(),
                'unread' => ContactMessage::whereNull('read_at')->count(),
            ],

            // Retrieve the five most recently updated projects.
            'latest_edits' => Project::query()
                ->with('updatedBy:id,name')
                ->select([
                    'id',
                    'title',
                    'status',
                    'updated_by',
                    'updated_at',
                ])
                ->latest('updated_at')
                ->limit(5)
                ->get(),
        ]);
    }
}
