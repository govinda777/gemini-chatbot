# ADR-0002: Estrutura de Captura de Leads e Coleta de Feedback

## Status
Proposto

## Data
2026-08-08

## Contexto
Para apoiar o crescimento de negócios da **Xperience Climb**, o agente precisa ser capaz de:
1. **Capturar Leads**: Identificar usuários interessados em escaladas/cursos, registrando suas informações de contato e preferências (como nível de experiência e passeios desejados).
2. **Coletar Feedback**: Permitir que os usuários enviem críticas, avaliações e comentários diretamente no chat (ex: ao final de um atendimento ou após simular uma compra).

Atualmente, o banco de dados (`db/schema.ts`) possui apenas tabelas para `User`, `Chat` e `Reservation`. Anteriormente, o fluxo era orquestrado por um **n8n** externo (enviando Gmail e salvando no Google Sheets). Como esta nova arquitetura visa provar que uma abordagem puramente baseada em código e agente autônomo é mais eficiente e menos fragmentada, eliminaremos o n8n do fluxo.

## Decisão
Implementaremos duas novas tabelas no banco de dados através do Drizzle ORM e criaremos ferramentas (tools) específicas que o agente invocará no Vercel AI SDK, centralizando toda a lógica de negócios no Next.js:

1. **Modelagem de Leads (`Lead`)**:
   - Campos: `id` (UUID), `createdAt` (Timestamp), `userId` (referência opcional ao usuário logado), `name` (varchar), `email` (varchar), `whatsapp` (varchar), `climbingExperience` (enum/varchar: iniciante, intermediário, avançado), `interestDetails` (text).
   - O agente usará a tool `saveLeadInfo` para registrar esses dados sempre que o usuário demonstrar interesse em receber contato comercial ou novidades.

2. **Modelagem de Feedbacks (`Feedback`)**:
   - Campos: `id` (UUID), `createdAt` (Timestamp), `userId` (UUID), `rating` (integer, 1-5), `comment` (text), `category` (varchar: ex: 'sistema', 'servico', 'instrutores').
   - O agente usará a tool `submitUserFeedback` ao final do fluxo de conversa ou quando o usuário expressar desejo de dar feedback.

3. **Substituição Nativa do n8n (Envio de E-mail e Google Sheets)**:
   - Para provar a maior eficiência da nova arquitetura, o envio de e-mails de notificação de novos leads será feito de forma nativa e assíncrona no Next.js (utilizando bibliotecas leves como **Resend** ou **Nodemailer**).
   - O salvamento de resumos no Google Sheets será substituído por inserções diretas no banco de dados Postgres (`Lead`). Caso a sincronização com planilhas ainda seja necessária comercialmente, usaremos a biblioteca oficial `@googleapis/sheets` diretamente via Server Actions no Next.js ou criaremos uma rota `/api/leads/export` para download em CSV, removendo qualquer necessidade de ferramentas de no-code externas (n8n).

## Alternativas Consideradas

*   **Manter o n8n em segundo plano**: Rejeitado. Introduziria latência adicional de rede, múltiplos pontos de falha e complexidade desnecessária no gerenciamento de estado e deploy da aplicação. Centralizar a lógica no Next.js simplifica o monitoramento e o pipeline de CI/CD.
*   **Salvar no próprio histórico de Chat (`json("messages")`)**: Rejeitado, pois extrair estatísticas de leads e feedbacks salvos apenas dentro de conversas exigiria processamento caro de IA ou parsers complexos de JSON.



## Consequências
*   **Pontos Positivos**:
    - Centralização de leads estruturados para ações de marketing direta.
    - Facilidade para gerar dashboards futuros de conversão e satisfação do cliente.
    - Permite fluxo de conversação inteligente onde o bot "qualifica" o lead antes de passar para o comercial humano.
*   **Pontos Negativos/Riscos**:
    - Necessidade de adequação às normas da LGPD (Lei Geral de Proteção de Dados) na coleta de e-mail e WhatsApp, exigindo que o bot peça consentimento explícito antes de registrar os dados.
    - Requer alteração de esquema no banco de dados (`drizzle migrations`).
