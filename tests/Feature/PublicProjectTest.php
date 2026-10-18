<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProjectTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure the public projects endpoint returns a JSON list.
     */
    public function test_public_projects_endpoint_returns_json_list(): void
    {
        $response = $this->getJson('/api/v1/projects');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
            ]);
    }

    /**
     * Ensure requesting a non-existent project returns 404.
     */
    public function test_non_existent_project_returns_404(): void
    {
        $response = $this->getJson('/api/v1/projects/999999');

        $response->assertNotFound();
    }

    /**
     * Ensure public visitors can only see published projects.
     */
    public function test_public_projects_endpoint_returns_only_published_projects(): void
    {
        Project::create([
            'title' => 'Published Project',
            'status' => 'published',
        ]);

        Project::create([
            'title' => 'Draft Project',
            'status' => 'draft',
        ]);

        $response = $this->getJson('/api/v1/projects');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Published Project');
    }

    /**
     * Ensure draft projects are not accessible through the public endpoint.
     */
    public function test_draft_project_is_not_accessible_to_public_visitors(): void
    {
        $project = Project::create([
            'title' => 'Draft Project',
            'status' => 'draft',
        ]);

        $response = $this->getJson('/api/v1/projects/'.$project->id);

        $response->assertNotFound();
    }

    /**
     * Ensure published project details include gallery images in sort order.
     */
    public function test_public_project_details_include_ordered_gallery_images(): void
    {
        $first = Media::create([
            'disk' => 'public',
            'path' => 'projects/first.jpg',
            'mime' => 'image/jpeg',
        ]);

        $second = Media::create([
            'disk' => 'public',
            'path' => 'projects/second.jpg',
            'mime' => 'image/jpeg',
        ]);

        $project = Project::create([
            'title' => 'Published Project',
            'status' => 'published',
        ]);

        $project->gallery()->attach($second->id, ['sort_order' => 2]);
        $project->gallery()->attach($first->id, ['sort_order' => 1]);

        $this->getJson('/api/v1/projects/'.$project->id)
            ->assertOk()
            ->assertJsonPath('data.gallery.0.id', $first->id)
            ->assertJsonPath('data.gallery.1.id', $second->id);
    }

    /**
     * Ensure the public projects list includes gallery images.
     */
    public function test_public_projects_list_includes_gallery_images(): void
    {
        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/gallery.jpg',
            'mime' => 'image/jpeg',
        ]);

        $project = Project::create([
            'title' => 'Published Project',
            'status' => 'published',
        ]);

        $project->gallery()->attach($media->id, ['sort_order' => 0]);

        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonPath('data.0.id', $project->id)
            ->assertJsonPath('data.0.gallery.0.id', $media->id);
    }
}
