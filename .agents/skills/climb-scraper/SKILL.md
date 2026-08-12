---
name: climb-scraper
description: Scrapes climb.xperiencehubs.com and loads public mountaineering information into the local climb-knowledge.json database.
---

# Climb Scraper Skill

Esta skill permite raspar a página pública da **Xperience Climb** ([climb.xperiencehubs.com](https://climb.xperiencehubs.com/)) e atualizar dinamicamente a base de conhecimento local em [`lib/data/climb-knowledge.json`](/gemini-chatbot/lib/data/climb-knowledge.json).

## 🚀 Como Executar

Para rodar o script de raspagem e atualizar os dados:

```bash
pnpm tsx .agents/skills/climb-scraper/scripts/scrape.ts
```

## 🛠️ Lógica Interna

O script executa as seguintes tarefas:
1. Faz o download do código HTML do site de escalada.
2. Extrai informações sobre segurança, destinos de montanhismo e guias disponíveis.
3. Formata os dados extraídos no padrão esperado pela aplicação.
4. Sobrescreve o arquivo `lib/data/climb-knowledge.json` com o novo conteúdo estruturado.
