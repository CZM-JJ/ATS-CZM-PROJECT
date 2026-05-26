<?php

namespace App\Notifications;

use App\Models\Applicant;
use Illuminate\Notifications\Notification;

class ApplicantStatusUpdated extends Notification
{
    public function __construct(
        private readonly Applicant $applicant,
        private readonly string $previousStatus,
        private readonly string $newStatus
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function shouldQueue(object $notifiable): bool
    {
        return false;
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'kind' => 'applicant_status_updated',
            'applicant_id' => $this->applicant->id,
            'name' => trim($this->applicant->first_name.' '.$this->applicant->last_name),
            'position' => $this->applicant->position_applied_for,
            'previous_status' => $this->previousStatus,
            'new_status' => $this->newStatus,
            'email' => $this->applicant->email_address,
        ];
    }
}
