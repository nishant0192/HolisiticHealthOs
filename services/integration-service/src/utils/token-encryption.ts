// src/utils/token-encryption.ts
import CryptoJS from 'crypto-js';

/**
 * Utility for encrypting and decrypting sensitive token data
 */
class TokenEncryption {
  private readonly encryptionKey: string;

  constructor() {
    // Use a secure encryption key from environment variables or config
    this.encryptionKey = process.env.TOKEN_ENCRYPTION_KEY || 'default-dev-encryption-key-change-in-production';

    if (process.env.NODE_ENV === 'production' && this.encryptionKey === 'default-dev-encryption-key-change-in-production') {
      console.error('WARNING: Using default encryption key in production is insecure!');
    }
  }

  /**
   * Encrypt a token string
   * @param token Token string to encrypt
   * @returns Encrypted token
   */
  encrypt(token: string): string {
    if (!token) return '';
    return CryptoJS.AES.encrypt(token, this.encryptionKey).toString();
  }

  /**
   * Decrypt an encrypted token string
   * @param encryptedToken Encrypted token string
   * @returns Decrypted token
   */
  decrypt(encryptedToken: string): string {
    if (!encryptedToken) return '';
    const bytes = CryptoJS.AES.decrypt(encryptedToken, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

export const tokenEncryption = new TokenEncryption();