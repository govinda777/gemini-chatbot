Funcionalidade: Agente Especialista Xperience Climb (Regras de Negócio e Ferramentas)

  Cenário: Busca na Base de Conhecimento (RAG)
    Dado que a ferramenta de busca de conhecimento está carregada
    Quando o usuário pergunta "quais equipamentos de segurança estão inclusos?"
    Então o sistema deve retornar as diretrizes e itens de segurança corretos, incluindo "cadeirinha" e menção a itens "certificados pela AGUIP"

  Cenário: Listagem de pacotes de escalada para iniciante
    Dado que o bot de pacotes está ativo
    Quando a listagem de pacotes para iniciante é acionada
    Então o sistema deve retornar os pacotes corretos de nível iniciante
    E cada pacote deve ter o preço original de 330.0 e preço promocional de 277.0
    E a lista de inclusões do pacote deve conter "✓🧗 Escalada em rocha natural"

  Cenário: Captura de Lead com consentimento da LGPD concedido
    Dado que o formulário de captação comercial está aberto
    Quando o lead "Govinda" envia seus dados com consentimento explícito
    Então as informações devem ser salvas com sucesso no banco de dados

  Cenário: Rejeição de Lead sem consentimento da LGPD
    Dado que o usuário não concede permissão de privacidade
    Quando o formulário comercial tenta salvar os dados do lead sem consentimento
    Então o sistema deve recusar a gravação e retornar um erro de consentimento de LGPD

  Cenário: Criação de Reserva e Geração de Links de Pagamento
    Dado que o usuário cria uma reserva para o "Batismo de Escalada em Pedra Bela" com 2 participantes
    Quando a reserva é processada
    Então o preço total calculado deve ser 554 BRL (277 BRL por participante)
    E o sistema deve gerar links de pagamento válidos (Stripe) e Pix (BR Code)

  Cenário: Coleta de Feedback de Atendimento
    Dado que a ferramenta de feedback de atendimento está disponível
    Quando o usuário envia uma avaliação com nota 5 e um comentário elogioso na categoria "sistema"
    Então o feedback deve ser registrado com sucesso
