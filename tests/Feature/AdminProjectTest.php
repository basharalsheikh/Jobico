<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProjectTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_create_a_project(): void
    {
        $admin = $this->admin();
        $category = ProjectCategory::create([
            'name' => 'Construction',
            'slug' => 'construction',
        ]);

        $response = $this->actingAs($admin)->postJson(
            '/api/v1/admin/projects',
            [
                'title' => 'School Building',
                'category_id' => $category->id,
                'status' => 'draft',
                'sort_order' => 1,
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.title', 'School Building')
            ->assertJsonPath('data.updated_by', $admin->id);

        $this->assertDatabaseHas('projects', [
            'title' => 'School Building',
            'category_id' => $category->id,
            'status' => 'draft',
            'updated_by' => $admin->id,
        ]);
    }

    public function test_admin_can_update_a_project(): void
    {
        $admin = $this->admin();
        $project = Project::create([
            'title' => 'Old Title',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($admin)->putJson(
            "/api/v1/admin/projects/{$project->id}",
            ['title' => 'Updated Title']
        );

        $response->assertOk()
            ->assertJsonPath('data.title', 'Updated Title');

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'title' => 'Updated Title',
            'updated_by' => $admin->id,
        ]);
    }

    public function test_admin_can_list_projects_including_drafts(): void
    {
        $admin = $this->admin();

        Project::create(['title' => 'Draft Project', 'status' => 'draft']);
        Project::create(['title' => 'Published Project', 'status' => 'published']);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/projects');

        $response->assertOk()
            ->assertJsonFragment(['title' => 'Draft Project'])
            ->assertJsonFragment(['title' => 'Published Project']);
    }

    public function test_admin_can_delete_a_project(): void
    {
        $admin = $this->admin();
        $project = Project::create([
            'title' => 'Project to Delete',
            'status' => 'draft',
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/projects/{$project->id}")
            ->assertOk();

        $this->assertDatabaseMissing('projects', [
            'id' => $project->id,
        ]);
    }

    public function test_guest_cannot_create_a_project(): void
    {
        $this->postJson('/api/v1/admin/projects', [
            'title' => 'Unauthorized Project',
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_a_project(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson('/api/v1/admin/projects', [
            'title' => 'Unauthorized Project',
        ])->assertForbidden();
    }

    public function test_invalid_project_data_is_rejected(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/v1/admin/projects', [
            'title' => '',
            'status' => 'invalid',
            'sort_order' => -1,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors([
                'title',
                'status',
                'sort_order',
            ]);
    }

    public function test_draft_project_is_not_visible_to_public(): void
    {
        $draft = Project::create([
            'title' => 'Private Draft',
            'status' => 'draft',
        ]);

        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonMissing(['title' => 'Private Draft']);

        $this->getJson("/api/v1/projects/{$draft->id}")
            ->assertNotFound();
    }

    public function test_admin_can_create_project_with_ordered_gallery(): void
    {
        $admin = $this->admin();

        $first = Media::create([
            'disk' => 'public',
            'path' => 'projects/first.jpg',
            'mime' => 'image/jpeg',
            'uploaded_by' => $admin->id,
        ]);

        $second = Media::create([
            'disk' => 'public',
            'path' => 'projects/second.jpg',
            'mime' => 'image/jpeg',
            'uploaded_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->postJson(
            '/api/v1/admin/projects',
            [
                'title' => 'Gallery Project',
                'status' => 'draft',
                'gallery' => [$second->id, $first->id],
            ]
        );

        $response->assertCreated()
            ->assertJsonPath('data.gallery.0.id', $second->id)
            ->assertJsonPath('data.gallery.0.pivot.sort_order', 0)
            ->assertJsonPath('data.gallery.1.id', $first->id)
            ->assertJsonPath('data.gallery.1.pivot.sort_order', 1);
    }

    public function test_gallery_rejects_missing_or_duplicate_media_ids(): void
    {
        $admin = $this->admin();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/valid.jpg',
            'mime' => 'image/jpeg',
            'uploaded_by' => $admin->id,
        ]);

        $this->actingAs($admin)->postJson('/api/v1/admin/projects', [
            'title' => 'Invalid Gallery',
            'gallery' => [$media->id, 999999],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['gallery.1']);

        $this->actingAs($admin)->postJson('/api/v1/admin/projects', [
            'title' => 'Duplicate Gallery',
            'gallery' => [$media->id, $media->id],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['gallery.1']);
    }

    public function test_updating_gallery_replaces_existing_images(): void
    {
        $admin = $this->admin();

        $first = Media::create([
            'disk' => 'public',
            'path' => 'projects/first.jpg',
            'mime' => 'image/jpeg',
            'uploaded_by' => $admin->id,
        ]);

        $second = Media::create([
            'disk' => 'public',
            'path' => 'projects/second.jpg',
            'mime' => 'image/jpeg',
            'uploaded_by' => $admin->id,
        ]);

        $project = Project::create([
            'title' => 'Gallery Project',
            'status' => 'draft',
        ]);

        $project->gallery()->attach($first->id, ['sort_order' => 0]);

        $this->actingAs($admin)->putJson(
            "/api/v1/admin/projects/{$project->id}",
            ['gallery' => [$second->id]]
        )->assertOk()
            ->assertJsonPath('data.gallery.0.id', $second->id);

        $this->assertDatabaseHas('project_media', [
            'project_id' => $project->id,
            'media_id' => $second->id,
            'sort_order' => 0,
        ]);

        $this->assertDatabaseMissing('project_media', [
            'project_id' => $project->id,
            'media_id' => $first->id,
        ]);
    }

    public function test_updating_project_without_gallery_keeps_existing_images(): void
    {
        $admin = $this->admin();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/existing.jpg',
            'mime' => 'image/jpeg',
            'uploaded_by' => $admin->id,
        ]);

        $project = Project::create([
            'title' => 'Original Title',
            'status' => 'draft',
        ]);

        $project->gallery()->attach($media->id, ['sort_order' => 0]);

        $this->actingAs($admin)->putJson(
            "/api/v1/admin/projects/{$project->id}",
            ['title' => 'Updated Title']
        )->assertOk()
            ->assertJsonPath('data.title', 'Updated Title')
            ->assertJsonPath('data.gallery.0.id', $media->id);

        $this->assertDatabaseHas('project_media', [
            'project_id' => $project->id,
            'media_id' => $media->id,
            'sort_order' => 0,
        ]);
    }
}
