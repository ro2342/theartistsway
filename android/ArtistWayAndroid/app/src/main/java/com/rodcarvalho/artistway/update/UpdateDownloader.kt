package com.rodcarvalho.artistway.update

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

// Baixa o app.apk pra área de cache do app e entrega pro instalador do
// sistema via FileProvider + Intent.ACTION_VIEW — mesmo espírito do
// LaunchFileAsync do UWP (o sistema é quem realmente instala, o app só
// entrega o arquivo). Precisa de REQUEST_INSTALL_PACKAGES no manifesto.
object UpdateDownloader {
    suspend fun download(context: Context, onProgress: (Float) -> Unit): File = withContext(Dispatchers.IO) {
        val file = File(context.cacheDir, "update.apk")
        val conn = URL(UpdateCheckService.DOWNLOAD_FILE_URL).openConnection() as HttpURLConnection
        conn.connectTimeout = 15000
        conn.readTimeout = 15000
        conn.connect()
        val total = conn.contentLengthLong

        conn.inputStream.use { input ->
            file.outputStream().use { output ->
                val buffer = ByteArray(8192)
                var totalRead = 0L
                var read: Int
                while (input.read(buffer).also { read = it } != -1) {
                    output.write(buffer, 0, read)
                    totalRead += read
                    if (total > 0) onProgress(totalRead.toFloat() / total)
                }
            }
        }
        conn.disconnect()
        file
    }

    fun install(context: Context, file: File) {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
