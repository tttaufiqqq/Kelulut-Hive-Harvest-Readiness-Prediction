<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You've been invited to BuzzyHive</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');</style>
</head>
<body style="margin:0;padding:0;background-color:#FFFBEB;font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFBEB;padding:40px 16px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#1c0a00;border-radius:20px 20px 0 0;padding:28px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <!-- Bee icon box -->
                                        <table cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
                                            <tr>
                                                <td style="background-color:#facc15;border-radius:10px;padding:8px 10px;vertical-align:middle;">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                                                        <ellipse cx="12" cy="15" rx="5.5" ry="6.5" fill="#1c0a00"/>
                                                        <rect x="6.5" y="12.5" width="11" height="2" rx="1" fill="#facc15"/>
                                                        <rect x="6.5" y="15.5" width="11" height="2" rx="1" fill="#facc15"/>
                                                        <circle cx="12" cy="7.5" r="3.5" fill="#1c0a00"/>
                                                        <path d="M8.5 6 C6 3.5 4 5 4.5 7.5" stroke="#1c0a00" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                                                        <path d="M15.5 6 C18 3.5 20 5 19.5 7.5" stroke="#1c0a00" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                                                    </svg>
                                                </td>
                                                <td style="padding-left:10px;vertical-align:middle;">
                                                    <span style="font-size:18px;font-weight:900;letter-spacing:-0.5px;color:#fff;text-transform:uppercase;">
                                                        BuzzyHive<span style="color:#facc15;">2.0</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right" style="vertical-align:middle;">
                                        <span style="background-color:#facc15;color:#1c0a00;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:4px 10px;border-radius:20px;">
                                            Invite
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Amber accent bar -->
                    <tr>
                        <td style="background-color:#facc15;height:4px;"></td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="background-color:#ffffff;padding:40px 40px 32px;">

                            <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#d97706;">
                                You have been invited
                            </p>
                            <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:#1c0a00;line-height:1.1;">
                                Welcome to<br /><span style="color:#f59e0b;">BuzzyHive.</span>
                            </h1>

                            <p style="margin:0 0 16px;font-size:15px;color:#78350f;line-height:1.6;">
                                Hello, <strong>{{ $notifiable->name }}</strong> —
                            </p>
                            <p style="margin:0 0 16px;font-size:15px;color:#78350f;line-height:1.6;">
                                <strong>{{ $invitedByName }}</strong> has invited you to join <strong>BuzzyHive 2.0</strong>, an IoT-integrated Business Intelligence platform for kelulut (stingless bee) farming.
                            </p>
                            <p style="margin:0 0 32px;font-size:15px;color:#78350f;line-height:1.6;">
                                Click the button below to set your password and activate your account. This invitation link expires in <strong>7 days</strong>.
                            </p>

                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                                <tr>
                                    <td style="background-color:#facc15;border-radius:12px;">
                                        <a href="{{ $inviteUrl }}"
                                           style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:800;color:#1c0a00;text-decoration:none;letter-spacing:-0.3px;text-transform:uppercase;">
                                            Set Up Your Account &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Divider -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                                <tr>
                                    <td style="border-top:1px solid #fef3c7;"></td>
                                </tr>
                            </table>

                            <!-- Link fallback -->
                            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#d97706;">
                                Or copy this link
                            </p>
                            <p style="margin:0;font-size:12px;color:#92400e;word-break:break-all;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;">
                                {{ $inviteUrl }}
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#fefce8;border:1px solid #fde68a;border-top:none;border-radius:0 0 20px 20px;padding:20px 40px;">
                            <p style="margin:0 0 4px;font-size:12px;color:#a16207;line-height:1.6;">
                                If you were not expecting this invitation, you can safely ignore this email.
                            </p>
                            <p style="margin:0;font-size:11px;color:#d97706;">
                                &copy; {{ date('Y') }} BuzzyHive 2.0 &mdash; IoT-Integrated Harvest Intelligence
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
