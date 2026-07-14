interface VerificationEmailProps {
  url: string;
  email: string;
}

export function renderVerificationEmail({ url, email }: VerificationEmailProps) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>Verify your email - HMS Hotel</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef1f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Verify your email address for HMS Hotel</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(27,37,69,0.08);">
            <tr>
              <td style="background-color:#1b2545;background-image:linear-gradient(135deg,#1b2545 0%,#2a3a66 100%);padding:36px 40px;">
                <div style="display:inline-block;background-color:rgba(255,255,255,0.12);color:#ffffff;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Staff Portal</div>
                <h1 style="margin:18px 0 0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.01em;">HMS Hotel</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px;">
                <h2 style="margin:0;color:#1b2545;font-size:20px;font-weight:700;">Verify your email</h2>
                <p style="margin:12px 0 0;color:#5b6577;font-size:15px;line-height:1.6;">We received a request to verify the email address <strong style="color:#1b2545;">${email}</strong>. Click the button below to verify your email address.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 8px;" align="center">
                <a href="${url}" style="display:inline-block;background-color:#1b2545;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">Verify Email Address</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px;">
                <p style="margin:0;color:#5b6577;font-size:14px;line-height:1.6;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin:8px 0 0;color:#1b2545;font-size:13px;word-break:break-all;"><a href="${url}" style="color:#1b2545;">${url}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px;">
                <div style="background-color:#f8fafc;border:1px solid #eef1f7;border-radius:10px;padding:14px 16px;color:#5b6577;font-size:13px;line-height:1.6;">
                  Didn't request this? You can safely ignore this email &mdash; your account remains secure.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 36px;border-top:1px solid #eef1f7;">
                <p style="margin:0;color:#94a0b4;font-size:12px;line-height:1.6;">This is an automated message from HMS Hotel. Please do not reply.</p>
                <p style="margin:6px 0 0;color:#94a0b4;font-size:12px;">&copy; ${new Date().getFullYear()} HMS Hotel. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
