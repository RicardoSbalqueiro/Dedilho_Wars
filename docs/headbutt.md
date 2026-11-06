# Defesa em E e Cabeçada em L

Padrão do P1: **E defesa**, **S + E defesa baixa**, **L Cabeçada**. P2 mantém Num 3 / barra para defender e ganha **Num 9 / [** para Cabeçada. Q/E continuam mudando categorias na seleção, onde não existe um lutador recebendo comandos de combate. No celular, CABEÇADA tem botão próprio; DEFESA continua sendo mantida com o dedo. Há reconfiguração no desktop e, com teclado conectado, também no menu móvel.

## Regras da Cabeçada

A nova ação `headbutt` foi acrescentada ao fim da lista de inputs (bit 13, valor 8192). Os bits anteriores são preservados. O protocolo final desta atualização é `dw-online-9`; cliente e Worker aceitam máscaras até 16383 e rejeitam bits fora da lista. O relay e a conexão direta transportam pressões e comandos mantidos.

Todos os 13 personagens têm poses próprias derivadas de sua postura, com retração e projeção da cabeça. O desenho mantém o corpo e os acessórios de cada um. O golpe é um normal de rank 3 com dano arredondado de `1,05 × dano do soco médio` do lutador. Alcance e altura acompanham sua silhueta; Jane continua menor, com alcance e força diferentes de Cristyan.

| Propriedade | Regra |
| --- | --- |
| Preparação / ativos / recuperação | 14 / 3 / 24 frames a 60 Hz |
| Recuperação extra no erro | 12 frames; compromisso total de 53 ticks se não conectar |
| Hitstun / blockstun | 20 / 12 frames |
| Vantagem teórica | −6 ao acertar, −14 ao bloquear no primeiro ativo; espaçamento e último ativo podem alterar a situação real |
| Guarda | Médio: bloqueável em pé ou agachado quando a hitbox toca a hurtbox |
| Chip, lançamento, armadura e invulnerabilidade | Nenhum |
| Cancelamentos | Pode entrar após normal de rank menor confirmado, na janela de seis frames já existente. Não sai para outro ataque, especial ou ULT por cancelamento. |
| Buffer / repetição | Usa o buffer existente de nove frames e o primeiro frame permitido. Segurar não repete. |
| Ar, agarrão e cinematográfica | Não interrompe esses estados. Um comando recente pode esperar o próximo momento legal; comandos antigos expiram normalmente. |

Errar ou atingir a defesa mantém recuperação real. A IA pode usar Cabeçada para punir um golpe próximo cuja recuperação restante permita o contato; as decisões de guarda continuam usando a ação abstrata `block`.

## Controles salvos

O preset antigo intacto do P1 (`block: KeyL`, demais comandos padrão) migra para E na defesa e L na Cabeçada, desde que E não pertença a um comando do P2. Perfis personalizados preservam os comandos existentes. Se L já estiver ocupado, a nova Cabeçada recebe uma tecla globalmente livre, sem roubar defesa, agarrão ou virada. A ação nova pode ser reconfigurada, e conflitos são mostrados pela configuração. Atribuições explícitas e teclas deliberadamente vazias são preservadas. A migração é determinística e não escreve no armazenamento até salvar os controles.

## Verificação

- `tests/headbutt.test.ts`: **180 casos** com todos os lutadores, ambos os jogadores, duas orientações, teclado, toque, inputs/snapshots online, migração e conflitos, guarda em pé/agachada sem chip, buffer, compromisso da recuperação, limites de cancelamento e transmissão do bit novo.
- As regressões de defesa existentes usam o novo E; as regras de defesa perfeita, Precisão, hitstun e blockstun continuam testadas.
- O teste de balanceamento compara todos os normais anteriores com o arquivo de referência; a nova Cabeçada é verificada separadamente.
- A API aceita a nova ação e continua recusando máscaras e eventos inválidos. As regressões dos 13 finishers e Ultimates permanecem na suíte completa.
- Navegador: E defende e L ataca; configuração exibe os dois e rejeita conflitos. Q/E preservados na seleção. Botões de toque testados em 390×844 e 844×390. Dois navegadores autenticados, usando relay HTTP, confirmaram Cabeçada remota pelo toque bloqueada por E sem chip e Cabeçada pelo teclado sincronizada. Nenhum erro JavaScript.
- `npm run typecheck`, `npm test`, `npm run build`, `npm run combos:audit` e `npm run animation:audit` verificam a atualização final.

Os testes automatizados verificam regras e regressões, sem declarar aprovação de equilíbrio por jogadores humanos.
