<?php

namespace Tests\Feature;

use App\Models\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicMediaTest extends TestCase
{
    use RefreshDatabase;

    // Test that the API returns the original media file successfully.
    public function test_it_returns_the_original_media_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('media/test.txt', 'Hello Media');

        $media = Media::create([
            'disk' => 'public',
            'path' => 'media/test.txt',
            'mime' => 'text/plain',
            'size' => 11,
            'variants' => [],
        ]);

        $response = $this->get("/api/v1/media/{$media->id}/original");

        $response->assertOk();
        $this->assertStringContainsString(
            'Hello Media',
            $response->streamedContent()
        );
    }

    // Test that the API returns an existing media variant successfully.
    public function test_it_returns_an_existing_media_variant(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('media/thumb.txt', 'Thumbnail');

        $media = Media::create([
            'disk' => 'public',
            'path' => 'media/original.txt',
            'mime' => 'text/plain',
            'size' => 9,
            'variants' => [
                'thumbnail' => 'media/thumb.txt',
            ],
        ]);

        $response = $this->get("/api/v1/media/{$media->id}/thumbnail");

        $response->assertOk();
        $this->assertStringContainsString(
            'Thumbnail',
            $response->streamedContent()
        );
    }

    // Test that the API returns 404 when the media record does not exist.
    public function test_it_returns_404_for_a_missing_media_record(): void
    {
        $response = $this->get('/api/v1/media/999999/original');

        $response->assertNotFound();
    }

    // Test that the API returns 404 when the requested variant is not defined.
    public function test_it_returns_404_for_an_unknown_variant(): void
    {
        $media = Media::create([
            'disk' => 'public',
            'path' => 'media/original.txt',
            'mime' => 'text/plain',
            'size' => 0,
            'variants' => [],
        ]);

        $response = $this->get("/api/v1/media/{$media->id}/thumbnail");

        $response->assertNotFound();
    }

    // Test that the API returns 404 when the requested file is missing from storage.
    public function test_it_returns_404_when_the_file_does_not_exist(): void
    {
        Storage::fake('public');

        $media = Media::create([
            'disk' => 'public',
            'path' => 'media/missing.txt',
            'mime' => 'text/plain',
            'size' => 0,
            'variants' => [],
        ]);

        $response = $this->get("/api/v1/media/{$media->id}/original");

        $response->assertNotFound();
    }
}
