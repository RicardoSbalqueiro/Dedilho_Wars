# Otimização de carregamento e renderização

Os menus usam quatro páginas compactas com as 432 poses existentes. Elas substituem a abertura de 36 folhas de combate para desenhar a pancadaria de fundo. O cache compartilhado reaproveita essas páginas ao voltar ao menu e tem orçamento de pixels próprio para celular. `scripts/menu-assets.py` gera as páginas e mantém a escala, a posição e o ponto de apoio de cada pose.

Os 36 retratos, incluindo formas, vêm de uma única folha de recortes sem perda. Exibir o elenco, o perfil ou as barras de vida não exige carregar todas as folhas de corpo inteiro. As ilustrações completas, quadros de golpes e qualidade de imagem das lutas permanecem disponíveis.

O cenário ambiente do menu tem limite próprio de resolução e desenha a 30 Hz; o lutador principal continua com sua apresentação independente. Isso reduz o trabalho gráfico do fundo. A resolução do combate continua com o orçamento existente, incluindo 4K. O carregamento de imagens agora avisa apenas os observadores de arte, evitando redesenhar prévias estáticas de mapas a cada imagem recebida.

No Senbukan 3D, superfícies de paleta compatíveis compartilham chamadas de desenho. Cores são incorporadas aos vértices; geometria, normais, esqueleto, pesos e 13 animações por lutador são preservados. Materiais com texturas e outras características incompatíveis são mantidos separados. A pausa limita os desenhos e a aba oculta suspende a renderização 3D. Buffers de partículas vazios deixam de ser reenviados à GPU. A pausa do combate 2D também evita redesenhar a arena a cada atualização do monitor.

## Medições de desenvolvimento

Chromium, contextos novos, mesmos tamanhos de tela e semente de aleatoriedade. Os valores de recursos abaixo somam uma vez o corpo de cada URL solicitada até o menu estar carregado; não incluem o HTML inicial. A medição compara a versão 33 com esta atualização.

| Medida | Versão 33 | Atualização |
| --- | ---: | ---: |
| Recursos únicos do início no PC | 20,65 MB | 10,29 MB |
| Recursos únicos do início no celular | 20,16 MB | 8,59 MB |
| Novas imagens ao retornar do treino ao menu | 36 | 0 |
| Pixels do canvas ambiente no celular testado | 2.073.600 | 921.600 |
| Chamadas de desenho da cena 3D testada | 51 | 13 |
| Geometrias da cena 3D testada | 50 | 12 |

As medições de tempo dependem da aceleração gráfica e da máquina. O ambiente de teste usa renderização 3D por software e não estabelece uma promessa de FPS em aparelhos físicos. A simulação, os comandos, o dano e o protocolo multiplayer continuam com as regras existentes. O download completo contém as artes originais e as cópias compactas usadas pelos menus; sua finalidade é incluir o jogo e todos os fontes.

## Verificação

- `npm run typecheck`, `npm test` e `npm run build`.
- Testes dos arquivos GLB reais: posições animadas e cores antes/depois, incluindo deslocamento e rotação da raiz, nas 13 animações; ordem de faces e limites de geometria espelhada.
- Calibração dos 432 quadros do menu, limites dos atlas e orçamento de resolução ambiente, mantendo a resolução nativa de combate.
- Fluxos de navegador: menu, treino, avaliação, XP verificado, oponentes de Twitchcity, comandos P2, gravação/reprodução e toque simultâneo em telas vertical e horizontal.
- Download completo: SHA-256, CRC, fontes atuais, jogo local com API bloqueada, treino 3D e versus clássico.

A varredura pelo identificador de computador informado pelo proprietário não encontrou ocorrências nos arquivos do jogo ou nos pacotes inspecionados. O identificador pessoal não foi incluído nos novos fontes ou neste documento.
