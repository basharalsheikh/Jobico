<?php

namespace Tests\Feature;

use App\Models\HeroSlide;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminHeroSlideTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    private function createMedia(): Media
    {
        return Media::create([
            'disk' => 'public',
            'path' => 'hero/test-image.jpg',
            'mime' => 'image/jpeg',
            'width' => 1920,
            'height' => 1080,
            'alt' => 'Test hero image',
        ]);
    }

    public function test_guest_cannot_access_hero_slides(): void
    {
        $this->getJson('/api/v1/admin/hero-slides')
            ->assertUnauthorized();
    }

    public function test_non_admin_cannot_access_hero_slides(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->getJson('/api/v1/admin/hero-slides')
            ->assertForbidden();
    }

    public function test_admin_can_list_hero_slides_in_order(): void
    {
        $admin = $this->createAdmin();

        HeroSlide::create([
            'title' => 'Second slide',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        HeroSlide::create([
            'title' => 'First slide',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/hero-slides')
            ->assertOk();

        $this->assertSame(
            ['First slide', 'Second slide'],
            collect($response->json('data'))->pluck('title')->all()
        );
    }

    public function test_admin_can_create_hero_slide(): void
    {
        $admin = $this->createAdmin();
        $media = $this->createMedia();

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/hero-slides', [
                'title' => 'Welcome',
                'subtitle' => 'Welcome to Jobico',
                'media_id' => $media->id,
                'sort_order' => 1,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Welcome')
            ->assertJsonPath('data.media_id', $media->id);

        $this->assertDatabaseHas('hero_slides', [
            'title' => 'Welcome',
            'media_id' => $media->id,
        ]);
    }

    public function test_admin_can_update_hero_slide(): void
    {
        $admin = $this->createAdmin();

        $slide = HeroSlide::create([
            'title' => 'Old title',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/v1/admin/hero-slides/{$slide->id}", [
                'title' => 'Updated title',
                'sort_order' => 3,
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated title')
            ->assertJsonPath('data.sort_order', 3);

        $this->assertDatabaseHas('hero_slides', [
            'id' => $slide->id,
            'title' => 'Updated title',
            'sort_order' => 3,
        ]);
    }

    public function test_admin_can_delete_hero_slide(): void
    {
        $admin = $this->createAdmin();
        $media = $this->createMedia();

        $slide = HeroSlide::create([
            'title' => 'Temporary slide',
            'media_id' => $media->id,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        HeroSlide::create([
            'title' => 'Remaining slide',
            'media_id' => $media->id,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/hero-slides/{$slide->id}")
            ->assertOk();

        $this->assertDatabaseMissing('hero_slides', [
            'id' => $slide->id,
        ]);
    }

    public function test_media_id_must_exist_when_provided(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/hero-slides', [
                'title' => 'Invalid slide',
                'media_id' => 999999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['media_id']);
    }

    public function test_admin_can_view_a_single_hero_slide(): void
    {
        $admin = $this->createAdmin();

        $slide = HeroSlide::create([
            'title' => 'Main slide',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->getJson("/api/v1/admin/hero-slides/{$slide->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Main slide');
    }

    public function test_missing_hero_slide_returns_not_found(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/hero-slides/999999')
            ->assertNotFound();
    }

    public function test_admin_cannot_create_hero_slide_without_media(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/hero-slides', [
                'title' => 'Slide without image',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['media_id']);
    }

    public function test_admin_cannot_set_hero_slide_media_to_null(): void
    {
        $admin = $this->createAdmin();
        $media = $this->createMedia();

        $slide = HeroSlide::create([
            'title' => 'Existing slide',
            'media_id' => $media->id,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/v1/admin/hero-slides/{$slide->id}", [
                'media_id' => null,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['media_id']);
    }

    public function test_admin_can_reorder_hero_slides(): void
    {
        $admin = $this->createAdmin();

        $media1 = $this->createMedia();
        $media2 = $this->createMedia();
        $media3 = $this->createMedia();

        $slide1 = HeroSlide::create([
            'title' => 'Slide 1',
            'media_id' => $media1->id,
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $slide2 = HeroSlide::create([
            'title' => 'Slide 2',
            'media_id' => $media2->id,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $slide3 = HeroSlide::create([
            'title' => 'Slide 3',
            'media_id' => $media3->id,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->putJson(
            '/api/v1/admin/hero-slides/actions/reorder',
            [
                'slides' => [
                    ['id' => $slide3->id, 'sort_order' => 0],
                    ['id' => $slide1->id, 'sort_order' => 1],
                    ['id' => $slide2->id, 'sort_order' => 2],
                ],
            ]
        );

        $response->assertOk()
            ->assertJsonPath('data.0.id', $slide3->id)
            ->assertJsonPath('data.1.id', $slide1->id)
            ->assertJsonPath('data.2.id', $slide2->id);

        $this->assertDatabaseHas('hero_slides', [
            'id' => $slide3->id,
            'sort_order' => 0,
        ]);

        $this->assertDatabaseHas('hero_slides', [
            'id' => $slide1->id,
            'sort_order' => 1,
        ]);

        $this->assertDatabaseHas('hero_slides', [
            'id' => $slide2->id,
            'sort_order' => 2,
        ]);
    }

    public function test_admin_cannot_reorder_hero_slides_with_duplicate_ids(): void
    {
        $admin = $this->createAdmin();

        $slide = HeroSlide::create([
            'title' => 'Test slide',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)
            ->putJson('/api/v1/admin/hero-slides/actions/reorder', [
                'slides' => [
                    ['id' => $slide->id, 'sort_order' => 0],
                    ['id' => $slide->id, 'sort_order' => 1],
                ],
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slides.1.id']);
    }
}
