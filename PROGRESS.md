# The Artist's Way — Companheiro — PROGRESS.md

> Atualizado em 2026-08-23. Este arquivo existe pra retomar a sessão de
> onde parou — de outro computador, sessão remota, ou depois do
> terminal fechar. Ver `CLAUDE.md` (raiz) pro documento padrão de
> arquitetura/convenções do projeto; este arquivo é só o estado
> **atual** e o que falta.

## Estado atual

- **Versão compartilhada (UWP + Android): `42.2.0.24`** (`versionCode`
  Android = 32).
- PWA: `CACHE_NAME = "artist-way-companion-v12"` no service worker.
- As 3 plataformas (PWA, UWP, Android) estão com conteúdo/funcionalidade
  equivalente — nenhuma feature pendente de portar de uma pra outra no
  momento.
- **Zona cinzenta fechada**: as 12 semanas do livro têm 100% dos itens
  "liste/escreva X" com link "toque pra abrir" — não sobrou nenhuma
  reflexão sem lugar pra escrever.
- CI rodando pra `42.2.0.24` — checar `gh run list --branch main --limit
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

- **Retrofit de `UI_STRINGS` — próxima prioridade clara** (usuário
  pediu explicitamente em 2026-08-23): hoje só ~30 chaves cobrem nav
  labels e títulos de card; estimativa de ~150-200 conceitos de texto
  ainda hardcoded e triplicados entre PWA/UWP/Android. Auditoria (ver
  `ai/CHANGELOG.md`, entrada 2026-08-23 item 8) categorizou em 5 baldes
  por risco — recomendação é começar pelos baldes 1-3 (~30-36 strings,
  baixo risco): (1) títulos de tela "bespoke", risco zero; (2) botões
  de ação/config, baixo risco; (3) diálogos de confirmação, baixo-médio
  risco. Baldes 4 (onboarding) e 5 (HomePage dinâmica, que exige
  redesenho de paridade de componente entre UWP/Android) são trabalho
  maior — decidir separadamente.
- Testar manualmente nos dois aparelhos (Lumia 830 e o Android físico
  usado pra teste): ícone com o tamanho novo, notificação, tile UWP
  herdando a cor de acento certa, e todos os links tocáveis das 12
  semanas — inclusive os 11 novos/reaproveitados de 2026-08-23
  (`situacaoQueDeveriaMudar`, `arqueologia`, `euComoCor`,
  `valorMorningPages`, `cenaIdeal`, `habitoQueAtrapalha`,
  `promessasGentis`, `semanaAutocuidado`, `resistenciasMedosContinuar`,
  `areasProcrastinacao`, `recipientePreocupacoes`).

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
