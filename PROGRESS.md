# The Artist's Way — Companheiro — PROGRESS.md

> Atualizado em 2026-08-23. Este arquivo existe pra retomar a sessão de
> onde parou — de outro computador, sessão remota, ou depois do
> terminal fechar. Ver `CLAUDE.md` (raiz) pro documento padrão de
> arquitetura/convenções do projeto; este arquivo é só o estado
> **atual** e o que falta.

## Estado atual

- **Versão compartilhada (UWP + Android): `42.2.0.25`** (`versionCode`
  Android = 33).
- PWA: `CACHE_NAME = "artist-way-companion-v13"` no service worker.
- As 3 plataformas (PWA, UWP, Android) estão com conteúdo/funcionalidade
  equivalente — nenhuma feature pendente de portar de uma pra outra no
  momento.
- **Zona cinzenta fechada**: as 12 semanas do livro têm 100% dos itens
  "liste/escreva X" com link "toque pra abrir" — não sobrou nenhuma
  reflexão sem lugar pra escrever.
- **Retrofit de `UI_STRINGS` — baldes 1-3 feitos**: títulos de tela
  bespoke, botões de ação/config e diálogos de confirmação unificados
  nas 3 plataformas. Baldes 4 (onboarding) e 5 (Home dinâmica) ainda
  pendentes.
- CI rodando pra `42.2.0.25` — checar `gh run list --branch main --limit
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

- **Retrofit de `UI_STRINGS` — baldes 4 e 5 ainda pendentes** (baldes
  1-3 feitos em 2026-08-23, ver índice acima): (4) textos de
  onboarding — 33 ocorrências XAML no UWP + 9 no Android, não
  confirmado se o conteúdo bate 1:1 entre plataformas; (5) HomePage
  dinâmica (textos com interpolação de estado tipo "Dia X de Y") — a
  própria estrutura de UI diverge entre UWP e Android (componentes
  diferentes), exige redesenho de paridade antes de unificar texto.
  Decidir separadamente quando for a vez.
- Testar manualmente nos dois aparelhos (Lumia 830 e o Android físico
  usado pra teste): ícone com o tamanho novo, notificação, tile UWP
  herdando a cor de acento certa, todos os links tocáveis das 12
  semanas (inclusive os 11 novos/reaproveitados de 2026-08-23:
  `situacaoQueDeveriaMudar`, `arqueologia`, `euComoCor`,
  `valorMorningPages`, `cenaIdeal`, `habitoQueAtrapalha`,
  `promessasGentis`, `semanaAutocuidado`, `resistenciasMedosContinuar`,
  `areasProcrastinacao`, `recipientePreocupacoes`), e os textos
  unificados de Ajustes/Ferramentas (baldes 1-3 do `UI_STRINGS`).

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
