import { pool } from '../config/database.config';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { authConfig } from '../config';

export interface Token {
  id: string;
  user_id: string;
  token: string;
  type: TokenType;
  expires_at: Date;
  created_at: Date;
  is_revoked: boolean;
}

export enum TokenType {
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  VERIFICATION = 'verification'
}

export class TokenModel {
  async createToken(userId: string, type: TokenType, expiresIn: number): Promise<Token> {
    const id = uuidv4();
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn);
    
    const query = `
      INSERT INTO tokens (
        id, user_id, token, type, expires_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [id, userId, token, type, expiresAt, now];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findByToken(token: string, type: TokenType): Promise<Token | null> {
    const query = `
      SELECT * FROM tokens
      WHERE token = $1 AND type = $2 AND is_revoked = false
    `;
    
    const result = await pool.query(query, [token, type]);
    return result.rows[0] || null;
  }

  async revokeToken(token: string): Promise<void> {
    const query = `
      UPDATE tokens
      SET is_revoked = true
      WHERE token = $1
    `;
    
    await pool.query(query, [token]);
  }

  async revokeAllUserTokens(userId: string, type: TokenType): Promise<void> {
    const query = `
      UPDATE tokens
      SET is_revoked = true
      WHERE user_id = $1 AND type = $2 AND is_revoked = false
    `;
    
    await pool.query(query, [userId, type]);
  }

  async createRefreshToken(userId: string): Promise<string> {
    const expiresIn = getMillisecondsFromTimeString(authConfig.jwtRefreshExpiresIn);
    const tokenRecord = await this.createToken(userId, TokenType.REFRESH, expiresIn);
    return tokenRecord.token;
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    // Revoke any existing reset tokens for this user
    await this.revokeAllUserTokens(userId, TokenType.RESET_PASSWORD);
    
    const tokenRecord = await this.createToken(
      userId, 
      TokenType.RESET_PASSWORD, 
      authConfig.resetPasswordExpiry
    );
    
    return tokenRecord.token;
  }

  async createVerificationToken(userId: string): Promise<string> {
    // Revoke any existing verification tokens for this user
    await this.revokeAllUserTokens(userId, TokenType.VERIFICATION);
    
    const tokenRecord = await this.createToken(
      userId, 
      TokenType.VERIFICATION, 
      authConfig.verificationCodeExpiry
    );
    
    return tokenRecord.token;
  }
}

// Helper function to convert time strings like "7d" to milliseconds
function getMillisecondsFromTimeString(timeString: string): number {
  const regex = /^(\d+)([smhdw])$/;
  const match = timeString.match(regex);
  
  if (!match) {
    return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000; // seconds
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    case 'w': return value * 7 * 24 * 60 * 60 * 1000; // weeks
    default: return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
}