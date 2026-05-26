<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApplicantResource;
use App\Models\Applicant;
use App\Models\AuditLog;
use App\Models\User;
use App\Notifications\ApplicantStatusUpdated;
use App\Notifications\ApplicantSubmissionReceived;
use App\Notifications\ApplicantSubmitted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicantController extends Controller
{
    public function index(Request $request)
    {
        $query = Applicant::query();

        $this->applyArchivedFilter($query, $request);
        $this->applySearchFilter($query, $request);
        $this->applyStatusFilter($query, $request);
        $this->applyFieldFilters($query, $request);
        $this->applyDateFilters($query, $request);

        return ApplicantResource::collection($this->applySorting($query, $request));
    }

    public function store(Request $request)
    {
        $applicant = $this->createApplicant($request, false, false);

        AuditLog::log('create', 'applicant', $applicant->id,
            $applicant->last_name.', '.$applicant->first_name,
            "Created applicant '{$applicant->last_name}, {$applicant->first_name}'");

        return (new ApplicantResource($applicant))->response()->setStatusCode(201);
    }

    public function storePublic(Request $request): JsonResponse
    {
        $antiSpamResponse = $this->runPublicAntiSpamChecks($request);
        if ($antiSpamResponse !== null) {
            return $antiSpamResponse;
        }

        // Public submissions should still receive a confirmation email.
        $applicant = $this->createApplicant($request, true, true);

        return (new ApplicantResource($applicant))->response()->setStatusCode(201);
    }

    public function show(Applicant $applicant)
    {
        return new ApplicantResource($applicant);
    }

    public function update(Request $request, Applicant $applicant)
    {
        $previousStatus = $applicant->status;
        $data = $this->validateApplicant($request, true);
        $cvDisk = $this->cvDisk();

        if ($request->hasFile('upload_cv')) {
            if ($applicant->cv_path) {
                Storage::disk($cvDisk)->delete($applicant->cv_path);
            }

            $data['cv_path'] = $request->file('upload_cv')->store('cvs', $cvDisk);
        }

        unset($data['upload_cv']);

        $applicant->update(array_merge($data, [
            'updated_by' => auth()->id(),
        ]));

        $fullName = $applicant->last_name.', '.$applicant->first_name;

        if ($previousStatus !== $applicant->status) {
            AuditLog::log('status_change', 'applicant', $applicant->id, $fullName,
                "Status changed: {$previousStatus} → {$applicant->status} for '{$fullName}'");

            // Send in-app notification to all admin/recruiter users
            $recipients = User::query()->get();
            if ($recipients->isNotEmpty()) {
                Notification::send($recipients, new ApplicantStatusUpdated($applicant, $previousStatus, $applicant->status));
            }
        } else {
            AuditLog::log('update', 'applicant', $applicant->id, $fullName,
                "Updated applicant '{$fullName}'");
        }

        return new ApplicantResource($applicant);
    }

    public function destroy(Applicant $applicant): Response
    {
        $fullName = $applicant->last_name.', '.$applicant->first_name;
        $applicantId = $applicant->id;

        $applicant->delete();

        AuditLog::log('archive', 'applicant', $applicantId, $fullName,
            "Archived applicant '{$fullName}'");

        return response()->noContent();
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'exists:applicants,id'],
        ]);

        $applicants = Applicant::whereIn('id', $request->input('ids'))->get();

        foreach ($applicants as $applicant) {
            $fullName = $applicant->last_name.', '.$applicant->first_name;
            $applicant->delete();
            AuditLog::log('archive', 'applicant', $applicant->id, $fullName,
                "Bulk-archived applicant '{$fullName}'");
        }

        return response()->json(['archived' => $applicants->count()]);
    }

    public function restore(int $applicantId): JsonResponse
    {
        $applicant = Applicant::onlyTrashed()->findOrFail($applicantId);

        $applicant->restore();

        $fullName = $applicant->last_name.', '.$applicant->first_name;
        AuditLog::log('restore', 'applicant', $applicant->id, $fullName,
            "Restored applicant '{$fullName}'");

        return (new ApplicantResource($applicant->fresh()))->response();
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'exists:applicants,id'],
        ]);

        $applicants = Applicant::onlyTrashed()
            ->whereIn('id', $request->input('ids'))
            ->get();

        foreach ($applicants as $applicant) {
            $fullName = $applicant->last_name.', '.$applicant->first_name;
            $applicant->restore();
            AuditLog::log('restore', 'applicant', $applicant->id, $fullName,
                "Bulk-restored applicant '{$fullName}'");
        }

        return response()->json(['restored' => $applicants->count()]);
    }

    public function forceDestroy(int $applicantId): Response
    {
        $applicant = Applicant::withTrashed()->findOrFail($applicantId);

        if (! $applicant->trashed()) {
            return response()->json([
                'message' => 'Applicant must be archived before permanent deletion.',
            ], 422);
        }

        $fullName = $applicant->last_name.', '.$applicant->first_name;
        $applicantId = $applicant->id;

        if ($applicant->cv_path) {
            Storage::disk($this->cvDisk())->delete($applicant->cv_path);
        }

        $applicant->forceDelete();

        AuditLog::log('force_delete', 'applicant', $applicantId, $fullName,
            "Permanently deleted applicant '{$fullName}'");

        return response()->noContent();
    }

    public function bulkForceDestroy(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'exists:applicants,id'],
        ]);

        $applicants = Applicant::onlyTrashed()
            ->whereIn('id', $request->input('ids'))
            ->get();

        $cvDisk = $this->cvDisk();

        foreach ($applicants as $applicant) {
            $fullName = $applicant->last_name.', '.$applicant->first_name;
            if ($applicant->cv_path) {
                Storage::disk($cvDisk)->delete($applicant->cv_path);
            }
            $applicant->forceDelete();
            AuditLog::log('force_delete', 'applicant', $applicant->id, $fullName,
                "Bulk-permanently deleted applicant '{$fullName}'");
        }

        return response()->json(['deleted' => $applicants->count()]);
    }

    public function cvDownload(int $applicantId): Response|JsonResponse|StreamedResponse
    {
        $applicant = Applicant::withTrashed()->findOrFail($applicantId);
        $path = $applicant->cv_path;

        if (! $path) {
            return response()->json(['message' => 'No CV uploaded for this applicant.'], 404);
        }

        $cvDisk = Storage::disk($this->cvDisk());

        if (! $cvDisk->exists($path)) {
            return response()->json(['message' => 'CV file not found on storage.'], 404);
        }

        $mimeType = $cvDisk->mimeType($path) ?: 'application/octet-stream';
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        // Sanitize filename to prevent header injection
        $baseName = str_replace(['"', "'", "\n", "\r"], '', $applicant->last_name.'_'.$applicant->first_name);
        $filename = $baseName.'_CV.'.$extension;
        $stream = $cvDisk->readStream($path);

        if (! is_resource($stream)) {
            return response()->json(['message' => 'Unable to read CV from storage.'], 500);
        }

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'X-CV-Storage-Disk' => $this->cvDisk(),
        ];

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, $headers);
    }

    /**
     * Apply archived filter to the query.
     */
    private function applyArchivedFilter($query, Request $request): void
    {
        $archivedMode = strtolower(trim((string) $request->input('archived', 'exclude')));
        if ($archivedMode === 'only') {
            $query->onlyTrashed();
        } elseif ($archivedMode === 'with') {
            $query->withTrashed();
        }
    }

    /**
     * Apply search filter to the query.
     */
    private function applySearchFilter($query, Request $request): void
    {
        if ($request->filled('search')) {
            $search = mb_strtolower(trim((string) $request->string('search')));
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(email_address) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(contact_number) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(position_applied_for) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(permanent_address) LIKE ?', ["%{$search}%"]);
            });
        }
    }

    /**
     * Apply status filter to the query.
     */
    private function applyStatusFilter($query, Request $request): void
    {
        if ($request->filled('status')) {
            $statuses = array_values(array_filter(array_map(
                static fn ($status) => mb_strtolower(trim((string) $status)),
                explode(',', (string) $request->string('status'))
            )));
            if (count($statuses) === 1) {
                $query->whereRaw('LOWER(status) = ?', [$statuses[0]]);
            } elseif (count($statuses) > 1) {
                $query->whereRaw('LOWER(status) IN ('.implode(',', array_fill(0, count($statuses), '?')).')', $statuses);
            }
        }
    }

    /**
     * Apply field-specific filters (position, gender, education, etc.).
     */
    private function applyFieldFilters($query, Request $request): void
    {
        if ($request->filled('position')) {
            $query->whereRaw('LOWER(position_applied_for) = ?', [mb_strtolower(trim((string) $request->string('position')))]);
        }

        if ($request->filled('gender')) {
            $query->whereRaw('LOWER(gender) = ?', [mb_strtolower(trim((string) $request->string('gender')))]);
        }

        if ($request->filled('education')) {
            $query->whereRaw('LOWER(highest_education_level) = ?', [mb_strtolower(trim((string) $request->string('education')))]);
        }

        if ($request->filled('vacancy_source')) {
            $query->whereRaw('LOWER(vacancy_source) = ?', [mb_strtolower(trim((string) $request->string('vacancy_source')))]);
        }

        if ($request->filled('location')) {
            $query->whereRaw('LOWER(preferred_work_location) LIKE ?', ['%'.mb_strtolower(trim((string) $request->string('location'))).'%']);
        }

        if ($request->filled('salary_min')) {
            $query->where('expected_salary', '>=', (float) $request->input('salary_min'));
        }

        if ($request->filled('salary_max')) {
            $query->where('expected_salary', '<=', (float) $request->input('salary_max'));
        }

        if ($request->filled('experience_min')) {
            $query->where('total_work_experience_years', '>=', (float) $request->input('experience_min'));
        }

        if ($request->filled('experience_max')) {
            $query->where('total_work_experience_years', '<=', (float) $request->input('experience_max'));
        }

        if ($request->filled('age_min')) {
            $query->where('age', '>=', (int) $request->input('age_min'));
        }

        if ($request->filled('age_max')) {
            $query->where('age', '<=', (int) $request->input('age_max'));
        }

        if ($request->filled('updated_by')) {
            $query->where('updated_by', $request->input('updated_by'));
        }
    }

    /**
     * Apply date range filters.
     */
    private function applyDateFilters($query, Request $request): void
    {
        $startDate = $request->date('start_date');
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        $endDate = $request->date('end_date');
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }
    }

    /**
     * Apply sorting and pagination to the query.
     */
    private function applySorting($query, Request $request): LengthAwarePaginator
    {
        $sort = strtolower(trim((string) $request->input('sort', 'status')));
        $direction = strtolower(trim((string) $request->input('direction', 'asc')));
        $allowedSorts = ['created_at', 'last_name', 'first_name', 'status', 'expected_salary', 'total_work_experience_years', 'age', 'updated_at', 'updated_by'];
        $allowedDirections = ['asc', 'desc'];


        if ($sort === 'last_status_change') {
            $sort = 'updated_at';
        }

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'status';
        }

        if (! in_array($direction, $allowedDirections, true)) {
            $direction = 'asc';
        }

        if ($sort === 'updated_by') {
            return $query
                ->leftJoin('users', 'applicants.updated_by', '=', 'users.id')
                ->orderBy('users.name', $direction)
                ->orderBy('applicants.id', 'desc')
                ->select('applicants.*')
                ->paginate($request->integer('per_page', 20));
        }

        if ($sort === 'status') {
            return $query
                ->orderByRaw($this->buildStatusOrderSQL().' '.$direction)
                ->orderBy('created_at', 'desc')
                ->paginate($request->integer('per_page', 20));
        }

        return $query->orderBy($sort, $direction)->paginate($request->integer('per_page', 20));
    }

    /**
     * Build the SQL CASE statement for status ordering.
     */
    private function buildStatusOrderSQL(): string
    {
        $statusOrder = config('applicants.status_order');
        $cases = [];
        $allowedStatuses = array_keys($statusOrder);

        foreach ($statusOrder as $status => $order) {
            if (in_array($status, $allowedStatuses, true)) {
                $cases[] = "WHEN '{$status}' THEN {$order}";
            }
        }

        return 'CASE status '.implode(' ', $cases).' ELSE 9 END';
    }

    private function validateApplicant(Request $request, bool $isUpdate = false): array
    {
        $required = $isUpdate ? 'sometimes|required' : 'required';

        return $request->validate([
            'position_applied_for' => [$required, 'string', 'max:255'],
            'last_name' => [$required, 'string', 'max:255'],
            'first_name' => [$required, 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'permanent_address' => [$required, 'string', 'max:2000'],
            'current_address' => [$required, 'string', 'max:2000'],
            'gender' => [$required, 'string', 'max:50'],
            'civil_status' => [$required, 'string', 'max:50'],
            'birthdate' => [$required, 'date'],
            'highest_education_level' => [$required, 'string', 'max:50'],
            'bachelors_degree_course' => ['nullable', 'string', 'max:255'],
            'year_graduated' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'last_school_attended' => [$required, 'string', 'max:255'],
            'prc_license' => ['nullable', 'string', 'max:255'],
            'total_work_experience_years' => ['nullable', 'numeric', 'min:0', 'max:60'],
            'contact_number' => [$required, 'string', 'max:32'],
            'email_address' => [$required, 'email', 'max:255'],
            'expected_salary' => ['nullable', 'numeric', 'min:0'],
            'preferred_work_location' => [$required, 'string', 'max:255'],
            'upload_cv' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'vacancy_source' => ['nullable', 'string', 'max:255'],
            'status' => $isUpdate
                ? ['sometimes', 'string', Rule::in($this->allowedStatuses())]
                : ['prohibited'],
        ]);
    }

    private function runPublicAntiSpamChecks(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'website' => ['nullable', 'string', 'max:255'],
            'form_started_at' => ['nullable', 'integer', 'min:0'],
        ]);

        // Honeypot field should stay empty for real users.
        if ($request->filled('website')) {
            $this->logPublicSpamBlock($request, 'honeypot_filled');

            return response()->json([
                'message' => 'Your application has been submitted. We will update you after review through email.',
            ], 201);
        }

        $startedAt = (int) $request->input('form_started_at', 0);
        if ($startedAt > 0) {
            $elapsedMs = (int) round(microtime(true) * 1000) - $startedAt;

            // Very fast submission usually indicates bot behavior.
            if ($elapsedMs >= 0 && $elapsedMs < 6000) {
                $this->logPublicSpamBlock($request, 'submitted_too_fast', [
                    'elapsed_ms' => $elapsedMs,
                ]);

                return response()->json([
                    'message' => 'Your application has been submitted. We will update you after review through email.',
                ], 201);
            }
        }

        $email = trim((string) $request->input('email_address', ''));
        if ($email !== '') {
            $duplicateExists = Applicant::query()
                ->where('email_address', $email)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->exists();

            if ($duplicateExists) {
                $this->logPublicSpamBlock($request, 'duplicate_email_cooldown', [
                    'cooldown_minutes' => 5,
                ]);

                return response()->json([
                    'message' => 'A recent application with this email was already submitted. Please wait a few minutes before trying again.',
                ], 429);
            }
        }

        return null;
    }

    private function logPublicSpamBlock(Request $request, string $reason, array $context = []): void
    {
        Log::warning('Public applicant submission blocked by anti-spam', array_merge([
            'reason' => $reason,
            'ip' => $request->ip(),
            'email' => (string) $request->input('email_address', ''),
            'user_agent' => (string) $request->userAgent(),
            'route' => $request->path(),
            'submitted_at' => now()->toIso8601String(),
        ], $context));
    }

    private function createApplicant(
        Request $request,
        bool $sendApplicantEmail,
        bool $sendAdminNotifications = true
    ): Applicant {
        $data = $this->validateApplicant($request);
        $data['status'] = 'new';
        $data['age'] = \Carbon\Carbon::parse($data['birthdate'])->age;

        // Attempt to determine company_id from position_applied_for
        if (!empty($data['position_applied_for'])) {
            $position = \App\Models\Position::where('title', $data['position_applied_for'])->first();
            if ($position) {
                $data['company_id'] = $position->company_id;
            }
        }

        if ($request->hasFile('upload_cv')) {
            $data['cv_path'] = $request->file('upload_cv')->store('cvs', $this->cvDisk());
        }

        unset($data['upload_cv']);

        $applicant = Applicant::create($data);

        if ($sendApplicantEmail && $applicant->email_address) {
            // Send confirmation email to applicant
            Notification::route('mail', $applicant->email_address)
                ->notify(new ApplicantSubmissionReceived($applicant));
        }

        if ($sendAdminNotifications) {
            // Create in-app notifications for ATS users (admins/recruiters)
            $recipients = User::query()->get();
            if ($recipients->isNotEmpty()) {
                Notification::send($recipients, new ApplicantSubmitted($applicant));
            }
        }

        return $applicant;
    }

    private function allowedStatuses(): array
    {
        return config('applicants.statuses');
    }

    private function cvDisk(): string
    {
        return (string) config('filesystems.cv_disk', 'public');
    }
}
