<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('production')) {
            Model::preventSilentlyDiscardingAttributes();
            Model::preventAccessingMissingAttributes();
        }
    }

    public function boot(): void
    {
        \Illuminate\Http\Resources\Json\JsonResource::withoutWrapping();

        if ($this->app->environment('production')) {
            if (config('app.url')) {
                \Illuminate\Support\Facades\URL::forceScheme('https');
                \Illuminate\Support\Facades\URL::forceRootUrl(config('app.url'));
            }
        }
    }
}
