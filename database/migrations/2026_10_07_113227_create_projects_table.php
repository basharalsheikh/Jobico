<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();

            $table->string('title', 200);
            $table->string('location', 200)->nullable();

            $table->foreignId('category_id')
                ->nullable()
                ->constrained('project_categories')
                ->restrictOnDelete();

            $table->string('summary', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('quantity_text', 150)->nullable();

            $table->foreignId('cover_media_id')
                ->nullable()
                ->constrained('media')
                ->restrictOnDelete();

            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('sort_order')->default(0);

            $table->string('source_ref', 50)
                ->nullable()
                ->unique();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['status', 'sort_order', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
