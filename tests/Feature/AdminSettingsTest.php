<?php

namespace Tests\Feature;

use App\Models\HeroSlide;
use App\Models\Media;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    private function regularUser(): User
    {
        return User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
        ]);
    }

    private function settings(): SiteSetting
    {
        return SiteSetting::create([
            'company_name' => 'Jobico',
            'hero_mode' => 'image',
            'address' => 'Damascus',
            'phones' => [
                [
                    'label' => 'Main',
                    'value' => '+963900000000',
                    'is_visible' => true,
                ],
            ],
            'emails' => [
                [
                    'label' => 'General',
                    'value' => 'info@example.com',
                    'is_visible' => true,
                ],
            ],
        ]);
    }

    public function test_admin_can_view_website_settings(): void
    {
        $admin = $this->admin();
        $settings = $this->settings();

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/settings')
            ->assertOk()
            ->assertJsonPath('data.id', $settings->id)
            ->assertJsonPath('data.company_name', 'Jobico')
            ->assertJsonPath('data.hero_mode', 'image');
    }

    public function test_admin_can_update_website_settings(): void
    {
        $admin = $this->admin();
        $settings = $this->settings();

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'company_name' => 'Jobico Company',
                'hero_mode' => 'slider',
                'address' => 'Aleppo',
            ])
            ->assertOk()
            ->assertJsonPath('data.company_name', 'Jobico Company')
            ->assertJsonPath('data.hero_mode', 'slider')
            ->assertJsonPath('data.address', 'Aleppo');

        $this->assertDatabaseHas('site_settings', [
            'id' => $settings->id,
            'company_name' => 'Jobico Company',
            'hero_mode' => 'slider',
            'address' => 'Aleppo',
        ]);
    }

    public function test_guest_cannot_view_or_update_settings(): void
    {
        $this->settings();

        $this->getJson('/api/v1/admin/settings')
            ->assertUnauthorized();

        $this->putJson('/api/v1/admin/settings', [
            'company_name' => 'Changed',
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_view_or_update_settings(): void
    {
        $user = $this->regularUser();
        $this->settings();

        $this->actingAs($user)
            ->getJson('/api/v1/admin/settings')
            ->assertForbidden();

        $this->actingAs($user)
            ->putJson('/api/v1/admin/settings', [
                'company_name' => 'Changed',
            ])
            ->assertForbidden();
    }

    public function test_settings_endpoints_return_404_when_settings_do_not_exist(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/settings')
            ->assertNotFound();

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'company_name' => 'Jobico',
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('site_settings', 0);
    }

    public function test_invalid_hero_mode_is_rejected(): void
    {
        $admin = $this->admin();
        $this->settings();

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'hero_mode' => 'video',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('hero_mode');
    }

    public function test_invalid_email_in_settings_is_rejected(): void
    {
        $admin = $this->admin();
        $this->settings();

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'emails' => [
                    [
                        'label' => 'General',
                        'value' => 'not-an-email',
                        'is_visible' => true,
                    ],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('emails.0.value');
    }

    public function test_nonexistent_logo_media_is_rejected(): void
    {
        $admin = $this->admin();
        $this->settings();

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'logo_media_id' => 999999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('logo_media_id');
    }

    public function test_phone_visibility_must_be_boolean(): void
    {
        $admin = $this->admin();
        $this->settings();

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'phones' => [
                    [
                        'label' => 'Main',
                        'value' => '+963900000000',
                        'is_visible' => 'maybe',
                    ],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('phones.0.is_visible');
    }

    public function test_image_mode_is_rejected_when_no_active_hero_slide_has_media(): void
    {
        $admin = $this->admin();
        $settings = $this->settings();

        // There are no hero slides in this test database.
        $this->assertDatabaseCount('hero_slides', 0);

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'hero_mode' => 'image',
            ])
            ->assertStatus(409)
            ->assertJsonPath(
                'message',
                'Image mode requires at least one active hero slide with an image.'
            );

        $this->assertDatabaseHas('site_settings', [
            'id' => $settings->id,
            'hero_mode' => 'image',
        ]);
    }

    public function test_image_mode_is_allowed_when_an_active_hero_slide_has_media(): void
    {
        $admin = $this->admin();
        $settings = $this->settings();

        $media = Media::create([
            'disk' => 'public',
            'path' => 'projects/hero-test.jpg',
            'mime' => 'image/jpeg',
            'size' => 1024,
            'uploaded_by' => $admin->id,
        ]);

        HeroSlide::create([
            'title' => 'Homepage Hero',
            'media_id' => $media->id,
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/settings', [
                'hero_mode' => 'image',
            ])
            ->assertOk()
            ->assertJsonPath('data.hero_mode', 'image');

        $this->assertDatabaseHas('site_settings', [
            'id' => $settings->id,
            'hero_mode' => 'image',
        ]);
    }
}
