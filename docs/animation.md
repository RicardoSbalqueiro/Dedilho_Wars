# Atualização de arte, animação e som

Esta atualização mantém os 13 lutadores e usa os pôsteres como referência de silhueta, roupa, cabelo, expressão e acabamento. Os lutadores continuam sendo desenhos vetoriais articulados, renderizados a cada frame; não são pôsteres recortados movidos como uma única imagem.

## Quadros por lutador

Cada um dos 13 personagens tem **1.098 quadros distintos** em nove sequências usadas no jogo: prontidão/respiração (360), caminhada (96), dash (72), salto (72), defesa alta (108), agachar (108), reação ao impacto (48), levantar (54) e vitória (180). O total é **14.274 quadros**, além das etapas dos golpes e das cinematográficas. São quadros vetoriais de poses articuladas, amostrados a 180 quadros por segundo visual, com as mesmas durações em segundos. A simulação continua a 60 ticks por segundo. O aumento de densidade não alonga startup, frames ativos, recuperação ou cinematográficas. A renderização local consulta os quadros intermediários entre ticks, respeitando a transição existente.

O comando `npm run animation:audit` gera [animation-frames.json](animation-frames.json) com os quadros e a contagem de poses distintas dos 13 lutadores, comparados com precisão de seis casas decimais. A auditoria confirma 1.098 poses distintas em cada personagem. No jogo, acesse **TREINAMENTO → FRAME DATA → ANIMAÇÕES** para trocar o lutador, escolher as nove sequências, pausar, reproduzir e avançar/recuar quadro a quadro. O controle deslizante permite inspecionar inclusive o quadro 360 da prontidão. A galeria também funciona no toque e mantém a partida pausada. A reprodução converte a densidade do catálogo para tempo real, preservando o ritmo em telas de 30, 60, 120 ou 144 Hz. A correção da velocidade está documentada em [timing.md](timing.md).

## O que mudou

- Contornos orgânicos, volumes de luz e sombra e detalhes de roupa substituem o acabamento cilíndrico dos membros. Caetano, Cristyan e Tubarão têm novas formas de peitorais, abdômen e oblíquos; o Tubarão ganhou o maxilar e a expressão humana da referência. A pelagem do Orango acompanha o corpo e a cabeça. Jane mantém a baixa estatura adulta, o bob com franja reta, jaqueta branca, peças pretas/amarelas e botas; ganhou fones e detalhes das tiras e do short. As cores de roupa e as silhuetas dos outros lutadores permanecem reconhecíveis.
- Cada golpe tem oito etapas visuais: prontidão, antecipação, preparação, soltura, extensão, acompanhamento, recolhimento e retorno. A mão ou o pé chega à pose original de contato no primeiro frame ativo. O golpe curto continua curto; o forte conserva seu startup e sua recuperação. São poses intermediárias geradas e desenhadas continuamente, não oito PNGs.
- Caminhada alterna apoio, joelho, braço e tronco. Salto muda entre subida e queda; dash, bloqueio, reação, recuperação e vitória têm movimento próprio. Ritmo e amplitude variam por personagem. Respiração, cabelo, orelhas, faixa, cauda, pelo e acessórios usam o relógio da simulação e congelam com o hitstop.
- Seleção e demonstração da abertura mostram movimentos completos. Atores das Ultimates e finishers fazem transições de seis frames entre poses, sem mudar a duração ou os eventos dessas cenas.
- Arcos de movimento seguem punhos e pés; golpes fortes têm uma imagem residual curta. O bloqueio desenha um escudo angular; defesa perfeita tem um acento próprio. Os efeitos existentes de cada especial foram preservados.
- Acertos leves têm ataque sonoro curto e agudo. Impactos fortes acrescentam corpo grave e cauda; o som do movimento é separado do acerto. Especiais têm acentos de material próprios, incluindo água, elasticidade, eletrônica e som. Música, rádio, narrador e volume escolhido continuam funcionando.
- O convidado online interpola **somente a apresentação** entre snapshots a 20 Hz. Poses e posições visuais acompanham o RAF; contato/hitstop, mudanças de orientação e cinematográficas usam o estado recebido imediatamente. O estado autoritativo, inputs e projéteis não são interpolados nem modificados.

## Acesso para novos jogadores

Configurações no computador e no celular têm **DICAS DE COMBATE** e **REDUZIR FLASHES**. As dicas usam os controles remapeados ou os nomes dos botões de toque e explicam combo básico, guarda, rasteira e recuperação. Podem ser desligadas. Não aparecem em partidas online.

Reduzir flashes limita os flashes de tela, remove as linhas de velocidade e a imagem residual, e atenua os brilhos das cinematográficas. Tremor de tela continua sendo uma opção independente, também respeitada pelos finishers. A preferência de movimento reduzido do sistema fornece os padrões iniciais; escolhas salvas prevalecem. Configurações antigas são migradas sem apagar volume ou controles.

## Verificação

- `npm run typecheck`: passou.
- `npm test`: passou, incluindo **434 casos** de animação/apresentação. Todos os testes de combate, 52 rotas de combo, IA, 13 finishers, defesa/virada, Clash de ULT, espectadores online, treino, progressão e API permanecem aprovados.
- `npm run build`: passou.
- Desenho real no Chromium: todos os **14.274 quadros do catálogo**, mais **984 amostras**, incluindo os **169 golpes**, os 13 finishers, as cinco Ultimates com cenas independentes e o modo de flashes reduzidos; nenhuma exceção de Canvas/JavaScript.
- Navegador local: combos básicos, especial e aéreo com o treinador; no toque, rasteira com dois dedos, combo aéreo, salto defensável e moto de Jane. A partida por relay HTTP entre computador e celular emulado preservou o combo de 106,5 de dano e o lançamento da moto do convidado.
- Teste de invariância: para cada lutador, a mesma sequência de inputs foi simulada com a nova animação e com uma apresentação neutra. Vida, movimento, direção, estados, combos, cooldowns e colisões permaneceram iguais. O novo módulo não altera `data.ts`, regras de IA ou protocolo.

As medidas são testes automatizados e inspeção em navegador. Celular usa emulação de toque; não representam teste em aparelho físico nem avaliação de animação/balanceamento por jogadores humanos.

## Arquivos de implementação

`src/game/timing.ts`, `src/game/animation.ts`, `src/game/rig.ts`, `src/game/combat-art.ts`, `src/game/combat-feel.ts`, `src/game/render-motion.ts`, `src/game/visual-settings.ts`, `src/game/engine.ts`, `src/game/render.ts`, `src/game/stage.ts`, `src/game/audio.ts`, `src/game/prefs.ts`, `src/game/trio-art.ts`, `src/game/viewer-art.ts`, `src/game/finishers-art.ts`, `src/ui/common.tsx`, `src/ui/Screens.tsx`, `src/ui/MobileMenu.tsx`, `src/ui/OnlineGame.tsx`, `src/ui/GameScreen.tsx`, `src/ui/AnimationGallery.tsx`, `src/ui/FrameDataLab.tsx`, `src/index.css`, `tests/animation.test.ts`, `tests/timing.test.ts`, `scripts/test.mjs`, `scripts/animation-report.ts`, `scripts/animation-report.mjs`, `scripts/package.py`, `package.json` e a documentação. O build e o ZIP para jogar offline são regenerados a partir dessa versão.
