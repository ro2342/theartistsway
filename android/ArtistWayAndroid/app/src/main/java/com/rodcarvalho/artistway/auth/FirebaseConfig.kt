package com.rodcarvalho.artistway.auth

// Mesmo projeto Firebase que UWP e PWA já usam (ver AuthService.cs /
// js/auth.js) — API key do Firebase é um identificador público, não uma
// chave secreta de verdade, por isso pode ficar direto no código.
object FirebaseConfig {
    const val API_KEY = "AIzaSyD8xvN_LU11KY51em_RsCaksRmXDmlXF48"
    const val PROJECT_ID = "theartistsway"
}
