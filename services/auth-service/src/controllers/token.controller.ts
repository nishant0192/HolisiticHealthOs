import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

export class TokenController {
  private tokenService: TokenService;
  private authService: AuthService;

  constructor() {
    this.tokenService = new TokenService();
    this.authService = new AuthService();
  }

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify the refresh token
      const tokenData = await this.tokenService.verifyRefreshToken(refreshToken);
      
      if (!tokenData) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Get user details
      const user = await this.authService.findUserById(tokenData.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new access token
      const accessToken = this.tokenService.generateAccessToken(user);

      // Generate new refresh token (rotation for security)
      const newRefreshToken = await this.tokenService.rotateRefreshToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            access_token: accessToken,
            refresh_token: newRefreshToken
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  };

  validateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This endpoint is protected by the auth middleware, so if it reaches here,
      // the token is valid and the user is authenticated

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      return next(error);
    }
  };
}