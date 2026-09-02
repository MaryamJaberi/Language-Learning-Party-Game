import React, { useState } from 'react';
import { usePWAInstall } from '../usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { sound } from '../soundManager';

interface Props {
  language?: string;
  variant?: 'compact' | 'banner' | 'button';
}

export const PWAInstallButton: React.FC<Props> = ({ language = 'fa', variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isRTL = language === 'fa' || language === 'ar';

  // If already running inside installed standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    sound.playClick();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback hint for standard browser menu
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div 
          className="bg-gradient-to-r from-[#FFE600] to-[#FFF033] border-[3px] border-[#241442] p-2.5 rounded-2xl shadow-[3px_3px_0px_0px_#241442] flex items-center justify-between gap-2"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#241442] text-[#39FF14] flex items-center justify-center shrink-0">
              <Smartphone size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1a0833]">
                {language === 'fa' ? 'نصب نسخه آفلاین اپلیکیشن' : 'Install Offline PWA App'}
              </h4>
              <p className="text-[10px] font-bold text-[#1a0833]/80">
                {language === 'fa' ? 'دسترسی سریع و بدون نیاز به اینترنت' : 'Fast fullscreen & offline play'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-[#FF007F] hover:bg-[#FF2E93] text-white border-2 border-[#241442] rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#241442] active:translate-y-0.5 flex items-center gap-1 shrink-0"
          >
            <Download size={13} />
            <span>{language === 'fa' ? 'نصب' : 'Install'}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label="Install App"
          className="px-2.5 py-1.5 bg-[#39FF14] hover:bg-[#32e012] text-[#1a0833] border-2 border-[#241442] rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#241442] active:translate-y-0.5 flex items-center gap-1 transition-transform"
        >
          <Download size={14} className="text-[#1a0833]" />
          <span className="text-[11px] font-black">{language === 'fa' ? 'نصب PWA' : 'Install App'}</span>
        </button>
      )}

      {/* iOS Safari / Web Install Instructions Modal */}
      {showIOSGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-white border-4 border-[#241442] p-5 shadow-[6px_6px_0px_0px_#241442]"
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 border-b-2 border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00F0FF] border-2 border-[#241442] flex items-center justify-center text-[#1a0833]">
                  <Smartphone size={18} />
                </div>
                <h3 className="text-sm font-black text-[#1a0833]">
                  {language === 'fa' ? 'راهنمای نصب بازی روی گوشی' : 'Install PWA on Mobile'}
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-[#241442] flex items-center justify-center text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#1a0833]">
              <div className="flex items-start gap-2.5 bg-[#F4E8FF] p-2.5 rounded-xl border border-[#241442]/30">
                <div className="w-6 h-6 rounded-lg bg-[#FF007F] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  ۱
                </div>
                <p className="font-bold leading-relaxed">
                  {language === 'fa' ? (
                    <>در مرورگر (سافاری یا کروم)، دکمه <strong>اشتراک‌گذاری (Share <Share2 size={12} className="inline mx-0.5" />)</strong> یا منوی سه نقطه را لمس کنید.</>
                  ) : (
                    <>Tap the <strong>Share</strong> button in Safari toolbar or browser menu.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-[#E8FFFB] p-2.5 rounded-xl border border-[#241442]/30">
                <div className="w-6 h-6 rounded-lg bg-[#00F0FF] text-[#1a0833] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  ۲
                </div>
                <p className="font-bold leading-relaxed">
                  {language === 'fa' ? (
                    <>گزینه <strong>افزودن به صفحه اصلی (Add to Home Screen <PlusSquare size={12} className="inline mx-0.5" />)</strong> را انتخاب کنید.</>
                  ) : (
                    <>Select <strong>Add to Home Screen</strong> from the options.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-[#FFFDE8] p-2.5 rounded-xl border border-[#241442]/30">
                <div className="w-6 h-6 rounded-lg bg-[#FFE600] text-[#1a0833] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  ۳
                </div>
                <p className="font-bold leading-relaxed">
                  {language === 'fa' ? (
                    <>اکنون آیکون بازی روی صفحه گوشی شما قرار گرفته و بدون نیاز به اینترنت و تمام‌صفحه باز می‌شود!</>
                  ) : (
                    <>The game icon is now added to your home screen with offline and fullscreen support!</>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#241442] text-white font-black text-xs hover:bg-[#1a0833] transition"
            >
              {language === 'fa' ? 'متوجه شدم ✓' : 'Got it ✓'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default PWAInstallButton;
