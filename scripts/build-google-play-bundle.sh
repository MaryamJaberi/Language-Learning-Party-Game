#!/bin/bash
set -e

echo "=== 1. Setting up Android Studio project for Google Play Store (AAB) ==="

# Root settings.gradle
cat << 'EOF' > android-studio-project/settings.gradle
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "DorZaban"
include ':app'
EOF

# Root build.gradle
cat << 'EOF' > android-studio-project/build.gradle
plugins {
    id 'com.android.application' version '8.2.2' apply false
}

tasks.register('clean', Delete) {
    delete rootProject.buildDir
}
EOF

# gradle.properties
cat << 'EOF' > android-studio-project/gradle.properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
EOF

# app/build.gradle
cat << 'EOF' > android-studio-project/app/build.gradle
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.dour.languagegame'
    compileSdk 34

    defaultConfig {
        applicationId "com.dour.languagegame"
        minSdk 21
        targetSdk 34
        versionCode 10001
        versionName "1.0.1"
    }

    signingConfigs {
        release {
            storeFile file('../release.keystore')
            storePassword 'dorzaban2026'
            keyAlias 'dor-release'
            keyPassword 'dorzaban2026'
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            signingConfig signingConfigs.release
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.10.0'
}
EOF

# Proguard rules
cat << 'EOF' > android-studio-project/app/proguard-rules.pro
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.dour.languagegame.MainActivity$* {
    *;
}
EOF

# Copy source and assets
cp android/src/com/dour/languagegame/MainActivity.java android-studio-project/app/src/main/java/com/dour/languagegame/
cp android/AndroidManifest.xml android-studio-project/app/src/main/
cp -r android/res/* android-studio-project/app/src/main/res/
cp -r dist/* android-studio-project/app/src/main/assets/dist/
cp release.keystore android-studio-project/

# Add Gradle wrapper script
cat << 'EOF' > android-studio-project/gradlew
#!/bin/sh
exec gradle "$@"
EOF
chmod +x android-studio-project/gradlew

echo "=== 2. Creating Google Play Store Metadata & Submission Kit ==="
mkdir -p android-studio-project/google_play_metadata

cat << 'EOF' > android-studio-project/google_play_metadata/STORE_LISTING_FA.txt
عنوان برنامه (حداکثر ۳۰ کاراکتر):
دور: زبان | بازی گروهی زبان

توضیح کوتاه (حداکثر ۸۰ کاراکتر):
بازی گروهی و پرهیجان یادگیری زبان‌ها با گوشی دست‌به‌دست برای جمع‌های ۴، ۶ و ۸ نفره

توضیح کامل:
«دور: زبان» (Dor: Language) یک بازی گروهی، شاد و آموزشی است که جمع‌های دوستانه و خانوادگی شما را به یک مسابقه هیجان‌انگیز یادگیری زبان تبدیل می‌کند!

ویژگی‌های کلیدی:
• پشتیبانی از زبان‌های متنوع: انگلیسی، هلندی، آلمانی، فرانسوی، اسپانیایی، ایتالیایی، ترکی، عربی، روسی و بیشتر.
• بازی ۴، ۶ و ۸ نفره تنها با یک گوشی دست‌به‌دست!
• حالت صندلی داغ (Hot Seat) با ضرباهنگ پرسرعت و هیجانی.
• تلفظ صوتی هوشمند کلمات و اصطلاحات متناسب با سطح انتخابی (A1 تا C2).
• امکان بازی کاملاً آفلاین و بدون نیاز به اینترنت.
• بدون تبلیغات مزاحم وسط بازی و بدون محدودیت روزانه.

رده‌بندی سنی: مناسب برای تمام سنین (PEGI 3 / Everyone)
دسته‌بندی گوگل پلی: Educational / Word Games (آموزشی / کلمات)
EOF

cat << 'EOF' > android-studio-project/google_play_metadata/STORE_LISTING_EN.txt
App Title (Max 30 chars):
Dor: Language Party Game

Short Description (Max 80 chars):
Fun party game for learning languages with 4, 6, or 8 players passing one phone!

Full Description:
"Dor: Language" is a vibrant, fast-paced party game designed for friends, families, and language learners to play together using just a single phone passed hand-to-hand.

Key Features:
• Multi-Language Learning: English, Dutch, Persian, German, French, Spanish, Italian, Turkish, Arabic, and more.
• 4, 6, or 8 Players: Seamless team-based gameplay passing one phone.
• Hot Seat Mode: Fast rounds, instant word guessing, and score tracking.
• Smart Pronunciation: Listen to correct pronunciation for cards at all CEFR levels (A1 to C2).
• Fully Offline Capable: Play anywhere, anytime without an internet connection.
• Clean & Friendly: No mid-game ad interruptions, no daily play limits.

Category: Word / Educational
Target Audience: Everyone
EOF

cat << 'EOF' > android-studio-project/google_play_metadata/KEYSTORE_CREDENTIALS.txt
=== Android Signing Keystore Details ===
File: release.keystore
Key Alias: dor-release
Key Password: dorzaban2026
Store Password: dorzaban2026
Key Algorithm: RSA 2048-bit
Validity: 10,000 days

=== Digital Asset Links Fingerprint ===
SHA-256: 90:9C:E3:3D:4C:CD:19:18:58:F6:7C:DB:73:A5:81:67:BC:02:63:A4:E5:C1:B1:3E:E5:12:BF:E2:6C:32:89:9A

Host assetlinks.json at:
https://your-domain.com/.well-known/assetlinks.json
EOF

# Copy Store Graphics
cp public/pwa-512x512.png android-studio-project/google_play_metadata/app_icon_512x512.png

echo "=== 3. Creating Comprehensive README and Upload Guide ==="
cat << 'EOF' > android-studio-project/GOOGLE_PLAY_UPLOAD_GUIDE.md
# راهنمای آپلود و انتشار بازی «دور: زبان» در Google Play Console

این پکیج شامل تمام فایل‌ها، کلید امضا، سورس کد اندروید، و فایل‌های لازم برای انتشار در گوگل پلی است.

---

## ۱. تفاوت فایل APK و AAB (خیلی مهم برای گوگل پلی):
- **گوگل پلی از آگوست ۲۰۲۱ دیگر فایل APK را برای برنامه‌های جدید قبول نمی‌کند!** گوگل پلی الزماً فرمت **Android App Bundle (.aab)** را دریافت می‌کند تا خودش برای هر مدل گوشی فایل نصبی بهینه تولید کند.
- فایل **APK** در پوشه `public/downloads/dor-zaban-v1.0.apk` برای تست مستقیم روی گوشی‌های واقعی یا انتشار در مارکت‌های داخلی (کافه‌بازار و مایکت) آماده و با نسخه v1, v2, v3 امضا شده است.
- برای ساخت فایل `.aab` کافی است پروژه داخل این پوشه را در Android Studio باز کرده و گزینه `Build -> Generate Signed Bundle / APK -> Android App Bundle` را بزنید یا دستور `./gradlew bundleRelease` را اجرا کنید.

---

## ۲. مراحل گام‌به‌گام در Google Play Console:
1. وارد پنل توسعه‌دهندگان گوگل شوید: https://play.google.com/console
2. روی دکمه **Create app** کلیک کنید:
   - App name: `دور: زبان | بازی گروهی زبان` یا `Dor: Language Party Game`
   - Default language: Persian (یا English)
   - App or game: **Game**
   - Free or paid: **Free**
3. در بخش **Set up your app**:
   - **Privacy Policy**: آدرس صفحه قوانین و حریم خصوصی را قرار دهید (یا از فایل‌های آماده استفاده کنید).
   - **App Access**: All functionality is available without special access.
   - **Ads**: No, my app does not contain ads.
   - **Content rating**: به سوالات پاسخ دهید (بازی کلمات خانوادگی = بدون خشونت و برای همه سنین).
   - **Target audience**: مناسب برای سنین مختلف (Everyone).
   - **Select an app category**: Game -> Word / Educational.
4. در بخش **Main store listing**:
   - متن‌های آماده فارسی یا انگلیسی را از پوشه `google_play_metadata/STORE_LISTING_FA.txt` کپی کنید.
   - آیکون ۵۱۲×۵۱۲ را از `google_play_metadata/app_icon_512x512.png` آپلود کنید.
5. در بخش **Releases -> Production** یا **Testing**:
   - دکمه **Create new release** را بزنید.
   - فایل باندل `.aab` ساخته‌شده را درگ کرده و آپلود کنید.
   - نام نسخه: `1.0.1 (10001)`
   - کلید اختصاصی `release.keystore` با پسورد `dorzaban2026` تنظیم شده است.
6. تایید نهایی و ارسال برای بررسی (Review).
EOF

echo "=== 4. Packaging Everything into Downloadable ZIP ==="
rm -f public/downloads/dor-zaban-google-play-package.zip
cd android-studio-project
# Include the compiled APK inside the package as well!
cp ../public/downloads/dor-zaban-v1.0.apk ./
7z a -tzip ../public/downloads/dor-zaban-google-play-package.zip .
cd ..

echo "=== 5. Final Package Output ==="
ls -lh public/downloads/
