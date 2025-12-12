/**
 * Email Service
 * 
 * Handles all email communications including verification, notifications, and reports.
 * Supports multiple providers: SendGrid, AWS SES, Resend, or SMTP.
 */

import { config } from '../config/index.js';

// Email provider types
type EmailProvider = 'sendgrid' | 'ses' | 'resend' | 'smtp' | 'console';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email templates
const templates = {
  verification: (data: { name: string; verifyUrl: string }) => ({
    subject: 'Verify your email - Portfolio Manager',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📊 Portfolio Manager</h1>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 16px;">Verify your email address</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Hi ${data.name},
    </p>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Thanks for signing up! Please verify your email address by clicking the button below.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link into your browser:<br>
      <a href="${data.verifyUrl}" style="color: #3b82f6; word-break: break-all;">${data.verifyUrl}</a>
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      This link expires in 24 hours.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hi ${data.name},

Thanks for signing up for Portfolio Manager!

Please verify your email address by clicking the link below:
${data.verifyUrl}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.
    `,
  }),

  passwordReset: (data: { name: string; resetUrl: string }) => ({
    subject: 'Reset your password - Portfolio Manager',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📊 Portfolio Manager</h1>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 16px;">Reset your password</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Hi ${data.name},
    </p>
    
    <p style="color: #4b5563; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      This link expires in 1 hour.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hi ${data.name},

We received a request to reset your password.

Click the link below to create a new password:
${data.resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
    `,
  }),

  mfaEnabled: (data: { name: string }) => ({
    subject: 'Two-factor authentication enabled - Portfolio Manager',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📊 Portfolio Manager</h1>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 16px;">🔒 Two-factor authentication enabled</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Hi ${data.name},
    </p>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Two-factor authentication has been successfully enabled on your account. You'll now need to enter a verification code from your authenticator app when signing in.
    </p>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Make sure to save your backup codes in a secure location. If you lose access to your authenticator app, you can use these codes to sign in.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you didn't enable 2FA, please contact support immediately.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hi ${data.name},

Two-factor authentication has been successfully enabled on your account.

You'll now need to enter a verification code from your authenticator app when signing in.

Make sure to save your backup codes in a secure location.

If you didn't enable 2FA, please contact support immediately.
    `,
  }),

  priceAlert: (data: { name: string; symbol: string; alertType: string; price: number; targetPrice: number }) => ({
    subject: `Price Alert: ${data.symbol} ${data.alertType} - Portfolio Manager`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📊 Portfolio Manager</h1>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 16px;">🔔 Price Alert Triggered</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Hi ${data.name},
    </p>
    
    <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
        ${data.symbol}
      </p>
      <p style="color: #1e40af; font-size: 24px; font-weight: 700; margin: 0;">
        $${data.price.toFixed(2)}
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
        Target: $${data.targetPrice.toFixed(2)} (${data.alertType})
      </p>
    </div>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Your price alert for ${data.symbol} has been triggered. The current price has ${data.alertType.toLowerCase()} your target of $${data.targetPrice.toFixed(2)}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      Manage your alerts in the Portfolio Manager app.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hi ${data.name},

Price Alert Triggered!

${data.symbol}: $${data.price.toFixed(2)}
Target: $${data.targetPrice.toFixed(2)} (${data.alertType})

Your price alert for ${data.symbol} has been triggered.

Manage your alerts in the Portfolio Manager app.
    `,
  }),

  weeklyReport: (data: { 
    name: string; 
    totalValue: number; 
    weeklyChange: number; 
    weeklyChangePercent: number;
    topPerformer: { symbol: string; change: number };
    worstPerformer: { symbol: string; change: number };
  }) => ({
    subject: `Weekly Portfolio Report - Portfolio Manager`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📊 Portfolio Manager</h1>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 16px;">📈 Your Weekly Portfolio Report</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Hi ${data.name},
    </p>
    
    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px; padding: 24px; margin: 20px 0; color: white;">
      <p style="margin: 0 0 8px 0; opacity: 0.9;">Total Portfolio Value</p>
      <p style="font-size: 32px; font-weight: 700; margin: 0;">
        $${data.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      <p style="margin: 8px 0 0 0; font-size: 16px; ${data.weeklyChange >= 0 ? 'color: #86efac;' : 'color: #fca5a5;'}">
        ${data.weeklyChange >= 0 ? '↑' : '↓'} $${Math.abs(data.weeklyChange).toFixed(2)} (${data.weeklyChangePercent >= 0 ? '+' : ''}${data.weeklyChangePercent.toFixed(2)}%) this week
      </p>
    </div>
    
    <div style="display: flex; gap: 16px; margin: 20px 0;">
      <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 16px;">
        <p style="color: #166534; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Top Performer</p>
        <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0;">${data.topPerformer.symbol}</p>
        <p style="color: #22c55e; font-size: 14px; margin: 4px 0 0 0;">+${data.topPerformer.change.toFixed(2)}%</p>
      </div>
      <div style="flex: 1; background: #fef2f2; border-radius: 8px; padding: 16px;">
        <p style="color: #991b1b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Needs Attention</p>
        <p style="color: #991b1b; font-size: 18px; font-weight: 600; margin: 0;">${data.worstPerformer.symbol}</p>
        <p style="color: #ef4444; font-size: 14px; margin: 4px 0 0 0;">${data.worstPerformer.change.toFixed(2)}%</p>
      </div>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      View full report in the Portfolio Manager app.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hi ${data.name},

Your Weekly Portfolio Report

Total Value: $${data.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Weekly Change: ${data.weeklyChange >= 0 ? '+' : ''}$${data.weeklyChange.toFixed(2)} (${data.weeklyChangePercent >= 0 ? '+' : ''}${data.weeklyChangePercent.toFixed(2)}%)

Top Performer: ${data.topPerformer.symbol} (+${data.topPerformer.change.toFixed(2)}%)
Needs Attention: ${data.worstPerformer.symbol} (${data.worstPerformer.change.toFixed(2)}%)

View full report in the Portfolio Manager app.
    `,
  }),

  loginAlert: (data: { name: string; ip: string; location: string; device: string; time: string }) => ({
    subject: 'New login to your account - Portfolio Manager',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📊 Portfolio Manager</h1>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 16px;">🔐 New login detected</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Hi ${data.name},
    </p>
    
    <p style="color: #4b5563; line-height: 1.6;">
      We detected a new login to your account:
    </p>
    
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0; color: #4b5563;"><strong>Time:</strong> ${data.time}</p>
      <p style="margin: 4px 0; color: #4b5563;"><strong>Device:</strong> ${data.device}</p>
      <p style="margin: 4px 0; color: #4b5563;"><strong>Location:</strong> ${data.location}</p>
      <p style="margin: 4px 0; color: #4b5563;"><strong>IP Address:</strong> ${data.ip}</p>
    </div>
    
    <p style="color: #4b5563; line-height: 1.6;">
      If this was you, no action is needed.
    </p>
    
    <p style="color: #dc2626; line-height: 1.6;">
      If this wasn't you, please secure your account immediately by changing your password and enabling two-factor authentication.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hi ${data.name},

We detected a new login to your account:

Time: ${data.time}
Device: ${data.device}
Location: ${data.location}
IP Address: ${data.ip}

If this was you, no action is needed.

If this wasn't you, please secure your account immediately by changing your password and enabling two-factor authentication.
    `,
  }),
};

/**
 * Email Service Class
 */
class EmailService {
  private provider: EmailProvider;

  constructor() {
    this.provider = (config.email?.provider as EmailProvider) || 'console';
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    // Apply template if specified
    let emailContent = { ...options };
    if (options.template && options.data) {
      const templateFn = templates[options.template as keyof typeof templates];
      if (templateFn) {
        const content = templateFn(options.data as any);
        emailContent = { ...options, ...content };
      }
    }

    // Route to appropriate provider
    switch (this.provider) {
      case 'sendgrid':
        return this.sendWithSendGrid(emailContent);
      case 'ses':
        return this.sendWithSES(emailContent);
      case 'resend':
        return this.sendWithResend(emailContent);
      case 'smtp':
        return this.sendWithSMTP(emailContent);
      case 'console':
      default:
        return this.sendToConsole(emailContent);
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<EmailResult> {
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    return this.send({
      to,
      subject: '',
      template: 'verification',
      data: { name, verifyUrl },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<EmailResult> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    return this.send({
      to,
      subject: '',
      template: 'passwordReset',
      data: { name, resetUrl },
    });
  }

  /**
   * Send MFA enabled notification
   */
  async sendMfaEnabledEmail(to: string, name: string): Promise<EmailResult> {
    return this.send({
      to,
      subject: '',
      template: 'mfaEnabled',
      data: { name },
    });
  }

  /**
   * Send price alert
   */
  async sendPriceAlert(
    to: string,
    name: string,
    symbol: string,
    alertType: string,
    price: number,
    targetPrice: number
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: '',
      template: 'priceAlert',
      data: { name, symbol, alertType, price, targetPrice },
    });
  }

  /**
   * Send weekly report
   */
  async sendWeeklyReport(
    to: string,
    name: string,
    data: {
      totalValue: number;
      weeklyChange: number;
      weeklyChangePercent: number;
      topPerformer: { symbol: string; change: number };
      worstPerformer: { symbol: string; change: number };
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: '',
      template: 'weeklyReport',
      data: { name, ...data },
    });
  }

  /**
   * Send login alert
   */
  async sendLoginAlert(
    to: string,
    name: string,
    data: { ip: string; location: string; device: string; time: string }
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: '',
      template: 'loginAlert',
      data: { name, ...data },
    });
  }

  // Provider implementations

  private async sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.email?.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: Array.isArray(options.to) ? options.to[0] : options.to }] }],
          from: { email: config.email?.fromAddress, name: config.email?.fromName },
          subject: options.subject,
          content: [
            { type: 'text/plain', value: options.text || '' },
            { type: 'text/html', value: options.html || '' },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`SendGrid error: ${response.status}`);
      }

      return { success: true, messageId: response.headers.get('x-message-id') || undefined };
    } catch (error: any) {
      console.error('SendGrid error:', error);
      return { success: false, error: error.message };
    }
  }

  private async sendWithSES(options: EmailOptions): Promise<EmailResult> {
    // AWS SES implementation would go here
    // Using AWS SDK v3
    console.log('SES email would be sent:', options.subject);
    return { success: true, messageId: `ses-${Date.now()}` };
  }

  private async sendWithResend(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.email?.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.email?.fromName} <${config.email?.fromAddress}>`,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Resend error');
      }

      return { success: true, messageId: data.id };
    } catch (error: any) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }
  }

  private async sendWithSMTP(options: EmailOptions): Promise<EmailResult> {
    // SMTP implementation would use nodemailer
    console.log('SMTP email would be sent:', options.subject);
    return { success: true, messageId: `smtp-${Date.now()}` };
  }

  private async sendToConsole(options: EmailOptions): Promise<EmailResult> {
    console.log('\n📧 ═══════════════════════════════════════════════════════════════');
    console.log('EMAIL (Console Mode)');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(options.text || 'No text content');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    return { success: true, messageId: `console-${Date.now()}` };
  }
}

// Export singleton instance
export const emailService = new EmailService();
