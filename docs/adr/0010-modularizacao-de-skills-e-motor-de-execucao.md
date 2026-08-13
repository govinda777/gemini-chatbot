# ADR-0010: Modularização de Skills (Comportamentos/Tools) e Isolamento do Motor de Execução

## Status
Proposto

## Data
2026-08-11

## Contexto
Atualmente, as habilidades do chatbot (como `flights` e `xperience-climb`) são declaradas no registro geral [`skills-registry.ts`](file:///Users/govinda/projetos/gemini-chatbot/lib/ai/skills-registry.ts), mas a implementação de suas ferramentas (*tools*) reside de forma centralizada ou semi-centralizada em [`tools.ts`](file:///Users/govinda/projetos/gemini-chatbot/app/%28chat%29/api/chat/tools.ts).

O motor de execução da rota de API [`route.ts`](file:///Users/govinda/projetos/gemini-chatbot/app/%28chat%29/api/chat/route.ts) é responsável por mediar tanto a infraestrutura (sessão, rate limit, logging, streaming de tokens) quanto a amarração específica de quais ferramentas daquele domínio devem ser ativadas.

Conforme a plataforma evolui para hospedar dezenas de diferentes fluxos comerciais de filiais ou especialidades, a falta de isolamento estrito causará:
1.  **Poluição do motor de execução**: O motor precisará gerenciar dependências e importações específicas de ferramentas de domínios totalmente distintos.
2.  **Acoplamento indesejado**: Alterações de infraestrutura da API podem quebrar involuntariamente a lógica de comportamento das skills, e vice-versa.
3.  **Dificuldade de expansão**: Criar uma nova skill exige editar múltiplos arquivos espalhados pela base de código (registros, ferramentas do chat, componentes de tela, etc.).

## Decisão
Decidimos separar de forma rígida o **Motor de Execução de IA** dos **Módulos de Comportamento (Skills)**, transformando cada Skill em um módulo autocontido e desacoplado:

### 1. Definição do Contrato de Módulo de Skill
Criaremos uma interface abstrata que define o que constitui um módulo de skill no diretório de tipos:

```typescript
export interface SkillModule {
  id: string;
  name: string;
  systemPrompt: string;
  tools: Record<string, CoreTool<any, any>>; // Conjunto de ferramentas da biblioteca do Vercel AI SDK
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    mode: "light" | "dark";
  };
}
```

### 2. Criação do Diretório de Skills Autocontidas
Cada Skill será organizada em seu próprio subdiretório dentro de `lib/skills/`:
*   `lib/skills/climb/`
    *   `index.ts` (Exporta a implementação de `SkillModule` da Xperience Climb)
    *   `prompt.ts` (Instruções e regras de segurança do montanhismo)
    *   `tools.ts` (Declarações Zod e código de execução das ferramentas específicas chamadas pela IA)
    *   `actions.ts` (Server Actions do Next.js utilizadas pela UI client-side específicas deste domínio)
    *   `knowledge.ts` (Lógica de busca na base de dados RAG local)
*   `lib/skills/flights/`
    *   `index.ts` (Habilidade legada de voos)
    *   `prompt.ts`
    *   `tools.ts`
    *   `actions.ts` (Server Actions legadas de voos, ex: geração de status de voos fictícios)

### 3. Desacoplamento do Motor de Execução
O arquivo [`route.ts`](file:///Users/govinda/projetos/gemini-chatbot/app/%28chat%29/api/chat/route.ts) e a própria API de chat passam a tratar as Skills de forma genérica. O motor:
1.  Recebe a requisição com o ID da Skill.
2.  Consulta o registro dinâmico que importa o módulo correspondente.
3.  Injeta `skill.systemPrompt` e passa `skill.tools` diretamente para o `streamText`, sem precisar conhecer a implementação ou importar ferramentas específicas de cada domínio.

```typescript
// Exemplo conceitual no motor de execução (route.ts)
const skillModule = getSkillModule(skillId);

const result = await streamText({
  model: geminiFlashModel,
  system: skillModule.systemPrompt,
  messages: coreMessages,
  tools: skillModule.tools, // Passa as ferramentas encapsuladas do módulo
});
```

### 4. Mapeamento e Desacoplamento da Interface de Usuário (UI)
Atualmente, [`message.tsx`](file:///Users/govinda/projetos/gemini-chatbot/components/custom/message.tsx) importa componentes e contém uma cadeia de condicionais (`if/else` ou `switch`) acoplada a todas as ferramentas existentes. Para modularizar a UI:

1.  **Isolamento dos Componentes Visuais**:
    *   Moveremos os cards e formulários para pastas específicas por domínio em `components/skills/[skill-id]/`.
2.  **Registro de Renderização no Cliente (UI Registry)**:
    *   Criaremos um indexador dinâmico de UI (ex: `components/skills/ui-registry.tsx`) que mapeia o nome da ferramenta (`toolName`) para o respectivo componente visual a ser exibido.
    *   [`message.tsx`](file:///Users/govinda/projetos/gemini-chatbot/components/custom/message.tsx) deixará de conter lógica condicional rígida de domínios. Em vez disso, consultará o registro de componentes clientes:
    
    ```typescript
    // Exemplo de consumo dinâmico no message.tsx
    import { getSkillUIComponent } from "@/components/skills/ui-registry";
    
    const RenderedComponent = getSkillUIComponent(toolName);
    return RenderedComponent ? <RenderedComponent result={result} /> : <DefaultJSONView result={result} />;
    ```

## Consequências

### Pontos Positivos
*   **Encapsulamento Estrito**: Cada domínio/cliente possui seu próprio ciclo de vida de código. Adicionar ou remover uma Skill é tão simples quanto criar/deletar um diretório sob `lib/skills/` e atualizar o registro central.
*   **Redução de Complexidade no Motor**: O código de infraestrutura do Next.js e do Vercel AI SDK permanece imutável e focado apenas em orquestrar streams de dados.
*   **Testabilidade Isolada**: É possível rodar testes unitários e de integração importando apenas o módulo `lib/skills/climb/index.ts` sem poluir o ambiente de execução com dependências de voos.

### Pontos Negativos / Riscos
*   Esforço inicial de refatoração para mover as declarações e imports existentes para a nova estrutura de diretórios.
