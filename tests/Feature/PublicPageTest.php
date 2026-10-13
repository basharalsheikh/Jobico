<?php

namespace Tests\Feature;

use App\Models\Page;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicPageTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure a public page can be retrieved by its slug.
     */
    public function test_public_page_can_be_retrieved_by_slug(): void
    {
        Page::create([
            'slug' => 'about',
            'title' => 'About Us',
            'content' => [
                'description' => 'Learn more about Jobico.',
            ],
        ]);

        $response = $this->getJson('/api/v1/pages/about');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'slug',
                    'title',
                    'content',
                ],
            ])
            ->assertJsonPath('data.slug', 'about')
            ->assertJsonPath('data.title', 'About Us');
    }

    /**
     * Ensure a missing public page returns 404.
     */
    public function test_missing_public_page_returns_404(): void
    {
        $response = $this->getJson('/api/v1/pages/non-existent-page');

        $response->assertNotFound();
    }
}
