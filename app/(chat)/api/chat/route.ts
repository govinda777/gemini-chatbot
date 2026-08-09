import { convertToCoreMessages, Message, streamText } from "ai";

import { geminiFlashModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById, saveChat } from "@/db/queries";
import { getSkill } from "@/lib/ai/skills-registry";
import { checkRateLimit } from "@/lib/rate-limiter";

import { getTools } from "./tools";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, messages, skillId: requestSkillId }: { id: string; messages: Array<Message>; skillId?: string } =
    await request.json();

  // ADR-0006: Limit input payload size (reject message > 1000 chars)
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.content && lastMessage.content.length > 1000) {
    return new Response("Message too long (max 1000 characters)", { status: 400 });
  }

  // ADR-0006: Rate Limiting
  const rateLimitResult = checkRateLimit(session.user.id, true);
  if (!rateLimitResult.success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  // ADR-0007: Determine active skill
  let skillId = requestSkillId;
  if (!skillId) {
    const chatFromDb = await getChatById({ id });
    skillId = chatFromDb?.skillId || "xperience-climb"; // Default to Xperience Climb
  }

  const skill = getSkill(skillId);

  // Filter allowed tools dynamically
  const allowedTools: Record<string, any> = {};
  for (const toolName of skill.allowedTools) {
    if (toolName in getTools) {
      allowedTools[toolName] = getTools[toolName as keyof typeof getTools];
    }
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  const result = await streamText({
    model: geminiFlashModel,
    system: skill.systemPrompt,
    messages: coreMessages,
    tools: allowedTools,
    onFinish: async ({ responseMessages, usage }) => {
      // Registrar métricas do relatório
      try {
        const { saveReportItem } = require("@/lib/test-reporter");
        const promptTokens = usage?.promptTokens || 0;
        const completionTokens = usage?.completionTokens || 0;
        
        // Extrai ferramentas acionadas a partir das mensagens de resposta
        const toolsTriggered = responseMessages
          .filter((msg) => msg.role === "assistant" && "toolCalls" in msg)
          .flatMap((msg: any) => (msg.toolCalls || []).map((tc: any) => tc.toolName));

        const isE2E = session.user?.email?.includes("playwright") || false;
        const source = isE2E ? "e2e-test" : "dev-chat";
        const testName = isE2E 
          ? "Execução E2E Playwright - Fluxo do Chat" 
          : `Chat Interativo (Skill: ${skillId})`;

        saveReportItem({
          source,
          testName,
          promptTokens,
          completionTokens,
          toolsTriggered,
        });
      } catch (err) {
        console.error("Failed to save usage metrics:", err);
      }

      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
            skillId,
          });
        } catch (error) {
          console.error("Failed to save chat", error);
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
