<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug',50)->unique();
            $table->string('title',200);
            $table->string('seo_title',200)->nullable();
            $table->string('seo_description',500)->nullable();
            $table->json('content')->nullable();
            $table->foreignId('updated_by')
            ->nullable()
            ->constrained('users')
            ->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
