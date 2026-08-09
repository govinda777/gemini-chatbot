# ADR-0005: Testes BDD (Behavior-Driven Development) e Validação de Chamadas de Ferramentas (Tool Calls)

## Status
Proposto

## Data
2026-08-08

## Contexto
O comportamento de agentes de IA baseados em Large Language Models (LLMs) é intrinsicamente não-determinístico. Para garantir que o agente da **Xperience Climb** funcione corretamente, não basta testar respostas de texto exatas. 
Precisamos:
1. Validar que intenções específicas do usuário acionam as ferramentas corretas (ex: ao dizer "quero reservar Pedra Bela", o bot deve obrigatoriamente chamar a ferramenta de listagem de pacotes e em seguida coletar o lead).
2. Definir uma especificação baseada em BDD (Behavior-Driven Development) usando a sintaxe Gherkin (`Given/When/Then`) para aproximar a equipe de produto, comercial e engenharia.
3. Garantir que as validações de acionamento das ferramentas (Tool Calling) rodem de forma automatizada no pipeline de CI/CD.

## Decisão
Adotaremos uma abordagem de testes integrados e BDD com as seguintes especificações e ferramentas:

### 1. Framework de Testes
Utilizaremos o **Vitest** (ou **Jest**) em conjunto com o **Playwright** (para BDD E2E e interface de chat) e a biblioteca de teste nativa do **Vercel AI SDK** (`ai/test` ou mocks de modelo).

### 2. Especificação BDD (Exemplo Gherkin)
Escreveremos arquivos de especificação `.feature` para descrever os comportamentos esperados:

```gherkin
Funcionalidade: Agendamento e Captura de Leads
  Cenário: Usuário deseja reservar uma escalada para iniciante
    Dado que o usuário inicia uma nova conversa com o bot
    Quando o usuário envia a mensagem "Sou iniciante e quero agendar Pedra Bela"
    Então o bot deve acionar a ferramenta "listClimbPackages" com o filtro "iniciante"
    E o bot deve apresentar o pacote "Batismo de Escalada - Pedra Bela"
    Quando o usuário clica em reservar
    Então o bot deve acionar a ferramenta "saveLeadInfo" para capturar o contato
```

### 3. Validação Programática de Chamadas de Ferramentas (Tool Calls)
Para validar que o envio de um comando aciona as ferramentas corretas (ex: Ferramenta X e Y), usaremos testes de integração que interceptam a execução do `streamText` ou `generateText`. 

Exemplo de implementação de teste de unidade/integração no Vitest/Jest:

```typescript
import { generateText } from "ai";
import { expect, test, vi } from "vitest";
import { geminiFlashModel } from "@/ai";
import { getTools } from "@/app/api/chat/tools"; // Tools exportadas

test("Deve acionar a ferramenta listClimbPackages e saveLeadInfo sequencialmente", async () => {
  // Mock das implementações das ferramentas para rastrear as chamadas
  const mockListPackages = vi.fn().mockResolvedValue([{ id: "1", name: "Pedra Bela", price: 350 }]);
  const mockSaveLead = vi.fn().mockResolvedValue({ success: true });

  const testTools = {
    listClimbPackages: {
      ...getTools.listClimbPackages,
      execute: mockListPackages
    },
    saveLeadInfo: {
      ...getTools.saveLeadInfo,
      execute: mockSaveLead
    }
  };

  // Executa a chamada simulando o prompt do usuário
  await generateText({
    model: geminiFlashModel,
    tools: testTools,
    prompt: "Quero agendar o batismo de escalada em Pedra Bela, meu nome é Govinda e meu email é teste@email.com",
  });

  // Asserções BDD: Validando se as ferramentas certas foram acionadas com os parâmetros extraídos
  expect(mockListPackages).toHaveBeenCalled();
  expect(mockSaveLead).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "Govinda",
      email: "teste@email.com"
    })
  );
});
```

### 4. Avaliação de Resposta Correta (LLM-as-a-Judge)
Para testar a qualidade gramatical e restrições de comportamento do texto final (ex: "não fale sobre voos", "seja conciso"):
- Utilizaremos testes automatizados rodando uma segunda instância do LLM (Gemini 2.5 Flash) configurado como "Juiz".
- O Juiz recebe a pergunta do usuário, a resposta do bot e um conjunto de regras (rubricas) de avaliação, retornando um JSON com nota de 0 a 5 e justificativa de aderência às regras do negócio.

## Alternativas Consideradas

*   **Testes manuais de chat**: Rejeitados por serem lentos, propensos a erros humanos e impossíveis de escalar conforme novas ferramentas são criadas.
*   **Asserções por Strings Exatas (ex: `expect(response).toContain("Pedra Bela")`)**: Rejeitados devido à natureza não-determinística da linguagem gerada, o que quebraria os testes em pequenas variações de vocabulário do modelo mesmo a resposta estando correta.

## Consequências
*   **Pontos Positivos**:
    - Garantia determinística de que as ferramentas críticas de negócio (como criar links de pagamento ou salvar leads) estão sendo chamadas com os parâmetros corretos.
    - Facilidade para validar regressões ao trocar ou atualizar versões do modelo LLM.
    - Linguagem comum (BDD/Gherkin) facilita o alinhamento com stakeholders não técnicos.
*   **Pontos Negativos/Riscos**:
    - Maior tempo de execução dos testes na pipeline de CI/CD se bater diretamente nas APIs de LLM (solucionado usando mock/caching de respostas da API do Gemini para testes de CI rápidos).
