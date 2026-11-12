# Menus responsivos

O menu inicial não contém mais o quadro Arena Viva/Pancadaria Geral nem o botão Mais Caos. A demonstração com os 18 lutadores continua ao fundo. Os personagens, golpes, transformações de dez segundos e as regras da partida foram preservados.

## Estrutura

`MenuLayout.tsx` e `menus.css` fornecem páginas com largura máxima, rolagem vertical, títulos de 26–40 px, leitura em fonte de sistema e botões de 44–48 px ou maiores. As páginas usam pixels CSS nativos: não passam pelo zoom do `Frame`. Apenas as partidas locais e online usam o frame lógico de 960×540. Uma única implementação atende mouse, teclado e toque; o menu mobile duplicado foi removido, junto com seus estilos obsoletos.

A navegação de retorno permanece acessível durante a rolagem. Seleção de lutadores e mapas mantêm o botão de confirmação no rodapé. Títulos e descrições quebram linhas naturalmente, sem caixas de texto absolutas de altura fixa. O início mantém a identidade roxa, o crédito verde e a animação da multidão. As setas dos modos usam SVG para evitar glifos ausentes.

## Telas

- Início: oito modos em grade, duas ações em destaque, música separada e hierarquia de texto consistente. Em telas estreitas, os ícones secundários cedem espaço aos nomes longos.
- Dificuldade: três cartões com descrições completas, empilhados no celular.
- Lutadores: categorias, retratos, dois lados editáveis, prévia e descrição. Golpes e forma ficam em uma seção expansível; não espremem a grade.
- Mapas: seis prévias por página, paginação, sorteio que revela a página do mapa escolhido e confirmação. A grade passa de três para duas colunas.
- Controles: guia em blocos e teclado configurável para P1/P2, com tecla principal, alternativa, cancelamento e proteção contra conflitos. Restaurar padrão continua disponível.
- Configurações: áudio, imagem/combate, dificuldade e conforto de toque, todos persistidos no dispositivo. Sliders mostram porcentagem e inputs de formulário usam 16 px.
- Wars of Champions: quatro artes e o quinto aviso preservados, com três tamanhos de grade, nomes legíveis e navegação de retorno. A trilha enviada continua exclusiva, com volume ajustável e restauração da rádio anterior.
- Rádio: um diálogo nativo para todos os dispositivos; cabeçalho e retorno separados da área rolável. Reprodutor e playlist ficam lado a lado no computador e empilhados no celular. As oito estações permanecem disponíveis.
- Perfil, ranking, cadastro, salas e lobby: fluxo natural, cartões e formulários que cabem em telas estreitas, com mensagens de estado/erro no próprio fluxo.
- Pausa e resultados: diálogos fora do frame, fontes nativas, foco inicial, contenção de Tab e restauração de foco. Setas também focam e revelam a ação selecionada; Enter encontra o botão no portal.

## Verificação

O build e a checagem de tipos são executados antes da publicação. As suites de combate, transformações, áudio exclusivo, mobile, progressão e API continuam sendo usadas. A verificação de layout em Chromium cobre as telas do computador, celulares estreitos, tablets, rotação, teclado virtual simulado por redução de altura e os fluxos de partida/pausa.

As verificações no navegador usam emulação de tamanho de tela e toque; não representam testes em hardware físico.

Resultados em [menu-layout-validation.json](menu-layout-validation.json): 140 verificações de layout (14 telas/estados em dez resoluções: 967×855, 1280×720, 1920×1080, 320×568, 360×800, 390×844, 430×932, 568×320, 844×390 e 768×1024), sem erros de JavaScript, escala de menu alterada, corte de texto ou rolagem horizontal nas verificações. Imagens decorativas recortadas dentro dos cartões não contam como corte de texto.

Sete resoluções móveis também passaram com 12 ações, direcional à direita, botões maiores, agachar+defender simultaneamente, cancelamento e rotação sem comando preso. Cadastro, salas, lobby, partida de duas sessões e diálogos de saída passaram no celular e no computador. Reconfiguração/restauração de teclado, persistência de volume/toque, retorno fixo ao rolar, Enter na pausa e resultados em três tamanhos de tela passaram.

A seleção da galeria não muda por simples entrada do cursor durante uma rolagem provocada pelo teclado. O foco/seleção e o retorno foram reconferidos nas dez resoluções após essa correção.
