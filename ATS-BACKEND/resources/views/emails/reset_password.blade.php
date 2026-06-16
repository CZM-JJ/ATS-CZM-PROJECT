<x-mail::layout>
<x-slot:header>
    <x-mail::header :url="config('app.url')">
        Czark Mak Corporation
    </x-mail::header>
</x-slot:header>

<div style="text-align: center; padding: 20px 0;">
    <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
        You are receiving this email because we received a request to reset the password associated with your account.
    </p>

    <a href="{{ $url }}" style="background-color: #0f3d2e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-bottom: 24px;">
        Reset Password
    </a>

    <p style="font-size: 14px; color: #9ca3af; margin-bottom: 16px;">
        For your security, this link is temporary and will expire shortly.
    </p>
    <p style="font-size: 14px; color: #9ca3af;">
        If you did not request a password reset, please ignore this email. No changes will be made to your account.
    </p>
</div>

<x-slot:footer>
    <x-mail::footer>
        © {{ date('Y') }} Czark Mak Corporation. All rights reserved.
    </x-mail::footer>
</x-slot:footer>
</x-mail::layout>
