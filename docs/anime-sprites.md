# Arte anime, armas e transformações

Os 18 lutadores usam ilustrações em estilo de anime japonês, inspiradas nos cartazes fornecidos. Cada um tem uma folha base e outra de transformação, com rostos, roupas e silhuetas próprios. Santox veste moletom roxo, colete tático preto e cargo comprida com tiras roxas; Ulisses conserva o sobretudo, chapéu e katana; Felipence conserva a guitarra e o traje de roqueiro. Jane/EVA, Santox/Jax, Patrick/Rei Tatu, Gabrielzin/Gatito, Orango/Albino 00 e Tubarão/Megalodonte têm silhuetas de transformação distintas.

São **36 atlas WebP e 432 poses ilustradas**, doze por folha: guarda, postura do cartaz, duas passadas, preparação, dois ataques, postura baixa, salto, bloqueio, reação e carga/vitória. A simulação mantém 60 Hz; o seletor usa estado, startup, contato e recovery reais. Os nove ciclos e as 1.098 amostras internas por lutador servem à cadência e às âncoras de contato, e não representam novas ilustrações a cada amostra. A arte não deforma braços, pernas ou rostos por articulação procedural.

`src/game/anime-sprite.ts` apresenta as folhas e recorta os retratos. O cache de corpos limita imagens e pixels decodificados; pequenos retratos ficam em superfícies separadas para impedir recarregamento contínuo ao navegar pelas categorias. Partidas carregam as duas bases e formas necessárias. `anime-motion.ts` dá prioridade às reações reais, inclusive lançamento, sobre direções de guarda/agachamento mantidas. Cinematográficas usam os nomes de suas ações. As antigas âncoras em `rig.ts` permanecem invisíveis e conservam pontos de contato/efeitos do motor.

## Acessórios nos normais

| Personagem | Uso |
| --- | --- |
| Ulisses | Katana nos normais de mão, perna, baixos e aéreos; cortes horizontal e descendente |
| Felipence | Guitarra nos normais, com batidas horizontais e por cima |
| Bieu | Chave de fenda nos normais de mão, baixo e aéreo |
| Aneninha | Lata de spray nos normais de mão, baixo e aéreo |

Cabeçadas e agarrões conservam a própria ação. Acessórios vestidos não viram armas sem indicação da ficha. As armas estão nas ilustrações; rastros ativos e sons de metal, guitarra ou lata acompanham o contato. `accessories.ts` só acrescenta identificação e nomes aos normais: dano, alcance, hitboxes, startup, ativos, recovery, whiff e recursos permanecem iguais à versão de combate anterior. Não cria projétil nem contato adicional.

## Dez segundos para todos

Todas as formas usam `RESOURCE_RULES.transformationFrames = 600`: dez segundos de simulação ativa desde a manifestação da transformação. A preparação anterior continua interrompível. Pausar congela o contador, e o fim inicia a recuperação específica do personagem.

Stamina, bateria e sangue continuam finitos, mas não antecipam o término. Fôlego esgotado restringe ações; bateria vazia impede lasers de EVA; Ulisses só cura quando tem sangue, consumindo um estoque a cada cinco segundos. Custos de entrada, multiplicadores e efeitos posteriores continuam próprios de cada forma. KO, fim de round e reinício continuam encerrando a partida/estado normalmente.

## Assets e distribuição

`scripts/sprite-assets.py` empacota figuras completas em células isoladas, incluindo lâminas, guitarras, cabelos e casacos que ultrapassavam a divisão regular da imagem original. O manifesto registra limites, baseline de cada linha, recorte do retrato, SHA-256 da fonte e do WebP, contagens de pixels e o método de separação. A codificação preserva alpha e não redesenha a arte. O script requer Pillow, NumPy e SciPy somente para reconstruir os assets; desenvolvimento e build usam os WebP já incluídos.

Os 36 WebP somam 20.355.192 bytes. Todas as 432 células preservam os pixels visíveis/opacos das fontes e têm margem mínima de 10 pixels. As URLs externas evitam colocar vinte megabytes de arte no HTML inicial. `scripts/package.py` inclui os assets no ZIP e reescreve as URLs para `src/assets/sprites`, de modo que `JOGAR.html` funcione com `file://`. A página `/baixar/` monta e valida um único ZIP por SHA-256 a partir de partes abaixo do limite de hospedagem. Os sete MP3 permanecem locais.

## Validação

- Integridade dos 36 atlas, hashes, limites e retratos; 432 poses preservadas, incluindo a guitarra de Felipence nas doze poses de transformação.
- 26 regressões de arte/acessórios: frame data comparado ao release anterior, acertos/bloqueios nos dois lados, um único contato, ausência de projéteis extras, snapshots e seleção de reações.
- 121 regressões de War of Champions, incluindo 18 testes de duração exata de 600 ticks com recursos zerados e pausa.
- Seletor conferido em 1.584 combinações de normais/fases, incluindo os seis normais baixos com acessórios.
- Canvas real: 432 poses e 36 retratos carregados e desenhados sem erros. Preview de produção em 1920×1080, celular 390×844 com DPR 3 e rotação: katana e guitarra aparecem na fase ativa; retratos e controles continuam utilizáveis.
- Suites completas de combate, recursos, controles, resolução e API passaram; auditoria de 72 rotas contra defesa mantida passou.
- O navegador montou o ZIP de duas partes e confirmou tamanho/SHA-256; treino com Felipence e Ulisses passou usando somente o pacote extraído, servido localmente. A política do navegador gerenciado bloqueia URLs `file://`, portanto a abertura direta do arquivo não foi validada nesse ambiente.

A duração uniforme de dez segundos é a regra pedida para este release. Multiplicadores de força/defesa e custos continuam experimentais; esta validação comprova funcionamento, não equilíbrio competitivo com jogadores humanos.
