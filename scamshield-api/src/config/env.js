const dotenv = require('dotenv');

dotenv.config();

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER',
  'TWILIO_WEBHOOK_URL'
];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Log warning if GROQ_API_KEY is missing (optional for fallback classifier)
if (!process.env.GROQ_API_KEY) {
  console.warn('WARNING: GROQ_API_KEY is not set. Scam checks will use the fallback classifier.');
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const config = Object.freeze({
  PORT: Number(process.env.PORT || process.env.NODE_PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  EMAIL_REDIRECT_TO: process.env.EMAIL_REDIRECT_TO || '',
  ALLOWED_ORIGINS: allowedOrigins,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
  TWILIO_WEBHOOK_URL: process.env.TWILIO_WEBHOOK_URL,
});

module.exports = config;
