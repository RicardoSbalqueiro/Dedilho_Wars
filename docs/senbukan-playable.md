# Senbukan — protótipo jogável 3D

Wars of Champions → Senbukan abre um treino em arena 3D entre Karatê Caetano e um aluno com IA. O runtime desta versão é **Three.js/WebGL**, com modelos realmente tridimensionais e animações esqueléticas exportadas do Blender. Não se trata de um build Unity. O projeto Unity continua em `unity/SenbukanPrototype` e no download separado; sua compilação ainda está pendente.

## Jogar

Clique em **Começar treino**. WASD / setas movem em relação à câmera; J encadeia três socos; K chuta; U dispara Dedilho; E mantém defesa; Shift dá dash; Espaço pula; F ativa Karatê Prime; Q fixa/libera alvo; arrastar a arena gira a câmera; roda do mouse ajusta distância; P / Esc pausa e R reinicia. Celular tem direcional e botões com múltiplos toques simultâneos.

No painel de pausa é possível mudar o aluno entre adversário ativo, alvo parado e defesa constante. Qualidade Leve reduz a resolução e desliga sombras. As opções valem apenas para o treino.

## Regras

- Simulação fixa em 60 Hz, movimentação planar limitada ao piso do dojo, salto com gravidade, colisão entre corpos.
- Três socos encadeados com janela de entrada, chute, projétil com colisão contínua, recuperação e acertos em pé.
- Guarda tem recurso próprio. Bloqueios repetidos quebram a guarda e abrem uma janela para atacar.
- Prime custa 60 de energia, dura 10 segundos de simulação, torna o lutador invulnerável e atravessa a guarda. Energia se regenera e também aumenta ao acertar.
- IA aproxima, ataca, defende e ativa Prime. KO encerra o sparring; recomeçar restaura os lutadores.
- Pausar / sair da aba libera entradas pressionadas e impede que o tempo acumulado avance o combate ao retornar.

## Arte e execução

`blender/export-web.py` transforma os FBX do projeto em três GLBs independentes, sem texturas externas. `src/assets/senbukan/3d/manifest.json` documenta hashes, dimensões, 20 ossos e 13 clipes por personagem. Caetano tem 1,83m e o aluno 1,78m. Normalização ocorre uma única vez no asset, com pivô nos pés; não há alteração de escala por quadro.

O salão usa madeira, lanternas, emblema Senbukan e cidade violeta ao fundo. Materiais toon, luz de recorte, sombra, partículas limitadas, ondas de impacto, projéteis e aura de Prime compõem o treino. A câmera acompanha Caetano e pode orbitar o alvo. A resolução possui limite de pixels, sobretudo no celular. Recursos gráficos, RAF, ouvintes e requisições são descartados na saída.

O ZIP completo contém o código e os GLBs. JOGAR.html incorpora os modelos da arena para permitir o treino offline sem fetch de arquivo local. O restante da arte/música continua na pasta src/assets.

## Validação e limites

Testes em `tests/senbukan3d.test.ts` verificam regras reais de movimentação, salto, dash, combos, guarda, Prime, projéteis, IA, KO/reset e estrutura dos modelos animados. A validação local no Chromium verificou o fluxo com teclado e toque: IA ativa, ossos animados durante o soco, movimento, sequência, chute, projétil, defesa/quebra de guarda, Prime, câmera, KO/reinício, pausa/blur, descarte/reentrada e dois tamanhos de tela móvel. O teste de toque enviou dois dedos reais pelo protocolo do navegador para combinar direcional e soco, além de cancelamento/liberação. O navegador de teste usa renderização por software; isso não mede o desempenho de um celular físico.

É um experimento de combate, com arte de estudo, apenas um duelo e sem campanha narrativa. Não há rede neste modo. Não implica desempenho medido em todos os aparelhos nem execução validada no Unity.
