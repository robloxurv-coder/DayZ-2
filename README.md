# WASTELAND — Survival Alpha 0.1.0

**SURVIVE. EXPLORE. ENDURE.**

Uma Alpha single-player de sobrevivência 2D top-down, com identidade visual própria, feita em HTML, CSS e JavaScript com Canvas 2D. A meta é demonstrar exploração, loot, perigo e sobrevivência sem frameworks, servidor, contas ou sistemas complexos.

## Executar

Abra **`index.html`** em um navegador moderno e clique em **JOGAR**. Todos os scripts, fontes e recursos necessários estão no projeto. Funciona offline por abertura local; não precisa de instalação, compilação, chave de API ou backend. Se publicado, o acesso à página exige conexão; não há service worker para instalar uma versão offline da URL.

Navegadores recomendados: Chrome, Edge, Firefox e Safari atuais. Desktop é a experiência principal. Há controles de toque para celulares. Sons só são habilitados depois de uma interação do usuário. Tela cheia depende do suporte e das permissões do navegador/iframe.

## Controles

| Ação | Controle |
| --- | --- |
| Mover | WASD |
| Correr | Segurar Shift |
| Mirar | Mouse |
| Atirar | Clique esquerdo (um tiro por clique) |
| Recarregar | R |
| Abrir/fechar porta, saquear, alimentar/acender fogueira | E |
| Abrir/fechar inventário | TAB |
| Pausar, fechar janela ou voltar | ESC |

**Celular:** setas na tela, botão CORRER mantido junto com uma direção, ATIRAR, E e R. O botão ATIRAR mira automaticamente no infectado mais próximo dentro do alcance; paredes ainda bloqueiam o tiro. Tocar no cenário mira e atira na direção tocada. MOCHILA abre o inventário e Ⅱ pausa.

**Dica:** você começa no Refúgio do Vale, próximo de uma caixa de suprimentos e uma fogueira. Use E para saquear; pressione TAB, selecione água/comida/bandagem e use o botão de ação. Entre na cidade ao norte. Disparos atraem infectados.

## Recursos concluídos

- Menu com ilustração original em Canvas: vale, montanhas, cidade, posto de combustível abandonado, carro, floresta, torre de rádio, postes e chuva. Sem imagens geradas por IA.
- Mundo fixo de **2.400 × 2.000 unidades**, com 8 construções, estradas, árvores, cercas, carros, postes, pedras, acampamento e pontos de loot.
- Movimento normalizado (diagonais não aceleram), corrida, stamina, câmera e colisões com paredes, portas, cercas, carros, troncos e limites do mapa.
- Casas exploráveis: E abre portas, e o teto dá lugar ao interior ao entrar. Personagens e tiros não atravessam portas fechadas.
- HUD de vida, fome, sede, stamina, temperatura, sangramento, arma equipada e munição.
- Minimapa com jogador, construções, fogueira e infectados próximos; localização, relógio, clima, FPS opcional, prompts e alertas.
- Inventário de **12 slots simples**, empilhamento por tipo e quantidades. Pistola equipada desde o início. Água, comida, bandagens, munição, madeira, sucata, pistola e ferramentas.
- Água recupera 38 de sede; comida recupera 32 de fome; bandagem estanca sangramento e recupera 12 de vida. Não consome item se o atributo já estiver cheio e não houver sangramento.
- Loot aleatório por local: casas/mercado, oficina/depósitos, área militar e suprimentos iniciais. Coleta individual ou total; caixas esgotadas não fornecem itens novamente.
- Combate com raycast: pistola de 8 tiros, 34 de dano, alcance de 560 unidades, intervalo de 0,27 s e recarga de 1,35 s. Tiros respeitam obstáculos e atingem o primeiro alvo.
- 12 infectados com espera, patrulha, detecção, perseguição, ataque, sangramento por probabilidade e morte. Corrida e tiros aumentam a atenção dos inimigos.
- Fome/sede caem lentamente, mais rápido ao correr. Atributos abaixo de 15 reduzem a stamina máxima para 55 e drenam vida. Sangramento causa dano contínuo até usar bandagem.
- Temperatura cai com chuva ao ar livre; construções protegem do frio da chuva. Fogueira aquece num raio de 108 unidades. Frio abaixo de 35 °C causa dano.
- Fogueira com animação, brilho e combustível. E consome uma madeira e adiciona 90 segundos de combustível; permite reacender o fogo apagado.
- Dia/noite acelerado: um ciclo completo dura 8 minutos, começando às 16:30. O anoitecer inicia às 17h; à noite há overlay escuro e visão circular reduzida.
- Clima normal/chuva: primeira chuva aos 45 segundos; depois alterna 60 segundos de chuva e 90 de tempo normal.
- Morte com resumo, botão RESPAWN e reinicialização do mundo, inventário e atributos.
- Configurações funcionais de volume, qualidade, FPS e tela cheia. Qualidade baixa reduz partículas, chuva e sombras de árvores.
- Efeitos sonoros sintetizados via Web Audio: tiros, passos, ataque, coleta, recarga, portas, consumíveis e chuva. Nenhum arquivo de som externo.
- Pausa por ESC, inventário, saque, diálogos, perda de foco ou aba oculta. Simulação e chuva sonora ficam pausadas; partículas decorativas podem continuar animadas.
- Interface responsiva, diálogos com foco, notificações, botões rotulados e respeito a movimento reduzido no menu.
- Fontes Barlow/Barlow Condensed WOFF2 locais, sob SIL Open Font License. Licença em `assets/fonts/OFL.txt`.

## Estrutura

```text
index.html                 Menu, HUD, controles e diálogos
style.css                  Estética, fontes locais e layout responsivo
js/
  world.js                 Mapa, itens, loot, colisões e utilitários
  audio.js                 Síntese Web Audio e volume
  renderer.js              Ilustração do menu, cenário, sprites, luz e minimapa
  game.js                  Loop, jogador, sobrevivência, IA e combate
  ui.js                    Inventário, loot, configuração e eventos de entrada
  tests.js                 Diagnósticos de integração
assets/fonts/              Quatro fontes WOFF2 e licença SIL OFL
tests.html                 Executor de diagnóstico com o jogo real em iframe
README.md                  Documentação da Alpha
```

Sem bundler, npm, dependências JavaScript, imagens remotas ou requisições de dados. Terreno e ilustração estática são cacheados em Canvas; objetos fora da câmera são descartados no desenho; DPR limitado a 1,6.

## URIs e URLs públicas

| Caminho | Função | Parâmetros |
| --- | --- | --- |
| `/` ou `/index.html` | Menu e jogo; todas as telas são locais à página | Nenhum |
| `/tests.html` | Executa diagnósticos no jogo real e deixa uma cena urbana de inspeção | Nenhum |
| `/style.css`, `/js/*`, `/assets/fonts/*` | Recursos estáticos locais | Nenhum |

**URL pública de produção:** ainda não publicada. Use a aba Publish para publicar o projeto; nenhum Hosted Deploy foi executado nesta entrega.

**APIs:** nenhuma. **Banco de dados:** nenhum. **Serviço de armazenamento remoto:** nenhum.

## Dados e armazenamento

- `WL.game.player`: posição, direção, atributos, sangramento, pente, recarga e temporizadores de movimento/efeitos.
- `WL.game.inventory`: objeto `{ itemId: quantidade }`; itens empilhados, até 12 tipos.
- `WL.items`: catálogo local, com nome, ícone, descrição e uso.
- `WL.game.world`: construções/portas, árvores, grama, veículos estáticos, cercas, postes, caixas, fogueiras, inimigos e decorações.
- Caixa: posição, categoria, itens sorteados na primeira abertura e marca `looted`.
- Infectado: posição inicial/atual, estado, vida, direção e temporizadores.
- `WL.game`: relógio simulado, clima, contadores de saques/mortes, tiros e partículas transitórias.
- `localStorage['wasteland-settings']`: apenas `{volume, quality, showFPS}`. Leitura/gravação protegida contra indisponibilidade de armazenamento local.
- **Partidas não são salvas**. Recarregar a página, voltar ao menu e jogar novamente ou usar respawn reinicia a partida. Não há coleta de dados pessoais nem analytics.

## Verificação

`tests.html` usa uma instância da página real em iframe e registra PASS/FAIL no console. Precisa ser servido pela mesma origem (preview ou hospedagem estática); o isolamento de `file://` de alguns navegadores impede diagnósticos entre iframe e página-pai. O jogo normal em `index.html` não tem essa restrição.

Foram executadas **36 verificações automatizadas, todas aprovadas**: início, WASD, corrida, pausa/inventário, consumíveis, saque sem duplicação, portas e colisões, dano/cooldown/morte de infectado, recarga e munição reserva, bloqueio de tiros, perseguição/ataque, fome/sede/stamina, chuva, temperatura/fogueira, dia/noite, configurações, morte e respawn. O executor usa eventos DOM e estados controlados; não substitui sessões de playtest humano nem certificação de desempenho em todos os dispositivos.

Menu e cenário jogável foram também conferidos visualmente em **desktop (1280 × 800)** e **celular (390 × 844)**, incluindo tipografia local, minimapa, atributos, munição e controles de toque. A página principal foi carregada sem erros de console.

O teste automático pode mostrar o aviso de política de autoplay do AudioContext porque cliques sintéticos não equivalem a interação física; no uso normal, áudio é inicializado pelo clique/toque do jogador. O teste deixa a simulação congelada para inspecionar a cena — abra `index.html` para jogar normalmente.

## Limitações intencionais / não implementado

- Sem multiplayer, servidor, banco de dados, autenticação, salvamento de personagem ou retomada de partida.
- Sem veículos dirigíveis, crafting, construção, economia, habilidades ou mapas gigantes.
- Sucata e ferramentas são recursos de demonstração; ainda não possuem receita/uso. Pistolas extras são loot, mas não há sistema de troca de arma nesta Alpha.
- IA simples por distância e desvio local: não há pathfinding; infectados não abrem portas e podem ficar bloqueados por obstáculos. Use construções como abrigo.
- Inventário, saque e diálogos pausam o jogo para manter esta Alpha acessível e enxuta.
- Iluminação aproximada em overlay; fogueira emite um brilho, sem sombras físicas. Chuva visual global, mesmo ao entrar em um interior; abrigo protege a temperatura corretamente.
- Ícones simples de Unicode/emoji podem variar conforme o sistema operacional.
- Sem controle por gamepad ou gestos avançados. Mobile oferece controles de demonstração; desktop com mouse e teclado é recomendado.

## Próximos passos recomendados

1. Playtests de equilíbrio: velocidade de fome/sede, distribuição de loot, detecção dos infectados e duração da chuva.
2. Melhorar desvio de obstáculos sem introduzir IA pesada.
3. Refinar legibilidade e controles em dispositivos menores após feedback real.
4. Adicionar um salvamento local opcional e poucas receitas de crafting somente em uma próxima versão.
5. Expandir gradualmente o mapa e conteúdo sem comprometer carregamento e desempenho.
