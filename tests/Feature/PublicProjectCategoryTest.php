<?php

namespace Tests\Feature;

use App\Models\ProjectCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProjectCategoryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure the public endpoint returns only active categories in sort order.
     */
    public function test_public_categories_returns_only_active_categories_in_sort_order(): void
    {
        ProjectCategory::create([
            'name' => 'Second Category',
            'slug' => 'second-category',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        ProjectCategory::create([
            'name' => 'Inactive Category',
            'slug' => 'inactive-category',
            'sort_order' => 1,
            'is_active' => false,
        ]);

        ProjectCategory::create([
            'name' => 'First Category',
            'slug' => 'first-category',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/project-categories');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.slug', 'first-category')
            ->assertJsonPath('data.1.slug', 'second-category');
    }

    /**
     * Ensure the endpoint returns an empty list when no active categories exist.
     */
    public function test_public_categories_returns_empty_list_when_no_categories_are_active(): void
    {
        ProjectCategory::create([
            'name' => 'Inactive Category',
            'slug' => 'inactive-category',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/project-categories');

        $response->assertOk()
            ->assertExactJson([
                'data' => [],
            ]);
    }
}
