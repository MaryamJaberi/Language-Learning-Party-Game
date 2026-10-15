import React, { useState } from 'react';
import { X, MapPin, Search, Calendar, Users, Navigation, Plus, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { searchVenuesWithMaps, MapPlace } from '../geminiService';
import { sound } from '../soundManager';

interface AdminMeetupMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  isRTL?: boolean;
}

interface LocalPlayerMeetup {
  id: string;
  creatorName: string;
  avatar: string;
  venueName: string;
  locationArea: string;
  targetLang: string;
  date: string;
  time: string;
  currentPlayers: number;
  maxPlayers: number;
  notes: string;
}

export const AdminMeetupMapModal: React.FC<AdminMeetupMapModalProps> = ({
  isOpen,
  onClose,
  language = 'fa',
  isRTL = true,
}) => {
  const [cityInput, setCityInput] = useState('تهران');
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [venueResults, setVenueResults] = useState<{ text: string; places: MapPlace[] } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Community meetups list (created by admin or local players)
  const [meetups, setMeetups] = useState<LocalPlayerMeetup[]>([
    {
      id: 'm1',
      creatorName: 'سارا (مدیر گروه)',
      avatar: '🦊',
      venueName: 'کافه بردگیم فکرکده (ونک)',
      locationArea: 'تهران، میدان ونک',
      targetLang: 'انگلیسی (B1-B2)',
      date: 'پنج‌شنبه ۲۴ مهر',
      time: '۱۷:۳۰',
      currentPlayers: 4,
      maxPlayers: 6,
      notes: 'دور بازی می‌کنیم و اصطلاحات روزمره انگلیسی یاد می‌گیریم! همه خوش‌آمدید.',
    },
    {
      id: 'm2',
      creatorName: 'علی کاظمی',
      avatar: '🦁',
      venueName: 'کافه کتاب اندیشه',
      locationArea: 'تهران، انقلاب',
      targetLang: 'آلمانی (A2-B1)',
      date: 'جمعه ۲۵ مهر',
      time: '۱۶:۰۰',
      currentPlayers: 3,
      maxPlayers: 4,
      notes: 'تمرین مکالمه و کارت‌های آلمانی دور با چای و شیرینی.',
    },
  ]);

  // New meetup creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newCity, setNewCity] = useState('تهران');
  const [newLang, setNewLang] = useState('انگلیسی');
  const [newDate, setNewDate] = useState('آخر هفته ساعت ۱۸');
  const [newMaxPlayers, setNewMaxPlayers] = useState(6);
  const [newNotes, setNewNotes] = useState('قرار بازی دور و تمرین زبان با دوستان جدید');

  if (!isOpen) return null;

  const handleSearchVenues = async () => {
    if (!cityInput.trim()) return;
    sound.playClick();
    setLoadingVenues(true);
    setSearchError(null);

    try {
      // Try to get geolocation if possible
      let latLng: { latitude: number; longitude: number } | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 });
          });
          latLng = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        } catch {
          // Geolocation optional, fallback to city query
        }
      }

      const res = await searchVenuesWithMaps(cityInput, latLng);
      setVenueResults(res);
      sound.playSuccess();
    } catch (err: any) {
      setSearchError(err.message || 'خطا در بارگذاری اطلاعات مکان‌ها از Google Maps');
      sound.playError();
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleCreateMeetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    sound.playSuccess();

    const created: LocalPlayerMeetup = {
      id: `m-${Date.now()}`,
      creatorName: 'مدیر سیستم',
      avatar: '👑',
      venueName: newVenueName.trim(),
      locationArea: newCity.trim(),
      targetLang: newLang.trim(),
      date: newDate.trim(),
      time: '۱۸:۰۰',
      currentPlayers: 1,
      maxPlayers: newMaxPlayers,
      notes: newNotes.trim(),
    };

    setMeetups([created, ...meetups]);
    setShowCreateForm(false);
    setNewVenueName('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-3xl max-h-[92dvh] flex flex-col bg-[#0d1326] border-2 border-[#12B5A4] rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#15204A] via-[#102a45] to-[#15204A] border-b border-[#12B5A4]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#12B5A4]/20 border border-[#12B5A4] flex items-center justify-center text-[#12B5A4]">
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  قرار بازی حضوری و نقشه مکان‌ها
                </h2>
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <ShieldCheck className="w-3 h-3" />
                  ویژه مدیر (آزمایشی)
                </span>
              </div>
              <p className="text-xs text-white/60">
                یافتن کافه‌بازی‌ها، هماهنگی میتاپ‌های حضوری، و مشاهده هم‌بازی‌های علاقه‌مند با Google Maps
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="بستن"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Admin Test Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                این بخش با داده‌های رسمی <strong>Google Maps Grounding</strong> متصل است تا بهترین کافه‌ها و پاتوق‌های بازی دور را بیابید و قرارهای بازی دونفره و چندنفره ایجاد کنید.
              </span>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#12B5A4] text-[#0d1326] font-bold hover:brightness-110 text-xs transition-all shadow"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'انصراف' : 'ثبت قرار بازی جدید'}
            </button>
          </div>

          {/* New Meetup Form Modal Dropdown */}
          {showCreateForm && (
            <form onSubmit={handleCreateMeetup} className="p-4 rounded-xl bg-[#15204A]/90 border border-[#12B5A4]/40 space-y-3 animate-fade-in">
              <h3 className="font-bold text-sm text-[#12B5A4] flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                ایجاد قرار بازی حضوری دور (Dour Meetup)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">نام کافه یا مکان بازی</label>
                  <input
                    type="text"
                    required
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    placeholder="مثال: کافه فکر ونک"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white focus:border-[#12B5A4] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">شهر یا منطقه</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="تهران / اصفهان / شیراز ..."
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white focus:border-[#12B5A4] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">زبان تمرینی</label>
                  <input
                    type="text"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    placeholder="انگلیسی، هلندی، آلمانی..."
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white focus:border-[#12B5A4] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 mb-1">تاریخ و زمان</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="جمعه ساعت ۱۷:۰۰"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white focus:border-[#12B5A4] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/70 mb-1 text-xs">یادداشت برای هم‌بازی‌ها</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white focus:border-[#12B5A4] outline-none text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#12B5A4] text-[#0d1326] font-bold text-xs hover:brightness-110"
                >
                  ثبت و انتشار در نقشه
                </button>
              </div>
            </form>
          )}

          {/* Search Venues via Google Maps Grounding */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#12B5A4]" />
              جستجوی کافه‌بازی‌ها و مکان‌های مناسب با Google Maps
            </h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="نام شهر، محله یا منطقه مورد نظر (مثلاً: تهران، شیراز، میدان ونک...)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#15204A]/60 border border-white/20 text-white text-sm focus:border-[#12B5A4] outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchVenues()}
                />
              </div>
              <button
                onClick={handleSearchVenues}
                disabled={loadingVenues}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#12B5A4] to-[#2347C5] font-bold text-white text-sm flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow"
              >
                {loadingVenues ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                جستجو در نقشه
              </button>
            </div>

            {searchError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {searchError}
              </p>
            )}

            {/* Google Maps Results with Clickable Links */}
            {venueResults && (
              <div className="p-4 rounded-xl bg-[#15204A]/40 border border-[#12B5A4]/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#12B5A4] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    پیشنهادات زنده مکان‌های بازی (Google Maps Grounding)
                  </span>
                  <span className="text-[11px] text-white/50">
                    {venueResults.places.length} مکان تایید شده
                  </span>
                </div>

                <div className="text-xs text-white/80 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto p-2 bg-black/20 rounded-lg">
                  {venueResults.text}
                </div>

                {venueResults.places.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-white/70">
                      مکان‌های پیشنهادی در نقشه گوگل:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {venueResults.places.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 hover:bg-[#12B5A4]/10 border border-white/10 hover:border-[#12B5A4]/40 text-xs text-white group transition-all"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MapPin className="w-4 h-4 text-[#12B5A4] shrink-0" />
                            <span className="font-bold truncate text-white group-hover:text-[#12B5A4]">
                              {place.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-[#12B5A4] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Player Meetups */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FFE600]" />
                هم‌بازی‌های آماده و قرارهای بازی ثبت‌شده
              </h3>
              <span className="text-xs text-white/50">
                {meetups.length} قرار فعال
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meetups.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#15204A]/60 border border-white/10 hover:border-[#12B5A4]/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-xl bg-black/30 border border-white/10">
                        {m.avatar}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{m.venueName}</h4>
                        <p className="text-xs text-white/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#12B5A4]" />
                          {m.locationArea}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#12B5A4]/20 text-[#12B5A4] border border-[#12B5A4]/30">
                      {m.targetLang}
                    </span>
                  </div>

                  <p className="text-xs text-white/80 line-clamp-2 bg-black/20 p-2 rounded-lg">
                    {m.notes}
                  </p>

                  <div className="flex items-center justify-between text-xs text-white/60 pt-1 border-t border-white/10">
                    <span className="flex items-center gap-1 text-[#FFE600]">
                      <Calendar className="w-3.5 h-3.5" />
                      {m.date} - {m.time}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-white/90">
                      <Users className="w-3.5 h-3.5 text-[#12B5A4]" />
                      <span>{m.currentPlayers} از {m.maxPlayers} نفر</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playSuccess();
                      alert('درخواست پیوستن به این قرار بازی ارسال شد! (نسخه آزمایشی مدیر)');
                    }}
                    className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-[#12B5A4] hover:text-[#0d1326] text-xs font-bold transition-all text-white"
                  >
                    پیوستن به این دور بازی 🎮
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0d1326] border-t border-white/10 flex items-center justify-between">
          <p className="text-[11px] text-white/50">
            طراحی شده بر مبنای نقشه‌های زنده Google Maps Grounding جهت اتصال اجتماعی بازیکنان
          </p>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
