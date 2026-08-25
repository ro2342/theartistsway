# The Artist's Way — Companheiro — PROGRESS.md

> Atualizado em 2026-08-25. Este arquivo existe pra retomar a sessão de
> onde parou — de outro computador, sessão remota, ou depois do
> terminal fechar. Ver `CLAUDE.md` (raiz) pro documento padrão de
> arquitetura/convenções do projeto; este arquivo é só o estado
> **atual** e o que falta.

## Estado atual

- **Versão compartilhada (UWP + Android): `42.2.0.31`** (`versionCode`
  Android = 39).
- PWA: `CACHE_NAME = "artist-way-companion-v18"` no service worker.
- As 3 plataformas (PWA, UWP, Android) estão com conteúdo/funcionalidade
  equivalente — nenhuma feature pendente de portar de uma pra outra no
  momento.
- **Zona cinzenta fechada**: as 12 semanas do livro têm 100% dos itens
  "liste/escreva X" com link "toque pra abrir" — não sobrou nenhuma
  reflexão sem lugar pra escrever.
- **Regra do usuário (2026-08-25, sem exceção): todo texto de
  interface tem que vir de `UI_STRINGS`** — objetivo é permitir
  tradução futura editando só esse arquivo. Ver seção "Fonte única de
  conteúdo e texto de UI" no `CLAUDE.md`.
- **Retrofit de `UI_STRINGS` — baldes 1-5 + Artist Date/Check-in/
  Perfil + Checklist/Jornada (WeekDetail) + Quiz + Essay/NamedList +
  conteúdo de notificação push, todos migrados.** Falta só "mensagens
  de erro" (último item da lista do usuário) e auditar se a tela
  "Jornada" da nav (`ProgressPage`/`ProgressScreen` — diferente da tela
  de detalhe de semana) também tem texto solto — ver "Possíveis
  próximos passos".
- CI rodando pra `42.2.0.31` — checar `gh run list --branch main --limit
  2` antes de considerar publicado (os workflows fazem um commit
  automático próprio depois do build).

## Índice de entregas

> Resumo de 1-2 linhas por entrega. Detalhe completo (causa-raiz, como
> testei, arquivos tocados) em `ai/CHANGELOG.md`.

- **2026-08-12**: ícones Android/UWP/PWA corrigidos (tamanho, adaptive
  icon, unificação de design — PWA usava placeholder diferente); tile
  UWP revertida pra `transparent`; Semanas 3 e 7 ganharam "toque pra
  abrir" no checklist (9 ferramentas novas); auditoria completa nas 12
  semanas fechou 8 gaps reais nas Semanas 8-12 (10 ferramentas/links) e
  documentou uma "zona cinzenta" de ~11 reflexões sem link, deixada pra
  depois.
- **2026-08-23**: checklist de terceiro (@jobsournal, 14 imagens)
  cruzado contra o app — confirma fidelidade ao livro, nenhuma lacuna
  nova; zona cinzenta fechada (10 ferramentas novas nas Semanas
  4/8/9/10/11/12); `arqueologia` corrigida de `week: 7` pra `week: 8` e
  reaproveitada pro gap da Semana 8; validado (72 links, zero quebrado,
  E2E sem erro de console); versão `42.2.0.24` / `v12`; auditoria (só
  reconhecimento) do retrofit de `UI_STRINGS` mapeou o tamanho do
  trabalho, nada implementado ainda.
- **2026-08-23 (2)**: retrofit de `UI_STRINGS` baldes 1-3 implementado —
  8 títulos de tela bespoke + 12 textos de botão/diálogo de Ajustes
  unificados nas 3 plataformas (antes triplicados, alguns já
  divergentes entre si). Versão `42.2.0.25` / `v13`.
- **2026-08-25**: investigação real do código (não só a auditoria)
  mostrou que o balde 5 é baixo risco — quase todo texto dinâmico da
  Home já é idêntico entre plataformas, a auditoria original errou ao
  dizer que a estrutura divergia. Balde 4 (onboarding) tinha 2
  divergências reais de comportamento — decididas pelo usuário e
  implementadas: botão "começar sem login" (era "começar do zero" no
  UWP/PWA, sem diferença de comportamento, só de texto) e fluxo
  reduzido de 6 pra 5 passos (PWA e UWP fundiram a tela de "rituais" +
  "check-in" numa só, igual ao Android). Versão `42.2.0.26` / `v14`.
- **2026-08-25 (2)**: usuário estabeleceu regra permanente — todo texto
  de interface tem que vir de `UI_STRINGS`, sem exceção, pra permitir
  tradução futura. Implementado: helper de placeholder `{nome}` nas 3
  plataformas (`UIS()` no PWA — não `S()`, colidia com identificador
  global do bundle do FluentUI; `ContentStore.S(key, params string[])`
  no UWP; `ContentStore.s(key, pares)` no Android); balde 5 (Home
  dinâmica) inteiro migrado — 38 chaves novas em `UI_STRINGS` cobrindo
  saudação, cartão de decisão de semana, progresso, Morning Pages,
  Artist Date, lembretes de check-in e Regras da Estrada, toasts. No
  processo, descobertos e corrigidos: bug real no PWA (saudação "Olá, {nome}"
  calculada mas nunca usada) e várias divergências de texto/estrutura
  no Android que tinham desviado do padrão PWA/UWP (unificados pro
  padrão dos outros dois). Versão `42.2.0.27` / `v15`.
- **2026-08-25 (3)**: CI do UWP falhou de verdade (não infra) —
  `ContentStore.S(key, params (string,string)[])` usava tupla C#, que
  quebra o build nesse target UWP antigo por falta de referência a
  `System.ValueTuple` (`CS8137`/`CS8179`). Trocado pra
  `params string[]` alternando chave/valor — sem tupla, mesmo
  resultado. Versão `42.2.0.28`.
- **2026-08-25 (4)**: balde 4 (onboarding) fechado por completo — texto
  migrado pra `UI_STRINGS` nas 3 plataformas (~35 chaves novas:
  `onboarding.*` + `common.weekdayNames`/`common.timePickerChangeButton`).
  Corrigido também o array de nomes de dias da semana, que estava
  duplicado 4 vezes (PWA, UWP em 2 arquivos, Android) com texto
  hardcoded — agora só existe em `UI_STRINGS`. Onde PWA/UWP já
  concordavam entre si e o Android tinha desviado (títulos, descrições,
  botão "Voltar"/"Avançar" vs "Continuar"), unificado pro texto das
  duas primeiras. Versão `42.2.0.29` / `v16`.
- **2026-08-25 (5)**: telas de Artist Date, Check-in e Perfil migradas
  pra `UI_STRINGS` (~40 chaves novas: `artistDate.*`, `checkin.*`,
  `profile.*`, `morningPages.calendarEventDescription`) — inclui os
  textos de evento de calendário (nativo no UWP/Android, Google
  Calendar no PWA) que iam parar direto no calendário do usuário.
  Achado no caminho: mesmo texto de calendário duplicado em 2 lugares
  dentro do próprio UWP e Android (tela de Artist Date + tela de
  Perfil) — cada plataforma tinha sua própria cópia local em vez de
  compartilhar. Versão `42.2.0.30` / `v17`.
- **2026-08-25 (6)**: retrofit de `UI_STRINGS` fechado pra
  Checklist/Jornada (WeekDetail), Quiz, Essay/NamedList e conteúdo de
  notificação push (título/corpo das 3 notificações + nome dos 3
  canais Android) nas 3 plataformas. Achado no caminho: canais de
  notificação do Android podiam ser criados antes do `ContentStore`
  carregar (reboot do aparelho aciona `BootReceiver` direto, sem passar
  pela tela do app) — corrigido inicializando o `ContentStore` no
  início de `NotificationScheduler.applySettings`. Versão `42.2.0.31` /
  `v18`.

## Identidade visual (referência rápida)

- **Fonte única do ícone**: `logo.svg` (raiz do repo) — estrela + pena
  + livro aberto, silhueta branca (`#FFFFFF`), `viewBox="0 0 96 96"`.
- **Cor de marca (fundo sólido do ícone)**: `#A8752C` (dourado/marrom).
  Usada no launcher/notificação do Android, no adaptive icon, e nos
  ícones do PWA (`icon-192`, `icon-512`, `icon-maskable-1024`).
- **UWP não usa cor de marca fixa nas tiles** — `BackgroundColor` do
  manifest fica `"transparent"` de propósito, pra herdar a cor de
  acento do Windows (Personalização do sistema). Não confundir com o
  seletor de accent color do PWA (`www/js/theme.js`,
  `ACCENT_COLORS`) — são dois conceitos diferentes, o UWP não tem
  paleta própria, só `Application.Current.Resources["SystemAccentColor"]`.
- **Fundo/cream do PWA**: `#F3EAD9` (`background_color`/`theme_color`
  do `manifest.json`).
- `scripts/generate-icons.js` fica no repo — reaproveitável se
  precisar reajustar escala/cor dos ícones sem repetir o processo
  manual de novo.

## Possíveis próximos passos (não decididos ainda)

- **Retrofit de `UI_STRINGS` — falta só "mensagens de erro"** (pedido
  do usuário: "absolutamente tudo"). Tamanho real desconhecido ainda —
  precisa de uma auditoria própria (nos moldes da de 2026-08-23) antes
  de estimar.
- **Auditar a tela "Jornada" da nav** (`ProgressPage.xaml.cs` no UWP,
  `ProgressScreen.kt` no Android — a tela acessada pela aba inferior,
  diferente de `WeekDetailPage`/`WeekDetailScreen` que já foi migrada).
  Uma varredura rápida no início desta sessão achou `ProgressPage: cs=3`
  ocorrências não migradas no UWP; Android não confirmado. Não foi
  auditado a fundo ainda.
- Testar manualmente nos dois aparelhos (Lumia 830 e o Android físico
  usado pra teste): ícone com o tamanho novo, notificação, tile UWP
  herdando a cor de acento certa, todos os links tocáveis das 12
  semanas (inclusive os 11 novos/reaproveitados de 2026-08-23:
  `situacaoQueDeveriaMudar`, `arqueologia`, `euComoCor`,
  `valorMorningPages`, `cenaIdeal`, `habitoQueAtrapalha`,
  `promessasGentis`, `semanaAutocuidado`, `resistenciasMedosContinuar`,
  `areasProcrastinacao`, `recipientePreocupacoes`), os textos
  unificados de Ajustes/Ferramentas/Home/Onboarding (baldes 1-5 do
  `UI_STRINGS`, novo fluxo compacto de 5 passos).

`settings.json` global (`remoteControlAtStartup`) já foi ligado nesta
sessão — não é mais pendência, é config global, fora deste repo.

## Como manter este arquivo

Depois de qualquer mudança neste projeto motivada por um pedido do
usuário: escrever a narrativa completa (causa-raiz, como testei,
arquivos tocados) numa entrada datada em `ai/CHANGELOG.md`, e aqui no
`PROGRESS.md` só adicionar 1-2 linhas na "Índice de entregas" apontando
pra ela, além de atualizar "Estado atual" se a versão/CACHE_NAME mudou.
Nunca escrever narrativa longa direto aqui — este arquivo é carregado
em toda sessão, tem que ficar rápido de ler.
