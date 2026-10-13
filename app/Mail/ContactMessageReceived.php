<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Symfony\Component\Mime\Email;

class ContactMessageReceived extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tries = 1;

    public function __construct(
        public ContactMessage $contactMessage
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Contact Message',
            using: [
                function (Email $email) {
                    // Attach the contact message ID to the email headers.
                    $email->getHeaders()->addTextHeader(
                        'X-Contact-Message-ID',
                        (string) $this->contactMessage->id
                    );
                },
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-message-received',
        );
    }

    /**
     * Handle a failed queued email.
     */
    public function failed(\Throwable $exception): void
    {
        // Mark the email notification as failed.
        ContactMessage::whereKey($this->contactMessage->id)
            ->update(['mail_status' => 'failed']);
    }
}
