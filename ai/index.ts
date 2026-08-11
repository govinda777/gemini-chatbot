import { google } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

const modelName = process.env.GEMINI_MODEL;
if (!modelName) {
  throw new Error("GEMINI_MODEL environment variable is required but not defined.");
}

export const geminiFlashModel = wrapLanguageModel({
  model: google(modelName),
  middleware: customMiddleware,
});
