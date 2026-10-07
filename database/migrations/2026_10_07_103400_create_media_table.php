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
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('disk',500);
            $table->string('path',500);
            $table->string('mime',100);
            $table->unsignedBigInteger('width')->nullable();
            $table->unsignedBigInteger('hieght')->nullable();
            $table->string('alt',300)->nullable();
            $table->foreignId('uploaded_by')
            ->nullable()
            ->constrained('users')
            ->nullOnDelete()
            ->nullOnDelete();
            $table->timestamps();
            $table->index('mime');
            $table->index('uploaded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
