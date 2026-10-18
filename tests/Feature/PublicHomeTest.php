<?php

namespace Tests\Feature;

use App\Models\HeroSlide;
use App\Models\Media;
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
        // Create the general website settings.
        SiteSetting::create([
            'company_name' => 'Jobico',
        ]);

        // Create the home page content.
        Page::create([
            'slug' => 'home',
            'title' => 'Home',
        ]);

        // Request the public homepage data.
        $response = $this->getJson('/api/v1/home');

        // Verify the response structure and essential page data.
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
     * Ensure only active hero slides are returned in sort order
     * when the hero mode is set to slider.
     */
    public function test_homepage_returns_only_active_hero_slides_in_sort_order(): void
    {
        // Configure the homepage to display a slider.
        SiteSetting::create([
            'company_name' => 'Jobico',
            'hero_mode' => 'slider',
        ]);

        // Create the home page content.
        Page::create([
            'slug' => 'home',
            'title' => 'Home',
        ]);

        // Create media records for the hero slides.
        $firstMedia = Media::create([
            'disk' => 'public',
            'path' => 'hero/first.jpg',
            'mime' => 'image/jpeg',
            'width' => 1920,
            'height' => 1080,
            'alt' => 'First slide',
        ]);

        $secondMedia = Media::create([
            'disk' => 'public',
            'path' => 'hero/second.jpg',
            'mime' => 'image/jpeg',
            'width' => 1920,
            'height' => 1080,
            'alt' => 'Second slide',
        ]);

        // Create an active slide with a higher sort order.
        HeroSlide::create([
            'title' => 'Second Slide',
            'media_id' => $secondMedia->id,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // Create an inactive slide that must not appear on the homepage.
        HeroSlide::create([
            'title' => 'Inactive Slide',
            'media_id' => $firstMedia->id,
            'sort_order' => 1,
            'is_active' => false,
        ]);

        // Create the first active slide.
        HeroSlide::create([
            'title' => 'First Slide',
            'media_id' => $firstMedia->id,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        // Request the homepage and verify active slides are sorted correctly.
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
        // Create settings without creating the home page.
        SiteSetting::create([
            'company_name' => 'Jobico',
        ]);

        // Verify the endpoint returns 404 when the page does not exist.
        $this->getJson('/api/v1/home')->assertNotFound();
    }

    /**
     * Ensure image mode returns only the first active hero slide.
     */
    public function test_homepage_returns_only_first_active_slide_in_image_mode(): void
    {
        // Configure the homepage to display a single image.
        SiteSetting::create([
            'company_name' => 'Jobico',
            'hero_mode' => 'image',
        ]);

        // Create the home page content.
        Page::create([
            'slug' => 'home',
            'title' => 'Home',
        ]);

        // Create a media record shared by the test slides.
        $media = Media::create([
            'disk' => 'public',
            'path' => 'hero/test.jpg',
            'mime' => 'image/jpeg',
            'width' => 1920,
            'height' => 1080,
            'alt' => 'Test image',
        ]);

        // Create the second slide first to verify sorting is respected.
        HeroSlide::create([
            'title' => 'Second Slide',
            'media_id' => $media->id,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // Create the first slide, which should be returned in image mode.
        HeroSlide::create([
            'title' => 'First Slide',
            'media_id' => $media->id,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        // Verify image mode returns exactly one slide: the first active slide.
        $this->getJson('/api/v1/home')
            ->assertOk()
            ->assertJsonCount(1, 'data.hero_slides')
            ->assertJsonPath('data.hero_slides.0.title', 'First Slide');
    }
}
