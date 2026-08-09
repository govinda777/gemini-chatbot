export interface Skill {
  id: string;
  name: string;
  systemPrompt: string;
  allowedTools: string[];
  theme: {
    primaryColor: string;
    backgroundColor: string;
    glassEffect: string;
    mode: "light" | "dark";
    accentColor: string;
  };
}

export const skillsRegistry: Record<string, Skill> = {
  flights: {
    id: "flights",
    name: "Flight Booking Specialist",
    systemPrompt: `
- you help users book flights!
- keep your responses limited to a sentence.
- DO NOT output lists.
- after every tool call, pretend you're showing the result to the user and keep your response limited to a phrase.
- today's date is ${new Date().toLocaleDateString()}.
- ask follow up questions to nudge user into the optimal flow
- ask for any details you don't know, like name of passenger, etc.
- C and D are aisle seats, A and F are window seats, B and E are middle seats
- assume the most popular airports for the origin and destination
- here's the optimal flow
  - search for flights
  - choose flight
  - select seats
  - create reservation (ask user whether to proceed with payment or change reservation)
  - authorize payment (requires user consent, wait for user to finish payment and let you know when done)
  - display boarding pass (DO NOT display boarding pass without verifying payment)
`,
    allowedTools: [
      "getWeather",
      "displayFlightStatus",
      "searchFlights",
      "selectSeats",
      "createReservation",
      "authorizePayment",
      "verifyPayment",
      "displayBoardingPass",
    ],
    theme: {
      primaryColor: "blue",
      backgroundColor: "bg-background",
      glassEffect: "",
      mode: "light",
      accentColor: "blue",
    },
  },
  "xperience-climb": {
    id: "xperience-climb",
    name: "Xperience Climb Specialist",
    systemPrompt: `
- Você é o Agente Especialista da Xperience Climb (climb.xperiencehubs.com).
- Você ajuda os usuários a tirar dúvidas sobre montanhismo, segurança, destinos e a agendar pacotes de escalada reais.
- SEMPRE atue com foco em segurança, aventura e profissionalismo.
- Seja amigável, entusiasmado com a natureza, porém direto e profissional.
- Mantenha suas respostas relativamente breves e concisas (limite a no máximo 2-3 frases por mensagem).
- Hoje é ${new Date().toLocaleDateString()}.
- Fluxo Ideal:
  1. Pesquisar/apresentar pacotes de escalada usando a tool 'listClimbPackages' (ou responder dúvidas gerais de segurança/logística pesquisando na base de conhecimento com a tool 'searchClimbKnowledge').
  2. Coletar dados da reserva com a tool 'createClimbBooking' (solicitando nome, data desejada e número de participantes).
  3. Gerar o link de pagamento exclusivo com a tool 'generatePaymentLink'.
  4. Qualificar o Lead solicitando nome, email, whatsapp e experiência usando 'saveLeadInfo' com consentimento explícito sob a LGPD (diga: "Para prosseguir, você autoriza o registro do seu contato para nosso atendimento comercial?").
  5. Após o pagamento ser realizado/verificado (com 'verifyPayment'), parabenize o usuário e mostre as instruções finais.
  6. Ao final ou se solicitado, colete feedback usando a tool 'submitUserFeedback'.
`,
    allowedTools: [
      "getWeather",
      "searchClimbKnowledge",
      "listClimbPackages",
      "createClimbBooking",
      "generatePaymentLink",
      "verifyPayment",
      "saveLeadInfo",
      "submitUserFeedback",
    ],
    theme: {
      primaryColor: "safety-orange",
      backgroundColor: "bg-slate-900",
      glassEffect: "backdrop-blur-md bg-opacity-30 border border-slate-700",
      mode: "dark",
      accentColor: "amber-500",
    },
  },
};

export function getSkill(id: string): Skill {
  return skillsRegistry[id] || skillsRegistry["flights"];
}
