import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { EmailService } from '../services/email.service';

export class AuthController {
  private authService: AuthService;
  private tokenService: TokenService;
  private emailService: EmailService;

  constructor() {
    this.authService = new AuthService();
    this.tokenService = new TokenService();
    this.emailService = new EmailService();
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password, first_name, last_name, date_of_birth } = req.body;

      // Check if user already exists
      const existingUser = await this.authService.findUserByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Create new user
      const user = await this.authService.createUser({
        email,
        password,
        first_name,
        last_name,
        date_of_birth
      });

      // Generate verification token
      const verificationToken = await this.tokenService.generateVerificationToken(user.id);

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, verificationToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
          userId: user.id,
          email: user.email
        }
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user and validate password
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      // Check if email is verified
      if (!user.is_email_verified) {
        res.status(403).json({
          success: false,
          message: 'Email not verified. Please verify your email to login.'
        });
        return;
      }

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(user);
      const refreshToken = await this.tokenService.generateRefreshToken(user.id);

      // Update last login
      await this.authService.updateLastLogin(user.id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            roles: user.roles
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        }
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };

  verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.params;

      const userId = await this.tokenService.verifyEmailToken(token);
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
        return;
      }

      await this.authService.verifyEmail(userId);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now login.'
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };

  requestPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await this.authService.findUserByEmail(email);
      if (!user) {
        // For security reasons, don't disclose that the user doesn't exist
        res.status(200).json({
          success: true,
          message: 'If your email is registered, you will receive a password reset link'
        });
        return;
      }

      // Generate reset token
      const resetToken = await this.tokenService.generatePasswordResetToken(user.id);

      // Send reset email
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const userId = await this.tokenService.verifyPasswordResetToken(token);
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
        return;
      }

      await this.authService.updatePassword(userId, password);

      res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await this.tokenService.revokeRefreshToken(refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
}
