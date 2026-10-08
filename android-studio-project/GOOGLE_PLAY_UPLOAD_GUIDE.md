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
   - **Advertising ID (شناسه تبلیغاتی گوگل - الزامی اندروید ۱۳ به بالا)**:
     - به سوال «Does your app use advertising ID?» پاسخ **No** دهید.
     - برنامه «دور: زبان» هیچ‌گونه تبلیغاتی ندارد و دسترسی AD_ID در فایل مانیفست به طور صریح غیرفعال و مسدود شده است (`tools:node="remove"`).
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
