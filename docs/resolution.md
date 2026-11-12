# Full HD, 1440p, 4K e telas com alta densidade

## Diagnóstico

A imagem principal tinha um backing canvas fixo de 960×540. O elemento inteiro era ampliado por `transform: scale()` para preencher a janela, incluindo os menus. Em uma tela 1920×1080, a imagem do canvas tinha metade da resolução em cada eixo; em 4K, um quarto. Os retratos e os cenários pré-renderizados também mantinham buffers pequenos mesmo quando eram ampliados.

## Implementação

`src/game/canvas.ts` calcula o tamanho físico a partir da área exibida e de `devicePixelRatio`, com políticas separadas para cenas completas e detalhes. A transformação inicial do contexto mapeia esses pixels às mesmas coordenadas lógicas já usadas pelo jogo.

| Área exibida / densidade | Buffer principal |
| --- | --- |
| 1920×1080, DPR 1 | 1920×1080 |
| 2560×1440, DPR 1 | 2560×1440 |
| 3840×2160, DPR 1 | 3840×2160 |
| 1280×720, DPR 2 | 2560×1440 |
| 1536×864, DPR 1,25 | 1920×1080 |
| 1920×1080, DPR 2 | 3840×2160 |

A resolução interna das cenas fica entre Full HD e 4K. O limite evita buffers de 8K em telas Retina grandes. Retratos, miniaturas e galeria usam seu tamanho real e DPR, sem reservar uma tela Full HD para cada ícone; têm um orçamento separado de até 4.194.304 pixels. Dimensões inválidas/ocultas não produzem buffers infinitos ou valores NaN.

Os menus mantêm o layout lógico de 960×540 e usam CSS `zoom`, para que o navegador pinte fontes e contornos no tamanho final. O elemento principal não usa mais a ampliação por `transform: scale()`. A fonte local e a direção artística continuam as mesmas.

`CanvasSurface.prepare()` só realoca o buffer quando a resolução física muda. Redefine a transformação e a suavização de imagem antes do desenho, preservando o contexto nos frames normais. Cenas opacas dispensam a composição alpha da superfície inteira; texturas já desenhadas em alta resolução usam amostragem bilinear rápida durante o movimento da câmera. Textos e vetores continuam sendo rasterizados diretamente na resolução física. Retratos conservam transparência e reamostragem de alta qualidade. As cenas animadas verificam o tamanho no ciclo existente; não é criado um segundo loop de animação. Imagens estáticas observam layout, viewport, mudanças de DPR/monitor e carregamento de fontes, com limpeza dos observers/listeners ao desmontar.

As camadas de céu, arquitetura, paisagem e piso dos 17 mapas são reconstruídas na densidade necessária. `drawImage` recebe explicitamente os tamanhos lógicos, mantendo posição, parallax, escala e chão corretos. O desenho aleatório decorativo tem semente estável por mapa para evitar mudanças de cenário ao trocar a resolução. O cache distingue mapa e densidade, é invalidado quando as fontes carregam e retém no máximo oito entradas ou 48 Mi pixels de camadas. Referências ainda usadas por uma tela ativa continuam válidas.

Não se altera o motor, o buffer de inputs, o frame data, o balanceamento, o limite de juggle, as Ultimates, os finishers ou os controles. A partida não é recriada ao redimensionar. O protocolo permanece `dw-online-11` e não há migração de contas ou banco.

## Validação

- `npm run typecheck`: passou.
- `npm test`: passou, incluindo **55 regressões novas** de dimensões físicas, Full HD/1440p/4K, Retina e zoom, limites de memória, métricas inválidas, ausência de realocação a cada frame e preservação de inputs/estado/simulação online ao mudar a resolução. Todas as suítes anteriores de combate, 18 lutadores, Ultimates/finishers, combos, treino, defesa, tempo, progressão e API continuam passando.
- `npm run build`: passou.
- Chromium: menus, seleção, retratos, combate e galeria em 1920×1080, 2560×1440, 3840×2160, 1280×720 com DPR 2 e 1536×864 com DPR 1,25. A resolução física observada corresponde à tabela; o layout principal não usa transformação de ampliação.
- A mesma instância e os mesmos campos dos lutadores foram preservados ao redimensionar a partida pausada. Retratos estáticos foram verificados após mudar a janela e após uma mudança de DPR em execução.
- Os 17 mapas tiveram camadas Full HD verificadas; Dojo, Neto Supermercados e NGB News também tiveram buffers na densidade de 4K conferidos. Foram desenhados com as dimensões lógicas existentes.
- Online com dois jogadores autenticados, relay HTTP, host Full HD redimensionado para 1440p e convidado móvel com DPR 3: mesma partida após resize, especial por toque, Ultimates de P1/teclado e P2/toque, dano e recuperação sincronizados. Nenhum erro JavaScript. O protocolo `dw-online-11` permanece igual.
- Celular com DPR 3, vertical e horizontal: menus nativos, resolução de combate Full HD ou maior, toque, Soco Inglês/cratera e rotação sem reinício da partida. Nenhum erro JavaScript nas verificações concluídas.

As resoluções e o toque foram emulados no navegador. Esses resultados não são uma homologação de FPS em todos os aparelhos ou GPUs.

## Arquivos alterados

- `src/game/canvas.ts`: política de resolução, superfície adaptativa, observers e alocação de camadas.
- `src/game/stage.ts`, `src/game/stage-scenes.ts`, `src/game/extra-stage-scenes.ts`: camadas dos 17 mapas na densidade necessária e desenho em coordenadas lógicas.
- `src/ui/common.tsx`: layout nativo dos menus, cache de cenários, abertura, retratos e prévias.
- `src/ui/GameScreen.tsx`, `src/ui/OnlineGame.tsx`: superfície Full HD–4K e troca de resolução durante a partida.
- `src/ui/AnimationGallery.tsx`: galeria na resolução física exibida.
- `src/index.css`: dimensões lógicas independentes do backing buffer.
- `tests/resolution.test.ts`, `scripts/test.mjs`: 55 novas regressões integradas à suíte.
- `README.md`, `docs/resolution.md`: explicação e resultados.
- `dist/client/index.html`, `dist/client/baixar/Dedilho-Wars-projeto.zip`: build e download offline atualizados.

## Celulares: política atual

A otimização mobile usa resolução automática próxima aos pixels físicos exibidos, com limite de Full HD e mínimo lógico de 960×540 para cenas. A opção Alta mantém supersampling maior. O piso obrigatório de Full HD dos relatórios históricos agora se aplica ao computador; em celulares, evitar pixels excedentes reduz trabalho e memória. A arena continua em 960×540 e a simulação/inputs/rede mantêm suas regras. Veja [mobile](mobile.md).
