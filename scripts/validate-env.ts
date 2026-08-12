// Mute node warnings (e.g. deprecation warning DEP0205 from tsx/Node)
process.removeAllListeners('warning');

import { config } from "dotenv";
import postgres from "postgres";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { list } from "@vercel/blob";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Helper to decode JWT payload without verification
function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function validateEnv() {
  console.log("🔍 Starting validation of environment variables and connections...\n");
  let hasErrors = false;

  // 1. Validate AUTH_SECRET
  console.log("🔑 Checking AUTH_SECRET...");
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    console.error("❌ AUTH_SECRET is missing or empty.");
    hasErrors = true;
  } else if (authSecret.length < 32) {
    console.warn("⚠️ AUTH_SECRET is present but might be too short (recommended >= 32 characters).");
  } else {
    console.log("✅ AUTH_SECRET is configured.");
  }
  console.log("");

  // 2. Validate VERCEL_OIDC_TOKEN
  console.log("🎫 Checking VERCEL_OIDC_TOKEN...");
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (!oidcToken) {
    console.log("ℹ️ VERCEL_OIDC_TOKEN is not defined (optional for local development).");
  } else {
    const payload = decodeJwt(oidcToken);
    if (!payload) {
      console.error("❌ VERCEL_OIDC_TOKEN is present but is not a valid JWT.");
      hasErrors = true;
    } else {
      const exp = payload.exp;
      if (exp) {
        const expMs = exp * 1000;
        const nowMs = Date.now();
        if (nowMs > expMs) {
          console.warn(`⚠️ VERCEL_OIDC_TOKEN has EXPIRED (expired on: ${new Date(expMs).toLocaleString()}). This is optional for local development, but you might want to renew it for deployment integrations.`);
        } else {
          console.log(`` + `✅ VERCEL_OIDC_TOKEN is active (expires on: ${new Date(expMs).toLocaleString()}).`);
        }
      } else {
        console.warn("⚠️ VERCEL_OIDC_TOKEN is a valid JWT but has no expiration ('exp') claim.");
      }
    }
  }
  console.log("");

  // 3. Validate and test POSTGRES_URL connection
  console.log("🗄️ Checking POSTGRES_URL connection...");
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.error("❌ POSTGRES_URL is missing or empty.");
    hasErrors = true;
  } else {
    try {
      const sql = postgres(postgresUrl, { max: 1, connect_timeout: 5 });
      const result = await sql`SELECT 1 as connection_test`;
      if (result && result[0]?.connection_test === 1) {
        console.log("✅ Successfully connected to PostgreSQL database.");
      } else {
        throw new Error("Unexpected database query response");
      }
      await sql.end();
    } catch (err: any) {
      console.error(`❌ PostgreSQL connection failed: ${err.message}`);
      hasErrors = true;
    }
  }
  console.log("");

  // 4. Validate and test GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY and GEMINI_MODEL
  console.log("🤖 Checking Gemini API credentials and connection...");
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;
  
  if (!geminiKey) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) is missing or empty.");
    hasErrors = true;
  }
  if (!modelName) {
    console.error("❌ GEMINI_MODEL is missing or empty.");
    hasErrors = true;
  }

  if (geminiKey && modelName) {
    try {
      console.log(`   (Using model: ${modelName})`);
      const googleProvider = createGoogleGenerativeAI({
        apiKey: geminiKey,
      });
      // Test Gemini API with a minimal completion request
      const { text } = await generateText({
        model: googleProvider(modelName),
        prompt: "Say 'Hello' back if you can hear me.",
        maxTokens: 5,
      });
      console.log(`✅ Successfully connected to Gemini API. Response: "${text.trim()}"`);
    } catch (err: any) {
      const isQuotaExceeded = err.message.toLowerCase().includes("quota") || 
                              err.message.toLowerCase().includes("limit") || 
                              err.message.toLowerCase().includes("exhausted");
      if (isQuotaExceeded) {
        console.warn(`⚠️ Successfully authenticated with Gemini API, but your rate limit/quota is currently exhausted: ${err.message}`);
      } else {
        console.error(`❌ Gemini API connection/authentication failed: ${err.message}`);
        hasErrors = true;
      }
    }
  }
  console.log("");

  // 5. Validate and test BLOB_READ_WRITE_TOKEN
  console.log("📦 Checking BLOB_READ_WRITE_TOKEN and Vercel Blob storage...");
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    console.error("❌ BLOB_READ_WRITE_TOKEN is missing or empty.");
    hasErrors = true;
  } else {
    try {
      // Test listing items (with limit 1) to verify token/credentials
      await list({ limit: 1, token: blobToken });
      console.log("✅ Successfully connected to Vercel Blob storage.");
    } catch (err: any) {
      console.error(`❌ Vercel Blob authentication/connection failed: ${err.message}`);
      hasErrors = true;
    }
  }
  console.log("");

  console.log("--------------------------------------------------");
  if (hasErrors) {
    console.error("❌ Environment validation FAILED. Please check the errors above.");
    process.exit(1);
  } else {
    console.log("🎉 All environment variables and connections are VALID and WORKING!");
    process.exit(0);
  }
}

validateEnv().catch((err) => {
  console.error("❌ An unexpected error occurred during validation:");
  console.error(err);
  process.exit(1);
});
