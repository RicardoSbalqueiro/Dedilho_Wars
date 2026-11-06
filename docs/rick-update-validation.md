# Validação: Rickzera, defesa em E e Cabeçada

Esta entrega reúne o novo Rickzera (soco inglês dourado à esquerda com energia verde, Soco Inglês de perto com cratera no pouso, três notas no Franco Suíço) e a alteração seguinte (E defesa, L Cabeçada para todos os 13 lutadores).

## Resultados

- `npm run typecheck`: passou.
- `npm test`: passou: combate, 15 desafios, expansão, viewers, trio, 196 casos de responsividade, 262 de virada/defesa, 225 de choque de Ultimates, 322 de balanceamento, 734 de combos/Jane, 447 de animação, 151 de tempo, 40 do novo Rickzera, 180 de defesa/Cabeçada, progressão e API.
- `npm run build`: passou; cliente e Worker gerados.
- `npm run combos:audit`: 52 rotas verificadas contra defesa mantida; Franco confirmado de Rick atualizado para cinco acertos/107,3.
- `npm run animation:audit`: 1.098 quadros distintos por lutador, 14.274 no elenco.
- Chromium: teclado, toque na vertical e horizontal, configuração/conflitos, Q/E de categorias, visual espelhado do Rick, energia verde, três notas e cratera no pouso.
- Dois navegadores autenticados com relay HTTP: golpes do host e do convidado móvel, orientação espelhada, dano de 84, três notas, crateras e Cabeçada sincronizados; E bloqueia a Cabeçada remota sem chip. Nenhum erro JavaScript nas verificações concluídas.
- O toque foi emulado no navegador. Não foi realizado teste com jogadores humanos nem homologação em aparelhos físicos; os resultados automatizados não provam equilíbrio competitivo.

## Arquivos alterados

- `README.md`
- `dist/client/baixar/Dedilho-Wars-projeto.zip`
- `dist/client/index.html`
- `dist/server/index.js`
- `docs/combo-routes.json`
- `docs/combos.md`
- `docs/headbutt.md`
- `docs/rick-update-validation.md`
- `docs/rickzera.md`
- `scripts/test.mjs`
- `src/game/ai.ts`
- `src/game/animation.ts`
- `src/game/audio.ts`
- `src/game/combat-feel.ts`
- `src/game/data.ts`
- `src/game/engine.ts`
- `src/game/finishers-art.ts`
- `src/game/frame-data.ts`
- `src/game/input.ts`
- `src/game/net-state.ts`
- `src/game/render.ts`
- `src/game/rick-art.ts`
- `src/game/rig.ts`
- `src/index.css`
- `src/ui/GameScreen.tsx`
- `src/ui/MobileMenu.tsx`
- `src/ui/OnlineGame.tsx`
- `src/ui/Screens.tsx`
- `src/ui/TouchControls.tsx`
- `tests/api.test.mjs`
- `tests/balance.test.ts`
- `tests/challenges.test.ts`
- `tests/headbutt.test.ts`
- `tests/responsiveness.test.ts`
- `tests/rick.test.ts`
- `tests/turn-defense.test.ts`
- `worker/index.js`
