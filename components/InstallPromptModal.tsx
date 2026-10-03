import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { sound } from '../soundManager';
import { isRtlLang, tUI } from '../ui';
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
  WifiOff
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
  const [activeTab, setActiveTab] = useState<'apk' | 'android' | 'ios'>('android');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  const isRTL = isRtlLang(language);
  const t = tUI(language);

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
              
              {/* Card 1: Direct APK Download */}
              <div className="bg-[var(--bg)] p-3.5 rounded-[16px] border border-[var(--line)] shadow-[var(--shadow-sm)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--teal)] text-white flex items-center justify-center font-bold">
                      <Download size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[var(--ink)]">
                        {isRTL ? 'دانلود مستقیم فایل نصبی APK' : 'Download Signed Android APK'}
                      </h4>
                      <span className="text-[10px] text-[var(--mute)] font-medium">
                        {isRTL ? 'حجم: ۱.۲ مگابایت • نسخه ۱.۰.۱ • کاملاً آفلاین' : 'Size: 1.2 MB • v1.0.1 • 100% Offline'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-[var(--teal)] bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-[var(--teal)]">
                    {isRTL ? 'آماده نصب ✓' : 'Signed v1-v3 ✓'}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--mute)] leading-relaxed font-medium">
                  {isRTL 
                    ? 'فایل نصبی استاندارد اندروید، امضا شده با کلید اختصاصی. مناسب برای تست مستقیم روی انواع گوشی‌های اندروید یا انتشار در کافه‌بازار و مایکت.'
                    : 'Standard Android APK signed with production keystore. Ready for direct installation on any Android phone or alternative app stores.'}
                </p>

                <a
                  href="./downloads/dor-zaban-v1.0.apk"
                  download="dor-zaban-v1.0.apk"
                  onClick={() => sound.playClick()}
                  className="w-full py-2.5 px-3 bg-[#2347C5] hover:bg-[#1a38a0] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all text-center no-underline"
                >
                  <Download size={16} />
                  <span>{isRTL ? 'دانلود فایل APK (کلیک کنید)' : 'Download APK (1.2 MB)'}</span>
                </a>
              </div>

              {/* Card 2: Google Play Submission Bundle */}
              <div className="bg-[var(--bg)] p-3.5 rounded-[16px] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center font-bold">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[var(--ink)]">
                        {isRTL ? 'پکیج انتشار در Google Play Console' : 'Google Play Submission Package (ZIP)'}
                      </h4>
                      <span className="text-[10px] text-[var(--mute)] font-medium">
                        {isRTL ? 'شامل کلید Keystore، سورس Android Studio، فایل AAB و راهنما' : 'Includes Keystore, Android Studio project, AAB & Guide'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-[#2347C5] bg-blue-50 px-2 py-0.5 rounded-[6px] border border-[#2347C5]">
                    {isRTL ? 'ویژه گوگل‌پلی' : 'Play Store Ready'}
                  </span>
                </div>

                {/* Important Notice about AAB vs APK for Google Play */}
                <div className="p-2.5 bg-[var(--panel)] rounded-[10px] border border-[var(--line)] text-[10.5px] leading-relaxed text-[var(--ink)]">
                  <span className="font-bold text-[var(--vermilion)]">⚠️ {isRTL ? 'نکته الزامی گوگل پلی:' : 'Google Play Requirement:'} </span>
                  {isRTL 
                    ? 'گوگل پلی برای برنامه‌های جدید فایل APK را قبول نمی‌کند و حتماً فرمت Android App Bundle (.aab) را می‌خواهد. این پکیج شامل سورس کامل اندروید استودیو با دستور یک‌کلیکی ./gradlew bundleRelease برای ساخت فایل AAB است.'
                    : 'Google Play strictly requires Android App Bundle (.aab) format for new app submissions. This bundle includes the full Android Studio project ready to build the .aab with 1 click.'}
                </div>

                <div className="text-[10.5px] text-[var(--mute)] space-y-1 font-medium bg-[var(--panel)] p-2.5 rounded-[10px] border border-[var(--line)]">
                  <div><strong>Package ID:</strong> <code className="text-[#2347C5]">com.dour.languagegame</code></div>
                  <div><strong>Version:</strong> 1.0.1 (VersionCode: 10001) • Target SDK: 34 (Android 14)</div>
                  <div><strong>AssetLinks:</strong> <code className="text-[var(--teal)]">/.well-known/assetlinks.json</code> فعال است</div>
                </div>

                <a
                  href="./downloads/dor-zaban-google-play-package.zip"
                  download="dor-zaban-google-play-package.zip"
                  onClick={() => sound.playClick()}
                  className="w-full py-2.5 px-3 bg-[var(--teal)] hover:bg-[#0fa091] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all text-center no-underline"
                >
                  <Download size={16} />
                  <span>{isRTL ? 'دانلود پکیج کامل گوگل پلی (ZIP - ۲.۳ مگابایت)' : 'Download Full Play Store Package (ZIP - 2.3 MB)'}</span>
                </a>
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
