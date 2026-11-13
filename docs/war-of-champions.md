# War of Champions — mecânicas e primeira integração visual

## Decisões confirmadas e parâmetros de teste

A conversa e as fichas fornecidas definem HP anterior dobrado, capacidade de duas Ultimates (200), custo 100 por ULT, transformação independente por 200 e stamina universal separada. Rick possui energia própria, consome toda a carga ao ativar Cruz de Energia e recupera energia por acertos durante a forma; carga manual continua restrita ao neutro fora da transformação. Os cinco novos Viewers são Patrick Invincible, Gabrielzin, Ulisses O Nefasto, Felipence e H?D?SH. Dr. Acreano substitui Enéas na apresentação; o ID antigo é preservado para registros existentes.

Os números ainda abertos foram implementados como **tuning experimental**, centralizado em `resources.ts`, exportado em [woc-tuning.json](woc-tuning.json) e visível em RECURSOS E FORMAS. Não são decisões finais de balanceamento nem equivalem a testes humanos. Nenhum dano base foi duplicado junto com o HP.

| Lutador | HP base → atual | Forma | Duração máxima | Dano / movimento / 0 | Custo adicional à ativação |
| --- | --- | --- | --- | --- | --- |
| KARATÊ CAETANO | 1000 → 2000 | Karatê Prime | 10s | 1.35 / 1.2 / 0 | 200 ULT + fôlego |
| ORANGO TANGO BITENCOURT | 1150 → 2300 | Albino 00 | 10s | 1.35 / 1.08 / 0 | 200 ULT + fôlego |
| TUBARÃO FISCALIZADOR | 1230 → 2460 | Benzinho, Fiquei Puto | 10s | 1.5 / 0.9 / 0 | 200 ULT + fôlego |
| RICKZERA | 940 → 1880 | Cruz de Energia | 10s | 2 / 2 / 0 | 200 ULT + toda a energia |
| BIEUBATMAN | 1080 → 2160 | Maldito BuggyBatman | 10s | 1.25 / 1.15 / 0 | 200 ULT + fôlego |
| NOMAD LOBBY | 1100 → 2200 | Jogatina | 10s | 1 / 1 / 0 | 200 ULT + 10% HP máximo |
| RENNGOTTI | 1020 → 2040 | Berserker | 10s | 2 / 2 / 0 | 200 ULT + fôlego |
| ANENINHA | 1000 → 2000 | Raiane Rindo | 10s | 1.2 / 1.2 / 0 | 200 ULT + fôlego |
| 1SANT0X | 950 → 1900 | Jax — Domínio de Loucura | 10s | 1.35 / 1.2 / 0 | 200 ULT + fôlego |
| JaoDoPikles | 990 → 1980 | Falso Gênio | 10s | 1.2 / 1.1 / 0 | 200 ULT + fôlego |
| JANE | 860 → 1720 | EVA | 10s | 1.35 / 1.1 / 0 | 200 ULT + bateria do robô |
| CRISTYAN | 1060 → 2120 | Muayfimeu | 10s | 1.4 / 1.15 / 0 | 200 ULT + fôlego |
| DR. ACREANO | 1080 → 2160 | Quando Debate não Resolve | 10s | 2 / 1.05 / 0 | 200 ULT + fôlego |
| PATRICK INVINCIBLE | 1160 → 2320 | Rei Tatu | 10s | 1.5 / 0.9 / 0 | 200 ULT + alto desgaste |
| GABRIELZIN | 930 → 1860 | Gatito | 10s | 1.3 / 1.1 / 0 | 200 ULT + fôlego |
| ULISSES O NEFASTO | 1020 → 2040 | Regeneração Imediata | 10s | 1.15 / 1.08 / 0 | 200 ULT + sangue capturado |
| FELIPENCE | 1010 → 2020 | Sinfonia do Caos | 10s | 1.3 / 1.08 / 0 | 200 ULT + fôlego |
| H?D?SH | 980 → 1960 | Overclock Analítico | 10s | 1.2 / 1.2 / 0 | 200 ULT + fôlego |

As durações são ticks ativos de combate a 60 Hz; hitstop, pausa e sequências cinematográficas congelam o avanço de recursos. Recursos esgotados limitam golpes/curas, sem antecipar o término de 10 segundos. O gasto universal de ativação é 12 de fôlego, com mínimo 30 para começar. A ativação compromete por 72 frames e é interrompível nos primeiros 36; a forma ativa fica invulnerável a ataques a partir da manifestação no frame 36. O custo não é devolvido por interrupção.

“Dano recebido” 0 representa imunidade total durante a forma ativa. Seus ataques atravessam guarda, aparo, esquiva, armadura e escape de agarrão. Se os dois estão transformados, a imunidade de ambos prevalece. Rick e Renngotti recebem os multiplicadores físicos da ficha, preservando o frame data competitivo. Alcance, hitboxes e geometria não são duplicados indiscriminadamente. Nomad sorteia força ×2, movimento ×1,6 ou tamanho/alcance ×1,25, pagando 10% do HP máximo, sem poder se matar com o custo.

## Recursos e contrajogo

- Stamina: máximo 120; normais 3/5/8, especiais 6/10, agarrões 12, salto 5, dash 7, bloqueio 3/5. Recupera após 32 ticks, em 0,48/tick parado ou 0,24 em menor repouso. Exaustão dura pelo menos 120 ticks e não libera compromissos de hitstun. Defesa e normais leves permanecem possíveis.
- Rick: energia 0–100, inicial 40; CARREGAR em neutro gera 0,42/tick, dano recebido gera 0,22 por HP perdido. Especiais custam 16/22/18. Cada acerto recupera 5 de energia, inclusive na forma ativa; carga manual e ganho por dano recebido continuam indisponíveis durante a forma. Ao encerrar fica em zero, e o jogador precisa acumular novamente. Treino também respeita essa proibição.
- Ulisses: Presas de perto capturam um estoque de sangue (máximo três) e curam 30 HP; cada contato ofensivo recupera 1 sangue; Regeneração consome um a cada 300 ticks para curar até 100, deixando de curar ao faltar sangue, mas mantendo os 10 segundos da forma. Sempre limitada pelo HP máximo.
- Jane: bateria 0–100, recupera 4 por acerto; EVA gasta 0,1/tick e 12 por laser. Os dois lasers compartilham os três usos/5 s de cooldown. Saem da mão e miram uma vez no lançamento, sem perseguir o alvo. O robô amplia a hurtbox; o fim zera a bateria.
- Patrick: Escudo só tem armadura nos ativos; Rei Tatu, como as demais formas ativas, não recebe dano, stun nem captura de ataques. A proteção termina junto com o tempo da forma.
- Jao/H?D?SH: predição só auxilia guarda alta em neutro uma vez por segundo; não evade baixos, agarrões ou hitstun. Custa fôlego.
- Bieu/Aneninha/Jax: confusão dura 18 ticks, inverte apenas movimento horizontal e tem proteção de 90 ticks contra repetição. Não apaga comandos, não cancela stun e não desativa defesa.
- Renngotti: após Berserker, 900 ticks de dano/movimento ×0,5 e dano recebido ×2. Tubarão retorna filhote e cresce em 7.200 ticks, reiniciando normal no próximo round.

As regras anteriores de escala progressiva, quatro contatos de juggle, cancelamento confirmado, whiff punível, defesa perfeita, agarrão curto e três usos de distância foram mantidas. Projéteis guardam direção e potência do lançamento; mudar orientação ou terminar uma forma não reescreve tiros em voo. Sequências capturadas guardam a potência e a escala na entrada, inclusive abraços e presas.

## Organização

`woc-data.ts` define os cinco novos personagens. `resources.ts` contém tuning e regras puras; `engine.ts` integra estados, gasto, recuperação e colisões. `woc-choreography.ts` é a fonte única dos contatos de nove Ultimates. `woc-art.ts` amostra esses eventos para close de rosto, preparação, ataques e retorno. `anime-sprite.ts` apresenta as ilustrações atuais; `rig.ts` conserva apenas âncoras invisíveis para contatos. Veja [a revisão da arte e dos acessórios](anime-sprites.md).

As sequências legadas de outros lutadores, finishers, vozes, sete músicas, 17 mapas, controles personalizados, menu Q/E, perfis e ranking foram preservados. Novas formas têm efeitos e stings sintetizados, com respeito à redução de flashes. Cenas de história/editor visual continuam sendo possibilidades futuras do contexto; os diálogos de introdução e a estrutura atual de timelines já podem ser reaproveitados.

O protocolo `dw-online-12` inclui todos os novos recursos, estados e 16 bits de ações. FORMA/CARREGAR são adicionados ao fim da máscara, sem deslocar comandos anteriores. O cliente valida recursos completos antes de aplicar snapshots. No online, cada participante usa sua configuração de P1; no versus local continuam existindo P1/P2 independentes. Nenhuma migração D1 foi necessária.

## Verificação

- Typecheck, suíte completa e build foram executados na versão atual; os resultados finais constam no commit.
- **103 novas regressões** de War of Champions: 18 formas, interrupção, custo/tempo, recuperação, recursos próprios, dois estoques, snapshots atômicos, potência de agarrões e lasers EVA mirados; a validação histórica de bloqueio foi substituída pelas regras universais da forma ativa.
- **72 rotas** verificadas contra defesa mantida, incluindo execução por teclado/toque/máscaras online, espelhamento e retorno defensivo. Patrick usa perseguição aérea curta pelo peso do lançamento.
- **1.098 amostras de tempo por lutador**, 19.764 no catálogo interno; a auditoria verifica a cadência e os contatos. A arte atual contém 864 desenhos ilustrados em 54 atlas, incluindo 432 novos quadros de movimento.
- Primeira arte: 1.884 desenhos Canvas com todas as poses/18 lutadores, base e formas, sem mutar poses/esqueletos. Fluxos de luta: **311 renderizações Full HD**, cobrindo ativação, ULT e finisher dos 18; EVA/Rei Tatu também em 4K.
- Interface no Chromium: nove Viewers, laboratório de recursos, galeria de formas, teclado F e toque FORMA/CARREGAR em celular DPR 3, vertical/horizontal. Nenhum erro JavaScript.
- Dois navegadores autenticados, computador e celular, via relay HTTP: novo Viewer, HP dobrado, carga por toque, transformações dos dois participantes, energia Rick zerada, Full Box com exatos 200 HP e estoque restante, rajada de três orbes com 64,8 após escala, 16 de energia e um uso de distância. Nenhum erro JavaScript.

Resolução/toque foram emulados. Não há promessa de FPS em qualquer GPU, nem conclusão de equilíbrio humano baseada em vitórias de IA. Custos e poderes precisam de sessões com jogadores para tuning posterior.

A revisão anime padroniza todas as formas em 10 segundos ativos. Stamina, bateria e sangue esgotados limitam ações/curas, sem antecipar o término. Os resultados históricos acima descrevem o release de mecânicas; a validação atual está em [arte anime](anime-sprites.md).
