# The Artist's Way — Companheiro — ai/CHANGELOG.md

> Histórico narrativo completo de cada entrega — causa-raiz, como foi
> testado, decisões tomadas, arquivos tocados. **Não é carregado
> automaticamente** em nenhuma sessão; abrir só quando precisar entender
> o "porquê" de algo específico. O `PROGRESS.md` (raiz do repo) tem só o
> índice curto (1-2 linhas por entrega) apontando pra cá.

## 2026-08-12

1. **Ícones pequenos demais no Android** (launcher + notificação): o
   glifo de `logo.svg` ocupava só ~35% do canvas nos PNGs gerados.
   Criado `scripts/generate-icons.js` (Chrome headless + CDP, sem
   sharp/puppeteer) que regera os PNGs com bem menos margem. Também
   adicionado **adaptive icon** do Android
   (`mipmap-anydpi-v26/ic_launcher(.xml|_round.xml)` +
   `drawable/ic_launcher_background.xml`, cor `#A8752C`) pra launchers
   modernos (Android 8+) pararem de aplicar padding extra por cima do
   PNG legado.
2. Mesma correção de margem aplicada nos tiles do UWP
   (Square44/71/150, Wide310) e no ícone do PWA (que ainda usava um
   design **placeholder** diferente — uma pena estilizada — corrigido
   pra usar o mesmo `logo.svg`).
3. **Revertido**: o `BackgroundColor` da tile UWP tinha sido trocado
   pra `#A8752C` fixo por engano — o valor original `"transparent"` é
   proposital (convenção do Windows: tile "transparent" herda a cor de
   acento escolhida em Personalização do sistema, não uma cor fixa do
   app). Revertido pro comportamento original.
4. `CLAUDE.md` global (`~/.claude/CLAUDE.md`, fora deste repo) ganhou
   regras novas: sempre responder em PT-BR, sempre relatar mudanças e
   manter este `PROGRESS.md`, e documentar cores/design no `CLAUDE.md`
   do projeto (ver seção nova "Identidade visual" lá).
5. **Ícone grande demais** (feedback do usuário comparando com o app
   eBoox lado a lado): reduzida a escala do glifo em `generate-icons.js`
   em todo mundo — launcher/round Android `0.8→0.7`, adaptive icon
   foreground `0.58→0.51`, tiles UWP `0.8→0.7`, PWA `icon-192`/`icon-512`
   `0.8→0.7` e `icon-maskable-1024` `0.62→0.54` (mesma proporção,
   mantendo a zona segura do maskable).
6. **Semanas 3 e 7 sem "toque pra abrir" no checklist**: varredura em
   todas as 12 semanas mostrou que só a 3 e a 7 tinham **zero** itens de
   checklist com `link` pra uma ferramenta (as outras semanas têm pelo
   menos os itens list-worthy linkados). Corrigido:
   - **Semana 3**: 6 ferramentas novas em `TOOL_CONFIGS`
     (`tracosInfancia`, `conquistasComidasInfancia`,
     `habitosAutodestrutivos`, `amigosQueNutrem`, `pessoasQueAdmiro`,
     `pessoasFalecidas`), linkadas nos itens correspondentes do
     checklist.
   - **Semana 7**: a ferramenta `jealousyMap` ("Mapa do Ciúme") já
     existia com `week: 7` mas nunca tinha item de checklist —
     adicionado um novo item linkando ela (o ensaio da semana já
     descrevia esse exercício, só faltava a entrada no checklist). Os
     itens "filmes favoritos"/"temas de leitura" ganharam ferramenta
     nova `filmesTemasLeitura` (não reaproveitei `meusFavoritos` porque
     o formato não bate: lá é um valor único por categoria, aqui é uma
     lista de 5).
   - `arqueologia` (também `week: 7`) **continua sem uso** — o conteúdo
     dela (o que faltou na infância / inventário positivo de hoje) não
     bate tematicamente com o ensaio da Semana 7 (perfeccionismo, risco,
     inveja, colagem). Provavelmente devia ser `week: 9` ou `10`
     (mesmo grupo de "Limites e memórias" que `resentimentosMedos`,
     `retornosEmU`, `bottomLine`, `pontosFelicidade`, `totemArtista`) —
     não mexi nisso ainda, fica registrado pra decidir depois.
   - Testado de ponta a ponta via Chrome headless antes de commitar:
     todos os 6+3 links renderizam o "Toque aqui para abrir" certo e
     abrem a tela da ferramenta, sem erro de console.
7. **Auditoria completa nas 12 semanas** (usuário pediu pra verificar
   tudo, não só o que já tinha sido reportado): lidas as 12 semanas
   inteiras (não só contagem de link) pra separar item "ação/físico"
   (legitimamente sem ferramenta) de item "liste X" sem lugar nenhum
   pra escrever. Fechados os 8 gaps reais nas Semanas 8-12:
   - 2 links fáceis (ferramenta já existia, só faltava o item de
     checklist apontar pra ela): Semana 12 → `crencasNegativasViloes` e
     `minhasAfirmacoes` (esta última já tinha `alsoWeeks: [12]` mas
     nenhum item usava).
   - 8 ferramentas novas: `coisasQueNaoPosso` (Semana 8),
     `metasAnoMesSemana` (Semana 9), `osFatais`, `amizadesDuvidaCrenca`,
     `vitoriasCuidado` (Semana 10), `inventarioMudanca`,
     `cuidado6Meses` (Semana 11), `pessoasCompartilharSonhos`
     (Semana 12).
   - Testado de ponta a ponta via Chrome headless de novo antes de
     commitar, sem erro de console.
   - **Zona cinzenta registrada, não implementada** (usuário decidiu
     adiar): ~11 prompts de escrita única (não são "liste 5", são só
     uma reflexão) que poderiam virar tela própria mas hoje ficam sem
     link, sem quebrar o padrão das semanas já fechadas:
     - Semana 4: "que ganho em continuar travado(a) numa situação que
       deveria mudar"
     - Semana 8: "infância com cuidado perfeito"; "escreva-se como se
       fosse uma cor"
     - Semana 9: "reconhecer por escrito o valor das Morning Pages";
       "cena ideal" da meta realizada (2 itens do checklist já
       referenciam essa mesma cena — dá pra linkar os dois na mesma
       ferramenta se decidir fazer)
     - Semana 10: "qual hábito mais atrapalha + qual o ganho"; "3
       promessas gentis"
     - Semana 11: "planeje uma semana de autocuidado, uma ação por dia"
     - Semana 12: "resistências/medos/raivas sobre continuar sem
       suporte"; "áreas de procrastinação + medo por trás"; "recipiente
       de preocupações" (tipo diário, ongoing)

## 2026-08-23

1. **Cruzamento com checklist de terceiro (@jobsournal)**: o usuário
   trouxe 14 imagens (pasta OneDrive pessoal, fora do repo —
   `C:\Users\Rod\OneDrive\Documents\the-artists-way-tasks`) de um
   checklist condensado de terceiro cobrindo as mesmas 12 semanas do
   livro + Princípios Básicos + Afirmações Criativas. Lidas direto
   (sem OCR — leitura de imagem nativa) e cruzadas manualmente contra
   `www/js/data.js` semana por semana. Resultado: nenhuma lacuna nova
   encontrada — confirma que as ferramentas da leva de 2026-08-12
   (Semanas 8-12) e a zona cinzenta documentada abaixo são fiéis ao
   livro de verdade (ex.: `osFatais` bate com a "Deadlies Exercise" do
   checklist de terceiro, `pontosFelicidade` bate com a "Touchstones
   List", `totemArtista` com o "artist totem", `cadernoDesejos` com o
   caderno de 7 páginas/10 desejos, `sincronicidade` com as "10
   synchronicities"). As imagens não entraram no repo, ficaram só na
   pasta pessoal do usuário — não é uma decisão pendente, é só registro
   de que essa verificação cruzada foi feita.

2. **Zona cinzenta fechada** (as ~11 reflexões únicas do livro,
   Semanas 4/8/9/10/11/12, documentadas como pendência na entrega de
   2026-08-12 item 7): criadas 10 ferramentas novas em `TOOL_CONFIGS`
   (`www/js/data.js`):
   - `situacaoQueDeveriaMudar` (Semana 4) — a situação que deveria
     mudar + o ganho de continuar travado(a) nela.
   - `euComoCor` (Semana 8) — escrever-se na primeira pessoa como uma
     cor.
   - `valorMorningPages` (Semana 9) — reconhecer por escrito o valor
     das Morning Pages até aqui.
   - `cenaIdeal` (Semana 9) — a cena ideal da meta realizada, escrita
     no presente; referenciada por 2 itens de checklist diferentes
     (escrever a cena, e reler/deixar visível a cena) — mesma
     ferramenta pros dois, como já estava previsto na nota do item de
     2026-08-12.
   - `habitoQueAtrapalha` (Semana 10) — hábito que mais atrapalha +
     ganho escondido em mantê-lo.
   - `promessasGentis` (Semana 10) — lista de promessas gentis a si
     mesmo(a).
   - `semanaAutocuidado` (Semana 11) — lista dia+ação de uma semana de
     autocuidado.
   - `resistenciasMedosContinuar` (Semana 12) — resistências, medos e
     raivas sobre continuar sem o suporte das 12 semanas.
   - `areasProcrastinacao` (Semana 12) — áreas de procrastinação +
     medo por trás de cada uma.
   - `recipientePreocupacoes` (Semana 12) — "pote de preocupações"
     digital, tipo diário contínuo.
   Todas linkadas nos itens de checklist correspondentes via
   `link: { type: "list", key: "..." }`.

3. **Corrigido o mismatch de semana da ferramenta `arqueologia`**:
   estava com `week: 7` mas o conteúdo dela (o que faltou na infância +
   inventário positivo de hoje) não batia com o tema da Semana 7. Em
   vez de criar uma ferramenta nova pra cobrir o item de checklist da
   Semana 8 "escreva sobre a infância que você teria tido com o cuidado
   perfeito" (que também fazia parte da zona cinzenta), reaproveitada a
   `arqueologia` já existente pra esse item — mudado `week` de 7 pra 8
   e linkado o item de checklist da Semana 8 a ela. Resolveu os dois
   problemas (mismatch de semana + gap da zona cinzenta) numa cajadada
   só, em vez de duas ferramentas quase-duplicadas.

4. **Validação**: rodado um script Node que confere se todo `link.key`
   do checklist de todas as 12 semanas existe em `TOOL_CONFIGS` —
   resultado final: 72 links tipo "list" no total, zero quebrados, 63
   entradas em `TOOL_CONFIGS`. Também rodado um teste E2E via Chrome
   headless (protocolo CDP, mesma técnica das entregas de 2026-08-12) —
   abriu cada semana afetada (4, 8, 9, 10, 11, 12), confirmou a
   contagem de `.item-link` renderizados por semana (5, 8, 6, 7, 7, 7
   respectivamente), navegou pra cada uma das 11 rotas novas/
   reaproveitadas (`#/list/{key}`) e confirmou que título e subtítulo
   corretos aparecem na tela, e checou que não há nenhum erro de
   console em nenhuma das navegações. Script de teste:
   `scripts/generate-content-json.js` reaproveitado como gerador; teste
   E2E ficou só no scratchpad da sessão (não versionado no repo).

5. `content.json` regenerado (`node scripts/generate-content-json.js`)
   pros dois apps nativos (UWP e Android) — teve que rodar **duas
   vezes**: a primeira vez foi logo depois de criar as 10 ferramentas
   novas em `TOOL_CONFIGS`, mas antes de linkar os itens de checklist a
   elas, então saiu desatualizado; rodado de novo depois de adicionar
   os links, e confirmado em dia via `--check`.

6. Versão bumpada nas 3 plataformas: UWP `Package.appxmanifest`
   `42.2.0.23 → 42.2.0.24`; Android `build.gradle.kts` `versionCode
   31→32`, `versionName "42.2.0.23"→"42.2.0.24"`; PWA
   `service-worker.js` `CACHE_NAME` `"...v11"→"...v12"`.

7. **Resultado**: as 12 semanas do livro agora têm 100% dos itens de
   checklist "liste/escreva X" com link "toque pra abrir" pra uma
   ferramenta — não sobra mais nenhuma reflexão do livro sem lugar pra
   escrever no app. Fecha de vez o item "zona cinzenta" que ficava
   pendente desde 2026-08-12.

8. **Auditoria (só reconhecimento, nada implementado) do retrofit de
   `UI_STRINGS`**: o usuário sinalizou que quer corrigir o fato de boa
   parte do texto de UI ainda estar hardcoded em cada plataforma em vez
   de vir da fonte única. Rodada uma auditoria (sem editar nenhum
   arquivo) pra mapear o tamanho do trabalho antes de começar. Resultado:
   - Hoje só ~30 chaves em `UI_STRINGS` (`www/js/data.js`) — cobre nav
     labels e títulos de card.
   - Estimativa de ~150-200 conceitos de texto distintos ainda
     hardcoded e triplicados entre PWA/UWP/Android (~450-600
     ocorrências brutas de texto repetido).
   - Categorizado em baldes por risco/esforço:
     1. **Títulos de tela "bespoke"** (~8 strings, idênticas nas 3
        plataformas, 3-4 cópias cada — ex. "Princípios Básicos",
        "Círculo de Segurança", "Life Pie"). Hardcoded em
        `www/js/app.js:1580-1590` (`BESPOKE_TOOL_SCREENS`),
        `uwp/.../FerramentasPage.xaml.cs:44-51`,
        `android/.../FerramentasScreen.kt:37-46`, e ainda uma 4ª cópia
        em `WeekDetailScreen.kt:138`/`MainShell.kt:209`. **Risco
        zero** — strings idênticas, só criar uma fonte única e apontar
        as 4 cópias pra lá.
     2. **Botões de ação/config** (~15-20 strings, quase idênticas) —
        "Exportar backup", "Sair", "Apagar todos os dados", etc.
        Exemplo de divergência pequena: PWA/UWP usam "Exportar backup
        (.json)", Android só "Exportar backup" (falta o "(.json)").
        **Baixo risco.**
     3. **Diálogos de confirmação** (~6 strings) — "Apagar todos os
        dados?", "Resetar o app completamente?" + corpo da mensagem.
        Batem quase 100% entre as 3 plataformas. **Baixo-médio risco.**
     4. **Onboarding** (33 ocorrências XAML no UWP, 9 no Android) —
        não confirmado se o texto bate 1:1 entre plataformas ou se
        cada uma escreveu a explicação com palavras diferentes.
        **Risco médio** — precisa comparar conteúdo antes de decidir
        se unifica ou reescreve uma versão canônica.
     5. **HomePage dinâmica** (11 ocorrências `.xaml.cs` no UWP, 3 no
        Android) — strings com interpolação de estado (`"Dia {X} de
        {Y}"`, `"Continuar na Semana {N}"`, saudação com nome). Além
        de dinâmicas, a **estrutura de UI diverge entre plataformas**:
        UWP tem um botão-toggle pra Morning Pages, Android mostra "Ver
        checklist da semana" como link — não são o mesmo componente.
        **Alto risco/trabalho** — exigiria sistema de template com
        placeholders e possivelmente redesenhar a paridade de
        componente antes de unificar o texto.
   - Recomendação da auditoria: baldes 1-2 cobrem ~25-30 strings, são
     baixo risco (idênticas ou quase) e resolvem o pior caso de
     manutenção (editar 1 palavra em 3-4 lugares) — bom primeiro corte.
     Balde 3 é extensão natural do mesmo corte. Baldes 4 e 5 exigem
     decisão de conteúdo (onboarding) ou de arquitetura (Home dinâmica
     com componentes diferentes por plataforma) antes de mexer — não
     são "só mover string", são retrabalho de verdade.
   - **Nada foi implementado ainda** — só o mapeamento. Fica registrado
     em "Possíveis próximos passos" do `PROGRESS.md` como próxima
     prioridade.
