"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect } from "react";

import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";

import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";

export function Chat({
  id,
  initialMessages,
  skillId,
}: {
  id: string;
  initialMessages: Array<Message>;
  skillId?: string;
}) {
  const [activeSkill, setActiveSkill] = useState<string>(skillId || "xperience-climb");

  useEffect(() => {
    if (!skillId && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const skill = params.get("skill");
      if (skill) {
        setActiveSkill(skill);
      }
    }
  }, [skillId]);

  const { messages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      id,
      body: { id, skillId: activeSkill },
      initialMessages,
      maxSteps: 10,
      onFinish: () => {
        window.history.replaceState({}, "", `/chat/${id}`);
      },
    });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  // ADR-0004 theme handling: Apply adventure earth dark mode classes if active skill is xperience-climb
  const isClimb = activeSkill === "xperience-climb";
  const themeBgClass = isClimb ? "bg-slate-950 text-slate-100" : "bg-background text-foreground";

  return (
    <div className={`flex flex-row justify-center pb-4 md:pb-8 h-dvh ${themeBgClass}`}>
      <div className="flex flex-col justify-between items-center gap-4 w-full">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
            />
          ))}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        <form className="flex flex-row gap-2 relative items-end w-full md:max-w-[500px] max-w-[calc(100dvw-32px)] px-4 md:px-0">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
          />
        </form>
      </div>
    </div>
  );
}
