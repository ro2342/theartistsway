// auth.js — login com Google no PWA, via Authorization Code + PKCE.
//
// Diferente do app UWP (que roda num WebView antigo sem origem HTTPS
// própria e por isso precisou de loopback/device flow), o PWA roda num
// navegador de verdade, com endereço HTTPS real (GitHub Pages) — então usa
// o fluxo padrão de login de site: redireciona pro Google, o Google
// redireciona de volta com um "code", e troca esse code por tokens com
// PKCE + client_secret — ao contrário de outros provedores, o Google
// exige o secret mesmo em clientes "Web application" com PKCE. O secret
// nunca fica em texto puro aqui: o workflow 02-build-appx.yml substitui o
// placeholder abaixo pelo valor real (guardado como GitHub Actions secret)
// só no artefato publicado no Pages — o arquivo commitado no git sempre
// mantém o placeholder. Mesmo esquema já usado pro client secret do UWP.
//
// Precisa de contexto seguro (HTTPS ou http://localhost) porque usa
// crypto.subtle — funciona em ro2342.github.io/theartistsway/, não
// funciona acessando por IP na rede local em HTTP puro.

const GOOGLE_WEB_CLIENT_ID = "431486750791-boejg1gtvt082b9hqpl5hjd3mqg3kh1c.apps.googleusercontent.com";
const GOOGLE_WEB_CLIENT_SECRET = "__GOOGLE_OAUTH_WEB_CLIENT_SECRET__";
const FIREBASE_API_KEY = "AIzaSyD8xvN_LU11KY51em_RsCaksRmXDmlXF48";
const AUTH_REDIRECT_URI = window.location.origin + window.location.pathname;
const AUTH_STATE_KEY = "artistway_oauth_state";
const AUTH_VERIFIER_KEY = "artistway_oauth_verifier";

function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return base64UrlEncode(new Uint8Array(digest));
}

async function startGoogleLogin() {
  const verifier = randomString(32);
  const state = randomString(16);
  const challenge = await sha256Base64Url(verifier);

  sessionStorage.setItem(AUTH_VERIFIER_KEY, verifier);
  sessionStorage.setItem(AUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: GOOGLE_WEB_CLIENT_ID,
    redirect_uri: AUTH_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  window.location.href = "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();
}

// Troca o id_token do Google pelo login do Firebase — mesma chamada REST
// que o AuthService.cs usa no UWP (Identity Toolkit signInWithIdp).
async function exchangeWithFirebase(token, tokenParamName) {
  const postBody = `${tokenParamName}=${encodeURIComponent(token)}&providerId=google.com`;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postBody, requestUri: AUTH_REDIRECT_URI, returnIdpCredential: true, returnSecureToken: true }),
    }
  );
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error ? json.error.message : "Falha no login com o Firebase.");
  }
  return {
    uid: json.localId,
    idToken: json.idToken,
    refreshToken: json.refreshToken,
    email: json.email || null,
    displayName: json.displayName || null,
    provider: "Google",
    idTokenExpiresAt: new Date(Date.now() + (parseInt(json.expiresIn, 10) || 3600) * 1000).toISOString(),
  };
}

// Se a URL atual tem ?code=...&state=..., completa o login em andamento.
// Chamado uma vez, ao carregar o app.
async function handleRedirectIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code) return;

  const expectedState = sessionStorage.getItem(AUTH_STATE_KEY);
  const verifier = sessionStorage.getItem(AUTH_VERIFIER_KEY);
  sessionStorage.removeItem(AUTH_STATE_KEY);
  sessionStorage.removeItem(AUTH_VERIFIER_KEY);

  // Limpa ?code=/?state= da barra de endereço antes de mais nada, sucesso
  // ou erro — não queremos que um F5 tente reusar o code (só vale uma vez).
  window.history.replaceState({}, "", window.location.pathname + window.location.hash);

  if (params.get("error")) {
    console.warn("Login com Google cancelado/erro:", params.get("error"));
    return;
  }
  if (!verifier || state !== expectedState) {
    console.warn("Login com Google: state inválido ou verifier perdido.");
    return;
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_WEB_CLIENT_ID,
      client_secret: GOOGLE_WEB_CLIENT_SECRET,
      code,
      code_verifier: verifier,
      redirect_uri: AUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokenJson = await tokenResponse.json();
  if (!tokenResponse.ok) {
    console.warn("Falha ao trocar o code do Google:", tokenJson);
    return;
  }

  const token = tokenJson.id_token || tokenJson.access_token;
  const tokenParamName = tokenJson.id_token ? "id_token" : "access_token";
  const session = await exchangeWithFirebase(token, tokenParamName);
  await window.ArtistWayDB.setSetting("session", session);

  // O redirect do Google derruba o hash da URL (redirect_uri não leva
  // fragmento) — sem isso, quem loga na tela de onboarding ("já é
  // usuário?") volta pro app sem nenhuma navegação acontecer, preso na
  // tela de boas-vindas mesmo depois do perfil da nuvem já ter chegado.
  if (window.ArtistWaySync) {
    await window.ArtistWaySync.syncAll().catch((err) => console.warn("Sincronização falhou:", err));
  }
  // Aponta o hash explicitamente pro destino certo (não dá pra confiar no
  // valor atual: pode ser "" ainda, ou já ter virado #/onboarding via
  // boot() antes desse sync terminar) e força um render — cobre tanto o
  // caso de mudança de hash real (dispara hashchange) quanto o caso em
  // que o hash já era esse (hashchange não dispara sozinho).
  const syncedProfile = await window.ArtistWayDB.getSetting("profile", null);
  if (syncedProfile && syncedProfile.onboarded) {
    window.location.hash = "#/home";
  } else {
    // Conta nova/sem dado salvo: não achou perfil pra pular onboarding —
    // continua do passo 1 (boas-vindas), já logado, em vez de voltar pro
    // passo 0 ("já é usuário?") que a pessoa acabou de responder.
    window.__onboardStep = 1;
    window.location.hash = "#/onboarding";
  }
  if (window.ArtistWayApp) window.ArtistWayApp.render();
}

async function getSession() {
  return window.ArtistWayDB.getSetting("session", null);
}

async function signOut() {
  await window.ArtistWayDB.setSetting("session", null);
}

// Renova o idToken via refresh token — mesmo endpoint que o SyncService.cs
// usa no UWP (securetoken.googleapis.com).
async function refreshIdToken(session) {
  try {
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken }),
    });
    const json = await response.json();
    if (!response.ok) return null;

    const updated = Object.assign({}, session, {
      idToken: json.id_token,
      idTokenExpiresAt: new Date(Date.now() + (parseInt(json.expires_in, 10) || 3600) * 1000).toISOString(),
    });
    await window.ArtistWayDB.setSetting("session", updated);
    return updated;
  } catch (err) {
    return null;
  }
}

function needsRefresh(session) {
  // Margem de 60s antes do vencimento de verdade, igual ao SessionService.cs.
  return new Date(session.idTokenExpiresAt).getTime() - 60000 <= Date.now();
}

window.ArtistWayAuth = {
  startGoogleLogin,
  handleRedirectIfNeeded,
  getSession,
  signOut,
  refreshIdToken,
  needsRefresh,
};

// Roda uma vez ao carregar o script — é assim que o retorno do redirect
// do Google (?code=...) é processado, sem precisar que nenhuma tela
// específica esteja aberta.
handleRedirectIfNeeded().catch((err) => console.warn("Erro ao processar retorno do login com Google:", err));
