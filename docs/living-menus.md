# Menus vivos e Wars of Champions

O fundo do menu inicial usa todo o elenco de 18 personagens simultaneamente. O grafo de adversários troca entre vizinhos, permitindo vários ataques contra o mesmo rival. Todos compartilham a linha de chão y=470, inclusive quadros baixos, passos e formas aquáticas. O desenho reancora o limite inferior de cada pose ao chão. Não há saltos, lançamentos, projéteis ou Ultimates nessa demonstração: somente normais, reações em pé e transformações.

`menu-brawl.ts` gera estados de apresentação determinísticos pelo tempo. A preparação, contato e retorno dos normais são amostrados para deixar vários confrontos visíveis simultaneamente; os dados de movimentos e a simulação de partidas não são modificados. Cada forma tem uma janela visual de 600 ticks, como a duração de dez segundos do jogo. O quadro Arena Viva e o botão MAIS CAOS foram removidos. Cliques na área livre da arena ainda aceleram temporariamente a demonstração e disparam uma onda sobre o piso.

`menu-brawl-art.ts` prepara cópias menores das 36 folhas só para a multidão, com dois carregadores e orçamento de 28 milhões de pixels no desktop/12 milhões no celular. Descartar esse cache ao sair evita manter todas as folhas completas das lutas na memória. Retratos e partidas continuam usando seus assets normais. `FrameTimer` mantém a velocidade por tempo, sem acumular movimento da aba oculta.

## Galeria de campanhas

| Campanha | Personagem | Gesto de costas |
| --- | --- | --- |
| Senbukan | Karatê Caetano | Palma aberta e punho firme diante do dojo; disciplina |
| Resenha | Rickzera | Braço estendido para proteger aliados e energia no outro punho |
| Got | Renngotti | Cabeça baixa e punhos cerrados; raiva contida |
| Campeões | Bieubatman | Chave de fenda erguida diante de uma coroa; astúcia |

São quatro ilustrações originais em estilo anime, em 1024×1536 WebP, somando 1.280.672 bytes. Os quatro quadros mostram **Em breve**. Um quinto quadro anuncia mais campanhas. São uma prévia selecionável, sem campanhas jogáveis ou partidas falsas. Mouse, foco, setas e toque destacam o quadro e sua frase; as ilustrações têm descrição textual da pose. A grade usa cinco colunas em telas largas, três em telas intermediárias e duas no celular. A página rola naturalmente e mantém o retorno acessível. Partículas e brilhos respeitam a preferência de movimento reduzido.

## Música exclusiva

`src/assets/music/campaign-theme.mp3` é uma cópia exata do MP3 enviado pelo usuário, “Resident Evil OST-RE2 Ada's theme - AngelCaged.mp3”. Fica fora da lista da rádio. Entrar pelo botão inicia a reprodução no gesto do usuário, interrompe a rádio/síntese e repete a faixa em loop. A galeria oferece volume e, quando o navegador exige, TOCAR TRILHA; não oferece troca de faixa.

O `AudioEngine` bloqueia seleção, próxima/anterior, pausa e busca da rádio durante a galeria. O volume geral continua valendo. Ao sair, para o tema e restaura a escolha anterior, sua posição e a pausa do usuário. Eventos atrasados de reprodução não podem recolocar a rádio sobre o tema nem reiniciar a faixa após sair. Não é salvo um novo preset de estação ao entrar na galeria.

O empacotamento offline passa a conter 40 WebP (36 folhas e quatro cartazes) e oito MP3 (sete raps e a faixa de campanha), com caminhos locais reescritos no HTML. O download continua montando um ZIP único validado por SHA-256.

## Verificação

- Tipagem, build e suites completas de combate/API passaram.
- Regressões do menu verificam elenco completo, chão único, ausência de golpes aéreos/Ultimates, adversários que mudam, imutabilidade dos dados, relógios inválidos, campanhas e restauração/bloqueio de áudio.
- Preview de produção conferido em 1920×1080, celular 390×844 DPR3 e rotação 844×390, com os cinco quadros, seleção por foco/setas/toque, áudio real em reprodução, ajuste de volume e parada ao sair, sem erros de JavaScript.

A galeria anuncia conteúdo futuro; este release não implementa as quatro campanhas.

A estrutura atual dos menus, independente da escala da arena, está em [Menus responsivos](menu-layout.md).
