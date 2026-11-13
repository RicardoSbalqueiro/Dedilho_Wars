# Escala dos lutadores, poder das formas e impacto dos golpes

A escala deixa de depender da altura do recorte ou da mediana de cada golpe. `sprite-bodies.json` calibra 4.332 desenhos de corpo em 199 folhas contra o modelo ereto do mesmo personagem e forma. Cada folha/forma usa uma única unidade de desenho, calculada pela área opaca mediana. Isso mantém as proporções quando o lutador dobra os joelhos, ergue uma arma ou avança o tronco; essas poses não são infladas para preencher um retângulo em pé. Os pés usam a base opaca de cada quadro. As imagens dos ataques já incluem sua postura e não recebem uma segunda rotação de pose. As dimensões, desenhos e pixels dos WebP permanecem intactos.

Todas as 18 formas ativas são imunes a dano, chip, stun e captura de ataques. Seus ataques atravessam guarda alta/baixa, defesa perfeita, Precisão, esquiva, armadura, proteção/escape de agarrão e disputa de golpes. Quando os dois estão transformados, ambas as imunidades prevalecem. A preparação continua vulnerável antes da manifestação no frame 36. A duração permanece 600 ticks ativos, ou 10 segundos. Pausa, hitstop e cinematográficas congelam o relógio dos recursos.

A imunidade é aplicada na resolução do contato, no dano central e na entrada/contatos das sequências capturadas. Um ataque contra uma forma ativa consome seu contato e mostra o escudo; não concede dano, combo, recursos ou cancelamento por acerto.

## Recuperação dos recursos ao atacar

Cada contato que causa dano ao adversário recupera **4% de bateria da Jane**, **1 estoque de sangue do Ulisses** ou **5 de energia do Rickzera**, até seus limites de 100%, três estoques e 100. Vale para normais, especiais, projéteis, agarrões e contatos das ULTs, nas duas orientações e durante a forma ativa. Ataques de vários contatos recuperam em cada acerto. A recuperação é independente do ganho de ULT/stamina, da recarga natural e dos custos de ativação. Os recursos exclusivos continuam seguindo seus custos e o esgotamento próprio ao encerrar a forma.

Erros, guarda, chip, dano zero e contatos anulados por imunidade não recuperam esses recursos. O ganho aparece acima do lutador e no indicador do recurso. A carga manual do Rick continua disponível apenas fora da transformação; acertar é uma forma adicional de recuperar energia, inclusive transformado.

## Efeitos de luta

`fight-spectacle.ts` acrescenta imagens residuais dos ataques, fitas e fragmentos de energia, círculos e filamentos nas formas, impactos radiais em várias camadas, ondas de choque, estilhaços de escudo, poeira/detritos e rachaduras no chão. Projéteis recebem rastros; ULTs recebem linhas de velocidade, anéis e explosões nos contatos reais. Ulisses, Felipence, Jão/H?D?SH e personagens glitch têm detalhes próprios. A quantidade básica de faíscas também aumentou.

Essas camadas usam o relógio da simulação e ruído determinístico. Não modificam posição, escala, colisão nem dano. Desktop e celular têm orçamentos próprios; a redução de flashes limita intensidade, raios e imagens residuais. Os efeitos maiores são reconstruídos localmente a partir dos impactos, sem ampliar a lista de partículas enviada pela rede.

## Validação

- 492 verificações novas: todas as combinações de 18 atacantes/18 formas, defesas, agarrões, projéteis, expiração, recursos por acerto, limites, snapshots e escala dos desenhos.
- Suíte completa de combate, combos, animação, temporização, controles, menus, contas e API aprovada; typecheck e build aprovados.
- Canvas real: 3.636 desenhos de ações/efeitos e 512 amostras de cinematográficas, sem erros JavaScript. Orçamento de cache móvel abaixo de 16 megapixels.
- Navegação de treinamento e galeria no computador, campanhas e ataques por toque em celular DPR 3. A validação mobile usa emulação; não foi um ensaio em aparelho físico.
