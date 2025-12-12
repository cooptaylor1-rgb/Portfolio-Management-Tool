import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Validate environment variables
const envSchema = z.object({
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  // Email (optional)
  EMAIL_PROVIDER: z.enum(['console', 'sendgrid', 'ses', 'resend', 'smtp']).default('console'),
  EMAIL_FROM_NAME: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  // API Keys (optional)
  FACTSET_USERNAME: z.string().optional(),
  FACTSET_API_KEY: z.string().optional(),
  ALPHA_VANTAGE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
  // Server
  port: parseInt(env.PORT, 10),
  host: env.HOST,
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  version: '1.0.0',

  // Frontend
  frontendUrl: env.FRONTEND_URL,

  // Database
  databaseUrl: env.DATABASE_URL,

  // Redis
  redisUrl: env.REDIS_URL,

  // JWT
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },

  // CORS
  corsOrigin: env.CORS_ORIGIN.split(','),

  // Rate Limiting
  rateLimit: {
    max: parseInt(env.RATE_LIMIT_MAX, 10),
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
  },

  // Email
  email: {
    provider: env.EMAIL_PROVIDER,
    fromName: env.EMAIL_FROM_NAME,
    fromAddress: env.EMAIL_FROM_ADDRESS,
    sendgridApiKey: env.SENDGRID_API_KEY,
    resendApiKey: env.RESEND_API_KEY,
  },

  // API Keys
  apiKeys: {
    factset: {
      username: env.FACTSET_USERNAME,
      apiKey: env.FACTSET_API_KEY,
    },
    alphaVantage: env.ALPHA_VANTAGE_KEY,
    openai: env.OPENAI_API_KEY,
  },

  // Security
  security: {
    maxLoginAttempts: 10,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8,
    bcryptRounds: 12,
  },
};
