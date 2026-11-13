# Senbukan — protótipo Unity + Blender

Estado: **projeto-fonte preparado; ainda não compilado nem executado no Unity**. O Blender 4.3.2 foi usado para modelar, rigar, animar, exportar e reimportar os FBX. O site já oferece um treino jogável separado em Three.js/WebGL, usando os GLBs e os clipes exportados dos mesmos modelos Blender. Este projeto-fonte Unity continua disponível para futura compilação e não deve ser confundido com o runtime atual do site.

## Abrir

1. Instale/abra Unity **2022.3 LTS** com o módulo **WebGL Build Support**. A versão de projeto é 2022.3.62f1. Unity não foi instalado nem licenciado pela atualização do site.
2. No Unity Hub, adicione esta pasta `SenbukanPrototype` e abra o projeto. O pacote oficial UGUI será resolvido pelo Package Manager.
3. Na primeira importação, o script de Editor prepara os prefabs e a cena `Assets/Scenes/SenbukanTest.unity`. Se necessário, use **Dedilho Wars → Preparar cena Senbukan**.
4. Abra a cena e pressione **Play**. Verifique importação, orientação, clipes, materiais, câmera, colisão, controles e áudio no Editor antes de gerar um build.

## Controles do protótipo

| Comando | Tecla |
| --- | --- |
| Movimento em arena | WASD |
| Socos encadeados | J |
| Chute | K |
| Defesa | E |
| Dash | Shift esquerdo |
| Pulo | Espaço |
| Dedilho | U |
| Karatê Prime | F |
| Alvo / câmera livre | Q |
| Orbitar / aproximar câmera | Botão direito / roda do mouse |
| Aluno parado / combate | T |
| Reiniciar | R |
| Pausa | P / Esc |

Há joystick e botões virtuais no código para dispositivos de toque. A câmera acompanha Caetano com alvo no aluno e consulta colisores do ambiente. O protótipo inclui golpes com janelas de contato, guarda recuperável, quebra de defesa e forma Karatê Prime de 10 segundos. A forma dobra o dano e impede dano recebido; consome energia. Estes comportamentos precisam ser verificados no Unity.

## Build WebGL e integração no site

Use **Dedilho Wars → Gerar WebGL para a campanha**. O comando prepara a cena, gera WebGL com gzip e decompression fallback e verifica o relatório do Unity. Somente após sucesso ele grava `public/senbukan/build.json` com `state: ready` e a entrada do jogo. O estado atual é `prepared` e não contém um build jogável.

Execute o build na estrutura de pastas extraída completa: a saída esperada é `public/senbukan/unity` na raiz do Dedilho Wars. Depois, valide o build em navegador e execute os checks, build e empacotamento do site antes de publicar. Não altere manualmente o manifesto para fingir que um build existe.

Atualmente `src/ui/SenbukanTestArea.tsx` abre o treino WebGL implementado em `SenbukanGame.tsx`. Um futuro build Unity validado poderá substituir essa entrada; o manifesto e o parser de validação continuam no projeto. O template Unity já possui retorno por `postMessage`, carregamento, erro legível, limite de resolução e liberação da instância. A integração do iframe deverá ser reativada e testada quando houver um build Unity real. Arquivos individuais da hospedagem devem ficar abaixo de 25 MiB; o script de build verifica esse limite.

## Arte e escala

- Caetano: modelo adulto com torso sem camisa, cabelo cacheado, calça branca, faixa preta, munhequeiras e pés descalços.
- Aluno: modelo distinto com gi índigo e faixa clara.
- FBX: rig genérico com malha ponderada e clipes de idle, walk, run, punch1–3, kick, guard, hit, jump, dash, transform e down.
- Dojo: salão de madeira à noite, iluminação dourada, emblema e vista roxa de Twitchcity, inspirado na referência fornecida. Área livre de aproximadamente 18 × 18 m; piso visível a 0,19 m.
- Os fontes `.blend` e os scripts de geração ficam em `blender/`, ao lado de `unity/` na raiz do pacote. Exportação FBX em metros, eixo vertical Y no Unity.

Não há campanha narrativa, multiplayer 3D ou substituição do combate 2D nesta entrega. Modelos, iluminação e animações são um estudo inicial para validação e refinamento, não arte final.
