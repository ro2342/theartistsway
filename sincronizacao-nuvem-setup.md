# Sincronização entre aparelhos — guia de setup (Firebase + login Google/Microsoft)

*Passo a passo pra você fazer sozinho nas contas do Google/Microsoft/Firebase
(coisas que só você consegue criar, porque exigem seu login). Quando terminar
cada seção, me manda os valores marcados como "me envie isso" — o resto eu
cuido do lado do código.*

---

## Antes de começar: como isso vai funcionar

Não existe SDK oficial do Firebase pra UWP/Windows Mobile — o app conversa
direto com as APIs REST do Firebase (Identity Toolkit pra login, Firestore
pra salvar dados). O jeito de conseguir o login em si **é diferente pra cada
provedor**, porque tentamos os caminhos "nativos" primeiro e esbarramos em
bloqueios reais nos dois:

- **Microsoft**: tentamos WAM (`WebAuthenticationCoreManager`, reaproveitando
  a conta já logada no aparelho, sem navegador). Só que login de conta
  **pessoal** via WAM exige o app **associado à Microsoft Store** (conta de
  desenvolvedor paga, ~$19, e o app ganharia uma identidade nova) — não
  funciona com o certificado de sideload que usamos. Por enquanto o login
  Microsoft fica pausado por causa disso.
- **Google**: o cliente OAuth "nativo UWP" do Google **também** exige Store
  ID, mesmo bloqueio. Por isso vamos pelo **fluxo de dispositivo** (Device
  Authorization Grant) — o mesmo mecanismo que Smart TVs usam pra logar:
  o app mostra um código e um link; você abre esse link em **qualquer
  navegador, em qualquer aparelho** (o celular, o PC, não precisa ser no
  próprio Lumia), digita o código, e o app fica esperando a confirmação.
  Sem Store, sem redirect URI, sem depender do navegador antigo do sistema
  renderizar nada complexo.

---

## Parte 1 — Criar o projeto no Firebase

1. Acesse **console.firebase.google.com** (com a conta Google que você quiser
   usar como dona do projeto).
2. **Adicionar projeto** → dê um nome (sugestão: `artist-way-companion`) →
   pode desativar o Google Analytics se não for usar (não precisamos dele).
3. Espere o projeto ser criado e abra o painel dele.

## Parte 2 — Ativar o Firestore (banco de dados)

1. No menu lateral, **Compilação → Firestore Database**.
2. **Criar banco de dados**.
3. Localização: qualquer região próxima de você (ex.: `southamerica-east1`
   se existir na lista, ou `us-central` como alternativa).
4. Modo: comece em **modo de teste** (regras abertas por 30 dias) — antes de
   ir pra produção de verdade a gente aperta as regras de segurança
   (garantir que cada pessoa só lê/escreve os próprios dados). Não esqueça
   de me lembrar disso quando chegarmos nessa parte do código.

## Parte 3 — Ativar o login por Google

1. Menu lateral → **Compilação → Authentication** → **Vamos começar**.
2. Aba **Sign-in method** → **Adicionar novo provedor** → **Google**.
3. Ative o toggle, escolha um e-mail de suporte (o seu mesmo), **Salvar**.
4. Não precisa mais nada aqui — o Firebase já cuida de tudo do lado do
   Google automaticamente.

## Parte 4 — Registrar um app na Microsoft (pro login Microsoft)

Isso é necessário porque, ao contrário do Google, o Firebase não tem um
provedor "Microsoft" pronto de fábrica — ele entra como um provedor OAuth
genérico, e por isso precisa de um app registrado por você no lado da
Microsoft.

1. Acesse **entra.microsoft.com** (o portal novo do Azure AD/Entra ID) ou
   **portal.azure.com** → busque "Registros de aplicativo" (App
   registrations).
2. **Novo registro**:
   - Nome: `Artist Way Companion` (ou o que preferir)
   - Tipos de conta com suporte: **Contas em qualquer diretório
     organizacional e contas pessoais da Microsoft** (a opção mais ampla —
     assim qualquer pessoa com conta Microsoft consegue logar, não só quem
     tem organização corporativa)
   - Redirect URI: deixe em branco por enquanto, vamos voltar aqui.
3. Depois de criar, anote o **Application (client) ID** — é o primeiro valor
   que vou pedir mais abaixo. bf179c88-8388-4ffb-a90a-d8676d4e9513
4. Vá em **Certificados e segredos** (Certificates & secrets) → **Novo
   segredo do cliente** → crie um, copie o **valor** dele na hora (some
   depois de sair da tela). Guarde num lugar seguro por enquanto (não precisa
   me mandar ainda). 
5. Volte no **console do Firebase** → Authentication → Sign-in method →
   **Adicionar novo provedor** → **Microsoft**.
6. Cole ali o **Application (client) ID** e o **segredo do cliente** que você
   acabou de criar.
7. O Firebase vai te mostrar um **URI de redirecionamento** (algo como
   `https://SEU-PROJETO.firebaseapp.com/__/auth/handler`) — copie esse valor.
8. Volte pro registro do app na Microsoft → **Autenticação** (Authentication)
   → **Adicionar uma plataforma** → **Web** → cole o URI de redirecionamento
   que o Firebase te deu → **Salvar**. 
9. No Firebase, clique em **Salvar** pra confirmar o provedor Microsoft.

A partir daqui, o segredo do cliente já está guardado só dentro do Firebase
— você não precisa (e não deve) me mandar esse valor.

## Parte 5 — Pegar a configuração pública do Firebase (essa você me envia)

1. No console do Firebase → ícone de engrenagem → **Configurações do
   projeto**.
2. Aba **Geral** → role até "Seus apps" → **Adicionar app** → ícone **`</>`
   (Web)**.
3. Dê um apelido (ex.: `artist-way-uwp`) — não precisa marcar "Firebase
   Hosting".
4. Ele vai te mostrar um bloco de código parecido com isto:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**Me envie esse bloco inteiro** (esses valores são públicos por natureza —
qualquer app cliente do Firebase os expõe, inclusive sites — o que protege
os dados de verdade são as regras de segurança do Firestore, não esconder
esses valores).

## Parte 6 — Criar o cliente OAuth do Google (fluxo de dispositivo)

1. Acesse **console.cloud.google.com** — escolha o mesmo projeto do Firebase
   (`theartistsway`, ele já existe como projeto do Google Cloud também,
   Firebase é construído em cima do GCP).
2. Menu lateral → **APIs e serviços** → **Tela de consentimento OAuth**
   (OAuth consent screen), se ainda não tiver configurado:
   - Tipo de usuário: **Externo**.
   - Nome do app: `Artist's Way Companion` (ou o que preferir), e-mail de
     suporte: o seu.
   - Escopos: pode deixar os básicos (`.../auth/userinfo.email`,
     `.../auth/userinfo.profile`, `openid`) — não precisa adicionar nada
     extra.
   - Salvar e continuar até publicar (ou deixar em modo de teste, adicionando
     seu próprio e-mail como "usuário de teste" — funciona igual pro nosso
     caso).
3. **APIs e serviços → Credenciais** → **Criar credenciais** → **ID do
   cliente OAuth**.
4. **Tipo de aplicativo**: escolha **"TVs e dispositivos de entrada
   limitada"** (TVs and Limited Input devices) — é esse tipo específico que
   habilita o fluxo de dispositivo, sem pedir Store ID nem redirect URI.
5. Dê um nome (ex.: `artist-way-uwp-device`) → **Criar**.
6. Vai aparecer um **Client ID** e um **Client Secret** — **me envie os
   dois**. Diferente do segredo da Microsoft, o próprio Google trata esse
   client secret como não-confidencial nesse tipo de fluxo (é feito pra ficar
   embutido em apps instalados, sem servidor) — mas mesmo assim evite deixar
   público em qualquer lugar além daqui.

## Parte 7 — Cliente OAuth "Desktop app" (tela de consentimento normal)

O fluxo de dispositivo (Parte 6) funciona, mas pede pra digitar um código
num outro navegador — mais fricção do que o usuário queria. Esse aqui dá a
experiência padrão ("ArtistWay quer acessar sua Conta Google — Permitir?"),
sem pedir Store, usando um redirecionamento local que o próprio Windows
intercepta antes de precisar de servidor nenhum de verdade.

1. **APIs e serviços → Credenciais** → **Criar credenciais** → **ID do
   cliente OAuth**.
2. **Tipo de aplicativo**: **"Aplicativo para computador"** (Desktop app) —
   **não** escolha "Universal Windows Platform" (esse exige Store ID).
3. Nome: `artist-way-uwp-desktop` (ou o que preferir) → **Criar**.
4. Vai aparecer um **Client ID** e um **Client Secret** — **me envie os
   dois**, do mesmo jeito que os da Parte 6.

## O que NÃO me enviar

- O **segredo do cliente** da Microsoft (fica só dentro do Firebase).
- Qualquer senha da sua conta Google/Microsoft/Firebase.

## Resumo do que preciso de volta

1. ✅ Confirmação de que os Passos 1-3 (Firebase/Firestore/login Google no
   Firebase) foram feitos.
2. ✅ O bloco `firebaseConfig` da Parte 5 — **já recebido**.
3. ✅ Client ID/Secret do cliente "TVs e dispositivos de entrada limitada"
   da Parte 6 — **já recebido** (fluxo de dispositivo, funcionando).
4. 🆕 Client ID/Secret do cliente **"Desktop app"** da Parte 7 — pra dar a
   experiência de tela de consentimento normal, sem digitar código.
5. ⏸️ Parte 4 (registro Microsoft) já feita, mas o login Microsoft por WAM
   está pausado por enquanto (precisa de associação com a Store — ver acima).

Assim que eu tiver o Client ID/Secret da Parte 7, troco o login Google pra
essa experiência.

## Atualização — tela de consentimento + sessão persistida (v2.0.0.15)

Já implementado:

- O botão "Entrar com Google" em Ajustes agora usa a Parte 7 (tela de
  consentimento normal, sem digitar código).
- Depois de logar com sucesso, o app guarda uid/idToken/refreshToken/e-mail
  no **PasswordVault** do Windows (cofre de credenciais criptografado pelo
  sistema — `Services/SessionService.cs`), e o card de Ajustes passa a
  mostrar "Logado como fulano@gmail.com (Google)" com um botão "Sair".

Ainda **não** implementado (é o próximo passo, mais trabalhoso): a
sincronização de dados em si — pegar o conteúdo do `LocalDataStore` (Morning
Pages, Artist Dates, checklist, check-ins) e espelhar num documento do
Firestore por usuário (`users/{uid}/...`), com alguma resolução de conflito
quando o mesmo dado muda em dois aparelhos antes de sincronizar. O login
guardado agora é a base pra isso (já temos o `uid` e o `idToken` pra
autenticar as chamadas ao Firestore), mas o mecanismo de push/pull ainda
precisa ser desenhado e construído.

## Parte 8 — Cliente OAuth "Web application" (login Google no PWA)

O PWA roda num navegador de verdade com endereço HTTPS real (GitHub Pages),
então o login lá não precisa das gambiarras do UWP (device flow/loopback) —
usa o fluxo padrão de site (Authorization Code + PKCE), **sem client
secret nenhum** (PKCE existe exatamente pra isso: clientes que rodam no
navegador do usuário e não conseguem guardar segredo com segurança).

1. **console.cloud.google.com** → **APIs e serviços → Credenciais** →
   **Criar credenciais** → **ID do cliente OAuth**.
2. **Tipo de aplicativo**: **"Aplicativo da Web"** (Web application).
3. Nome: `artist-way-pwa` (ou o que preferir).
4. Em **URIs de redirecionamento autorizados**, adicione a URL do GitHub
   Pages do app (ex.: `https://ro2342.github.io/theartistsway/` — me
   confirme a URL exata que o Pages está usando se não tiver certeza).
5. **Criar** → vai aparecer só um **Client ID** (sem secret, é esperado
   pra esse tipo) — **me envie esse valor**.

## Parte 9 — Travar as regras do Firestore

As regras hoje estão em "modo de teste" (abertas, expiram sozinhas em 30
dias) — enquanto isso, qualquer um com a apiKey pública do projeto
conseguiria ler/escrever os dados de qualquer usuário. Antes de a
sincronização entrar em uso de verdade, precisa travar isso:

1. **console.firebase.google.com** → seu projeto → **Firestore Database**
   → aba **Regras**.
2. Substitua o conteúdo por:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/stores/{store} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
3. **Publicar**.

Isso garante que cada pessoa só consegue ler/escrever os próprios dados
(comparando o `uid` do token de login com o `uid` no caminho do
documento) — ninguém mais, nem com a apiKey em mãos.

## Resumo atualizado do que preciso de volta

1. 🆕 Client ID do cliente **"Web application"** da Parte 8 (login Google
   no PWA).
2. 🆕 Confirmação de que publicou as regras da Parte 9 no Firestore.
