import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { sound } from '../soundManager';
import { isRtlLang, tUI } from '../ui';
import { downloadFileWithBlob } from '../utils/downloadHelper';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Apple, 
  Play, 
  X, 
  ArrowUpRight,
  ShieldCheck,
  WifiOff,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface Props {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstalled?: () => void;
}

export const InstallPromptModal: React.FC<Props> = ({
  language,
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'android' | 'ios'>('apk');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isRTL = isRtlLang(language);
  const t = tUI(language);

  const handleDownload = async (url: string, filename: string) => {
    sound.playClick();
    setDownloadingFile(filename);
    setDownloadError(null);
    setDownloadStatus(isRTL ? 'در حال دریافت مستقیم و بدون نقص فایل...' : 'Fetching binary file...');

    const res = await downloadFileWithBlob(url, filename, (status, msg) => {
      if (msg) setDownloadStatus(msg);
    });

    setDownloadingFile(null);
    if (!res.success) {
      setDownloadError(res.error || (isRTL ? 'خطا در دریافت فایل' : 'Download failed'));
    }
  };

  // Detect iOS by userAgent
  useEffect(() => {
    if (typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setActiveTab('ios');
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sound.playClick();
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalledSuccess(true);
          sound.playCorrect();
          if (onInstalled) onInstalled();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      sound.playToggle();
    }
  };

  const handleTabChange = (tab: 'apk' | 'android' | 'ios') => {
    sound.playToggle();
    setActiveTab(tab);
  };

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[var(--panel)] text-[var(--ink)] rounded-[20px] border border-[var(--line)] shadow-[var(--shadow)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Ribbon */}
        <div className="bg-[var(--panel)] text-[var(--ink)] p-3.5 border-b border-[var(--line)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--saffron)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)] shadow-[var(--shadow-sm)]">
              <Smartphone size={16} />
            </div>
            <div className="text-start">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--ink)]">
                {t.installApp || (isRTL ? 'نصب روی گوشی (PWA) و دانلود APK' : 'Install on Mobile (PWA & APK)')}
              </h3>
              <p className="text-[10px] text-[var(--vermilion)] font-bold">
                {isRTL ? 'فایل نصبی مستقیم APK + پکیج کامل Google Play Store' : 'Signed APK + Complete Play Store Submission Bundle'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold rounded-[8px] active:translate-y-0.5"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto overscroll-contain flex-1 font-ui">
          
          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--bg)] border border-[var(--line)] rounded-[14px]">
            <button
              onClick={() => handleTabChange('apk')}
              className={`py-2 px-1.5 rounded-[10px] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all border ${
                activeTab === 'apk'
                  ? 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] shadow-[var(--shadow-sm)]'
                  : 'border-transparent text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              <span>📦 {isRTL ? 'فایل APK' : 'APK'}</span>
            </button>

            <button
              onClick={() => handleTabChange('android')}
              className={`py-2 px-1.5 rounded-[10px] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all border ${
                activeTab === 'android'
                  ? 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] shadow-[var(--shadow-sm)]'
                  : 'border-transparent text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              <span>🤖 Android</span>
            </button>

            <button
              onClick={() => handleTabChange('ios')}
              className={`py-2 px-1.5 rounded-[10px] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all border ${
                activeTab === 'ios'
                  ? 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] shadow-[var(--shadow-sm)]'
                  : 'border-transparent text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              <span>🍏 iOS</span>
            </button>
          </div>

          {/* TAB 1: APK & GOOGLE PLAY DOWNLOADS */}
          {activeTab === 'apk' && (
            <div className="space-y-3 text-start">
              
              {/* Download Feedback Banner */}
              {downloadStatus && (
                <div className="p-2.5 rounded-xl bg-[var(--lapis-soft)] border border-[var(--lapis)]/30 text-[var(--lapis)] text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 size={16} className="shrink-0 text-[var(--turq)]" />
                  <span>{downloadStatus}</span>
                </div>
              )}
              {downloadError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              {/* Card 1: Direct AAB Bundle Download for Google Play (Requested by User) */}
              <div className="bg-[var(--bg)] p-3.5 rounded-[16px] border-2 border-[var(--lapis)] shadow-[var(--shadow-sm)] space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--lapis)] text-white flex items-center justify-center font-bold">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[var(--ink)] flex items-center gap-1.5">
                        <span>{isRTL ? 'دانلود مستقیم فایل AAB (مخصوص گوگل پلی)' : 'Download Google Play AAB (.aab)'}</span>
                        <span className="text-[9px] bg-[var(--lapis-soft)] text-[var(--lapis)] font-black px-1.5 py-0.5 rounded-full">Google Play</span>
                      </h4>
                      <span className="text-[10px] text-[var(--mute)] font-medium">
                        {isRTL ? 'فرمت Android App Bundle (.aab) • حجم ۲.۲ مگابایت • نسخه ۱.۰.۳' : 'Format: Android App Bundle (.aab) • Size: 2.2 MB • v1.0.3'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-[var(--lapis)] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-[6px] border border-[var(--lapis)]">
                    {isRTL ? 'آماده آپلود ✓' : 'Play Store Ready ✓'}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--mute)] leading-relaxed font-medium">
                  {isRTL 
                    ? 'فایل رسمی باندل اندروید (.aab) جهت بارگذاری مستقیم در پنل Google Play Console (بخش Releases -> Production). دانلود به صورت باینری کامل و بدون خطا انجام می‌شود.'
                    : 'Official Android App Bundle (.aab) ready for direct upload to Google Play Console under Releases -> Production. Downloads with full binary integrity.'}
                </p>

                <div className="text-[10.5px] text-[var(--mute)] space-y-0.5 font-mono bg-[var(--panel)] p-2 rounded-[10px] border border-[var(--line)]">
                  <div><strong>Package:</strong> <code className="text-[var(--lapis)]">com.solonovate.dour</code></div>
                  <div><strong>Version:</strong> 1.0.3 (VersionCode: 10003) • Target SDK: 36</div>
                </div>

                <button
                  type="button"
                  disabled={downloadingFile === 'dor-zaban-v1.0.aab'}
                  onClick={() => handleDownload('./downloads/dor-zaban-v1.0.aab', 'dor-zaban-v1.0.aab')}
                  className="w-full py-2.5 px-3 bg-[var(--lapis)] hover:bg-[#1a38a0] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:translate-y-0.5 transition-all text-center cursor-pointer disabled:opacity-75"
                >
                  {downloadingFile === 'dor-zaban-v1.0.aab' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isRTL ? 'در حال دریافت فایل AAB...' : 'Downloading AAB...'}</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>{isRTL ? 'دانلود فایل AAB گوگل پلی (۲.۲ مگابایت)' : 'Download AAB File (2.2 MB)'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: Direct APK Download for Testing / CafeBazaar / Myket */}
              <div className="bg-[var(--bg)] p-3.5 rounded-[16px] border border-[var(--line)] shadow-[var(--shadow-sm)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--turq)] text-white flex items-center justify-center font-bold">
                      <Download size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[var(--ink)]">
                        {isRTL ? 'دانلود مستقیم فایل نصبی APK (تست روی گوشی)' : 'Download Signed Android APK (.apk)'}
                      </h4>
                      <span className="text-[10px] text-[var(--mute)] font-medium">
                        {isRTL ? 'حجم: ۵.۸ مگابایت • نسخه ۱.۰.۱ • کاملاً آفلاین' : 'Size: 5.8 MB • v1.0.1 • 100% Offline'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-[var(--turq)] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[6px] border border-[var(--turq)]">
                    {isRTL ? 'آماده نصب روی گوشی ✓' : 'Direct Install ✓'}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--mute)] leading-relaxed font-medium">
                  {isRTL 
                    ? 'فایل نصبی مستقیم APK برای نصب روی گوشی‌های واقعی اندروید یا انتشار در کافه‌بازار و مایکت.'
                    : 'Standard signed APK for direct testing on real Android phones or publishing on local app stores.'}
                </p>

                <button
                  type="button"
                  disabled={downloadingFile === 'dor-zaban-v1.0.apk'}
                  onClick={() => handleDownload('./downloads/dor-zaban-v1.0.apk', 'dor-zaban-v1.0.apk')}
                  className="w-full py-2.5 px-3 bg-[var(--turq)] hover:bg-[#0fa091] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all text-center cursor-pointer disabled:opacity-75"
                >
                  {downloadingFile === 'dor-zaban-v1.0.apk' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isRTL ? 'در حال دریافت فایل APK...' : 'Downloading APK...'}</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>{isRTL ? 'دانلود فایل APK نصبی (۵.۸ مگابایت)' : 'Download APK File (5.8 MB)'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 3: Full Google Play Source Bundle (ZIP) */}
              <div className="bg-[var(--bg)] p-3 rounded-[14px] border border-[var(--line)] space-y-1.5 opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--ink)]">
                    {isRTL ? 'سورس کامل Android Studio و کلید Keystore' : 'Full Android Studio Project & Keystore (ZIP)'}
                  </h4>
                  <button
                    type="button"
                    disabled={downloadingFile === 'dor-zaban-google-play-package.zip'}
                    onClick={() => handleDownload('./downloads/dor-zaban-google-play-package.zip', 'dor-zaban-google-play-package.zip')}
                    className="text-[11px] text-[var(--lapis)] font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-75"
                  >
                    {downloadingFile === 'dor-zaban-google-play-package.zip' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    <span>{isRTL ? 'دانلود سورس (ZIP)' : 'Download ZIP'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ANDROID PWA SECTION */}
          {activeTab === 'android' && (
            <div className="space-y-3 text-start">
              {/* Direct Install CTA Button if browser supports it */}
              {deferredPrompt && !isInstalledSuccess && (
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="w-full py-2.5 bg-[var(--vermilion)] hover:bg-[#c94b2a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[12px] shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
                >
                  <Download size={16} />
                  <span>{t.installDirect || (isRTL ? 'نصب مستقیم PWA با یک کلیک' : 'Instant 1-Click PWA Install')}</span>
                  <Zap size={14} />
                </button>
              )}

              {isInstalledSuccess && (
                <div className="p-3 bg-[var(--panel)] border border-[var(--line)] text-[var(--teal)] rounded-[14px] flex items-center gap-2 text-xs font-bold shadow-[var(--shadow-sm)]">
                  <CheckCircle2 size={18} />
                  <span>{t.appInstalledSuccess || (isRTL ? 'بازی با موفقیت روی گوشی نصب شد!' : 'App successfully installed!')}</span>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] space-y-2.5">
                <div className="text-[11px] font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[var(--vermilion)]" />
                  <span>{isRTL ? 'نحوه افزودن در مرورگر کروم (Chrome):' : 'How to Add in Google Chrome:'}</span>
                </div>

                <div className="space-y-2 text-[11px] text-[var(--mute)] font-medium">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۱
                    </span>
                    <span>
                      {language === 'fa' 
                        ? 'در بالای مرورگر، روی منوی سه نقطه (⋮) ضربه بزنید.' 
                        : 'Tap the 3-dot menu (⋮) in the top corner of Chrome.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۲
                    </span>
                    <span>
                      {language === 'fa' 
                        ? 'گزینه «افزودن به صفحه اصلی» (Add to Home screen) یا «نصب برنامه» را انتخاب کنید.' 
                        : 'Choose "Add to Home screen" or "Install App".'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۳
                    </span>
                    <span>
                      {language === 'fa' 
                        ? 'نام بازی را تایید کنید تا آیکون بازی به صفحه اصلی گوشی اضافه شود.' 
                        : 'Confirm to add the icon directly to your phone screen.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IOS SECTION */}
          {activeTab === 'ios' && (
            <div className="space-y-3 text-start">
              <div className="bg-[var(--bg)] p-3 rounded-[16px] border border-[var(--line)] space-y-2.5">
                <div className="text-[11px] font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Apple size={14} />
                  <span>{language === 'fa' ? 'نحوه افزودن در سافاری آیفون (Safari):' : 'How to Add in iPhone Safari:'}</span>
                </div>

                <div className="space-y-2 text-[11px] text-[var(--mute)] font-medium">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۱
                    </span>
                    <span className="flex-1">
                      {language === 'fa' 
                        ? 'در نوار پایین مرورگر سافاری روی دکمه Share (اشتراک‌گذاری ⎋) بزنید.' 
                        : 'Tap the Share icon (⎋) at the bottom toolbar in Safari.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۲
                    </span>
                    <span className="flex-1">
                      {language === 'fa' 
                        ? 'منو را کمی پایین بکشید و گزینه «Add to Home Screen» (افزودن به صفحه اصلی ➕) را انتخاب کنید.' 
                        : 'Scroll down and tap "Add to Home Screen" (➕).'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۳
                    </span>
                    <span className="flex-1">
                      {language === 'fa' 
                        ? 'در بالا سمت راست روی «Add» بزنید. حالا بازی تمام‌صفحه و پرسرعت اجرا می‌شود!' 
                        : 'Tap "Add" in the top-right corner. The app will launch fullscreen!'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Badges */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--line)]">
            <div className="bg-[var(--bg)] p-2 rounded-[10px] border border-[var(--line)] flex items-center gap-1.5 text-[10px] font-bold text-[var(--ink)]">
              <WifiOff size={13} className="text-[var(--vermilion)]" />
              <span>{t.worksOffline || (isRTL ? 'آفلاین و بدون مصرف نت' : 'Works 100% Offline')}</span>
            </div>

            <div className="bg-[var(--bg)] p-2 rounded-[10px] border border-[var(--line)] flex items-center gap-1.5 text-[10px] font-bold text-[var(--ink)]">
              <ShieldCheck size={13} className="text-[var(--teal)]" />
              <span>{t.lightweightSafe || (isRTL ? 'امضا شده و امن' : 'Signed & Verified')}</span>
            </div>
          </div>

        </div>

        {/* Footer Action Button */}
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] flex justify-end font-ui">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-[var(--saffron)] hover:bg-[#e0a634] text-[var(--ink)] border border-[var(--line)] text-xs font-bold rounded-[10px] shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
          >
            {t.gotItClose || (isRTL ? 'متوجه شدم، بستن' : 'Got it, Close')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default InstallPromptModal;
