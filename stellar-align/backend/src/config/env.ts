import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Database
  DATABASE_URL: z.string(),
  DATABASE_URL_NON_POOLING: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default("0"),

  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),

  // AI Provider: 'anthropic', 'nvidia', 'gemini', 'groq', 'opencode', or 'openrouter' (default: nvidia)
  AI_PROVIDER: z.enum(["opencode", "anthropic", "nvidia", "gemini", "groq", "openrouter"]).default("opencode"),

  // Anthropic (optional — used when AI_PROVIDER=anthropic)
  ANTHROPIC_API_KEY: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()) : []),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-20241022"),

  // Opencode (optional — used when AI_PROVIDER=opencode)
  OPENCODE_API_KEY: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()) : []),
  OPENCODE_MODEL: z.string().default("minimax-m2.5-free"),
  OPENCODE_BASE_URL: z.string().default("https://opencode.ai/zen/v1"),

  // NVIDIA NIM (optional — used when AI_PROVIDER=nvidia)
  NVIDIA_API_KEY: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()) : []),
  NVIDIA_MODEL: z.string().default("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"),
  NVIDIA_BASE_URL: z.string().default("https://integrate.api.nvidia.com/v1"),

  // Gemini (optional)
  GEMINI_API_KEY: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()) : []),
  GEMINI_MODEL: z.string().default("gemini-1.5-pro"),

  // Groq (optional)
  GROQ_API_KEY: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()) : []),
  GROQ_MODEL: z.string().default("llama3-70b-8192"),

  // OpenRouter (optional)
  OPENROUTER_API_KEY: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()) : []),
  OPENROUTER_MODEL: z.string().default("openai/gpt-3.5-turbo"),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),

  // Push Notifications
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // App
  APP_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z
    .string()
    .transform((s) => s.split(","))
    .optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
