import fs from "fs";
import path from "path";

import { skillsRegistry } from "../lib/ai/skills-registry";

function analyzeBot() {
  console.log("🔍 Analisando habilidades e ferramentas do chatbot em tempo de build...");

  const capabilities: any = {
    generatedAt: new Date().toISOString(),
    skills: []
  };

  // Ler o arquivo tools.ts para mapear a descrição detalhada das ferramentas
  const toolsFilePath = path.join(process.cwd(), "app/(chat)/api/chat/tools.ts");
  const toolsContent = fs.readFileSync(toolsFilePath, "utf-8");

  // Regex simples para capturar JSDoc e propósitos das ferramentas em tools.ts
  const toolsInfo: Record<string, { purpose: string; description: string }> = {};
  
  // Encontra blocos de comentário de ferramentas
  const toolBlockRegex = /\/\*\*([\s\S]*?)\*\/\s*([a-zA-Z0-9]+)\s*:\s*\{/g;
  let match;
  while ((match = toolBlockRegex.exec(toolsContent)) !== null) {
    const comment = match[1];
    const toolName = match[2];
    
    // Ignora getTools principal
    if (toolName === "getTools") continue;

    // Extrai o propósito a partir de **Purpose:** ou similar
    let purpose = "";
    const purposeMatch = /\*\*Purpose:\*\*\s*\n?\s*(.*?)\n/i.exec(comment);
    if (purposeMatch) {
      purpose = purposeMatch[1].trim();
    } else {
      // Fallback para descrição simples
      const descMatch = /description:\s*"(.*?)"/.exec(comment);
      if (descMatch) purpose = descMatch[1];
    }

    toolsInfo[toolName] = {
      purpose: purpose || "Finalidade geral de automação.",
      description: purpose
    };
  }

  // Mapear cada skill ativa no sistema
  for (const [key, skill] of Object.entries(skillsRegistry)) {
    // Analisar fluxo/objetivo com base no Prompt do sistema
    const lines = skill.systemPrompt.split("\n").map(l => l.trim()).filter(Boolean);
    const flows = lines
      .filter(l => l.startsWith("-") || l.startsWith("*") || /^\d+\./.test(l))
      .map(l => l.replace(/^[-*\d.]+\s*/, ""))
      .filter(l => l.length > 5);

    capabilities.skills.push({
      id: skill.id,
      name: skill.name,
      tools: skill.allowedTools.map(t => ({
        name: t,
        purpose: toolsInfo[t]?.purpose || "Execução de rotina automatizada."
      })),
      flows: flows.slice(0, 5) // Salva os principais pontos do fluxo da skill
    });
  }

  // Grava o arquivo JSON de capacidades
  const outputPath = path.join(process.cwd(), "lib/data/bot-capabilities.json");
  
  // Garantir diretório existente
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(capabilities, null, 2), "utf-8");
  console.log(`✅ Capacidades do bot geradas com sucesso em: ${outputPath}`);
}

analyzeBot();
