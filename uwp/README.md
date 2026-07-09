# Artist's Way — versão UWP (Windows 10 Mobile / Lumia)

Projeto experimental: um app UWP em C# que hospeda o mesmo código web do
Companheiro (`www/`, o mesmo usado no PWA e no APK) dentro de uma WebView em
tela cheia, com notificações nativas do Windows e abertura de links externos
via ponte JavaScript ↔ C#.

**Aviso importante:** eu não tenho como compilar nem testar isso antes de você
rodar — não existe toolchain UWP fora do Windows, e meu ambiente aqui é Linux.
Escrevi tudo com o máximo de cuidado e validei a sintaxe de cada arquivo (XML,
XAML, C#), mas é bem possível que o primeiro build no GitHub Actions aponte
algum erro pontual (versão de SDK, algum detalhe do manifesto). Se acontecer,
me cola o log de erro do Actions que a gente ajusta.

## Por que C# e não JavaScript puro

Pesquisei antes de escrever qualquer coisa: o tipo de projeto UWP "só
JavaScript" (`.jsproj`) foi descontinuado a partir do Visual Studio 2019 e não
builda mais em ferramentas atuais. Por isso o app é C# com uma `WebView`
carregando o `www/` local — mais verboso, mas é o caminho que realmente
compila hoje.

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

- ✅ Todo o app (checklist das 12 semanas, Morning Pages, Artist Date, check-in, jornada) — mesmo código do PWA
- ✅ Notificações nativas do Windows (toast) para Morning Pages, Artist Date e check-in — agendadas em lote (30 dias à frente pra diária, 12 semanas pra semanal) toda vez que você salva os ajustes
- ✅ Botão "Adicionar ao Google Calendar" abre o navegador padrão do Windows via `Windows.System.Launcher`
- ⚠️ Sem service worker/cache offline como no PWA — mas como o conteúdo já vem empacotado dentro do próprio app, isso não é necessário: tudo funciona offline por padrão
- ⚠️ Arquitetura alvo: ARM (32-bit) — a mesma do Lumia 830. Se um dia usar em outro device family Windows 10 Mobile, deve funcionar igual

## Estrutura

```
uwp/ArtistWayUWP/
├── ArtistWayUWP.csproj      ← projeto C#, referencia o www/ da raiz (sem duplicar)
├── Package.appxmanifest      ← manifesto do app (nome, ícone, TargetDeviceFamily)
├── App.xaml / App.xaml.cs    ← inicialização padrão UWP
├── MainPage.xaml             ← WebView em tela cheia
├── MainPage.xaml.cs          ← ponte JS↔C#: notificações + abrir links
└── Assets/                   ← ícones do app (gerados, pode trocar por outros)
```

O `www/` usado aqui é o mesmo da raiz do repositório — qualquer mudança que
você (ou eu) fizer no PWA/APK é refletida automaticamente aqui no próximo
build, sem precisar copiar nada manualmente.
