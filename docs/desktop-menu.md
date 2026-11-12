# Menu ilustrado no PC

O início no computador é uma composição de mangá com papel, retículas, recortes de tinta, cinco painéis ilustrados de modos e um lutador interativo. Os nomes são JOGAR, VERSUS LOCAL, ONLINE, TREINAMENTO e WARS OF CHAMPIONS. Perfil e Ranking, Controles, Configurações e Música ficam na faixa superior. Não há índices numéricos ou apelidos para os modos.

## Navegação e interação

`DesktopMenu.tsx` mantém o destaque visual e o foco de teclado na mesma opção. Mouse, setas/W/S e Home/End selecionam os modos; Enter confirma. Tab alcança também as opções, o lutador, as setas da coleção e a transformação. O botão Entrar abre o modo exibido. M abre a rádio, que suspende a tela e restaura o foco ao fechar.

Cada modo apresenta um lutador do elenco, uma cor e uma explicação direta. As setas abaixo da arte percorrem os 18 personagens em ambas as direções. Clicar no personagem alterna golpes normais de soco e chute, usando as poses e os acessórios do jogo. Transformar exibe sua forma durante dez segundos, com barra de duração; a contagem pausa durante a rádio e em páginas ocultas. Trocar de personagem encerra a demonstração anterior.

A pancadaria no cenário continua com os 18 combatentes no mesmo chão, ataques normais e transformações, sem Ultimates. O botão Agitar a luta ao fundo provoca uma reação coletiva. O quadro Arena Viva permanece removido.

Dificuldade, seleção, arenas e campanhas usam a mesma direção visual no PC: títulos sobre papel, retratos, bordas de tinta, cores de seleção e transições curtas. As campanhas preservam seus nomes e imagens de costas, a indicação Em breve e a música exclusiva enviada pelo usuário. Os antigos números e temas usados como rótulos extras foram removidos.

## Responsividade e desempenho

O ponteiro principal (`pointer: coarse`) escolhe a interface mobile. A grade inicial de celular e seus eventos continuam em `MobileMainMenu`; `menus.css` permanece intacto. Girar o telefone não ativa a composição de PC. Apenas partidas usam o frame lógico de 960×540. Os menus continuam em pixels CSS nativos, com fontes limitadas e rolagem para janelas pequenas.

`MenuFighter.tsx` desenha somente o personagem ilustrado selecionado, usando o cache de atlas limitado do jogo. Não cria uma partida nem altera a simulação. O desenho tem limite de 60 quadros/s, pausa fora da área visível, com rádio e em páginas ocultas. A multidão mantém suas texturas compactas e seu orçamento de memória. A decoração acompanha o cursor por propriedades CSS; não há atualização de estado React por movimento do mouse. O contador só atualiza enquanto a transformação está ativa.

Movimento reduzido desativa transições, entrada de painéis, paralaxe e movimento ocioso do personagem em destaque. A preferência de flashes reduzidos limita os efeitos do ataque e da forma. Os controles e o foco continuam visíveis em ambas as configurações.

## Verificação

Os resultados desta versão ficam em [desktop-menu-validation.json](desktop-menu-validation.json). As verificações incluem tipos, build, suites existentes de combate/áudio/mobile/API, rotas de menu no Chromium, mouse e teclado, duração da transformação, suspensão pela rádio, os 18 personagens e suas formas, além da comparação dos estilos e da geometria do início mobile com a versão aprovada.

Os testes de navegador usam emulação de tela e ponteiro; não são medições em hardware físico. O ZIP é conferido por SHA-256, CRC, arquivos de código atuais e inicialização do jogo extraído.
