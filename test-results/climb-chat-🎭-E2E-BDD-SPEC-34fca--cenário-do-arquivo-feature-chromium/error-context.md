# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: climb-chat.spec.ts >> 🎭 E2E BDD SPECIFICATION - CLIMB CHAT >> Executando cenário do arquivo .feature
- Location: tests/climb-chat.spec.ts:9:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/"
Received: "http://localhost:3000/register"
Timeout:  15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    34 × locator resolved to <html lang="en" class="light">…</html>
       - unexpected value "http://localhost:3000/register"

```

```yaml
- region "Notifications alt+T"
- button:
  - img
- img "gemini logo"
- img
- text: Next.js Gemini Chatbot
- link "Login":
  - /url: /login
- heading "Sign Up" [level=3]
- paragraph: Create an account with your email and password
- text: Email Address
- textbox "Email Address":
  - /placeholder: user@acme.com
  - text: playwright-bdd-1786318259182@example.com
- text: Password
- textbox "Password"
- button "Sign Up":
  - text: Sign Up
  - status: Submit form
- paragraph:
  - text: Already have an account?
  - link "Sign in":
    - /url: /login
  - text: instead.
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import fs from "fs";
  3  | import path from "path";
  4  | 
  5  | test.describe("🎭 E2E BDD SPECIFICATION - CLIMB CHAT", () => {
  6  |   const featurePath = path.join(__dirname, "features/climb-chat.feature");
  7  |   const featureContent = fs.readFileSync(featurePath, "utf-8");
  8  | 
  9  |   test("Executando cenário do arquivo .feature", async ({ page }) => {
  10 |     console.log("=========================================");
  11 |     console.log("📝 Conteúdo do Arquivo .feature carregado:\n");
  12 |     console.log(featureContent);
  13 |     console.log("=========================================");
  14 | 
  15 |     const uniqueEmail = `playwright-bdd-${Date.now()}@example.com`;
  16 |     const password = "password123";
  17 | 
  18 |     // [Dado que o usuário está na página de registro]
  19 |     console.log("➜ Dado que o usuário está na página de registro");
  20 |     page.on("console", msg => console.log("   [BROWSER LOG]:", msg.text()));
  21 |     page.on("pageerror", err => console.log("   [BROWSER ERROR]:", err.message));
  22 |     await page.goto("/register");
  23 | 
  24 |     // [Quando o usuário registra uma nova conta]
  25 |     console.log("➜ Quando o usuário registra uma nova conta");
  26 |     await page.fill("input#email", uniqueEmail);
  27 |     await page.fill("input#password", password);
  28 |     await page.click('button:has-text("Sign Up")');
  29 | 
  30 |     // [E realiza o login para estabelecer a sessão]
  31 |     // A página de registro agora possui redirecionamento automático nativo ao registrar com sucesso!
  32 |     console.log("➜ E realiza o login para estabelecer a sessão (redirecionamento nativo)");
> 33 |     await expect(page).toHaveURL("/", { timeout: 15000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  34 | 
  35 |     // [E envia a mensagem "Olá! Quais são os pacotes de iniciante na Xperience Climb?"]
  36 |     console.log("➜ E envia a mensagem 'Olá! Quais são os pacotes de iniciante na Xperience Climb?'");
  37 |     const chatInput = page.locator('textarea[placeholder="Send a message..."]');
  38 |     await expect(chatInput).toBeVisible();
  39 |     await chatInput.fill("Olá! Quais são os pacotes de iniciante na Xperience Climb?");
  40 |     await chatInput.press("Enter");
  41 | 
  42 |     // [Então a IA deve acionar a ferramenta listClimbPackages]
  43 |     // [E o pacote "Pacote AGARRÃO" deve ser exibido na tela]
  44 |     console.log("➜ Então o pacote 'Pacote AGARRÃO' deve ser exibido na tela");
  45 |     const packageCard = page.locator('text="Pacote AGARRÃO"');
  46 |     await expect(packageCard).toBeVisible({ timeout: 25000 });
  47 |   });
  48 | });
  49 | 
```