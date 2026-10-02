import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isRtlLang } from '../ui';

export const OfflineIndicator: React.FC<{ language?: string }> = ({ language = 'fa' }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const isRTL = isRtlLang(language);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div 
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1 bg-[#1E9E93] text-white border-2 border-[#1E1B2E] rounded-full text-xs font-bold shadow-[2px_2px_0px_0px_#1E1B2E] animate-bounce"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Wifi size={14} className="text-white" />
        <span>{isRTL ? 'اتصال برقرار شد' : 'Back Online'}</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div 
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#E0603F] text-white border-2 border-[#1E1B2E] rounded-full text-[11px] font-bold shadow-[2px_2px_0px_0px_#1E1B2E]"
      dir={isRTL ? 'rtl' : 'ltr'}
      title={isRTL ? 'اینترنت قطع است. بازی آفلاین ادامه دارد؛ برای همگام‌سازی ابری و بازی آنلاین، وای‌فای یا داده تلفن همراه را متصل کنید.' : 'Offline. Offline game works; connect to Wi-Fi/data for online sync.'}
    >
      <WifiOff size={13} className="text-white animate-pulse shrink-0" />
      <span>{isRTL ? 'آفلاین (کارت‌ها فعال) • برای آنلاین، اینترنت را وصل کنید' : 'Offline (Cards ready) • Connect Wi-Fi for online'}</span>
    </div>
  );
};
export default OfflineIndicator;
