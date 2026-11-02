<?php
namespace Tests\Feature;

use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPageUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_update_home_page_with_arabic_content(): void
    {
        $admin = $this->createAdmin();

        $page = Page::create([
            'slug' => 'home',
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
            'seo_title' => null,
            'seo_description' => null,
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط© ط§ظ„ط¬ط¯ظٹط¯ط©',
            'seo_title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط© | ط´ط±ظƒط© ط§ظ„ط¬ظˆط¨ظٹ',
            'seo_description' => 'طھط¹ط±ظپ ط¹ظ„ظ‰ ط´ط±ظƒط© ط§ظ„ط¬ظˆط¨ظٹ.',
            'content' => [
                'vision' => 'ط±ط¤ظٹطھظ†ط§ ظ‡ظٹ ط§ظ„طھط·ظˆط± ظˆط§ظ„طھظ…ظٹط².',
                'mission' => 'ظ†ط³ط¹ظ‰ ظ„طھظ‚ط¯ظٹظ… ط®ط¯ظ…ط§طھ ظ…طھظ…ظٹط²ط©.',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'ط§ظ„ط±ط¦ظٹط³ظٹط© ط§ظ„ط¬ط¯ظٹط¯ط©')
            ->assertJsonPath('data.content.vision', 'ط±ط¤ظٹطھظ†ط§ ظ‡ظٹ ط§ظ„طھط·ظˆط± ظˆط§ظ„طھظ…ظٹط².');

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط© ط§ظ„ط¬ط¯ظٹط¯ط©',
        ]);

        $this->assertSame(
            'ط±ط¤ظٹطھظ†ط§ ظ‡ظٹ ط§ظ„طھط·ظˆط± ظˆط§ظ„طھظ…ظٹط².',
            $page->fresh()->content['vision']
        );
    }

    public function test_regular_user_cannot_update_home_page(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
        ]);

        Page::create([
            'slug' => 'home',
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
            'content' => null,
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/admin/pages/home', [
            'title' => 'ط¹ظ†ظˆط§ظ† ط؛ظٹط± ظ…ط³ظ…ظˆط',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'vision' => 'ط±ط¤ظٹط©',
                'mission' => 'ط±ط³ط§ظ„ط©',
            ],
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('pages', [
            'slug' => 'home',
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
        ]);
    }

    public function test_invalid_home_page_content_is_rejected(): void
    {
        $admin = $this->createAdmin();

        Page::create([
            'slug' => 'home',
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'vision' => ['invalid', 'type'],
                'mission' => 'ط±ط³ط§ظ„ط©',
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['content.vision']);
    }

    public function test_slug_cannot_be_changed_through_page_update(): void
    {
        $admin = $this->createAdmin();

        $page = Page::create([
            'slug' => 'home',
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'slug' => 'about',
            'title' => 'ط¹ظ†ظˆط§ظ† ط¬ط¯ظٹط¯',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'vision' => 'ط±ط¤ظٹط©',
                'mission' => 'ط±ط³ط§ظ„ط©',
            ],
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'slug' => 'home',
            'title' => 'ط¹ظ†ظˆط§ظ† ط¬ط¯ظٹط¯',
        ]);

        $this->assertDatabaseMissing('pages', [
            'id' => $page->id,
            'slug' => 'about',
        ]);
    }

    public function test_extra_is_admin_field_cannot_change_user_permissions(): void
    {
        $admin = $this->createAdmin();

        $page = Page::create([
            'slug' => 'home',
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
            'seo_title' => null,
            'seo_description' => null,
            'is_admin' => false,
            'content' => [
                'vision' => 'ط±ط¤ظٹط©',
                'mission' => 'ط±ط³ط§ظ„ط©',
            ],
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'slug' => 'home',
            'title' => 'ط§ظ„ط±ط¦ظٹط³ظٹط©',
        ]);

        $this->assertTrue((bool) $admin->fresh()->is_admin);
    }

    public function test_admin_can_update_about_page(): void
    {
        $admin = $this->createAdmin();

        Page::create([
            'slug' => 'about',
            'title' => 'ظ…ظ† ظ†طظ†',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/about', [
            'title' => 'ظ…ظ† ظ†طظ†',
            'seo_title' => 'ظ…ظ† ظ†طظ† | ط´ط±ظƒط© ط§ظ„ط¬ظˆط¨ظٹ',
            'seo_description' => 'طھط¹ط±ظپ ط¹ظ„ظ‰ ط§ظ„ط´ط±ظƒط©.',
            'content' => [
                'intro' => 'ظ†ط¨ط°ط© ط¹ظ† ط§ظ„ط´ط±ظƒط©.',
                'timeline' => [
                    [
                        'year' => '2000',
                        'title' => 'ظ…ط±طظ„ط© طھط¬ط±ظٹط¨ظٹط©',
                        'body' => 'ظˆطµظپ ط§ظ„ظ…ط±طظ„ط©.',
                    ],
                ],
                'expertise' => [
                    [
                        'title' => 'ط§ظ„ظ…ظ‚ط§ظˆظ„ط§طھ',
                        'body' => 'ط®ط¨ط±ط© ظپظٹ ظ…ط¬ط§ظ„ ط§ظ„ظ…ظ‚ط§ظˆظ„ط§طھ.',
                    ],
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.content.intro', 'ظ†ط¨ط°ط© ط¹ظ† ط§ظ„ط´ط±ظƒط©.');

        $this->assertSame(
            '2000',
            Page::where('slug', 'about')->firstOrFail()->content['timeline'][0]['year']
        );
    }

    public function test_admin_can_update_projects_page(): void
    {
        $admin = $this->createAdmin();

        Page::create([
            'slug' => 'projects',
            'title' => 'ظ…ط´ط§ط±ظٹط¹ظ†ط§',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/projects', [
            'title' => 'ظ…ط´ط§ط±ظٹط¹ظ†ط§',
            'seo_title' => 'ظ…ط´ط§ط±ظٹط¹ظ†ط§ | ط´ط±ظƒط© ط§ظ„ط¬ظˆط¨ظٹ',
            'seo_description' => 'طھط¹ط±ظپ ط¹ظ„ظ‰ ظ…ط´ط§ط±ظٹط¹ ط§ظ„ط´ط±ظƒط©.',
            'content' => [
                'intro' => 'ظ†ظپط®ط± ط¨ظ…ط´ط§ط±ظٹط¹ظ†ط§.',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.content.intro', 'ظ†ظپط®ط± ط¨ظ…ط´ط§ط±ظٹط¹ظ†ط§.');

        $this->assertSame(
            'ظ†ظپط®ط± ط¨ظ…ط´ط§ط±ظٹط¹ظ†ط§.',
            Page::where('slug', 'projects')->firstOrFail()->content['intro']
        );
    }

    public function test_admin_can_update_contact_page(): void
    {
        $admin = $this->createAdmin();

        Page::create([
            'slug' => 'contact',
            'title' => 'طھظˆط§طµظ„ ظ…ط¹ظ†ط§',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/contact', [
            'title' => 'طھظˆط§طµظ„ ظ…ط¹ظ†ط§',
            'seo_title' => 'طھظˆط§طµظ„ ظ…ط¹ظ†ط§ | ط´ط±ظƒط© ط§ظ„ط¬ظˆط¨ظٹ',
            'seo_description' => 'طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ط´ط±ظƒط©.',
            'content' => [
                'intro' => 'ظٹط³ط¹ط¯ظ†ط§ طھظˆط§طµظ„ظƒ ظ…ط¹ظ†ط§.',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.content.intro', 'ظٹط³ط¹ط¯ظ†ط§ طھظˆط§طµظ„ظƒ ظ…ط¹ظ†ط§.');

        $this->assertSame(
            'ظٹط³ط¹ط¯ظ†ط§ طھظˆط§طµظ„ظƒ ظ…ط¹ظ†ط§.',
            Page::where('slug', 'contact')->firstOrFail()->content['intro']
        );
    }

    public function test_inactive_admin_cannot_update_page(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => false,
        ]);

        Page::create([
            'slug' => 'home',
            'title' => 'Original title',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'title' => 'Changed title',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'vision' => 'Vision',
                'mission' => 'Mission',
            ],
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('pages', [
            'slug' => 'home',
            'title' => 'Original title',
        ]);
    }

    public function test_unknown_page_slug_returns_not_found(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/unknown', [
            'title' => 'Changed title',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'intro' => 'Some content',
            ],
        ]);

        $response->assertNotFound();
    }
}
