<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProjectCategoryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_create_category(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/project-categories', [
                'name' => 'Construction',
                'slug' => 'construction',
                'sort_order' => 1,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Construction')
            ->assertJsonPath('data.projects_count', 0);

        $this->assertDatabaseHas('project_categories', [
            'name' => 'Construction',
            'slug' => 'construction',
        ]);
    }

    public function test_admin_can_list_active_and_inactive_categories(): void
    {
        $admin = $this->admin();

        ProjectCategory::create([
            'name' => 'Active',
            'slug' => 'active',
            'is_active' => true,
        ]);

        ProjectCategory::create([
            'name' => 'Inactive',
            'slug' => 'inactive',
            'is_active' => false,
        ]);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/project-categories')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Active'])
            ->assertJsonFragment(['name' => 'Inactive']);
    }

    public function test_admin_can_update_category(): void
    {
        $admin = $this->admin();

        $category = ProjectCategory::create([
            'name' => 'Old Name',
            'slug' => 'old-name',
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/v1/admin/project-categories/{$category->id}", [
                'name' => 'New Name',
                'slug' => 'new-name',
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('project_categories', [
            'id' => $category->id,
            'name' => 'New Name',
            'slug' => 'new-name',
            'is_active' => false,
        ]);
    }

    public function test_admin_cannot_use_duplicate_slug(): void
    {
        $admin = $this->admin();

        ProjectCategory::create([
            'name' => 'First',
            'slug' => 'construction',
        ]);

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/project-categories', [
                'name' => 'Second',
                'slug' => 'construction',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_admin_cannot_delete_category_with_projects(): void
    {
        $admin = $this->admin();

        $category = ProjectCategory::create([
            'name' => 'Construction',
            'slug' => 'construction',
        ]);

        Project::create([
            'title' => 'School Building',
            'category_id' => $category->id,
            'status' => 'draft',
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/project-categories/{$category->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('project_categories', [
            'id' => $category->id,
        ]);
    }

    public function test_admin_can_delete_category_without_projects(): void
    {
        $admin = $this->admin();

        $category = ProjectCategory::create([
            'name' => 'Unused',
            'slug' => 'unused',
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/v1/admin/project-categories/{$category->id}")
            ->assertOk();

        $this->assertDatabaseMissing('project_categories', [
            'id' => $category->id,
        ]);
    }

    public function test_guest_cannot_create_category(): void
    {
        $this->postJson('/api/v1/admin/project-categories', [
            'name' => 'Construction',
            'slug' => 'construction',
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_category(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->postJson('/api/v1/admin/project-categories', [
                'name' => 'Construction',
                'slug' => 'construction',
            ])
            ->assertForbidden();
    }
}
