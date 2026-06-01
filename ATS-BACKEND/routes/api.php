<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ApplicantController;
use App\Http\Controllers\ApplicantNoteController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware(['throttle:10,1'])->name('login');
Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware(['throttle:5,1']);
Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware(['throttle:5,1']);
Route::post('public/applicants', [ApplicantController::class, 'storePublic'])->middleware('throttle:60,1');
Route::get('positions', [PositionController::class, 'publicIndex']);

Route::middleware(['auth:sanctum'])->group(function (): void {
        Route::get('me', [AuthController::class, 'me']);
        Route::get('settings/permissions', [SettingsController::class, 'getPermissions']);
        Route::post('logout', [AuthController::class, 'logout']);

        // Companies / BUs - admin only
        Route::get('companies', [CompanyController::class, 'index'])->middleware('role:admin');
        Route::post('companies', [CompanyController::class, 'store'])->middleware('role:admin');
        Route::get('companies/{company}', [CompanyController::class, 'show'])->middleware('role:admin');
        Route::put('companies/{company}', [CompanyController::class, 'update'])->middleware('role:admin');
        Route::delete('companies/{company}', [CompanyController::class, 'destroy'])->middleware('role:admin');
        Route::post('companies/{company}/assign', [CompanyController::class, 'assignUser'])->middleware('role:admin');
        Route::delete('companies/{company}/remove', [CompanyController::class, 'removeUser'])->middleware('role:admin');

        // In-app notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{notificationId}/read', [NotificationController::class, 'markRead']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead']);

        // Applicants - all roles can read & add notes
        Route::get('applicants', [ApplicantController::class, 'index']);
        Route::get('applicants/{applicant}', [ApplicantController::class, 'show']);
        Route::get('applicants/{applicantId}/cv', [ApplicantController::class, 'cvDownload']);
        Route::get('applicants/{applicant}/notes', [ApplicantNoteController::class, 'index']);
        Route::get('applicants/{applicantId}/timeline', [AuditLogController::class, 'applicantTimeline']);
        Route::post('applicants/{applicant}/notes', [ApplicantNoteController::class, 'store']);

        // create / edit - dynamic permission: canEdit (with rate limiting on CV uploads)
        Route::post('applicants', [ApplicantController::class, 'store'])
            ->middleware(['perm:canEdit', 'throttle:5,1']);
        Route::put('applicants/{applicant}', [ApplicantController::class, 'update'])
            ->middleware(['perm:canEdit', 'throttle:10,1']);
        Route::patch('applicants/{applicant}', [ApplicantController::class, 'update'])
            ->middleware(['perm:canEdit', 'throttle:10,1']);

        // delete - dynamic permission: canDelete
        Route::delete('applicants', [ApplicantController::class, 'bulkDestroy'])
            ->middleware('perm:canDelete');
        Route::patch('applicants/restore', [ApplicantController::class, 'bulkRestore'])
            ->middleware('perm:canDelete');
        Route::delete('applicants/force', [ApplicantController::class, 'bulkForceDestroy'])
            ->middleware('perm:canDelete');
        Route::patch('applicants/{applicantId}/restore', [ApplicantController::class, 'restore'])
            ->middleware('perm:canDelete');
        Route::delete('applicants/{applicantId}/force', [ApplicantController::class, 'forceDestroy'])
            ->middleware('perm:canDelete');
        Route::delete('applicants/{applicant}', [ApplicantController::class, 'destroy'])
            ->middleware('perm:canDelete');

        // Analytics - dynamic permission: canViewAnalytics
        Route::get('dashboard/overview', [DashboardController::class, 'overview'])
            ->middleware('perm:canViewAnalytics');

        // Export - dynamic permission: canViewAnalytics
        Route::get('export/applicants', [ExportController::class, 'exportApplicants'])
            ->middleware('perm:canViewAnalytics');
        Route::get('export/applicants/preview', [ExportController::class, 'getExportPreview'])
            ->middleware('perm:canViewAnalytics');

        // Analytics - dynamic permission: canViewAnalytics
        Route::get('analytics/pipeline', [AnalyticsController::class, 'getPipelineMetrics'])
            ->middleware('perm:canViewAnalytics');
        Route::get('analytics/sources', [AnalyticsController::class, 'getCandidateSourceAnalytics'])
            ->middleware('perm:canViewAnalytics');
        Route::get('analytics/performance', [AnalyticsController::class, 'getHiringPerformance'])
            ->middleware('perm:canViewAnalytics');
        Route::get('analytics/time-to-hire', [AnalyticsController::class, 'getTimeToHire'])
            ->middleware('perm:canViewAnalytics');
        Route::get('analytics/dashboard', [AnalyticsController::class, 'getDashboard'])
            ->middleware('perm:canViewAnalytics');
        Route::get('analytics/date-range', [AnalyticsController::class, 'getByDateRange'])
            ->middleware('perm:canViewAnalytics');

        // Positions - dynamic permission: canManagePositions
        Route::get('positions/all', [PositionController::class, 'all']);
        Route::get('positions/admin', [PositionController::class, 'index']);
        Route::get('vacancy-requests', [PositionController::class, 'vacancyRequests'])->middleware('perm:canManagePositions');
        Route::patch('vacancy-requests/{position}/approve', [PositionController::class, 'approveRequest'])->middleware('perm:canManagePositions');
        Route::patch('vacancy-requests/{position}/reject', [PositionController::class, 'rejectRequest'])->middleware('perm:canManagePositions');
        Route::post('positions', [PositionController::class, 'store'])
            ->middleware('perm:canManagePositions');
        Route::put('positions/{position}', [PositionController::class, 'update'])
            ->middleware('perm:canManagePositions');
        Route::patch('positions/{position}', [PositionController::class, 'update'])
            ->middleware('perm:canManagePositions');
        Route::patch('positions/{position}/toggle', [PositionController::class, 'toggle'])
            ->middleware('perm:canManagePositions');
        Route::delete('positions/{position}', [PositionController::class, 'destroy'])
            ->middleware('perm:canManagePositions');

        // User management - dynamic permission: canManageUsers
        Route::get('users/list', [UserController::class, 'listUsers']);
        Route::get('users', [UserController::class, 'index'])
            ->middleware('perm:canManageUsers');
        Route::post('users', [UserController::class, 'store'])
            ->middleware('perm:canManageUsers');
        Route::put('users/{user}', [UserController::class, 'update'])
            ->middleware('perm:canManageUsers');
        Route::patch('users/{user}', [UserController::class, 'update'])
            ->middleware('perm:canManageUsers');
        Route::delete('users/{user}', [UserController::class, 'destroy'])
            ->middleware('perm:canManageUsers');

        // Settings / Permissions
        Route::put('settings/permissions', [SettingsController::class, 'updatePermissions'])
            ->middleware('role:admin');

        // Audit Logs - admin only
        Route::get('audit-logs', [AuditLogController::class, 'index'])
            ->middleware('role:admin');
});
