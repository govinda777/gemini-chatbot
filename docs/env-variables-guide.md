# Guia de Configuração de Variáveis de Ambiente (`.env.local`)

Este guia detalha cada uma das variáveis de ambiente necessárias para o funcionamento do **Gemini Chatbot**, explicando sua finalidade, como obtê-la e como configurá-la de forma correta no seu arquivo [`.env.local`](./.env.local).

---

## Resumo das Variáveis

| Variável | Obrigatória | Finalidade | Origem / Como Obter |
| :--- | :--- | :--- | :--- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Sim | Autenticar chamadas aos modelos Gemini. | Google AI Studio |
| `GEMINI_MODEL` | Sim | Definir o modelo Gemini a ser utilizado. | Nome do modelo (ex: `gemini-2.5-flash`) |
| `POSTGRES_URL` | Sim | Conexão com o banco de dados PostgreSQL. | Neon Console ou CLI |
| `AUTH_SECRET` | Sim | Criptografar sessões de login (NextAuth). | Gerador de segredo / OpenSSL |
| `BLOB_READ_WRITE_TOKEN` | Sim | Upload de arquivos (imagens/documentos). | Vercel Blob / Vercel CLI |
| `VERCEL_OIDC_TOKEN` | Não | Integração OIDC com a Vercel. | CLI Vercel / Auto-injetado |

---

## 🛠️ Detalhamento de Configuração

### 1. `GOOGLE_GENERATIVE_AI_API_KEY`
* **Finalidade:** Permite que a aplicação se comunique com os modelos de IA da Google.
* **Como Obter:**
  1. Acesse o [Google AI Studio](https://aistudio.google.com/).
  2. Faça login com sua conta do Google.
  3. Clique em **"Get API key"** (Obter chave de API).
  4. Crie uma nova chave em um projeto novo ou existente.
  5. Copie a chave gerada (inicia com `AIzaSy`).
* **Configuração no `.env.local`:**
  ```env
  GOOGLE_GENERATIVE_AI_API_KEY="sua_chave_aqui"
  ```

---

### 2. `GEMINI_MODEL`
* **Finalidade:** Define o modelo específico da API do Gemini que o chatbot e o script de validação devem usar (ex: `gemini-2.5-flash`).
* **Valores recomendados:**
  * `gemini-2.5-flash` (Padrão e recomendado)
  * `gemini-1.5-pro` (Para raciocínio mais complexo)
* **Configuração no `.env.local`:**
  ```env
  GEMINI_MODEL="gemini-2.5-flash"
  ```

---

### 3. `POSTGRES_URL`
* **Finalidade:** String de conexão para persistência de dados (histórico de conversas, usuários, etc.). O projeto utiliza Neon (Postgres Serverless) e Drizzle ORM.
* **Como Obter:**
  * **Opção 1 (Recomendada - Automatizada):**
    Execute o script interativo que cria o banco e injeta a URL automaticamente:
    ```bash
    node scripts/setup-neon.js
    ```
  * **Opção 2 (Manual):**
    1. Crie uma conta gratuita em [Neon.tech](https://neon.tech/).
    2. Crie um novo projeto/banco de dados.
    3. No painel (Dashboard), selecione a linguagem/framework (ex: Node.js ou Prisma/Drizzle) para expor a URI de conexão.
    4. Copie a string que começa com `postgres://...` ou `postgresql://...`.
* **Configuração no `.env.local`:**
  ```env
  POSTGRES_URL="postgres://usuario:senha@host/banco?sslmode=require"
  ```

---

### 4. `AUTH_SECRET`
* **Finalidade:** Chave de criptografia usada pelo NextAuth.js para assinar os cookies e tokens da sessão do usuário, garantindo a segurança do login.
* **Como Obter:**
  Gere uma chave randômica forte de 32 bytes.
  * **Via Terminal:**
    ```bash
    openssl rand -base64 32
    ```
  * **Via Web:**
    Gere um segredo seguro em [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32).
* **Configuração no `.env.local`:**
  ```env
  AUTH_SECRET="sua_chave_gerada_de_32_bytes"
  ```

---

### 5. `BLOB_READ_WRITE_TOKEN`
* **Finalidade:** Autenticação no serviço Vercel Blob para permitir o upload direto de anexos na conversa do chatbot.
* **Como Obter:**
  * **Opção 1 (Recomendada - Automatizada):**
    1. Instale a CLI da Vercel globalmente: `npm i -g vercel`.
    2. Vincule o projeto local: `vercel link`.
    3. Crie o Blob Store:
       ```bash
       vercel blob create-store gemini-chatbot-blob --access public --yes
       ```
       *Isso criará a estrutura na nuvem e adicionará a variável automaticamente no `.env.local`.*
  * **Opção 2 (Manual):**
    1. Acesse o painel da [Vercel](https://vercel.com).
    2. Vá para a aba **Storage** (Armazenamento) e crie um **Blob Store**.
    3. Vá em **Settings** (Configurações) do Blob, gere um Read/Write Token e copie-o.
* **Configuração no `.env.local`:**
  ```env
  BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
  ```

---

### 6. `VERCEL_OIDC_TOKEN`
* **Finalidade:** Token de ID do Provedor de Identidade Aberta (OIDC) do Vercel, usado para comunicação confiável e segura sem senhas entre integrações de nuvem (como Neon e Vercel). Geralmente opcional no desenvolvimento local.
* **Configuração no `.env.local`:**
  ```env
  VERCEL_OIDC_TOKEN="seu_token_jwt_oidc_aqui"
  ```

---

## 🔍 Como Validar a Configuração

Depois de preencher todas as chaves no seu arquivo [`.env.local`](./.env.local), execute o comando de diagnóstico integrado:

```bash
pnpm validate-env
```

Ele testará ativamente a validade de cada chave e a conectividade com cada serviço externo associado.
