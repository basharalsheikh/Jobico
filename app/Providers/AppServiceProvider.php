<?php

namespace App\Providers;

use App\Listeners\UpdateContactMessageMailStatus;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Listen for successfully sent email notifications.
        Event::listen(
            MessageSent::class,
            UpdateContactMessageMailStatus::class
        );

        // Configure rate limits for login attempts.
        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(5)->by(
                    strtolower($request->input('email', '')).'|'.$request->ip()
                ),
                Limit::perMinute(30)->by($request->ip()),
            ];
        });
    }
}
