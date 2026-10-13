<?php

namespace Tests\Feature;

use App\Mail\ContactMessageReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PublicContactTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure a valid contact message is saved and its email is queued.
     */
    public function test_valid_contact_message_is_saved_and_email_is_queued(): void
    {
        config(['mail.contact_notification_email' => 'admin@example.com']);

        Mail::fake();

        $response = $this->postJson('/api/v1/contact', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '123456789',
            'subject' => 'Test Subject',
            'body' => 'This is a test contact message.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Test User')
            ->assertJsonPath('data.mail_status', 'queued');

        $this->assertDatabaseHas('contact_messages', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'subject' => 'Test Subject',
            'mail_status' => 'queued',
        ]);

        $this->assertDatabaseCount('contact_messages', 1);

        Mail::assertQueued(ContactMessageReceived::class);
    }

    /**
     * Ensure required fields and invalid email addresses are rejected.
     */
    public function test_invalid_contact_data_is_rejected(): void
    {
        config(['mail.contact_notification_email' => 'admin@example.com']);

        $response = $this->postJson('/api/v1/contact', [
            'name' => '',
            'email' => 'invalid-email',
            'body' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'body',
            ]);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    /**
     * Ensure the message is not saved when the notification email is missing.
     */
    public function test_contact_message_is_not_saved_when_notification_email_is_missing(): void
    {
        config(['mail.contact_notification_email' => null]);

        Mail::fake();

        $response = $this->postJson('/api/v1/contact', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'body' => 'This is a test contact message.',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('contact_messages', 0);

        Mail::assertNothingQueued();
    }
}
