package com.solonovate.dour;

import android.app.Activity;
import android.app.Dialog;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;

public class MainActivity extends Activity {
    private WebView webView;
    private Dialog currentPopupDialog;
    private static final int PERMISSION_REQUEST_CODE = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hardware acceleration & clean window flags
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        // Enable popup and multi-window support for Google Sign-In & Auth handlers
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        // Strip WebView flags (; wv and Version/X.X) so Google OAuth allows login without disallowed_useragent
        String origUa = settings.getUserAgentString();
        if (origUa != null) {
            String cleanUa = origUa.replace("; wv", "").replaceAll("Version/[0-9.]+\\s?", "");
            settings.setUserAgentString(cleanUa);
        }

        // Cache configuration for smooth offline gameplay
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Chrome client handles microphone permission and Google Sign-in popups
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        request.grant(request.getResources());
                    }
                });
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                final Dialog dialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                currentPopupDialog = dialog;

                WebView popupWebView = new WebView(MainActivity.this);
                WebSettings popupSettings = popupWebView.getSettings();
                popupSettings.setJavaScriptEnabled(true);
                popupSettings.setDomStorageEnabled(true);
                popupSettings.setDatabaseEnabled(true);
                popupSettings.setAllowFileAccess(true);
                popupSettings.setSupportMultipleWindows(false);
                if (settings.getUserAgentString() != null) {
                    popupSettings.setUserAgentString(settings.getUserAgentString());
                }

                popupWebView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onCloseWindow(WebView window) {
                        if (currentPopupDialog != null && currentPopupDialog.isShowing()) {
                            currentPopupDialog.dismiss();
                            currentPopupDialog = null;
                        }
                        window.destroy();
                    }
                });

                popupWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, String url) {
                        return false;
                    }
                });

                dialog.setContentView(popupWebView);
                dialog.show();

                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popupWebView);
                resultMsg.sendToTarget();
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file://") || url.contains("run.app") || url.startsWith("http")) {
                    return false;
                }
                return false;
            }
        });

        // Request runtime record audio permission if required
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, PERMISSION_REQUEST_CODE);
            }
        }

        // Load local offline production bundle
        webView.loadUrl("file:///android_asset/dist/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (currentPopupDialog != null && currentPopupDialog.isShowing()) {
                currentPopupDialog.dismiss();
                currentPopupDialog = null;
                return true;
            }
            if (webView.canGoBack()) {
                webView.goBack();
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (currentPopupDialog != null && currentPopupDialog.isShowing()) {
            currentPopupDialog.dismiss();
            currentPopupDialog = null;
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
