<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
     protected $fillable = [
      'name',
      'email',
      'phone',
      'subject',
      'body',
      'read_at',
     'mail_status',
     'request_id',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }
}
