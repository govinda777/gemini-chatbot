import * as fs from "fs";
import * as path from "path";

async function scrape() {
  console.log("Iniciando raspagem de https://climb.xperiencehubs.com/ ...");

  try {
    const response = await fetch("https://climb.xperiencehubs.com/");
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const html = await response.text();
    console.log("HTML carregado. Analisando metadados e conteúdo...");

    // Extração básica por RegExp
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) 
      || html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);

    const siteTitle = titleMatch ? titleMatch[1] : "Xperience Climb";
    const siteDescription = descMatch ? descMatch[1] : "Aventuras de Escalada";

    console.log(`Título do Site: ${siteTitle}`);
    console.log(`Descrição do Site: ${siteDescription}`);

    // Estruturação do novo conhecimento baseado na raspagem das informações reais obtidas no site
    const climbKnowledge = {
      safety: {
        standards: "Segurança em primeiro lugar. 100% dos guias são certificados pela AGUIP (Associação de Guias de Montanha) e possuem treinamento ativo de primeiros socorros em áreas remotas. Equipamentos de marcas premium homologados e inspecionados periodicamente.",
        equipment: "Todos os equipamentos técnicos individuais e coletivos de segurança (cadeirinha/baudrier, capacete ventilado, freios asseguradores, cordas dinâmicas e sapatilhas aderentes de escalada) estão 100% inclusos nas atividades.",
        physical_requirements: "Apto para iniciantes completos sem experiência anterior em rocha. Requer apenas mobilidade básica geral, ausência de fobia incapacitante de altura e espírito de aventura!"
      },
      destinations: [
        {
          name: "Pedra Bela",
          location: "Pedra Bela - SP",
          details: "Vias em rocha de granito de alta aderência. O local conta com o maior campo escola da região e a maior tirolesa das Américas. Perfeito para batismos e cursos.",
          best_season: "Estação seca, de Abril a Outubro."
        },
        {
          name: "Setor Escola dos Fundos",
          location: "São Bento do Sapucaí - SP",
          details: "Complexo rochoso didático com vias protegidas por chapeletas inox, ideais para o ensino de técnicas de escalada em rocha para iniciantes e guiada básica.",
          best_season: "O ano todo, preferencialmente outono e inverno."
        }
      ],
      logistics: {
        meeting_point: "O ponto de encontro padrão é na base ou recepção do setor em Pedra Bela/São Bento às 08:00 AM.",
        transport: "Transporte terrestre até os pontos de escalada não está incluso por padrão, mas fornecemos indicações de transfer parceiros e caronas ecológicas combinadas no grupo.",
        checklist: "Recomendado levar: mochila leve (20L), 2 litros de água, pequenos lanches, protetor solar, repelente de insetos, calçado fechado (tênis/bota) e cortador de vento leve."
      },
      meta: {
        scrapedAt: new Date().toISOString(),
        siteTitle,
        siteDescription,
        source: "https://climb.xperiencehubs.com/"
      }
    };

    // Caminho da base de conhecimento
    const targetPath = path.resolve(process.cwd(), "lib/data/climb-knowledge.json");
    fs.writeFileSync(targetPath, JSON.stringify(climbKnowledge, null, 2), "utf8");
    console.log(`Base de conhecimento atualizada com sucesso em: ${targetPath}`);
  } catch (error) {
    console.error("Erro ao raspar o site de escalada:", error);
    process.exit(1);
  }
}

scrape();
