package com.apexservices.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Year;

/**
 * Generates responsive, high-contrast, professional HTML email templates.
 * Designed for cross-client compatibility (Gmail, Apple Mail, Outlook, Android).
 */
@Component
public class EmailTemplateBuilder {

    private final String brandName;
    private final String supportEmail;

    public EmailTemplateBuilder(
            @Value("${mail.from.name:Apex Services}") String brandName,
            @Value("${support.email:support@apexservices.com}") String supportEmail) {
        this.brandName = brandName;
        this.supportEmail = supportEmail;
    }

    /**
     * Builds a responsive OTP challenge email template.
     */
    public String buildOtpEmail(String recipientName, String otpCode, String purposeDescription, int expiryMinutes) {
        String greetingName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Valued Customer";
        int currentYear = Year.now().getValue();

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s Verification Code</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
                table { border-spacing: 0; }
                td { padding: 0; }
                img { border: 0; }
                .wrapper { width: 100%%; table-layout: fixed; background-color: #f8fafc; padding: 40px 16px; }
                .main { background-color: #ffffff; margin: 0 auto; width: 100%%; max-width: 580px; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background-color: #0f172a; padding: 32px 40px; text-align: center; }
                .header-brand { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
                .header-dot { color: #ff3b47; }
                .content { padding: 40px; }
                .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; }
                .text { font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 24px 0; }
                .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
                .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin: 0; }
                .expiry-pill { display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-top: 10px; }
                .security-note { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 4px; font-size: 13px; line-height: 20px; color: #92400e; margin-bottom: 24px; }
                .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 18px; }
                .footer a { color: #3b82f6; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <table class="main" align="center">
                  <tr>
                    <td class="header">
                      <div class="header-brand">%s<span class="header-dot">.</span></div>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <h1 class="title">Verification Code</h1>
                      <p class="text">Hello %s,</p>
                      <p class="text">We received a request for <strong>%s</strong> associated with your account. Please use the following 6-digit verification code to complete the process:</p>
                      
                      <div class="otp-box">
                        <div class="otp-code">%s</div>
                        <div class="expiry-pill">Expires in %d minutes</div>
                      </div>

                      <div class="security-note">
                        <strong>Security Reminder:</strong> Never share this code with anyone. Apex Services representatives will never ask you for your verification code.
                      </div>

                      <p class="text" style="font-size: 13px; color: #64748b;">If you did not initiate this request, you can safely disregard this email. Your account credentials remain secure.</p>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">
                      &copy; %d %s. All rights reserved.<br>
                      Need help? Contact our support desk at <a href="mailto:%s">%s</a>.
                    </td>
                  </tr>
                </table>
              </div>
            </body>
            </html>
            """.formatted(
                brandName,
                brandName,
                greetingName,
                purposeDescription,
                otpCode,
                expiryMinutes,
                currentYear,
                brandName,
                supportEmail,
                supportEmail
        );
    }

    /**
     * Builds a responsive Welcome notification email template.
     */
    public String buildWelcomeEmail(String recipientName, String portalUrl) {
        String greetingName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Valued Member";
        int currentYear = Year.now().getValue();
        String safeUrl = (portalUrl != null && !portalUrl.isBlank()) ? portalUrl : "https://apexservicesondemand.netlify.app";

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to %s</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
                .wrapper { width: 100%%; table-layout: fixed; background-color: #f8fafc; padding: 40px 16px; }
                .main { background-color: #ffffff; margin: 0 auto; width: 100%%; max-width: 580px; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background-color: #0f172a; padding: 32px 40px; text-align: center; }
                .header-brand { font-size: 24px; font-weight: 800; color: #ffffff; }
                .header-dot { color: #ff3b47; }
                .content { padding: 40px; }
                .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; }
                .text { font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 20px 0; }
                .cta-btn { display: inline-block; background-color: #ff3b47; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin: 16px 0 24px 0; }
                .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; font-size: 12px; color: #94a3b8; }
                .footer a { color: #3b82f6; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <table class="main" align="center">
                  <tr>
                    <td class="header">
                      <div class="header-brand">%s<span class="header-dot">.</span></div>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <h1 class="title">Welcome aboard, %s! 🎉</h1>
                      <p class="text">Thank you for registering with <strong>%s</strong>. Your account has been verified and is ready for use.</p>
                      <p class="text">Explore our on-demand services, browse expert carpentry, plumbing, electrical solutions, or track service dispatches in real-time.</p>
                      <div style="text-align: center;">
                        <a href="%s" class="cta-btn">Access Your Dashboard &rarr;</a>
                      </div>
                      <p class="text" style="font-size: 13px; color: #64748b;">If you have any questions or require custom assistance, our 24/7 dedicated support team is here to assist.</p>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">
                      &copy; %d %s. All rights reserved.<br>
                      Questions? Contact us at <a href="mailto:%s">%s</a>.
                    </td>
                  </tr>
                </table>
              </div>
            </body>
            </html>
            """.formatted(
                brandName,
                brandName,
                greetingName,
                brandName,
                safeUrl,
                currentYear,
                brandName,
                supportEmail,
                supportEmail
        );
    }
}
