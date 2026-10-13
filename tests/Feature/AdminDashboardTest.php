<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    // Create an authenticated admin user for dashboard tests.
    private function admin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    // Create a project with valid test data.
    private function createProject(array $attributes = []): Project
    {
        return Project::create(array_merge([
            'title' => 'Test Project',
            'status' => 'draft',
            'sort_order' => 0,
        ], $attributes));
    }

    // Create a contact message with valid test data.
    private function createMessage(array $attributes = []): ContactMessage
    {
        return ContactMessage::create(array_merge([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'body' => 'This is a test message.',
            'request_id' => (string) Str::uuid(),
            'mail_status' => 'queued',
        ], $attributes));
    }

    // Test that the dashboard returns correct project and message statistics.
    public function test_admin_dashboard_returns_correct_statistics(): void
    {
        $admin = $this->admin();

        // Create one published project and one draft project.
        $this->createProject([
            'title' => 'Published Project',
            'status' => 'published',
        ]);

        $this->createProject([
            'title' => 'Draft Project',
            'status' => 'draft',
        ]);

        // Create one read message and one unread message.
        $this->createMessage([
            'email' => 'read@example.com',
            'read_at' => now(),
        ]);

        $this->createMessage([
            'email' => 'unread@example.com',
            'read_at' => null,
        ]);

        // Verify that the dashboard returns the correct counts.
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('projects.published', 1)
            ->assertJsonPath('projects.draft', 1)
            ->assertJsonPath('messages.total', 2)
            ->assertJsonPath('messages.unread', 1);
    }

    // Test that the dashboard returns zero counts when no records exist.
    public function test_admin_dashboard_returns_zero_counts_when_empty(): void
    {
        $admin = $this->admin();

        // Verify that all statistics are zero and there are no latest edits.
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('projects.published', 0)
            ->assertJsonPath('projects.draft', 0)
            ->assertJsonPath('messages.total', 0)
            ->assertJsonPath('messages.unread', 0)
            ->assertJsonPath('latest_edits', []);
    }

    // Test that the dashboard returns only the five latest project edits.
    public function test_admin_dashboard_returns_at_most_five_latest_edits(): void
    {
        $admin = $this->admin();

        // Create seven projects with distinct update timestamps.
        foreach (range(1, 7) as $number) {
            $project = $this->createProject([
                'title' => "Project {$number}",
            ]);

            // Assign a different update time to each project.
            Project::whereKey($project->id)->update([
                'updated_at' => now()->addMinutes($number),
            ]);
        }

        // Verify that only the five most recently updated projects are returned.
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonCount(5, 'latest_edits')
            ->assertJsonPath('latest_edits.0.title', 'Project 7')
            ->assertJsonPath('latest_edits.4.title', 'Project 3');
    }

    // Test that unauthenticated guests cannot access the admin dashboard.
    public function test_guest_cannot_access_admin_dashboard(): void
    {
        // Verify that the API returns 401 Unauthorized.
        $this->getJson('/api/v1/admin/dashboard')
            ->assertUnauthorized();
    }

    // Test that authenticated regular users cannot access the admin dashboard.
    public function test_regular_user_cannot_access_admin_dashboard(): void
    {
        // Create an active user without administrator privileges.
        $user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
        ]);

        // Verify that the API returns 403 Forbidden.
        $this->actingAs($user)
            ->getJson('/api/v1/admin/dashboard')
            ->assertForbidden();
    }
}
