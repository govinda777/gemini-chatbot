import * as fs from "fs";
import * as path from "path";

async function scrape() {
  const sourceUrl = "https://climb.xperiencehubs.com/";
  console.log(`Iniciando raspagem de ${sourceUrl} ...`);

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Erro HTTP ao acessar home: ${response.status}`);
    }

    const html = await response.text();
    console.log("HTML da página principal carregado.");

    // Encontra o link para o JS bundle principal da página no formato do Next.js
    const jsChunkMatch = html.match(/src="(\/_next\/static\/chunks\/app\/page-[a-f0-9]+\.js(?:\?dpl=[^"]*)?)"/i);
    let jsContent = "";

    if (jsChunkMatch && jsChunkMatch[1]) {
      const jsUrl = new URL(jsChunkMatch[1], sourceUrl).toString();
      console.log(`Encontrado JS bundle da página: ${jsUrl}`);
      const jsResponse = await fetch(jsUrl);
      if (jsResponse.ok) {
        jsContent = await jsResponse.text();
        console.log("JS bundle carregado com sucesso para extração de dados.");
      } else {
        console.warn(`Aviso: Não foi possível baixar o JS bundle (${jsResponse.status}). Usando fallback.`);
      }
    } else {
      console.warn("Aviso: JS bundle da página não encontrado no HTML. Usando fallback.");
    }

    // Extrai metadados do HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) 
      || html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);

    const siteTitle = titleMatch ? titleMatch[1] : "Xperience Climb | Escalada Pedra Bela";
    const siteDescription = descMatch ? descMatch[1] : "Descubra a liberdade de escalar em rocha natural. Experiências guiadas exclusivas de escalada e aventura em Pedra Bela.";

    // Fallbacks baseados na estrutura real do site
    let safetyStandards = "Segurança em primeiro lugar. 100% dos guias são certificados pela AGUIP (Associação de Guias de Montanha) e possuem treinamento ativo de primeiros socorros em áreas remotas. Equipamentos de marcas premium homologados e inspecionados periodicamente.";
    let safetyEquipment = "Todos os equipamentos técnicos individuais e coletivos de segurança (cadeirinha/baudrier, capacete ventilado, freios asseguradores, cordas dinâmicas e sapatilhas aderentes de escalada) estão 100% inclusos nas atividades.";
    let physicalRequirements = "Apto para iniciantes completos sem experiência anterior em rocha. Requer apenas mobilidade básica geral, ausência de fobia incapacitante de altura e espírito de aventura!";

    let destinations = [
      {
        name: "Pedra Bela",
        location: "Pedra Bela - SP",
        details: "Vias em rocha de granito de alta aderência. O local conta com o maior campo escola da região e a maior tirolesa das Américas. Perfeito para batismos e cursos.",
        best_season: "Estação seca, de Abril a Outubro."
      }
    ];

    let transportLogistics = "Transporte terrestre até os pontos de escalada não está incluso por padrão, mas fornecemos indicações de transfer parceiros e caronas ecológicas combinadas no grupo.";
    let checklistLogistics = "Recomendado levar: mochila leve (20L), 2 litros de água, pequenos lanches, protetor solar, repelente de insetos, calçado fechado (tênis/bota) e cortador de vento leve.";

    // Tentativa de extração do JS
    if (jsContent) {
      // Tenta extrair a descrição de Pedra Bela
      const pedraBelaDescMatch = jsContent.match(/id:"pedra-bela",.*?description:"([^"]+)"/);
      if (pedraBelaDescMatch && pedraBelaDescMatch[1]) {
        destinations[0].details = pedraBelaDescMatch[1].replace(/\\x[0-9a-f]{2}/g, (match) => {
          return String.fromCharCode(parseInt(match.replace("\\x", ""), 16));
        });
      }

      // Tenta extrair detalhes de segurança
      const safetyProcMatch = jsContent.match(/title:"Verificação Pré-Escalada",.*?description:"([^"]+)"/);
      if (safetyProcMatch && safetyProcMatch[1]) {
        safetyStandards = safetyProcMatch[1].replace(/\\x[0-9a-f]{2}/g, (match) => {
          return String.fromCharCode(parseInt(match.replace("\\x", ""), 16));
        }) + " " + safetyStandards;
      }
    }

    // Regras de negócio customizadas do usuário
    // 1. Vivência bimestral apenas em Pedra Bela por enquanto
    destinations[0].details += " Vagas abertas a cada 2 meses para vivência de escalada. Por enquanto, este é o nosso único destino ativo (em breve teremos outros destinos).";

    // 2. Ponto de encontro padrão na Padaria São João de Pedra Bela para café da manhã
    const meetingPointLink = "https://google.com/maps/place/Padaria+S%C3%A3o+Jo%C3%A3o+de+Pedra+Bela./@-22.793404,-46.4509145,1257m/data=!3m1!1e3!4m6!3m5!1s0x94c94b8173c9fc59:0x10b92ab136c280a8!8m2!3d-22.7943225!4d-46.4431145!16s%2Fg%2F11g5zwbjyl?entry=tts&g_ep=EgoyMDI2MDYyOS4wIPu8ASoASAFQAw%3D%3D&skid=fd7e5c3a-4044-4189-98de-cfc5636d19e5";
    const meetingPointDescription = `O ponto de encontro padrão para Pedra Bela é na Padaria São João de Pedra Bela (${meetingPointLink}), onde faremos um café da manhã juntos antes de iniciar a vivência.`;

    const climbKnowledge = {
      safety: {
        standards: safetyStandards,
        equipment: safetyEquipment,
        physical_requirements: physicalRequirements
      },
      destinations: destinations,
      logistics: {
        meeting_point: meetingPointDescription,
        transport: transportLogistics,
        checklist: checklistLogistics
      },
      meta: {
        scrapedAt: new Date().toISOString(),
        siteTitle,
        siteDescription,
        source: sourceUrl
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
