<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteSetting extends Model
{
    protected $fillable = [
        'company_name',
        'logo_media_id',
        'hero_mode',
        'address',
        'phones',
        'emails',
        'map_url',
    ];

    protected function casts(): array
    {
        return [
            'phones' => 'array',
            'emails' => 'array',
        ];
    }

    public function logoMedia(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'logo_media_id');
    }
}
