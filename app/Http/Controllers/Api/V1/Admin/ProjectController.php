<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Models\Project;
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
            $project->delete();
        } catch (QueryException $exception) {
            report($exception);

            return response()->json([
                'message' => 'Project cannot be deleted while related records prevent deletion.',
            ], 409);
        }

        return response()->json([
            'message' => 'Project deleted successfully.',
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
