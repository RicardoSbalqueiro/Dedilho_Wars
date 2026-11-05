# Auditoria e ajustes de balanceamento — Dedilho Wars

O diagnóstico anterior está em [audit-baseline.md](audit-baseline.md), com os atributos e os **169 golpes da ficha dos 13 lutadores**, após resolver as cópias e os ajustes de startup. As regras, provas de reprodução e limitações da IA estão em [audit-rules-baseline.md](audit-rules-baseline.md). Base examinada: `8c424527e5237ad5738f6b185c907be5a08bdb14`.

Os ajustes corrigem perda da escala de combo, uma captura instantânea após o anúncio de ULT, armadura durante a recuperação e agarrões com uma combinação excessiva de velocidade, alcance e recompensa. HP, velocidade, silhueta, normais e animações exclusivas dos 13 personagens foram preservados. Os valores seguintes são uma primeira revisão testada por simulação; a aprovação competitiva exige partidas humanas.

## Antes / depois e motivo

Todos os tempos são frames a 60 Hz. Alcance é a extensão local da hitbox, sem somar avanço ou largura do adversário.

| Personagem / regra | Antes | Depois | Motivo e contrajogo |
| --- | --- | --- | --- |
| Todos: dano progressivo do combo | 100%, 100%, 90%, 80%, 70%, 60%, 50%, piso 45% | 100%, 90%, 80%, 70%, 60%, 50%, 40%, 30%, piso 20% | O segundo acerto já tem desconto e cada contato seguinte perde dez pontos até o piso. Reduz a recompensa de cadeias longas e rajadas sem tirar dano do golpe isolado. |
| Todos: entrada de ULT / agarrão cinematográfico | Reiniciava contagem e dano; sequência sempre causava dano bruto | Preserva a cadeia existente e aplica uma escala fixa à sequência inteira | Fechar um combo com ULT deixa de contornar a redução. Uma ULT com muitos impactos visuais não é penalizada mais que outra com um único impacto. Dano solo preservado. |
| Todos: ULT captura no frame exato de recuperação | Reiniciava a escala ao encontrar o rival em `ground`, mesmo na mesma atualização que encerrou o hitstun | Herda contagem e dano se a recuperação e a captura ocorrerem na mesma atualização | Fecha o segundo caminho de reinício de escala. Nenhum frame de hitstun, guarda ou invulnerabilidade é acrescentado. Depois de um frame inteiramente livre, a escala volta ao normal. |
| Todos: preparação de ULT após o anúncio | 0f | 12f vulneráveis | O anúncio deixa de garantir captura instantânea. O adversário livre pode interromper a preparação ou iniciar o salto; o custo de 100 de barra permanece mesmo na interrupção. |
| Todos: altura da captura de ULT | 120 | 100 | Somente acrescentar startup não permitia escapar com o salto mais baixo. O par 12f / altura 100 permite fuga vertical após o anúncio nos casos testados. Preserva duração e velocidade do avanço ativo. |
| Todos: armadura da ULT | Durante todo o avanço e os 34f de recuperação | Somente durante os 24f ou 34f ativos, conforme o personagem | Preparação e erro ficam interrompíveis. Mantém os 34f de recuperação: a ULT errada pode ser punida, sem absorver o golpe da punição. |
| Tubarão: Engole | Startup 11f, alcance 118, dano 145 | Startup 18f, alcance 96, dano 125 | Captura sem tech tinha mais que o dobro do dano do agarrão universal e alcance alto com pouca preparação. Continua indefensável e próprio do Tubarão; saltar, afastar e interromper funcionam. Mantém 4f ativos e 48f de recuperação no erro. |
| Orango: Puxão de Camisa | Startup 8f, alcance 125, dano 160 | Startup 16f, alcance 105, dano 140 | Era mais rápido que o agarrão universal, causava mais que o dobro do dano e alcançava muito mais sem tech. Continua um agarrão forte, mas exige aproximação e leitura. Mantém 38f de recuperação no erro. |
| Orango: Mordida na Perna | Startup 10f, 16f ativos; avanço programado 176 | Startup 18f, 10f ativos; avanço programado 90 | Reduz captura rasteira em movimento com pouca antecipação. Preserva dano 125, lançamento e animação; continua vulnerável a salto/interrupção. Recuperação no erro continua 48f. A inércia após o avanço não está incluída nesses valores. |
| Renngotti: Joga pra Lua | Startup 10f, alcance 120, dano 90 | Startup 16f, alcance 100, dano 90 | O lançamento abre um juggle, além do dano da captura. Exigir preparação e proximidade preserva essa recompensa. Mantém 4f ativos e 44f de recuperação no erro. |
| Renngotti: microfones simultâneos | Sem teto explícito por dono além da recarga compartilhada; podia reunir três | Máximo de dois; lançar um terceiro substitui o mais antigo | Restringe o espaço ocupado e a ressonância simultânea. Preserva o dano 60 em voo, armadilha baixa 28, ressonância 35, raios e duração. Não altera o limite de três usos / cinco segundos. |
| IA: ameaças estacionárias | Detectava spray, mas ignorava muro de Osasco e microfone ancorado | Reconhece perigos estacionários próximos e escolhe a ameaça válida mais próxima | Corrige uma lacuna de percepção que favorecia o zoneamento contra CPU. Ignora objetos próprios, expirados, afastando-se e tabuleiro sem dano. Mantém probabilidades e reação de cada dificuldade. |
| Contador de combo | Algumas sequências começavam com um acerto inexistente e apagavam dano anterior | Conta impactos reais e mantém o dano da abertura | O treino mostra a mesma perda de HP medida pelo motor; não infla combo por iniciar uma animação. |

Sem mudanças na defesa perfeita, Precisão de Caetano, chip, tech do agarrão universal, proteção após recuperação, buffer de 9f, cancelamentos limitados, quatro contatos de juggle, barra em ×0,5, limite de distância, disputa de ULTs ou finishers.

## Decisão por lutador

| Lutador | Decisão individual | Por quê |
| --- | --- | --- |
| Karatê Caetano | Preservar ficha e Precisão | Tem normais técnicos e rápidos; Chute, Dedilho com avanço e Soco Pego já oferecem custos distintos. A correção global de combo remove o dano cheio da ULT após a abertura. |
| Orango Tango | Ajustar os dois agarrões | Conserva 1.150 HP, alcance dos normais, lentidão relativa, Ímpeto e pressão. O risco adicional recai sobre as capturas de maior recompensa. |
| Tubarão Fiscal | Ajustar Engole | Conserva 1.230 HP, Mordida bloqueável e Cabeçada com armadura limitada. Não perde o papel de lutador pesado. |
| Rickzera | Preservar ficha | 940 HP compensam mobilidade, pulo duplo e projéteis; rajadas recebem a nova escala quando formam combo. |
| Bieubatman | Manter os nerfs anteriores | Chave 80, rato baixo e spray com contatos limitados têm contras próprios; a auditoria não justificou outra redução arbitrária. |
| Nomad Lobby | Manter os nerfs anteriores | Glock é alta, boomerang tem no máximo um contato por trajeto e os três especiais compartilham a recarga. |
| Renngotti | Ajustar captura e orçamento de armadilhas | Mantém seu controle de área, juggle lunar e Grito; passa a precisar preparar duas zonas e defender a aproximação. |
| Aneninha | Preservar variantes | Rasteira e muro reverso mantêm alturas e posicionamento imprevisíveis. Muro tem três contatos espaçados e pode ser bloqueado/saltado. |
| 1SANT0X | Preservar poderes defensivos | Quarta Parede já tem 8f de preparação, só 18f invulneráveis, 28f de recuperação e recarga de 480 ticks. Não pode cancelar stun; novos testes cobrem punição e impossibilidade de reutilização imediata. |
| JaoDoPikles | Preservar ficha e zona | Um tabuleiro por dono, sem dano, três segundos, lentidão de 35% apenas no chão e destruição ao atingir Jao são limitações reais. Fórmula não persegue e bola tem um quique/um contato. |
| Jane | Preservar 860 HP, corpo pequeno, mobilidade e alcance curto | Seus normais causam ×0,78; a hurtbox baixa evita alguns altos por geometria. Moto continua com seis contatos, queda após cinco segundos, tontura de um segundo e recarga de três. Java 18+18 passa a causar 34,2 se os dois contatos forem um combo. |
| Cristyan | Preservar 1.060 HP, alcance e compromisso | Tem mais vida e alcance que Jane, com menor mobilidade e sem projéteis. Teep 62, Soco 90 e Pirueta 74 mantêm riscos e animações distintos. |
| Doutor Enéas | Preservar ficha | Vida e alcance compensam lentidão. Os dois números seguem bloqueáveis; 28+34 passa a 58,6 quando o segundo contato herda 90% da escala. |

## Medição de combos antes / depois

A mesma busca determinística percorre **19.110 rotas por versão**: 13 atacantes × três alvos (Jane, Cristyan e Orango) × duas distâncias × 245 rotas. O defensor segura guarda depois do primeiro acerto; a busca termina quando observa recuperação. São normais de chão, cancelamentos confirmados e finalizações em especiais ou ULT. Não inclui saltos, dashes, zonas preparadas, posições de canto nem preparação prévia de Precisão/Ímpeto. Portanto estes são **maiores danos observados nessa amostra, não máximos absolutos ou provas de equilíbrio**. As rotas vencedoras podem mudar após o ajuste.

| Lutador | Antes | Depois | Redução observada | Maior rota atual observada |
| --- | ---: | ---: | ---: | --- |
| KARATÊ CAETANO | 453,00 | 358,00 | 20,97% | `kH → super` |
| ORANGO TANGO BITENCOURT | 527,43 | 396,90 | 24,75% | `pH → super` |
| TUBARÃO FISCAL | 463,90 | 346,00 | 25,41% | `pH → super` |
| RICKZERA | 400,70 | 322,10 | 19,62% | `cK → p → super` |
| BIEUBATMAN | 414,60 | 321,50 | 22,46% | `kH → super` |
| NOMAD LOBBY | 418,00 | 326,50 | 21,89% | `kH → super` |
| RENNGOTTI | 448,00 | 353,50 | 21,09% | `kH → super` |
| ANENINHA | 421,10 | 330,00 | 21,63% | `kH → super` |
| 1SANT0X | 360,70 | 279,00 | 22,65% | `kH → super` |
| JaoDoPikles | 387,30 | 301,00 | 22,28% | `kH → super` |
| JANE | 354,50 | 280,00 | 21,02% | `kH → super` |
| CRISTYAN | 392,10 | 303,00 | 22,72% | `kH → super` |
| DOUTOR ENÉAS | 406,10 | 316,50 | 22,06% | `kH → super` |

As Ultimates isoladas mantêm seus totais: Caetano 320, Orango 341, Tubarão 290, Rickzera 280, Bieu 275, Nomad 285, Renngotti 315, Aneninha 290, 1SANT0X 240, Jao 260, Jane 250, Cristyan 260 e Enéas 275. Custam 100 de barra; a disputa de duas ULTs continua dando ao vencedor sua própria animação e dano normal, sem bônus.

Arquivos de evidência: [medições anteriores](balance-measurements-before.json), [medições atuais](balance-measurements-after.json), [fichas anteriores](balance-before.json) e [fichas atuais](balance-after.json). Para repetir a medição atual: `npm run balance:audit`.

## Ferramenta de treinamento

No treinamento, **FRAME DATA** abre o Laboratório de Combate. Permite comparar qualquer par dos 13 personagens e escolher golpes diferentes em cada ficha. Mostra HP, movimento, tamanho vulnerável, dano, startup, ativos, recovery, recuperação extra no erro, stun, altura de guarda, chip e alcance local.

A vantagem teórica só aparece em golpes terrestres apropriados; projéteis, aéreos, lançadores, capturas e zonas mostram “Variável”, com notas de funcionamento. Não apresenta a ficha de um projétil como vantagem garantida ao chegar no rival. Os valores de dano das ULTs têm regressões que os comparam com a cinematográfica real.

É possível preparar um golpe do P1 atual e avançar um tick por clique com o jogo pausado, observando estado, contato, stun, combo e sua escala. Hitstop também avança por tick e mantém os frames de ação congelados. Há opções de hitboxes e monitor visível ao voltar à luta. Executar golpes e avançar frames fica restrito ao treinamento offline; respeita recargas e estados comprometidos.

## Verificação e limites

Os testes de balanceamento cobrem dano solo e combo das 13 ULTs, herança de escala/contador e snapshots, captura no frame de recuperação, fuga e punição das ULTs dos dois lados, pressão repetida contra guarda, limite de juggle, bordas reais de alcance contra Jane/Cristyan, estados não agarráveis, Engole, tabuleiro, orçamento de microfones, Quarta Parede, percepção de zonas pela IA e ferramentas do treinamento. As suítes anteriores continuam verificando teclado/toque/online, disputa de ULTs, desafios, finishers, contas e progressão.

**Partidas de balanceamento com jogadores humanos: não realizadas.** Regressões, simulação de rotas e QA de interface são resultados diferentes. Ainda é preciso avaliar reação, execução, conforto dos controles, contrajogo sob latência e matchups com jogadores de níveis distintos, alternando lados e plataformas. Nenhuma taxa de vitória da IA foi usada para declarar um personagem equilibrado.
