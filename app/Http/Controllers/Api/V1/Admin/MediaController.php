<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UploadHeroMediaRequest;
use App\Http\Requests\Admin\UploadMediaRequest;
use App\Models\HeroSlide;
use App\Models\Media;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MediaController extends Controller
{
    /**
     * Upload an image used by projects.
     */
    public function store(UploadMediaRequest $request): JsonResponse
    {
        return $this->storeMediaFile(
            $request,
            'projects',
            'Media uploaded successfully.',
            'The file could not be stored.',
            'The media upload failed.'
        );
    }

    /**
     * Upload an image or video used by the Hero section.
     */
    public function storeHeroMedia(
        UploadHeroMediaRequest $request
    ): JsonResponse {
        return $this->storeMediaFile(
            $request,
            'hero',
            'Hero media uploaded successfully.',
            'The hero media could not be stored.',
            'The hero media upload failed.'
        );
    }

    /**
     * Store an uploaded file and create its media record.
     */
    private function storeMediaFile(
        UploadMediaRequest|UploadHeroMediaRequest $request,
        string $directory,
        string $successMessage,
        string $storageErrorMessage,
        string $uploadErrorMessage
    ): JsonResponse {
        $file = $request->file('file');
        $disk = 'public';
        $path = null;

        try {
            $path = $file->store($directory, $disk);

            if (! $path) {
                return response()->json([
                    'message' => $storageErrorMessage,
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
                'message' => $successMessage,
                'data' => $media,
            ], 201);
        } catch (Throwable $exception) {
            if ($path !== null) {
                try {
                    Storage::disk($disk)->delete($path);
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            report($exception);

            return response()->json([
                'message' => $uploadErrorMessage,
            ], 500);
        }
    }

    /**
     * Delete media if it is not currently in use.
     */
    public function destroy(Media $media): JsonResponse
    {
        $isProjectCover = Project::where(
            'cover_media_id',
            $media->id
        )->exists();

        $isProjectGalleryImage = $media->projects()->exists();

        $isHeroSlideImage = HeroSlide::where(
            'media_id',
            $media->id
        )->exists();

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

            if ($disk->exists($media->path)) {
                if (! $disk->delete($media->path)) {
                    return response()->json([
                        'message' => 'The media file could not be deleted.',
                    ], 500);
                }
            }

            $media->delete();

            return response()->json(null, 204);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'The media could not be deleted.',
            ], 500);
        }
    }

    /**
     * List uploaded media with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $media = Media::query()
            ->latest('id')
            ->paginate(20);

        return response()->json($media);
    }
}
