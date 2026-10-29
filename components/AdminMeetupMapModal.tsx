import React, { useState } from 'react';
import { X, MapPin, Search, Calendar, Users, Navigation, Plus, ExternalLink, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { searchVenuesWithMaps, MapPlace } from '../geminiService';
import { sound } from '../soundManager';
import { PixelAvatar } from './PixelAvatars';

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
  const [joinedMeetupIds, setJoinedMeetupIds] = useState<string[]>([]);

  // Community meetups list (created by admin or local players)
  const [meetups, setMeetups] = useState<LocalPlayerMeetup[]>([
    {
      id: 'm1',
      creatorName: 'سارا (مدیر گروه)',
      avatar: 'fox',
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
      avatar: 'lion',
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
      avatar: 'owl',
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

  const handleJoinMeetup = (id: string) => {
    if (joinedMeetupIds.includes(id)) return;
    sound.playSuccess();
    setJoinedMeetupIds((prev) => [...prev, id]);
    setMeetups((prev) =>
      prev.map((m) =>
        m.id === id && m.currentPlayers < m.maxPlayers
          ? { ...m, currentPlayers: m.currentPlayers + 1 }
          : m
      )
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={() => {
        sound.playClick();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90dvh] flex flex-col bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-2xl overflow-hidden text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[var(--panel)] border-b border-[var(--line)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--turq)]/15 border border-[var(--turq)]/30 flex items-center justify-center text-[var(--turq)] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[var(--ink)] truncate">
                  قرار بازی حضوری و نقشه مکان‌ها
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--saffron)]/15 text-[var(--saffron)] border border-[var(--saffron)]/30 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  ویژه مدیر
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] truncate">
                یافتن کافه‌بازی‌ها، هماهنگی میتاپ‌های حضوری، و مشاهده هم‌بازی‌های علاقه‌مند با Google Maps
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer shrink-0"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[var(--bg)]/40">
          {/* Admin Notice */}
          <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[var(--muted)]">
              <div className="w-8 h-8 rounded-xl bg-[var(--saffron)]/15 text-[var(--saffron)] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="leading-relaxed">
                این بخش با داده‌های رسمی <strong className="text-[var(--ink)]">Google Maps Grounding</strong> متصل است تا بهترین کافه‌ها و پاتوق‌های بازی دور را بیابید و قرارهای بازی گروهی ایجاد کنید.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--turq)] text-white font-black hover:brightness-110 text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'انصراف' : 'ثبت قرار بازی جدید'}
            </button>
          </div>

          {/* New Meetup Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateMeetup} className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--turq)]/40 space-y-3 animate-fade-in shadow-sm">
              <h3 className="font-black text-sm text-[var(--turq)] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                ایجاد قرار بازی حضوری دور (Meetup)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--muted)] font-bold mb-1">نام کافه یا مکان بازی</label>
                  <input
                    type="text"
                    required
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    placeholder="مثال: کافه فکر ونک"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--turq)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] font-bold mb-1">شهر یا منطقه</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="تهران / اصفهان / شیراز ..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--turq)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] font-bold mb-1">زبان تمرینی</label>
                  <input
                    type="text"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    placeholder="انگلیسی، هلندی، آلمانی..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--turq)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] font-bold mb-1">تاریخ و زمان</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="جمعه ساعت ۱۷:۰۰"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--turq)] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[var(--muted)] font-bold mb-1 text-xs">یادداشت برای هم‌بازی‌ها</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--turq)] outline-none text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] font-bold text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--turq)] text-white font-black text-xs hover:brightness-110 cursor-pointer"
                >
                  ثبت و انتشار در نقشه
                </button>
              </div>
            </form>
          )}

          {/* Search Venues via Google Maps Grounding */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-[var(--ink)] flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--turq)]" />
              جستجوی کافه‌بازی‌ها و مکان‌های مناسب با Google Maps
            </h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="نام شهر، محله یا منطقه مورد نظر (مثلاً: تهران، شیراز، میدان ونک...)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] text-sm focus:border-[var(--turq)] outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchVenues()}
                />
              </div>
              <button
                type="button"
                onClick={handleSearchVenues}
                disabled={loadingVenues}
                className="px-5 py-2.5 rounded-xl bg-[var(--lapis)] font-black text-white text-sm flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-sm cursor-pointer shrink-0"
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
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {searchError}
              </p>
            )}

            {/* Google Maps Results */}
            {venueResults && (
              <div className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--turq)]/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[var(--turq)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    پیشنهادات زنده مکان‌های بازی (Google Maps Grounding)
                  </span>
                  <span className="text-[11px] font-bold text-[var(--muted)]">
                    {venueResults.places.length} مکان تایید شده
                  </span>
                </div>

                <div className="text-xs text-[var(--ink)] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto p-3 bg-[var(--bg)] rounded-xl border border-[var(--line)]">
                  {venueResults.text}
                </div>

                {venueResults.places.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-[var(--muted)]">
                      مکان‌های پیشنهادی در نقشه گوگل:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {venueResults.places.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--turq)]/10 border border-[var(--line)] hover:border-[var(--turq)]/40 text-xs text-[var(--ink)] group transition-all"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MapPin className="w-4 h-4 text-[var(--turq)] shrink-0" />
                            <span className="font-bold truncate group-hover:text-[var(--turq)]">
                              {place.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--turq)] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Player Meetups */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[var(--ink)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--lapis)]" />
                هم‌بازی‌های آماده و قرارهای بازی ثبت‌شده
              </h3>
              <span className="text-xs font-bold text-[var(--muted)]">
                {meetups.length} قرار فعال
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meetups.map((m) => {
                const isJoined = joinedMeetupIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--turq)]/50 transition-all flex flex-col justify-between space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center shrink-0">
                          <PixelAvatar id={m.avatar} size={28} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-[var(--ink)] truncate">{m.venueName}</h4>
                          <p className="text-xs text-[var(--muted)] flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[var(--turq)] shrink-0" />
                            {m.locationArea}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--turq)]/15 text-[var(--turq)] border border-[var(--turq)]/30 shrink-0">
                        {m.targetLang}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--muted)] line-clamp-2 bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)]">
                      {m.notes}
                    </p>

                    <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                      <span className="flex items-center gap-1 text-[var(--saffron)] font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        {m.date} - {m.time}
                      </span>
                      <div className="flex items-center gap-1 font-bold text-[var(--ink)]">
                        <Users className="w-3.5 h-3.5 text-[var(--turq)]" />
                        <span>{m.currentPlayers} از {m.maxPlayers} نفر</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJoinMeetup(m.id)}
                      disabled={isJoined}
                      className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isJoined
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-[var(--bg)] hover:bg-[var(--turq)] text-[var(--ink)] hover:text-white border border-[var(--line)] hover:border-[var(--turq)]'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>درخواست حضور شما ثبت شد</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          <span>پیوستن به این دور بازی</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[var(--muted)]">
            طراحی شده بر مبنای نقشه‌های زنده Google Maps Grounding جهت اتصال اجتماعی بازیکنان
          </p>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-[var(--bg)] hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-[var(--line)] text-xs font-black text-[var(--ink)] transition-all cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
