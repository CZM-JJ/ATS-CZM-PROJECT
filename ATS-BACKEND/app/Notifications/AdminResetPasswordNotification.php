<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendBase = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $email = urlencode($notifiable->getEmailForPasswordReset());
        $token = urlencode($this->token);
        $resetUrl = "{$frontendBase}/admin/reset-password?token={$token}&email={$email}";

        return (new MailMessage)
            ->subject('Password Reset Request - Czark Mak Corporation')
            ->greeting('Hello,')
            ->line('You are receiving this email because we received a request to reset the password associated with your account.')
            ->line('To proceed with resetting your password, please click the button below:')
            ->action('Reset Password', $resetUrl)
            ->line('For your security, this link is temporary and will expire shortly.')
            ->line('If you did not request a password reset, please ignore this email. No changes will be made to your account.')
            ->salutation('Best regards,**\n\nCzark Mak IT Support');
    }
}
