# ADR-0001: Arquitetura RAG para Dúvidas e Informações Públicas

## Status
Proposto

## Data
2026-08-08

## Contexto
O agente da **Xperience Climb** precisa responder a dúvidas comuns dos usuários baseando-se apenas em informações públicas da plataforma [climb.xperiencehubs.com](https://climb.xperiencehubs.com/).
Essas informações incluem:
- Detalhes de escalada para iniciantes (Campo Escola, Setor dos Fundos).
- Padrões de segurança, equipamentos inclusos e guias.
- Destinos de montanhismo e pacotes ativos (como o programa Xperience Anual em Pedra Bela).
- Logística de transporte, pontos de encontro e pré-requisitos físicos.

Como o volume de dados da plataforma é pequeno a moderado, precisamos definir uma abordagem de recuperação de informações (RAG - Retrieval-Augmented Generation) que seja ágil, de baixo custo e precisa.

## Decisão
Adotaremos uma abordagem **RAG Híbrida/Baseada em Contexto Expandido** combinando:

1. **Base de Conhecimento Estruturada (JSON/Markdown)**: Toda a informação pública relevante extraída do site será estruturada em um arquivo de conhecimento estático (ex: `lib/data/climb-knowledge.json` ou arquivo Markdown equivalente).
2. **Inclusão Dinâmica de Contexto & Ferramenta de Busca**:
   - Para interações gerais, o modelo de linguagem (Gemini) receberá resumos consolidados diretamente no prompt do sistema (`system instructions`).
   - Implementaremos uma tool `searchClimbKnowledge` no Vercel AI SDK que permite ao modelo pesquisar tópicos específicos caso as informações gerais não bastem, otimizando o consumo de tokens.
3. **Escalabilidade Futura (pgvector)**: Caso a base de dados cresça com novos roteiros e blogs, utilizaremos a extensão `pgvector` nativa no Neon Postgres (já configurado no projeto) via Drizzle ORM, evitando custos adicionais com infraestrutura externa de banco vetorial.

## Alternativas Consideradas

*   **Banco Vetorial Externo (Pinecone/Weaviate)**: Rejeitado por adicionar complexidade desnecessária e custo extra a um projeto que já conta com Neon Postgres.
*   **Prompt Ingestion Direto (Sem Tools)**: Rejeitado para evitar inflar o histórico de mensagens de todas as requisições com dados muito específicos (como tabelas detalhadas de datas de expedições).
*   **pgvector Imediato**: Mantido como plano de expansão, mas não prioritário para a versão inicial (MVP), dado que a documentação atual do site cabe perfeitamente em um JSON/Markdown estruturado consultável por ferramentas simples.

## Consequências
*   **Pontos Positivos**:
    - Rapidez na implementação inicial (sem dependência imediata de pipelines de embeddings).
    - Custo zero de banco de dados vetorial na fase inicial.
    - Facilidade para atualizar as informações editando um arquivo de configuração/Markdown.
*   **Pontos Negativos/Riscos**:
    - A manutenção manual do JSON/Markdown de conhecimento exige rigor para manter sincronia com o site real.
