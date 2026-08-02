package com.rodcarvalho.artistway

import android.app.Application
import com.rodcarvalho.artistway.data.LocalDataStore

class ArtistWayApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        LocalDataStore.init(this)
    }
}
