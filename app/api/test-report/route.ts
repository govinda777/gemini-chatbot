import { NextResponse } from "next/server";
import { getReport, clearReport } from "@/lib/test-reporter";

export async function GET() {
  const report = getReport();
  return NextResponse.json(report);
}

export async function DELETE() {
  clearReport();
  return NextResponse.json({ success: true, message: "Report cleared" });
}
