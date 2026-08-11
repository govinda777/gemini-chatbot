# Guia de CI/CD: Pipeline do Neon DB com Vercel

Este guia descreve as melhores práticas e a configuração recomendada para integrar o **Neon Postgres** na sua pipeline de CI/CD (Integração e Entrega Contínuas) com o **Vercel** e **GitHub**.

O principal recurso do Neon para CI/CD é o **Database Branching** (Ramificação de Banco de Dados). Com ele, cada Pull Request (PR) aberto no GitHub ganha um clone isolado, rápido e gratuito do banco de dados de produção para testar migrações de esquema com segurança antes do deploy final.

---

## 🛠️ Opção 1: Integração Nativa Vercel + Neon (Recomendado)

Esta é a maneira mais simples de configurar a pipeline. A integração oficial do Neon com a Vercel gerencia a criação e exclusão dos branches de banco de dados automaticamente vinculados ao ciclo de vida dos deploys da Vercel.

### Passo a Passo da Configuração:
1. Vá para a página do seu projeto no **Vercel Dashboard**.
2. Clique na aba **Integrations**.
3. Procure por **Neon** e clique em **Install**.
4. Selecione a sua organização/projeto e conecte com a sua conta Neon.
5. A integração vai injetar a variável `DATABASE_URL` (ou `POSTGRES_URL`) nas configurações do projeto Vercel.
6. A partir desse momento:
   * **Deploy de Produção**: Usa o branch padrão (`main`).
   * **Deploy de Preview (Pull Requests)**: O Neon cria um branch de banco de dados temporário, copia a estrutura de produção e injeta a URL específica desse branch efêmero no ambiente do deploy de preview da Vercel.
   * **Limpeza Automática**: Quando o PR é mesclado/fechado ou o deploy expira, o Neon remove o branch temporário.

---

## 🤖 Opção 2: Pipeline via GitHub Actions (Controle Manual)

Se você preferir gerenciar a pipeline programaticamente via código ou precisar rodar testes de integração complexos no GitHub Actions antes de enviar para o Vercel, utilize o workflow oficial do Neon.

### Exemplo de Workflow do GitHub Actions: `.github/workflows/neon-preview.yml`

```yaml
name: Neon DB Preview Branching
on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  manage-db-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # 1. Cria ou Atualiza o Branch do Neon ao abrir/atualizar o PR
      - name: Create/Sync Neon Branch
        if: github.event.action != 'closed'
        uses: neondatabase/create-branch-action@v5
        id: neon-branch
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }} # ID do projeto Neon (GitHub Variable)
          api_key: ${{ secrets.NEON_API_KEY }}    # API Key do Neon (GitHub Secret)
          branch_name: pr-${{ github.event.number }}
          username: neondb_owner

      # 2. Executa as Migrações do Drizzle no Branch temporário
      - name: Run Schema Migrations
        if: github.event.action != 'closed'
        env:
          POSTGRES_URL: ${{ steps.neon-branch.outputs.db_url }}
        run: |
          pnpm install
          pnpm tsx db/migrate

      # 3. Remove o Branch do Neon ao fechar ou mesclar o PR
      - name: Delete Neon Branch on Close
        if: github.event.action == 'closed'
        uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          api_key: ${{ secrets.NEON_API_KEY }}
          branch_name: pr-${{ github.event.number }}
```

---

## 📈 Melhores Práticas para Migrações de Banco de Dados

### 1. Migrações no Build (Ativado por padrão neste projeto)
No arquivo [`package.json`](file:///Users/govinda/projetos/gemini-chatbot/package.json), o comando de build está configurado para:
```bash
tsx db/migrate && next build
```
Com o Database Branching ativado, ao rodar o build no Vercel (seja no preview ou em produção), as migrações em `db/migrate` são executadas automaticamente contra o banco de dados configurado para aquele ambiente específico.

### 2. Tratamento de Erros e Lazy Loading
Sempre certifique-se de que conexões de banco de dados não quebrem a compilação do seu projeto. O padrão de **Lazy Loading** implementado nas queries deste projeto assegura que a conexão com o Neon só seja feita quando requisitada nas rotas dinâmicas, mantendo o processo de build do Next.js sempre isolado e rápido.
