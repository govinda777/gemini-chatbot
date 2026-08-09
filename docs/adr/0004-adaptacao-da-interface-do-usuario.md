# ADR-0004: Adaptação e Tematização da Interface do Usuário (UI)

## Status
Proposto

## Data
2026-08-08

## Contexto
O template de chatbot atual possui elementos visuais e componentes fortemente atrelados a viagens aéreas (ex: passagens de avião, seleção de assentos em cabines, etc.) e utiliza Tailwind CSS como base de estilos.
Para a **Xperience Climb**, a interface precisa transmitir o espírito de aventura ao ar livre, esportes na natureza, profissionalismo, segurança e exclusividade. O design deve causar um impacto visual premium de alta qualidade (Rich Aesthetics), com paletas de cores refinadas e micro-interações fluidas.

## Decisão
Reformularemos a interface do usuário adaptando os componentes visuais para o universo de montanhismo e aplicando uma identidade visual moderna (Earthy Dark Mode / Adventure Style):

1. **Branding e Paleta de Cores**:
   - Substituiremos as cores padrão do chatbot (azul/cinza padrão de aeroportos) por uma paleta premium inspirada na natureza e rocha natural.
   - *Paleta sugerida*: Tons terrosos escuros (grafite/ardósia, verde floresta sutil) com detalhes vibrantes em laranja de segurança (safety orange) ou amarelo dourado de nascer do sol para botões de ação principal (CTA) e destaques.
   - Aplicação de efeitos de **glassmorphism** nas janelas de chat e nos blocos de mensagens para dar uma sensação moderna de profundidade.

2. **Componentes Customizados**:
   - **ClimbPackageCard**: Em vez de cartões de voo com horários de decolagem, criaremos um componente interativo que exibe a foto da montanha/setor (ex: Pedra Bela), nível de dificuldade (indicadores coloridos), duração do passeio e preço.
   - **BookingStatusCard**: Exibirá os detalhes da escalada agendada (participantes, data, guias responsáveis) e um botão de ação com redirecionamento claro para o pagamento.
   - **PaymentStatusView**: Exibirá uma animação de sucesso (micro-animações CSS) assim que a rota de webhook confirmar o pagamento PIX/cartão do usuário.
   - **FeedbackForm**: Componente integrado diretamente no chat contendo campos simples de estrelas interativas para coletar a avaliação rápida do usuário.

3. **Tipografia e Ícones**:
   - Integração da fonte *Outfit* ou *Plus Jakarta Sans* via Google Fonts para títulos e textos, garantindo uma estética moderna e esportiva.
   - Substituição de ícones de aviação por ícones de aventura e montanhismo (Lucide Icons já disponíveis no Next.js).

## Alternativas Consideradas

*   **Manter a UI de Chat Puramente Textual**: Rejeitado. Um agente com elementos de UI avançados (cartões, feedbacks, e status integrados) converte muito melhor e entrega uma experiência mais premium que respostas meramente escritas.
*   **Refatoração total para CSS Puro (Vanilla CSS)**: Rejeitado nesta etapa específica. Como o template herdado já está inteiramente estruturado com Tailwind CSS, manter a consistência do framework acelerará o desenvolvimento do MVP, configurando as novas cores diretamente no arquivo `tailwind.config.ts`.

## Consequências
*   **Pontos Positivos**:
    - Forte impacto visual que alinha o agente com o branding real do *Xperience Climb*.
    - Maior clareza na exibição de pacotes do que se fossem listados apenas em formato de texto.
    - Facilidade para reutilizar a estrutura modular de componentes do Next.js + Tailwind já existentes no projeto.
*   **Pontos Negativos/Riscos**:
    - Esforço adicional de design para ajustar a responsividade em dispositivos móveis (que são a origem da maior parte do tráfego para vendas de passeios rápidos).
