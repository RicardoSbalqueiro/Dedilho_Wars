# Combos, treinador e novos golpes da Jane

Há **52 rotas propostas: quatro por personagem**, incluindo um básico de dois golpes, um básico de três, uma ligação entre normais e especial e uma perseguição aérea. O motor anterior foi expandido; buffer, dano progressivo, recargas, defesa, ULTs e finishers continuam no mesmo sistema.

## Comandos e regras

- **J / K** continuam sendo soco / chute no P1. Os normais progridem de leve a médio e forte por acertos ou bloqueios, sem voltar a um rank inferior na mesma cadeia. **S + K** faz a rasteira baixa no neutro agachado, com os 13 personagens. No P2: baixo + Num2; no toque: baixo + CHUTE.
- O buffer existente de **9 frames** guarda o próximo comando. Um toque durante startup ou recuperação só executa se ainda estiver no buffer quando a ação ficar legal. Hitstop congela a idade desse buffer. Segurar ataque não cria repetição automática.
- Cancelamentos continuam exigindo contato e uma janela de **6 frames**. Normais podem passar para especiais apenas num acerto limpo; bloqueio ou erro não libera esse cancelamento. Moto, arrancada e o salto giratório da Jane mantêm compromisso próprio.
- Após um **lançador confirmado**, salto nessa janela permite uma perseguição curta, com velocidade limitada pelo salto do personagem. Não funciona no erro, no bloqueio, contra um rival no chão ou após atingir o teto de juggle. Alguns especiais lançadores permitem a mesma perseguição; não há liberação universal de todos os especiais.
- No ar, **soco aéreo → chute aéreo** tem uma única ligação confirmada, enquanto o rival está lançado e abaixo do limite de quatro contatos de juggle. Não há retorno chute → soco, cancelamento para especiais ou ULT no ar. Ataques aéreos e pousos mantêm suas restrições.
- Três encaixes específicos dão **8 frames de crédito de preparação**: Dedilho Supremo do Orango (24→16), Fórmula de Jao (18→10) e ECG de Enéas (20→12). Exigem o segundo normal médio confirmado, vítima ainda em hitstun e comando na janela. Uso isolado, bloqueios e erros conservam a preparação original; dano, recovery, whiff e recarga não são reduzidos. Agarrões, habilidades defensivas e ULTs não recebem esse crédito.
- Dano progressivo mantido: **100%, 90%, 80%, 70%, 60%, 50%, 40%, 30%, piso 20%**. Cinematográficas herdam uma escala fixa da entrada. Há progressão finita dos normais, apenas uma ligação aérea, quatro contatos de juggle e as recargas de distância. Nenhuma rota remove o compromisso da ULT ou concede invulnerabilidade.
- O defensor pode manter a guarda durante o stun e defender no primeiro frame livre. O treinador diferencia o fim da contagem de combo do fim de uma queda/levantamento: só indica **LIVRE PARA AGIR** quando o personagem realmente recupera uma ação no chão.

## Treinador

Entre em **TREINAMENTO → COMBOS**. Escolha uma rota do P1. O treino reinicia perto do rival; ele passa a segurar defesa após o primeiro acerto. O treinador mostra o próximo comando, progresso, acertos reais, dano acumulado e resultado. Um comando vazio, golpe errado, bloqueio ou recuperação entre os golpes não recebe aprovação. Rajadas não contam o mesmo ataque várias vezes como etapas diferentes. O resultado permanece salvo na tentativa até escolher **REPETIR ROTA**, pressionar R ou reiniciar posições.

A opção **Exibir inputs, dano, acertos e recuperação na luta** mantém o monitor durante a prática. O histórico registra comandos novos, direções e ticks; não consome o buffer. O monitor mostra a recuperação atual e o tick exato de retorno ao controle. No FRAME DATA continuam disponíveis comparação entre lutadores, hitboxes e avanço de um frame. Os comandos exibidos respeitam o teclado configurado e mudam para os botões de toque no celular. Treinador e avanço manual de frames são exclusivos do treino offline.

Rotas são verificadas a curta distância contra Cristyan como alvo de referência. Corpos menores e posições diferentes podem exigir ajuste de tempo ou distância; o treinador confere o contato real em vez de declarar sucesso por decorar a sequência.

## Rotas e danos observados

Teclas padrão do P1: J soco, K chute, U/I/O especiais, W salto, S agachar. Nas rotas abaixo, ↑ equivale a W e ↓ a S. Resultados a 60 Hz, alvo Cristyan, distância inicial igual à soma das pushboxes + 5; defesa mantida depois do primeiro acerto. Não são máximos absolutos de dano nem avaliação de balanceamento por jogadores humanos.

<!-- ROUTES_START -->
| Lutador | Nível / rota | Comandos padrão | Acertos | Dano |
| --- | --- | --- | ---: | ---: |
| KARATÊ CAETANO | Básico · Um, dois! | J → K | 2 | 62,5 |
| KARATÊ CAETANO | Básico · Três tempos | J → K → J | 3 | 114,5 |
| KARATÊ CAETANO | Intermediário · Dedilho técnico | J → K → I | 3 | 106,5 |
| KARATÊ CAETANO | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 139 |
| ORANGO TANGO BITENCOURT | Básico · Um, dois! | J → K | 2 | 85,62 |
| ORANGO TANGO BITENCOURT | Básico · Três tempos | J → K → J | 3 | 161,94 |
| ORANGO TANGO BITENCOURT | Intermediário · Dedilho Supremo | J → K → U | 3 | 204,34 |
| ORANGO TANGO BITENCOURT | Aéreo · Rasteira e perseguição | ↓+K → ↑ → K | 2 | 129,89 |
| TUBARÃO FISCAL | Básico · Um, dois! | J → K | 2 | 82,1 |
| TUBARÃO FISCAL | Básico · Três tempos | J → K → J | 3 | 150,1 |
| TUBARÃO FISCAL | Intermediário · Mordida do Fiscal | J → K → U | 3 | 162,1 |
| TUBARÃO FISCAL | Aéreo · Rasteira e perseguição | ↓+K → ↑ → K | 2 | 129,8 |
| RICKZERA | Básico · Um, dois! | J → K | 2 | 56,9 |
| RICKZERA | Básico · Três tempos | J → K → J | 3 | 104,1 |
| RICKZERA | Intermediário · Franco confirmado | J → K → U | 5 | 107,3 |
| RICKZERA | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 125,5 |
| BIEUBATMAN | Básico · Um, dois! | J → K | 2 | 65,3 |
| BIEUBATMAN | Básico · Três tempos | J → K → J | 3 | 119,7 |
| BIEUBATMAN | Intermediário · Chave confirmada | J → K → U | 3 | 129,3 |
| BIEUBATMAN | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 147,1 |
| NOMAD LOBBY | Básico · Um, dois! | J → K | 2 | 62,5 |
| NOMAD LOBBY | Básico · Três tempos | J → K → J | 3 | 114,5 |
| NOMAD LOBBY | Intermediário · Lanche na sequência | J → K → U | 3 | 104,1 |
| NOMAD LOBBY | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 139 |
| RENNGOTTI | Básico · Um, dois! | J → K | 2 | 62,5 |
| RENNGOTTI | Básico · Três tempos | J → K → J | 3 | 114,5 |
| RENNGOTTI | Intermediário · Microfone no combo | J → K → I | 3 | 110,5 |
| RENNGOTTI | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 139 |
| ANENINHA | Básico · Um, dois! | J → K | 2 | 61,6 |
| ANENINHA | Básico · Três tempos | J → K → J | 3 | 112,8 |
| ANENINHA | Intermediário · Osasco confirmado | J → K → U | 3 | 137,6 |
| ANENINHA | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 136,3 |
| 1SANT0X | Básico · Um, dois! | J → K | 2 | 56,9 |
| 1SANT0X | Básico · Três tempos | J → K → J | 3 | 104,1 |
| 1SANT0X | Intermediário · Chute do Coelho | J → K → I | 3 | 111,3 |
| 1SANT0X | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 125,5 |
| JaoDoPikles | Básico · Um, dois! | J → K | 2 | 59,7 |
| JaoDoPikles | Básico · Três tempos | J → K → J | 3 | 109,3 |
| JaoDoPikles | Intermediário · Equação confirmada | J → K → I | 3 | 94,9 |
| JaoDoPikles | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 132,8 |
| JANE | Básico · Um, dois! | J → K | 2 | 48,5 |
| JANE | Básico · Três tempos | J → K → J | 3 | 89,3 |
| JANE | Intermediário · Grau na sequência | J → K → I | 4 | 69,9 |
| JANE | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 108,5 |
| CRISTYAN | Básico · Um, dois! | J → K | 2 | 62,5 |
| CRISTYAN | Básico · Três tempos | J → K → J | 3 | 113,7 |
| CRISTYAN | Intermediário · Teep baiano | J → K → U | 3 | 112,1 |
| CRISTYAN | Aéreo · Rasteira e perseguição | ↓+K → ↑ → J → K | 3 | 138,2 |
| DOUTOR ENÉAS | Básico · Um, dois! | J → K | 2 | 61,6 |
| DOUTOR ENÉAS | Básico · Três tempos | J → K → J | 3 | 112,8 |
| DOUTOR ENÉAS | Intermediário · Diagnóstico confirmado | J → K → I | 3 | 98,4 |
| DOUTOR ENÉAS | Aéreo · Rasteira e perseguição | ↓+K → ↑ → K | 2 | 97,6 |
<!-- ROUTES_END -->

`npm run combos:audit` reproduz as 52 rotas, verifica conexão contra a guarda mantida e regenera esta tabela e [combo-routes.json](combo-routes.json), incluindo o tick de recuperação. As rotas de Orango, Tubarão e Enéas usam finalização aérea curta; os demais têm a continuação soco → chute. A moto da Jane pode adicionar a arrancada à sequência se ela ainda encontrar o rival em stun; ambos os movimentos compartilham o teto de seis contatos.

## Jane

**Por baixo, salto e giro:** conserva a passagem sob o rival e a virada no frame 18. Nesse momento Jane salta; o chute giratório alto só fica ativo no frame **30**, durante seis frames, enquanto ela está no ar. Assim há uma antecipação visível antes do contato. Defesa em pé funciona, baixos ainda interrompem a passagem, e não há invulnerabilidade. Mantém dano 58, recuperação 25 e mais 10 no erro. A rotação é visual e a hitbox continua usando a orientação capturada da virada.

**Moto sem controle:** soltar a moto entre 12 e 300 ticks inicia uma arrancada comprometida na direção em que Jane está apontada. Velocidade de avanço 15, preparação 3, 16 ativos, dano 18 e recuperação 24 (+8 no erro). A arrancada tem apenas um possível contato e compartilha o limite de seis contatos com o giro. Não permite mudar a direção, defender ou cancelar imediatamente em outro ataque. Pode ser bloqueada, interrompida e agarrada; sem armadura ou invulnerabilidade. Soltar cedo demais espera o mínimo de 12 ticks antes da arrancada.

Ultrapassar 300 ticks derruba a moto e deixa Jane tonta por **60 ticks**, mesmo que solte no tick 301. Soltar, cair ou ser interrompida mantém a recarga de **180 ticks**. A animação de arrancada inclui oscilação da moto, poeira e faíscas. Snapshots online transmitem o movimento, direção, velocidade, contadores e recuperação; protocolo **dw-online-8**.

## Feedback e verificação

Combos básicos usam ciano; sequências com especiais ou ataques aéreos usam lilás; punições de recuperação ou tontura usam laranja. O HUD identifica COMBO, AVANÇADO e PUNIÇÃO. Isso é apresentação, sem bônus oculto de dano.

A suíte `tests/combos.test.ts` verifica as 52 rotas com teclado, toque e inputs online, os dois sentidos, P2 local/online, avaliação real do treinador, rasteira dos 13 lutadores, links limitados, estados defensivos, juggle, snapshots, histórico e os novos golpes da Jane. As suítes anteriores de combate, defesa, batalha de ULT, finishers, desafios, progressão e API continuam em `npm test`.
