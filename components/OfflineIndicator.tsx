import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC<{ language?: string }> = ({ language = 'fa' }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

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
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1 bg-[#39FF14] text-[#1a0833] border-2 border-[#241442] rounded-full text-xs font-black shadow-lg animate-bounce"
        dir={language === 'fa' || language === 'ar' ? 'rtl' : 'ltr'}
      >
        <Wifi size={14} className="text-[#1a0833]" />
        <span>{language === 'fa' ? 'اتصال برقرار شد' : 'Back Online'}</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div 
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1 bg-[#FF007F] text-white border-2 border-[#241442] rounded-full text-xs font-black shadow-lg"
      dir={language === 'fa' || language === 'ar' ? 'rtl' : 'ltr'}
    >
      <WifiOff size={14} className="text-[#FFE600] animate-pulse" />
      <span>{language === 'fa' ? 'حالت آفلاین (کارت‌ها در دسترسند)' : 'Offline Mode (Cards ready)'}</span>
    </div>
  );
};
export default OfflineIndicator;
