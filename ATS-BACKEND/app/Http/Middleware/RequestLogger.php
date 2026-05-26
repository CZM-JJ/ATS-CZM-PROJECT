<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RequestLogger
{
    public function handle(Request $request, Closure $next)
    {
        Log::info("Incoming Request: {$request->method()} {$request->fullUrl()}", [
            'headers' => $request->headers->all(),
            'bearer_token' => $request->bearerToken(),
        ]);

        return $next($request);
    }
}
