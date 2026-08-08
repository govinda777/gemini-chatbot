<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Next.js Gemini Chatbot</h1>
</a>

<p align="center">
  Um template de Chatbot de IA de código aberto construído com Next.js, Vercel AI SDK e Google Gemini.
</p>

<p align="center">
  <a href="#quick-start"><strong>Início Rápido</strong></a> ·
  <a href="#features"><strong>Funcionalidades</strong></a> ·
  <a href="#model-providers"><strong>Provedores de Modelos</strong></a> ·
  <a href="#project-structure"><strong>Estrutura do Projeto</strong></a> ·
  <a href="#deploy"><strong>Deploy</strong></a> ·
  <a href="./LOCAL_DEPLOYMENT.md"><strong>Guia de Deploy Local 📖</strong></a>
</p>

---

## ⚡ Quick Start (Início Rápido)

Você pode configurar o projeto localmente de duas maneiras: seguindo os passos básicos abaixo ou utilizando o nosso guia completo de infraestrutura em nuvem/local (com Neon Postgres e Vercel Blob) no [Guia de Deploy Local](./LOCAL_DEPLOYMENT.md).

### 🚀 Deploy/Configuração Rápida com Neon

Se você preferir não configurar um PostgreSQL local, você pode automatizar a criação do banco de dados na nuvem usando o Neon:

1. Certifique-se de instalar as dependências com `pnpm install`.
2. Execute o script de configuração automática do Neon:
   ```bash
   node scripts/setup-neon.js
   ```
   *Isso abrirá seu navegador para autenticação no Neon, criará um projeto/banco de dados e configurará a variável `POSTGRES_URL` no seu arquivo `.env.local` de forma automática.*

---

### Configuração Manual Tradicional

### 1. Requisitos Prévios

Certifique-se de ter instalado em sua máquina:
- **Node.js** (v18+)
- **pnpm** (recomendado) ou npm/yarn
- Banco de dados **PostgreSQL** (pode ser local ou gerenciado como Neon/Supabase)

### 2. Instalar Dependências

Instale as dependências do projeto utilizando o `pnpm`:

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Abra o arquivo [`.env.local`](file:///Users/govinda/projetos/gemini-chatbot/.env.local) e configure as seguintes chaves:

- `GOOGLE_GENERATIVE_AI_API_KEY`: Sua chave de API do Gemini (obtenha no [Google AI Studio](https://aistudio.google.com/)).
- `AUTH_SECRET`: Uma chave secreta para a autenticação. Você pode gerar uma executando `openssl rand -base64 32` no seu terminal ou usando o [gerador online](https://generate-secret.vercel.app/32).
- `POSTGRES_URL`: URL de conexão do PostgreSQL (ex: `postgres://usuario:senha@localhost:5432/nome_do_banco`).
- `BLOB_READ_WRITE_TOKEN`: Token para o Vercel Blob (para upload de arquivos e imagens).

### 4. Executar as Migrações do Banco de Dados

Antes de iniciar a aplicação, crie e aplique as tabelas no seu banco de dados PostgreSQL usando o Drizzle ORM:

```bash
# Executa o script de migração
pnpm tsx db/migrate
```

*(Opcional)* Se desejar visualizar ou gerenciar os dados visualmente através do Drizzle Studio:
```bash
pnpm drizzle-kit studio
```

### 5. Iniciar o Servidor de Desenvolvimento

Agora você pode rodar a aplicação localmente:

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o chatbot funcionando.

---

## 🚀 Funcionalidades

- **Next.js App Router**: Utilização de React Server Components (RSCs), Server Actions e rotas otimizadas para excelente desempenho.
- **Vercel AI SDK**: Integração unificada para geração de texto, chamadas de ferramentas (tool calling) e streaming de respostas.
- **Persistência de Dados**:
  - [Drizzle ORM](https://orm.drizzle.team/) com PostgreSQL para salvar o histórico de chats e sessões de usuários.
  - [Vercel Blob](https://vercel.com/storage/blob) para armazenamento de objetos e arquivos de mídia.
- **Autenticação**: Integrado com [NextAuth.js](https://next-auth.js.org) (v5 beta) para login e segurança do usuário.
- **Interface Moderna (UI/UX)**: Estilização com Tailwind CSS, componentes acessíveis construídos com Radix UI e animações fluidas via Framer Motion.

---

## 🤖 Provedores de Modelos

Este template vem configurado por padrão com os modelos do **Google Gemini** (como `gemini-1.5-pro` e `gemini-1.5-flash` através do `@ai-sdk/google`). 

Caso queira utilizar outros provedores como OpenAI, Anthropic ou Cohere, o [Vercel AI SDK](https://sdk.vercel.ai/docs) permite a troca de maneira simples modificando poucas linhas no arquivo de configuração do provedor em `ai/`.

---

## 📂 Estrutura do Projeto

Aqui está uma visão rápida dos principais diretórios:

- **`app/`**: Rotas da aplicação (páginas de chat, autenticação e APIs).
- **`components/`**: Componentes reutilizáveis da interface de usuário (UI).
- **`db/`**: Configurações de banco de dados, schemas do Drizzle ORM (`schema.ts`) e scripts de migração (`migrate.ts`).
- **`lib/`**: Utilitários gerais e hooks customizados.
- **`ai/`**: Configurações específicas de modelos de IA e instâncias do SDK.

---

## ☁️ Deploy no Vercel

Você pode fazer o deploy de sua própria versão com apenas um clique:

[![Deploy com Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fgemini-chatbot&env=AUTH_SECRET,GOOGLE_GENERATIVE_AI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fgemini-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=Next.js%20Gemini%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fgemini.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

