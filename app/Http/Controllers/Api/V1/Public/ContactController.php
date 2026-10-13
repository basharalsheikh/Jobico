<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ContactController extends Controller
{
    /**
     * Store a new contact message and queue its email notification.
     */
    public function store(Request $request)
    {
        // Validate the incoming contact form data.
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        // Get the configured email address for contact notifications.
        $notificationEmail = config('mail.contact_notification_email');

        // Stop if the notification email is not configured.
        if (! $notificationEmail) {
            throw ValidationException::withMessages([
                'email' => 'Contact notification email is not configured.',
            ]);
        }

        // Generate a unique ID for this contact request.
        $data['request_id'] = (string) Str::uuid();

        // Set the initial notification status.
        $data['mail_status'] = 'queued';

        // Save the contact message in the database.
        $message = ContactMessage::create($data);

        // Queue the email notification.
        Mail::to($notificationEmail)->queue(
            new ContactMessageReceived($message)
        );

        // Return the created contact message.
        return response()->json([
            'message' => 'Contact message received successfully. Email notification queued.',
            'data' => $message,
        ], 201);
    }
}
