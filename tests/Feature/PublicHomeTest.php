<?php

namespace Tests\Feature;

use App\Models\HeroSlide;
use App\Models\Page;
use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicHomeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure the homepage endpoint returns the required JSON structure.
     */
    public function test_homepage_returns_required_json_structure(): void
    {
        SiteSetting::create([
            'company_name' => 'Jobico',
        ]);

        Page::create([
            'slug' => 'home',
            'title' => 'Home',
        ]);

        $response = $this->getJson('/api/v1/home');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'settings',
                    'page',
                    'hero_slides',
                ],
            ])
            ->assertJsonPath('data.settings.company_name', 'Jobico')
            ->assertJsonPath('data.page.slug', 'home');
    }

    /**
     * Ensure only active hero slides are returned in sort order.
     */
    public function test_homepage_returns_only_active_hero_slides_in_sort_order(): void
    {
        SiteSetting::create([
            'company_name' => 'Jobico',
        ]);

        Page::create([
            'slug' => 'home',
            'title' => 'Home',
        ]);

        HeroSlide::create([
            'title' => 'Second Slide',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        HeroSlide::create([
            'title' => 'Inactive Slide',
            'sort_order' => 1,
            'is_active' => false,
        ]);

        HeroSlide::create([
            'title' => 'First Slide',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/home');

        $response->assertOk()
            ->assertJsonCount(2, 'data.hero_slides')
            ->assertJsonPath('data.hero_slides.0.title', 'First Slide')
            ->assertJsonPath('data.hero_slides.1.title', 'Second Slide');
    }

    /**
     * Ensure the homepage endpoint returns 404 when the home page is missing.
     */
    public function test_homepage_returns_404_when_home_page_is_missing(): void
    {
        SiteSetting::create([
            'company_name' => 'Jobico',
        ]);

        $response = $this->getJson('/api/v1/home');

        $response->assertNotFound();
    }
}
