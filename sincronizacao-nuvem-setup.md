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

## O que NÃO me enviar

- O **segredo do cliente** da Microsoft (fica só dentro do Firebase).
- Qualquer senha da sua conta Google/Microsoft/Firebase.

## Resumo do que preciso de volta

1. ✅ Confirmação de que os Passos 1-3 (Firebase/Firestore/login Google no
   Firebase) foram feitos.
2. ✅ O bloco `firebaseConfig` da Parte 5 — **já recebido**.
3. ✅ O **Client ID** e o **Client Secret** do cliente OAuth "TVs e
   dispositivos de entrada limitada" da Parte 6.
4. ⏸️ Parte 4 (registro Microsoft) já feita, mas o login Microsoft por WAM
   está pausado por enquanto (precisa de associação com a Store — ver acima).

Com o Client ID/Secret da Parte 6 eu já implemento o login Google via fluxo
de dispositivo — deve funcionar sem esbarrar nos bloqueios que encontramos
com WAM.
