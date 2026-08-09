import { spawn } from "child_process";

// Inicia o servidor de desenvolvimento Next.js (sem Turbopack para evitar panics/erros de cache RSC)
const child = spawn("next", ["dev"], {
  stdio: "inherit",
  shell: true,
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

// Imprime as URLs da aplicação no terminal com destaque após o carregamento inicial
setTimeout(() => {
  console.log("\n");
  console.log("\x1b[36m%s\x1b[0m", "=========================================================");
  console.log("\x1b[32m%s\x1b[0m", "🚀 SERVIDOR DE DESENVOLVIMENTO INICIADO COM SUCESSO!");
  console.log("\x1b[36m%s\x1b[0m", "=========================================================");
  console.log("Acesse as seguintes URLs locais no seu navegador:");
  console.log("\n");
  console.log(`   🏠  Application Home:      \x1b[4m\x1b[34mhttp://localhost:3000\x1b[0m`);
  console.log(`   📊  LLM Usage & Cost:      \x1b[4m\x1b[34mhttp://localhost:3000/test-report\x1b[0m`);
  console.log(`   🛠️  Tools Swagger Console:  \x1b[4m\x1b[34mhttp://localhost:3000/tools\x1b[0m`);
  console.log(`   🔌  Tools Metadata API:    \x1b[4m\x1b[34mhttp://localhost:3000/api/tools-metadata\x1b[0m`);
  console.log("\x1b[36m%s\x1b[0m", "=========================================================\n");
}, 4000);
