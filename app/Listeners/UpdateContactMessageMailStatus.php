<?php

namespace App\Listeners;

use App\Models\ContactMessage;
use Illuminate\Mail\Events\MessageSent;

class UpdateContactMessageMailStatus
{
    /**
     * Handle the event fired after an email is successfully sent.
     */
    public function handle(MessageSent $event): void
    {
        // Retrieve the contact message ID from the email headers.
        $header = $event->message
            ->getHeaders()
            ->get('X-Contact-Message-ID');

        $messageId = $header?->getBodyAsString();

        // Stop execution if the contact message ID is missing.
        if (! $messageId) {
            return;
        }

        // Mark the email notification as sent.
        ContactMessage::whereKey($messageId)
            ->update(['mail_status' => 'sent']);
    }
}
