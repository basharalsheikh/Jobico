<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function index(): JsonResponse
    {
        $pages = Page::query()
            ->orderBy('id')
            ->get([
                'id',
                'slug',
                'title',
                'seo_title',
                'seo_description',
                'content',
                'updated_by',
                'updated_at',
            ]);

        return response()->json([
            'data' => $pages,
        ]);
    }

    public function update(
        UpdatePageRequest $request,
        Page $page
    ): JsonResponse {
        $validated = $request->validated();

        $content = $validated['content'] ?? [];

        /*
         * Home page:
         * Preserve the Our Projects section text,
         * but remove the old manually-managed project cards.
         *
         * Actual projects are managed only through AdminProjects.
         */
        if ($page->slug === 'home') {
            $existingContent = $page->content;

            if (is_string($existingContent)) {
                $decoded = json_decode($existingContent, true);

                $existingContent = is_array($decoded)
                    ? $decoded
                    : [];
            }

            if (!is_array($existingContent)) {
                $existingContent = [];
            }

            $existingProjectsSection =
                $existingContent['projects_section'] ?? [];

            $projectsSection =
                $content['projects_section']
                ?? $existingProjectsSection;

            if (!is_array($projectsSection)) {
                $projectsSection = [];
            }

            // Do not store manually-managed project cards in Home.
            unset($projectsSection['items']);

            $content['projects_section'] = $projectsSection;

            $validated['content'] = $content;
        }

        $page->fill($validated);
        $page->updated_by = $request->user()->id;
        $page->save();

        return response()->json([
            'message' => 'Page updated successfully.',
            'data' => $page->fresh(),
        ]);
    }
}
