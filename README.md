# Dedilho Wars

Jogo de luta 2D com Karatê Caetano, Orango Tango Bitencourt, Tubarão Fiscal e Rickzera.

## Jogar sem instalar ferramentas

1. Extraia este ZIP.
2. Abra **JOGAR.html** com Chrome, Edge ou Firefox atualizado em um computador com teclado.
3. Clique na tela inicial e escolha Jogar, Versus Local ou Treinamento.

O HTML já contém o jogo compilado, os estilos e a fonte. Não precisa de Node.js, servidor ou conexão com a internet para o combate. O narrador usa as vozes disponíveis no navegador/sistema; sua disponibilidade offline pode variar. O áudio começa após clicar ou pressionar uma tecla.

**Abra JOGAR.html para jogar.** O index.html na raiz é o ponto de entrada do código-fonte e precisa do Vite.

## Elenco e seleção de confrontos

Na seleção, escolha primeiro o Jogador 1 e pressione **Confirmar P1**. Depois escolha o adversário (CPU, Jogador 2 ou oponente de treino) e pressione **Lutar!**. Todos podem enfrentar todos, inclusive o mesmo personagem. É possível revisar cada lado pelos painéis superiores. Use **Trocar lutadores** no menu de pausa ou depois da partida para montar o próximo confronto.

| Personagem | Especial U | Especial I | Especial O | Super H |
| --- | --- | --- | --- | --- |
| Karatê Caetano | Chute da Conspiração | Dedilho Perfurante | Soco Pego | Conspiração Absoluta |
| Orango Tango Bitencourt | Dedilho Supremo | Puxão de Camisa | Mordida na Perna | Instinto Primordial |
| Tubarão Fiscal | Mordida | Engole | Cabeçada de Barbatana | Beijo do Fiscalizador |
| Rickzera | Arremesso do Franco Suíço | Linhas do Pix | Double Jump | Wise 6x |

Tubarão é resistente e domina o corpo a corpo: Engole ignora a defesa quando conecta de perto; a Cabeçada tem armadura durante a preparação final e o avanço. Rickzera é ágil: lança projéteis que podem ser defendidos, dispara três linhas de Pix e pode saltar uma segunda vez com W ou O (no P2, seta para cima ou Num 6). O impulso extra é limitado a dois saltos por voo e recarrega ao aterrissar. O Wise 6x acerta exatamente seis vezes quando conecta.

Todos possuem golpes fracos/médios/fortes, ataques baixos e aéreos, defesa alta/baixa, dash, combos, barra de super, animação de vitória, retratos e suporte à IA e ao treino. O super gasta a barra completa fora do treinamento.

## Controles padrão

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Mover | A / D | Setas esquerda / direita |
| Pular / agachar | W / S | Setas cima / baixo |
| Soco / chute / defesa | J / K / L | Num 1 / Num 2 / Num 3 |
| Especiais | U / I / O | Num 4 / Num 5 / Num 6 |
| Super | H | Num 0 |
| Pausar | Esc ou P | Esc ou P |

Sem teclado numérico, o jogador 2 pode usar vírgula, ponto e barra para soco/chute/defesa; ponto e vírgula, apóstrofo e Enter para os especiais; Shift direito para o super. Ative Num Lock ao usar o teclado numérico. As teclas podem ser alteradas em **Controles**.

No treino, **R** reinicia as posições e **T** troca o comportamento do oponente. Na seleção de personagens, use setas/WASD e Enter ou clique nos retratos e botões de confirmação.

## Continuar o desenvolvimento

Instale uma versão LTS atual do Node.js (22.12+ ou 24 recomendado). A primeira instalação das dependências precisa de internet. No terminal, dentro desta pasta:

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente http://localhost:5173. As alterações em src/ aparecem durante o desenvolvimento.

```sh
npm run typecheck  # verifica o TypeScript
npm run build      # verifica e gera dist/index.html autossuficiente
npm run preview    # permite testar o build pelo servidor local
```

Após alterar o jogo, execute npm run build e copie dist/index.html para JOGAR.html para atualizar o arquivo de dois cliques. A versão JOGAR.html incluída neste ZIP corresponde ao código-fonte desta entrega.

## Organização

- src/ui/: menus, seleção de personagem e tela de partida.
- src/game/engine.ts: combate, regras e partidas.
- src/game/data.ts: personagens, golpes e poses.
- src/game/ai.ts: comportamento da inteligência artificial.
- src/game/render.ts, rig.ts e stage.ts: desenho, animação e cenário.
- src/game/audio.ts: música e efeitos sintetizados.
- src/game/input.ts: teclado e configuração dos controles.

## Atualização do elenco

A abertura agora usa apenas o título **DEDILHO WARS**. Os dois novos personagens têm desenho vetorial articulado no mesmo estilo dos originais, retratos próprios, efeitos de água/energia verde, golpes exclusivos e supers cinematográficos. O ZIP contém o código-fonte desta versão e o JOGAR.html correspondente.

## Preparação inicial

O ZIP original continha o código-fonte sem uma distribuição pronta para abrir. Foram incluídos o HTML compilado, instruções de execução e desenvolvimento, verificação TypeScript no build e a fonte local para dispensar o carregamento pelo Google Fonts. Os personagens e as regras de combate foram preservados.

A fonte Russo One é de Jovanny Lemonad e usa a licença SIL Open Font License 1.1. O texto integral está em src/assets/Russo-One-LICENSE.txt e também foi incorporado ao HTML distribuído.
