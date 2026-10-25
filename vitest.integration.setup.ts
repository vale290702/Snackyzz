import { existsSync } from "node:fs";

// Integration tests talk to the local Supabase stack; its URL and keys live in .env.local.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
