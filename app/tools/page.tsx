"use client";

import { 
  Play, 
  Terminal, 
  HelpCircle, 
  Code, 
  Check, 
  Copy, 
  Loader2, 
  Compass,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

interface ParamInfo {
  name: string;
  type: string;
  description: string;
  required: boolean;
  options?: string[];
  fields?: ParamInfo[];
}

interface ToolMeta {
  name: string;
  description: string;
  params: ParamInfo[];
}

export default function ToolsSwaggerPage() {
  const [tools, setTools] = useState<ToolMeta[]>([]);
  const [selectedToolName, setSelectedToolName] = useState<string>("");
  const [paramsInput, setParamsInput] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch metadata dynamically from the endpoint
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch("/api/tools-metadata");
        const data = await res.json();
        if (data.success && data.tools) {
          setTools(data.tools);
          if (data.tools.length > 0) {
            setSelectedToolName(data.tools[0].name);
          }
        } else {
          setErrorMessage("Falha ao carregar metadados das ferramentas.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Erro de rede ao buscar ferramentas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetadata();
  }, []);

  const selectedTool = tools.find(t => t.name === selectedToolName);

  // Initialize defaults when selected tool changes
  useEffect(() => {
    if (!selectedTool) return;
    const initial: Record<string, any> = {};
    
    // Function to set default values
    const setupDefaults = (params: ParamInfo[], target: Record<string, any>) => {
      params.forEach(p => {
        if (p.type === "object" && p.fields) {
          target[p.name] = {};
          p.fields.forEach(sub => {
            target[p.name][sub.name] = sub.type === "boolean" ? false : "";
          });
        } else if (p.type === "boolean") {
          target[p.name] = false;
        } else if (p.options && p.options.length > 0) {
          target[p.name] = p.options[0];
        } else {
          target[p.name] = "";
        }
      });
    };

    setupDefaults(selectedTool.params, initial);
    setParamsInput(initial);
    setExecutionResult(null);
  }, [selectedToolName, selectedTool]);

  const handleInputChange = (name: string, val: any, type: string, parentName?: string) => {
    let value = val;
    if (type === "number" && val !== "") {
      value = Number(val);
    } else if (type === "boolean") {
      value = Boolean(val);
    }

    if (parentName) {
      setParamsInput(prev => ({
        ...prev,
        [parentName]: {
          ...prev[parentName],
          [name]: value
        }
      }));
    } else {
      setParamsInput(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const executeToolAction = async () => {
    if (!selectedTool) return;
    setIsRunning(true);
    setExecutionResult(null);

    // Transform arrays representation from string input (e.g. split comma strings)
    const formattedParams = { ...paramsInput };
    selectedTool.params.forEach(p => {
      if (p.type === "array" && typeof formattedParams[p.name] === "string") {
        formattedParams[p.name] = formattedParams[p.name]
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
    });

    try {
      const res = await fetch("/api/run-tool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolName: selectedTool.name,
          parameters: formattedParams
        })
      });

      const data = await res.json();
      setExecutionResult(data);
    } catch (e: any) {
      setExecutionResult({ error: e.message || "Network Error" });
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-orange-500" />
          <span className="text-sm text-slate-400">Carregando interface Swagger das ferramentas...</span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-red-950 rounded-xl p-6 max-w-md flex flex-col items-center gap-4 text-center">
          <AlertCircle className="size-12 text-red-500" />
          <h2 className="text-xl font-bold">Erro</h2>
          <p className="text-sm text-slate-400">{errorMessage}</p>
          <Link href="/" className="px-4 py-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700">
            Voltar ao Chat
          </Link>
        </div>
      </div>
    );
  }

  // Generate dynamic execution code snippet based on the current form inputs
  const getDynamicSnippet = () => {
    if (!selectedTool) return "";
    const cleanParams = { ...paramsInput };
    selectedTool.params.forEach(p => {
      if (p.type === "array" && typeof cleanParams[p.name] === "string") {
        cleanParams[p.name] = cleanParams[p.name].split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    });
    return `import { getTools } from "@/app/(chat)/api/chat/tools";\n\nconst result = await getTools.${selectedTool.name}.execute(${JSON.stringify(cleanParams, null, 2)});`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30">
      {/* Swagger style header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 text-xs font-bold font-mono bg-emerald-500 text-slate-950 rounded-md">
            SWAGGER
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Tools API Console
              <span className="text-xs text-slate-500 font-mono font-normal">v1.0.0</span>
            </h1>
            <p className="text-xs text-slate-400">Interface gerada dinamicamente a partir dos schemas de código das tools</p>
          </div>
        </div>
        <div>
          <Link
            href="/"
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition duration-200"
          >
            Voltar ao Chat
          </Link>
        </div>
      </header>

      {/* Grid container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* Sidebar list */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 font-mono">
              <Compass className="size-3.5" />
              Operações Disponíveis
            </span>
            
            <div className="flex flex-col gap-1.5">
              {tools.map(tool => (
                <button
                  key={tool.name}
                  onClick={() => setSelectedToolName(tool.name)}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition duration-150 flex items-center justify-between font-mono ${
                    selectedToolName === tool.name 
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/30" 
                      : "hover:bg-slate-800/60 text-slate-400 border border-transparent"
                  }`}
                >
                  <span>{tool.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-800 text-slate-400">POST</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Console details */}
        <main className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tool interactive parameters */}
          {selectedTool && (
            <section className="flex flex-col gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 relative">
                
                {/* Method tag and details */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-orange-600 text-white rounded">POST</span>
                    <span className="text-sm font-mono text-slate-300">/api/chat/tools/{selectedTool.name}</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
                    {selectedTool.name}
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {selectedTool.description}
                  </p>
                </div>

                {/* Dynamic Parameter builder form */}
                <div className="border-t border-slate-800 pt-4 flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Parameters</h3>
                  
                  <form onSubmit={(e) => { e.preventDefault(); executeToolAction(); }} className="flex flex-col gap-4">
                    {selectedTool.params.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Esta ferramenta não possui parâmetros de entrada.</p>
                    ) : (
                      selectedTool.params.map(param => {
                        // Render object parameters (like departure, arrival)
                        if (param.type === "object" && param.fields) {
                          return (
                            <div key={param.name} className="border border-slate-800 bg-slate-950/40 rounded-xl p-3.5 flex flex-col gap-3">
                              <span className="text-xs font-bold text-slate-400 font-mono">{param.name} (object)</span>
                              <div className="grid grid-cols-2 gap-3">
                                {param.fields.map(subField => (
                                  <div key={subField.name} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-mono text-slate-500 flex justify-between">
                                      <span>{subField.name}</span>
                                      <span className="text-slate-600">{subField.type}</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={paramsInput[param.name]?.[subField.name] ?? ""}
                                      onChange={(e) => handleInputChange(subField.name, e.target.value, subField.type, param.name)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-700 outline-none focus:border-orange-500"
                                      placeholder={subField.description}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // Render regular parameters
                        return (
                          <div key={param.name} className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono">
                              {param.name}
                              {param.required ? (
                                <span className="text-red-500 text-[10px]">*</span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">(optional)</span>
                              )}
                              <span className="text-[9px] text-slate-600 bg-slate-900 border border-slate-800 px-1 rounded ml-auto">
                                {param.type}
                              </span>
                            </label>

                            {param.options ? (
                              <select
                                value={paramsInput[param.name] || ""}
                                onChange={(e) => handleInputChange(param.name, e.target.value, param.type)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-orange-500 outline-none"
                              >
                                {param.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : param.type === "boolean" ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="checkbox"
                                  id={`check-${param.name}`}
                                  checked={!!paramsInput[param.name]}
                                  onChange={(e) => handleInputChange(param.name, e.target.checked, param.type)}
                                  className="rounded border-slate-800 bg-slate-950 text-orange-500 focus:ring-0 size-4 cursor-pointer"
                                />
                                <label htmlFor={`check-${param.name}`} className="text-xs text-slate-400 cursor-pointer">
                                  {param.description}
                                </label>
                              </div>
                            ) : (
                              <input
                                type={param.type === "number" ? "number" : "text"}
                                placeholder={param.description || `Enter ${param.name}`}
                                value={paramsInput[param.name] === undefined ? "" : paramsInput[param.name]}
                                onChange={(e) => handleInputChange(param.name, e.target.value, param.type)}
                                required={param.required}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none"
                              />
                            )}
                          </div>
                        );
                      })
                    )}

                    <button
                      type="submit"
                      disabled={isRunning}
                      className="mt-2 w-full py-2.5 px-4 rounded-lg font-bold text-white bg-orange-600 hover:bg-orange-700 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 disabled:opacity-50 font-mono text-xs"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          EXECUTION IN PROGRESS...
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 fill-white text-white" />
                          EXECUTE (TRY IT OUT)
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* Response / Snippet Panel */}
          {selectedTool && (
            <section className="flex flex-col gap-6">
              
              {/* Dynamic code snippet generator */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <Code className="size-4 text-emerald-400" />
                    Invocation Code
                  </span>
                  <button
                    onClick={() => copyToClipboard(getDynamicSnippet())}
                    className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </h3>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[10px] overflow-x-auto text-emerald-300">
                  <pre>{getDynamicSnippet()}</pre>
                </div>
              </div>

              {/* Execution API result */}
              <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="size-4 text-orange-400" />
                    Response Body
                  </span>
                  {executionResult && (
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(executionResult, null, 2))}
                      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                    >
                      {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      Copy Response
                    </button>
                  )}
                </h3>

                <div className="flex-1 min-h-[220px] max-h-[500px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] relative">
                  {isRunning ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="size-6 animate-spin text-orange-500" />
                        <span className="text-xs text-slate-500">Aguardando resposta do servidor...</span>
                      </div>
                    </div>
                  ) : null}

                  {executionResult ? (
                    <pre className="text-slate-300">{JSON.stringify(executionResult, null, 2)}</pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                      <HelpCircle className="size-8 opacity-40" />
                      <span className="text-xs text-center px-4">Execute a operação acima para visualizar o retorno da API.</span>
                    </div>
                  )}
                </div>
              </div>

            </section>
          )}

        </main>
      </div>
    </div>
  );
}
