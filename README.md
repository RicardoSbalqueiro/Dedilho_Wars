# DEDILHO WARS

Jogo de luta 2D com 13 lutadores, 17 cenários, finishers, progressão e rádio integrada.

## Jogar

Acesse https://dedilho-wars-luta.pithyblimp1.chatgpt.site em um computador, celular ou tablet com navegador atualizado. Os modos locais também funcionam offline. Para jogar offline, abra /baixar/ e baixe o ZIP completo. Extraia toda a pasta e abra **JOGAR.html** com Chrome, Edge ou Firefox atualizado. Não remova a pasta src/assets/radio: ela contém as sete músicas usadas pelo jogo offline. Clique na abertura para ativar o áudio.

O ZIP inclui tanto o jogo pronto como o código-fonte. O index.html da raiz é a entrada de desenvolvimento do Vite; para jogar diretamente use JOGAR.html. A versão online carrega as músicas do próprio site sob demanda, e a versão extraída usa os MP3 locais, sem streaming externo. O narrador usa as vozes disponíveis no navegador/sistema.

## Seleção e cenários

- **Streamers:** Rickzera, Karatê Caetano, Nomad Lobby, Bieubatman, Renngotti e Aneninha.
- **Viewers:** 1SANT0X, JaoDoPikles, Jane e Cristyan.
- **Especiais:** Tubarão Fiscal, Orango Tango Bitencourt e Doutor Enéas.

Use Q/E ou Tab para trocar de categoria, setas/WASD para escolher e Enter para confirmar. Escolha P1 e depois o adversário; ambos podem usar o mesmo personagem. A próxima tela escolhe o cenário e permite uma seleção aleatória. Há troca de lutadores e de mapa na pausa e após a partida; a revanche mantém o confronto atual.

Arenas originais: **Neto Supermercados**, **Dojo Senbukan**, **Liberdade SP**, **Curitiba**, **Piauí** e **Palácio do Planalto**. A geometria de combate é compartilhada; cada cenário tem seu próprio desenho, arquitetura e chão. A abertura usa um cenário aleatório e uma demonstração visual de luta entre os 13 personagens, sem interferir nos controles do menu ou na rádio.

Novas arenas: **Casebre**, **Praça do Dedilhador**, **Osasco**, **Bolívia**, **Morro do Bieu**, **Campo do futebol dos campeões**, **Casa Branca com Ovnis** (ideia de Jalam), **Praia do Lets Gay** (ideia de Jalam e Diegão), **Lugar do NGB News**, **Zoológico do Orangotango** e **Praia da Termodinâmica**. Todas têm arte, pisos e detalhes animados próprios. A seleção tem três páginas; os 17 mapas também participam do sorteio da abertura e das salas online.

## Combate e estilos

A troca simultânea de golpes resolve os dois contatos; um double KO empata o round. Comandos de combo permanecem disponíveis durante a pausa de impacto, ataques de chão não interrompem a gravidade no ar, e a defesa responde já no primeiro instante após o hitstun. Há aceleração curta de caminhada e controle limitado da direção no salto. Caixas de ataque usam o golpe e a direção capturados no contato, incluindo espelhamento e projéteis; o modo de colisões continua disponível nas configurações.

- **Karatê Caetano — técnico:** uma defesa nos primeiros cinco frames carrega Precisão por dois segundos, sem dano de chip. O próximo Dedilho causa 73 em vez de 55 e pode ser confirmado em Chute da Conspiração num acerto limpo. O Dedilho recebeu impacto, som e efeitos mais fortes.
- **Orango Tango — pressão:** acertos acumulam até três níveis de Ímpeto, cada um com +3% de dano e mais avanço. Tomar dano ou ficar três segundos sem pressionar encerra o bônus. Seus agarrões continuam próprios.
- **Renngotti — alcance:** microfones que passam pelo rival se tornam armadilhas baixas por tempo limitado. Grito ressoa nessas zonas, ampliando sua área de efeito. A armadilha pode ser saltada ou defendida.
- **Aneninha — improviso:** baixo + ESP 1 usa Rasteira de Osasco. Frente + ESP 2 posiciona o muro atrás de um adversário próximo; fora desse alcance mantém o posicionamento normal. As variantes são controladas pelo jogador.

Todos têm um agarrão curto com **G / Num7** ou o botão **AGARRAR**. Pressionar agarrão no mesmo momento permite escapar de um agarrão comum; os agarrões especiais exigem esquiva ou salto. Ataques em recuperação podem ser punidos, mas o rival não pode ser agarrado durante hitstun, blockstun, salto ou proteção de recuperação. Armadura recebe dano reduzido e absorve a interrupção; não é invulnerabilidade. Os oito lutadores anteriores mantêm seus golpes e atributos.

## Viewers e equilíbrio

**1SANT0X** tem 950 HP e normais com dano em ×0,9. O Soco Elástico alcança 370 unidades, causa 52 de dano, prepara em 20 quadros e recupera em 30 (+12 ao errar); é bloqueável e entra no limite de distância. Chute do Coelho causa 68, salta e exige defesa alta, com 12 quadros vulneráveis ao aterrissar. Quarta Parede não causa dano: tem oito quadros de preparação, **18 quadros (0,3 s) de invulnerabilidade**, 28 de recuperação vulnerável e recarga de **oito segundos**, mostrada no HUD. O rosto vira para a câmera em um close com sorriso; a luta continua. Abstração só captura em alcance finito, causa 240 em quatro impactos e tem arte própria. Seu finisher é **Fora do Roteiro**.

**JaoDoPikles** (JP na referência) tem 990 HP e normais em ×0,95. O Tabuleiro não causa dano: fica à frente por até **três segundos**, com largura de 220 e **35% de lentidão no chão**. Só um tabuleiro por jogador; saltar ou sair da zona permite escapar, e acertar/agarrar Jao desfaz o controle. Símbolos da Matemática é um projétil reto de 44, sem perseguição. Arremesso Absoluto usa uma bola de 62 que atordoa, empurra e quica uma vez, com recuperação longa. Os três especiais compartilham o cooldown de distância. Chess is Life une peças, fórmulas e uma enterrada em quatro impactos de 260 no total; seu finisher é **Xeque-Mate Absoluto**.

Ambos têm os modos locais, IA, treino, online, controles de toque, falas, perfil/histórico e finalização do restante do elenco. O desafio Arsenal completo reconhece uma esquiva real com a Quarta Parede e um rival em movimento afetado pelo Tabuleiro; o simples uso dessas habilidades não conclui o objetivo.

## Jane, Cristyan e Doutor Enéas

**Jane (Viewer)** é uma mulher adulta de baixa estatura: cabelo loiro em bob com franja reta, jaqueta branca, corpo pequeno de cerca de 60% da altura de Caetano. Tem 860 HP, normais de alcance curto e dano em ×0,78. Seus comandos Java saem do laptop em uma dupla de 18+18; a dupla conta como um uso à distância.

Para **Dando Grau de Moto**, segure **I / Num5 / ESP 2**. Jane fica parada girando a moto por até cinco segundos. O giro acelera, mas só permite **seis contatos**, com intervalo mínimo de meio segundo e dano de 11 a 15 por contato, inclusive contando contatos defendidos. Não há armadura ou invulnerabilidade; ataques e agarrões podem interromper. Soltar antes do limite evita a queda e inicia a recuperação. **Segurar além de cinco segundos derruba a moto e deixa Jane tonta e vulnerável por exatamente um segundo.** O HUD mostra o tempo, os contatos e a tontura. Soltar, cair ou ser interrompida inicia a **recarga de três segundos**. A pausa congela esses tempos; um novo round os reinicia.

O terceiro especial desliza fisicamente por baixo de um rival próximo, vira para ele e chuta por 58. A passagem usa uma caixa baixa e pode ser interrompida por ataques baixos; não concede invulnerabilidade. **AreiaZord** cria um robô branco e amarelo com ampulheta e um laser de cinco pulsos, 250 no total. Finisher: **Deploy do AreiaZord**.

**Cristyan (Viewer)** tem 1060 HP e normais em ×0,99. Teep causa 62 e empurra; Soco Poderoso causa 90 e arremessa, mas tem 21 quadros de preparação e recuperação longa; Pirueta causa 74 em um único acerto. Nenhum desses golpes dá armadura ou invulnerabilidade. **Rede Baiana** põe o rival para dormir numa rede, seguida de salto e impacto que quebra a rede; 260 no total. Finisher: **Sentença da Rede**.

**Doutor Enéas (Especiais)** tem 1080 HP e mobilidade mais lenta. Seu grito causa 60 em médio alcance e atordoa brevemente; o ECG causa 46 e mostra **CASO GRAVE!**. **56 na Testa!** lança com o 5 (28) e derruba com o 6 (34): ambos podem ser defendidos e a dupla conta como um uso. Seus três especiais compartilham o limite geral de distância. **Bomba Atômica Brasileira** é uma cinemática cartunesca com óculos, discurso rápido, botão vermelho, míssil 56 e explosão verde/amarela; causa 275 no total e termina com “MEU NOME É ENÉAS!”. Finisher: **56 no Placar**.

Os três têm IA, normais, defesa, agarrão, desafios, ULT, finisher, falas e suporte completo a partidas locais, celular, online e histórico. As Ultimates precisam capturar em alcance finito e podem errar. O restante do elenco mantém seus atributos.

## Finishers e apresentação

Após o KO do round decisivo, o vencedor tem quatro segundos para pressionar **ULT** (H, Num0 ou botão de toque) e executar seu finisher. A janela expira para a vitória normal; o finisher não gasta barra e só o vencedor pode ativá-lo. Cada um dos 13 personagens tem uma sequência própria de preparação, impacto e resultado, com props e efeitos de sua identidade. O finisher também é sincronizado no online e aparece no histórico.

Os confrontos têm provocações específicas entre Caetano, Orango, Renngotti e Aneninha. O narrador, os títulos de vitória e os efeitos de impacto acompanham os personagens. A trilha original usa seis variações de ritmo/escala conforme a arena, preservando a rádio e os sete raps completos.

## Golpes

| Personagem | Especial U | Especial I | Especial O | ULT H |
| --- | --- | --- | --- | --- |
| Karatê Caetano | Chute da Conspiração | Dedilho Perfurante | Soco Pego | Conspiração Absoluta |
| Orango Tango Bitencourt | Dedilho Supremo | Puxão de Camisa | Mordida na Perna | Instinto Primordial |
| Tubarão Fiscal | Mordida | Engole | Cabeçada de Barbatana | Beijo do Fiscalizador |
| Rickzera | Arremesso do Franco Suíço | Linhas do Pix | Double Jump | Wise 6x |
| Bieubatman | Chave de Fenda | Jogar Rato | Pichação | Prestígio |
| Nomad Lobby | Mario Burger | Rajada de Glock | Boomerang | Arena |
| Renngotti | Joga pra Lua | Jogar Microfone | Grito Alto | TILT |
| Aneninha | Soco de Osasco | Pichar Muro para representar Osasco | Grito Alto | Yo Soy de Bolivia. |
| 1SANT0X | Soco elástico a longa distância | Chute do Coelho | Quebrar a Quarta Parede | Abstração |
| JaoDoPikles | Tabuleiro de Xadrez | Símbolos da Matemática | Arremesso Absoluto | Chess is Life |
| Jane | Fingindo que tá Trabalhando | Dando Grau de Moto | Por baixo, depois chute | AreiaZord |
| Cristyan | Chute Teep Empurrando | Soco Poderoso | Pirueta com Chute | Rede Baiana |
| Doutor Enéas | Meu Nome é Enéas! | Diagnóstico Fatal | 56 na Testa! | Bomba Atômica Brasileira |

Renngotti arremessa o oponente para o alto e permite continuar com um combo aéreo. O microfone é um projétil em arco; o grito tem alcance frontal e empurrão, mas pode ser defendido. TILT usa uma mesa em uma sequência cinematográfica.

Aneninha avança com o Soco de Osasco e lança o adversário para continuar combos. A pichação deixa um muro marcado com OSASCO que causa até três acertos, podendo ser defendido ou saltado. Seu grito é uma onda frontal que interrompe e empurra. Na ULT, ela grita e dança com uma horda de dez dançarinas de roupas coloridas e bandeiras bolivianas, numa sequência de seis acertos. Ela também aparece na demonstração da abertura.

Todos possuem golpes fracos/médios/fortes, ataques agachados e aéreos, defesa alta/baixa, dash, combos, barra de ULT, retratos, animações de reação e vitória, IA e treinamento. Os ganhos de ULT estão em metade do valor original; o custo continua em 100 e o treinamento mantém a barra livre.

## Online e contas

Abra **ONLINE**, registre um **usuário** (3–24 letras, números ou _) e uma **senha** (8–128 caracteres). O cadastro não solicita nem armazena e-mail. A conta fica no banco do jogo e pode ser usada em outro dispositivo; a sessão dura até sete dias ou até sair da conta.

1. Um jogador cria uma sala e compartilha seu código de oito caracteres.
2. O amigo entra na própria conta e informa esse código.
3. Cada um escolhe seu lutador e confirma **PRONTO**. O criador escolhe a arena e clica em **LUTAR!**.
4. Após o resultado, ambos voltam à sala e confirmam novamente para uma revanche ou outro confronto.

Cada jogador usa seus controles de P1, incluindo os botões de toque no celular. O criador simula a partida e envia o estado ao convidado. A conexão WebRTC transmite diretamente quando possível; uma retransmissão HTTP no próprio servidor mantém a partida disponível em redes que bloqueiam P2P. O indicador mostra a conexão e o atraso estimado. Não há pausa no online; o menu permite sair. Uma interrupção prolongada bloqueia o avanço da partida enquanto a conexão é restabelecida.

O servidor valida sessões, participação, confirmação dos jogadores e a sequência de cada partida. Senhas usam PBKDF2-SHA256 com salt individual; apenas hashes de sessão são guardados no banco. Cookies de produção são HttpOnly, Secure e SameSite=Strict. Operações de escrita verificam a origem, e cadastro/login têm limites de tentativas. Os dados ficam no D1 do site; não há credenciais de conta no código distribuído.

## Perfil, histórico e ranking

**PERFIL E RANKING** mostra partidas, vitórias, derrotas, finishers, XP, nível, título e histórico. As contas e sessões existentes são preservadas. Os níveis liberam títulos de progressão sem alterar atributos do combate.

Cada partida online cria um registro no servidor antes de começar. Para conceder pontos, os dois participantes precisam enviar o mesmo vencedor, placar e finisher. Vitória dá **3 pontos e 100 XP**, derrota dá **40 XP**, e um finisher dá **+20 XP** ao vencedor. Reenvios e confirmações concorrentes concedem a recompensa apenas uma vez. Resultados divergentes ou sem a confirmação do rival ficam fora do ranking; partidas com menos de dez segundos também não pontuam. O ranking público ordena pontos, vitórias, derrotas e nome de usuário e tem páginas de vinte jogadores.

Os modos offline continuam sem cadastro. Resultados do P1 têm histórico e totais próprios neste dispositivo, separados do ranking online. O histórico recente conserva até quarenta registros; os totais de progressão continuam acumulando. Na conta, o perfil mostra as trinta partidas mais recentes.

## Celular e tablet

Os menus têm botões e formulários em tamanho nativo. Durante a luta aparece um direcional de toque com diagonais, salto e agachamento, além de soco, chute, defesa, três especiais e ULT. Vários dedos podem ser usados juntos; toques rápidos são registrados. O botão MENU abre a pausa local ou a saída da partida online.

É possível jogar na vertical, com a arena em 16:9 acima dos controles, ou na horizontal. A mudança de orientação preserva a partida. Música, configurações e desafios também têm telas adaptadas. Os botões de toque controlam o P1 no versus local; o segundo jogador pode usar um teclado conectado.

## Desafios de treinamento

Entre em **TREINAMENTO** e toque/clique em **DESAFIOS**. Há 12 objetivos com progresso real: cinco acertos, três ataques baixos, dois aéreos, cinco saltos, três dashes, três segundos agachado, três bloqueios contra IA, combo de três acertos, os três especiais diferentes, 500 de dano acumulado, acertar uma ULT e completar um cooldown de distância. Este último exige um personagem com golpes à distância.

Selecionar um desafio reinicia as posições; o desafio de defesa ativa a IA. Conquistas concluídas são lembradas neste navegador. Você pode repetir qualquer desafio ou voltar ao treinamento livre. Na pausa também é possível trocar o comportamento do oponente sem teclado.

## Balanceamento e limite de distância

Após três usos de golpes à distância, o lutador passa cinco segundos sem poder iniciar outro golpe à distância. O contador é compartilhado entre seus especiais: uma rajada inteira conta como um uso, independentemente de acertar. Corpo a corpo, defesa, movimento e ULT continuam disponíveis. O HUD mostra usos e tempo restante. A pausa local congela o relógio; um novo round reinicia o limite. A regra vale para humanos, IA, treinamento e online.

Entram no limite os projéteis, as pichações, os gritos, o Dedilho Supremo do Orangotango, o Soco Elástico, os comandos Java de Jane e os três especiais de JaoDoPikles e Enéas. Caetano e Tubarão mantêm seus especiais de contato. Os ganhos de ULT continuam em ×0,5.

Bieubatman recebeu redução de aproximadamente 9% nos normais, Chave de Fenda 88→80, Rato 46→42, Pichação 18→16 e Prestígio 300→275. Nomad tem normais em ×1, Burger 58→52, cada tiro 23→20, Boomerang 42→38 e Arena 310→285. Alguns especiais também recuperam mais lentamente, mantendo seus movimentos e identidades.

## Controles padrão

| Ação | P1 | P2 |
| --- | --- | --- |
| Mover | A / D | Setas esquerda / direita |
| Pular / agachar | W / S | Setas cima / baixo |
| Soco / chute / defesa | J / K / L | Num 1 / Num 2 / Num 3 |
| Especiais | U / I / O | Num 4 / Num 5 / Num 6 |
| ULT / Finisher | H | Num 0 |
| Agarrar | G | Num 7 ou B |
| Pausar | Esc ou P | Esc ou P |

Sem numpad, P2 também usa vírgula, ponto e barra para soco/chute/defesa; ponto e vírgula, apóstrofo e Enter para especiais; Shift direito para ULT. Ative Num Lock. As teclas podem ser alteradas em Controles.

Segure baixo para agachar e reduzir a caixa de colisão. Baixo + Defesa bloqueia golpes rasteiros; ataques aéreos altos exigem defesa em pé. Soco/chute agachado usa os ataques baixos do personagem. No treino, R reinicia posições e T troca o comportamento do oponente.

## Música

O botão **Música**, com mini equalizador, fica no canto inferior direito do menu principal e à esquerda da confirmação nas seleções de lutadores e mapas. A pausa também dá acesso à rádio. A escolha de faixa continua ao fechar o painel e ao mudar de tela; o volume é compartilhado com Música em Configurações. A rádio tem pausa, próxima/anterior, controle de posição e sequência automática.

A playlist tem a trilha original dinâmica e sete músicas completas. Os antigos créditos de Ulisses aparecem como **Orangotango Esfolador Rapper**. **Sequência Let’s Gay 1** mantém o crédito **Dornelles**. As três faixas mais recentes são Diário de um Viadão (Gaystavão), Sequência Let’s Gay 1 e Rap do Renngotti Cria de Exu Traficante de Anões Cubanos.

Os MP3 enviados estão incluídos em 96 kbps estéreo, completos, para reduzir o download. Estação e pausa são lembradas pelo navegador; o áudio começa a partir de uma interação do jogador.

## Continuar o desenvolvimento

Instale Node.js 22.13+ ou 24 LTS. Dentro desta pasta:

```sh
npm ci
npm run dev
```

O comando compila o jogo, aplica as migrações apenas no banco local e abre o servidor em http://127.0.0.1:8787. A primeira instalação precisa de internet.

```sh
npm run typecheck
npm run build
npm run db:local
npm test
npm run preview
```

O build produz `dist/server/index.js` (API), `dist/server/wrangler.json` (configuração local), `dist/.openai/hosting.json` e `dist/client/` (jogo e MP3s). Pare o servidor de preview antes de recompilar. `npm run dev:client` abre apenas o cliente Vite; as contas e salas precisam do servidor completo.

O esquema está em `db/schema.ts`. Após alterações, rode `npm run db:generate` e revise os novos SQLs em `drizzle/`. Migrações já aplicadas são preservadas. `npm run db:local` aplica apenas as pendentes no preview; o Sites aplica as hospedadas durante a publicação. O manifesto mantém a identidade do site e declara o binding lógico DB.

Para gerar o ZIP offline e a página de download após o build, use `python3 scripts/package.py`. O pacote inclui código, servidor, migrações, testes e JOGAR.html com uma única cópia das sete músicas em src/assets/radio. O online usa o site hospedado; os modos locais, desafios e controles móveis continuam disponíveis no HTML extraído.

## Organização e créditos

- src/ui/: menus, perfil/ranking, seleções de personagem/mapa, rádio, finalizações e tela de partida.
- src/game/data.ts, engine.ts e ai.ts: personagens, regras, golpes e IA.
- src/game/rig.ts e render.ts: desenhos articulados e efeitos.
- src/game/stage.ts e stage-scenes.ts: cenários.
- src/game/audio.ts e radio.ts: síntese original e playlist.
- src/assets/radio/: faixas incluídas.
- worker/: contas, salas e confirmação de resultados; db/schema.ts e drizzle/: esquema e migrações.
- tests/: regressões de combate, desafios, finishers, contas, histórico e recompensas sem duplicação.

Caetano usa o novo visual sem camisa, porte atlético, calça laranja e faixa roxa. Seu afro permanece maior que o de Bieu. Renngotti usa moletom/cargo brancos, óculos escuros e fones. Aneninha usa capuz amarelo bordado, cachos castanhos, saia rosa em camadas, pompons e botas decoradas, no mesmo estilo desenhado dos demais lutadores.

A fonte Russo One é de Jovanny Lemonad e usa SIL Open Font License 1.1. A licença integral está em src/assets/Russo-One-LICENSE.txt e incorporada ao HTML distribuído.
