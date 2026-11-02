<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Models\Project;
use App\Models\Page;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index(): JsonResponse
    {
        $projects = Project::with(['category', 'coverMedia'])
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($projects);
    }

    public function show(Project $project): JsonResponse
    {
        $project->load(['category', 'coverMedia', 'gallery']);

        return response()->json([
            'data' => $project,
        ]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $galleryIds = $validated['gallery'] ?? null;
        unset($validated['gallery']);

        $project = DB::transaction(function () use (
            $validated,
            $galleryIds,
            $request
        ) {
            $project = Project::create([
                ...$validated,
                'updated_by' => $request->user()->id,
            ]);

            if ($galleryIds !== null) {
                $gallery = [];

                foreach ($galleryIds as $sortOrder => $mediaId) {
                    $gallery[$mediaId] = ['sort_order' => $sortOrder];
                }

                $project->gallery()->sync($gallery);
            }

            return $project;
        });

        $project->load(['category', 'coverMedia', 'gallery']);

        return response()->json([
            'message' => 'Project created successfully.',
            'data' => $project,
        ], 201);
    }

  public function destroy(Project $project): JsonResponse
{
    try {
        DB::transaction(function () use ($project) {

            // Find homepage and lock it during the operation.
            $page = Page::where('slug', 'home')
                ->lockForUpdate()
                ->first();

            if ($page) {
                $content = $page->content ?? [];

                if (is_string($content)) {
                    $decoded = json_decode($content, true);
                    $content = is_array($decoded) ? $decoded : [];
                }

                if (!is_array($content)) {
                    $content = [];
                }

                $projectsSection = $content['projects_section'] ?? [];

                if (!is_array($projectsSection)) {
                    $projectsSection = [];
                }

                $items = $projectsSection['items'] ?? [];

                if (is_array($items)) {
                    // Remove the homepage card linked to this project.
                    $projectsSection['items'] = array_values(
                        array_filter(
                            $items,
                            function ($item) use ($project) {
                                if (!is_array($item)) {
                                    return true;
                                }

                                $linkedProjectId = $item['project_id'] ?? null;

                                return $linkedProjectId === null
                                    || (int) $linkedProjectId !== $project->id;
                            }
                        )
                    );

                    $content['projects_section'] = $projectsSection;

                    $page->content = $content;
                    $page->save();
                }
            }

            // Delete the actual project.
            $project->delete();
        });

    } catch (QueryException $exception) {
        report($exception);

        return response()->json([
            'message' => 'Project cannot be deleted while related records prevent deletion.',
        ], 409);
    }

    return response()->json([
        'message' => 'Project and its homepage card deleted successfully.',
    ]);
}

    public function update(
        UpdateProjectRequest $request,
        Project $project
    ): JsonResponse {
        $validated = $request->validated();
        $galleryIds = $validated['gallery'] ?? null;
        unset($validated['gallery']);

        DB::transaction(function () use (
            $project,
            $validated,
            $galleryIds,
            $request
        ) {
            $project->fill($validated);
            $project->updated_by = $request->user()->id;
            $project->save();

            if ($galleryIds !== null) {
                $gallery = [];

                foreach ($galleryIds as $sortOrder => $mediaId) {
                    $gallery[$mediaId] = ['sort_order' => $sortOrder];
                }

                $project->gallery()->sync($gallery);
            }
        });

        $project->load(['category', 'coverMedia', 'gallery']);

        return response()->json([
            'message' => 'Project updated successfully.',
            'data' => $project,
        ]);
    }
}
