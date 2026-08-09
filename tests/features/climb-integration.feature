Funcionalidade: Integração Real com a API do Google Gemini

  Cenário: Gemini interpreta intenções de linguagem natural e aciona as ferramentas corretas de Climb
    Dado que a API do Google Gemini está configurada e ativa
    Quando o usuário envia o prompt "Olá! Gostaria de pesquisar os pacotes de iniciante e agendar o Batismo de Escalada em Pedra Bela para duas pessoas no dia 10 de Setembro de 2026."
    Então o Gemini deve interpretar a mensagem em linguagem natural
    E deve acionar a ferramenta de listagem de pacotes "listClimbPackages"
    E opcionalmente a ferramenta de criação de reserva "createClimbBooking"
