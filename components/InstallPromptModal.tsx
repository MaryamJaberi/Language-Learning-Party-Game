import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { sound } from '../soundManager';
import { isRtlLang } from '../ui';
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
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  const isRTL = isRtlLang(language);

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
      // Fallback instruction trigger
      sound.playToggle();
    }
  };

  const handleTabChange = (tab: 'android' | 'ios') => {
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
      <div className="relative w-full max-w-sm bg-[#FFFBF4] text-[#1E1B2E] rounded-[24px] border-2 border-[#1E1B2E] shadow-[6px_6px_0px_0px_#1E1B2E] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Ribbon */}
        <div className="bg-[#FFFBF4] text-[#1E1B2E] p-3.5 border-b-2 border-[#1E1B2E]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#F2B63D] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
              <Smartphone size={16} />
            </div>
            <div className="text-start">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[#1E1B2E]">
                {language === 'fa' ? 'نصب روی گوشی (PWA)' : 'Install on Mobile (PWA)'}
              </h3>
              <p className="text-[10px] text-[#E0603F] font-bold">
                {language === 'fa' ? 'اجرای سریع، تمام‌صفحه و آفلاین' : 'Fast, Fullscreen & Offline'}
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
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4EDE1] border-2 border-[#1E1B2E] rounded-[14px]">
            <button
              onClick={() => handleTabChange('android')}
              className={`py-2 px-3 rounded-[10px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all border-2 ${
                activeTab === 'android'
                  ? 'bg-[#FFFBF4] text-[#1E1B2E] border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                  : 'border-transparent text-[#1E1B2E]/70 hover:text-[#1E1B2E]'
              }`}
            >
              <span>🤖 Android</span>
            </button>

            <button
              onClick={() => handleTabChange('ios')}
              className={`py-2 px-3 rounded-[10px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all border-2 ${
                activeTab === 'ios'
                  ? 'bg-[#FFFBF4] text-[#1E1B2E] border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]'
                  : 'border-transparent text-[#1E1B2E]/70 hover:text-[#1E1B2E]'
              }`}
            >
              <span>🍏 iOS (iPhone)</span>
            </button>
          </div>

          {/* Android Section */}
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
                  <span>{language === 'fa' ? 'نصب مستقیم با یک کلیک' : 'Instant 1-Click Install'}</span>
                  <Zap size={14} />
                </button>
              )}

              {isInstalledSuccess && (
                <div className="p-3 bg-[#FFFBF4] border-2 border-[#1E1B2E] text-[#1E9E93] rounded-[14px] flex items-center gap-2 text-xs font-bold shadow-[2px_2px_0px_0px_#1E1B2E]">
                  <CheckCircle2 size={18} />
                  <span>{language === 'fa' ? 'بازی با موفقیت روی گوشی نصب شد!' : 'App successfully installed!'}</span>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="bg-[#F4EDE1] p-3 rounded-[16px] border-2 border-[#1E1B2E] space-y-2.5">
                <div className="text-[11px] font-bold text-[#1E1B2E] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#E0603F]" />
                  <span>{language === 'fa' ? 'نحوه افزودن در مرورگر کروم (Chrome):' : 'How to Add in Google Chrome:'}</span>
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

              {/* Native Store Release Notice */}
              <div className="bg-[#FFFBF4] p-2.5 rounded-[14px] border-2 border-[#1E1B2E] flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] bg-[#F2B63D] text-[#1E1B2E] border border-[#1E1B2E] flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </div>
                <div className="text-[10px] text-[#1E1B2E] font-bold leading-tight">
                  <span>
                    {language === 'fa'
                      ? '🚀 نسخه بومی اندروید (APK، کافه‌بازار و گوگل‌پلی) به‌زودی منتشر می‌شود!'
                      : '🚀 Native Android App (Play Store & Direct APK) coming soon!'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* iOS Section */}
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

              {/* iOS Native Store Notice */}
              <div className="bg-[#FFFBF4] p-2.5 rounded-[14px] border-2 border-[#1E1B2E] flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] bg-[#F2B63D] text-[#1E1B2E] border border-[#1E1B2E] flex items-center justify-center shrink-0">
                  <Apple size={14} />
                </div>
                <div className="text-[10px] text-[#1E1B2E] font-bold leading-tight">
                  <span>
                    {language === 'fa'
                      ? '🍏 نسخه رسمی iOS (سیب‌اپ و اپ‌استور) به‌زودی در دسترس خواهد بود!'
                      : '🍏 Native iOS App on the App Store coming soon!'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Badges */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1E1B2E]/10">
            <div className="bg-[#F4EDE1] p-2 rounded-[10px] border border-[#1E1B2E] flex items-center gap-1.5 text-[10px] font-bold text-[#1E1B2E]">
              <WifiOff size={13} className="text-[#E0603F]" />
              <span>{language === 'fa' ? 'آفلاین و بدون مصرف نت' : 'Works 100% Offline'}</span>
            </div>

            <div className="bg-[#F4EDE1] p-2 rounded-[10px] border border-[#1E1B2E] flex items-center gap-1.5 text-[10px] font-bold text-[#1E1B2E]">
              <ShieldCheck size={13} className="text-[#1E9E93]" />
              <span>{language === 'fa' ? 'کم‌حجم و بدون تبلیغات' : 'Lightweight & Safe'}</span>
            </div>
          </div>

        </div>

        {/* Footer Action Button */}
        <div className="p-3 bg-[#FFFBF4] border-t-2 border-[#1E1B2E]/20 flex justify-end font-ui">
          <button
            onClick={handleClose}
            className="pixel-btn pixel-btn-yellow px-5 py-2 text-xs font-bold rounded-[10px]"
          >
            {language === 'fa' ? 'متوجه شدم، بستن' : 'Got it, Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default InstallPromptModal;
