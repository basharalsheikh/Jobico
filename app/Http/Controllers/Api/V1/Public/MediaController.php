<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    // Get a media file by its ID and variant
    public function show(int $id, string $variant)
    {
        // Find the requested media record
        $media = Media::findOrFail($id);

        // Use the original file path
        if ($variant === 'original') {
            $path = $media->path;
        } else {
            // Check if the requested variant exists
            if (! isset($media->variants[$variant])) {
                abort(404);
            }

            $path = $media->variants[$variant];
        }

        // Check if the file exists on the configured disk
        if (! Storage::disk($media->disk)->exists($path)) {
            abort(404);
        }

        // Return the actual media file
        return response()->file(
            Storage::disk($media->disk)->path($path)
        );
    }
}
