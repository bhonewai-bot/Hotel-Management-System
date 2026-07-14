interface OtpEmailProps {
  otp: string;
  expiryMinutes?: number;
}

export function renderOtpEmail({ otp, expiryMinutes = 5 }: OtpEmailProps) {
  const digits = otp
    .split("")
    .map(
      (digit) =>
        `<td style="padding:0 6px;"><div style="width:44px;height:56px;line-height:56px;background-color:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;color:#1e1b4b;font-size:26px;font-weight:700;text-align:center;font-family:'Courier New',Courier,monospace;">${digit}</div></td>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>Your HMS Hotel sign-in code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f0eef8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your HMS Hotel sign-in code is ${otp}. It expires in ${expiryMinutes} minutes.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0eef8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(30,27,75,0.1);">
            <tr>
              <td style="background-color:#1e1b4b;background-image:radial-gradient(ellipse at 30% 20%,rgba(124,58,237,0.25) 0%,transparent 60%),linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:36px 40px;">
                <div style="display:inline-block;background-color:rgba(139,92,246,0.25);color:#e0d4fc;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Staff Portal</div>
                <h1 style="margin:18px 0 0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.01em;">HMS Hotel</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px;">
                <h2 style="margin:0;color:#1e1b4b;font-size:20px;font-weight:700;">Verify your sign-in</h2>
                <p style="margin:12px 0 0;color:#475569;font-size:15px;line-height:1.6;">Use the verification code below to finish signing in to the admin dashboard. This code expires in <strong style="color:#1e1b4b;">${expiryMinutes} minutes</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 8px;" align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                  <tr>${digits}</tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px;">
                <div style="background-color:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;padding:14px 16px;color:#475569;font-size:13px;line-height:1.6;">
                  Didn't try to sign in? You can safely ignore this email &mdash; your account remains secure.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 36px;border-top:1px solid #ede9fe;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">This is an automated message from HMS Hotel. Please do not reply.</p>
                <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} HMS Hotel. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
