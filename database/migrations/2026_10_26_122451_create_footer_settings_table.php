<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('footer_settings', function (Blueprint $table) {
            $table->id();

            $table->string('company_name')->default('JOBICO');
            $table->string('subtitle')->default('CONTRACTING & TRADING');

            $table->text('address')->nullable();

            $table->json('phones')->nullable();
            $table->json('emails')->nullable();

            $table->string('cta_title')->default("LET'S BUILD SOMETHING LASTING");
            $table->string('cta_line_1')->default('Have a project');
            $table->string('cta_line_2')->default('in mind?');
            $table->string('cta_button_text')->default('GET STARTED');

            $table->string('copyright_text')->default('ALL RIGHTS RESERVED.');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('footer_settings');
    }
};
