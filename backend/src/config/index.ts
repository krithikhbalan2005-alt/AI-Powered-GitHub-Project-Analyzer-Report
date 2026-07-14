import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  FRONTEND_URL: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  GITHUB_TOKEN?: string;
  GEMINI_API_KEY?: string;
  ADMIN_UIDS: string[];
  REPORT_SIGNED_URL_EXPIRATION_MINUTES: number;
}

const parsePrivateKeyValue = (key?: string): string | undefined => {
  if (!key) return undefined;
  // Replace escaped double quotes and literal \n with real newline characters
  let cleanKey = key.trim();
  if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
    cleanKey = cleanKey.slice(1, -1);
  }
  return cleanKey.replace(/\\n/g, '\n');
};

const adminUidsString = process.env.ADMIN_UIDS || '';
const adminUids = adminUidsString
  .split(',')
  .map(uid => uid.trim())
  .filter(Boolean);

export const config: Config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: (process.env.NODE_ENV as Config['NODE_ENV']) || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'ai-powered-github-project',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: parsePrivateKeyValue(process.env.FIREBASE_PRIVATE_KEY),
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ADMIN_UIDS: adminUids,
  REPORT_SIGNED_URL_EXPIRATION_MINUTES: parseInt(
    process.env.REPORT_SIGNED_URL_EXPIRATION_MINUTES || '60',
    10
  ),
};

// Validate critical configurations (except when in test environment)
if (config.NODE_ENV !== 'test') {
  if (!config.FIREBASE_CLIENT_EMAIL) {
    console.warn('⚠️ WARNING: FIREBASE_CLIENT_EMAIL is missing. Firebase Admin SDK may not initialize correctly.');
  }
  if (!config.FIREBASE_PRIVATE_KEY) {
    console.warn('⚠️ WARNING: FIREBASE_PRIVATE_KEY is missing. Firebase Admin SDK may not initialize correctly.');
  }
  if (!config.GEMINI_API_KEY) {
    console.warn('⚠️ WARNING: GEMINI_API_KEY is missing. AI Suggestions will fall back to deterministic mode.');
  }
  if (!config.GITHUB_TOKEN) {
    console.warn('⚠️ WARNING: GITHUB_TOKEN is missing. GitHub API requests will be unauthenticated and subject to strict rate limits.');
  }
}
