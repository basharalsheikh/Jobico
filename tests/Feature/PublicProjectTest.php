<?php

namespace Tests\Feature;

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
}
