import { google } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

let wrappedModel: any = null;

export const geminiFlashModel = new Proxy({} as any, {
  get(target, prop) {
    if (!wrappedModel) {
      const modelName = process.env.GEMINI_MODEL;
      if (!modelName) {
        throw new Error("GEMINI_MODEL environment variable is required but not defined.");
      }
      wrappedModel = wrapLanguageModel({
        model: google(modelName),
        middleware: customMiddleware,
      });
    }
    const value = (wrappedModel as any)[prop];
    return typeof value === 'function' ? value.bind(wrappedModel) : value;
  }
});
