# Auditoria anterior ao ajuste — Dedilho Wars

Base imutável: `8 c424527 e5237 ad5738 f6 b185 c907 be5 a08 bdb14`. Valores resolvidos de `CHARS` após cópias e redução de 1 f nos normais leves, não apenas literais de `data.ts`. Diagnóstico preparado antes das mudanças de combate.

60 frames/s. S/A/R/W = startup/ativos/recuperação/recuperação extra ao errar. Alcance = intervalo horizontal da hitbox em coordenadas do mundo; não inclui movimento nem largura do defensor. H/B = hitstun/blockstun base. Vantagens teóricas no primeiro frame ativo: H ou B − (A − 1 + R), sem cancelamento, hitstop simétrico e considerando apenas golpes de chão sem lançamento. Não são garantia de punição: distância, pushback, ordem de atualização e contato tardio alteram o resultado. Projéteis, agarrões, lançamentos e aéreos ficam com “variável”. Ao errar, não existe vantagem contra um adversário sem ação definida; a janela comprometida final é R+W.

## Diagnóstico de regras

- Escala atual por contato: 100%,100%,90%,80%,70%,60%,50%,45% (piso). `startSeq` apaga o dano/contagem anterior; `seqHit` dá dano bruto. O cancelamento para ULT contorna a escala e o HUD perde parte do combo.
- ULT custa100 de barra (ganhos×0,5), cinematográfica congela simulação, seguida de rush indefensável com startup0,24 ou34 ativos,34 recovery. Armadura fica ligada até terminar a recuperação. De perto, o alvo livre não tem tempo normal para saltar depois do freeze. Corrigir janela de reação e punição do erro; preservar arte e dano solo.
- Cancelamentos exigem contato e janela6 f; normais sobem estritamente de rank, especiais exigem hit; Dedilho→Chute é exceção finita. Aéreos e moto não cancelam. Juggle convencional limita4 impactos. Não remover essas barreiras.
- Defesa alta/média ou baixa/média; janela perfeita3 f, Precisão Caetano5 f, sem chip normal, chip especial individual≤8% e não letal. Guard não exige enfrentar o alvo. Agarrões não capturam em hit/blockstun, ar, down/getup nem durante startup/active adversário salvo armadura/moto. Agarrão universal tem tech; command grabs não.
- Projéteis/zonas usam limite compartilhado de3 usos→300 ticks. Rajada conta1 uso. Cooldowns seguem ticks da simulação, inclusive cinematográficas/hitstop; pausa congela. Nenhum projétil persegue o adversário: somente boomerang retorna ao dono.
- Colisão: retângulos espelhados por facing; hurtW=pushW+4. Air hurtH×0,9, launched×0,6. Captura de hitbox antes de aplicar dano permite trades. Rotação visual não muda a hitbox. Especiais são comandos únicos; combos normais e ULT exigem mais confirmação.
- IA: perfis reação22/11/4 f e chances de defesa30/60/85%, planos limitados2/3/4 passos. Usa os mesmos inputs/estados/cooldowns, mas conhece frame data e estado do rival. Detecção atual de projétil parado reconhece spray, não muro/armadilha ancorada; vale corrigir percepção. Vitória de IA não mede equilíbrio humano.

## Diagnóstico por personagem e golpe

### KARATÊ CAETANO

Técnico: jab de 3 f/22, caminhada 4,4; dano pesado exige compromisso. Precisão: defesa de 5 f dá Dedilho 73/20 de hitstun, seguido de cancelamento exclusivo para Chute. Dedilho normal55 tem avanço rápido, mas erro acrescenta6 f e defesa apenas permite seguir normais. Soco Pego140 prepara30 f e erra com60 f de recuperação total. Preservar seus números; corrigir escala global de combo/ULT.

HP **1000** · andar frente/trás **4.4/3.6** · salto Vy/Vx **16.5/5.4** · dash **11.5 × 15 f** (há desaceleração) · pushW **26** · altura vulnerável **172/110**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 22 | 3/3/8 + 0 | 13/8 | 20…95 | +3/-2 | médio; ambas guardas |
| pM · pM | 40 | 6/4/13 + 0 | 17/11 | 20…115 | +1/-5 | médio; ambas guardas |
| pH · pH | 65 | 9/4/19 + 0 | 22/14 | 20…130 | variável | lança; duração real depende do juggle |
| kL · kL | 24 | 4/3/10 + 0 | 13/8 | 15…100 | +1/-4 | médio; ambas guardas |
| kM · kM | 45 | 7/4/14 + 0 | 18/12 | 20…118 | +1/-5 | médio; ambas guardas |
| kH · kH | 70 | 10/5/21 + 0 | 23/15 | 20…125 | variável | lança; duração real depende do juggle |
| cP · cP | 25 | 4/3/9 + 0 | 13/8 | 20…100 | +2/-3 | médio; ambas guardas |
| cK · cK | 50 | 8/4/22 + 0 | 22/12 | 10…135 | variável | lança; duração real depende do juggle |
| jP · jP | 50 | 5/10/0 + 0 | 18/12 | 10…95 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 55 | 6/10/0 + 0 | 19/12 | 5…100 | variável | aéreo: altura/pouso definem resultado |
| s1 · CHUTE DA CONSPIRAÇÃO | 90 | 12/8/22 + 8 | 26/16 | 10…155 | variável | lança; duração real depende do juggle; avanço[10, 20, 4] |
| s2 · DEDILHO PERFURANTE | 55 | 8/5/16 + 6 | 14/10 | 30…140 | -6/-10 | médio; ambas guardas; avanço[6, 15, 13] |
| s3 · SOCO PEGO! | 140 | 30/6/26 + 34 | 30/20 | 20…130 | variável | lança; duração real depende do juggle; avanço[28, 36, 5] |

**ULT CONSPIRAÇÃO ABSOLUTA: 320 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **453**, `cP → k → k → super` contrajane, distância51. Não é máximo absoluto.

### ORANGO TANGO BITENCOURT

Agressivo e pesado. Normais mais lentos e longos, HP1150. Momentum até3: +9% no dano direto e +0,75 caminhada frontal; acaba ao sofrer dano ou após180 ticks. Dedilho140 prepara24 f, alcance280+avanço e gasta limite de distância. Puxão160/8 f/125 sem tech supera demasiadamente o agarrão universal70/9 f/84; Mordida125 começa10 f e avança176 antes da inércia, ativa16 f, sem defesa/tech. Prioridade: preparação e alcance desses agarrões, preservando o papel de grappler.

HP **1150** · andar frente/trás **3/2.4** · salto Vy/Vx **15/3.6** · dash **7.5 × 16 f** (há desaceleração) · pushW **44** · altura vulnerável **150/95**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 30 | 5/3/11 + 0 | 14/9 | 25…140 | +1/-4 | médio; ambas guardas |
| pM · pM | 55 | 9/4/17 + 0 | 18/12 | 25…150 | -2/-8 | médio; ambas guardas |
| pH · pH | 90 | 14/5/25 + 0 | 24/16 | 20…160 | variável | lança; duração real depende do juggle |
| kL · kL | 32 | 6/3/12 + 0 | 14/9 | 20…108 | +0/-5 | médio; ambas guardas |
| kM · kM | 60 | 10/4/18 + 0 | 19/12 | 20…120 | -2/-9 | médio; ambas guardas |
| kH · kH | 95 | 14/5/27 + 0 | 25/16 | 20…150 | variável | lança; duração real depende do juggle |
| cP · cP | 34 | 6/3/12 + 0 | 14/9 | 25…135 | +0/-5 | médio; ambas guardas |
| cK · cK | 65 | 11/4/26 + 0 | 22/13 | 10…130 | variável | lança; duração real depende do juggle |
| jP · jP | 65 | 7/10/0 + 0 | 19/13 | 10…120 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 70 | 8/10/0 + 0 | 20/13 | 5…105 | variável | aéreo: altura/pouso definem resultado |
| s1 · DEDILHO SUPREMO | 140 | 24/7/28 + 10 | 28/18 | 60…280 | variável | lança; duração real depende do juggle; avanço[20, 27, 5] |
| s2 · PUXÃO DE CAMISA | 160 | 8/3/20 + 18 | 0/0 | 0…125 | variável | captura sem defesa; saltar/afastar/interromper |
| s3 · MORDIDA NA PERNA | 125 | 10/16/24 + 24 | 0/0 | 0…100 | variável | captura sem defesa; saltar/afastar/interromper; avanço[10, 26, 11] |

**ULT INSTINTO PRIMORDIAL: 341 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **527.43**, `cP → k → k → super` contrajane, distância69. Não é máximo absoluto.

### TUBARÃO FISCAL

Pressão pesada com HP1230. Engole145/11 f/118, sem avanço, sem tech e ignora defesa: captura mais longe que o agarrão universal com mais que o dobro do dano. Erro já custa48 f de recovery+whiff; reforçar antecipação/curto alcance e moderar dano. Mordida100/13 f é bloqueável. Cabeçada95/12 f tem armadura do frame4 ao21, não recuperação; toma75% do dano e pode sofrer agarrão. Não confundir armadura com invulnerabilidade.

HP **1230** · andar frente/trás **3.25/2.6** · salto Vy/Vx **15.5/4** · dash **8.5 × 17 f** (há desaceleração) · pushW **39** · altura vulnerável **196/122**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 29 | 5/3/11 + 0 | 13/8 | 20…119 | +0/-5 | médio; ambas guardas |
| pM · pM | 52 | 8/4/16 + 0 | 17/11 | 20…139 | -2/-8 | médio; ambas guardas |
| pH · pH | 85 | 11/4/22 + 0 | 22/14 | 20…154 | variável | lança; duração real depende do juggle |
| kL · kL | 31 | 6/3/13 + 0 | 13/8 | 15…124 | -2/-7 | médio; ambas guardas |
| kM · kM | 59 | 9/4/17 + 0 | 18/12 | 20…142 | -2/-8 | médio; ambas guardas |
| kH · kH | 91 | 12/5/24 + 0 | 23/15 | 20…149 | variável | lança; duração real depende do juggle |
| cP · cP | 33 | 6/3/12 + 0 | 13/8 | 20…124 | -1/-6 | médio; ambas guardas |
| cK · cK | 65 | 10/4/25 + 0 | 22/12 | 10…159 | variável | lança; duração real depende do juggle |
| jP · jP | 65 | 7/10/3 + 0 | 18/12 | 10…119 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 72 | 8/10/3 + 0 | 19/12 | 5…124 | variável | aéreo: altura/pouso definem resultado |
| s1 · MORDIDA | 100 | 13/8/25 + 12 | 27/16 | 18…160 | -5/-16 | médio; ambas guardas; avanço[8, 22, 6] |
| s2 · ENGOLE | 145 | 11/4/28 + 20 | 0/0 | 0…118 | variável | captura sem defesa; saltar/afastar/interromper |
| s3 · CABEÇADA DE BARBATANA | 95 | 12/10/28 + 16 | 28/17 | 10…170 | variável | lança; duração real depende do juggle; avanço[9, 23, 8] |

**ULT BEIJO DO FISCALIZADOR: 290 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **463.9**, `cP → k → k → super` contrajane, distância64. Não é máximo absoluto.

### RICKZERA

Mobilidade e projéteis: pulo duplo, 3 f de Double Jump34, mas um uso extra no ar e sem loop infinito. Franco52 é linear; Pix tem três projéteis24 em offsets0/8/16, cada um com stun17. Trajetória finita, defesa e recarga global limitam pressão. Não reduzir mobilidade sem evidência; escala progressiva reduz rajadas confirmadas.

HP **940** · andar frente/trás **4.8/3.9** · salto Vy/Vx **16/5.6** · dash **12 × 14 f** (há desaceleração) · pushW **26** · altura vulnerável **172/108**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 20 | 3/3/7 + 0 | 13/8 | 20…95 | +4/-1 | médio; ambas guardas |
| pM · pM | 36 | 5/4/12 + 0 | 17/11 | 20…115 | +2/-4 | médio; ambas guardas |
| pH · pH | 59 | 8/4/18 + 0 | 22/14 | 20…130 | variável | lança; duração real depende do juggle |
| kL · kL | 22 | 3/3/9 + 0 | 13/8 | 15…100 | +2/-3 | médio; ambas guardas |
| kM · kM | 41 | 6/4/13 + 0 | 18/12 | 20…118 | +2/-4 | médio; ambas guardas |
| kH · kH | 63 | 9/5/20 + 0 | 23/15 | 20…125 | variável | lança; duração real depende do juggle |
| cP · cP | 23 | 3/3/8 + 0 | 13/8 | 20…100 | +3/-2 | médio; ambas guardas |
| cK · cK | 45 | 7/4/21 + 0 | 22/12 | 10…135 | variável | lança; duração real depende do juggle |
| jP · jP | 45 | 4/10/0 + 0 | 18/12 | 10…95 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 50 | 5/10/0 + 0 | 19/12 | 5…100 | variável | aéreo: altura/pouso definem resultado |
| s1 · ARREMESSO DO FRANCO SUÍÇO | 52 | 12/3/19 + 5 | 20/12 | 20…105 | variável | projétil/zona: ver diagnóstico |
| s2 · LINHAS DO PIX | 24 | 18/7/23 + 9 | 17/10 | 20…125 | variável | projétil/zona: ver diagnóstico |
| s3 · DOUBLE JUMP | 34 | 3/12/12 + 5 | 18/12 | 5…110 | variável | lança; duração real depende do juggle |

**ULT WISE 6 X: 280 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **400.7**, `cP → k → k → super` contrajane, distância51. Não é máximo absoluto.

### BIEUBATMAN

Chave80 já sofreu redução;13 f,26+11 f ao errar e alcance150+avanço. Rato42 é baixo: defesa baixa ou salto. Spray16 tem quatro contatos, intervalo14 ticks, vida64; blockstun9 deixa espaços. Manter dano e atributos; testar pressão de spray, bloqueio e escala em múltiplos contatos.

HP **1080** · andar frente/trás **3.9/3.1** · salto Vy/Vx **16/4.8** · dash **10 × 16 f** (há desaceleração) · pushW **30** · altura vulnerável **178/110**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 23 | 4/3/8 + 0 | 13/8 | 20…103 | +3/-2 | médio; ambas guardas |
| pM · pM | 42 | 7/4/13 + 0 | 17/11 | 20…123 | +1/-5 | médio; ambas guardas |
| pH · pH | 68 | 10/4/19 + 0 | 22/14 | 20…138 | variável | lança; duração real depende do juggle |
| kL · kL | 25 | 5/3/10 + 0 | 13/8 | 15…108 | +1/-4 | médio; ambas guardas |
| kM · kM | 47 | 8/4/14 + 0 | 18/12 | 20…126 | +1/-5 | médio; ambas guardas |
| kH · kH | 74 | 11/5/21 + 0 | 23/15 | 20…133 | variável | lança; duração real depende do juggle |
| cP · cP | 26 | 5/3/9 + 0 | 13/8 | 20…108 | +2/-3 | médio; ambas guardas |
| cK · cK | 53 | 9/4/22 + 0 | 22/12 | 10…143 | variável | lança; duração real depende do juggle |
| jP · jP | 53 | 6/10/0 + 0 | 18/12 | 10…103 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 58 | 7/10/0 + 0 | 19/12 | 5…108 | variável | aéreo: altura/pouso definem resultado |
| s1 · CHAVE DE FENDA | 80 | 13/6/26 + 11 | 25/15 | 20…150 | -6/-16 | médio; ambas guardas; avanço[7, 15, 3.5] |
| s2 · JOGAR RATO | 42 | 16/3/25 + 6 | 21/13 | 20…100 | variável | projétil/zona: ver diagnóstico |
| s3 · PICHAÇÃO | 16 | 19/7/25 + 8 | 15/9 | 20…155 | variável | projétil/zona: ver diagnóstico |

**ULT PRESTÍGIO: 275 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **414.6**, `cP → k → k → super` contrajane, distância55. Não é máximo absoluto.

### NOMAD LOBBY

HP1100, caminhada3,6. Burger52 tem15 f e26+8 f de recovery; Glock20 ×3 atira alto (agachar evita); Boomerang38 pode acertar uma vez na ida e na volta, retorna ao dono e não persegue o alvo. Usa o limite de três lançamentos compartilhados. Manter os nerfs anteriores, testar no máximo dois contatos do boomerang e fim da rajada.

HP **1100** · andar frente/trás **3.6/2.9** · salto Vy/Vx **15.8/4.5** · dash **9.4 × 16 f** (há desaceleração) · pushW **33** · altura vulnerável **171/104**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 22 | 4/3/8 + 0 | 13/8 | 20…100 | +3/-2 | médio; ambas guardas |
| pM · pM | 40 | 7/4/13 + 0 | 17/11 | 20…120 | +1/-5 | médio; ambas guardas |
| pH · pH | 65 | 10/4/19 + 0 | 22/14 | 20…135 | variável | lança; duração real depende do juggle |
| kL · kL | 24 | 5/3/10 + 0 | 13/8 | 15…105 | +1/-4 | médio; ambas guardas |
| kM · kM | 45 | 8/4/14 + 0 | 18/12 | 20…123 | +1/-5 | médio; ambas guardas |
| kH · kH | 70 | 11/5/21 + 0 | 23/15 | 20…130 | variável | lança; duração real depende do juggle |
| cP · cP | 25 | 5/3/9 + 0 | 13/8 | 20…105 | +2/-3 | médio; ambas guardas |
| cK · cK | 50 | 9/4/22 + 0 | 22/12 | 10…140 | variável | lança; duração real depende do juggle |
| jP · jP | 50 | 6/10/0 + 0 | 18/12 | 10…100 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 55 | 7/10/0 + 0 | 19/12 | 5…105 | variável | aéreo: altura/pouso definem resultado |
| s1 · MARIO BURGER | 52 | 15/3/26 + 8 | 23/14 | 20…120 | variável | projétil/zona: ver diagnóstico |
| s2 · RAJADA DE GLOCK | 20 | 15/5/29 + 7 | 16/9 | 20…120 | variável | projétil/zona: ver diagnóstico |
| s3 · BOOMERANG | 38 | 17/4/29 + 9 | 22/12 | 20…120 | variável | projétil/zona: ver diagnóstico |

**ULT ARENA: 285 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **418**, `cP → k → k → super` contrajane, distância58. Não é máximo absoluto.

### RENNGOTTI

Alcance: Microfone60/14 f vira armadilha baixa28 com raio48 e vida80 após50 ticks de voo; Grito65/17 f/300 amplia cada microfone ancorado para raio90, dano35 e vida máxima24. Não existe teto por dono além da recarga global: acúmulo próximo da renovação merece limite explícito. Lua90/10 f/120 sem tech lança a -200 e permite juggle: alcance e startup estão próximos dos agarrões de alto dano; reduzir alcance e aumentar preparação preservando o lançamento.

HP **1020** · andar frente/trás **4.1/3.3** · salto Vy/Vx **16.2/5** · dash **10.5 × 15 f** (há desaceleração) · pushW **29** · altura vulnerável **180/110**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 22 | 3/3/8 + 0 | 13/8 | 20…102 | +3/-2 | médio; ambas guardas |
| pM · pM | 40 | 6/4/13 + 0 | 17/11 | 20…122 | +1/-5 | médio; ambas guardas |
| pH · pH | 65 | 9/4/19 + 0 | 22/14 | 20…137 | variável | lança; duração real depende do juggle |
| kL · kL | 24 | 4/3/10 + 0 | 13/8 | 15…107 | +1/-4 | médio; ambas guardas |
| kM · kM | 45 | 7/4/14 + 0 | 18/12 | 20…125 | +1/-5 | médio; ambas guardas |
| kH · kH | 70 | 10/5/21 + 0 | 23/15 | 20…132 | variável | lança; duração real depende do juggle |
| cP · cP | 25 | 4/3/9 + 0 | 13/8 | 20…107 | +2/-3 | médio; ambas guardas |
| cK · cK | 50 | 8/4/22 + 0 | 22/12 | 10…142 | variável | lança; duração real depende do juggle |
| jP · jP | 50 | 5/10/0 + 0 | 18/12 | 10…102 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 55 | 6/10/0 + 0 | 19/12 | 5…107 | variável | aéreo: altura/pouso definem resultado |
| s1 · JOGA PRA LUA | 90 | 10/4/26 + 18 | 0/0 | 0…120 | variável | captura sem defesa; saltar/afastar/interromper |
| s2 · JOGAR MICROFONE | 60 | 14/3/23 + 8 | 23/14 | 20…110 | variável | projétil/zona: ver diagnóstico |
| s3 · GRITO ALTO | 65 | 17/12/30 + 13 | 28/17 | 10…300 | -13/-24 | médio; ambas guardas |

**ULT TILT: 315 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **448**, `cP → k → k → super` contrajane, distância54. Não é máximo absoluto.

### ANENINHA

Mistura alturas/lados. Soco95 vira rasteira78 ao segurar baixo, com hitbox0–70 e launch4; preserva14 f. Muro20 tem três contatos a cada20 ticks,96 de vida; frente+especial posiciona80 atrás do rival somente a distância<220. Guarda não é direcional nesta versão: o muro reverso não cria desbloqueável. Grito65/275 é bloqueável e sujeito à recarga. Manter identidade; testar gaps e dano escalado.

HP **1000** · andar frente/trás **4.3/3.5** · salto Vy/Vx **16.3/5.1** · dash **10.8 × 15 f** (há desaceleração) · pushW **27** · altura vulnerável **169/105**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 22 | 3/3/8 + 0 | 13/8 | 20…95 | +3/-2 | médio; ambas guardas |
| pM · pM | 39 | 6/4/13 + 0 | 17/11 | 20…115 | +1/-5 | médio; ambas guardas |
| pH · pH | 64 | 9/4/19 + 0 | 22/14 | 20…130 | variável | lança; duração real depende do juggle |
| kL · kL | 24 | 4/3/10 + 0 | 13/8 | 15…100 | +1/-4 | médio; ambas guardas |
| kM · kM | 44 | 7/4/14 + 0 | 18/12 | 20…118 | +1/-5 | médio; ambas guardas |
| kH · kH | 69 | 10/5/21 + 0 | 23/15 | 20…125 | variável | lança; duração real depende do juggle |
| cP · cP | 25 | 4/3/9 + 0 | 13/8 | 20…100 | +2/-3 | médio; ambas guardas |
| cK · cK | 49 | 8/4/22 + 0 | 22/12 | 10…135 | variável | lança; duração real depende do juggle |
| jP · jP | 49 | 5/10/0 + 0 | 18/12 | 10…95 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 54 | 6/10/0 + 0 | 19/12 | 5…100 | variável | aéreo: altura/pouso definem resultado |
| s1 · SOCO DE OSASCO | 95 | 14/6/22 + 12 | 28/16 | 15…150 | variável | lança; duração real depende do juggle; avanço[10, 21, 5] |
| s2 · PICHAR MURO — OSASCO | 20 | 17/5/25 + 8 | 16/9 | 20…145 | variável | projétil/zona: ver diagnóstico |
| s3 · GRITO ALTO | 65 | 18/8/25 + 10 | 27/15 | 10…275 | -5/-17 | médio; ambas guardas |

**ULT YO SOY DE BOLIVIA: 290 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **421.1**, `cP → k → k → super` contrajane, distância52. Não é máximo absoluto.

### 1 SANT0 X

950 HP e hurtbox alta186: soco elástico52/20 f/370 tem30+12 f de recuperação e entra no limite de distância. Coelho68 é aéreo alto, só uma vez antes de aterrissar, com12 f de compromisso ao pousar. Quarta Parede8 f startup,18 f invulnerável,28 f vulnerável,CD480: já há custo/contrajogo e zero dano. Não nerfar cegamente; provar punição no startup/recovery, duração e bloqueio da reutilização.

HP **950** · andar frente/trás **4.15/3.3** · salto Vy/Vx **16.4/5** · dash **10 × 15 f** (há desaceleração) · pushW **26** · altura vulnerável **186/111**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 20 | 4/3/8 + 0 | 13/8 | 20…99 | +3/-2 | médio; ambas guardas |
| pM · pM | 36 | 7/4/13 + 0 | 17/11 | 20…119 | +1/-5 | médio; ambas guardas |
| pH · pH | 59 | 10/4/19 + 0 | 22/14 | 20…134 | variável | lança; duração real depende do juggle |
| kL · kL | 22 | 5/3/10 + 0 | 13/8 | 15…104 | +1/-4 | médio; ambas guardas |
| kM · kM | 41 | 8/4/14 + 0 | 18/12 | 20…122 | +1/-5 | médio; ambas guardas |
| kH · kH | 63 | 11/5/21 + 0 | 23/15 | 20…129 | variável | lança; duração real depende do juggle |
| cP · cP | 23 | 5/3/9 + 0 | 13/8 | 20…104 | +2/-3 | médio; ambas guardas |
| cK · cK | 45 | 9/4/22 + 0 | 22/12 | 10…139 | variável | lança; duração real depende do juggle |
| jP · jP | 45 | 6/10/0 + 0 | 18/12 | 10…99 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 50 | 7/10/0 + 0 | 19/12 | 5…104 | variável | aéreo: altura/pouso definem resultado |
| s1 · SOCO ELÁSTICO A LONGA DISTÂNCIA | 52 | 20/4/30 + 12 | 21/12 | 45…370 | -12/-21 | médio; ambas guardas |
| s2 · CHUTE DO COELHO | 68 | 13/6/24 + 10 | 22/13 | 15…155 | variável | aéreo: altura/pouso definem resultado |
| s3 · QUEBRAR A QUARTA PAREDE | 0 | 8/18/28 + 0 | 0/0 | 0…0 | variável | sem dano; ver janela/custo acima |

**ULT ABSTRAÇÃO: 240 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **360.7**, `cP → k → k → super` contrajane, distância51. Não é máximo absoluto.

### JaoDoPikles

990 HP/andar3,8. Tabuleiro:24 f,1 zona,vida180,raio110,35% de lentidão no chão; não causa dano, não para salto/ataques e acaba ao acertar o conjurador. Fórmula44/18 f/26+8 R não rastreia. Basquete62/22 f/32+10 R tem só um quique e um contato. Controle limitado já cumpre contrajogo; preservar números e testar cancelamento da zona/escape aéreo.

HP **990** · andar frente/trás **3.8/3.1** · salto Vy/Vx **15.6/4.5** · dash **9.1 × 16 f** (há desaceleração) · pushW **28** · altura vulnerável **177/108**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 21 | 4/3/8 + 0 | 13/8 | 20…95 | +3/-2 | médio; ambas guardas |
| pM · pM | 38 | 7/4/13 + 0 | 17/11 | 20…115 | +1/-5 | médio; ambas guardas |
| pH · pH | 62 | 10/4/19 + 0 | 22/14 | 20…130 | variável | lança; duração real depende do juggle |
| kL · kL | 23 | 5/3/10 + 0 | 13/8 | 15…100 | +1/-4 | médio; ambas guardas |
| kM · kM | 43 | 8/4/14 + 0 | 18/12 | 20…118 | +1/-5 | médio; ambas guardas |
| kH · kH | 67 | 11/5/21 + 0 | 23/15 | 20…125 | variável | lança; duração real depende do juggle |
| cP · cP | 24 | 5/3/9 + 0 | 13/8 | 20…100 | +2/-3 | médio; ambas guardas |
| cK · cK | 48 | 9/4/22 + 0 | 22/12 | 10…135 | variável | lança; duração real depende do juggle |
| jP · jP | 48 | 6/10/0 + 0 | 18/12 | 10…95 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 52 | 7/10/0 + 0 | 19/12 | 5…100 | variável | aéreo: altura/pouso definem resultado |
| s1 · TABULEIRO DE XADREZ | 0 | 24/1/30 + 0 | 0/0 | 0…0 | variável | projétil/zona: ver diagnóstico |
| s2 · SÍMBOLOS DA MATEMÁTICA | 44 | 18/3/26 + 8 | 21/12 | 20…110 | variável | projétil/zona: ver diagnóstico |
| s3 · ARREMESSO ABSOLUTO | 62 | 22/3/32 + 10 | 25/14 | 20…110 | variável | projétil/zona: ver diagnóstico |

**ULT CHESS IS LIFE: 260 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **387.3**, `cP → k → k → super` contrajane, distância53. Não é máximo absoluto.

### JANE

860 HP versus1060 de Cristyan; anda4,6 versus3,9. Hurtbox115/72 em pé/agachada versus179/109; alcance normal encurtado24 e dano×0,78. Esquiva altos por geometria, não por invulnerabilidade. Java18 ×2 tem18 f. Moto fica imóvel, até6 contatos separados30 ticks,11–15 dano,CD180; ultrapassar300 ticks causa60 de tontura. Slide58 prepara22 f e vira no18; baixos interrompem. Manter HP/alcance; escala global impede perdas excessivas sem eliminar silhueta.

HP **860** · andar frente/trás **4.6/3.7** · salto Vy/Vx **15.8/5.4** · dash **11 × 14 f** (há desaceleração) · pushW **20** · altura vulnerável **115/72**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 17 | 3/3/8 + 0 | 13/8 | 15…71 | +3/-2 | médio; ambas guardas |
| pM · pM | 31 | 6/4/13 + 0 | 17/11 | 15…91 | +1/-5 | médio; ambas guardas |
| pH · pH | 51 | 9/4/19 + 0 | 22/14 | 15…106 | variável | lança; duração real depende do juggle |
| kL · kL | 19 | 4/3/10 + 0 | 13/8 | 11.25…76 | +1/-4 | médio; ambas guardas |
| kM · kM | 35 | 7/4/14 + 0 | 18/12 | 15…94 | +1/-5 | médio; ambas guardas |
| kH · kH | 55 | 10/5/21 + 0 | 23/15 | 15…101 | variável | lança; duração real depende do juggle |
| cP · cP | 20 | 4/3/9 + 0 | 13/8 | 15…76 | +2/-3 | médio; ambas guardas |
| cK · cK | 39 | 8/4/22 + 0 | 22/12 | 7.5…111 | variável | lança; duração real depende do juggle |
| jP · jP | 39 | 5/10/0 + 0 | 18/12 | 7.5…71 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 43 | 6/10/0 + 0 | 19/12 | 3.75…76 | variável | aéreo: altura/pouso definem resultado |
| s1 · FINGINDO QUE TÁ TRABALHANDO | 18 | 18/12/22 + 0 | 13/8 | 15…85 | variável | projétil/zona: ver diagnóstico |
| s2 · DANDO GRAU DE MOTO | 11 | 12/300/24 + 0 | 13/8 | -65…110 | variável | até6 contatos; segurar/soltar/queda; sem armadura |
| s3 · POR BAIXO, DEPOIS CHUTE | 58 | 22/5/25 + 10 | 23/13 | 10…100 | variável | lança; duração real depende do juggle; avanço[1, 17, 9] |

**ULT AREIAZORD: 250 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **354.5**, `cP → k → k → super` contrajane, distância45. Não é máximo absoluto.

### CRISTYAN

1060 HP, andar3,9, normais×0,99/+1 startup/alcance+4. Teep62/11 f/158 empurra12, mas bloqueio dá janela de punição; Soco90/21 f/135 tem48 f recovery+whiff; giro74/17 f/[-45,155] pega atrás, avanço curto, sem invulnerabilidade. Mais vida e alcance que Jane, menos mobilidade. Preservar; verificar que nenhum especial rápido supera em dano o soco lento e que giros acertam uma vez.

HP **1060** · andar frente/trás **3.9/3.1** · salto Vy/Vx **15.7/4.6** · dash **9.6 × 16 f** (há desaceleração) · pushW **30** · altura vulnerável **179/109**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 22 | 4/3/8 + 0 | 13/8 | 20…99 | +3/-2 | médio; ambas guardas |
| pM · pM | 40 | 7/4/13 + 0 | 17/11 | 20…119 | +1/-5 | médio; ambas guardas |
| pH · pH | 64 | 10/4/19 + 0 | 22/14 | 20…134 | variável | lança; duração real depende do juggle |
| kL · kL | 24 | 5/3/10 + 0 | 13/8 | 15…104 | +1/-4 | médio; ambas guardas |
| kM · kM | 45 | 8/4/14 + 0 | 18/12 | 20…122 | +1/-5 | médio; ambas guardas |
| kH · kH | 69 | 11/5/21 + 0 | 23/15 | 20…129 | variável | lança; duração real depende do juggle |
| cP · cP | 25 | 5/3/9 + 0 | 13/8 | 20…104 | +2/-3 | médio; ambas guardas |
| cK · cK | 50 | 9/4/22 + 0 | 22/12 | 10…139 | variável | lança; duração real depende do juggle |
| jP · jP | 50 | 6/10/0 + 0 | 18/12 | 10…99 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 54 | 7/10/0 + 0 | 19/12 | 5…104 | variável | aéreo: altura/pouso definem resultado |
| s1 · CHUTE TEEP EMPURRANDO | 62 | 11/4/23 + 10 | 21/13 | 20…158 | -5/-13 | médio; ambas guardas |
| s2 · SOCO PODEROSO | 90 | 21/4/32 + 16 | 26/15 | 15…135 | variável | lança; duração real depende do juggle |
| s3 · PIRUETA COM CHUTE | 74 | 17/7/28 + 12 | 23/14 | -45…155 | variável | lança; duração real depende do juggle; avanço[10, 21, 2.4] |

**ULT REDE BAIANA: 260 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **392.1**, `cP → k → k → super` contrajane, distância55. Não é máximo absoluto.

### DOUTOR ENÉAS

1080 HP/andar3,2: ganha vida e médio alcance por lentidão. Grito60/18 f/275; ECG46/20 f projétil linear. 56: preparação22 f, dois projéteis em offsets0/10:5 dá28+launch8,6 dá34 e spike; os62 brutos são reduzidos se ambos compõem combo. Todos usam recarga. ULT275. Manter diferenças e testar lançamentos/defesa dos dois números.

HP **1080** · andar frente/trás **3.2/2.6** · salto Vy/Vx **15/4** · dash **8.5 × 17 f** (há desaceleração) · pushW **31** · altura vulnerável **184/114**.

| Golpe | Dano base | S/A/R + W | H/B | Hitbox X | Vantagem H/B teórica | Risco / aplicação |
|---|---:|---|---|---|---|---|
| pL · pL | 22 | 5/3/8 + 0 | 13/8 | 20…105 | +3/-2 | médio; ambas guardas |
| pM · pM | 39 | 8/4/13 + 0 | 17/11 | 20…125 | +1/-5 | médio; ambas guardas |
| pH · pH | 64 | 11/4/19 + 0 | 22/14 | 20…140 | variável | lança; duração real depende do juggle |
| kL · kL | 24 | 6/3/10 + 0 | 13/8 | 15…110 | +1/-4 | médio; ambas guardas |
| kM · kM | 44 | 9/4/14 + 0 | 18/12 | 20…128 | +1/-5 | médio; ambas guardas |
| kH · kH | 69 | 12/5/21 + 0 | 23/15 | 20…135 | variável | lança; duração real depende do juggle |
| cP · cP | 25 | 6/3/9 + 0 | 13/8 | 20…110 | +2/-3 | médio; ambas guardas |
| cK · cK | 49 | 10/4/22 + 0 | 22/12 | 10…145 | variável | lança; duração real depende do juggle |
| jP · jP | 49 | 7/10/0 + 0 | 18/12 | 10…105 | variável | aéreo: altura/pouso definem resultado |
| jK · jK | 54 | 8/10/0 + 0 | 19/12 | 5…110 | variável | aéreo: altura/pouso definem resultado |
| s1 · MEU NOME É ENÉAS! | 60 | 18/8/28 + 12 | 25/14 | 15…275 | -10/-21 | médio; ambas guardas |
| s2 · DIAGNÓSTICO FATAL | 46 | 20/3/29 + 8 | 22/13 | 20…110 | variável | projétil/zona: ver diagnóstico |
| s3 · 56 NA TESTA! | 28 | 22/14/30 + 8 | 21/11 | 20…110 | variável | projétil/zona: ver diagnóstico |

**ULT BOMBA ATÔMICA BRASILEIRA: 275 dano solo medido**, captura via rush descrita acima. Coreografia própria; custo100. Maior combo observado na busca limitada: **406.1**, `cP → k → k → super` contrajane, distância56. Não é máximo absoluto.

## Evidência e limites

19.110 simulações determinísticas:245 rotas por alvo/distância,13 atacantes, alvos Jane/Cristyan/Orango, duas distâncias (soma das pushboxes+5 e +70). Defensor segura guarda depois do primeiro acerto; a medição termina no primeiro estado livre e não soma chip de uma nova abertura. Sem saltos/dashes/zonas preparadas/canto/Precisão/Momentum prévio. Relatório bruto e protocolo em `balance-measurements-before.json`; código reproduzível em `scripts/balance-report.ts`. A maior rota observada foi527,43 (Orango),61,33% de860 HP daJane.

**Testes com humanos: não realizados nesta auditoria automatizada.** É necessário validar conforto, reações, execução e matchups com jogadores de níveis diferentes, teclado e toque, latência real, alternância de lados e sets longos. Não usar taxas de vitória da IA como aprovação de balanceamento.
