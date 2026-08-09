Funcionalidade: Fluxo de Chat da Xperience Climb

  Cenário: Registro de usuário e listagem de pacotes
    Dado que o usuário está na página de registro
    Quando o usuário registra uma nova conta
    E realiza o login para estabelecer a sessão
    E envia a mensagem "Olá! Quais são os pacotes de iniciante na Xperience Climb?"
    Então a IA deve acionar a ferramenta listClimbPackages
    E o pacote "Pacote AGARRÃO" deve ser exibido na tela
