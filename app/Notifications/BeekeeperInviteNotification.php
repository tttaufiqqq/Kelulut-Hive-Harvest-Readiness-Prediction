<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BeekeeperInviteNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $inviteUrl,
        private readonly string $invitedByName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('You\'ve been invited to BuzzyHive 2.0')
            ->view('emails.beekeeper-invite', [
                'inviteUrl' => $this->inviteUrl,
                'invitedByName' => $this->invitedByName,
                'notifiable' => $notifiable,
            ]);
    }
}
