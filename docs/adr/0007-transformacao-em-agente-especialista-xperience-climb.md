# ADR-0007: Arquitetura Modular de Skills e Seleção Dinâmica de Objetivos

## Status
Proposto

## Data
2026-08-09

## Contexto
O projeto atual foi herdado como um chatbot MVP focado no fluxo de reserva de passagens aéreas (Flight Booking). Para atender à nova demanda de suporte e vendas da **Xperience Climb** ([climb.xperiencehubs.com](https://climb.xperiencehubs.com/)), inicialmente pensou-se em substituir e remover as ferramentas e códigos legados.

No entanto, para manter a flexibilidade da plataforma e permitir que o bot possa alternar entre diferentes "skills" (especialidades) ou objetivos dinamicamente, precisamos de uma arquitetura modular. O sistema deve ser capaz de receber um parâmetro de contexto (como metadados do chat no banco de dados ou parâmetros da URL) e, a partir dele, carregar dinamicamente o prompt de sistema, o fluxo de conversação e o conjunto de ferramentas (*tools*) adequados.

## Decisão
Decidimos implementar uma **Arquitetura Modular de Skills** que preserva o código legado e permite a coexistência de múltiplos agentes especializados no mesmo repositório:

1. **Registro Central de Skills (`lib/ai/skills-registry.ts`)**:
   - Criaremos um registro centralizado que descreve cada especialidade do bot.
   - Cada perfil de skill conterá:
     * `id`: Identificador único (ex: `'flights'`, `'xperience-climb'`).
     * `systemPrompt`: As instruções básicas do sistema, regras de brevidade e comportamento específico.
     * `allowedTools`: Lista de ferramentas que o bot poderá chamar quando esta skill estiver ativa.
     * `theme`: Configurações de UI e estilização associadas (cores, logos, etc).

2. **Carregamento Dinâmico na Rota da API (`app/(chat)/api/chat/route.ts`)**:
   - A rota de chat não terá mais um `system` prompt fixo e um objeto `tools` estático.
   - O chat carregará o identificador da skill (ex: via banco de dados baseado no ID do chat ou via cabeçalho da requisição).
   - O objeto `tools` passado para o `streamText` será filtrado dinamicamente com base nas `allowedTools` da skill selecionada.

3. **Adaptação Dinâmica de Componentes de UI**:
   - A renderização no lado do cliente (`app/(chat)/chat/[id]/page.tsx` ou equivalentes) irá ler a skill ativa associada à sala de conversa e adaptará a visualização:
     * Ocultando ou exibindo componentes interativos baseados nas ferramentas (ex: painel de assentos para voos vs. formulário de leads para a Xperience Climb).
     * Aplicando estilos visuais correspondentes.

## Alternativas Consideradas

*   **Substituição Destrutiva**: Rejeitada. Remover o código de voo impediria o reaproveitamento das telas e lógicas de reserva em futuros fluxos similares de compras e ingressos para a Xperience Climb.
*   **Múltiplas Rotas de API (ex: `/api/chat/flights`, `/api/chat/climb`)**: Rejeitada. Centralizar em `/api/chat` usando metadados permite manter a mesma estrutura de histórico de mensagens e páginas de chat no Next.js sem duplicar código de infraestrutura de streaming.

## Consequências

*   **Pontos Positivos**:
    - **Reusabilidade**: O código legado de reserva de passagens aéreas e assentos continua ativo e pode servir de base/referência para o agendamento de escaladas.
    - **Extensibilidade**: Adicionar uma nova skill ou cliente comercial se torna uma tarefa simples de cadastro no registro e mapeamento de novas tools.
    - **Configuração Declarativa**: O comportamento do bot é facilmente gerenciado declarando o objetivo e as ferramentas permitidas.
*   **Pontos Negativos/Riscos**:
    - Pequeno overhead na API do chat para resolver dinamicamente o mapeamento de tools e prompt de sistema a cada requisição.
    - Necessidade de gerenciar a associação da `skillId` a nível de tabela do banco de dados (tabela `Chat`).
