import dotenv from 'dotenv';
dotenv.config();

interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
    saltRounds: number;
    resetPasswordExpiry: number;
    verificationCodeExpiry: number;
}

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
    console.error('FATAL ERROR: JWT_REFRESH_SECRET is not defined.');
    process.exit(1);
}

const authConfig: AuthConfig = {
    jwtSecret: process.env.JWT_SECRET as string,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
    resetPasswordExpiry: parseInt(process.env.RESET_PASSWORD_EXPIRY || '3600000', 10), // 1 hour
    verificationCodeExpiry: parseInt(process.env.VERIFICATION_CODE_EXPIRY || '86400000', 10) // 24 hours
};

export default authConfig;