# Artist's Way — versão UWP (Windows 10 Mobile / Lumia)

App UWP nativo em C#/XAML — desde a v2.0.0.0, **não é mais uma WebView**
hospedando o site. Cada tela (Início, Jornada, Semana, Ensaio, Check-in,
Artist Date, Ajustes, Regras da Estrada, Princípios Básicos, Onboarding) é
uma página XAML de verdade, seguindo o guia oficial "Windows 10 UWP App
Design Guidelines": navegação em modelo "drill" (Frame + barra de abas
embutida embaixo, botão Voltar do sistema), tipografia no type ramp padrão
(`TitleTextBlockStyle`, `BodyTextBlockStyle` etc.), e cores 100% vindas do
tema do sistema (claro/escuro + cor de destaque do usuário) — sem paleta
customizada.

O `www/` continua existindo do jeito que está (PWA + fonte do APK via
Capacitor) — só a versão UWP deixou de reaproveitá-lo como WebView. O
conteúdo do livro (as 12 semanas, Regras da Estrada, Princípios Básicos etc.)
é gerado uma vez para `uwp/ArtistWayUWP/Data/content.json` a partir de
`www/js/data.js` (script Node descartável, não versionado — se o conteúdo do
livro mudar, regenerar esse JSON em vez de editar os dois lados
separadamente).

**Aviso importante:** eu não tenho como compilar nem testar isso antes de você
rodar — não existe toolchain UWP fora do Windows, e meu ambiente aqui é
Linux. Escrevo tudo com o máximo de cuidado (validação de XML, conferência
cruzada de `x:Name` entre XAML e code-behind, atenção a APIs que só existem
em versões do Windows mais novas que o `TargetPlatformMinVersion` do
projeto), mas ainda assim a validação real acontece no primeiro build do
GitHub Actions depois do push. Se algo quebrar, me cola o log do Actions.

## Por que C# e não JavaScript puro

Pesquisei antes de escrever qualquer coisa: o tipo de projeto UWP "só
JavaScript" (`.jsproj`) foi descontinuado a partir do Visual Studio 2019 e não
builda mais em ferramentas atuais. Por isso o app sempre foi (e continua
sendo, agora com mais razão ainda) C# com XAML — é o caminho que realmente
compila hoje.

## Por que nada usa `StackPanel.Spacing` / `Grid.ColumnSpacing`/`RowSpacing`

Essas propriedades só existem a partir do Fall Creators Update
(`10.0.16299`). O projeto declara `TargetPlatformMinVersion=10.0.14393.0`
(Anniversary Update) porque é o mais próximo da base real do Lumia 830 — o
Windows 10 Mobile nunca recebeu boa parte das atualizações de feature
posteriores ao Creators Update. Usar essas propriedades sem querer causaria
uma tela em branco ou uma exceção de XAML só no aparelho de verdade, sem
nenhum jeito de pegar isso na compilação. Espaçamento entre elementos é
sempre feito via `Margin`, que existe desde a v1 do UWP.

## Passo 1 — gerar o certificado de assinatura (uma vez só)

Todo `.appxbundle` precisa ser assinado. Isso é feito automaticamente pelo
GitHub Actions, mas a chave só existe depois que você rodar isso uma vez:

1. No navegador (ou app do GitHub), vá na aba **Actions** do repositório
2. Clique no workflow **"01 - Gerar certificado de assinatura (rodar uma vez)"**
3. Clique em **"Run workflow"** → **"Run workflow"** de novo pra confirmar
4. Espere terminar (~1-2 min). Isso salva a chave privada no repositório
   automaticamente — os próximos builds já vão conseguir assinar sozinhos

Não precisa repetir esse passo depois, a menos que queira trocar o certificado.

## Passo 2 — build automático

Qualquer `git push` que mexa em `www/` ou `uwp/` já dispara o workflow
**"02 - Build do appxbundle"** sozinho. Como você já usa esse fluxo no Termux,
não muda nada na sua rotina.

## Passo 3 — baixar e instalar no Lumia

1. Na aba **Actions**, abra a execução mais recente do workflow 02
2. Baixe o artefato **artistway-appxbundle** (é um `.zip`)
3. Dentro dele, o arquivo que importa é o `.appxbundle` (dentro de uma pasta tipo `ArtistWayUWP_1.0.0.0_Test`)
4. Transfira esse arquivo pro Lumia (e-mail pra você mesmo, OneDrive, cabo — o que for mais fácil)
5. No Lumia: **Configurações > Atualização e segurança > Para desenvolvedores** → ative o **Modo desenvolvedor**
6. Abra o arquivo `.appxbundle` pelo Explorador de Arquivos do próprio celular e toque para instalar

Se der erro de "editor não confiável" ou parecido, o artefato do workflow 01
também inclui um `artistway-public-cert.cer` — nesse caso, transfira esse
arquivo também e instale-o primeiro (ele vai pedir pra confirmar como
certificado confiável), depois tente o `.appxbundle` de novo.

## O que funciona e o que é experimental

- ✅ Todo o app nativo: checklist das 12 semanas, ensaio de cada semana,
  Morning Pages, Artist Date, check-in, jornada, Regras da Estrada,
  Princípios Básicos, Ajustes (perfil, backup, Google Calendar, checador de
  atualização), onboarding
- ✅ Notificações nativas do Windows (toast) para Morning Pages, Artist Date
  e check-in — agendadas em lote (30 dias à frente pra diária, 12 semanas
  pra semanal) toda vez que você salva os ajustes
- ✅ Botão "Adicionar ao Google Calendar" abre o navegador padrão do Windows
  via `Windows.System.Launcher`
- ✅ Backup exportar/importar via `FileSavePicker`/`FileOpenPicker` nativos
- ✅ Checador de atualização via `HttpClient` direto (sem WebView, sem a
  restrição de "conteúdo local" que existia antes)
- ⚠️ Sem service worker/cache offline como no PWA — mas como o conteúdo já
  vem empacotado dentro do próprio app (`Data/content.json`) e os dados do
  usuário ficam em `ApplicationData.LocalFolder`, isso não é necessário:
  tudo funciona offline por padrão
- ⚠️ Arquitetura alvo: ARM (32-bit) — a mesma do Lumia 830. Se um dia usar em
  outro device family Windows 10 Mobile, deve funcionar igual
- 🔜 Live tile ainda não implementada — próxima leva

## Estrutura

```
uwp/ArtistWayUWP/
├── ArtistWayUWP.csproj       ← projeto C#
├── Package.appxmanifest       ← manifesto do app (nome, ícone, TargetDeviceFamily)
├── App.xaml / App.xaml.cs     ← inicialização + carrega o ContentStore
├── MainPage.xaml(.cs)         ← shell nativo: Frame + barra de abas embaixo
├── Data/content.json          ← conteúdo do livro, gerado a partir de www/js/data.js
├── Models/                    ← classes simples (WeekContent, ProfileSettings etc.)
├── Services/                  ← ContentStore, LocalDataStore, NotificationService,
│                                 CalendarLinkService, UpdateCheckService, TileService (em breve)
├── Views/                     ← uma página XAML por tela do app
└── Assets/                    ← ícones do app (gerados, pode trocar por outros)
```

## Erros já resolvidos (histórico, pra referência)

- **`git push` com exit code 128`** no workflow 01: faltava permissão de escrita
  pro token do Actions. Corrigido com `permissions: contents: write` no workflow.
- **`The type or namespace name 'ApplicationModel' does not exist`** (e outros
  erros parecidos de `Windows.*` não encontrado) no workflow 02: o runner
  `windows-latest` do GitHub não vem mais com os metadados do UWP
  (`Windows.winmd`) — a Microsoft removeu esse componente do catálogo padrão
  do Visual Studio Build Tools em versões recentes. Corrigido adicionando um
  passo que instala o Windows 10 SDK 17763 separadamente antes do build
  (`GuillaumeFalourd/setup-windows10-sdk-action`), que traz esses metadados de
  volta independente do Visual Studio.

- **App instala mas fecha na hora de abrir**: builds em modo Release usam o
  compilador .NET Native, que às vezes falha silenciosamente em cenários que
  funcionam bem em modo Debug (JIT normal). Mudei o workflow 02 pra compilar
  em **Debug** — é o padrão usado pela comunidade de sideload caseiro (sem
  loja) exatamente por evitar esse tipo de crash sem explicação. Também
  adicionei um handler de exceção global e uma tela de erro de fallback no
  app: se algo ainda falhar, agora deve aparecer uma mensagem na tela em vez
  de fechar sem avisar — o que já ajuda demais a diagnosticar sem precisar de
  Visual Studio.



## O que fazer se aparecer outro erro parecido

Se voltar a dar erro de `Windows.*` não encontrado, o próximo passo seria
tentar uma versão diferente do SDK (`sdk-version: 18362` ou `19041` no
workflow), já que nem toda versão do instalador standalone funciona 100% em
todo runner. Me manda o log que ajustamos.

