# ADR-0008: Reestruturação Modular de Rotas e Ferramentas (Tools) de IA

## Status
Proposto

## Data
2026-08-09

## Contexto
Atualmente, as rotas e ferramentas (*tools*) do agente de IA estão centralizadas em arquivos únicos:
*   [`app/(chat)/api/chat/route.ts`](./app/(chat)/api/chat/route.ts): Centraliza o parsing de requisições, rate limiting, gerenciamento de histórico e execução de streaming.
*   [`app/(chat)/api/chat/tools.ts`](./app/(chat)/api/chat/tools.ts): Contém a declaração e a lógica de execução de todas as ferramentas de todos os domínios (voos, RAG, leads, feedback, clima).

Conforme novos domínios e clientes comerciais forem adicionados ao chatbot, essa centralização causará:
1.  **Dificuldade de Manutenção**: Arquivos muito extensos com diversas responsabilidades acopladas de setores de negócio diferentes.
2.  **Conflitos de Merge**: Múltiplos desenvolvedores alterando os mesmos arquivos para adicionar novas ferramentas.
3.  **Dificuldade de Testes**: Mocks complexos devido ao acoplamento excessivo de dependências.

## Decisão
Propomos reestruturar a arquitetura das ferramentas do bot em uma **Estrutura Modular por Domínio** e isolar os utilitários de infraestrutura da rota da API:

### 1. Separação Física das Tools por Domínio
As ferramentas serão movidas de `app/(chat)/api/chat/tools.ts` para arquivos dedicados dentro de um novo subdiretório `ai/tools/`:
*   `ai/tools/general.ts` (ex: `getWeather`)
*   `ai/tools/flights.ts` (ex: `searchFlights`, `selectSeats`, `createReservation`, `authorizePayment`, `displayBoardingPass`)
*   `ai/tools/climb.ts` (ex: `searchClimbKnowledge`, `listClimbPackages`, `createClimbBooking`, `generatePaymentLink`, `saveLeadInfo`, `submitUserFeedback`)

Cada arquivo exportará um subconjunto de ferramentas tipadas pelo Vercel AI SDK.

### 2. Carregamento de Tools através do Registry
A `skills-registry.ts` ou um indexador central de tools (`ai/tools/index.ts`) combinará os exports e servirá o mapa necessário com base nas ferramentas permitidas (`allowedTools`) da skill correspondente.

```typescript
// Exemplo em ai/tools/index.ts
import { generalTools } from "./general";
import { flightTools } from "./flights";
import { climbTools } from "./climb";

export const allTools = {
  ...generalTools,
  ...flightTools,
  ...climbTools,
};
```

### 3. Modularização da Rota da API (Clean API Route)
Iremos refatorar o arquivo `route.ts` para delegar tarefas específicas para módulos auxiliares:
*   **Rate Limiting**: Executado por um helper de middleware ou decorator.
*   **State / Session Hydration**: Um módulo para carregar o histórico de mensagens e o contexto da Skill.
*   **Orquestração de Resposta**: Mantém a rota limpa, chamando apenas a orquestração do `streamText` usando a Skill resolvida e as ferramentas filtradas.

## Alternativas Consideradas

*   **Manter a Estrutura Atual**: Rejeitada. A estrutura atual funciona para um MVP com poucas ferramentas, mas não escala para uma plataforma multi-tenant ou com muitas especialidades.
*   **Substituição por Plugins Dinâmicos Carregados via Banco de Dados**: Considerado complexo para o escopo atual, embora a estrutura modular proposta prepare o terreno para essa transição no futuro.

## Consequências

### Pontos Positivos
*   **Alta Coesão e Baixo Acoplamento**: Alterações no domínio de voos não afetam o domínio da Xperience Climb.
*   **Facilidade de Teste**: Permite importar e testar apenas as ferramentas de um arquivo específico sem carregar dependências desnecessárias do banco ou de outros pacotes.
*   **Organização Limpa**: Facilita a navegação no projeto por novos membros da equipe.

### Pontos Negativos / Riscos
*   Necessidade de atualizar os imports em arquivos de teste existentes.
*   Pequeno aumento inicial no número de arquivos no projeto.
