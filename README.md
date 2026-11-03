# DEDILHO WARS

Jogo de luta 2D com oito lutadores, seis cenários e rádio integrada.

## Jogar

Acesse https://dedilho-wars-luta.pithyblimp1.chatgpt.site em um computador com teclado. Para jogar offline, abra /baixar/ e baixe o ZIP completo. Extraia toda a pasta e abra **JOGAR.html** com Chrome, Edge ou Firefox atualizado. Não remova a pasta src/assets/radio: ela contém as sete músicas usadas pelo jogo offline. Clique na abertura para ativar o áudio.

O ZIP inclui tanto o jogo pronto como o código-fonte. O index.html da raiz é a entrada de desenvolvimento do Vite; para jogar diretamente use JOGAR.html. A versão online carrega as músicas do próprio site sob demanda, e a versão extraída usa os MP3 locais, sem streaming externo. O narrador usa as vozes disponíveis no navegador/sistema.

## Seleção e cenários

- **Streamers:** Rickzera, Karatê Caetano, Nomad Lobby, Bieubatman, Renngotti e Aneninha.
- **Viewers:** Em breve; não permite confirmar um personagem.
- **Especiais:** Tubarão Fiscal e Orango Tango Bitencourt.

Use Q/E ou Tab para trocar de categoria, setas/WASD para escolher e Enter para confirmar. Escolha P1 e depois o adversário; ambos podem usar o mesmo personagem. A próxima tela escolhe o cenário e permite uma seleção aleatória. Há troca de lutadores e de mapa na pausa e após a partida; a revanche mantém o confronto atual.

Cenários: **Neto Supermercados**, **Dojo Senbukan**, **Liberdade SP**, **Curitiba**, **Piauí** e **Palácio do Planalto**. A geometria de combate é compartilhada; cada cenário tem seu próprio desenho, arquitetura e chão. A abertura usa um cenário aleatório e uma demonstração visual de luta entre os oito personagens, sem interferir nos controles do menu ou na rádio.

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

Renngotti arremessa o oponente para o alto e permite continuar com um combo aéreo. O microfone é um projétil em arco; o grito tem alcance frontal e empurrão, mas pode ser defendido. TILT usa uma mesa em uma sequência cinematográfica.

Aneninha avança com o Soco de Osasco e lança o adversário para continuar combos. A pichação deixa um muro marcado com OSASCO que causa até três acertos, podendo ser defendido ou saltado. Seu grito é uma onda frontal que interrompe e empurra. Na ULT, ela grita e dança com uma horda de dez dançarinas de roupas coloridas e bandeiras bolivianas, numa sequência de seis acertos. Ela também aparece na demonstração da abertura.

Todos possuem golpes fracos/médios/fortes, ataques agachados e aéreos, defesa alta/baixa, dash, combos, barra de ULT, retratos, animações de reação e vitória, IA e treinamento. Os ganhos de ULT estão em metade do valor original; o custo continua em 100 e o treinamento mantém a barra livre.

## Controles padrão

| Ação | P1 | P2 |
| --- | --- | --- |
| Mover | A / D | Setas esquerda / direita |
| Pular / agachar | W / S | Setas cima / baixo |
| Soco / chute / defesa | J / K / L | Num 1 / Num 2 / Num 3 |
| Especiais | U / I / O | Num 4 / Num 5 / Num 6 |
| ULT | H | Num 0 |
| Pausar | Esc ou P | Esc ou P |

Sem numpad, P2 também usa vírgula, ponto e barra para soco/chute/defesa; ponto e vírgula, apóstrofo e Enter para especiais; Shift direito para ULT. Ative Num Lock. As teclas podem ser alteradas em Controles.

Segure baixo para agachar e reduzir a caixa de colisão. Baixo + Defesa bloqueia golpes rasteiros; ataques aéreos altos exigem defesa em pé. Soco/chute agachado usa os ataques baixos do personagem. No treino, R reinicia posições e T troca o comportamento do oponente.

## Música

O botão **Música**, com mini equalizador, fica no canto inferior direito do menu principal e à esquerda da confirmação nas seleções de lutadores e mapas. A pausa também dá acesso à rádio. A escolha de faixa continua ao fechar o painel e ao mudar de tela; o volume é compartilhado com Música em Configurações. A rádio tem pausa, próxima/anterior, controle de posição e sequência automática.

A playlist tem a trilha original dinâmica e sete músicas completas. Os antigos créditos de Ulisses aparecem como **Orangotango Esfolador Rapper**. **Sequência Let’s Gay 1** mantém o crédito **Dornelles**. As três faixas mais recentes são Diário de um Viadão (Gaystavão), Sequência Let’s Gay 1 e Rap do Renngotti Cria de Exu Traficante de Anões Cubanos.

Os MP3 enviados estão incluídos em 96 kbps estéreo, completos, para reduzir o download. Estação e pausa são lembradas pelo navegador; o áudio começa a partir de uma interação do jogador.

## Continuar o desenvolvimento

Instale Node.js 22.12+ ou 24 LTS. Dentro desta pasta:

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, normalmente http://localhost:5173. A primeira instalação precisa de internet.

```sh
npm run typecheck
npm run build
npm run preview
```

O build produz dist/index.html com desenhos, scripts e estilos incorporados, e os sete arquivos MP3 na mesma pasta dist. Para distribuir um novo build, mantenha toda a pasta dist junta; copiar somente o HTML perde os arquivos de música. O JOGAR.html desta entrega foi preparado para usar os MP3 em src/assets/radio, preservando uma única cópia dos áudios no ZIP.

## Organização e créditos

- src/ui/: menus, seleções de personagem/mapa, rádio e tela de partida.
- src/game/data.ts, engine.ts e ai.ts: personagens, regras, golpes e IA.
- src/game/rig.ts e render.ts: desenhos articulados e efeitos.
- src/game/stage.ts e stage-scenes.ts: cenários.
- src/game/audio.ts e radio.ts: síntese original e playlist.
- src/assets/radio/: faixas incluídas.

Caetano usa o novo visual sem camisa, porte atlético, calça laranja e faixa roxa. Seu afro permanece maior que o de Bieu. Renngotti usa moletom/cargo brancos, óculos escuros e fones. Aneninha usa capuz amarelo bordado, cachos castanhos, saia rosa em camadas, pompons e botas decoradas, no mesmo estilo desenhado dos demais lutadores.

A fonte Russo One é de Jovanny Lemonad e usa SIL Open Font License 1.1. A licença integral está em src/assets/Russo-One-LICENSE.txt e incorporada ao HTML distribuído.
