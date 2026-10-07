<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'slug' => 'home',
                'title' => 'الرئيسية',
            ],
            [
                'slug' => 'about',
                'title' => 'من نحن',
            ],
            [
                'slug' => 'projects',
                'title' => 'المشاريع',
            ],
            [
                'slug' => 'contact',
                'title' => 'تواصل معنا',
            ],
        ];

        foreach ($pages as $page) {
            Page::updateOrCreate(
                ['slug' => $page['slug']],
                [
                    'title' => $page['title'],
                    'seo_title' => null,
                    'seo_description' => null,
                    'content' => null,
                ]
            );
        }
    }
}
