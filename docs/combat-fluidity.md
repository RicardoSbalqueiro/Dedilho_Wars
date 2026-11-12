# Animação ilustrada e efeitos de combate

O renderizador anterior dispunha de doze desenhos por forma. Os muitos valores interpolados de articulação eram âncoras invisíveis e não acrescentavam desenhos ao personagem. Esta atualização inclui **432 ilustrações novas**: dezoito atlas WebP com doze desenhos da base e doze da transformação. A coleção passa a **864 desenhos, 24 por forma**, preservando as 432 imagens originais.

## Movimento e contato

`sprite-timeline.ts` intercala as imagens originais e novas. A caminhada tem seis poses; os ataques têm preparação, recolhimento, extensão, contato, continuidade e retorno à guarda. Golpes rápidos percorrem essa sequência dentro de sua duração existente. A primeira fase ativa dos socos mantém o desenho de contato. Ataques baixos, aéreos, recuperação ao levantar e preparação da transformação recebem seleção própria.

Ulisses usa a katana e Felipence a guitarra nas novas passadas e ataques horizontais/descendentes. Bieu conserva a chave de fenda e Aneninha a lata nos golpes de mão. As formas EVA, Jax, Rei Tatu, Gatito, Albino 00 e Megalodonte têm desenhos próprios. Rastros de ataques fortes agora conservam a aparência transformada.

`movePhase` também informa o progresso de startup e ativo; as fronteiras e a fórmula de recovery permanecem iguais. A apresentação local e a apresentação do visitante online interpolam os relógios visuais entre atualizações. Contato ativo, hitstop, mudança de comando e giro autoritativo conservam a resposta imediata. Os desenhos não criam colisões, dano, deslocamento ou contatos extras.

## Transformações

`form-effects.ts` acrescenta motivos próprios às dezoito formas: torii, cruz de energia, órbitas psíquicas, água, ilusões, galáxia, fúria, fumaça, glitch, xadrez, engrenagens, anéis de Muay Thai, símbolos do Brasil, placas de carapaça, patas/corações, sangue, ondas sonoras e painéis analíticos. A preparação tem expansão visual e a manifestação tem um pulso. Passadas levantam poeira, aterrissagens produzem ondas curtas e golpes recebem arcos e estilhaços no contato real.

Os efeitos usam o relógio da simulação. A opção de reduzir flashes atenua sua intensidade e celulares no modo automático usam menos elementos. Todas as transformações continuam durando **600 ticks ativos, dez segundos**; custos, recursos e efeitos posteriores permanecem no motor existente.

## Assets, memória e inspeção

`scripts/motion-assets.py` copia figuras completas das novas folhas, calcula margens, âncoras no chão e referências de escala por linha e codifica WebP com alpha preservado. Não estica membros ou rostos. O manifesto registra os 432 recortes, hashes das fontes e arquivos codificados. Os novos WebP somam **10.212.074 bytes**. O cache adicional limita imagens e pixels decodificados; partidas pré-carregam as folhas dos personagens escolhidos e conservam o desenho original enquanto um novo asset carrega.

A galeria em Treinamento → Laboratório → Animações permite escolher movimentação e nove ataques, alternar a transformação, pausar e inspecionar o tempo. A régua distingue amostras temporais de desenhos ilustrados. O ZIP de download inclui os 18 novos atlas e resolve suas URLs em `JOGAR.html`.

## Verificação

- `npm test`: todas as suítes existentes e 41 novas regressões de desenhos, fases, acessórios, duração, clocks locais/online e efeitos.
- Integridade dos dezoito atlas: 24 células distintas por arquivo, hashes, transparência, limites e âncoras válidos.
- Canvas real: 6.912 combinações dos dezoito lutadores, base/forma, ambos os lados, oito ataques, seis instantes e flashes normais/reduzidos. Foram desenhados 3.920 quadros novos e 2.992 originais, sem erros de Canvas. Revisão visual dos recortes e conferência de uma única silhueta completa por célula.
- `npm run typecheck` e build de produção.

As verificações automatizadas comprovam seleção dos desenhos e preservação das regras; a qualidade e a sensação do movimento também dependem da revisão visual no navegador.
