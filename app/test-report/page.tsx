"use client";

import { useEffect, useState } from "react";
import { ReportItem } from "@/lib/test-reporter";

export default function TestReportPage() {
  const [report, setReport] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const res = await fetch("/api/test-report");
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (confirm("Deseja realmente limpar todo o histórico de execuções do relatório?")) {
      try {
        const res = await fetch("/api/test-report", { method: "DELETE" });
        if (res.ok) {
          setReport([]);
        }
      } catch (error) {
        console.error("Failed to clear report:", error);
      }
    }
  };

  useEffect(() => {
    fetchReport();
    // Poll every 5 seconds to keep dashboard alive during test execution
    const interval = setInterval(fetchReport, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculations
  const totalCost = report.reduce((sum, item) => sum + item.costUSD, 0);
  const totalTokens = report.reduce((sum, item) => sum + item.totalTokens, 0);
  const promptTokens = report.reduce((sum, item) => sum + item.promptTokens, 0);
  const completionTokens = report.reduce((sum, item) => sum + item.completionTokens, 0);
  const totalCalls = report.length;

  const toolCounts: Record<string, number> = {};
  report.forEach((item) => {
    item.toolsTriggered.forEach((tool) => {
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    });
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-teal-500 selection:text-slate-900">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-semibold uppercase tracking-wider rounded-full border border-teal-500/20">
                BDD & Integration Dashboard
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mt-2 bg-gradient-to-r from-teal-400 via-emerald-300 to-purple-400 bg-clip-text text-transparent">
              Relatório de Testes & Custos LLM
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Visibilidade em tempo real do uso de tokens, custos estimados da API Gemini e ferramentas acionadas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-all flex items-center gap-2"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 hover:border-red-800 text-red-400 font-medium rounded-lg text-sm transition-all"
            >
              🗑️ Limpar Histórico
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4 animate-pulse">Carregando relatório de execuções...</p>
          </div>
        ) : report.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/20 backdrop-blur-md">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              📈
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Nenhum dado registrado</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
              Execute os testes de integração com <code className="bg-slate-900 text-teal-400 px-1.5 py-0.5 rounded text-xs">pnpm test</code> ou converse com o chatbot no ambiente de desenvolvimento para ver os dados gerados aqui em tempo real.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {/* Cost */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">Custo Acumulado</span>
                <div className="mt-2">
                  <span className="text-3xl font-black tracking-tight text-white">${totalCost.toFixed(5)}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Gemini 1.5 Flash</span>
                </div>
              </div>

              {/* Total Tokens */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">Tokens Totais</span>
                <div className="mt-2">
                  <span className="text-3xl font-black tracking-tight text-white">{totalTokens.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Prompt + Completion</span>
                </div>
              </div>

              {/* Prompt Tokens */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">Tokens de Entrada</span>
                <div className="mt-2">
                  <span className="text-3xl font-black tracking-tight text-white">{promptTokens.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Prompt Input</span>
                </div>
              </div>

              {/* Completion Tokens */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">Tokens de Saída</span>
                <div className="mt-2">
                  <span className="text-3xl font-black tracking-tight text-white">{completionTokens.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">LLM Generation</span>
                </div>
              </div>

              {/* Call Count */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">Total de Chamadas</span>
                <div className="mt-2">
                  <span className="text-3xl font-black tracking-tight text-white">{totalCalls}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Requisições registradas</span>
                </div>
              </div>
            </div>

            {/* Tools list & Top analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Tools triggered list */}
              <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                  🔧 Chamadas de Ferramentas (Tools Call Counter)
                </h3>
                <div className="flex flex-wrap gap-3">
                  {Object.keys(toolCounts).length === 0 ? (
                    <p className="text-slate-400 text-sm">Nenhuma ferramenta acionada nas requisições.</p>
                  ) : (
                    Object.entries(toolCounts).map(([tool, count]) => (
                      <div
                        key={tool}
                        className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-teal-500/30 transition-all"
                      >
                        <span className="font-mono text-sm text-teal-300 font-semibold">{tool}</span>
                        <span className="px-2 py-0.5 bg-teal-900/40 border border-teal-800 text-teal-400 text-xs font-bold rounded-full">
                          {count}x
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pricing Context */}
              <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-200 mb-3">Tabela de Preço de Referência</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Modelo:</span>
                      <span className="text-slate-200 font-semibold">Gemini 1.5 Flash</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Input (1M tokens):</span>
                      <span className="text-teal-400 font-semibold">$0.075</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pb-1">
                      <span>Output (1M tokens):</span>
                      <span className="text-emerald-400 font-semibold">$0.300</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-teal-950/20 border border-teal-900/30 rounded-xl text-[11px] text-teal-400">
                  💡 Os valores apresentados são estimativas diretas de consumo oficial baseadas nos tokens reportados pelo SDK.
                </div>
              </div>
            </div>

            {/* Detailed table logs */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl backdrop-blur-md overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-200">📋 Detalhamento das Requisições</h3>
                <span className="text-xs text-slate-400 font-mono">Total: {report.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Tipo/Origem</th>
                      <th className="p-4">Cenário / Descrição</th>
                      <th className="p-4 text-center">Tokens (In / Out)</th>
                      <th className="p-4 text-right">Custo</th>
                      <th className="p-4">Ferramentas Acionadas</th>
                      <th className="p-4 text-right">Horário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {report.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.source === "integration-test"
                                ? "bg-blue-900/30 border border-blue-800 text-blue-400"
                                : item.source === "e2e-test"
                                ? "bg-purple-900/30 border border-purple-800 text-purple-400"
                                : "bg-emerald-900/30 border border-emerald-800 text-emerald-400"
                            }`}
                          >
                            {item.source}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate font-medium text-slate-200" title={item.testName}>
                          {item.testName}
                        </td>
                        <td className="p-4 text-center font-mono text-xs">
                          <span className="text-blue-400">{item.promptTokens}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-emerald-400">{item.completionTokens}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-xs font-semibold text-slate-100">
                          ${item.costUSD.toFixed(5)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {item.toolsTriggered.length === 0 ? (
                              <span className="text-slate-500 text-xs italic">Nenhuma</span>
                            ) : (
                              item.toolsTriggered.map((tool, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-slate-800 border border-slate-700/60 text-slate-300 font-mono text-[10px] rounded"
                                >
                                  {tool}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right text-xs text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
