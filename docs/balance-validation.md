# Verificação da auditoria de balanceamento

## Resultados automatizados

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Passou (exit 0). O build final também executou o typecheck. |
| `npm test` | Passou (exit 0), incluindo 322 casos novos de balanceamento. |
| `npm run build` | Passou (exit 0), cliente e Worker. |
| `npm run balance:audit` | Passou: 19.110 simulações da versão atual e exportação das fichas resolvidas. |
| `git diff --check` | Passou. |

As suítes anteriores passaram: 196 casos de responsividade, 261 de virada/defesa, 225 de batalha de ULT (incluindo os 169 confrontos), 15 desafios, Ultimates e finishers dos 13 lutadores, moto de Jane, progressão, contas e API. Java e 56 tiveram suas expectativas de combo atualizadas para 34,2 e 58,6; seus danos base não mudaram.

## QA da interface e integração

Chromium local: desktop 1280 × 800 e toque emulado 390 × 844. Conferidos “By Rickzera”, seleção dos 13 lutadores no laboratório, valores de Engole/microfones, diferenças Jane/Cristyan, vantagem condicional, golpe real preparado, avanço de um tick e congelamento do frame durante hitstop, isolamento dos atalhos, monitor e retorno aos controles.

Duas sessões online pelo relay HTTP: criação de contas e sala, protocolo `dw-online-7`, escolha/pronto/início e comando real de teclado para normal médio → ULT de Caetano. Convidado recebeu escala 0,9 e dano final exato 328, iguais ao host. O laboratório não aparece no online. Sem erros JavaScript nos percursos concluídos.

Essas verificações usaram preview local, não navegação na origem de produção. Toque foi emulado; não é ensaio em aparelho físico. Não houve playtest de balanceamento competitivo com jogadores humanos. A busca de rotas é limitada e não prova um máximo absoluto. A publicação é verificada separadamente pelo resultado nativo do Sites.

## Arquivos alterados

A lista inclui documentação, fontes, testes e artefatos gerados. Os arquivos em `dist/` vêm do build e do empacotamento.

- `README.md`
- `dist/client/baixar/Dedilho-Wars-projeto.zip`
- `dist/client/baixar/index.html`
- `dist/client/index.html`
- `dist/server/index.js`
- `docs/audit-baseline.md`
- `docs/audit-rules-baseline.md`
- `docs/balance-after.json`
- `docs/balance-before.json`
- `docs/balance-changes.md`
- `docs/balance-measurements-after.json`
- `docs/balance-measurements-before.json`
- `docs/balance-validation.md`
- `package.json`
- `scripts/balance-report.mjs`
- `scripts/balance-report.ts`
- `scripts/package.py`
- `scripts/test.mjs`
- `src/game/ai.ts`
- `src/game/balance.ts`
- `src/game/data.ts`
- `src/game/engine.ts`
- `src/game/frame-data.ts`
- `src/game/net-state.ts`
- `src/index.css`
- `src/ui/FrameDataLab.tsx`
- `src/ui/GameScreen.tsx`
- `src/ui/MobileMenu.tsx`
- `src/ui/Screens.tsx`
- `tests/api.test.mjs`
- `tests/balance.test.ts`
- `tests/trio.test.ts`
- `worker/index.js`
