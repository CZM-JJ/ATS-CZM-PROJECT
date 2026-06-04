<?php

namespace App\Http\Controllers;

use App\Http\Resources\PositionResource;
use App\Models\AuditLog;
use App\Models\Position;
use App\Models\User;
use App\Notifications\PositionCreatedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Notification\Notification;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class PositionController extends Controller
{
    public function index(Request $request)
    {
        $query = Position::query()->with('company');

        $this->applySearchFilter($query, $request);
        $this->applyStatusFilter($query, $request);

        return PositionResource::collection($this->applySorting($query, $request));
    }

    private function applySearchFilter($query, Request $request): void
    {
        if ($request->filled('search')) {
            $search = mb_strtolower(trim((string) $request->string('search')));
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(location) LIKE ?', ["%{$search}%"])
                    ->orWhereHas('company', function ($q) use ($search) {
                        $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"]);
                    });
            });
        }
    }

    private function applyStatusFilter($query, Request $request): void
    {
        if ($request->filled('status')) {
            $status = mb_strtolower(trim((string) $request->string('status')));
            $query->whereRaw('LOWER(status) = ?', [$status]);
        }
    }

    private function applySorting($query, Request $request): LengthAwarePaginator
    {
        $sort = strtolower(trim((string) $request->input('sort', 'created_at')));
        $direction = strtolower(trim((string) $request->input('direction', 'desc')));
        $allowedSorts = ['title', 'location', 'created_at', 'status', 'id'];
        $allowedDirections = ['asc', 'desc'];

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        if (! in_array($direction, $allowedDirections, true)) {
            $direction = 'desc';
        }

        return $query->orderBy($sort, $direction)
                     ->orderBy('id', 'desc')
                     ->paginate($request->integer('per_page', 20));
    }

    public function publicIndex()
    {
        return PositionResource::collection(Position::query()
            ->where('is_active', true)
            ->orderBy('title')
            ->get());
    }

    public function all()
    {
        return PositionResource::collection(Position::query()
            ->orderBy('title')
            ->get());
    }

    public function vacancyRequests()
    {
        return PositionResource::collection(Position::query()
            ->where('status', 'pending')
            ->with('company')
            ->latest()
            ->get());
    }

    public function approveRequest(Request $request, Position $position)
    {
        // Verify BU access or Admin/HR role
        if (! in_array(auth()->user()->role, ['admin', 'recruiter_lead', 'hr_manager', 'hr_supervisor']) &&
            ! auth()->user()->companies()->where('companies.id', $position->company_id)->exists()) {
            abort(403, 'You are not authorized to approve positions for this company.');
        }

        $position->update([
            'status' => 'active',
            'is_active' => true,
        ]);

        AuditLog::log('update', 'position', $position->id, $position->title,
            "Approved vacancy request: Position is now active.");

        return new PositionResource($position->load('company'));
    }

    public function rejectRequest(Request $request, Position $position)
    {
        if (! in_array(auth()->user()->role, ['admin', 'recruiter_lead', 'hr_manager', 'hr_supervisor']) &&
            ! auth()->user()->companies()->where('companies.id', $position->company_id)->exists()) {
            abort(403, 'You are not authorized to reject positions for this company.');
        }

        $position->update([
            'status' => 'rejected',
            'is_active' => false,
        ]);

        AuditLog::log('update', 'position', $position->id, $position->title,
            "Rejected vacancy request.");

        return new PositionResource($position->load('company'));
    }

    public function store(Request $request)
    {
        $validated = $this->validatePosition($request);
        $data = $this->normalizePositionData($validated);

        // Verify the user can create positions for this company
        if (! in_array(auth()->user()->role, ['admin', 'recruiter_lead', 'hr_manager', 'hr_supervisor']) &&
            ! auth()->user()->companies()->where('companies.id', $data['company_id'])->exists()) {
            return response()->json(['message' => 'You are not authorized to create positions for this company.'], 403);
        }

        // Default: create active positions directly
        $data['status'] = $data['status'] ?? 'active';
        $data['is_active'] = $data['is_active'] ?? true;

        $position = Position::create($data);

        AuditLog::log('create', 'position', $position->id, $position->title,
            "Created position '{$position->title}' with status '{$position->status}'");

        return (new PositionResource($position->load('company')))->response()->setStatusCode(201);
    }

    public function show(Position $position)
    {
        // Verify BU access
        if (! in_array(auth()->user()->role, ['admin', 'recruiter_lead', 'hr_manager', 'hr_supervisor']) &&
            ! auth()->user()->companies()->where('companies.id', $position->company_id)->exists()) {
            abort(403, 'You are not authorized to view positions for this company.');
        }

        return new PositionResource($position);
    }

    public function update(Request $request, Position $position)
    {
        // Verify BU access
        if (! in_array(auth()->user()->role, ['admin', 'recruiter_lead', 'hr_manager', 'hr_supervisor']) &&
            ! auth()->user()->companies()->where('companies.id', $position->company_id)->exists()) {
            abort(403, 'You are not authorized to update positions for this company.');
        }

        $data = $this->normalizePositionData($this->validatePosition($request, true));

        $position->update($data);

        AuditLog::log('update', 'position', $position->id, $position->title,
            "Updated position '{$position->title}'");

        return new PositionResource($position->load('company'));
    }

    public function destroy(Position $position): Response
    {
        // Verify BU access
        if (! in_array(auth()->user()->role, ['admin', 'recruiter_lead', 'hr_manager', 'hr_supervisor']) &&
            ! auth()->user()->companies()->where('companies.id', $position->company_id)->exists()) {
            abort(403, 'You are not authorized to delete positions for this company.');
        }

        $title = $position->title;
        $positionId = $position->id;

        $position->delete();

        AuditLog::log('delete', 'position', $positionId, $title,
            "Deleted position '{$title}'");

        return response()->noContent();
    }

    public function toggle(Request $request, Position $position)
    {
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $oldStatus = $position->is_active ? 'active' : 'inactive';
        $position->update([
            'is_active' => $data['is_active'],
            'status' => $data['is_active'] ? 'active' : 'inactive',
        ]);
        $newStatus = $position->is_active ? 'active' : 'inactive';

        AuditLog::log('update', 'position', $position->id, $position->title,
            "Changed status from {$oldStatus} to {$newStatus}");

        return new PositionResource($position);
    }

    private function validatePosition(Request $request, bool $isUpdate = false): array
    {
        $titleRules = $isUpdate ? ['sometimes', 'required', 'string', 'max:255'] : ['required', 'string', 'max:255'];
        $locationRules = $isUpdate ? ['sometimes', 'required', 'string', 'max:255'] : ['required', 'string', 'max:255'];

        $companyRules = ['nullable', 'exists:companies,id'];

        return $request->validate([
            'title' => $titleRules,
            'location' => $locationRules,
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes'],
            'company_id' => $companyRules,
        ]);
    }

    private function normalizePositionData(array $data): array
    {
        // If a string status is provided, normalize it and derive is_active from it.
        if (array_key_exists('status', $data)) {
            $normalized = strtolower(trim((string) $data['status']));

            $data['status'] = match ($normalized) {
                // common truthy/falsey aliases
                '1', 'true', 'yes', 'on', 'enabled', 'active' => 'active',
                '0', 'false', 'no', 'off', 'disabled', 'inactive' => 'inactive',

                // vacancy workflow
                'pending' => 'pending',
                'rejected' => 'rejected',

                default => throw ValidationException::withMessages([
                    'status' => 'The status field must be one of: active, inactive, pending, rejected.',
                ]),
            };

            $data['is_active'] = $data['status'] === 'active';
        }

        // If only a boolean is_active is provided, set a reasonable string status.
        if (! array_key_exists('status', $data) && array_key_exists('is_active', $data)) {
            $data['is_active'] = $this->normalizePositionStatusValue($data['is_active']);
            $data['status'] = $data['is_active'] ? 'active' : 'inactive';
        }

        return $data;
    }

    private function normalizePositionStatusValue(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value)) {
            return $value === 1;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));

            return match ($normalized) {
                '1', 'true', 'yes', 'on', 'active', 'enabled' => true,
                '0', 'false', 'no', 'off', 'inactive', 'disabled' => false,
                default => throw ValidationException::withMessages([
                    'status' => 'The status field must be active or inactive.',
                ]),
            };
        }

        throw ValidationException::withMessages([
            'status' => 'The status field must be active or inactive.',
        ]);
    }
}
