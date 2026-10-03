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
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3.5 py-1 bg-[var(--teal)] text-white border border-[var(--line)] rounded-full text-xs font-bold shadow-[var(--shadow-sm)] animate-bounce font-ui"
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
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 bg-[var(--vermilion)] text-white border border-[var(--line)] rounded-full text-[11px] font-bold shadow-[var(--shadow-sm)] font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      title={isRTL ? 'اینترنت قطع است. بازی آفلاین ادامه دارد؛ برای همگام‌سازی ابری و بازی آنلاین، وای‌فای یا داده تلفن همراه را متصل کنید.' : 'Offline. Offline game works; connect to Wi-Fi/data for online sync.'}
    >
      <WifiOff size={13} className="text-white animate-pulse shrink-0" />
      <span>{isRTL ? 'آفلاین (کارت‌ها فعال) • برای آنلاین، اینترنت را وصل کنید' : 'Offline (Cards ready) • Connect Wi-Fi for online'}</span>
    </div>
  );
};
export default OfflineIndicator;
