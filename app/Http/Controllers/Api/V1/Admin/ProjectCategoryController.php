<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ProjectCategory::withCount('projects')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(15);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:120', 'alpha_dash', 'unique:project_categories,slug'],
            'sort_order' => ['sometimes', 'required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);

        $category = ProjectCategory::create($validated);

        return response()->json([
            'message' => 'Category created successfully.',
            'data' => $category->loadCount('projects'),
        ], 201);
    }

    public function show(ProjectCategory $projectCategory): JsonResponse
    {
        return response()->json([
            'data' => $projectCategory->loadCount('projects'),
        ]);
    }

    public function update(Request $request, ProjectCategory $projectCategory): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:120',
                'alpha_dash',
                Rule::unique('project_categories', 'slug')->ignore($projectCategory->id),
            ],
            'sort_order' => ['sometimes', 'required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);

        $projectCategory->update($validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'data' => $projectCategory->loadCount('projects'),
        ]);
    }

    public function destroy(ProjectCategory $projectCategory): JsonResponse
    {
        if ($projectCategory->projects()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a category that has associated projects.',
            ], 409);
        }

        $projectCategory->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}
