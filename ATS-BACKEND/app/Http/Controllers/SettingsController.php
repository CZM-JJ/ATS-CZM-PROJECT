<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * GET /api/settings/permissions
     * Accessible by all authenticated users (needed to gate the UI).
     */
    public function getPermissions(): JsonResponse
    {
        $permissions = Setting::get('permissions', config('applicants.permissions'));

        return response()->json($permissions);
    }

    /**
     * PUT /api/settings/permissions
     * Admin only. Validates + saves the permission matrix.
     */
    public function updatePermissions(Request $request): JsonResponse
    {
        $roles = config('applicants.roles');
        $rolesString = implode(',', $roles);

        $data = $request->validate([
            'canEdit' => ['required', 'array'],
            'canEdit.*' => ['string', 'in:'.$rolesString],
            'canDelete' => ['required', 'array'],
            'canDelete.*' => ['string', 'in:'.$rolesString],
            'canManagePositions' => ['required', 'array'],
            'canManagePositions.*' => ['string', 'in:'.$rolesString],
            'canViewAnalytics' => ['required', 'array'],
            'canViewAnalytics.*' => ['string', 'in:'.$rolesString],
            'canManageUsers' => ['required', 'array'],
            'canManageUsers.*' => ['string', 'in:'.$rolesString],
        ]);

        // Admin must always keep all permissions — enforce it silently.
        foreach ($data as $perm => $roles) {
            if (! in_array('admin', $roles, true)) {
                $data[$perm][] = 'admin';
            }
        }

        Setting::set('permissions', $data);

        return response()->json($data);
    }
}
