# Guia de Edição da Base de Conhecimento (climb-knowledge.json)

Este guia explica a estrutura do arquivo [`lib/data/climb-knowledge.json`](file:///Users/govinda/projetos/gemini-chatbot/lib/data/climb-knowledge.json), que atua como o banco de dados RAG (Retrieval-Augmented Generation) para responder a dúvidas de clientes da **Xperience Climb**.

---

## 🏗️ Estrutura do Arquivo JSON

O arquivo é dividido em três categorias lógicas principais. Qualquer nova informação deve ser enquadrada em um desses três blocos:

```json
{
  "safety": {
    "standards": "Normas de segurança e certificações dos guias...",
    "equipment": "Lista de equipamentos fornecidos e obrigatórios...",
    "physical_requirements": "Condicionamento físico e restrições médicas..."
  },
  "destinations": [
    {
      "name": "Nome do Local",
      "location": "Cidade - UF",
      "details": "Características da rocha, estilo de escalada e vias...",
      "best_season": "Melhor época do ano para visitar..."
    }
  ],
  "logistics": {
    "meeting_point": "Onde encontrar os guias e horários...",
    "transport": "Instruções sobre como chegar e transfer...",
    "checklist": "O que o cliente deve levar na mochila..."
  }
}
```

---

## ➕ Como Adicionar Novas Informações

### Caso 1: Adicionar um Novo Destino ou Setor de Escalada
Para adicionar um novo destino, insira um novo objeto no array `"destinations"`:

```json
{
  "name": "Cuscuzeiro",
  "location": "Analândia - SP",
  "details": "Uma imponente torre de arenito silicificado com cerca de 50 metros de altura. Excelente para escalada esportiva com vias bem protegidas.",
  "best_season": "Outono e inverno (Abril a Setembro)."
}
```

### Caso 2: Atualizar Regras de Segurança ou Logística
Basta editar os campos correspondentes dentro dos objetos `"safety"` ou `"logistics"`. Por exemplo, se o ponto de encontro mudar:

```json
"meeting_point": "O novo ponto de encontro padrão é no Posto de Conveniência Portal das Montanhas às 07:30 AM."
```

---

## 🔍 Como o Agente Recupera as Informações (RAG)

Quando o usuário faz uma pergunta no chat, a ferramenta `searchClimbKnowledge` é acionada. Ela realiza uma busca textual simples baseada em palavras-chave no JSON:

1.  **Dúvidas de Equipamento/Segurança/Saúde**: Disparam o retorno do bloco `"safety"`.
2.  **Dúvidas de Locais/Montanhas**: Disparam o retorno da lista de `"destinations"`.
3.  **Dúvidas de Ponto de Encontro/Carona/Checklist**: Disparam o retorno do bloco `"logistics"`.

> [!IMPORTANT]
> Mantenha os textos objetivos, pois eles são inseridos diretamente no contexto do modelo Gemini e consomem tokens. Evite descrições excessivamente longas ou redundantes.
