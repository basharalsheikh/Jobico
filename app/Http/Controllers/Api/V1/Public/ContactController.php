<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    // Store a new contact message
    public function store(Request $request)
    {
        // Validate the incoming contact form data
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        // Generate a unique ID for this contact request
        $data['request_id'] = (string) \Illuminate\Support\Str::uuid();

        // Save the contact message in the database
        $message = ContactMessage::create($data);
        // Mark the email notification as queued
        $message->update([
            'mail_status'=> 'queued',
        ]);

        // Send the notification email to the configured address
        $notificationEmail = config('mail.contact_notification_email');

        if ($notificationEmail) {
            Mail::to($notificationEmail)->queue(
                new ContactMessageReceived($message)
            );
        }

        // Return the created message
        return response()->json([
            'message' => 'Contact message sent successfully.',
            'data' => $message,
        ], 201);
    }
}
