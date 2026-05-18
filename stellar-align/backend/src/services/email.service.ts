import { Resend } from "resend";
import logger from "../config/logger";
import { env } from "../config/env";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
    } else {
      logger.warn("RESEND_API_KEY is missing. Email service will run in simulation mode.");
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
    
    const options: EmailOptions = {
      to: email,
      subject: "Reset your Stellar Align password",
      text: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6d28d9; text-align: center;">Stellar Align</h2>
          <p>Hi there,</p>
          <p>You requested a password reset for your Stellar Align account. Click the button below to set a new password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="color: #666; font-size: 12px;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await this.sendEmail(options);
  }

  /**
   * Core send email method using Resend
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.resend) {
      // Simulation mode
      logger.info("📧 Email Sent (Simulation)", {
        to: options.to,
        subject: options.subject,
        preview: options.text.substring(0, 100) + "...",
      });

      if (env.NODE_ENV === "development") {
        console.log("-----------------------------------------");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Text: ${options.text}`);
        console.log("-----------------------------------------");
      }
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (error) {
        logger.error("Resend API error", { error });
        throw new Error(`Failed to send email: ${error.message}`);
      }

      logger.info("📧 Email sent successfully via Resend", {
        id: data?.id,
        to: options.to,
        subject: options.subject,
      });
    } catch (error: any) {
      logger.error("Failed to send email via Resend", {
        to: options.to,
        error: error.message,
      });
      // We don't necessarily want to crash the request if email fails, 
      // but we log it as an error.
    }
  }
}

export const emailService = new EmailService();
export default emailService;
