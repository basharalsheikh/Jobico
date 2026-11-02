<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterSetting extends Model
{
    protected $fillable = [
        'company_name',
        'subtitle',
        'address',
        'phones',
        'emails',
        'cta_title',
        'cta_line_1',
        'cta_line_2',
        'cta_button_text',
        'copyright_text',
    ];

    protected function casts(): array
    {
        return [
            'phones' => 'array',
            'emails' => 'array',
        ];
    }
}
