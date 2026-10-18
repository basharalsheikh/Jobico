<?php

namespace Tests\Feature;

use App\Models\HeroSlide;
use App\Models\Media;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminMediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    private function admin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_upload_an_image(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson(
            '/api/v1/admin/media',
            [
                'file' => UploadedFile::fake()->image('project.jpg', 800, 600),
                'alt' => 'Project image',
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('message', 'Media uploaded successfully.')
            ->assertJsonPath('data.uploaded_by', $admin->id)
            ->assertJsonPath('data.alt', 'Project image');

        $media = Media::firstOrFail();

        $this->assertSame('public', $media->disk);
        $this->assertSame('image/jpeg', $media->mime);
        $this->assertTrue(
            Storage::disk('public')->exists($media->path)
        );
    }

    public function test_upload_rejects_non_image_files(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/v1/admin/media', [
            'file' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);

        $this->assertDatabaseCount('media', 0);
    }

    public function test_guest_cannot_upload_an_image(): void
    {
        $this->postJson('/api/v1/admin/media', [
            'file' => UploadedFile::fake()->image('project.jpg'),
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_upload_an_image(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson('/api/v1/admin/media', [
            'file' => UploadedFile::fake()->image('project.jpg'),
        ])->assertForbidden();
    }

    public function test_admin_can_delete_unused_media(): void
    {
        $admin = $this->admin();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/unused.jpg',
            'mime' => 'image/jpeg',
            'size' => 1000,
            'alt' => 'Unused image',
            'uploaded_by' => $admin->id,
        ]);

        Storage::disk('public')->put(
            $media->path,
            'fake image content'
        );

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/media/{$media->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('media', [
            'id' => $media->id,
        ]);

        $this->assertFalse(
            Storage::disk('public')->exists($media->path)
        );
    }

    public function test_admin_cannot_delete_media_used_by_project_cover(): void
    {
        $admin = $this->admin();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/cover.jpg',
            'mime' => 'image/jpeg',
            'size' => 1000,
            'alt' => 'Project cover',
            'uploaded_by' => $admin->id,
        ]);

        $project = Project::create([
            'title' => 'Test project',
            'cover_media_id' => $media->id,
            'status' => 'published',
        ]);

        Storage::disk('public')->put(
            $media->path,
            'fake image content'
        );

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/media/{$media->id}")
            ->assertStatus(409)
            ->assertJson([
                'message' => 'Cannot delete media that is currently in use.',
            ]);

        $this->assertDatabaseHas('media', [
            'id' => $media->id,
        ]);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'cover_media_id' => $media->id,
        ]);

        $this->assertTrue(
            Storage::disk('public')->exists($media->path)
        );
    }

    public function test_admin_cannot_delete_media_used_in_project_gallery(): void
    {
        $admin = $this->admin();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/gallery.jpg',
            'mime' => 'image/jpeg',
            'size' => 1000,
            'alt' => 'Project gallery image',
            'uploaded_by' => $admin->id,
        ]);

        $project = Project::create([
            'title' => 'Gallery test project',
            'status' => 'published',
        ]);

        $project->gallery()->attach($media->id, [
            'sort_order' => 1,
        ]);

        Storage::disk('public')->put(
            $media->path,
            'fake image content'
        );

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/media/{$media->id}")
            ->assertStatus(409)
            ->assertJson([
                'message' => 'Cannot delete media that is currently in use.',
            ]);

        $this->assertDatabaseHas('media', [
            'id' => $media->id,
        ]);

        $this->assertDatabaseHas('project_media', [
            'project_id' => $project->id,
            'media_id' => $media->id,
        ]);

        $this->assertTrue(
            Storage::disk('public')->exists($media->path)
        );
    }

    public function test_admin_cannot_delete_media_used_by_hero_slide(): void
    {
        $admin = $this->admin();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/hero.jpg',
            'mime' => 'image/jpeg',
            'size' => 1000,
            'alt' => 'Hero slide image',
            'uploaded_by' => $admin->id,
        ]);

        HeroSlide::create([
            'title' => 'Main hero slide',
            'subtitle' => 'Welcome to Jobico',
            'media_id' => $media->id,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        Storage::disk('public')->put(
            $media->path,
            'fake image content'
        );

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/media/{$media->id}")
            ->assertStatus(409)
            ->assertJson([
                'message' => 'Cannot delete media that is currently in use.',
            ]);

        $this->assertDatabaseHas('media', [
            'id' => $media->id,
        ]);

        $this->assertTrue(
            Storage::disk('public')->exists($media->path)
        );
    }

    public function test_media_record_is_preserved_when_file_deletion_fails(): void
    {
        $admin = $this->admin();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/undeletable.jpg',
            'mime' => 'image/jpeg',
            'size' => 1000,
            'alt' => 'Undeletable image',
            'uploaded_by' => $admin->id,
        ]);

        Storage::disk('public')->put(
            $media->path,
            'fake image content'
        );

        Storage::shouldReceive('disk')
            ->with('public')
            ->once()
            ->andReturn(new class
            {
                public function exists(string $path): bool
                {
                    return true;
                }

                public function delete(string $path): bool
                {
                    return false;
                }
            });

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/media/{$media->id}")
            ->assertStatus(500);

        $this->assertDatabaseHas('media', [
            'id' => $media->id,
        ]);
    }
}
