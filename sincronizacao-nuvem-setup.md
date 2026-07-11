# Sincronização entre aparelhos — guia de setup (Firebase + login Google/Microsoft)

*Passo a passo pra você fazer sozinho nas contas do Google/Microsoft/Firebase
(coisas que só você consegue criar, porque exigem seu login). Quando terminar
cada seção, me manda os valores marcados como "me envie isso" — o resto eu
cuido do lado do código.*

---

## Antes de começar: como isso vai funcionar

Não existe SDK oficial do Firebase pra UWP/Windows Mobile — o app vai
conversar direto com as APIs REST do Firebase (Identity Toolkit pra login,
Firestore pra salvar dados). O login em si (Google e Microsoft) acontece
assim:

1. O app abre uma tela de login do sistema (`WebAuthenticationBroker` —
   um navegador embutido controlado pelo Windows, não uma WebView normal).
2. Essa tela aponta pra um endereço que o próprio Firebase Authentication
   already sabe processar (o "handler" de login dele).
3. Você faz login com Google ou Microsoft normalmente.
4. O Firebase devolve um token pro app, que passa a usar esse token pra
   ler/escrever no Firestore.

A vantagem desse desenho: o **client secret da Microsoft nunca precisa estar
dentro do app** — ele fica só configurado no painel do Firebase, do lado do
servidor. Você não vai precisar me mandar nenhum segredo por aqui.

**Antes de construir tudo em cima disso**, vou primeiro validar com você que
o `WebAuthenticationBroker` realmente abre e completa esse fluxo direito no
Lumia — telefones com Windows 10 Mobile têm histórico de implementações mais
antigas/instáveis de WebView e navegador do sistema (o próprio app já teve
um problema parecido: o OAuth do Google não funciona de dentro da WebView do
APK gerado pelo Capacitor — ver seção "Por que não OAuth de verdade" no
`README.md` principal). Se travar no Lumia especificamente, a alternativa é
fazer login só nas outras plataformas (web/Android) e manter o Windows
Mobile num modo "sincroniza quando eu abrir no navegador", sem login nativo.

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

## O que NÃO me enviar

- O **segredo do cliente** da Microsoft (fica só dentro do Firebase).
- Qualquer senha da sua conta Google/Microsoft/Firebase.

## Resumo do que preciso de volta

1. ✅ Confirmação de que os Passos 1-4 foram feitos.
2. ✅ O bloco `firebaseConfig` da Parte 5.
3. ✅ Confirmação de que o provedor Microsoft aparece como "Ativado" na aba
   Sign-in method do Firebase (não preciso do ID nem do segredo, só saber que
   está configurado).

Com isso eu já consigo começar a implementar o login (primeiro um teste
isolado só de autenticação, pra confirmar que o `WebAuthenticationBroker`
funciona bem no Lumia antes de construir a sincronização de dados em cima).
