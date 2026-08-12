# 📚 Central de Documentação - Gemini Chatbot

Bem-vindo à central de documentação técnica do projeto **gemini-chatbot**. Aqui você encontrará todas as informações sobre a arquitetura do agente, guias de desenvolvimento, banco de dados, deploy e decisões de projeto.

---

## 🗺️ Mapa de Guias e Tutoriais

### 🤖 Inteligência Artificial & Comportamento
*   [**Estratégia de Algoritmo de IA e Tools**](./docs/ai-strategy-and-tools.md): Explica como o modelo Gemini é acionado, a orquestração do Vercel AI SDK, o sandboxing de ferramentas permitidas e o ciclo de vida do *tool calling*.
*   [**Guia de Personalização (Skills)**](./docs/customization-guide.md): Detalha como a arquitetura do bot é modularizada para suportar diferentes "Skills" (como voos ou montanhismo) sem quebrar código legado.

### ⛰️ Módulo Xperience Climb
*   [**Guia de Componentes Climb e Integração**](./docs/climb-components-guide.md): Documenta como a IA utiliza componentes visuais interativos ([`climb-components.tsx`](./components/climb/climb-components.tsx)) no chat.
*   [**Edição da Base de Conhecimento RAG**](./docs/climb-knowledge-guide.md): Ensina como estruturar e adicionar novos dados no arquivo [`climb-knowledge.json`](./lib/data/climb-knowledge.json) utilizado para o RAG de dúvidas de segurança e logística.

### ⚙️ Infraestrutura, Deploy & DevOps
*   [**Modelagem de Banco de Dados e Migrações**](./docs/db-schema-guide.md): Detalha a modelagem das tabelas do banco de dados relacional e comandos de migração com Drizzle ORM.
*   [**Guia de Variáveis de Ambiente**](./docs/env-variables-guide.md): Lista e descreve todas as chaves necessárias para configurar e rodar a aplicação localmente ou em produção.
*   [**Guia de Integração Contínua com Neon DB**](./docs/NEON_CICD_GUIDE.md): Passo a passo para configurar branches de banco de dados efêmeras para testes de CI/CD.
*   [**Guia de Deploy Local (Raiz)**](./LOCAL_DEPLOYMENT.md): Instruções para configurar e rodar o banco PostgreSQL, Vercel Blob e migrações localmente.

### 🧪 Qualidade & Validação
*   [**Guia de Testes BDD, Integração e E2E**](./docs/testing-guide.md): Explica os testes unitários/integração com Vitest, especificações BDD, testes end-to-end com Playwright e o monitoramento de uso de tokens.

### 📐 Decisões de Arquitetura (ADRs)
Todas as decisões técnicas tomadas na transição do projeto para a **Xperience Climb** estão descritas na pasta [`docs/adr/`](./docs/adr).
Consulte o [**README de ADRs**](./docs/adr/README.md) para obter o índice completo das decisões de design.
