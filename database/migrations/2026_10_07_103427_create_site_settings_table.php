<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name',200);
            $table->foreignId('logo_media_id')
            ->nullable()
            ->constrained('media')
            ->nullOnDelete();
            $table->string('hero_mode',20)->default('image');
            $table->string('address',500)->nullable();
            $table->json('phones')->nullable();
            $table->json('emails')->nullable();
            $table->text('map_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
