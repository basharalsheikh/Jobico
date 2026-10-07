<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SiteSetting::updateOrCreate(
            ['id' => 1],
            [
                'company_name' => 'شركة الجوبي للتجارة والمقاولات',
                 'logo_media_id' => null,
                 'hero_mode' => 'image',
                 'address' => null,
                 'phones' => [],
                 'emails' => [],
                 'map_url' => null,
            ]
        );
    }
}
