# The Artist's Way — Companheiro

App companheiro do livro *The Artist's Way* (Julia Cameron), mantido em
**duas plataformas com o mesmo conteúdo conceitual**:

- **PWA** (`www/`) — JS puro, sem build. Hospedado ao vivo em
  `https://ro2342.github.io/theartistsway/` (deploy via GitHub Actions),
  também usável via wrapper Capacitor Android.
- **UWP nativo** (`uwp/ArtistWayUWP/`) — 100% XAML/C# nativo. Alvo é um
  Lumia 830 (Windows 10 Mobile), sideload via certificado autoassinado
  (sem Store), distribuído por uma página de download em `app/` (GitHub
  Pages).

**Preferência fixa do usuário: o UWP tem que continuar 100% nativo** —
nada de framework cross-platform (WebView, React Native, etc.). Isso
significa que a lógica de aplicação é escrita duas vezes (C#/XAML e
JS/HTML), sempre espelhada função por função entre as duas — mas o
**conteúdo** vem de uma fonte única (ver abaixo). Toda mudança de
comportamento não-trivial precisa ser replicada nos dois lados na mesma
sessão, não só num.

## Fonte única de conteúdo e texto de UI

- `www/js/data.js` — conteúdo do livro (`WEEKS`), texto de interface
  (`UI_STRINGS`, dicionário plano), configs de ferramentas genéricas
  (`TOOL_CONFIGS`) e configs de quiz (`QUIZ_CONFIGS`). O PWA lê isso
  direto.
- `scripts/generate-content-json.js` — gera
  `uwp/ArtistWayUWP/Data/content.json` a partir de `data.js` (C# não
  executa JavaScript). **Rodar sempre que `data.js` mudar:**
  `node scripts/generate-content-json.js`. O CI roda com `--check` e
  **falha o build** se esquecer de regenerar e commitar o resultado.
- `uwp/ArtistWayUWP/Services/ContentStore.cs` — carrega o
  `content.json` empacotado e expõe `ContentStore.Content` tipado;
  `ContentStore.S("chave")` lê `UiStrings`.
- Retrofit de `UI_STRINGS` cobre nav labels e títulos de card, mas
  descrições longas/strings muito dinâmicas continuam locais em cada
  plataforma (decisão consciente de escopo, não esquecimento).

## Telas genéricas (evitar tela nova quando dá)

- `uwp/ArtistWayUWP/Views/NamedListPage.xaml(.cs)` / rota `#/list` em
  `www/js/app.js` — tela reaproveitada por toda ferramenta tipo lista
  ou formulário. `TOOL_CONFIGS` tem um campo `singleton` (bool): quando
  `true`, vira formulário de UM registro só (editável/sobrescrito) em
  vez de lista que só cresce — mesmo armazenamento por baixo (store
  `lists`). Pra nova ferramenta desse tipo, normalmente basta adicionar
  uma entrada em `TOOL_CONFIGS`, sem criar tela nova em nenhum dos dois
  apps.

## Armazenamento local e sincronização

- **PWA**: IndexedDB via `www/js/db.js` (`STORES.*`: settings,
  morningPages, artistDates, checklist, checkins, lists,
  calendarEvents).
- **UWP**: um arquivo JSON por "store" em `ApplicationData.Current.LocalFolder`,
  via `Services/LocalDataStore.cs` — mesmo desenho de stores que o
  PWA, só que em arquivo em vez de IndexedDB (facilita export/import de
  backup: é literalmente empacotar/desempacotar esses arquivos).
- **Sync** (`www/js/sync.js` / `Services/SyncService.cs`): sem SDK
  oficial do Firebase pra UWP — os dois lados conversam direto com as
  APIs REST do Firestore. Cada store vira um documento Firestore com um
  campo `data` (o JSON do store inteiro, como string). Mesclagem:
  - `settings` (perfil) — **blob inteiro**, quem tem `_updatedAt` mais
    recente vence (`MergeWholeBlob`).
  - Todos os outros stores — **por registro**, comparando `updatedAt`
    (ou `savedAt` em `checkins`) de cada chave (`MergePerRecord`).
  - Login: Google via Device Authorization Grant (fluxo de Smart TV —
    sem Store ID, sem redirect URI). Ver `sincronizacao-nuvem-setup.md`
    pro histórico completo da decisão.

## Cursor de semana (`profile.weekCursor`) — desde a 2.0.2.8

A semana "atual" **não é mais** só cálculo por data. Existe um cursor
persistido no perfil (sincronizado como o resto): `weekCursor = {
weekId, cycleStart }`.

- **Cálculo puro por data** (`naturalWeekId` no PWA /
  `WeekCalculator.NaturalWeekId` no UWP) só serve pra **semear** o
  cursor na primeira leitura de um perfil que ainda não tem um
  (`getWeekCursor` / `LocalDataStore.GetOrSeedWeekCursorAsync`). Nunca
  usar esse cálculo direto pra decidir a semana de alguém que já está
  em uso — ele não pergunta nada, só aplica.
- Quando os 7 dias do `cycleStart` atual passam, a Home mostra um
  cartão de decisão (resumo da semana + botões "Continuar na Semana X"
  / "Ir para a Semana X+1", ou "Concluir o programa" na 12) em vez de
  trocar de semana sozinha. Ver `weekCyclePending` /
  `WeekCalculator.IsWeekCyclePending` e `buildWeekSummary` /
  `LocalDataStore.BuildWeekSummaryAsync`.
- Correção manual: a tela de cada semana (`#/week/:id` no PWA,
  `WeekDetailPage` no UWP) mostra se aquela semana é a atual e, se não
  for, oferece um botão "Tornar esta a minha semana atual"
  (`setCurrentWeek` / `LocalDataStore.SetCurrentWeekAsync`) — dá pra ir
  pra qualquer semana, voltar ou adiantar, sem apagar nada do que já
  foi feito (checklist/check-in/Artist Date continuam guardados pela
  chave da própria semana via `weekKeyForOffset` /
  `WeekCalculator.WeekKeyForOffset`, que não mudou).
- **Lição aprendida**: qualquer decisão que o app tome sozinho por
  trás das costas do usuário (como o auto-avanço de semana original)
  precisa de uma correção manual em algum lugar da UI — um cartão
  condicional sozinho não é suficiente pra cobrir quem migra de um
  estado anterior sem esse cartão nunca ter aparecido pra eles.

## Convenções e gotchas

- **Nunca escrever `--` literal em lugar nenhum do código** — inclui
  comentário `//` em C#, não é só regra de XML. Usar `—` (em dash). Em
  `<!-- -->` quebra o parser XML de verdade; fora disso é estilo, mas a
  regra vale igual. Validar XAML/csproj/appxmanifest com
  `python3 -c "import xml.dom.minidom as m; m.parse('arquivo')"` antes
  de commitar. Pra varredura em massa em `.cs`/`.js`/`.css`: regex
  `(?<=\s)-{2,}(?=\s)` → `—` (exige espaço dos dois lados, não toca em
  `i--` nem em `var(--nome-css)`).
- **Toda mudança em `uwp/ArtistWayUWP` precisa de bump de versão** em
  `uwp/ArtistWayUWP/Package.appxmanifest` (`Identity/@Version`), senão
  o checador de atualização do app não detecta que existe uma versão
  nova.
- **`uwp/ArtistWayUWP/ArtistWayUWP.csproj` é old-style, sem wildcard**:
  todo `.xaml`/`.xaml.cs`/`.cs` novo precisa de entrada manual
  (`<Compile Include>` / `<Page Include>`), senão o build falha
  silenciosamente pro arquivo (o arquivo simplesmente não compila).
- **UWP não compila em Linux.** Validar por leitura cuidadosa de código
  + build real do CI (roda em `windows-latest`). Pro PWA, dá pra testar
  de verdade com Chrome headless via protocolo de debug (CDP) — não
  precisa de Puppeteer instalado, o Node 22 já tem `fetch`/`WebSocket`
  nativos suficientes pra escrever um driver simples direto (abrir
  `google-chrome --headless=new --remote-debugging-port=PORTA`,
  conectar no `webSocketDebuggerUrl` de `http://localhost:PORTA/json/version`).
- **Fluxo padrão de toda mudança**: terminar, validar localmente,
  **commitar e dar push pro `main` na hora** — não deixar mudança só
  local esperando o usuário perguntar por quê não subiu. Depois
  acompanhar o Actions (`gh run list --branch main --limit 1` / `gh run
  watch <id>`) até terminar; se falhar, ler o log (`gh run view <id>
  --log-failed`), corrigir sozinho e re-push.
- `app/app.appxbundle` e `app/version.json` são **gerados pelo
  workflow** `.github/workflows/02-build-appx.yml` (lê a versão do
  `Package.appxmanifest`, builda o appxbundle, sobrescreve os dois
  arquivos e faz um commit+push automático próprio) — **nunca editar
  esses dois arquivos na mão**. Só considerar a versão "publicada" (a
  URL do GitHub Pages/app de download atualizada) depois desse segundo
  commit automático, não no momento do push do código-fonte. O
  workflow `01-generate-cert.yml` só roda manualmente (uma vez, gerou o
  certificado de sideload já commitado) — não precisa rodar de novo.

## Onde ficam as coisas

```
uwp/ArtistWayUWP/
├── Views/            ← uma página por tela (XAML + code-behind)
├── Services/          ← WeekCalculator, LocalDataStore, SyncService,
│                        ContentStore, TileService, AuthService, ...
├── Models/            ← ProfileSettings, WeekContent, WeekCursor,
│                        WeekSummary, CheckinEntry, ...
└── Data/content.json  ← gerado, não editar na mão

www/js/
├── app.js              ← roteador (`route("#/...")`) e todas as telas
├── data.js             ← conteúdo do livro + UI_STRINGS + TOOL_CONFIGS
├── db.js                ← IndexedDB
├── sync.js / auth.js   ← Firestore REST + login Google (device grant)
├── theme.js / calendar.js / notifications.js / updates.js
```

Docs de apoio na raiz do repo: `catalogo-funcionalidades.md` (catálogo
original de funcionalidades, o que foi/não foi implementado),
`sincronizacao-nuvem-setup.md` (histórico da decisão de auth/sync),
`ensaios-12-semanas.md` / `regras-da-estrada.md` (texto-fonte do livro
usado pra escrever o conteúdo).
