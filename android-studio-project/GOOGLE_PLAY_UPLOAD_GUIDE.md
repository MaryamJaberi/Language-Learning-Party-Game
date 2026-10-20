# راهنمای جامع انتشار بازی «دور: زبان» در Google Play Console
## Release Kit: Version 1.1.0 (Version Code: 10010) | Default Language: English

این راهنما گام‌به‌گام شما را برای آپلود، جذب تستر و انتشار موفق برنامه در **Google Play Console** همراهی می‌کند تا بدون هیچ مشکلی تاییدیه گوگل را دریافت کنید.

---

## ۱. مشخصات بسته خروجی (Release Artifacts)
- **نام بسته (Package Name):** `com.solonovate.dour`
- **نسخه برنامه (Version Name):** `1.1.0`
- **کد نسخه (Version Code):** `10010`
- **حداقل اندروید (Min SDK):** Android 5.0 (API 21)
- **هدف اندروید (Target SDK):** Android 16 (API 36) — *مطابق با جدیدترین الزام گوگل پلی*
- **زبان پیش‌فرض (Default Locale):** English (United States / Global)
- **فرمت فایل رسمی برای گوگل پلی:** `.aab` (Android App Bundle) امضا شده
- **محل فایل آماده آپلود:** `public/downloads/dor-zaban-google-play.aab`
- **فایل تست مستقیم APK:** `public/downloads/dor-zaban-v1.0.apk`

---

## ۲. استراتژی جذب تستر در Google Play (مهم‌ترین بخش برای اکانت‌های شخصی)

بر اساس قوانین گوگل پلی، اکانت‌های شخصی توسعه‌دهنده باید قبل از انتشار عمومی، تست ۲۰ نفره به مدت ۱۴ روز مداوم انجام دهند:

### الف) مرحله ۱: تست داخلی (Internal Testing) — *شروع فوری بدون معطلی*
1. وارد پنل Google Play Console شوید و به مسیر زیر بروید:
   `Testing -> Internal testing`
2. روی دکمه **Create new release** کلیک کنید.
3. فایل `dor-zaban-google-play.aab` را آپلود کنید.
4. در تب **Testers**:
   - یک لیست ایمیل (Email List) بسازید و ایمیل‌های دوستان یا تسترهای خود را وارد کنید (تا ۱۰۰ نفر).
   - لینک دعوت تولید شده (`How testers join your test`) را کپی کرده و برای تسترهای خود ارسال کنید.
   - **مزیت تست داخلی:** هیچ بررسی یا تاخیری توسط گوگل ندارد؛ تسترها بلافاصله می‌توانند برنامه را از گوگل پلی دانلود و باز کنند!

### ب) مرحله ۲: تست بسته (Closed Testing - 20 Testers for 14 Days)
1. به مسیر `Testing -> Closed testing` بروید.
2. یک Track جدید بسازید (مثلاً به نام `Alpha` یا `Closed Beta`).
3. نسخه 1.1.0 را آپلود کنید.
4. حداقل ۲۰ نفر تستر فعال را به گروه اضافه کنید.
5. **نکته کلیدی:** تسترها باید برنامه را روی گوشی خود نصب کنند و به مدت ۱۴ روز متوالی آن را نگه‌دارند.
6. پس از ۱۴ روز، دکمه **Apply for production** در داشبورد فعال می‌شود.

---

## ۳. فرم‌های الزامی در داشبورد Google Play (App Content):

### ۱. سیاست حفظ حریم خصوصی (Privacy Policy):
آدرس اینترنتی صفحه قوانین و حریم خصوصی را وارد کنید (موجود در سایت یا نسخه آنلاین برنامه).

### ۲. دسترسی به برنامه (App Access):
گزینه **All functionality is available without special access** را انتخاب کنید.

### ۳. تبلیغات (Ads):
گزینه **No, my app does not contain ads** را انتخاب کنید. (شناسه AD_ID نیز در مانیفست حذف شده است).

### ۴. رده‌بندی سنی (Content Rating):
به پرسشنامه پاسخ دهید:
- دسته: Game -> Word / Educational
- خشونت، قمار، محتوای غیراخلاقی: خیر (No)
- نتیجه: درجه سنی عمومی **PEGI 3 / Everyone**.

### ۵. ایمنی داده‌ها (Data Safety Questionnaire):
- جمع‌آوری داده:
  - میکروفون (Audio Record): فقط برای تحلیل صدای کاربر در لحظه تمرین و سنجش تلفظ داخل دستگاه استفاده می‌شود و به هیچ سرور خارجی منتقل نمی‌شود (`Audio is processed on device / Ephemeral`).
  - ورود با گوگل (اختیاری): در صورت استفاده کاربر، صرفاً برای ذخیره ابری پیشرفت استفاده می‌شود.
- اشتراک‌گذاری با اشخاص ثالث: **No data is shared with third parties**.

---

## ۴. اطلاعات صفحه معرفی در فروشگاه (Store Listing)

- **App Name:** `Dour: Language Party Game`
- **Short Description:**
  `Pass one phone, guess words, and master languages together with friends!`
- **Full Description:**
  متن کامل انگلیسی آماده از فایل `google_play_metadata/STORE_LISTING_EN.txt` کپی شود.
- **آیکون گرافیکی ۵۱۲×۵۱۲:**
  از فایل `google_play_metadata/app_icon_512x512.png` استفاده کنید.

---

## ۵. اطلاعات کلید امضا (Keystore)
- فایل کلید: `release.keystore`
- نام مستعار (Alias): `dor-release`
- رمز عبور کلید: `dorzaban2026`
- رمز عبور مخزن: `dorzaban2026`
- الگوریتم: RSA 2048-bit با ماندگاری ۲۵ سال
