# The Artist's Way — Companheiro

App companheiro de leitura para *The Artist's Way* (Julia Cameron), construído
a partir do livro principal + Toolkit + Workbook + Artist's Date Book.

Todo o conteúdo de cada semana foi **reescrito em itens de checklist claros**
(não é cópia do livro) — exatamente para resolver o problema original: as
tarefas no livro vêm misturadas em parágrafos longos e é fácil se perder.

## O que o app faz

- **12 semanas** com checklist de tarefas + introdução do tema de cada semana
- **Morning Pages**: marcação diária com sequência dos últimos 7 dias
- **Artist Date semanal**: banco com 52 ideias, sorteio aleatório, marcação de feito
- **Check-in semanal**: 3 perguntas fixas + 1 pergunta específica do tema da semana
- **Jornada**: grade das 12 semanas, navegação livre (não é preso à ordem)
- **Notificações locais** (nativas, via Capacitor) para Morning Pages, Artist Date e Check-in
- **Botões "Adicionar ao Google Calendar"**: abrem um link pronto do Google Calendar
  com o evento recorrente já preenchido — sem OAuth, sem configurar nada no Google
  Cloud (ver seção "Por que não OAuth de verdade" abaixo)
- **Backup/restore** local em `.json` (os dados ficam só no aparelho)
- Funciona **offline** (service worker + IndexedDB)

## Estrutura do projeto

```
artist-way-app/
├── www/                     ← todo o código do PWA (isso vira o app)
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   ├── css/style.css
│   ├── js/data.js            ← conteúdo das 12 semanas + banco de ideias
│   ├── js/db.js               ← IndexedDB (persistência local)
│   ├── js/notifications.js   ← notificações nativas (Capacitor) + fallback web
│   ├── js/calendar.js        ← geração dos links do Google Calendar
│   ├── js/app.js              ← roteador e telas
│   ├── fonts/                ← Cormorant, Spectral, Caveat (offline, sem CDN)
│   └── icons/
├── package.json               ← dependências do Capacitor
└── capacitor.config.json
```

## Testar agora como PWA (sem instalar nada de Android)

Dentro da pasta `www/`:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080` no navegador do celular (mesma rede Wi-Fi,
usando o IP do computador) ou no navegador do próprio PC. Dá pra "Adicionar à
tela inicial" e já funciona como app instalado, offline.

## Gerando o APK de verdade (primeira vez — Fedora 43 + KDE)

A forma mais simples é **delegar isso ao Claude Code**, rodando direto no seu
Fedora. Não precisa instalar o Android Studio inteiro — só as *command-line
tools* do Android, que são bem mais leves.

### Passo a passo (ou copie o bloco "prompt para o Claude Code" mais abaixo)

**1. Dependências do sistema**
```bash
sudo dnf install -y java-17-openjdk nodejs npm
```

**2. Android command-line tools** (sem Android Studio)
```bash
mkdir -p ~/Android/cmdline-tools
cd ~/Android/cmdline-tools
# baixar a versão mais recente em https://developer.android.com/studio#command-tools
# extrair de forma que fique em ~/Android/cmdline-tools/latest/bin/sdkmanager
```
Configure as variáveis de ambiente (adicione ao `~/.bashrc` ou `~/.zshrc`):
```bash
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```
Instale os pacotes necessários:
```bash
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

**3. Dentro da pasta do projeto**
```bash
npm install
npx cap add android
npx cap sync android
```

**4. Build do APK de debug** (não precisa assinar, já instala direto no celular)
```bash
cd android
./gradlew assembleDebug
```
O APK sai em: `android/app/build/outputs/apk/debug/app-debug.apk`

**5. Instalar no celular**
- Copie o `.apk` para o celular (cabo, WhatsApp, o que for) e abra — o Android
  vai pedir para permitir "instalar de fontes desconhecidas" na primeira vez; ou
- Com o celular conectado via USB e depuração USB ativada:
  ```bash
  adb install android/app/build/outputs/apk/debug/app-debug.apk
  ```

Isso já é um APK de verdade, instalável, com ícone na tela, funcionando
offline e com notificações nativas. Para gerar uma versão assinada (release),
o Claude Code te guia quando você quiser distribuir de forma mais permanente.

### Prompt pronto para colar no Claude Code

```
Estou no diretório do projeto "The Artist's Way — Companheiro" (Capacitor +
web vanilla, webDir=www). Fedora 43, sem Android Studio instalado. Quero que
você: 1) verifique/instale Java 17, Node e as Android command-line tools
(sem Android Studio completo); 2) rode npm install, npx cap add android,
npx cap sync android; 3) gere o APK de debug com ./gradlew assembleDebug;
4) me diga o caminho final do .apk e como instalar no meu celular Android
via adb ou transferência manual. Se algo faltar no sistema, instale via dnf
perguntando antes se precisar de sudo.
```

## Por que não OAuth de verdade com o Google Calendar?

O Google bloqueia o fluxo de login OAuth dentro de WebViews embutidas (é
assim que um APK gerado por Capacitor renderiza a página) — retorna erro
`disallowed_useragent`. Fazer OAuth "de verdade" exigiria um projeto no
Google Cloud, tela de consentimento, client ID Android com o SHA-1 da sua
chave de assinatura, e abrir o login num navegador do sistema separado.

Em vez disso, o app usa `calendar.google.com/calendar/render?...` — um link
que abre o Google Calendar (app ou navegador) já preenchido com o evento
recorrente; você só confirma "Salvar". Um toque, sem configuração, e o evento
some com as notificações nativas do próprio Google Calendar. Se um dia você
quiser evoluir para sincronização de verdade (o app criar/atualizar/apagar
eventos sozinho), o caminho é o OAuth completo — posso te ajudar a montar
isso depois, como uma v2.

## Customizando depois

- **Conteúdo das semanas**: tudo em `www/js/data.js`, no array `WEEKS`.
- **Banco de ideias de Artist Date**: array `ARTIST_DATE_IDEAS` no mesmo arquivo.
- **Cores/fontes**: variáveis CSS no topo de `www/css/style.css`.
- **Ícone do app**: substitua os arquivos em `www/icons/` (mesmos nomes/tamanhos).
