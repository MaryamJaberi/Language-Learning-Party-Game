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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B2E]/60 backdrop-blur-sm animate-fade-in select-none font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#FFFBF4] text-[#1E1B2E] rounded-[24px] border-2 border-[#1E1B2E] shadow-[6px_6px_0px_0px_#1E1B2E] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Ribbon */}
        <div className="bg-[#FFFBF4] text-[#1E1B2E] p-3.5 border-b-2 border-[#1E1B2E]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#F2B63D] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
              <Smartphone size={16} />
            </div>
            <div className="text-start">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[#1E1B2E]">
                {t.installApp || (isRTL ? 'نصب روی گوشی (PWA) و دانلود APK' : 'Install on Mobile (PWA & APK)')}
              </h3>
              <p className="text-[10px] text-[#E0603F] font-bold">
                {isRTL ? 'فایل نصبی مستقیم APK + پکیج کامل Google Play Store' : 'Signed APK + Complete Play Store Submission Bundle'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center bg-[#F4EDE1] hover:bg-[#ebdcc8] text-[#1E1B2E] border border-[#1E1B2E] font-bold rounded-[8px] active:translate-y-0.5"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto overscroll-contain flex-1 font-ui">
          
          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4EDE1] border-2 border-[#1E1B2E] rounded-[14px]">
            <button
              onClick={() => handleTabChange('apk')}
              className={`py-2 px-1.5 rounded-[10px] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all border-2 ${
                activeTab === 'apk'
                  ? 'bg-[#FFFBF4] text-[#1E1B2E] border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                  : 'border-transparent text-[#1E1B2E]/70 hover:text-[#1E1B2E]'
              }`}
            >
              <span>📦 {isRTL ? 'فایل APK و پلی‌استور' : 'APK & Play Store'}</span>
            </button>

            <button
              onClick={() => handleTabChange('android')}
              className={`py-2 px-1.5 rounded-[10px] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all border-2 ${
                activeTab === 'android'
                  ? 'bg-[#FFFBF4] text-[#1E1B2E] border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                  : 'border-transparent text-[#1E1B2E]/70 hover:text-[#1E1B2E]'
              }`}
            >
              <span>🤖 Android {isRTL ? '(PWA)' : ''}</span>
            </button>

            <button
              onClick={() => handleTabChange('ios')}
              className={`py-2 px-1.5 rounded-[10px] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all border-2 ${
                activeTab === 'ios'
                  ? 'bg-[#FFFBF4] text-[#1E1B2E] border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                  : 'border-transparent text-[#1E1B2E]/70 hover:text-[#1E1B2E]'
              }`}
            >
              <span>🍏 iOS {isRTL ? '(آیفون)' : ''}</span>
            </button>
          </div>

          {/* TAB 1: APK & GOOGLE PLAY DOWNLOADS */}
          {activeTab === 'apk' && (
            <div className="space-y-3 text-start">
              
              {/* Card 1: Direct APK Download */}
              <div className="bg-[#FFFBF4] p-3.5 rounded-[16px] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[#12B5A4] text-white flex items-center justify-center font-bold">
                      <Download size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1E1B2E]">
                        {isRTL ? 'دانلود مستقیم فایل نصبی APK' : 'Download Signed Android APK'}
                      </h4>
                      <span className="text-[10px] text-[#1E1B2E]/70 font-medium">
                        {isRTL ? 'حجم: ۱.۲ مگابایت • نسخه ۱.۰.۱ • کاملاً آفلاین' : 'Size: 1.2 MB • v1.0.1 • 100% Offline'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-[#12B5A4] bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-[#12B5A4]">
                    {isRTL ? 'آماده نصب ✓' : 'Signed v1-v3 ✓'}
                  </span>
                </div>

                <p className="text-[11px] text-[#1E1B2E]/80 leading-relaxed font-medium">
                  {isRTL 
                    ? 'فایل نصبی استاندارد اندروید، امضا شده با کلید اختصاصی. مناسب برای تست مستقیم روی انواع گوشی‌های اندروید یا انتشار در کافه‌بازار و مایکت.'
                    : 'Standard Android APK signed with production keystore. Ready for direct installation on any Android phone or alternative app stores.'}
                </p>

                <a
                  href="./downloads/dor-zaban-v1.0.apk"
                  download="dor-zaban-v1.0.apk"
                  onClick={() => sound.playClick()}
                  className="w-full py-2.5 px-3 bg-[#2347C5] hover:bg-[#1a38a0] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#15204A] active:translate-y-0.5 transition-all text-center no-underline"
                >
                  <Download size={16} />
                  <span>{isRTL ? 'دانلود فایل APK (کلیک کنید)' : 'Download APK (1.2 MB)'}</span>
                </a>
              </div>

              {/* Card 2: Google Play Submission Bundle */}
              <div className="bg-[#F4EDE1] p-3.5 rounded-[16px] border-2 border-[#1E1B2E] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[#F5B52E] text-[#15204A] flex items-center justify-center font-bold">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1E1B2E]">
                        {isRTL ? 'پکیج انتشار در Google Play Console' : 'Google Play Submission Package (ZIP)'}
                      </h4>
                      <span className="text-[10px] text-[#1E1B2E]/70 font-medium">
                        {isRTL ? 'شامل کلید Keystore، سورس Android Studio، فایل AAB و راهنما' : 'Includes Keystore, Android Studio project, AAB & Guide'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-[#2347C5] bg-blue-50 px-2 py-0.5 rounded-[6px] border border-[#2347C5]">
                    {isRTL ? 'ویژه گوگل‌پلی' : 'Play Store Ready'}
                  </span>
                </div>

                {/* Important Notice about AAB vs APK for Google Play */}
                <div className="p-2.5 bg-[#FFFBF4] rounded-[10px] border border-[#1E1B2E]/30 text-[10.5px] leading-relaxed text-[#1E1B2E]">
                  <span className="font-bold text-[#D6455D]">⚠️ {isRTL ? 'نکته الزامی گوگل پلی:' : 'Google Play Requirement:'} </span>
                  {isRTL 
                    ? 'گوگل پلی برای برنامه‌های جدید فایل APK را قبول نمی‌کند و حتماً فرمت Android App Bundle (.aab) را می‌خواهد. این پکیج شامل سورس کامل اندروید استودیو با دستور یک‌کلیکی ./gradlew bundleRelease برای ساخت فایل AAB است.'
                    : 'Google Play strictly requires Android App Bundle (.aab) format for new app submissions. This bundle includes the full Android Studio project ready to build the .aab with 1 click.'}
                </div>

                <div className="text-[10.5px] text-[#1E1B2E]/80 space-y-1 font-medium bg-[#FFFBF4] p-2.5 rounded-[10px] border border-[#1E1B2E]/20">
                  <div><strong>Package ID:</strong> <code className="text-[#2347C5]">com.dour.languagegame</code></div>
                  <div><strong>Version:</strong> 1.0.1 (VersionCode: 10001) • Target SDK: 34 (Android 14)</div>
                  <div><strong>AssetLinks:</strong> <code className="text-[#12B5A4]">/.well-known/assetlinks.json</code> فعال است</div>
                </div>

                <a
                  href="./downloads/dor-zaban-google-play-package.zip"
                  download="dor-zaban-google-play-package.zip"
                  onClick={() => sound.playClick()}
                  className="w-full py-2.5 px-3 bg-[#12B5A4] hover:bg-[#0fa091] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#15204A] active:translate-y-0.5 transition-all text-center no-underline"
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
                  className="pixel-btn pixel-btn-orange w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[12px]"
                >
                  <Download size={16} />
                  <span>{t.installDirect || (isRTL ? 'نصب مستقیم PWA با یک کلیک' : 'Instant 1-Click PWA Install')}</span>
                  <Zap size={14} />
                </button>
              )}

              {isInstalledSuccess && (
                <div className="p-3 bg-[#FFFBF4] border-2 border-[#1E1B2E] text-[#1E9E93] rounded-[14px] flex items-center gap-2 text-xs font-bold shadow-[2px_2px_0px_0px_#1E1B2E]">
                  <CheckCircle2 size={18} />
                  <span>{t.appInstalledSuccess || (isRTL ? 'بازی با موفقیت روی گوشی نصب شد!' : 'App successfully installed!')}</span>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] space-y-2.5">
                <div className="text-[11px] font-bold text-[#1E1B2E] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#E0603F]" />
                  <span>{isRTL ? 'نحوه افزودن در مرورگر کروم (Chrome):' : 'How to Add in Google Chrome:'}</span>
                </div>

                <div className="space-y-2 text-[11px] text-[#1E1B2E]/80 font-medium">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFFBF4] text-[#1E1B2E] border border-[#1E1B2E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۱
                    </span>
                    <span>
                      {language === 'fa' 
                        ? 'در بالای مرورگر، روی منوی سه نقطه (⋮) ضربه بزنید.' 
                        : 'Tap the 3-dot menu (⋮) in the top corner of Chrome.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFFBF4] text-[#1E1B2E] border border-[#1E1B2E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۲
                    </span>
                    <span>
                      {language === 'fa' 
                        ? 'گزینه «افزودن به صفحه اصلی» (Add to Home screen) یا «نصب برنامه» را انتخاب کنید.' 
                        : 'Choose "Add to Home screen" or "Install App".'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFFBF4] text-[#1E1B2E] border border-[#1E1B2E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
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
              <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] space-y-2.5">
                <div className="text-[11px] font-bold text-[#1E1B2E] flex items-center gap-1.5">
                  <Apple size={14} />
                  <span>{language === 'fa' ? 'نحوه افزودن در سافاری آیفون (Safari):' : 'How to Add in iPhone Safari:'}</span>
                </div>

                <div className="space-y-2 text-[11px] text-[#1E1B2E]/80 font-medium">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFFBF4] text-[#1E1B2E] border border-[#1E1B2E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۱
                    </span>
                    <span className="flex-1">
                      {language === 'fa' 
                        ? 'در نوار پایین مرورگر سافاری روی دکمه Share (اشتراک‌گذاری ⎋) بزنید.' 
                        : 'Tap the Share icon (⎋) at the bottom toolbar in Safari.'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFFBF4] text-[#1E1B2E] border border-[#1E1B2E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ۲
                    </span>
                    <span className="flex-1">
                      {language === 'fa' 
                        ? 'منو را کمی پایین بکشید و گزینه «Add to Home Screen» (افزودن به صفحه اصلی ➕) را انتخاب کنید.' 
                        : 'Scroll down and tap "Add to Home Screen" (➕).'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFFBF4] text-[#1E1B2E] border border-[#1E1B2E] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
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
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1E1B2E]/10">
            <div className="bg-[#F4EDE1] p-2 rounded-[10px] border border-[#1E1B2E] flex items-center gap-1.5 text-[10px] font-bold text-[#1E1B2E]">
              <WifiOff size={13} className="text-[#E0603F]" />
              <span>{t.worksOffline || (isRTL ? 'آفلاین و بدون مصرف نت' : 'Works 100% Offline')}</span>
            </div>

            <div className="bg-[#F4EDE1] p-2 rounded-[10px] border border-[#1E1B2E] flex items-center gap-1.5 text-[10px] font-bold text-[#1E1B2E]">
              <ShieldCheck size={13} className="text-[#1E9E93]" />
              <span>{t.lightweightSafe || (isRTL ? 'امضا شده و امن' : 'Signed & Verified')}</span>
            </div>
          </div>

        </div>

        {/* Footer Action Button */}
        <div className="p-3 bg-[#FFFBF4] border-t-2 border-[#1E1B2E]/20 flex justify-end font-ui">
          <button
            onClick={handleClose}
            className="pixel-btn pixel-btn-yellow px-5 py-2 text-xs font-bold rounded-[10px]"
          >
            {t.gotItClose || (isRTL ? 'متوجه شدم، بستن' : 'Got it, Close')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default InstallPromptModal;
