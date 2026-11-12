# Menu arcade no PC

A apresentação do computador usa uma lista vertical de oito modos, faixas inclinadas, logotipo e títulos em estilo de jogo de luta. O celular conserva a interface da versão anterior. A distinção considera o ponteiro principal (`pointer: coarse`), evitando transformar o celular em menu de PC ao girá-lo.

## Apresentação e navegação

`DesktopMenu.tsx` possui a apresentação do início para o computador. `MobileMainMenu` conserva o conteúdo e os eventos do início mobile; `menus.css` não foi alterado. As telas secundárias continuam em `MenuLayout.tsx` e recebem somente o tema `dw-pc-shell` no PC: títulos, botões, retratos, cenários e cartões com bordas de arcade, sem voltar ao zoom do frame da luta.

Mouse, Tab, setas/W/S e Home/End mudam o foco e o destaque; Enter confirma. Uma seleção pelo mouse também recebe foco, evitando confirmar outra opção ao voltar ao teclado. A descrição, cor e brilho acompanham o modo selecionado. M abre a rádio. A rádio conserva seu foco, restauração de faixa e navegação; a campanha mantém a música exclusiva enviada pelo usuário.

O cenário tem uma área de interação acessível por clique, Enter ou Espaço, que emite o evento de agitação já usado pela multidão. A pancadaria continua com os 18 lutadores, normais e transformações, em um único chão, sem Ultimates. O quadro Arena Viva não retorna. Partículas e linhas de movimento são decorativas e respeitam a preferência por movimento reduzido.

## Desempenho

A decoração usa transformações e opacidade em CSS, sem um loop React para seguir o cursor. O desenho de `ArtCanvas` no PC tem limite de 60 quadros/s; no celular permanece em 30. `FrameTimer` mantém o tempo independente da pintura, inclusive em monitores de alta frequência. Rádio aberta, página oculta e cena fora da área visível continuam suspendendo o desenho. Texturas compactas e o orçamento de memória da multidão são os mesmos. Não há alteração da simulação de combate, das durações ou dos controles móveis.

O layout permanece em pixels CSS nativos. Há ajustes por altura para janelas baixas, tamanhos de fonte limitados e rolagem de segurança em janelas excepcionalmente pequenas.

## Verificação

Checagem de tipos, build e suites de combate, menus/áudio, mobile e API. Comparação da geometria e dos estilos do início mobile antes/depois em 320×568, 390×844 e 844×390. Inspeção visual e de interação do início, seleção, mapas, dificuldade, configurações, controles, perfil, online, campanha e pausa em resoluções de computador.

Testes no navegador usam emulação de tela/ponteiro em Chromium; não representam medições de desempenho em hardware físico.

Resultados em [desktop-menu-validation.json](desktop-menu-validation.json). Oito resoluções de computador passaram por 11 telas/estados e pelos fluxos de mouse → teclado → Enter, navegação Home/End, agitação do cenário, rádio suspendendo a animação e partida/pausa. O início foi reconferido em dez tamanhos, incluindo 1024×1366 e ultrawide 3440×1440/3840×1080; logotipo e opções sem corte ou rolagem horizontal. A comparação final de posições, dimensões, fontes e cores do início mobile foi idêntica à versão aceita nas três resoluções.
