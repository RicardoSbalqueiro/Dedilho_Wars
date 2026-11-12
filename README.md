# DEDILHO WARS — War of Champions

By Rickzera. Jogo de luta anime 2D para navegador, com **18 lutadores**, **17 arenas**, rádio, contas por usuário/senha, versus, IA, multiplayer por salas, treinamento e finishers.

Jogue em https://dedilho-wars-luta.pithyblimp1.chatgpt.site. O download completo fica em [/baixar/](https://dedilho-wars-luta.pithyblimp1.chatgpt.site/baixar/). Extraia o ZIP e abra **JOGAR.html** com um navegador atualizado. Mantenha a pasta `src/assets`: contém as ilustrações e os oito MP3 locais. O `index.html` da raiz é a entrada de desenvolvimento do Vite. Modos locais e treinamento funcionam sem conta e offline; contas, ranking e salas usam o site.

## Elenco e identidade

- **Streamers:** Rickzera, Karatê Caetano, Nomad Lobby, Bieubatman, Renngotti e Aneninha.
- **Viewers:** 1SANT0X, JaoDoPikles, Jane, Cristyan, Patrick Invincible, Gabrielzin, Ulisses O Nefasto, Felipence e H?D?SH.
- **Especiais:** Tubarão Fiscalizador, Orango Tango Bitencourt e Dr. Acreano.

Os cinco novos personagens são Viewers. Dr. Acreano ocupa o lugar de Dr. Enéas. O identificador técnico antigo `eneas` é conservado para não invalidar histórico, perfis e salas; toda apresentação usa Dr. Acreano.

Os personagens usam **ilustrações de anime japonês** inspiradas nas fichas de War of Champions: rostos, cabelos, roupas, acessórios e silhuetas próprios. A coleção usa **206 atlas e 4.500 desenhos de personagens, golpes e efeitos**. Cada comando tem quatro desenhos próprios por forma, cada ULT tem 24 por forma, e cada lutador tem doze reações por forma. Jane pilota uma moto esportiva e se une ao AreiaZord branco e dourado; Ulisses transformado luta com braços e garras. Veja [desenhos por ataque](docs/action-illustrations.md). Retratos, luta, seleção, galeria e cinematográficas usam essa arte. Veja [arte anime e armas nos normais](docs/anime-sprites.md) e [animação e efeitos de combate](docs/combat-fluidity.md).

O motor continua em **60 Hz**, independente da tela. Os nove ciclos mantêm 1.098 amostras de tempo por personagem para cadência, transições e contatos; as ilustrações são selecionadas conforme estado e fase do golpe. Essas amostras não correspondem a desenhos diferentes. Startup, ativos, recovery e tamanho lógico da arena continuam separados da arte.

No computador, cenas e combate renderizam de **1080p até 4K**. No celular, a qualidade automática acompanha os pixels da tela e prioriza resposta e bateria; a opção Alta oferece mais nitidez. Menus, retratos e mapas se adaptam ao DPR/Retina. Veja [resolução e nitidez](docs/resolution.md).

## Menus vivos e campanhas

O menu inicial reúne os **18 lutadores numa pancadaria geral**, com rivais que mudam, ataques normais e transformações. Todos ficam no chão. No PC, use Agitar a luta ao fundo para provocar uma reação coletiva; essa demonstração não usa Ultimates e não altera o combate das partidas.

A nova aba **Wars of Champions** abre uma galeria com quatro campanhas **Em breve**: **Senbukan** (Karatê Caetano), **Resenha** (Rickzera), **Got** (Renngotti) e **Campeões** (Bieubatman). Um quinto quadro avisa que mais campanhas estão vindo. Cada um tem uma ilustração de costas com um gesto próprio. Clique, toque ou navegue com as setas para destacar os quadros; Escape ou MENU INICIAL retorna. As campanhas ainda não iniciam partidas.

A faixa enviada, **Ada’s Theme — Resident Evil 2**, toca em loop somente nesse menu. A troca de música fica bloqueada ali; o volume permanece ajustável. Sair restaura a estação, posição e estado de pausa anteriores da rádio. São sete raps na rádio e uma faixa exclusiva de campanha, incluída também no ZIP offline. Veja [menus e campanha](docs/living-menus.md).

## Controles

| Ação | P1 padrão | P2 padrão | Celular |
| --- | --- | --- | --- |
| Mover / saltar / agachar | A/D, W, S | Setas | Direcional |
| Soco / chute | J / K | Num1 / Num2 | SOCO / CHUTE |
| Defesa | E | Num3 | DEFESA |
| Cabeçada | L | Num9 | CABEÇADA |
| Especiais | U / I / O | Num4 / Num5 / Num6 | ESP 1 / 2 / 3 |
| Ultimate | H | Num0 | ULT |
| Agarrão | G | Num7 | AGARRAR |
| Virada manual | Q | N | VIRAR |
| Transformação | F | Num8 | FORMA |
| Carregar energia (Rick) | Segurar C | Segurar M | Segurar CARREGAR |

O celular tem um painel de 12 ações, direcional com diagonais, botão de tela cheia quando disponível e indicadores de ULT/forma. Em CONFIGURAÇÕES, escolha a posição do direcional, botões maiores, vibração opcional e qualidade gráfica. O painel se reorganiza na horizontal, mantém áreas de toque de pelo menos 44 px e libera os comandos ao cancelar um toque ou girar o aparelho. Veja [otimização mobile](docs/mobile.md).

Os comandos são configuráveis e têm alternativas para teclado sem numpad. A migração conserva teclas antigas e procura teclas livres para FORMA/CARREGAR, sem roubar bindings personalizados. Q/E e Tab continuam trocando categorias nos menus. ESC/P pausa; no treino, R reinicia posições e T troca o dummy.

## Recursos e decisões

Todos os HP máximos anteriores foram **dobrados**, preservando suas diferenças. Os novos lutadores também usam essa escala. O dano base não foi dobrado. Exemplos: Caetano 1.000 → 2.000; Rick 940 → 1.880; Jane 860 → 1.720; Cristyan 1.060 → 2.120.

A barra armazena **200 ULT**, em dois estoques. Uma Ultimate custa **100** e não apaga o estoque restante. A transformação custa **200**, exige estado neutro no chão, recursos próprios e pelo menos 30 de fôlego. Ela é independente da Ultimate. Há 36 frames de preparação interrompível e 72 de compromisso; ativar não concede invulnerabilidade. Ser interrompido na preparação perde o custo.

A **stamina** é separada de HP, ULT e recursos exclusivos. O ajuste experimental inicial usa máximo 120, normais de 3/5/8, especiais de 6/10 e agarrões de 12; saltos custam 5 e dashes 7. Bloquear custa 3, ou 5 contra fortes. Descansar recupera após 32 ticks sem gasto. Exaustão limita especiais, fortes, dash e saltos, mas mantém golpes leves e defesa. Recuperação e exaustão não quebram hitstun nem combos verdadeiros.

**Custos, duração, regeneração e multiplicadores são parâmetros experimentais**, centralizados em `src/game/resources.ts`. Não representam uma conclusão de balanceamento com jogadores humanos. As decisões confirmadas e a tradução de cada ficha estão em [War of Champions: implementação e validação](docs/war-of-champions.md).

## Rickzera: energia independente

Rick usa cabelo loiro curto, olhos verdes, camiseta preta e cargo bege. A Energia Acumulada tem limite 100 e começa em 40. Segurar CARREGAR em neutro treina e gera energia; receber dano também gera energia. Ficar parado carregando é vulnerável.

- **Projetos de Transferências:** três orbes verdes, custo 16 de energia, uma ativação de distância por rajada.
- **Soco de Energia:** projeção de punho verde, 72 de dano base, custo 22; bloqueável e sem rastreamento.
- **Salto de Energia:** impulso elevado, custo 18; segundo impulso aéreo também tem custo.
- **Combo Wise:** seis contatos, Ultimate separada da transformação.
- **Cruz de Energia:** consome toda a energia e 200 ULT. Dano e movimento físicos ×2 e dano recebido ×0,5; não duplica HP máximo, capacidade de ULT ou stamina. O alcance recebe ajuste próprio, não uma duplicação universal da arena/hitboxes. **Não acumula energia durante a forma por nenhum desses meios**, inclusive ferramentas de recarga do treino. Ao terminar, fica em zero e precisa carregar ou receber dano novamente.

## Formas e novos estilos

Todas as 18 transformações duram **10 segundos ativos (600 ticks)**, contados desde a manifestação da forma. Pausar congela o contador. Fôlego e bateria continuam sendo gastos e limitam ataques ao esgotar; sangue limita a cura de Ulisses. Esses recursos não encerram mais a forma antes dos 10 segundos. Preparação interrompível, custos e recuperação posterior continuam valendo.

Patrick combina Escudo de Casco, Investida Blindada e Punho Couraçado; Rei Tatu reduz dano e tem três contatos de armadura, vencidos por agarrões/ULTs. Gabrielzin lança Beijinho/Piscadinha, aproxima com Abraço de Cupido e veste Gatito, com patas e alcance maior. O tema de Gatito usa um motivo original sintetizado e voz, sem adicionar uma gravação externa à rádio.

Ulisses ataca com a katana nos golpes normais e usa membros distorcidos, Presas Sugadoras e Manipulação de Sangue. Presas capturam até três estoques; Regeneração Imediata consome um a cada cinco segundos para curar até 100 HP, sem ultrapassar o máximo. Felipence bate com a guitarra nos golpes normais e usa Riff, Pulso e Lamento; Sinfonia do Caos amplia pressão sonora. H?D?SH controla o chão com Go, dispara tendência e marca o airdrop 30 frames antes da queda. Sua Ultimate é Full Box 200.

Caetano veste calça branca/faixa preta e usa Karatê Prime. Bieu tem forma BuggyBatman e Ultimate Crias do Capão Redondo. Aneninha usa jaqueta rosa/cargo preta, lança baratas e chama Crias de Osasco. Nomad veste verde/galaxy, troca a rajada por Soco Gigante e paga 10% do HP máximo para sortear força, velocidade ou tamanho em Jogatina. Renngotti tem Berserker ×2, seguido de 15 segundos de força/mobilidade reduzidas pela metade.

Jane é adulta de baixa estatura, com franja loira, jaqueta branca e cargo preta. Moto e passagem → salto → chute mantêm suas regras; EVA amplia também a hurtbox, usa bateria e lasers nas mãos. Jao tem Falso Gênio, e H?D?SH tem Overclock: a predição sinalizada só auxilia uma guarda alta em neutro a cada segundo, sem evitar agarrões, baixos ou hitstun. Santox é humano na base e vira o coelho glitch Jax. Cristyan usa Joelhada do Garuda e Muayfimeu. Dr. Acreano rasga o paletó e revela tatuagens do Brasil. Orango assume Albino 00, com pelagem branca e efeitos psíquicos. Tubarão vira Megalodonte, depois filhote e cresce ao longo de dois minutos, ou até reiniciar o round.

## Combate, treino e multiplayer

O input buffer de nove frames, cancelamentos confirmados, defesa perfeita de três frames, Precisão exclusiva de Caetano, rasteiras, virada manual, quatro contatos de juggle, escala de combo e recovery punível permanecem. Normais não causam chip; agarrões exigem aproximação e não escapam de combos verdadeiros. Três usos à distância impõem cinco segundos de cooldown; rajadas contam uma vez. Especiais fortes não ganham cancelamento gratuito.

ULTs preservam a preparação de captura, erro punível e batalha de ULTs: quando se chocam, cada jogador aperta seu comando de ULT. Finishers continuam disponíveis após o KO decisivo. Novas cinematográficas usam timelines com os mesmos frames de contato que causam o dano real; preparação, expressão, ataque, impacto e retorno são separados do motor.

O treino tem **18 desafios**, incluindo transformação, fôlego e carga de energia, e **72 rotas verificadas — quatro por personagem**. FRAME DATA mostra alcance, startup, recovery, defesa, acertos e retorno ao controle. RECURSOS E FORMAS permite inspecionar custos e abastecer recursos no treino offline; ANIMAÇÕES permite observar todos os lutadores e suas formas. A barra de ULT é abastecida automaticamente no treino; a regra de não recarregar energia durante Cruz de Energia continua sendo respeitada.

O online usa host autoritativo, WebRTC com relay HTTP de fallback e protocolo **`dw-online-11`**. Stamina, estoques, energia, sangue, bateria, transformação, efeitos e recuperação são sincronizados. Os dois jogadores precisam carregar a versão atual. Contas usam usuário e senha, sem email; estatísticas, histórico, XP e ranking persistem no D1. Nenhum cadastro é necessário para jogar offline.

## Menus responsivos

O PC tem um menu ilustrado com composição de mangá, cinco painéis de modos sem numeração, opções na faixa superior e um lutador interativo. Percorra os 18 personagens, clique para ver golpes normais e acione suas transformações por dez segundos. Mouse e teclado compartilham o destaque; a pancadaria ao fundo reage à interação. O celular mantém a grade e os controles aceitos. Veja [menu ilustrado no PC](docs/desktop-menu.md).

O quadro Arena Viva foi removido. Início, seleção de lutadores/mapas, campanhas, configurações, controles, rádio, perfil e online compartilham uma interface em tamanho nativo. Apenas a arena usa o frame escalável de 960×540. Os menus têm tipografia limitada, grades responsivas, rolagem própria, retorno acessível e ações de confirmação fixadas durante a rolagem. Pausa e resultados também usam diálogos nativos, com foco e navegação por teclado. Veja [a estrutura dos menus](docs/menu-layout.md).

## Cenários, áudio e apresentação

Os 17 cenários e as sete músicas continuam disponíveis. A abertura sorteia um fundo e exibe demonstração de luta. Rádio Música fica na abertura, seleção e pausa; trilha original sintetizada e raps mantêm autoria “Orangotango Esfolador Rapper” nas faixas anteriormente atribuídas a Ulisses. Há controle de volume, efeitos, vozes e opções para reduzir flashes/tremor.

## Desenvolver e verificar

Use Node.js 22.19+ ou 24 LTS e execute:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

`npm run combos:audit` exporta rotas reais contra defesa mantida. `npm run animation:audit` verifica as amostras de tempo e os contatos internos. `python3 scripts/package.py` monta o ZIP offline com código, documentação, testes, 36 atlas, quatro cartazes de campanha e oito MP3; a página de download entrega um único ZIP validado por SHA-256, a partir do build atual. O servidor de produção é o Worker em `dist/server/index.js`, com `.openai/hosting.json` e migrações em `drizzle/`.

Relatórios históricos de balanceamento descrevem versões anteriores. Para esta reformulação, use o código atual, os multiplicadores no laboratório e o relatório de War of Champions; resultados automatizados não substituem testes de equilíbrio com jogadores humanos.
