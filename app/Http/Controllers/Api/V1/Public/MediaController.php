<?php
namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MediaController extends Controller
{
    public function show(int $id, string $variant): BinaryFileResponse
    {
        $media = Media::findOrFail($id);

        if ($variant === 'original') {
            $path = $media->path;
        } else {
            $variants = $media->variants ?? [];

            if (! isset($variants[$variant])) {
                abort(404);
            }

            $path = $variants[$variant];
        }

        $disk = Storage::disk($media->disk);

        if (! $disk->exists($path)) {
            abort(404);
        }

        $fullPath = $disk->path($path);

        return response()->file($fullPath, [
            'Content-Type' => $media->mime,
            'Content-Length' => (string) filesize($fullPath),
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
