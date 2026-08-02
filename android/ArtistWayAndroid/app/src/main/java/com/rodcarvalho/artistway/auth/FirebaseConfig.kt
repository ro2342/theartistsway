package com.rodcarvalho.artistway.auth

// Mesmo projeto Firebase que UWP e PWA já usam (ver AuthService.cs /
// js/auth.js) — usado só pela URL do Firestore REST em SyncService.kt;
// login em si usa o SDK real do Firebase Auth (google-services.json),
// que não precisa desses valores soltos no código.
object FirebaseConfig {
    const val PROJECT_ID = "theartistsway"
}
