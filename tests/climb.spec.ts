import { expect, test, vi, describe, beforeAll } from "vitest";
import { getTools } from "../app/(chat)/api/chat/tools";
import fs from "fs";
import path from "path";

// Mock the auth function and db queries to run unit tests without DB connections
vi.mock("../app/(auth)/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-123", email: "test@example.com" },
  }),
}));

vi.mock("../db/queries", () => ({
  createReservation: vi.fn().mockResolvedValue({ success: true }),
  getReservationById: vi.fn().mockResolvedValue({
    id: "booking-123",
    details: { totalPriceBRL: 450.0 },
    hasCompletedPayment: false,
  }),
  createLead: vi.fn().mockResolvedValue({ success: true }),
  createFeedback: vi.fn().mockResolvedValue({ success: true }),
}));

describe("🎯 BDD SPECIFICATION - AGENTE ESPECIALISTA XPERIENCE CLIMB", () => {
  beforeAll(() => {
    const featurePath = path.join(__dirname, "features/climb-agent-spec.feature");
    if (fs.existsSync(featurePath)) {
      const featureContent = fs.readFileSync(featurePath, "utf-8");
      console.log("=========================================");
      console.log("📝 BDD Feature File: climb-agent-spec.feature\n");
      console.log(featureContent);
      console.log("=========================================");
    }
  });

  // --- FEATURE 1: RAG KNOWLEDGE BASE ---
  describe("Funcionalidade: Busca na Base de Conhecimento (RAG)", () => {
    test("Cenário: Usuário tem dúvida sobre regras de segurança na escalada", async () => {
      // Given: Dado que a ferramenta de busca de conhecimento está carregada
      const searchKnowledgeTool = getTools.searchClimbKnowledge;

      // When: Quando o usuário pergunta "quais equipamentos de segurança estão inclusos?"
      const results = await searchKnowledgeTool.execute({ query: "quais equipamentos de segurança estão inclusos?" });

      // Then: Então o sistema deve retornar as diretrizes e itens de segurança corretos
      expect(results).toBeDefined();
      expect(results.safety).toBeDefined();
      expect(results.safety.equipment).toContain("cadeirinha");
      expect(results.safety.standards).toContain("certificados pela AGUIP");
    });
  });

  // --- FEATURE 2: PACKAGES & PRICING ---
  describe("Funcionalidade: Catálogo de Pacotes e Preços Promocionais", () => {
    test("Cenário: Usuário deseja listar pacotes de escalada para iniciante", async () => {
      // Given: Dado que o bot de pacotes está ativo
      const listPackagesTool = getTools.listClimbPackages;
      
      // When: Quando a listagem de pacotes para iniciante é acionada
      const results = await listPackagesTool.execute({ difficulty: "iniciante" });
      
      // Then: Então o sistema deve retornar os pacotes corretos de nível iniciante
      expect(results).toBeDefined();
      expect(results.packages).toBeDefined();
      expect(Array.isArray(results.packages)).toBe(true);
      expect(results.packages.length).toBeGreaterThan(0);
      
      // And: E o preço promocional (priceInBRL) e o original (originalPriceInBRL) devem estar configurados
      results.packages.forEach((pkg: any) => {
        expect(pkg.difficulty).toBe("iniciante");
        expect(pkg.priceInBRL).toBe(277.0);
        expect(pkg.originalPriceInBRL).toBe(330.0);
        expect(pkg.inclusions).toContain("✓🧗 Escalada em rocha natural");
      });
    });
  });

  // --- FEATURE 3: LEADS & LGPD ---
  describe("Funcionalidade: Coleta de Leads e Consentimento LGPD", () => {
    test("Cenário: Captura de Lead com consentimento explícito concedido", async () => {
      // Given: Dado que o formulário de captação comercial está aberto
      const saveLeadTool = getTools.saveLeadInfo;
      const leadInput = {
        name: "Govinda",
        email: "govinda@example.com",
        whatsapp: "+5511999999999",
        climbingExperience: "iniciante",
        interestDetails: "Gostaria de agendar o Batismo",
        consentGranted: true,
      };

      // When: Quando salvamos o lead com consentGranted igual a true
      const result = await saveLeadTool.execute(leadInput);

      // Then: Então o lead é registrado e a confirmação é exibida
      expect(result.success).toBe(true);
      expect(result.message).toContain("Lead cadastrado com sucesso");
    });

    test("Cenário: Rejeição de Lead sem consentimento da LGPD", async () => {
      // Given: Dado que o usuário não concede permissão de privacidade
      const saveLeadTool = getTools.saveLeadInfo;
      const leadInput = {
        name: "Govinda",
        email: "govinda@example.com",
        whatsapp: "+5511999999999",
        climbingExperience: "iniciante",
        consentGranted: false,
      };

      // When: Quando tentamos salvar as informações
      const result = await saveLeadTool.execute(leadInput);

      // Then: Então o sistema deve abortar a gravação e retornar erro de consentimento LGPD
      expect(result.error).toBeDefined();
      expect(result.error).toContain("LGPD consent is required");
    });
  });

  // --- FEATURE 4: BOOKINGS & PAYMENTS ---
  describe("Funcionalidade: Reservas de Pacotes e Links de Pagamento", () => {
    test("Cenário: Criação de Reserva e Geração de Links de Pagamento", async () => {
      // Given: Dado que o usuário cria uma reserva para o Batismo de Escalada com 2 participantes
      const createBookingTool = getTools.createClimbBooking;
      const booking = await createBookingTool.execute({
        packageId: "pkg-batismo-pedra-bela",
        date: "2026-09-10",
        participants: 2,
      });

      // Then: A reserva deve ser criada sem erros e o preço total calculado corretamente (277 * 2 = 554)
      expect(booking.error).toBeUndefined();
      expect(booking.bookingId).toBeDefined();
      expect(booking.totalPriceBRL).toBe(554); 

      // When: Quando geramos o link de pagamento para a reserva criada
      const paymentTool = getTools.generatePaymentLink;
      const paymentDetails = await paymentTool.execute({ bookingId: booking.bookingId });

      // Then: Então o gateway deve retornar links válidos do Stripe e o código Pix BR Code
      expect(paymentDetails.paymentUrl).toBeDefined();
      expect(paymentDetails.pixQrCode).toBeDefined();
      expect(paymentDetails.paymentUrl).toContain(booking.bookingId);
    });
  });

  // --- FEATURE 5: USER FEEDBACK ---
  describe("Funcionalidade: Coleta de Feedback de Atendimento", () => {
    test("Cenário: Usuário avalia o atendimento com 5 estrelas", async () => {
      // Given: Dado que a ferramenta de feedback está disponível
      const feedbackTool = getTools.submitUserFeedback;

      // When: Quando o usuário envia nota 5 com um elogio na categoria 'sistema'
      const result = await feedbackTool.execute({
        rating: 5,
        comment: "Excelente chatbot, rápido e intuitivo!",
        category: "sistema",
      });

      // Then: Então o feedback deve ser registrado com sucesso
      expect(result.success).toBe(true);
      expect(result.message).toContain("Obrigado pelo seu feedback");
    });
  });
});
