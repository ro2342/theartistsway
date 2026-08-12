# The Artist's Way — Companheiro — PROGRESS.md

> Atualizado em 2026-08-12. Este arquivo existe pra retomar a sessão de
> onde parou — de outro computador, sessão remota, ou depois do
> terminal fechar. Ver `CLAUDE.md` (raiz) pro documento padrão de
> arquitetura/convenções do projeto; este arquivo é só o estado
> **atual** e o que falta.

## Estado atual

- **Versão compartilhada (UWP + Android): `42.2.0.23`** (`versionCode`
  Android = 31).
- PWA: `CACHE_NAME = "artist-way-companion-v11"` no service worker.
- As 3 plataformas (PWA, UWP, Android) estão com conteúdo/funcionalidade
  equivalente — nenhuma feature pendente de portar de uma pra outra no
  momento.
- CI verde nos dois builds nativos (`02-build-appx.yml`,
  `04-build-apk.yml`), publicado em `app/` (GitHub Pages).

## Últimas mudanças desta sessão (2026-08-12)

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

- Testar manualmente nos dois aparelhos (Lumia 830 e o Android físico
  usado pra teste): ícone com o tamanho novo (reduzido na 42.2.0.23),
  notificação, tile UWP herdando a cor de acento certa, e os novos
  links tocáveis das Semanas 3, 7, 8, 9, 10, 11 e 12.
- **Zona cinzenta da auditoria** (item 7 em "Últimas mudanças" acima):
  ~11 prompts de escrita única sem link, em decisão adiada — perguntar
  se/quando vale criar telas pra eles.
- Retrofit de `UI_STRINGS` ainda não é 100% completo (decisão
  consciente de escopo, não pendência urgente) — ver seção "Fonte
  única de conteúdo e texto de UI" no `CLAUDE.md`.
- Decidir o que fazer com `arqueologia` (`TOOL_CONFIGS`, hoje
  `week: 7`) — parece atribuída à semana errada, ver item 6 em "Últimas
  mudanças" acima.

`settings.json` global (`remoteControlAtStartup`) já foi ligado nesta
sessão — não é mais pendência, é config global, fora deste repo.

## Como manter este arquivo

Depois de qualquer mudança neste projeto motivada por um pedido do
usuário: atualizar a seção "Últimas mudanças" (pode substituir por uma
nova entrada datada quando a lista crescer demais) e a "Estado atual"
se a versão/CACHE_NAME mudou.
