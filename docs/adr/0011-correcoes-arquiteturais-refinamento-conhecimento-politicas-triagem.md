# ADR-0011: Correções Arquiteturais, Refinamento de Conhecimento e Políticas de Triagem

## Status
Proposto

## Data
2024-05-24

## 1. Contexto & Problema

Durante testes práticos com o chatbot da Xperience Climb, foram identificadas diversas oportunidades críticas de melhoria e inconsistências arquiteturais e funcionais:

*   **Alucinações e Rigidez de Base**: O modelo apresentou comportamentos não esperados ao oferecer serviços de hospedagem e realizar divisão de quartos por gênero. Estes serviços são inexistentes no catálogo de ofertas. A atual consulta de contexto carece de maior restrição e direcionamento.
*   **Políticas e Informações Ausentes**: Há uma lacuna de informações estruturadas (na base de conhecimento) referentes a políticas de cancelamento, regras para lidar com clima adverso e particularidades sobre o microclima local.
*   **Vazamento de Debug / Raw Data na UI**: Em algumas interações, o chat renderizou trechos brutos da base de conhecimento (JSON/Markdown) ou dados de depuração diretamente na interface do usuário, quebrando a experiência visual esperada.
*   **Inconsistências em Arquivos JSON**: Foram detectados erros nos dados cadastrais com a mistura indevida de informações de diferentes destinos (ex.: São Bento de Sapucaí e Pedra Bela).
*   **Prompt e Vocabulário**: Há necessidade de alinhar a terminologia central no System Prompt, alterando as referências de "montanhismo" para "escalada".
*   **Fluxo de Checkout Incompleto**: Atualmente o fluxo de checkout está muito básico, capturando apenas o nome do usuário. O processo necessita de validações rigorosas usando campos tradicionais e integração com controle de limite de vagas e número de participantes.
*   **Triagem e Human-in-the-Loop (HITL)**: Faltam políticas e regras de interrupção claras (*guardrails*). Consultas contendo perguntas pessoais, de caráter sensível, ou fora do escopo comercial não devem receber respostas autônomas, e sim acionar o transbordo para um atendente humano.
*   **Novas Ferramentas e Visibilidade**: Foi constatada a falta de visibilidade em métricas de dúvidas e clima. É necessário o planejamento de *Skills/Tools* dedicadas para consulta de previsão meteorológica em tempo real, bem como a criação de uma interface ou ferramenta administrativa para visualizar métricas e relatórios das dúvidas registradas no banco de dados.

## 2. Decisão Proposta

Para endereçar esses problemas de forma estruturada e robusta, decidiu-se pelas seguintes abordagens técnicas:

*   **Refinamento do System Prompt**: O prompt do sistema será atualizado e enriquecido com diretrizes rígidas. Incluiremos instruções explícitas (negativas) de que a plataforma **não oferece** serviços de hospedagem. Além disso, a terminologia global será padronizada para utilizar a palavra "escalada" no lugar de "montanhismo".
*   **Validação Estrita de Dados (Zod)**: Implementaremos *schemas* Zod não apenas para requisições de ferramentas (tools), mas também para validar e limpar a saída estruturada (structured outputs). Isso ajudará a prevenir que dados brutos e marcações Markdown indesejadas (vazamento de debug) cheguem diretamente à interface.
*   **Enriquecimento e Auditoria do Conhecimento**: Todos os arquivos JSON de contexto passarão por auditoria e higienização. Serão criadas seções detalhadas referentes às **Políticas de Cancelamento**, **Clima Adverso** e características de **Microclima**. A estruturação dos destinos (ex: Pedra Bela vs. São Bento do Sapucaí) será devidamente separada e tipada.
*   **Guardrails e Transbordo HITL**: Criação de uma etapa de avaliação prévia da intenção do usuário. Caso o modelo identifique uma questão pessoal, ética ou fora de escopo, um fluxo de recusa educada (fallback) e encaminhamento direto para a equipe de atendimento (Human-in-the-Loop) será ativado automaticamente.
*   **Expansão do Checkout**: Refatoração do fluxo de coleta de dados no checkout, que passará a requerer validação em tempo real para campos como telefone, email e número de acompanhantes, interligado a uma verificação de limites de vagas remanescentes.
*   **Novas Skills e Integrações**:
    *   Desenvolvimento de uma nova `tool` dedicada à consulta de previsão climática em tempo real para auxiliar decisões do modelo.
    *   Criação de persistência estruturada das interações (logs e dúvidas), para posterior consumo por uma interface/dashboard administrativo.

## 3. Consequências (Positivas e Negativas / Riscos)

*   **Impactos Positivos**:
    *   Aumento dramático na segurança e precisão das respostas (menos alucinações).
    *   Melhoria significativa na Experiência do Usuário (UX) por evitar vazamento de dados de debug na interface e oferecer um checkout profissional.
    *   Alinhamento de marca adequado pelo ajuste vocabular para "escalada".
    *   Empoderamento da gestão através de novas ferramentas administrativas e controle de transbordo HITL.
*   **Impactos Negativos / Riscos**:
    *   **Consumo de Tokens**: O enriquecimento do System Prompt com regras e guardrails aumentará o contexto da conversa, consequentemente consumindo mais tokens por requisição.
    *   **Latência**: O uso de validações estritas (Zod) e eventuais chamadas de APIs externas (meteorologia e verificação de vagas no checkout) pode adicionar milissegundos adicionais de latência à resposta.
    *   **Complexidade de Manutenção**: A lógica ganha mais camadas (validação, guardrails, transbordo), o que exige maior rigor em testes automatizados (BDD/TDD) para garantir que alterações futuras não quebrem esses fluxos.

## 4. Plano de Implementação / Tarefas

A implementação desta ADR será dividida nas seguintes tarefas técnicas (épicos):

1.  **Refatoração do System Prompt (Prompt Engineering)**:
    *   Substituir "montanhismo" por "escalada".
    *   Adicionar as restrições explícitas sobre hospedagem e serviços não oferecidos.
2.  **Limpeza e Enriquecimento do Conhecimento (Base de Dados/JSON)**:
    *   Corrigir os dados cadastrais misturados entre São Bento de Sapucaí e Pedra Bela.
    *   Adicionar seções completas para: Política de Cancelamento e Regras Climáticas.
3.  **Sanitização da UI e Validação (Interface & Zod)**:
    *   Garantir a sanitização das respostas geradas e proteger a UI contra a injeção de JSON e metadados brutos (usando validação robusta Zod).
4.  **Desenvolvimento das Guardrails e HITL**:
    *   Implementar a lógica de análise de intenção e definir o fluxo e interface de transbordo para atendimento humano.
5.  **Refatoração do Fluxo de Checkout**:
    *   Expandir as informações coletadas além do 'nome', integrando verificação de vagas disponíveis.
6.  **Criação de Novas Ferramentas (Tools)**:
    *   Construir a tool de consulta meteorológica.
    *   Estruturar a coleta de métricas e registrar as dúvidas dos usuários no banco de dados para acesso via dashboard administrativo.
