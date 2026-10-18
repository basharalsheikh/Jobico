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
            'title' => 'الرئيسية',
            'seo_title' => null,
            'seo_description' => null,
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'title' => 'الرئيسية الجديدة',
            'seo_title' => 'الرئيسية | شركة الجوبي',
            'seo_description' => 'تعرف على شركة الجوبي.',
            'content' => [
                'vision' => 'رؤيتنا هي التطور والتميز.',
                'mission' => 'نسعى لتقديم خدمات متميزة.',
                'values' => [
                    [
                        'title' => 'الجودة',
                        'body' => 'نلتزم بأعلى معايير الجودة.',
                    ],
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'الرئيسية الجديدة')
            ->assertJsonPath('data.content.vision', 'رؤيتنا هي التطور والتميز.');

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'الرئيسية الجديدة',
        ]);

        $this->assertSame(
            'رؤيتنا هي التطور والتميز.',
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
            'title' => 'الرئيسية',
            'content' => null,
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/admin/pages/home', [
            'title' => 'عنوان غير مسموح',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'vision' => 'رؤية',
                'mission' => 'رسالة',
                'values' => [],
            ],
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('pages', [
            'slug' => 'home',
            'title' => 'الرئيسية',
        ]);
    }

    public function test_invalid_home_page_content_is_rejected(): void
    {
        $admin = $this->createAdmin();

        Page::create([
            'slug' => 'home',
            'title' => 'الرئيسية',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'title' => 'الرئيسية',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'vision' => '',
                'mission' => 'رسالة',
                'values' => [],
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
            'title' => 'الرئيسية',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'slug' => 'about',
            'title' => 'عنوان جديد',
            'seo_title' => null,
            'seo_description' => null,
            'content' => [
                'vision' => 'رؤية',
                'mission' => 'رسالة',
                'values' => [],
            ],
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'slug' => 'home',
            'title' => 'عنوان جديد',
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
            'title' => 'الرئيسية',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/home', [
            'title' => 'الرئيسية',
            'seo_title' => null,
            'seo_description' => null,
            'is_admin' => false,
            'content' => [
                'vision' => 'رؤية',
                'mission' => 'رسالة',
                'values' => [],
            ],
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'slug' => 'home',
            'title' => 'الرئيسية',
        ]);

        $this->assertTrue((bool) $admin->fresh()->is_admin);
    }

    public function test_admin_can_update_about_page(): void
    {
        $admin = $this->createAdmin();

        Page::create([
            'slug' => 'about',
            'title' => 'من نحن',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/about', [
            'title' => 'من نحن',
            'seo_title' => 'من نحن | شركة الجوبي',
            'seo_description' => 'تعرف على الشركة.',
            'content' => [
                'intro' => 'نبذة عن الشركة.',
                'timeline' => [
                    [
                        'year' => '2000',
                        'title' => 'مرحلة تجريبية',
                        'body' => 'وصف المرحلة.',
                    ],
                ],
                'expertise' => [
                    [
                        'title' => 'المقاولات',
                        'body' => 'خبرة في مجال المقاولات.',
                    ],
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.content.intro', 'نبذة عن الشركة.');

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
            'title' => 'مشاريعنا',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/projects', [
            'title' => 'مشاريعنا',
            'seo_title' => 'مشاريعنا | شركة الجوبي',
            'seo_description' => 'تعرف على مشاريع الشركة.',
            'content' => [
                'intro' => 'نفخر بمشاريعنا.',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.content.intro', 'نفخر بمشاريعنا.');

        $this->assertSame(
            'نفخر بمشاريعنا.',
            Page::where('slug', 'projects')->firstOrFail()->content['intro']
        );
    }

    public function test_admin_can_update_contact_page(): void
    {
        $admin = $this->createAdmin();

        Page::create([
            'slug' => 'contact',
            'title' => 'تواصل معنا',
            'content' => null,
        ]);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/pages/contact', [
            'title' => 'تواصل معنا',
            'seo_title' => 'تواصل معنا | شركة الجوبي',
            'seo_description' => 'تواصل مع الشركة.',
            'content' => [
                'intro' => 'يسعدنا تواصلك معنا.',
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.content.intro', 'يسعدنا تواصلك معنا.');

        $this->assertSame(
            'يسعدنا تواصلك معنا.',
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
                'values' => [],
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
