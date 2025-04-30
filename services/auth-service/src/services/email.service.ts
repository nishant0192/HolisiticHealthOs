import nodemailer from 'nodemailer';
import { AppError } from '../middlewares/error.middleware';

export class EmailService {
  private transporter!: nodemailer.Transporter;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    this.initializeTransporter();
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@holistichealthos.com';
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  private async initializeTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use SMTP credentials directly
      this.transporter = nodemailer.createTransport({
        service: 'gmail', // Using Gmail service
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Just log the email content to console for development
      this.transporter = {
        sendMail: (options: any) => {
          console.log('Email would be sent with these options:', options);
          return Promise.resolve({ messageId: 'test-id' });
        }
      } as any;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new AppError('Failed to send email', 500);
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationLink = `${this.baseUrl}/verify-email/${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Thank you for signing up with Holistic Health OS! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `;
    
    await this.sendEmail(to, 'Verify Your Email - Holistic Health OS', html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetLink = `${this.baseUrl}/reset-password/${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
      </div>
    `;
    
    await this.sendEmail(to, 'Reset Your Password - Holistic Health OS', html);
  }
}