import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener mínimo 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.string().regex(/^\d+$/),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  CLIENT_URL: z.string().url(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
});

export const validateEnv = (): void => {
  try {
    envSchema.parse(process.env);
    console.log('✓ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error);
    process.exit(1);
  }
};
