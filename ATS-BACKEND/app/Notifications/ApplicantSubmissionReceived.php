<?php

namespace App\Notifications;

use App\Models\Applicant;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicantSubmissionReceived extends Notification
{
    public function __construct(private readonly Applicant $applicant) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function shouldQueue(object $notifiable): bool
    {
        return false;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Application Received: ' . $this->applicant->position_applied_for . ' - Czark Mak Corporation')
            ->greeting('Dear ' . $this->applicant->first_name . ',')
            ->line('Thank you for your interest in joining Czark Mak Corporation. We are pleased to confirm that we have successfully received your application for the **' . $this->applicant->position_applied_for . '** position.')
            ->line('Our recruitment team is currently reviewing all submissions. We carefully evaluate each candidate\'s qualifications and experience to ensure a great fit for both the applicant and our company.')
            ->line('**What happens next?**')
            ->line('If your profile aligns with our current requirements, a member of our team will contact you via email or phone to discuss the next steps of our recruitment process.')
            ->line('**Application Summary:**')
            ->line('Position: ' . $this->applicant->position_applied_for)
            ->line('Submission Date: ' . now()->format('F d, Y \a\t h:i A'))
            ->line('We appreciate the time and effort you put into your application and wish you the best of luck in your career journey!')
            ->salutation('Sincerely,**\n\nThe Czark Mak Recruitment Team');
    }
}
