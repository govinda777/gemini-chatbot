import fs from "fs";
import path from "path";

export interface ReportItem {
  id: string;
  source: "integration-test" | "e2e-test" | "dev-chat";
  testName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
  toolsTriggered: string[];
  timestamp: string;
}

const REPORT_FILE_PATH = path.join(process.cwd(), "test-results", "cost-report.json");

// Prices for Gemini 1.5 Flash (Standard)
// Input: $0.075 / 1M tokens ($0.000000075 per token)
// Output: $0.30 / 1M tokens ($0.0000003 per token)
const GEMINI_FLASH_INPUT_PRICE_PER_TOKEN = 0.075 / 1000000;
const GEMINI_FLASH_OUTPUT_PRICE_PER_TOKEN = 0.30 / 1000000;

export function calculateCost(promptTokens: number, completionTokens: number): number {
  return (
    promptTokens * GEMINI_FLASH_INPUT_PRICE_PER_TOKEN +
    completionTokens * GEMINI_FLASH_OUTPUT_PRICE_PER_TOKEN
  );
}

export function saveReportItem(item: Omit<ReportItem, "id" | "timestamp" | "costUSD" | "totalTokens">) {
  try {
    const dir = path.dirname(REPORT_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let report: ReportItem[] = [];
    if (fs.existsSync(REPORT_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(REPORT_FILE_PATH, "utf-8");
        report = JSON.parse(fileContent);
      } catch (e) {
        report = [];
      }
    }

    const totalTokens = item.promptTokens + item.completionTokens;
    const costUSD = calculateCost(item.promptTokens, item.completionTokens);

    const newItem: ReportItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      totalTokens,
      costUSD,
      timestamp: new Date().toISOString(),
    };

    report.push(newItem);

    fs.writeFileSync(REPORT_FILE_PATH, JSON.stringify(report, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write test report item:", error);
  }
}

export function getReport(): ReportItem[] {
  try {
    if (fs.existsSync(REPORT_FILE_PATH)) {
      const fileContent = fs.readFileSync(REPORT_FILE_PATH, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Failed to read test report:", error);
  }
  return [];
}

export function clearReport() {
  try {
    if (fs.existsSync(REPORT_FILE_PATH)) {
      fs.writeFileSync(REPORT_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Failed to clear report:", error);
  }
}
