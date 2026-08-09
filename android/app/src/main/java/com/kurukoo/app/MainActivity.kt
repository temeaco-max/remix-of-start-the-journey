package com.kurukoo.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        // Configure WebView to wrap the Kurukoo PWA
        // Aligns with Phase 2 of Mobile Strategy (§14)
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.setGeolocationEnabled(true)
        webSettings.mediaPlaybackRequiresUserGesture = false

        // Ensure links open within the WebView instead of external browser
        webView.webViewClient = WebViewClient()

        // Load the Kurukoo Web App
        webView.loadUrl("https://kurukoo.com")
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
