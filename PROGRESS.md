# The Artist's Way — Companheiro — PROGRESS.md

> Atualizado em 2026-08-25. Este arquivo existe pra retomar a sessão de
> onde parou — de outro computador, sessão remota, ou depois do
> terminal fechar. Ver `CLAUDE.md` (raiz) pro documento padrão de
> arquitetura/convenções do projeto; este arquivo é só o estado
> **atual** e o que falta.

## Estado atual

- **Versão compartilhada (UWP + Android): `42.2.0.26`** (`versionCode`
  Android = 34).
- PWA: `CACHE_NAME = "artist-way-companion-v14"` no service worker.
- As 3 plataformas (PWA, UWP, Android) estão com conteúdo/funcionalidade
  equivalente — nenhuma feature pendente de portar de uma pra outra no
  momento.
- **Zona cinzenta fechada**: as 12 semanas do livro têm 100% dos itens
  "liste/escreva X" com link "toque pra abrir" — não sobrou nenhuma
  reflexão sem lugar pra escrever.
- **Retrofit de `UI_STRINGS` — baldes 1-3 feitos**; balde 4
  (onboarding) parcialmente feito: fluxo de onboarding agora tem 5
  passos nas 3 plataformas (Android já era assim; PWA e UWP foram
  ajustados). Texto ainda não centralizado em `UI_STRINGS` — só a
  estrutura/comportamento foi alinhada. Balde 5 (Home dinâmica) segue
  pendente, mas confirmado como baixo risco (ver índice abaixo).
- CI rodando pra `42.2.0.26` — checar `gh run list --branch main --limit
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

- **Retrofit de `UI_STRINGS` — resto do balde 4 e balde 5**:
  estrutura/comportamento do onboarding já alinhados (2026-08-25), mas
  o texto do onboarding ainda não foi movido pra `UI_STRINGS` (fica
  local em cada plataforma, só com o conteúdo já correspondente 1:1).
  Balde 5 (Home dinâmica) é baixo risco — a maior parte do texto já é
  idêntico, só falta: unificar "Ver tarefas da semana" (UWP) vs "Ver
  checklist da semana" (Android), e decidir se replica o 3º fallback de
  saudação do UWP ("seu companheiro de jornada", quando não tem nome
  nem dia contado) no Android, que hoje só tem 2 fallbacks.
- Testar manualmente nos dois aparelhos (Lumia 830 e o Android físico
  usado pra teste): ícone com o tamanho novo, notificação, tile UWP
  herdando a cor de acento certa, todos os links tocáveis das 12
  semanas (inclusive os 11 novos/reaproveitados de 2026-08-23:
  `situacaoQueDeveriaMudar`, `arqueologia`, `euComoCor`,
  `valorMorningPages`, `cenaIdeal`, `habitoQueAtrapalha`,
  `promessasGentis`, `semanaAutocuidado`, `resistenciasMedosContinuar`,
  `areasProcrastinacao`, `recipientePreocupacoes`), os textos
  unificados de Ajustes/Ferramentas (baldes 1-3 do `UI_STRINGS`), e o
  onboarding com 5 passos (novo fluxo compacto, 2026-08-25).

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
