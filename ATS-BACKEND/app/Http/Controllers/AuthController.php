<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => ['required', 'email'],
                'password' => ['required', 'string'],
            ]);

            $user = User::where('email', $data['email'])->first();

            if (!$user || !Hash::check($data['password'], $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            \Illuminate\Support\Facades\Log::info('TOKEN GENERATED', [
                'user_id' => $user->id,
                'token' => $token
            ]);

            AuditLog::log('login', 'token', null, $user->email,
                "User '{$user->name}' logged in",
                $user->id, $user->name);

            return response()->json([
                'user' => new UserResource($user),
                'token' => $token,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Login error: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return response()->json([
                'message' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            AuditLog::log('logout', 'token', null, $user->email,
                "User '{$user->name}' logged out",
                $user->id, $user->name);

            // Revoke the token that was used for the request
            $user->currentAccessToken()->delete();
        }

        return response()->noContent();
    }

    public function me(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('ME request', [
            'token' => $request->bearerToken(),
            'user' => $request->user() ? $request->user()->id : 'null'
        ]);
        return new UserResource($request->user());
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink($data);

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => __($status)]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $data,
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => __($status)]);
    }
}
