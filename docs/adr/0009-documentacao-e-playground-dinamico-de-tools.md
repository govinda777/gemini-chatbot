# ADR-0009: Documentação Viva e Playground Dinâmico de Tools (Console Interativo)

## Status
Implementado

## Data
2026-08-09

## Contexto
O projeto conta com diversas ferramentas (*tools*) de IA declaradas em [`app/(chat)/api/chat/tools.ts`](file:///Users/govinda/projetos/gemini-chatbot/app/(chat)/api/chat/tools.ts).
No entanto, entender o fluxo, os objetivos destas ferramentas e como acioná-las manualmente para testes de integração ou validações manuais era difícil devido a:
1.  **Documentação Estática Desatualizada**: Qualquer alteração em um parâmetro do schema Zod de uma ferramenta precisava ser documentada manualmente em arquivos Markdown externos.
2.  **Falta de um Console de Execução**: Não havia uma forma rápida de disparar chamadas individuais para as ferramentas (como reservas ou consultas) de forma isolada, necessitando simular conversas inteiras no chatbot.
3.  **Visualização Oposta**: A tela de boas-vindas do chat era um texto genérico, sem representar o real escopo das habilidades (*skills*) ativas na aplicação.

## Decisão
Propomos implementar um ecossistema de **Documentação Viva** acoplado ao código, composto por:

### 1. Documentação no Próprio Código (Inline JSDoc)
Todas as ferramentas de [`tools.ts`](file:///Users/govinda/projetos/gemini-chatbot/app/(chat)/api/chat/tools.ts) receberão blocos ricos de JSDoc contendo:
*   **Propósito (Purpose)** da ferramenta.
*   **Momento de Acionamento (Trigger Condition)** pelo LLM.
*   **Exemplos de chamadas em JSON e TypeScript** mostrando a execução direta pelo código.

### 2. API de Introspecção de Schemas (`/api/tools-metadata`)
Criação de um endpoint HTTP GET que inspeciona o objeto `getTools` programaticamente. Ele analisa os schemas `z.ZodObject` do Zod e expõe dinamicamente os tipos de parâmetros, campos obrigatórios e descrições para a interface de usuário.

### 3. Playground Interativo de Ferramentas (Swagger Console)
Substituição da página estática `/tools` por um console interativo (inspirado na interface do Swagger UI/Postman) que:
*   Carrega dinamicamente a lista de operações disponíveis a partir de `/api/tools-metadata`.
*   Monta automaticamente formulários com base no tipo de parâmetro (texto, números, booleanos ou objetos complexos).
*   Permite que desenvolvedores preencham os campos e cliquem em "Execute (Try It Out)", enviando a requisição para a rota segura `/api/run-tool` para ver a resposta em tempo real.

### 4. Análise e Geração de Capacidades em Tempo de Build
Criação do script [`scripts/analyze-bot.ts`](file:///Users/govinda/projetos/gemini-chatbot/scripts/analyze-bot.ts) que roda automaticamente nos ganchos de `build` e `dev` do `package.json`. Ele extrai os fluxos, prompts de sistema e propósitos das ferramentas ativas e compila um manifesto de capacidades ([`bot-capabilities.json`](file:///Users/govinda/projetos/gemini-chatbot/lib/data/bot-capabilities.json)). A tela inicial do chatbot consome este JSON para mostrar de forma viva tudo o que o assistente sabe fazer.

### 5. Log de Endpoints Locais no Startup do Servidor
Implementação de um runner de desenvolvimento customizado ([`scripts/dev-runner.ts`](file:///Users/govinda/projetos/gemini-chatbot/scripts/dev-runner.ts)) que, ao rodar `pnpm dev`, inicializa o servidor do Next.js e exibe um painel legível com os links diretos para a Home da aplicação, o console Swagger e o endpoint de metadados.

## Alternativas Consideradas
*   **Criar documentação externa estática (ex: GitBook/Wiki)**: Rejeitada. Documentações estáticas sofrem de obsolescência rápida assim que os schemas do código mudam.
*   **Usar o Swagger-UI do Swagger Express**: Rejeitada. Como as ferramentas do Vercel AI SDK não são rotas REST clássicas, mas sim definições de schemas acopladas à geração de IA, o Swagger padrão exigiria a reescrita de especificações OpenAPI adicionais. A introspecção direta via TypeScript/Zod provou-se muito mais simples e coesa.

## Consequências

### Pontos Positivos
*   **Sem redundância (DRY)**: A interface de teste e a documentação se adaptam automaticamente a qualquer refatoração no arquivo `tools.ts`.
*   **Facilidade de Teste**: Permite debugar facilmente o retorno de ferramentas que se conectam com o banco ou APIs sem precisar passar pelo fluxo conversacional completo.
*   **Experiência Viva na Tela Inicial**: A tela inicial agora reflete exatamente as especialidades do bot atual em tempo de execução.

### Pontos Negativos / Riscos
*   Ligeiro aumento de 2 a 3 segundos no tempo de preparação da build devido à execução do script de análise estática.
