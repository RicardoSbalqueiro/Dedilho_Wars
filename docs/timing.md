# Velocidade e animação independentes da frequência da tela

## Diagnóstico

A abertura, a demonstração de luta, a seleção e as prévias de cenário avançavam `t++` por chamada de `requestAnimationFrame`. Isso ligava o ritmo à frequência de atualização: em 144 Hz a demonstração avançava 2,4 vezes mais que em 60 Hz. As folhas também usavam deslocamento por desenho. A intensidade do público diminuía a cada chamada de desenho.

A luta já tinha acumulador de passos fixos a 60 Hz e foi preservada nessa frequência. Dois pontos foram refinados: o limite anterior de 100 ms perdia tempo de simulação em renderizações abaixo de 10 Hz, e a inicialização baseada em `last === 0` confundia o timestamp zero com um relógio ainda não iniciado. Pausas e períodos sem atualização também precisavam de uma regra explícita para não acumular comandos e tempo a compensar no retorno.

Não foi aplicada uma redução arbitrária de velocidade ou de frames dos golpes.

## Implementação

`src/game/timing.ts` fornece um relógio monotônico compartilhado. A simulação recebe 60 ticks por segundo; os menus recebem tempo fracionário equivalente, independentemente da quantidade de desenhos. Timestamp zero, duplicado, inválido e regressivo não adiantam o jogo. Intervalos normais até 250 ms são processados em passos fixos; pausas e interrupções maiores descartam a dívida, evitando uma rajada ao retornar. Uma máquina que não consegue desenhar continua limitada pelo próprio hardware.

A luta offline pausa ao ocultar a aba. O online conserva suas regras de conexão e autoridade do anfitrião; a troca de aba limpa inputs locais e reinicia a referência do relógio, sem criar uma pausa manual online. A galeria e os menus congelam o tempo ausente. O público decai por tempo de animação, e as folhas avançam proporcionalmente ao intervalo.

A renderização local interpola posição e pose entre os ticks e consulta as amostras intermediárias do catálogo de animação. O estado autoritativo não é alterado. Novos ataques, hitboxes ativas, mudanças de defesa, viradas, impactos, hitstop e giros autorais continuam imediatos. O convidado conserva a interpolação dos snapshots e não executa uma segunda simulação.

## Mais de mil quadros por lutador

Cada personagem tem **1.098 poses vetoriais distintas**, totalizando **14.274** nos 13 lutadores. O catálogo possui três amostras para cada tick original: 180 amostras por segundo visual. O tempo de cada ciclo em segundos permanece igual. Exemplos: prontidão mantém dois segundos (360 amostras), e caminhada mantém 32/60 segundos (96 amostras).

O catálogo completo é gerado por `npm run animation:audit`, com contagens verificadas após arredondamento a seis casas decimais. Há inspeção no computador e no celular em **Treinamento → Frame Data → Animações**, e o JSON acompanha o ZIP e a página de download.

## Resultados

Teste dos componentes reais no Chromium, com timestamps de RAF controlados por automação durante dois segundos:

| Frequência | Quadros da abertura | Ticks da luta | X final após a mesma caminhada |
| --- | ---: | ---: | ---: |
| 30 Hz | 120 | 120 | 943,413846 |
| 60 Hz | 120 | 120 | 943,413846 |
| 120 Hz | 120 | 120 | 943,413846 |
| 144 Hz | 120 | 120 | 943,413846 |
| 240 Hz | 120 | 120 | 943,413846 |

Também foi verificado que a imagem do lutador muda entre ticks, enquanto o tick e a posição física permanecem iguais. Ocultar e reabrir a aba não gera compensação acelerada. A intensidade do público terminou em 0,52 após o mesmo intervalo em todas as frequências acima.

- `npm run typecheck`: passou.
- `npm test`: passou, incluindo **151 casos de temporização**, **434 de animação/apresentação** e as suítes anteriores de combate, combos, IA, treinamento, defesa, ULTs, finishers, progressão e API.
- Os testes de temporização cobrem de **5 a 360 Hz**, incluindo 59,94 Hz, intervalos irregulares, pausas e interrupções, os 13 personagens e suas Ultimates, imutabilidade da simulação durante o desenho e consulta real dos novos quadros intermediários.
- `npm run animation:audit`: **1.098 poses distintas em cada lutador**, 14.274 no total.
- `npm run build`: passou.
- A galeria foi exercitada no computador e com toque emulado, incluindo os 13 lutadores, nove sequências, avanço/recuo e o quadro 360 da prontidão. Todos os **14.274 quadros** foram desenhados em Canvas sem exceção.
- Controles e treinador foram verificados no teclado e no toque; uma partida por relay HTTP manteve o combo de 106,5 de dano e a moto da Jane do convidado.

As frequências foram simuladas por timestamps no teste automatizado; não representam medição em monitores físicos de cada frequência. O celular foi emulado. O problema específico de hardware/configuração do usuário não foi medido diretamente.

## Arquivos

`src/game/timing.ts`, `engine.ts`, `animation.ts`, `render-motion.ts`, `render.ts`, `stage.ts`; `src/ui/common.tsx`, `GameScreen.tsx`, `OnlineGame.tsx`, `AnimationGallery.tsx`; `tests/timing.test.ts`, `animation.test.ts`; `scripts/test.mjs`, `animation-report.ts`, `package.py`; README, catálogo, documentação, build e pacote offline.
