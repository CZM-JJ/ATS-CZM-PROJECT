<?php

/**
 * Applicant-related configuration constants.
 * Centralized to avoid hardcoding values across multiple files.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Applicant Status Order
    |--------------------------------------------------------------------------
    | Defines the order in which applicant statuses appear in queries.
    | Used for sorting and UI display purposes.
    |
    */
    'statuses' => [
        'new',
        'reviewed',
        'shortlisted',
        'interview_scheduled',
        'offer_extended',
        'hired',
        'rejected',
        'withdrawn',
    ],

    'status_order' => [
        'new' => 1,
        'reviewed' => 2,
        'shortlisted' => 3,
        'interview_scheduled' => 4,
        'offer_extended' => 5,
        'hired' => 6,
        'rejected' => 7,
        'withdrawn' => 8,
    ],

    /*
    |--------------------------------------------------------------------------
    | Permission Matrix
    |--------------------------------------------------------------------------
    | Defines which roles have access to which operations.
    |
    */
    'permissions' => [
        'canEdit' => ['admin', 'hr_manager', 'hr_supervisor'],
        'canDelete' => ['admin', 'hr_manager', 'hr_supervisor'],
        'canManagePositions' => ['admin', 'hr_manager', 'hr_supervisor', 'bu_manager'],
        'canViewAnalytics' => ['admin', 'hr_manager', 'hr_supervisor'],
        'canManageUsers' => ['admin'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Available User Roles
    |--------------------------------------------------------------------------
    |
    */
    'roles' => ['admin', 'hr_manager', 'hr_supervisor', 'recruiter', 'recruiter_lead', 'bu_manager'],

    /*
    |--------------------------------------------------------------------------
    | Anti-Spam Configuration
    |--------------------------------------------------------------------------
    | Settings for public form submission protection.
    |
    */
    'anti_spam' => [
        'min_submission_time_ms' => 6000,  // Minimum time to spend on form (6 seconds)
        'duplicate_email_cooldown_minutes' => 5,  // Cooldown period for duplicate emails
    ],

    /*
    |--------------------------------------------------------------------------
    | CV Storage Configuration
    |--------------------------------------------------------------------------
    |
    */
    'cv' => [
        'allowed_mimes' => ['pdf', 'doc', 'docx'],
        'max_size_kb' => 5120,  // 5 MB
        'storage_directory' => 'cvs',
    ],
];
