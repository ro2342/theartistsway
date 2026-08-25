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

## 2026-08-23 (2)

1. **Retrofit de `UI_STRINGS` — baldes 1, 2 e 3 implementados** (usuário
   pediu explicitamente pra fazer os três depois de ver a auditoria da
   entrada anterior). 20 chaves novas adicionadas em `UI_STRINGS`
   (`www/js/data.js`):
   - Bucket 1 (8 chaves `tools.*`): `principiosBasicos`,
     `tabelaCrencas`, `regrasDaEstrada`, `circuloSeguranca`, `lifePie`,
     `bancoAfirmacoes`, `artistDateHistory`, `checkinHistory`.
   - Buckets 2+3 (12 chaves `settings.*`): `export`, `import`,
     `signOut`, `clearData.button`, `clearData.confirmTitle`,
     `clearData.confirmMessageLoggedIn`, `clearData.confirmMessageLocal`,
     `clearData.confirmButton`, `fullReset.button`,
     `fullReset.confirmTitle`, `fullReset.confirmMessageLoggedIn`,
     `fullReset.confirmButton` (o botão "Cancelar" dos diálogos
     reaproveita a chave `common.cancel` já existente, não criou
     duplicata).
2. **PWA** (`www/js/app.js`): 19 pontos trocados de literal pra
   `UI_STRINGS[...]` — `BESPOKE_TOOL_SCREENS` (9 entradas), cada rota
   bespoke individual (`/principios-basicos`, `/tabela-crencas`,
   `/regras-da-estrada`, `/circulo-seguranca`, `/life-pie`,
   `/banco-afirmacoes`, `/artist-date-history`, `/checkin-history`),
   `resolveChecklistLink`'s `screens` map, os botões de Ajustes
   (export/import/signOut/clearData/fullReset), os dois `confirmDialog(...)`
   de zona de risco, e o botão "Cancelar" genérico dentro do próprio
   `confirmDialog`. Descoberta no processo: cada um dos 8 títulos
   bespoke já aparecia **duas vezes só dentro do PWA** (uma na lista de
   Ferramentas, outra no cabeçalho da própria tela) — a duplicação não
   era só entre plataformas.
3. **UWP**: confirmado que `ContentStore.S(key)` já existe e já é usado
   extensivamente em `SettingsPage.xaml.cs` (a doc do `CLAUDE.md`
   dizendo que isso "ainda por portar" estava desatualizada, pelo menos
   pro lado UWP). Mudanças:
   - 8 páginas (`PrincipiosBasicosPage`, `TabelaCrencasPage`,
     `RegrasDaEstradaPage`, `CirculoSegurancaPage`, `LifePiePage`,
     `AfirmacoesPage`, `ArtistDateHistoryPage`, `CheckinHistoryPage`):
     `TextBlock` do título ganhou `x:Name="TitleText"` no `.xaml`, e o
     construtor do `.xaml.cs` passou a setar
     `TitleText.Text = ContentStore.S("tools.xxx")` (mesmo padrão já
     usado por `MaintenanceTitleText` etc. em `SettingsPage.xaml.cs`).
   - `FerramentasPage.xaml.cs` (lista de ferramentas bespoke) e
     `WeekDetailPage.xaml.cs` (`ResolveLinkTitle`, resolve o título do
     "toque pra abrir" do checklist) trocados pra `ContentStore.S(...)`.
   - `SettingsPage.xaml`: `ExportButton`/`ImportButton` ganharam
     `x:Name`; os dois `TextBlock` dentro dos botões de zona de risco
     ganharam `x:Name="ClearDataText"`/`"FullResetText"`.
     `SettingsPage.xaml.cs`: construtor seta os 5 novos textos
     (export/import/signOut/clearData/fullReset), e os dois
     `ContentDialog` de confirmação (`ClearData_Click`/`FullReset_Click`)
     trocados pra `ContentStore.S(...)` — incluindo o `CloseButtonText`,
     que passou a usar `ContentStore.S("common.cancel")` em vez de
     `"Cancelar"` hardcoded.
   - Todos os 9 `.xaml` tocados validados com
     `python -c "import xml.dom.minidom as m; m.parse(...)"` (usado
     `/c/Python314/python`, já que `python3` não está no PATH desta
     máquina) — todos OK.
4. **Android**: confirmado que `ContentStore.kt` já tinha `fun s(key)`
   funcional lendo de `AppContent.uiStrings` (a mesma nota desatualizada
   do `CLAUDE.md` também não se aplicava aqui — só faltava *usar* a
   função, a infra já existia). Mudanças:
   - `FerramentasScreen.kt` (`bespokeScreens()`), `WeekDetailScreen.kt`
     (`resolveLinkTitle`) e `MainShell.kt` (3 chamadas de
     `NumberedListScreen(title, ...)` pra Regras da Estrada/Princípios
     Básicos/Banco de Afirmações) trocados pra `ContentStore.s(...)`.
   - 5 telas dedicadas (`ArtistDateHistoryScreen.kt`,
     `CirculoSegurancaScreen.kt`, `LifePieScreen.kt`,
     `TabelaCrencasScreen.kt`, `CheckinHistoryScreen.kt`) tiveram o
     `Text(...)` do cabeçalho trocado, com `import
     com.rodcarvalho.artistway.data.ContentStore` adicionado onde
     faltava. `CheckinHistoryScreen.kt` tinha "Reler check-ins antigos"
     em minúsculo — divergia da capitalização usada em PWA/UWP, agora
     unificado.
   - `SettingsScreen.kt`: import de `ContentStore` adicionado. `private
     val TAB_TITLES = listOf(...)` (nível de arquivo) **removido** e
     substituído por um `val tabTitles = listOf(ContentStore.s(...), ...)`
     local dentro do composable `SettingsScreen()` — decisão deliberada
     pra evitar um bug de ordem de inicialização: um `val` de nível de
     arquivo referenciando `ContentStore.s()` rodaria no carregamento
     estático da classe (JVM class-init), que pode acontecer antes de
     `ContentStore.initialize()` terminar (chamada assíncrona feita em
     outro lugar do app), travando esses 3 títulos pra sempre no valor
     de fallback (`s()` devolve a própria chave se `ContentStore` ainda
     não carregou). Recalcular dentro do composable custa quase nada (3
     strings) e garante que sempre lê depois do `ContentStore` pronto.
     Descoberta no processo: o texto original da aba "Dados &
     Sincronização" no Android era **"Dados e Sincronização"**,
     divergente de `settings.tabs.dataSync` = "Dados & Sync" (PWA/UWP)
     — corrigido junto, mesmo não estando na lista original dos 3
     baldes (era trivial e já estava ali no meio do arquivo).
     Export/Import/Sair/toggle de manutenção/botões e diálogos de zona
     de perigo trocados pro mesmo padrão `ContentStore.s(...)`.
5. **Validação**: `node scripts/generate-content-json.js --check`
   confirma os dois `content.json` em dia depois de cada rodada de
   edição em `data.js`. Varredura de `--` literal
   (`\s--\s` via Grep) em todos os arquivos tocados: nenhuma ocorrência.
   Teste E2E via Chrome headless/CDP no PWA
   (`test-uistrings.js`, scratchpad): navegou pelas 8 rotas bespoke +
   Ferramentas + Ajustes, confirmou que cada título/botão renderiza o
   texto certo vindo de `UI_STRINGS`, zero erro de console.
6. Versão bumpada nas 3 plataformas: UWP `42.2.0.24 → 42.2.0.25`;
   Android `versionCode 32→33`, `versionName "42.2.0.24"→"42.2.0.25"`;
   PWA `CACHE_NAME` `"...v12"→"...v13"`.
7. **Não coberto nesta rodada** (fica pros baldes 4 e 5, decisão
   futura): textos de onboarding (33 ocorrências XAML no UWP + 9 no
   Android) e os textos dinâmicos da Home (`"Dia X de Y"`, saudação com
   nome) — este último exige redesenho de paridade de componente entre
   UWP e Android antes de sequer cogitar unificar o texto, não é só
   mover string.

## 2026-08-25

Usuário pediu o relatório do que falta pros baldes 4 (onboarding) e 5
(Home dinâmica) antes de mexer. Investigação de código real (não só a
auditoria de 2026-08-23) mostrou que a estimativa de risco da auditoria
original estava errada em pontos importantes.

1. **Balde 5 (Home dinâmica) — reavaliado, risco muito menor do que a
   auditoria dizia**. Comparei `HomePage.xaml.cs` (UWP) linha a linha
   com `HomeScreen.kt` (Android):
   - `"Dia {X} de {Y}"`, `"A Semana {N} completou os 7 dias"`,
     `"Continuar na Semana {N}"`, `"{doneCount}/{totalItems} tarefas
     concluídas · Morning Pages em {X}/7 dias · Artist Date
     feito/não feito · check-in feito/não feito."`, `"{doneCount}/
     {totalItems} tarefas dessa semana concluídas"`, `"Concluir o
     programa"`/`"Ir para a Semana {N+1}"`, `"Marcar páginas de hoje
     como feitas"`/`"✓ Páginas de hoje feitas"`, `"Planejar meu Artist
     Date"`/`"Ver / trocar"` — **todos batem palavra por palavra** nas
     duas plataformas, só muda a sintaxe de interpolação (`$"..."` vs
     `"...${}"`).
   - A auditoria original dizia que "UWP tem um botão-toggle pra
     Morning Pages, Android mostra 'Ver checklist da semana' como link
     — não são o mesmo componente". Isso está **errado**: os dois têm
     exatamente os mesmos dois componentes (botão de abrir o checklist
     da semana + card de Morning Pages com streak/toggle) —
     `HomePage.xaml:57` (`OpenWeekButton`, Content="Ver tarefas da
     semana") e `HomeScreen.kt:227-228` ("Ver checklist da semana") são
     o mesmo botão com wording quase idêntico, não estruturas
     diferentes.
   - Únicas divergências reais encontradas: (a) "Ver tarefas da semana"
     (UWP) vs "Ver checklist da semana" (Android) — só wording; (b) UWP
     tem um 3º fallback de saudação
     (`HomePage.xaml.cs:48-49`: dayCountLabel → "Olá, {Name}" → "seu
     companheiro de jornada" como default final) enquanto Android só
     tem 2 fallbacks (`HomeScreen.kt:80-81`: dayCount → "Olá, $it", sem
     terceiro fallback quando nem dayCount nem nome existem).
   - **Não implementado ainda** — fica pra próxima rodada, mas
     reclassificado de "alto risco/exige redesenho" pra "baixo risco,
     só falta um helper de template com `{placeholder}`".

2. **Balde 4 (Onboarding) — 2 decisões reais de comportamento,
   perguntadas ao usuário via AskUserQuestion e implementadas**:
   - **Decisão A — botão da 2ª opção na tela "já é usuário"**: UWP e
     PWA tinham "Sou novo(a) — começar do zero"; Android tem "Começar
     sem login". Investigação mostrou que o **comportamento já era
     idêntico nas 3 plataformas** (o botão só avança pro próximo passo
     do formulário — `Next_Click` no UWP, `onSkip = { step = 1 }` no
     Android, `next` handler no PWA — nenhum reseta nem apaga nada).
     Só o texto divergia. Usuário escolheu o texto do Android
     ("Começar sem login") como canônico.
   - **Decisão B — número de passos**: UWP e PWA tinham 6 passos
     (Retorno / Boas-vindas / Nome+Data / Rituais [Morning Pages +
     Artist Date] / Check-in / Contrato — check-in numa tela própria).
     Android já tinha 5 passos (rituais + check-in juntos numa tela só,
     `RitualsStep` em `OnboardingScreen.kt:212-242`, com 3 sub-títulos
     "Morning Pages (todo dia)" / "Artist Date (semanal)" / "Check-in
     semanal"). Usuário escolheu o formato compacto do Android como
     canônico — UWP e PWA precisavam mudar, não o Android.
   - **PWA** (`www/js/app.js`): array `steps` reduzido de 6 pra 5
     entradas. Passo 3 (antes só Morning Pages + Artist Date) passou a
     incluir também os campos de check-in (`fciday`/`fcitime`,
     copiados do antigo passo 4, que foi removido). Adicionados os
     mesmos 3 sub-títulos do Android via nova classe CSS
     `.onboard-section-label` (`www/css/style.css`, 16px semibold,
     abaixo do estilo padrão de `label` que é 12px/cinza — não dava pra
     reusar `label` puro sem ficar parecendo campo de formulário em vez
     de cabeçalho de seção). Handler do botão "Continuar" consolidado:
     o bloco `if (step === 4)` que lia os campos de check-in foi
     removido, e sua leitura movida pra dentro do `if (step === 3)`
     existente. Todos os `dots-progress` de todas as 5 telas
     recontados de 6 pra 5 bolinhas, com o índice `active` ajustado.
     Texto do botão da tela 0 trocado pra "Começar sem login".
   - **UWP**: `OnboardingPage.xaml` — `RitualsPanel` ganhou os 3
     sub-títulos (`Style="{StaticResource SubtitleTextBlockStyle}"`) e
     os campos de `CheckinDayCombo`/`CheckinTimePicker` movidos pra
     dentro dele (antes viviam em `FinishPanel`, agora removido do
     arquivo inteiro — confirmado com
     `grep -rn "FinishPanel" uwp/ArtistWayUWP/` que não sobrou nenhuma
     referência). Labels dos campos simplificados de "Horário das
     Morning Pages"/"Dia do Artist Date"/etc. pra só "Horário"/"Dia da
     semana" (o sub-título de cada seção já dá o contexto, igual ao
     Android). `OnboardingPage.xaml.cs`: array `_panels` reduzido de 6
     pra 5 elementos (`ReturningUserPanel, WelcomePanel, NameDatePanel,
     RitualsPanel, ContractPanel`) — a navegação (`ShowStep`,
     `Next_Click`, `Back_Click`) já era 100% genérica por índice de
     array, então não precisou de nenhuma outra mudança de lógica. Texto
     do botão trocado pra "Começar sem login".
   - **Android**: nenhuma mudança — já era a estrutura/texto canônicos.
   - **Não movido pra `UI_STRINGS` nesta rodada** — decisão deliberada
     de escopo: o pedido era resolver as 2 divergências de
     comportamento, não terminar o balde 4 inteiro. O texto do
     onboarding continua replicado manualmente em cada plataforma (mas
     agora com a mesma estrutura/conteúdo correspondente 1:1),
     candidato a entrar em `UI_STRINGS` numa rodada futura dedicada.
3. **Validação**: varredura de `--` literal (`\s--\s`) nos 4 arquivos
   tocados, zero ocorrência. XML de `OnboardingPage.xaml` validado com
   `python -c "import xml.dom.minidom as m; m.parse(...)"`. Teste E2E
   via Chrome headless/CDP no PWA (`test-onboarding.js`, scratchpad):
   navegou os 5 passos do zero até o contrato, confirmou 5 bolinhas em
   cada tela com o índice `active` certo, confirmou que os 3 campos de
   rituais (`fmp`/`fadday`+`fadtime`/`fciday`+`fcitime`) e os 3
   sub-títulos de seção aparecem todos na mesma tela (passo 3), e que o
   passo 4 é mesmo o contrato (título "Seu contrato inicial", botão
   `finish` presente) — zero erro de console.
4. Versão bumpada nas 3 plataformas mesmo sem mudança de código no
   Android nesta rodada (convenção do projeto: UWP e Android
   compartilham o mesmo número de versão, bump em lockstep sempre que
   qualquer um dos dois nativos muda): UWP `42.2.0.25 → 42.2.0.26`;
   Android `versionCode 33→34`, `versionName "42.2.0.25"→"42.2.0.26"`;
   PWA `CACHE_NAME` `"...v13"→"...v14"`.
5. **CI do Android falhou por motivo alheio ao código**: o run
   `32821163303` (push do commit acima) deu `failure` no passo
   "Publicar no GitHub Pages" com `Failed to get ID Token... Request
   timeout` — um hiccup transiente do serviço OIDC do GitHub Actions, não
   um bug introduzido. Tentei `gh run rerun --failed`, mas isso criou um
   2º artefato `github-pages` sob o mesmo run (reruns parciais de
   workflows upload+deploy não limpam o artefato anterior), causando um
   2º erro diferente: `Multiple artifacts named "github-pages" were
   unexpectedly found`. Correção: **não** insistir em rerun do mesmo run
   corrompido — disparei um run inteiramente novo via `gh workflow run
   04-build-apk.yml --ref main` (o workflow já tinha `workflow_dispatch`
   como trigger manual configurado). Esse run novo (`32822241669`)
   compilou e publicou limpo. Lição registrada: se um workflow
   upload+deploy falhar no passo de deploy, preferir `workflow_dispatch`
   (ou um novo push) a `gh run rerun --failed` do mesmo run_id.

## 2026-08-25 (2)

Usuário deu uma instrução permanente: **"todo texto do app deve estar
nessa ui strings absolutamente tudo!! não quero que nenhum texto seja
escrito direto nos apps"** — o motivo declarado é permitir tradução do
app pra outro idioma no futuro, editando só `UI_STRINGS` em vez de
caçar string por string em 3 codebases diferentes.

1. **Esclarecimento de arquitetura, sem mudança de código**: o
   conteúdo do livro (`WEEKS`, `TOOL_CONFIGS`, `BASIC_PRINCIPLES`,
   `ROAD_RULES`, `AFFIRMATIONS`, `BELIEF_TABLE`) já satisfazia o
   objetivo de tradução por outro caminho — são objetos irmãos de
   `UI_STRINGS` dentro do mesmo `data.js`, também centralizados,
   também regenerados pro `content.json` das duas plataformas nativas.
   Não fazia sentido nem seria melhor achatar essa estrutura (título +
   subtítulo + campos tipados) dentro do dicionário plano de
   `UI_STRINGS` só por uma questão de nomenclatura — a "fonte única"
   já existia pra esse conteúdo, só não se chamava `UI_STRINGS`
   especificamente. O que realmente faltava era **texto de interface**
   (onboarding, Home dinâmica, e o resto do app ainda não auditado).

2. **Helper de placeholder `{nome}` criado nas 3 plataformas** (não
   existia — `UI_STRINGS` até aqui só guardava string estática, nunca
   precisou de substituição de variável):
   - **PWA** (`www/js/app.js`): função `S(key, params)` — tentativa
     inicial. **Colidiu**: o bundle vendorizado do FluentUI
     (`www/vendor/fluentui/web-components.min.js`, ~274KB minificado)
     já declara um identificador de nível global `S` (`S="var(--borderRadiusSmall)"`,
     um valor de design token, aparece dentro de uma declaração
     `const`/`let` de múltiplas variáveis). Como esse bundle é
     carregado como `<script>` clássico (não `type="module"`), ele
     compartilha o mesmo escopo léxico global da página — declarações
     `let`/`const`/`class` de nível superior em scripts clássicos
     diferentes colidem entre si mesmo em arquivos separados. Resultado
     em runtime: `SyntaxError: Identifier 'S' has already been
     declared`, app inteiro quebrado (tela em branco). Diagnosticado
     isolando um teste mínimo via Chrome headless/CDP que confirmava
     app.js sendo buscado uma única vez pela rede (não era duplicação
     de carregamento) e depois localizando o `S=` dentro do bundle
     minificado via grep. **Corrigido**: renomeada a função pra `UIS`
     em toda a `app.js` (40 ocorrências, substituição via regex Node
     com lookbehind pra não pegar substrings parecidas), com comentário
     no código explicando o motivo do nome não-óbvio pra não se perder
     de novo no futuro.
   - **UWP** (`Services/ContentStore.cs`): overload novo
     `S(string key, params (string Name, string Value)[] replacements)`
     ao lado do `S(string key)` existente — sem ambiguidade de overload
     porque C# prefere a assinatura mais específica quando só 1
     argumento é passado.
   - **Android** (`data/ContentStore.kt`): overload novo
     `fun s(key: String, vararg replacements: Pair<String, String>): String`
     ao lado do `fun s(key: String)` existente.
   - Todos os três substituem `{nome}` literal dentro da string pelo
     valor correspondente, mesma sintaxe de placeholder nas 3
     plataformas (facilita pro tradutor entender o padrão olhando só
     `UI_STRINGS`).

3. **Balde 5 (Home dinâmica) migrado por completo** — 38 chaves novas
   em `UI_STRINGS` (`home.*` e `status.*`), lidas em detalhe de
   `HomePage.xaml`/`.xaml.cs` (UWP), `HomeScreen.kt` (Android) e a rota
   `/home` de `app.js` (PWA) antes de desenhar as chaves:
   - `home.greeting.dayCount` ("Dia {day} de {total}"),
     `home.greeting.withName` ("Olá, {name}"),
     `home.greeting.default` ("seu companheiro de jornada").
   - `home.maintenance.title`/`.description`.
   - `home.weekCycle.title`/`.summary`/`.question`/`.stayButton`/
     `.advanceButton`/`.finishButton` (cartão de decisão ao completar 7
     dias de uma semana) + `status.done`/`status.notDone` (reaproveitado
     dentro do template de `.summary` pra "Artist Date feito/não feito"
     e "check-in feito/não feito").
   - `home.week.label`/`.progress`/`.openButton`.
   - `home.morningPages.title`/`.thisWeek`/`.hint`/`.toggleOn`/
     `.toggleOff`/`.weekdayLetters` (esta última guarda "D,S,T,Q,Q,S,S"
     como string única separada por vírgula, dividida em array em cada
     plataforma — mantém o padrão "tudo em UI_STRINGS" mesmo pra um
     array pequeno de letras).
   - `home.affirmation.label`.
   - `home.artistDate.title`/`.doneSummary`/`.notDoneSummary`/
     `.planButton`/`.viewButton`.
   - `home.checkin.prompt`/`.button`.
   - `home.roadRulesNudge.prompt`/`.button`.
   - `home.toast.mpMarked`/`.mpUnmarked`/`.stayedWeek`/`.advancedWeek`/
     `.finishedProgram` (só usados pelo PWA — os toasts de feedback de
     ação; UWP/Android não têm toast equivalente pra essas ações
     específicas, mas o texto entra em `UI_STRINGS` do mesmo jeito,
     porque é texto do app que existiria numa tradução).

4. **Bugs e divergências reais encontrados e corrigidos no processo**
   (não é só "mover string" — a leitura linha a linha revelou
   problemas de verdade):
   - **Bug real no PWA**: a rota `/home` calculava
     `const greetName = settings.name ? ", ${settings.name}" : ""`
     mas **nunca usava essa variável em lugar nenhum** — o PWA sempre
     caía direto no fallback genérico "seu companheiro de jornada"
     assim que o `dayCountLabel` ficava vazio (perfil sem `startDate`
     dentro da janela do programa), pulando inteiramente o caso do meio
     ("Olá, {nome}") que UWP e Android já implementavam corretamente.
     Corrigido: agora o PWA usa a mesma cadeia de 3 fallbacks das
     outras duas plataformas (`dayCount → nome → padrão`).
   - **Android tinha divergido de PWA/UWP em vários pontos pequenos**
     (PWA e UWP já concordavam palavra por palavra em quase tudo — só
     o Android tinha desviado, provavelmente por terem sido escritos em
     momentos diferentes sem comparação cruzada): card de "Modo
     manutenção" era uma frase só ("Modo manutenção: continue...") em
     vez do padrão de 2 partes (título + descrição) que PWA/UWP usam —
     unificado pro padrão de 2 partes; título "Artist Date" curto vs
     "Artist Date dessa semana" nas outras duas — unificado pro nome
     completo; botão "Ver checklist da semana" vs "Ver tarefas da
     semana" — unificado pro texto que PWA/UWP já usavam; texto de
     lembrete de Regras da Estrada ("Faz um tempo que você não abre o
     app." / "Reler as Regras da Estrada") divergia de PWA/UWP ("Faz
     uns dias que você não passa por aqui." / "Já revisou as Regras da
     Estrada?") — unificado; botão de check-in era um botão solto sem
     card/pergunta ("Fazer o check-in da semana"), enquanto PWA/UWP têm
     um card com pergunta + botão — mudado pra ter a mesma estrutura de
     card+pergunta+botão, com o texto do botão agora incluindo o número
     da semana (`"Ir para o check-in da Semana {week}"`, que só o PWA
     tinha antes) nas 3 plataformas.
   - **Repetição do bug de ordem de inicialização já visto no balde
     1-3** (ver entrada de 2026-08-23): `WEEKDAY_LETTERS` era um `private
     val` de nível de arquivo em `HomeScreen.kt`. Mesmo risco de rodar
     antes de `ContentStore.initialize()` completar. Removido e
     substituído por `val weekdayLetters = ContentStore.s(...).split(",")`
     local, calculado dentro do próprio composable `HomeScreen`, no
     mesmo padrão já usado pra corrigir `TAB_TITLES` em
     `SettingsScreen.kt`.

5. **Validação**: varredura de `--` literal (`\s--\s`) em todos os
   arquivos tocados, zero ocorrência. XML de `HomePage.xaml` validado.
   `node scripts/generate-content-json.js --check` confirmado em dia.
   Testes E2E via Chrome headless/CDP (scripts no scratchpad):
   `test-home.js` — cria um perfil onboarded direto via `DB.setProfile`
   (sem passar pela tela de onboarding), testa tanto o branch normal
   (saudação "Dia X de Y", card da semana, progresso, botões de MP/AD,
   card de check-in) quanto o branch de modo manutenção (título +
   descrição em 2 partes) — zero erro de console nos dois. Reexecutados
   também `test-uistrings.js` e `test-onboarding.js` (dos rounds
   anteriores) pra confirmar que a renomeação `S`→`UIS` não quebrou nada
   que já estava funcionando — ambos continuam passando.

6. Versão bumpada nas 3 plataformas: UWP `42.2.0.26 → 42.2.0.27`;
   Android `versionCode 34→35`, `versionName "42.2.0.26"→"42.2.0.27"`;
   PWA `CACHE_NAME` `"...v14"→"...v15"`.

7. **Regra registrada no `CLAUDE.md`** (seção "Fonte única de conteúdo
   e texto de UI") pra persistir além desta sessão: todo texto de
   interface tem que vir de `UI_STRINGS`, sem exceção, incluindo texto
   novo que for escrito daqui pra frente. O resto do app (Artist Date,
   Checklist/Jornada, Quiz, notificações, mensagens de erro) ainda não
   foi auditado — registrado como pendência em "Possíveis próximos
   passos" do `PROGRESS.md`, tamanho real desconhecido até rodar uma
   auditoria própria.

## 2026-08-25 (3)

O push do overload `ContentStore.S(key, tuplas)` (entrada anterior)
quebrou o CI do UWP de verdade — desta vez foi um erro de compilação
real, não o hiccup de infra do GitHub Actions visto na entrada de
onboarding deste mesmo dia.

1. **Causa raiz**: `ContentStore.S(string key, params (string Name,
   string Value)[] replacements)` usa tupla nomeada C# (recurso do C#
   7). O log do CI mostrou:
   ```
   error CS8137: Cannot define a class or member that utilizes tuples
   because the compiler required type
   'System.Runtime.CompilerServices.TupleElementNamesAttribute' cannot
   be found. Are you missing a reference?
   error CS8179: Predefined type 'System.ValueTuple`2' is not defined
   or imported
   ```
   Esse projeto UWP mira `TargetPlatformMinVersion=10.0.14393`
   (Anniversary Update, base real do hardware-alvo Lumia 830) com um
   `.csproj` old-style que não referencia o pacote NuGet
   `System.ValueTuple` — sem essa referência, o compilador não consegue
   emitir metadata pra tuplas nomeadas, mesmo que a sintaxe compile
   isoladamente em qualquer outro projeto C# moderno. Como não
   compilo UWP localmente (Linux), esse tipo de incompatibilidade de
   target só aparece no CI — reforça a prática já documentada no
   `CLAUDE.md` de validar por leitura cuidadosa + esperar o build real
   do CI antes de considerar uma mudança de UWP pronta.
2. **Correção**: trocado o overload de `params (string, string)[]` pra
   `params string[]`, alternando chave/valor
   (`ContentStore.S("key", "day", "4", "total", "84")` em vez de
   `ContentStore.S("key", ("day", "4"), ("total", "84"))`). Zero
   dependência de `ValueTuple`, mesmo resultado, só a sintaxe de
   chamada muda. Comentário adicionado no código explicando por que
   não usar tupla aqui especificamente (pra não reintroduzir o mesmo
   erro numa sessão futura sem lembrar do motivo). Todos os 7 call
   sites em `HomePage.xaml.cs` atualizados pra sintaxe nova; conferido
   com grep que não sobrou nenhum literal de tupla `("chave", valor)`
   no arquivo.
3. Versão bumpada de novo: UWP `42.2.0.27 → 42.2.0.28`; Android
   `versionCode 35→36`, `versionName "42.2.0.27"→"42.2.0.28"` (sem
   mudança de código Kotlin nesta rodada — Kotlin não tem esse
   problema de target, só bump pra manter o número em lockstep). PWA
   não mudou nesta rodada (o bug era só C#), `CACHE_NAME` continua
   `v15`.

## 2026-08-25 (4)

Usuário confirmou ("sim") continuar pro balde 4 (texto do onboarding —
estrutura já tinha sido alinhada em "2026-08-25", faltava só mover o
texto) e começar a auditoria do resto do app.

1. **Levantamento completo do texto de onboarding nas 3 plataformas**
   antes de desenhar as chaves — leitura lado a lado de
   `www/js/app.js` (rota `/onboarding`), `OnboardingPage.xaml`/`.xaml.cs`
   (UWP) e `OnboardingScreen.kt` (Android). Descoberta: PWA e UWP já
   concordavam palavra por palavra em quase todo o texto (mesma origem
   histórica); só o Android tinha divergido — títulos diferentes ("Bem-
   vindo(a)" genérico em vez de "The Artist's Way — Companheiro" nas
   telas 0 e 1), descrições reescritas com outras palavras, botão
   "Voltar"/"Avançar" em vez de "Continuar", "Contrato Inicial" em vez
   de "Seu contrato inicial", "Concluir" em vez de "Assinar e começar",
   e faltava o parágrafo de introdução do contrato que PWA/UWP têm.
   Critério aplicado: onde 2 das 3 plataformas já concordavam, esse
   texto virou o canônico e a 3ª foi alinhada — mesmo padrão já usado
   pro balde 5 (Home).
2. **~35 chaves novas em `UI_STRINGS`**: `common.weekdayNames`
   ("Domingo,Segunda,...,Sábado" — 7 nomes separados por vírgula),
   `common.timePickerChangeButton` ("Trocar"), e o grupo `onboarding.*`
   cobrindo `appTitle`, `backButton`, `continueButton`,
   `returningUser.*` (question/description/loginButton/loggingIn/
   skipButton/redirectStatus/loggingInStatus/loginFailedDefault/
   syncingStatus/noDataFoundStatus), `welcome.*` (quote/description/
   startButton), `nameDate.*` (title/subtitle/nameLabel/
   namePlaceholder/startDateLabel), `rituals.*` (title/subtitle/
   morningPagesSection/artistDateSection/checkinSection/timeLabel/
   weekdayLabel), `contract.*` (title/description/sentence/
   signatureLabel/signaturePlaceholder/finishButton) e `toast.*`
   (done/errorPrefix, usados só pelo PWA).
3. **Array de nomes de dias da semana estava duplicado 4 vezes com
   texto hardcoded** — achado ao investigar onde `WEEKDAY_NAMES`/
   `WeekdayNames` eram usados antes de decidir a chave: `www/js/app.js`
   (`WEEKDAY_NAMES`, usado no onboarding E na tela de Ajustes),
   `OnboardingPage.xaml.cs` (UWP), `ProfilePage.xaml.cs` (UWP — cópia
   separada, mesmo array duplicado dentro do próprio UWP) e
   `DayTimePickers.kt` (Android, componente `WeekdayDropdown`
   compartilhado entre Onboarding e Perfil). Todos os 4 agora leem de
   `UI_STRINGS["common.weekdayNames"]` — em vez de mudar a indexação
   (convenção "1=Domingo...7=Sábado" com índice 0 vazio, já usada em
   várias partes do código), cada plataforma reconstrói o array local
   prependando uma string vazia (`["", ...valor.split(",")]` no
   PWA/Android; `new[] { "" }.Concat(...).ToArray()` no UWP, exigindo
   `using System.Linq;` novo nos dois arquivos UWP tocados) — assim
   nenhum call site existente (`array[dia]`) precisou mudar.
4. **PWA** (`www/js/app.js`): título do onboarding trocado de um
   `<h1>` com `<br/>` manual + travessões decorativos hardcoded pra um
   `<h1>` simples com o valor de `UI_STRINGS` (a quebra de linha
   decorativa dependia de manipulação frágil de string por
   `.replace()` — descartada em favor de deixar o CSS/wrap natural do
   navegador cuidar disso). Os 5 `steps[]` reescritos ponta a ponta com
   `UIS(...)`; handlers de clique (`loginBtn`, `finish`) também. Nova
   função `weekdayNames()` substituindo a constante `WEEKDAY_NAMES`,
   usada nos 4 lugares que já existiam (2 no onboarding, 2 na tela de
   Ajustes).
5. **UWP**: `OnboardingPage.xaml` — todo `TextBlock`/`Button` estático
   ganhou `x:Name` (14 novos) e o construtor de `OnboardingPage.xaml.cs`
   passou a setar cada um via `ContentStore.S(...)`, no mesmo padrão já
   usado nas outras páginas. `ShowStep` (frase do contrato) e
   `ReturningUserLogin_Click` (5 textos de status/botão) também
   migrados. `ProfilePage.xaml.cs`: array `WeekdayNames` removido,
   `PopulateWeekdayCombo` (método `static`) agora lê de
   `ContentStore.S("common.weekdayNames")`.
6. **Android**: `OnboardingScreen.kt` reescrito ponta a ponta —
   `ReturningUserStep`, `WelcomeStep`, `NameDateStep`, `RitualsStep`,
   `ContractStep`, `StepNavRow`, todos usando `ContentStore.s(...)`.
   `DayTimePickers.kt` (componente compartilhado
   `WeekdayDropdown`/`TimePickerField`): `WEEKDAY_NAMES` (val de nível
   de arquivo) removido e substituído por uma função `weekdayNames()`
   calculada dentro do composable (mesma cautela de ordem de
   inicialização já aplicada em `TAB_TITLES`/`WEEKDAY_LETTERS` nas
   entradas anteriores); botões "Trocar"/"OK"/"Cancelar" do
   `TimePickerField` também migrados (`common.timePickerChangeButton`,
   reaproveitando `common.ok`/`common.cancel` já existentes).
7. **Validação**: `node --check` no `app.js`, XML de `OnboardingPage.xaml`
   validado, varredura de `--` literal e de literais PT-BR remanescentes
   (grep dedicado por arquivo) — zero ocorrência em todos os 7 arquivos
   tocados. `node scripts/generate-content-json.js --check` confirmado.
   Testes E2E via Chrome headless/CDP: `test-onboarding.js` (dos rounds
   anteriores, reexecutado) confirma os 5 passos e zero erro de
   console; novo `test-onboarding2.js` (scratchpad) navega até o passo
   3 confirmando as 7 opções do `<select>` de dia da semana renderizam
   nomes em português (não a chave crua), e até o passo 4 confirmando
   que `{name}` foi substituído corretamente dentro do HTML da frase do
   contrato (`Eu, <strong>Maria</strong>, me comprometo...`).
   Reexecutados também `test-uistrings.js` e `test-home.js` (rounds
   anteriores) pra confirmar que a extração de `weekdayNames()` na tela
   de Ajustes não quebrou nada — ambos continuam passando.
8. Versão bumpada nas 3 plataformas: UWP `42.2.0.28 → 42.2.0.29`;
   Android `versionCode 36→37`, `versionName "42.2.0.28"→"42.2.0.29"`;
   PWA `CACHE_NAME` `"...v15"→"...v16"`.
9. **Balde 4 fechado por completo.** Próximo passo (ainda não
   iniciado): auditoria do resto do app — Artist Date, Checklist/
   Jornada, Quiz, Perfil, notificações, calendário, mensagens de erro
   — pra saber o tamanho real do que falta pro objetivo de "absolutamente
   tudo".
