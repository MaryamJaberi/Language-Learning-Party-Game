#!/bin/bash
set -e

echo "=== 1. Preparing Directories ==="
mkdir -p android/src/com/dour/languagegame
mkdir -p android/res/values
mkdir -p android/res/mipmap-hdpi
mkdir -p android/res/mipmap-mdpi
mkdir -p android/res/mipmap-xhdpi
mkdir -p android/res/mipmap-xxhdpi
mkdir -p android/res/mipmap-xxxhdpi
mkdir -p android/assets/dist
mkdir -p android/obj
mkdir -p android/bin
mkdir -p public/downloads
mkdir -p public/.well-known
mkdir -p dist/.well-known

echo "=== 2. Generating Release Keystore ==="
if [ ! -f "release.keystore" ]; then
  keytool -genkeypair -v \
    -keystore release.keystore \
    -alias dor-release \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass dorzaban2026 \
    -keypass dorzaban2026 \
    -dname "CN=Dor Zaban, OU=Mobile, O=Turn Game, L=Tehran, ST=Tehran, C=IR"
  echo "Keystore created successfully."
fi

# Extract SHA-256 fingerprint
SHA256_FINGERPRINT=$(keytool -list -v -keystore release.keystore -storepass dorzaban2026 -alias dor-release | grep -i "SHA256:" | head -n 1 | awk '{print $2}')
echo "Certificate SHA-256: $SHA256_FINGERPRINT"

# Write assetlinks.json
cat <<EOF > public/.well-known/assetlinks.json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.dour.languagegame",
      "sha256_cert_fingerprints": [
        "$SHA256_FINGERPRINT"
      ]
    }
  }
]
EOF
cp public/.well-known/assetlinks.json dist/.well-known/assetlinks.json

echo "=== 3. Copying Web Assets to Android Assets ==="
cp -r dist/* android/assets/dist/

echo "=== 4. Creating Android Resources and Manifest ==="
cat << 'EOF' > android/res/values/strings.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">دور: زبان</string>
    <string name="package_name">com.dour.languagegame</string>
</resources>
EOF

cat << 'EOF' > android/res/values/styles.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">
        <item name="android:windowBackground">@android:color/white</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowFullscreen">false</item>
    </style>
</resources>
EOF

# Copy app icons to mipmap
if [ -f "public/pwa-192x192.png" ]; then
  cp public/pwa-192x192.png android/res/mipmap-hdpi/ic_launcher.png
  cp public/pwa-192x192.png android/res/mipmap-mdpi/ic_launcher.png
  cp public/pwa-192x192.png android/res/mipmap-xhdpi/ic_launcher.png
  cp public/pwa-512x512.png android/res/mipmap-xxhdpi/ic_launcher.png
  cp public/pwa-512x512.png android/res/mipmap-xxxhdpi/ic_launcher.png
fi

cat << 'EOF' > android/AndroidManifest.xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.dour.languagegame"
    android:versionCode="10001"
    android:versionName="1.0.1">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

echo "=== 5. Writing MainActivity.java ==="
cat << 'EOF' > android/src/com/dour/languagegame/MainActivity.java
package com.dour.languagegame;

import android.app.Activity;
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

        // Cache configuration for smooth offline gameplay
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Chrome client handles microphone permission for pronunciation practice
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
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
EOF

echo "=== 6. Compiling Android App ==="
# 6a. Generate R.java
aapt package -m -J android/src -M android/AndroidManifest.xml -S android/res -I /usr/lib/android-sdk/platforms/android-23/android.jar

# 6b. Compile Java files
rm -rf android/obj/*
javac -source 1.8 -target 1.8 \
  -bootclasspath /usr/lib/android-sdk/platforms/android-23/android.jar \
  -d android/obj \
  android/src/com/dour/languagegame/*.java

# 6c. Convert classes to DEX bytecode
rm -f android/bin/classes.dex
dx --dex --output=android/bin/classes.dex android/obj

# 6d. Package resources and assets into APK
rm -f android/bin/app-unaligned.apk
aapt package -f \
  -M android/AndroidManifest.xml \
  -S android/res \
  -A android/assets \
  -I /usr/lib/android-sdk/platforms/android-23/android.jar \
  -F android/bin/app-unaligned.apk

# 6e. Add classes.dex to APK
cd android/bin
aapt add app-unaligned.apk classes.dex
cd ../..

# 6f. Zipalign APK (align on 4-byte boundaries for memory efficiency)
rm -f android/bin/app-aligned.apk
zipalign -f -p 4 android/bin/app-unaligned.apk android/bin/app-aligned.apk

# 6g. Sign APK with apksigner (v1, v2, v3 signatures for modern Android & Google Play standards)
rm -f public/downloads/dor-zaban-v1.0.apk
apksigner sign \
  --ks release.keystore \
  --ks-pass pass:dorzaban2026 \
  --ks-key-alias dor-release \
  --key-pass pass:dorzaban2026 \
  --out public/downloads/dor-zaban-v1.0.apk \
  android/bin/app-aligned.apk

# 6h. Verify signed APK
echo "=== 7. Verifying Signed APK ==="
apksigner verify -v public/downloads/dor-zaban-v1.0.apk

echo "SUCCESS: public/downloads/dor-zaban-v1.0.apk has been generated and signed!"
ls -lh public/downloads/dor-zaban-v1.0.apk
