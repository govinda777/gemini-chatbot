# Desenvolvimento Local Conectado à Vercel e Neon

Este guia descreve como configurar seu ambiente de desenvolvimento local para rodar o **Gemini Chatbot** conectado diretamente aos recursos reais hospedados no **Vercel Blob** e no **Neon Postgres** na nuvem, de forma totalmente automatizada (como código).

Este método elimina a necessidade de rodar instâncias locais do PostgreSQL ou configurar sistemas de arquivos na sua máquina.

---

## 🚀 Passo a Passo

### Passo 1: Instalar Dependências
Instale as dependências locais utilizando o `pnpm`:

```bash
pnpm install
```

> 💡 **Nota:** O arquivo [`package.json`](./package.json) já vem pré-configurado com a seção `"pnpm.only-built-dependencies"` para autorizar a compilação necessária de pacotes do ecossistema Next.js/pnpm v11.

---

### Passo 2: Criar o Banco de Dados no Neon (Via OIDC / Navegador)
Criamos um script automatizado que utiliza a CLI oficial da Neon para logar via navegador, criar o projeto e configurar o seu arquivo `.env.local` automaticamente.

1.  Execute o script no seu terminal local:
    ```bash
    node scripts/setup-neon.js
    ```
    *Isso abrirá uma janela do navegador para você fazer login ou se cadastrar na Neon. Após a autenticação no navegador, o script criará o banco e atualizará a variável `POSTGRES_URL` no seu `.env.local`.*

---

### Passo 3: Criar o Vercel Blob (Via Código)
Vincule o projeto local à Vercel e crie o Blob Store de maneira automatizada:

1.  Caso não tenha a CLI da Vercel instalada, execute globalmente:
    ```bash
    npm i -g vercel
    ```
2.  Conecte ao seu projeto da Vercel:
    ```bash
    vercel link
    ```
    *(Responda `y` para vincular ao projeto existente no escopo da sua conta)*
3.  Crie e vincule o Blob Store com o comando:
    ```bash
    vercel blob create-store gemini-chatbot-blob --access public --yes
    ```
    *Este comando cria o armazenamento na nuvem e injeta o `BLOB_READ_WRITE_TOKEN` no seu `.env.local` automaticamente.*

---

### Passo 4: Sincronizar demais variáveis da Vercel
Se você já configurou chaves adicionais (como `GOOGLE_GENERATIVE_AI_API_KEY` ou `AUTH_SECRET`) no painel da Vercel, execute:

```bash
vercel env pull .env.local
```
*Isso garante que todas as outras chaves também estejam unificadas no seu arquivo [`.env.local`](./.env.local).*

---

### Passo 5: Rodar as Migrações do Banco de Dados
Com a URL do Neon Postgres salva no `.env.local`, rode as migrações para estruturar as tabelas na nuvem:

```bash
pnpm tsx db/migrate
```

---

### Passo 6: Iniciar o Servidor de Desenvolvimento
Inicie o servidor de desenvolvimento local:

```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. O seu app estará rodando localmente na sua máquina, mas consumindo o banco de dados Neon e salvando imagens no Vercel Blob.

> 🛠️ **Dica:** O comando `pnpm dev` agora executa uma análise automática das capacidades do assistente e exibe uma caixa informativa com os principais links da aplicação em execução. Você pode acessar a interface de testes Swagger das ferramentas diretamente em [http://localhost:3000/tools](http://localhost:3000/tools).

---

### Passo 7: Fazer Deploy para Produção (Via Linha de Comando)
Criamos um script utilitário chamado [`scripts/deploy.sh`](./scripts/deploy.sh) que automatiza todo o processo de deploy:
1. Sincroniza as variáveis de ambiente locais essenciais (`AUTH_SECRET`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_MODEL`, `POSTGRES_URL`) direto para o painel da Vercel.
2. Executa as migrações necessárias no banco do Neon.
3. Faz o deploy final em Produção no Vercel.

Para usá-lo, execute:
```bash
./scripts/deploy.sh
```
