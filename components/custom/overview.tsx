import { motion } from "framer-motion";
import { Compass, Sparkles, BookOpen } from "lucide-react";
import React from "react";

import botCapabilities from "@/lib/data/bot-capabilities.json";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[650px] mt-12 mx-4 md:mx-0 flex flex-col gap-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.3 }}
    >
      {/* Bot introduction block */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-4 text-zinc-600 dark:text-zinc-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 dark:bg-orange-500/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Assistente Conversacional Gemini
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
              Capacidades carregadas dinamicamente em tempo de build
            </p>
          </div>
        </div>

        <p className="leading-relaxed">
          Este assistente inteligente foi configurado para executar automações, reservas e esclarecer dúvidas com base nas seguintes especialidades (skills) e ferramentas ativas:
        </p>

        {/* Dynamic skills rendering */}
        <div className="flex flex-col gap-6 mt-2">
          {botCapabilities.skills.map((skill: any) => {
            const isClimb = skill.id === "xperience-climb";
            const accentColorClass = isClimb 
              ? "border-orange-500/20 bg-orange-500/5 dark:bg-orange-950/20" 
              : "border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20";
            
            const badgeClass = isClimb
              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400";

            return (
              <div 
                key={skill.id} 
                className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors ${accentColorClass}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {isClimb ? "🧗" : "✈️"} {skill.name}
                  </h3>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${badgeClass}`}>
                    {skill.id}
                  </span>
                </div>

                {/* Primary flows/objectives */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1 font-mono">
                    <BookOpen className="size-3" />
                    Fluxos e Diretrizes
                  </span>
                  <ul className="list-disc list-inside text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                    {skill.flows.map((flow: string, idx: number) => (
                      <li key={idx} className="line-clamp-2 pl-1">
                        {flow.replace(/^\*\s*/, "")}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Associated Tools */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1 font-mono">
                    <Compass className="size-3" />
                    Ferramentas de Automação
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tools.map((tool: any) => (
                      <span 
                        key={tool.name} 
                        title={tool.purpose.replace(/^\*\s*/, "")}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-700/40 cursor-help hover:border-zinc-400 dark:hover:border-zinc-600 transition"
                      >
                        {tool.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
