import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getTools } from "@/app/(chat)/api/chat/tools";

export async function POST(request: Request) {
  const session = await auth();
  
  try {
    const { toolName, parameters } = await request.json();
    const tool = getTools[toolName as keyof typeof getTools];
    
    if (!tool) {
      return NextResponse.json({ error: `Ferramenta '${toolName}' não encontrada.` }, { status: 400 });
    }

    // execute
    const result = await tool.execute(parameters);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Erro ao executar ferramenta:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
