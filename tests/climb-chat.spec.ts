import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("🎭 E2E BDD SPECIFICATION - CLIMB CHAT", () => {
  const featurePath = path.join(__dirname, "features/climb-chat.feature");
  const featureContent = fs.readFileSync(featurePath, "utf-8");

  test("Executando cenário do arquivo .feature", async ({ page }) => {
    console.log("=========================================");
    console.log("📝 Conteúdo do Arquivo .feature carregado:\n");
    console.log(featureContent);
    console.log("=========================================");

    const uniqueEmail = `playwright-bdd-${Date.now()}@example.com`;
    const password = "password123";

    // [Dado que o usuário está na página de registro]
    console.log("➜ Dado que o usuário está na página de registro");
    page.on("console", msg => console.log("   [BROWSER LOG]:", msg.text()));
    page.on("pageerror", err => console.log("   [BROWSER ERROR]:", err.message));
    await page.goto("/register");

    // [Quando o usuário registra uma nova conta]
    console.log("➜ Quando o usuário registra uma nova conta");
    await page.fill("input#email", uniqueEmail);
    await page.fill("input#password", password);
    await page.click('button:has-text("Sign Up")');

    // [E realiza o login para estabelecer a sessão]
    // A página de registro agora possui redirecionamento automático nativo ao registrar com sucesso!
    console.log("➜ E realiza o login para estabelecer a sessão (redirecionamento nativo)");
    await expect(page).toHaveURL("/", { timeout: 15000 });

    // [E envia a mensagem "Olá! Quais são os pacotes de iniciante na Xperience Climb?"]
    console.log("➜ E envia a mensagem 'Olá! Quais são os pacotes de iniciante na Xperience Climb?'");
    const chatInput = page.locator('textarea[placeholder="Send a message..."]');
    await expect(chatInput).toBeVisible();
    await chatInput.fill("Olá! Quais são os pacotes de iniciante na Xperience Climb?");
    await chatInput.press("Enter");

    // [Então a IA deve acionar a ferramenta listClimbPackages]
    // [E o pacote "Pacote AGARRÃO" deve ser exibido na tela]
    console.log("➜ Então o pacote 'Pacote AGARRÃO' deve ser exibido na tela");
    const packageCard = page.locator('text="Pacote AGARRÃO"');
    await expect(packageCard).toBeVisible({ timeout: 25000 });
  });
});
