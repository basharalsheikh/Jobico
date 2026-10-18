<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UploadMediaRequest;
use App\Models\HeroSlide;
use App\Models\Media;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MediaController extends Controller
{
    public function store(UploadMediaRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $disk = 'public';
        $path = null;

        try {
            $path = $file->store('projects', $disk);

            if (! $path) {
                return response()->json([
                    'message' => 'The file could not be stored.',
                ], 500);
            }

            $media = Media::create([
                'disk' => $disk,
                'path' => $path,
                'variants' => null,
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'width' => null,
                'height' => null,
                'alt' => $request->validated('alt'),
                'uploaded_by' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Media uploaded successfully.',
                'data' => $media,
            ], 201);
        } catch (Throwable $exception) {
            if ($path) {
                Storage::disk($disk)->delete($path);
            }

            report($exception);

            return response()->json([
                'message' => 'The media upload failed.',
            ], 500);
        }
    }

    public function destroy(Media $media): JsonResponse
    {
        // Prevent deleting media used as a project cover.
        $isProjectCover = Project::where(
            'cover_media_id',
            $media->id
        )->exists();

        // Prevent deleting media used in a project gallery.
        $isProjectGalleryImage = $media->projects()->exists();

        // Prevent deleting media used by a hero slide.
        $isHeroSlideImage = HeroSlide::where(
            'media_id',
            $media->id
        )->exists();

        // Return 409 Conflict if the media is still in use.
        if (
            $isProjectCover ||
            $isProjectGalleryImage ||
            $isHeroSlideImage
        ) {
            return response()->json([
                'message' => 'Cannot delete media that is currently in use.',
            ], 409);
        }

        try {
            $disk = Storage::disk($media->disk);

            // Check whether the file exists before attempting deletion.
            if ($disk->exists($media->path)) {
                // Stop if the file cannot be deleted.
                if (! $disk->delete($media->path)) {
                    return response()->json([
                        'message' => 'The media file could not be deleted.',
                    ], 500);
                }
            }

            // Delete the database record only after file deletion succeeds.
            $media->delete();

            return response()->json(null, 204);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'The media could not be deleted.',
            ], 500);
        }
    }
}
