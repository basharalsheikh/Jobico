<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HeroSlideController extends Controller
{
    /**
     * Display a paginated list of hero slides.
     */
    public function index(): JsonResponse
    {
        $slides = HeroSlide::with('media')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(15);

        return response()->json($slides);
    }

    /**
     * Store a new hero slide.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:200'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'media_id' => ['required', 'integer', 'exists:media,id'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $slide = HeroSlide::create($validated);

        return response()->json([
            'message' => 'Hero slide created successfully.',
            'data' => $slide->load('media'),
        ], 201);
    }

    /**
     * Display a specific hero slide.
     */
    public function show(HeroSlide $heroSlide): JsonResponse
    {
        return response()->json([
            'data' => $heroSlide->load('media'),
        ]);
    }

    /**
     * Update an existing hero slide.
     */
    public function update(
        Request $request,
        HeroSlide $heroSlide
    ): JsonResponse {
        $validated = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:200'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:500'],
            'media_id' => ['sometimes', 'required', 'integer', 'exists:media,id'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Prevent disabling the last active slide with an image.
        if (
            ($validated['is_active'] ?? true) === false
            && $heroSlide->is_active
        ) {
            $this->ensureAnotherActiveSlideExists($heroSlide);
        }

        $heroSlide->update($validated);

        return response()->json([
            'message' => 'Hero slide updated successfully.',
            'data' => $heroSlide->fresh()->load('media'),
        ]);
    }

    /**
     * Ensure at least one active hero slide with media remains.
     */
    private function ensureAnotherActiveSlideExists(HeroSlide $slide): void
    {
        $anotherActiveSlideExists = HeroSlide::query()
            ->where('id', '!=', $slide->id)
            ->where('is_active', true)
            ->whereHas('media')
            ->exists();

        if (! $anotherActiveSlideExists) {
            abort(response()->json([
                'message' => 'At least one active hero slide with an image must remain.',
            ], 409));
        }
    }

    /**
     * Delete a hero slide.
     */
    public function destroy(HeroSlide $heroSlide): JsonResponse
    {
        // Prevent deleting the last active slide with an image.
        if ($heroSlide->is_active) {
            $this->ensureAnotherActiveSlideExists($heroSlide);
        }

        $heroSlide->delete();

        return response()->json([
            'message' => 'Hero slide deleted successfully.',
        ]);
    }

    /**
     * Reorder hero slides.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slides' => ['required', 'array', 'min:1'],
            'slides.*.id' => [
                'required',
                'integer',
                'distinct',
                'exists:hero_slides,id',
            ],
            'slides.*.sort_order' => [
                'required',
                'integer',
                'min:0',
            ],
        ]);

        DB::transaction(function () use ($validated): void {
            foreach ($validated['slides'] as $slideData) {
                HeroSlide::whereKey($slideData['id'])
                    ->update([
                        'sort_order' => $slideData['sort_order'],
                    ]);
            }
        });

        return response()->json([
            'message' => 'Hero slides reordered successfully.',
            'data' => HeroSlide::with('media')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
        ]);
    }
}
