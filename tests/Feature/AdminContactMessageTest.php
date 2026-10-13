<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminContactMessageTest extends TestCase
{
    use RefreshDatabase;

    // Create an authenticated admin user for the tests.
    private function admin(): User
    {
        return User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    // Create a contact message with valid test data.
    private function createMessage(array $attributes = []): ContactMessage
    {
        return ContactMessage::create(array_merge([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => null,
            'subject' => 'Test Subject',
            'body' => 'This is a test message.',
            'request_id' => (string) Str::uuid(),
            'mail_status' => 'queued',
        ], $attributes));
    }

    // Test that an admin can retrieve the paginated contact messages.
    public function test_admin_can_list_contact_messages(): void
    {
        $admin = $this->admin();

        $this->createMessage();
        $this->createMessage(['email' => 'second@example.com']);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/contact-messages');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'per_page',
                'total',
            ])
            ->assertJsonPath('total', 2);
    }

    // Test that the read=true filter returns only messages that have been read.
    public function test_admin_can_filter_read_messages(): void
    {
        $admin = $this->admin();

        $this->createMessage([
            'read_at' => now(),
        ]);

        $this->createMessage([
            'email' => 'unread@example.com',
            'read_at' => null,
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/contact-messages?read=true');

        $response->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.email', 'test@example.com');
    }

    // Test that the read=false filter returns only unread messages.
    public function test_admin_can_filter_unread_messages(): void
    {
        $admin = $this->admin();

        $this->createMessage([
            'read_at' => now(),
        ]);

        $this->createMessage([
            'email' => 'unread@example.com',
            'read_at' => null,
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/contact-messages?read=false');

        $response->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.email', 'unread@example.com');
    }

    // Test that an invalid read filter returns HTTP 422.
    public function test_admin_cannot_use_an_invalid_read_filter(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/contact-messages?read=maybe');

        $response->assertStatus(422)
            ->assertJsonPath(
                'message',
                'The read filter must be true or false.'
            );
    }

    // Test that an admin can retrieve one contact message by its ID.
    public function test_admin_can_view_a_contact_message(): void
    {
        $admin = $this->admin();
        $message = $this->createMessage();

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/admin/contact-messages/{$message->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $message->id)
            ->assertJsonPath('data.email', 'test@example.com');
    }

    // Test that requesting a nonexistent contact message returns HTTP 404.
    public function test_missing_contact_message_returns_404(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/contact-messages/999999');

        $response->assertNotFound();
    }

    // Test that an admin can mark an unread contact message as read.
    public function test_admin_can_mark_a_contact_message_as_read(): void
    {
        $admin = $this->admin();
        $message = $this->createMessage([
            'read_at' => null,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson(
                "/api/v1/admin/contact-messages/{$message->id}/read"
            );

        $response->assertOk()
            ->assertJsonPath(
                'message',
                'Contact message marked as read.'
            )
            ->assertJsonPath('data.id', $message->id);

        $this->assertNotNull($message->fresh()->read_at);
    }

    // Test that marking an already-read message does not change its read timestamp.
    public function test_marking_an_already_read_message_preserves_its_timestamp(): void
    {
        $admin = $this->admin();
        $readAt = now()->subDay();

        $message = $this->createMessage([
            'read_at' => $readAt,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson(
                "/api/v1/admin/contact-messages/{$message->id}/read"
            );

        $response->assertOk();

        $this->assertEquals(
            $readAt->timestamp,
            $message->fresh()->read_at->timestamp
        );
    }

    // Test that marking a nonexistent contact message as read returns HTTP 404.
    public function test_marking_a_missing_contact_message_as_read_returns_404(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
            ->patchJson('/api/v1/admin/contact-messages/999999/read');

        $response->assertNotFound();
    }
}
