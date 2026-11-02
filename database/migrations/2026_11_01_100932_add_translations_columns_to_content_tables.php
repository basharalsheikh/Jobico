
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->json('translations')->nullable();
        });

        Schema::table('project_categories', function (Blueprint $table) {
            $table->json('translations')->nullable();
        });

        Schema::table('site_settings', function (Blueprint $table) {
            $table->json('translations')->nullable();
        });

        Schema::table('footer_settings', function (Blueprint $table) {
            $table->json('translations')->nullable();
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->json('translations')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        Schema::table('footer_settings', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        Schema::table('project_categories', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('translations');
        });
    }
};
