# ADR-0003: Integração de Vendas de Pacotes via Links de Pagamento

## Status
Proposto

## Data
2026-08-08

## Contexto
O atual chatbot simula a reserva de passagens aéreas e assentos, gerando um preço fictício e um status de pagamento. Na **Xperience Climb**, o modelo de negócio consiste em vender pacotes de experiências de escalada, cursos e expedições de montanhismo.
O agente precisa ser capaz de:
1. Apresentar os pacotes disponíveis (preço, duração, inclusões, local).
2. Solicitar detalhes do agendamento (data desejada e número de participantes).
3. Gerar links de pagamento reais ou simulados para conclusão rápida.
4. Confirmar a compra após a liquidação do pagamento.

Precisamos definir como reestruturar o fluxo de reservas (`Reservation`) para atender a esse modelo de pacotes e links de pagamento.

## Decisão
Substituiremos a lógica de voos/assentos por uma **lógica de pacotes com geração dinâmica de links de pagamento**:

1. **Catálogo de Pacotes Estático / Dinâmico**:
   Criaremos uma lista pré-definida de pacotes no servidor (ex: `lib/data/climb-packages.json`), contendo:
   - *ID*: Identificador único do pacote.
   - *Nome*: Ex: "Batismo de Escalada - Pedra Bela".
   - *Preço*: Valor unitário (ex: R$ 350,00).
   - *Descrição*: Resumo do passeio, nível de dificuldade e inclusões.
   - *Link de Pagamento Padrão*: URL base do gateway (Stripe, Asaas, Mercado Pago, etc.).

2. **Refatoração das Tools**:
   - `searchFlights` -> `listClimbPackages`: Lista os pacotes disponíveis, podendo filtrar por nível de dificuldade ou duração.
   - `selectSeats` -> Removido (não há assentos em escalada em rocha natural, mas podemos ter campos adicionais como tamanho de sapatilha no cadastro do lead).
   - `createReservation` -> `createClimbBooking`: Cria um registro de reserva na tabela `Reservation` com o pacote selecionado, quantidade de pessoas e data escolhida.
   - `authorizePayment` -> `generatePaymentLink`: Invoca o gateway de pagamento (ex: Stripe Checkout Session ou PIX do Asaas) gerando um link exclusivo de pagamento baseado no preço total.
   - `verifyPayment`: Consulta o status do pagamento via API do gateway de pagamento ou via recebimento de Webhook na rota `/api/webhooks/payment` do Next.js (atualizando `hasCompletedPayment` para `true`).

3. **Confirmação e Voucher**:
   Assim que o pagamento for verificado como recebido, o bot irá exibir um voucher gerado com instruções de check-in, roupas recomendadas e contato direto dos guias da Xperience Climb.

## Alternativas Consideradas

*   **Venda via Chat (Checkout Conversacional Nativo)**: Rejeitado por motivos de segurança e alta complexidade regulatória (PCI-DSS). Coletar dados de cartão de crédito diretamente no chat aumenta exponencialmente os riscos de vazamento e engenharia social. O redirecionamento seguro para links externos de pagamento (Hosted Checkout) é o padrão de mercado mais seguro.
*   **Apenas links estáticos**: Rejeitado, pois não permitiria o cálculo de descontos para grupos ou reservas em datas customizadas. Os links dinâmicos calculam o valor correto dependendo de quantas pessoas vão escalar.

## Consequências
*   **Pontos Positivos**:
    - Extrema segurança ao delegar o processamento do cartão de crédito ou PIX ao gateway.
    - Facilidade para validar vendas reais através de Webhooks padrão de mercado.
    - Menor fricção para o usuário comprar pacotes diretamente do celular ou desktop.
*   **Pontos Negativos/Riscos**:
    - Dependência de rede e APIs do gateway de pagamento parceiro.
    - Necessidade de gerenciar a expiração de links de pagamento abertos mas não concluídos.
