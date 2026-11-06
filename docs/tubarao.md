# Tubarão Fiscal: Beijo do Fiscalizador e Quando terá Live?

O terceiro especial passa a ser **Beijo do Fiscalizador**, e a Ultimate passa a ser **Quando terá Live?**. Os comandos permanecem **O / Num 6 / ESP 3** para o especial e **H / Num 0 / ULT** para a Ultimate, respeitando os controles personalizados. Defesa em E, Cabeçada universal em L, Mordida, Engole e o finisher **Maré da Malha Fina** permanecem disponíveis.

## Valores antes e depois

| Elemento | Antes | Agora | Motivo e contrajogo |
| --- | --- | --- | --- |
| Beijo do Fiscalizador | ULT de 290 de dano | Especial de 64 de dano, um contato | Redução de aproximadamente 78% ao retirar a exigência da barra completa. Continua sujeito à escala de combos. |
| Terceiro especial | Cabeçada de Barbatana: dano 95, 12f de preparação, 10 ativos, 28f de recuperação, +16 no erro | Beijo: dano 64, 18f de preparação, 4 ativos, 24f de recuperação, +16 no erro | Mais preparação e alcance menor. Erro compromete 62 ticks; defender cria uma abertura. |
| Alcance e avanço do terceiro especial | Caixa X de 10–170, avanço de 8/f entre frames 9–22 | Caixa X de 10–110, avanço de 2/f entre frames 14–17 | Golpe próximo com passo curto, sem perseguição ou projétil de coração. A largura do rival e a desaceleração afetam o alcance real. |
| Armadura e lançamento | Armadura nos frames 4–21 e lançamento vertical de 11 | Sem armadura, invulnerabilidade ou lançamento | Preparação e ativos podem ser interrompidos; remove o antigo avanço protegido. |
| Defesa do Beijo | Antiga ULT capturava | Médio, bloqueável em pé ou agachado | Não é agarrão nem golpe indefensável. Engole continua sendo a opção contra guarda previsível. |
| Chip do terceiro especial | 4,75 por bloqueio comum | 1,6 por bloqueio comum (2,5% de 64) | Menor pressão contra defesa; chip continua não letal. Leitura de Caetano pode zerá-lo. |
| Hitstun / blockstun | 28 / 17 | 28 / 14 | Beijo tem vantagem teórica +1 ao acertar e −13 ao bloquear no primeiro ativo, sem cancelamento especial gratuito. Repetir o especial não forma um combo infinito. |
| Ultimate | Beijo do Fiscalizador, uma explosão de 290 | Quando terá Live?, três lambidas de 12 e uma rabada de 254 | Mantém 290 no total e o custo de 100 de barra, distribuindo o dano pela nova animação. |
| Lançamento da ULT | Deslocamento de até 340 | Até 700 unidades após a captura | Lança para longe, respeitando as bordas existentes; não causa ring-out nem dano extra na parede. |

HP 1230, movimentação, alcance dos normais, Mordida e Engole não receberam aumento. O Beijo usa os cancelamentos e o buffer existentes: só entra de um normal confirmado nas condições já permitidas. Não pode cancelar o próprio erro nem repetir automaticamente ao segurar. A IA foi ajustada para aproximar antes de escolher o Beijo, em vez de tratá-lo como a antiga arrancada.

## Nova animação da Ultimate

A sequência tem 210 ticks a 60 Hz, além da pausa de impacto e do anúncio/captura comuns das ULTs. A transformação revela um corpo de tubarão horizontal, com cauda, barbatana dorsal, nadadeiras, guelras e o rosto humanoide do personagem. O cenário da animação usa água, bolhas, raios de luz e corações.

- Ticks 0–30: transição da forma humanoide para a forma aquática.
- Lambidas nos ticks 60, 82 e 104, com a língua alcançando o rosto do oponente e dano de 12 por contato.
- Preparação e giro entre as lambidas e a rabada.
- Tick 138: impacto da cauda, 254 de dano e pausa de impacto de 12 ticks.
- Até o tick 185: voo longo do adversário.
- Ticks 190–210: volta à forma humanoide, encerramento e retorno à arena.

O motor aplica o dano; o desenho apenas lê a mesma coreografia. A escala do combo é amostrada na entrada e aplicada a todos os quatro contatos, sem penalização adicional por cada lambida visual. O anúncio, a preparação vulnerável de 12f, a altura limitada de captura, a armadura apenas na captura ativa e a recuperação ao errar continuam seguindo as regras universais. A batalha de ULTs continua executando a animação de quem vencer.

No fim, ambos saem da sequência: o atacante retorna ao chão com o compromisso normal de aterrissagem; o defensor sofre a derrubada e levanta pelas regras existentes. Nenhum ator permanece escondido, transformado ou invulnerável depois da animação. O finisher continua sendo uma sequência separada.

## Compatibilidade e verificação

O protocolo passa a **dw-online-10** para exigir que os dois jogadores recebam os mesmos dados e a nova coreografia. Não há migração de banco, contas ou controles. Snapshots de versões anteriores são recusados com a solicitação de atualização existente.

- `npm run typecheck`: passou.
- `npm test`: passou, incluindo **69 novos casos** do Tubarão e todas as regressões de combate, 15 desafios, espectadores, trio, defesa/Cabeçada, combos, virada, animação, tempo, progressão, API, 13 Ultimates e finishers e 169 confrontos de choque de ULT.
- `npm run build`: passou; cliente e Worker gerados.
- `npm run combos:audit`: 52 rotas existentes continuam válidas contra defesa mantida.
- `npm run animation:audit`: 1.098 quadros distintos por lutador, 14.274 no elenco.
- Canvas real: keyframes contra os 13 adversários nas duas direções, reprodução dos 211 instantes da sequência e verificação com redução de flashes, sem erros de desenho.
- Navegador: teclado e toque executam o Beijo e a nova ULT, medindo 64 e 290 de dano, lançamento longo e recuperação final.
- Dois navegadores autenticados por relay HTTP: o convidado móvel acerta o Beijo de 64; host e convidado executam a nova ULT com transformação/lambidas, direção espelhada, 290 de dano, lançamento longo e estado final sincronizados. Nenhum erro JavaScript.

Toque foi emulado no navegador; não houve homologação em aparelhos físicos nem teste de equilíbrio com jogadores humanos. Estes resultados verificam funcionamento e regressões, sem provar equilíbrio competitivo por winrate de IA.

## Arquivos alterados

- `README.md`
- `dist/client/baixar/Dedilho-Wars-projeto.zip`
- `dist/client/index.html`
- `dist/server/index.js`
- `docs/tubarao.md`
- `scripts/test.mjs`
- `src/game/ai.ts`
- `src/game/audio.ts`
- `src/game/data.ts`
- `src/game/engine.ts`
- `src/game/frame-data.ts`
- `src/game/net-state.ts`
- `src/game/presentation.ts`
- `src/game/render.ts`
- `src/game/shark-art.ts`
- `src/game/shark-choreography.ts`
- `tests/api.test.mjs`
- `tests/rick.test.ts`
- `tests/shark.test.ts`
- `worker/index.js`
