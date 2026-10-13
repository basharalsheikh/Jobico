<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    // Retrieve contact messages with optional read-status filtering and pagination.
    public function index(Request $request): JsonResponse
    {
        $query = ContactMessage::query()
            ->latest();

        if ($request->has('read')) {
            $read = filter_var(
                $request->query('read'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($read === null) {
                return response()->json([
                    'message' => 'The read filter must be true or false.',
                ], 422);
            }

            if ($read) {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        return response()->json(
            $query->paginate(15)
        );
    }

    // Get the details of a single contact message.
    public function show(int $id): JsonResponse
    {
        $message = ContactMessage::findOrFail($id);

        return response()->json([
            'data' => $message,
        ]);
    }

    // Mark a contact message as read.
    public function markAsRead(int $id): JsonResponse
    {
        $message = ContactMessage::findOrFail($id);

        if ($message->read_at === null) {
            $message->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Contact message marked as read.',
            'data' => $message->fresh(),
        ]);
    }
}
