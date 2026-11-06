# Rickzera: design, três notas e Soco Inglês

O modelo vetorial animado agora usa camiseta preta de mangas curtas, braços expostos, calça cargo bege com bolsos e tênis preto com detalhes claros. O soco inglês dourado permanece na mão esquerda anatômica (`wF` neste modelo), inclusive quando o desenho é espelhado. A mão direita lança as notas. O modelo compartilhado atualiza luta, retratos, seleção, Wise 6x e finisher. Os nove ciclos continuam com 1.098 quadros distintos; a simulação continua a 60 Hz.

| Aspecto / golpe | Antes | Depois | Motivo e contrajogo |
| --- | --- | --- | --- |
| Visual | Moletom preto e calça preta | Camiseta preta, cargo bege, braços expostos, soco inglês dourado na esquerda | Seguir o novo pôster e manter a mão do acessório consistente. |
| Franco Suíço · U / ESP 1 | Uma nota de 52; preparação 12f, ativos 3f, recuperação 19f + 5f no erro | Três notas de 24; preparação 12f, ativos 13f, recuperação 19f + 5f no erro | Lançamentos nos offsets 0/6/12 após a preparação; ampliar o compromisso para acomodar a rajada. Velocidade 12 unidades/tick e um único uso da cota de distância. |
| Dano das notas | 52 em um contato | 64,8 em três contatos consecutivos isolados (24 + 21,6 + 19,2) | Escala existente por contato, sem triplicar o dano antigo. A defesa funciona nas três notas. |
| Linhas do Pix · I / ESP 2 | Três projéteis de 24; preparação 18f, ativos 7f, recuperação 23f + 9f | Removido; I / ESP 2 executa Soco Inglês | Mudança solicitada do kit de Rick; sem projétil residual. Wise 6x e finisher preservam seu gesto próprio. |
| Soco Inglês | Não existia | Um contato de 84; preparação 24f, ativos 5f, recuperação 29f + 14f no erro; blockstun 14f | Golpe forte próximo, sem agarrão, armadura, invulnerabilidade ou cancelamento gratuito. Guarda em pé bloqueia; guarda agachada perde. Errar compromete 72 ticks no total. |
| Alcance do Soco Inglês | — | Caixa horizontal de 15 a 118; passo curto entre ticks 15–21, 2 unidades/tick | Sem perseguição. O alcance real inclui o passo e a largura do rival. O dash continua sendo uma ação separada. |
| Acerto no chão | — | Lançamento descendente, derrubada e cratera apenas no pouso real | Energia verde no punho, arco, contato e rachaduras; metal continua dourado. Cratera dura 180 ticks, não causa dano e não altera colisão. |
| Resposta da IA | Podia escolher Pix à distância | Usa notas de longe e Soco Inglês perto; aproxima durante cooldown de distância | Evitar uso do novo golpe corpo a corpo fora de alcance. |
| Mobilidade, HP, Ultimate, finisher | HP 940, salto duplo, Wise 6x, Transferência Final | Preservados | Manter identidade e não acrescentar vantagens defensivas à troca de golpe. |

O limite global continua sendo três usos de distância seguidos de 300 ticks de recarga. As três notas usam uma cota juntas; Soco Inglês é corpo a corpo e continua disponível durante essa recarga. Notas já lançadas mantêm a direção depois de uma virada manual. Acertar Rick durante a preparação interrompe o golpe; notas ainda não lançadas não aparecem depois da interrupção.

No online, `dw-online-9` transmite o marcador da derrubada e prioriza crateras recentes em snapshots com muitas partículas. Versões anteriores são recusadas; os dois jogadores devem recarregar o jogo. Os comandos continuam U/I ou ESP 1/ESP 2, sem alteração nos controles personalizados.

## Validação

- `tests/rick.test.ts`: 40 regressões do novo kit, com rajadas reais, dano e chip medidos, guarda, preparação interrompível, erro punível, cooldown, virada e espelhamento, P1/P2, teclado, toque, entradas e snapshots online, cratera no pouso e recuperação do rival.
- `tests/challenges.test.ts`: desafio de três acertos usa a nova rajada do Franco.
- `tests/turn-defense.test.ts`: a virada após a rajada espera sua recuperação real.
- `tests/api.test.mjs`: relay aceita protocolo 9 e rejeita protocolo 8.
- `npm run combos:audit`: 52 rotas continuam válidas com defesa mantida. J → K → U de Rick agora conecta cinco contatos e causa 107,3 contra Cristyan no espaçamento de referência.
- `npm run animation:audit`: 1.098 quadros distintos por lutador, 14.274 no total.

No navegador, teclado e toque executaram as três notas e o Soco Inglês; a cratera e o dano de 84 foram sincronizados entre dois navegadores autenticados por relay HTTP, incluindo o golpe espelhado do convidado móvel. A inspeção de Canvas confirmou o acessório dourado e a energia verde. Nenhum erro JavaScript.

Essas medições são regressões automatizadas e referências de treinamento; não substituem testes de equilíbrio com jogadores humanos.
