# Otimização mobile

Os menus e controles usam tamanhos nativos em vez de depender da escala do canvas. O cabeçalho é mais compacto, o início tem uma grade de modos com as campanhas em destaque, e as telas de seleção/mapas mantêm a confirmação acessível ao rolar. O estilo/golpes do lutador abre em um detalhe expansível. O retorno e a música ficam numa barra que acompanha a rolagem. Formulários usam fonte de 16 px e alvos de toque ampliados; perfil, ranking, salas e diálogos se ajustam a telas estreitas.

## Controles

O painel tem 12 ações: especiais 1/2/3, soco, chute, defesa, cabeçada, agarrar, virar, forma, ULT e carregar. O direcional reconhece diagonais, salto e agachamento. CARREGAR fica disponível para Rickzera. ULT indica estoques e FORMA indica a duração ativa. No treino, o resumo de dano/acertos fica no painel nativo, deixando a arena livre do antigo bloco de diagnóstico.

Na vertical, há três colunas e quatro fileiras; na horizontal, seis colunas e duas fileiras. As áreas de toque medem ao menos 44 px, e as ações centrais têm contraste próprio. MENU e tela cheia, quando a API está disponível, ficam separados das ações. Safe areas e altura real do painel reservam espaço para a arena. A partida e seu personagem não são recriados ao girar o aparelho.

CONFIGURAÇÕES salva neste dispositivo a posição do direcional à esquerda/direita, botões maiores, vibração opcional e qualidade gráfica. Esses ajustes não modificam o teclado ou o protocolo online. Vibração e tela cheia dependem do navegador/aparelho; o jogo funciona sem essas APIs.

Cada dedo tem sua própria captura/ação. O direcional aceita um dedo responsável por vez; perder um toque não libera os outros. Cancelar, girar, perder foco ou esconder a página limpa o estado. O movimento do polegar atualiza diretamente a transformação visual, evitando renderizar todos os botões React a cada evento. Ativações por teclado/leitor de tela também podem acionar os botões.

## Renderização e bateria

A qualidade Automática acompanha o tamanho físico exibido e limita cenas a 1920×1080; Alta oferece mais supersampling. Por exemplo, a arena de 390×219,375 CSSpx com DPR 3 usa 1170×658 em Automática, contra 1920×1080 da política anterior: cerca de 63% menos pixels renderizados. O computador mantém Full HD até 4K. A geometria, hitboxes, recursos, durações e simulação não mudam.

Menus móveis desenham até 30 quadros/s e lutas até 60, com cadência compensada inclusive em telas de 90/120/144 Hz. O relógio, leitura de inputs, simulação de 60 ticks/s e envio/recebimento online continuam sendo processados; somente o desenho tem limite. Menus fora da área visível ou atrás da rádio deixam de pintar. O online mobile não carrega a multidão atrás de seu formulário opaco. Lutas móveis pausadas desenham a 10 quadros/s; rádio/laboratório cobrindo a cena suspende o desenho, e a confirmação de saída online não para a partida.

A multidão do início usa cópias compactas das 36 folhas e não substitui os assets detalhados das partidas. Partículas respeitam movimento reduzido. Esses limites reduzem trabalho e memória; não constituem uma promessa de FPS para qualquer aparelho.

## Verificação

- 25 regressões de resolução/cadência/preferências/multitoque, além das suites completas de combate, recursos, inputs, snapshots e API.
- Emulação Chromium em 320×568, 360×800, 390×844, 430×932, 568×320, 844×390 e 768×1024, com DPR 3: 12 ações, alvos de 44 a 62 px, direcional à direita, botões maiores, agachar+defender com dedos separados, cancelamento e rotação sem comando preso.
- Galeria de campanhas no desktop/mobile, quatro artes e o quinto aviso, música exclusiva real, volume e retorno à rádio anterior.
- Duas sessões mobile autenticadas por relay: CARREGAR no P2, transformações dos dois jogadores, Ultimate de 200 de dano base e rajada de energia com custos/dano sincronizados, sem erros de JavaScript.
- Perfil/ranking, login com altura de teclado reduzida, laboratório de recursos/combos e desafios em 320/390 px, com a mesma instância de partida ao abrir/fechar ferramentas e sem erros de JavaScript.

Os testes de navegador usam emulação de tela/toque. Medições de autonomia e desempenho em hardware físico não foram feitas neste ambiente.
