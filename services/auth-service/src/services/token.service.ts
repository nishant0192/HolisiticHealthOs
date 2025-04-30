import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/user.model';
import { TokenModel, TokenType } from '../models/token.model';
import { authConfig } from '../config';

interface JwtPayload {
    userId: string;
    email: string;
    roles: string[];
}

export class TokenService {
    private tokenModel: TokenModel;

    constructor() {
        this.tokenModel = new TokenModel();
    }

    generateAccessToken(user: User): string {
        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            roles: user.roles
        };

        const options: SignOptions = { expiresIn: authConfig.jwtExpiresIn as unknown as number };
        return jwt.sign(
            payload,
            authConfig.jwtSecret as jwt.Secret,
            options
        );
    }

    async generateRefreshToken(userId: string): Promise<string> {
        return this.tokenModel.createRefreshToken(userId);
    }

    async generatePasswordResetToken(userId: string): Promise<string> {
        return this.tokenModel.createPasswordResetToken(userId);
    }

    async generateVerificationToken(userId: string): Promise<string> {
        return this.tokenModel.createVerificationToken(userId);
    }

    async verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
        const tokenRecord = await this.tokenModel.findByToken(token, TokenType.REFRESH);

        if (!tokenRecord || new Date() > tokenRecord.expires_at) {
            return null;
        }

        return { userId: tokenRecord.user_id };
    }

    async verifyPasswordResetToken(token: string): Promise<string | null> {
        const tokenRecord = await this.tokenModel.findByToken(token, TokenType.RESET_PASSWORD);

        if (!tokenRecord || new Date() > tokenRecord.expires_at) {
            return null;
        }

        return tokenRecord.user_id;
    }

    async verifyEmailToken(token: string): Promise<string | null> {
        const tokenRecord = await this.tokenModel.findByToken(token, TokenType.VERIFICATION);

        if (!tokenRecord || new Date() > tokenRecord.expires_at) {
            return null;
        }

        return tokenRecord.user_id;
    }

    async revokeRefreshToken(token: string): Promise<void> {
        await this.tokenModel.revokeToken(token);
    }

    async rotateRefreshToken(oldToken: string): Promise<string> {
        const tokenData = await this.verifyRefreshToken(oldToken);

        if (!tokenData) {
            throw new Error('Invalid refresh token');
        }

        // Revoke the old token
        await this.revokeRefreshToken(oldToken);

        // Generate a new refresh token
        return this.generateRefreshToken(tokenData.userId);
    }

    verifyAccessToken(token: string): JwtPayload | null {
        try {
            const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
            return decoded;
        } catch (error) {
            return null;
        }
    }
}