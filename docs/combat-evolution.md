# Guarda, sequências em pé e arenas reativas

A guarda tem uma resistência independente de HP, stamina e ULT. Começa em 100. Bloqueios comuns retiram 8/13/22 conforme a força do normal, 22 para cabeçada e pressão própria para especiais. Defesa perfeita restaura 7; Precisão restaura 12. A resistência volta em 0,32/tick após 135 ticks sem bloquear, com o lutador em neutro e a defesa solta.

Ao zerar, a guarda rompe por 42 ticks ativos (0,7 s): o alvo permanece em pé, sem poder defender durante a ruptura, com reação e estilhaços próprios. O contato que rompe um bloqueio continua seguindo o chip original, sem ganhar dano de normal. O atacante pode usar a abertura para acertar. Ao acabar, a resistência volta a pelo menos 45. Transformações ativas preservam imunidade e atravessam a guarda diretamente; romper outra forma ativa continua impossível.

Os seis normais em pé preservam dano, alcance e preparação, mas deixam de lançar ao acertar no chão. O recuo fica limitado a 1,9 nos leves/médios e 2,6 nos fortes; hitstun dos fortes tem mínimo 24. Rasteiras, lançadores especiais, agarrões, ULTs e aéreos conservam suas funções. Após seis contatos terrestres, o hitstun diminui progressivamente; o décimo contato força o encerramento em lançamento. O limite aéreo permanece quatro. Os testes verificam recuperação, defesa preparada e ausência de extensões infinitas.

Cada um dos 18 personagens tem uma ordem própria de seis comandos. Os três primeiros são normais; os três seguintes exigem a ordem exata, acertos limpos, a janela de confirmação e o rival ainda em hitstun. Erros, bloqueios, golpes agachados ou perda do alvo interrompem a extensão. As sequências aparecem em **Treinamento → Combos**, formando cinco rotas por lutador, 90 no total. A ficha e o efeito final identificam o estilo; as figuras existentes são reutilizadas sem alterar a escala dos corpos. Ulisses recupera até 16 HP no final de sua sequência.

Felipence acumula três marcas de ressonância com normais confirmados. Riff ou o último contato de Cadência do Caos consome a carga para uma explosão sonora com 18 de dano base adicional, sujeito à escala de combo. Receber um golpe ou ficar 240 ticks sem renovar perde a carga. Bateria, sangue e energia continuam recuperando 4/1/5 por contato que causa dano.

## Apresentação e desempenho

- Preparação e recuperação fazem transições entre desenhos inteiros, ancorados nos pés e na unidade calibrada. O quadro ativo de contato permanece exato. A visualização quadro a quadro da galeria continua mostrando desenhos individuais.
- Os 18 lutadores têm motivos de impacto por material/estilo: cortes, ondas, água, energia, tinta, circuitos, placas, corações, cálculos e gráficos. Rastros dos dois lutadores são pintados antes das figuras principais; o núcleo branco é menor. O HUD fica fixo durante o tremor.
- Cada uma das 17 arenas recebe objetos com três estágios de dano e destruição por golpes fortes/ruptura. Detritos, plateia e luz reagem à luta e às formas. Isso é cenário: não cria hitboxes ou dano oculto.
- Nove pares de rivais, cobrindo os 18 lutadores, têm provocações, respostas e falas de vitória específicas. O primeiro diálogo tem legendas e pode ser pulado com Soco/Chute depois dos primeiros 30 ticks. A resposta é apresentada antes do anúncio de luta; no celular há texto junto dos controles.
- **Detalhe dos efeitos** oferece Automático, Alto e Leve. Automático ajusta somente rastros, raios e partículas pelo tempo de desenho medido, com margem para não oscilar a cada quadro. Leve reduz reflexos e efeitos, preservando a arte dos personagens e a simulação. Gradientes são reutilizados e partículas fora da câmera são descartadas apenas no desenho.

## Verificação

80 verificações novas cobrem guarda, ruptura, recuperação, imunidade, postura, limites de combos, ressonância, destruição real, diálogos, protocolo e orçamento visual. As 90 rotas passam por teclado, toque, máscaras online, ambos os lados e espelhamento; a suíte de combos soma 1.207 casos. A suíte completa, typecheck e build passaram.

O Canvas foi exercitado nos 17 cenários, com os 18 motivos e transições de preparação/contato/recuperação. Um ensaio Full HD em Chromium com duas formas e efeitos simultâneos fez 20 operações de imagem no Alto e 12 no Leve; o tempo médio de desenho caiu aproximadamente 17% nesse ambiente. Essa medição de software não representa FPS garantido em aparelhos físicos.

No navegador, o treino confirmou seis acertos em pé pelo teclado e pelo toque, ruptura de guarda por pressão real, abertura para punição, galeria, ficha de pressão e preferência gráfica persistente. Celular emulado em 390×844/DPR 3 e 844×390 manteve os 12 controles. Dois clientes autenticados pelo relay confirmaram guarda mantida pelo toque, ruptura, resistência, cenário e sequência de seis contatos sincronizados. Não foi feito teste em celular físico.

O protocolo online é `dw-online-13`: resistência, ruptura, ressonância, sequências e dano do cenário viajam nos snapshots. Payloads antigos ou inválidos são rejeitados antes de alterar o jogo. Contas e banco permanecem no esquema existente. Campanhas, replays e gravação de sequências não fazem parte desta atualização.
