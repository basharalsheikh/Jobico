<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSiteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure the public site endpoint returns the configured settings.
     */
    public function test_public_site_endpoint_returns_settings(): void
    {
        SiteSetting::create([
            'company_name' => 'Jobico',
            'hero_mode' => 'image',
            'address' => 'Damascus, Syria',
            'phones' => ['+963900000000'],
            'emails' => ['info@jobico.example'],
        ]);

        $response = $this->getJson('/api/v1/site');

        $response->assertOk()
            ->assertJsonPath('data.company_name', 'Jobico')
            ->assertJsonPath('data.hero_mode', 'image')
            ->assertJsonPath('data.address', 'Damascus, Syria')
            ->assertJsonPath('data.phones.0', '+963900000000')
            ->assertJsonPath('data.emails.0', 'info@jobico.example');
    }

    /**
     * Ensure the endpoint returns null when site settings are missing.
     */
    public function test_public_site_endpoint_returns_null_when_settings_are_missing(): void
    {
        $response = $this->getJson('/api/v1/site');

        $response->assertOk()
            ->assertExactJson([
                'data' => null,
            ]);
    }
}
