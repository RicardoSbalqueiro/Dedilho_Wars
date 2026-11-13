# TRAINING REBORN — Academia dos Campeões

O menu **Treinamento** abre uma experiência própria, com seis áreas: Academia, Desafios, Circuito de IA, Domínio de Personagem, Laboratório de Combate e Centro de Progressão. O combate usa o mesmo motor, controles personalizados, animações, transformações e regras dos 18 lutadores. Versus, multiplayer com protocolo 13 e o experimento Senbukan 3D permanecem disponíveis nos seus menus.

## Conteúdo jogável

- 13 aulas com demonstração de contato, treinador contextual e objetivos medidos pelo motor.
- 54 desafios gerais em seis categorias, mais três exercícios com soldados de Twitchcity.
- As 90 rotas reais de combo, com confirmação de execução.
- Torre de 50 andares, chefes com poderes legítimos, seis exames de patente e continuidade salva.
- Sete dificuldades: Iniciante e Normal abertas; Veterano, Especialista, Mestre, Pesadelo e Lendária exigem desempenho e exames. Cinco estilos usam percepção atrasada, erros configurados, alcance real, stamina, recursos e comandos legais. A Memória de Combate observa uma janela limitada de acontecimentos visíveis, sem ler os comandos humanos. Revanche após vitórias seguidas usa estratégia adaptativa dentro da dificuldade escolhida.
- 18 trilhas de domínio com dez níveis, missões de poderes, confirmação e transformação. Títulos e insígnias não alteram atributos do multiplayer.
- Missões diárias e semanais com início, prazo e concessão única. A diária de vitórias Veteranas é substituída para iniciantes e permanece estável após o início da progressão daquele dia.
- Resultados com nota D–S, critérios próprios da atividade, dano, combo, precisão, defesa, stamina, tempo ativo e até três recomendações. Continuar fica disponível sem esperar a animação.

## Soldados e regiões de Twitchcity

Os **Moderadores** do antigo governo aparecem como adversários de simulação: armadura preta/roxa, visor luminoso, espada verde e jetpack. O **Moderador Supremo** usa armadura pesada, capa e martelo de execução. Ambos possuem desenhos articulados ligados aos braços e movimentos do motor, com proporções constantes. Não entram no elenco competitivo. A dificuldade não multiplica seus atributos; o equipamento próprio e o HP são apresentados nos cartões.

Há três arenas de treinamento, com camadas de cenário em cache e detalhes animados: **Capital** (praça da polícia, canal e neon roxo), **Distrito Militar** (hangares e radares em ciano) e **Distrito Conservador** (arquitetura Senbukan, lanternas e cerejeiras). Os 17 cenários clássicos continuam no seletor original. Os soldados podem ser enfrentados no Circuito, em andares da Torre e livremente no Laboratório.

## Laboratório

Configura HP inicial, recuperação de vida, stamina normal/infinita, estoque de ULT, energia/bateria/sangue, guarda, distância, lado, oponente, arena, dificuldade e comportamento. Aceita alvo parado, IA agressiva/defensiva/adaptativa, scripts, controles P2 e gravação de comandos.

Para gravar: escolha **Gravar oponente**, aplique e use os controles P1 para mover o adversário. Até 15 segundos de comandos simultâneos são registrados. Escolha reprodução para repetir o padrão em loop; limpar gravação descarta a sequência. **FRAME DATA** abre inputs, dano, escalonamento, comparação do elenco, hitboxes/hurtboxes, avanço de um frame e ferramentas de recursos. A pausa permite reiniciar a situação. As configurações do laboratório não concedem XP de conta.

## XP e persistência

`src/game/training/catalog.ts` centraliza recompensas e limites. Primeiras conclusões concedem o valor integral; repetições elegíveis concedem até 25%, duas por atividade/dia, limitadas a 400 XP diários de repetição. A primeira nota S de desafio/rota/maestria concede bônus único. Exames e primeiras vitórias em chefes concedem suas recompensas únicas. Abandono e reinício não concedem XP.

O fluxo de conta requer autenticação e proteção de origem. O servidor autoriza atividade/personagem e uma semente, armazena a sessão, recebe apenas a sequência limitada de comandos e a reproduz no motor compartilhado. Notas, métricas, XP e progresso enviados pelo navegador não concedem recompensas. Tempo transcorrido, versão, posse, pré-requisitos e conclusão são validados. Sessões duram 30 minutos e tentativas têm até três minutos ativos.

A transação SQL usa revisão de progresso, reivindicação da sessão e chaves únicas por recompensa. Envio concorrente/duplicado retorna o mesmo recibo. O teto diário é aplicado na mesma transação. XP verificado soma ao `users.xp` existente e a `users.training_xp`; pontos, vitórias e partidas competitivas não são alterados. A migração `0003_training_reborn.sql` é aditiva e preserva contas e XP anteriores.

Sem login, atividades e desbloqueios são persistidos neste navegador. Esse XP local nunca é convertido automaticamente em XP de conta. Medalhas antigas são mantidas como legado. Histórico detalhado fica limitado às últimas 100 sessões; conclusões, recordes, domínio, utilização dos personagens e desbloqueios persistem. Estatísticas por dificuldade são derivadas das conclusões permanentes. Pausa e aba inativa não contam como tempo ativo; o laboratório mantém um relógio local separado, sem recompensa.

## Validação e limites

Os testes automatizados cobrem eventos reais de contato/defesa perfeita, todas as 18 aulas de salto, replay determinístico, rejeição de resultados fabricados, autenticação/CSRF, concorrência, recompensa única, limite diário, abandono, migração e XP anterior, persistência e desbloqueios. A suíte antiga verifica combate, transformações de dez segundos, recursos, controles, equilíbrio, animação, multiplayer e Senbukan 3D.

A reprodução autoritativa preserva a matemática do rig e os estados do motor; apenas áudio e imagens são substituídos no Worker. Em execução local medida, uma reprodução de 10.800 ticks levou cerca de 183 ms. Isso é uma medição de desenvolvimento, não uma garantia de latência em produção. As dificuldades continuam sujeitas a ajustes por partidas humanas; não se usa aumento de HP/dano por dificuldade.

O download completo inclui o código, migração, este documento e o modo local jogável. Contas, XP verificado e multiplayer dependem do site. A captura de comandos do Laboratório é um recurso de prática; não é um sistema de replay de partidas publicadas.

### Verificação desta atualização

Passaram `npm run typecheck`, `npm test` e `npm run build`. A validação no Chromium cobriu o fluxo local de aula/nota/XP/recarregamento, o fluxo autenticado com XP verificado e zero pontos de PvP, os três mapas, equipamentos dos soldados, controles P2, gravação/reprodução, ULT com estoque zero, frame stepping, pausa/blur e controles simultâneos por toque em 390×844 e 844×390.

O ZIP montado pelo botão de download foi conferido por SHA-256 e CRC e contém os fontes atuais e 259 arquivos de mídia compartilhados. Com a API bloqueada, o HTML extraído executou a nova Academia, um desafio por toque, progresso local, o Moderador na Capital, o Senbukan 3D com seus modelos incorporados e uma partida versus clássica. O HTML offline foi aberto por uma rota local de teste porque o navegador gerenciado bloqueia `file://`. A emulação de celular não substitui uma medição em aparelhos físicos.
