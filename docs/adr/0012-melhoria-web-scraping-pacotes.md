# ADR-0012: Melhoria no Web Scraping e Sincronização de Pacotes

## Status
Proposto

## Data
2024-05-24

## 1. Contexto & Problema

Durante a análise das interações do agente da Xperience Climb, identificou-se que o chatbot estava fornecendo informações inconsistentes sobre os pacotes disponíveis. Especificamente, o modelo estava oferecendo ou mencionando pacotes para destinos como São Bento do Sapucaí, sendo que o site oficial (https://climb.xperiencehubs.com/) lista pacotes apenas para Pedra Bela.

O problema raiz reside no fato de que o processo de ingestão de dados (ou a falta de um processo automatizado estrito) permitiu que a base de conhecimento do agente contivesse informações desatualizadas, incorretas ou alucinadas sobre pacotes que não existem na oferta atual. O agente precisa refletir com exatidão *apenas* os pacotes que estão publicamente listados e ofertados no site.

## 2. Decisão Proposta

Para garantir que o agente ofereça apenas pacotes reais e disponíveis:

1.  **Aprimoramento do Script de Web Scraping**: O script de extração de dados será ajustado/criado para raspar estritamente a listagem de pacotes na URL oficial (`https://climb.xperiencehubs.com/`).
2.  **Sincronização Direta e Exclusiva**: O scraper deverá varrer o site, extrair as informações precisas (título do pacote, destino, preço, etc.) e **atualizar a base de conhecimento do agente de forma automatizada e fidedigna**.
3.  **Remoção de Dados Fantasmas**: Quaisquer pacotes previamente inferidos ou adicionados manualmente na base de conhecimento (como São Bento do Sapucaí) que não sejam encontrados no scraper da página oficial serão expurgados da base de conhecimento ativa.

## 3. Consequências (Positivas e Negativas / Riscos)

*   **Impactos Positivos**:
    *   **Eliminação de Alucinações de Produto**: O agente parará de oferecer pacotes inexistentes, melhorando drasticamente a confiança do usuário e evitando frustrações de venda.
    *   **Fonte Única de Verdade**: O site oficial torna-se a fonte primária e irrefutável da base de conhecimento de pacotes, facilitando a gestão.
*   **Impactos Negativos / Riscos**:
    *   **Dependência da Estrutura do DOM**: Se a equipe de frontend alterar o layout ou as classes CSS da página de pacotes, o scraper poderá quebrar e falhar em atualizar a base.
    *   **Necessidade de Monitoramento**: Requer implementação de rotinas (cron jobs ou gatilhos webhooks) para garantir que o scraping rode periodicamente ou sempre que o site for atualizado.

## 4. Plano de Implementação / Tarefas

A implementação desta melhoria envolverá as seguintes tarefas:

1.  **Análise do DOM**: Inspecionar a página `https://climb.xperiencehubs.com/` para mapear os seletores CSS exatos onde os pacotes (ex: Pedra Bela) estão renderizados.
2.  **Desenvolvimento do Scraper**: Codificar o script de web scraping (usando ferramentas como Puppeteer, Cheerio ou Playwright) focado exclusivamente na extração dos pacotes.
3.  **Pipeline de Atualização da Base (ETL)**: Criar a rotina que pega o output do scraper e formata corretamente (JSON/Markdown) substituindo os dados de pacotes anteriores na base de conhecimento do agente.
4.  **Testes de Ingestão**: Rodar testes unitários e de integração para garantir que, após o scraping, destinos inexistentes (como São Bento) sejam completamente ignorados e removidos da base gerada.