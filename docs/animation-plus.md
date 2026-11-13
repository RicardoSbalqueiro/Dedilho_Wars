# Animação ampliada

Esta atualização soma 864 desenhos novos aos 4.500 existentes: 36 folhas com 24 figuras completas, cobrindo os 18 lutadores e suas formas. O total é de 5.364 desenhos de personagens e efeitos. Desenhos e amostras de tempo são contagens diferentes.

Cada lutador ganha doze intermediários de ataques básicos (extensão e recolhimento de pL, pM, pH, kL, kM e kH) na base e mais doze na transformação. Os quatro desenhos anteriores de cada comando continuam presentes; o contato ativo conserva a mesma arte e o mesmo momento. As novas poses entram no fim da preparação e no início da recuperação, sem aumentar duração, alcance, dano ou janela de cancelamento.

Outros doze desenhos por forma cobrem impulso, duas passadas e frenagem do dash; subida, ápice, queda e pouso do salto; entrada na guarda, absorção, guarda baixa e ruptura. A seleção usa velocidade vertical, tempo real do dash, atraso de pouso, postura e estado da guarda. Uma pose explícita de ULT, agarrão ou captura tem prioridade. As 24 figuras de cada ULT permanecem preservadas.

As figuras estão em `src/assets/flow`, com hashes e registros de preservação do alpha no manifesto. `scripts/flow-assets.py` apenas separa figuras completas, adiciona margens transparentes e codifica WebP; não deforma membros nem inventa desenhos. Ulisses mantém a katana na base e usa braços na forma; Felipence mantém a guitarra; EVA, Jax e Megalodon têm suas anatomias próprias.

A escala usa uma unidade fixa por folha e forma, calibrada contra as posturas existentes. Cabelo, arma, mãos levantadas e a altura recortada de uma pose baixa não mudam a unidade a cada quadro. Baseline e apoio horizontal são independentes. O tamanho externo de EVA/Megalodon continua sendo aplicado uma vez pelo render do jogo.

Os novos efeitos incluem poeira direcional, ondas de pouso fixas no chão, filetes de ar, contorno reativo de defesa e frentes de pressão afiladas. São pintados atrás dos corpos, com centro de impacto aberto. O modo Leve e a redução de flashes diminuem a quantidade/intensidade. Nenhum efeito muda colisão ou snapshots online. Histórico de pouso é somente visual, em WeakMap, descartado após saltos de relógio.

O carregamento continua por seleção de lutadores. Folhas novas têm superfície de decodificação limitada no celular e compartilham o orçamento de 16 milhões de pixels dos desenhos de ação; o cache comporta mais páginas pequenas sem aumentar esse teto.

## Download

O ZIP continua completo, com código-fonte, imagens, músicas e JOGAR.html. O catálogo v2 reutiliza as mesmas ilustrações já hospedadas, com quatro downloads simultâneos e verificação individual de tamanho/SHA-256. O navegador une o prefixo de código compactado, os dados de arte e o diretório ZIP preparados no build. O resultado é um ZIP padrão com CRC, validado também por `zipfile`. Isso evita hospedar uma segunda cópia de todas as imagens e alocar um buffer adicional do arquivo inteiro apenas para calcular hash.

## Verificação

`tests/flow-art.test.ts` verifica inventário, hashes, distinção das figuras, acesso a todas as poses, preservação dos contatos e escala fixa. `tests/motion-effects.test.ts` verifica direção, pouso, guardas, detalhes, redução de flashes e ausência de mutação da simulação. `npm test` mantém os testes anteriores de regras, combos, recursos, formas, online e controles.

A galeria de animações inclui defesa baixa, guarda rompida e pouso. A prévia de salto acompanha a trajetória visual. Browser QA deve cobrir todas as bases/formas, controles de teclado/toque, orientação do celular e o download montado pelo botão. Medições de software Chromium não representam FPS garantido em aparelhos físicos.
