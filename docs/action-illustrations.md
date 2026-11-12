# Desenhos de ataques e ULTs

O renderizador seleciona desenhos próprios pelo personagem, comando e transformação. A coleção de personagens e efeitos soma 4.500 desenhos em 206 atlas, além das quatro imagens de menu. Os 864 desenhos anteriores continuam disponíveis, com os modelos EVA e Ulisses transformado e suas passadas substituídos por arte coerente com as fichas.

A nova coleção em `src/assets/actions` contém 152 atlas e 3.636 desenhos: 2.160 para os quinze comandos de cada personagem nas duas formas, 864 para as 36 ULTs, 432 reações, 168 efeitos e doze quadros da moto esportiva. Preparação, extensão, contato e recuperação são figuras completas diferentes. O catálogo registra os retângulos, pivôs, alturas, pixels visíveis e hashes de cada folha; amostras intermediárias do relógio não são contadas como novas ilustrações.

As ULTs usam 24 figuras exclusivas por forma sobre os tempos de impacto já definidos pelo combate. O atacante se desloca, age e recupera a postura; o alvo recebe a reação correspondente, é lançado e cai. Objetos e energia têm suas próprias sequências de quatro desenhos. A pausa e o hitstop congelam a mesma linha de tempo; o desenho não aplica dano nem altera o estado da partida.

Jane usa uma esportiva carenada amarela, branca e preta nas empinadas, arrancadas e quedas. O AreiaZord/EVA tem carcaça branca volumosa, placas douradas, ombreiras largas, visor com piloto, crista em V e símbolo de ampulheta no peito. Ulisses preserva sua katana na base; transformado, usa as mãos enfaixadas e garras, com tronco exposto e sobretudo rasgado. O áudio também deixa de emitir cortes de espada nessa forma.

O cache decodifica duas folhas por vez, prioriza o desenho que está em uso, limita as superfícies por folha e mantém orçamentos de 16 megapixels no celular automático e 40 no desktop. Efeitos são carregados por lutador selecionado. As figuras continuam inteiras: o empacotamento não estica braços, rostos ou roupas.

A galeria de animação inclui todos os comandos, agarrão, reações e ULT. Permite alternar a forma, pausar e percorrer a sequência. A versão para download inclui as mesmas folhas e funciona offline com os arquivos extraídos.

Validação: hashes e geometria de todos os atlas, conservação dos pixels/alpha no empacotamento, cobertura de todos os comandos e das 24 figuras de cada ULT, comparação dos contatos visuais com os contatos reais, regressões do combate e inspeção no Canvas em desktop e emulação mobile. Os resultados estão no [relatório de validação](action-illustrations-validation.json): 93 novas verificações, 3.636 desenhos pintados em Canvas, 512 amostras de ULT, navegação/galeria no desktop e toque em celular emulado. A suíte completa, incluindo API, passou. Não houve teste em aparelho físico.
