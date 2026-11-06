# Verificação: combos, rasteira e Jane

Base: `cf369769bd28ab49ac6eb8eb34f5b608740eb1fa`.

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Passou, exit 0. |
| `npm test` | Passou, exit 0; 734 casos novos de combos/Jane e todas as suítes anteriores. |
| `npm run build` | Passou, exit 0; cliente e Worker. |
| `npm run combos:audit` | 52 rotas verificadas contra defesa mantida após o primeiro acerto; comandos/danos/tick de recuperação exportados. |
| `git diff --check` | Passou. |

Os 734 casos cobrem quatro rotas por lutador, teclado/toque/inputs online, P2 local e online, posições espelhadas, conexão real de golpes e recuperação da defesa, rasteira dos 13 personagens, repetição de chute agachado sem promoção involuntária para forte em pé, treinador sem sucesso por botões vazios, erros/bloqueios, juggles finitos, cancelamentos restritos, cooldown, snapshots, histórico e feedback de punição sem bônus de dano. Jane tem testes de salto antes do giro, defesa após a antecipação, arrancada direcional, orçamento compartilhado de seis contatos e queda/tontura no tick 301.

Suítes anteriores: 196 casos de responsividade, 262 de virada/defesa, 225 de batalha de ULT (incluindo os 169 confrontos), 322 de balanceamento, 15 desafios, finishers, golpes e ULTs dos 13 lutadores, contas, histórico, progressão e API. Buffer, limites de recarga e risco das ULTs foram preservados.

## QA de interface e integração

Chromium no preview local: desktop 1280 × 800 e toque emulado 390 × 844. Conferidos crédito verde/estilizado, catálogo e quatro rotas do personagem, prática real de básicos/especial/aéreo, entradas de dois dedos para rasteira, comandos e números do treinador, histórico e indicador do primeiro frame livre. Conferidos salto visível antes do chute da Jane, bloqueio em pé após o salto e soltura da moto em uma arrancada sem tontura. Sem erros JavaScript nos percursos concluídos.

Relay HTTP com duas sessões reais: protocolo `dw-online-8`, host pelo teclado e convidado por toque; combo de Caetano com 106,5 de dano, classificação avançada e resumo/recuperação iguais nos dois clientes. Comandos antecipados foram registrados pelo buffer e só cancelaram após confirmar contato. Jane do convidado segurou e soltou a moto; os dois clientes receberam a mesma arrancada, direção e cooldown. O treinador não aparece no online.

Esses testes de interface usaram preview local e toque emulado, não aparelho físico ou navegador na origem de produção. As rotas são amostras verificadas, não uma prova de máximo absoluto de dano nem um playtest de equilíbrio com humanos. A publicação é confirmada separadamente pelo resultado nativo do Sites.

## Arquivos alterados

- `README.md`
- `dist/client/baixar/Dedilho-Wars-projeto.zip`
- `dist/client/baixar/index.html`
- `dist/client/index.html`
- `dist/server/index.js`
- `docs/combo-routes.json`
- `docs/combos-validation.md`
- `docs/combos.md`
- `package.json`
- `scripts/combos-report.mjs`
- `scripts/combos-report.ts`
- `scripts/package.py`
- `scripts/test.mjs`
- `src/game/balance.ts`
- `src/game/combos.ts`
- `src/game/data.ts`
- `src/game/engine.ts`
- `src/game/frame-data.ts`
- `src/game/input.ts`
- `src/game/net-state.ts`
- `src/game/render.ts`
- `src/index.css`
- `src/ui/ComboTrainer.tsx`
- `src/ui/FrameDataLab.tsx`
- `src/ui/MobileMenu.tsx`
- `tests/api.test.mjs`
- `tests/combos.test.ts`
- `tests/trio.test.ts`
- `worker/index.js`
