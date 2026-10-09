import React, { useState, useEffect } from 'react';
import { Swords, X, Play, RotateCw, Users, Sparkles, Trophy, Smartphone, Wifi, Globe, KeyRound } from 'lucide-react';
import { Language, CEFRLevel } from '../types';
import { SUPPORTED_LANGUAGES, ARCADE_AVATARS, ARCADE_CHARACTERS } from '../constants';
import { sound } from '../soundManager';

export interface DuelSettings {
  player1Name: string;
  player1Avatar: string;
  player2Name: string;
  player2Avatar: string;
  targetLanguage: Language;
  nativeLanguage?: Language;
  cefrLevel: CEFRLevel;
  winningScore: number;
  faceToFaceRotation: boolean;
  sabotageEnabled: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartDuel: (settings: DuelSettings) => void;
  onStartOnlineDuel?: (roomCode?: string) => void;
  currentLanguage: Language;
  uiLanguage?: Language;
  isRTL?: boolean;
}

export const DuelSetupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onStartDuel,
  onStartOnlineDuel,
  currentLanguage,
  uiLanguage = 'fa',
  isRTL = true
}) => {
  const isEn = uiLanguage === 'en' || uiLanguage === 'en-US' || !isRTL;
  const defaultP1 = isEn ? 'Player 1 (Blue)' : 'بازیکن ۱ (آبی)';
  const defaultP2 = isEn ? 'Player 2 (Red)' : 'بازیکن ۲ (قرمز)';

  // Device Mode: 'single_phone' (Shared Screen) vs 'two_phones' (Online 2 Phones)
  const [deviceMode, setDeviceMode] = useState<'single_phone' | 'two_phones'>('single_phone');
  const [onlineRoomCodeInput, setOnlineRoomCodeInput] = useState<string>('');

  const [player1Name, setPlayer1Name] = useState(defaultP1);
  const [player1Avatar, setPlayer1Avatar] = useState('🕹️');
  const [player2Name, setPlayer2Name] = useState(defaultP2);
  const [player2Avatar, setPlayer2Avatar] = useState('👾');
  const [targetLanguage, setTargetLanguage] = useState<Language>(currentLanguage || 'nl');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A1');
  const [winningScore, setWinningScore] = useState<number>(5);
  const [faceToFaceRotation, setFaceToFaceRotation] = useState<boolean>(true);
  const [sabotageEnabled, setSabotageEnabled] = useState<boolean>(true);

  // Synchronize player names when language or open state changes
  useEffect(() => {
    if (isOpen) {
      if (!player1Name || player1Name === 'بازیکن ۱ (آبی)' || player1Name === 'Player 1 (Blue)') {
        setPlayer1Name(defaultP1);
      }
      if (!player2Name || player2Name === 'بازیکن ۲ (قرمز)' || player2Name === 'Player 2 (Red)') {
        setPlayer2Name(defaultP2);
      }
    }
  }, [isOpen, isRTL, isEn, defaultP1, defaultP2]);

  if (!isOpen) return null;

  const handleStart = () => {
    sound.playStartGame();
    onStartDuel({
      player1Name: player1Name.trim() || (isEn ? 'Player 1' : 'بازیکن ۱'),
      player1Avatar,
      player2Name: player2Name.trim() || (isEn ? 'Player 2' : 'بازیکن ۲'),
      player2Avatar,
      targetLanguage,
      nativeLanguage: isEn ? 'en' : 'fa',
      cefrLevel,
      winningScore,
      faceToFaceRotation,
      sabotageEnabled
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-2xl overflow-hidden text-[var(--ink)] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--panel)] p-4 flex items-center justify-between border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2347C5] to-[#E0533C] text-white flex items-center justify-center shadow-md">
              <Swords size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--ink)]">
                {isRTL ? 'دوئل سرعتی دونفره ⚔️' : '1v1 Speed Duel ⚔️'}
              </h2>
              <span className="text-[11px] font-bold text-[var(--mute)]">
                {isRTL ? 'مسابقه سرعتی دونفره (حضوری یا آنلاین اینترنتی)' : 'Head-to-head duel (Local or Online Match)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Quick 1v1 Online Matchmaking Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-500/10 via-rose-500/10 to-amber-500/10 border border-[#2347C5]/30 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#2347C5] to-[#E0533C] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Swords size={16} />
              </div>
              <div className="text-start">
                <span className="text-xs font-black text-[var(--ink)] block leading-tight">
                  {isRTL ? 'مچ‌یابی آنلاین دونفره' : '1v1 Online Matchmaking'}
                </span>
                <span className="text-[10px] text-[var(--mute)] font-medium block">
                  {isRTL ? 'جستجوی زنده حریف در اینترنت' : 'Live opponent search online'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
                onStartOnlineDuel?.('__matchmake__');
              }}
              className="py-1.5 px-3 bg-gradient-to-r from-[#2347C5] to-[#E0533C] hover:brightness-105 active:scale-95 text-white text-xs font-black rounded-xl shrink-0 shadow-xs transition-all cursor-pointer"
            >
              {isRTL ? 'مچ آنلاین ⚡' : 'Match ⚡'}
            </button>
          </div>

          {/* DEVICE MODE SELECTOR (1 Phone vs 2 Phones) */}
          <div className="bg-[var(--bg)] p-1 rounded-2xl border border-[var(--line)] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => { sound.playClick(); setDeviceMode('single_phone'); }}
              className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === 'single_phone'
                  ? 'bg-[var(--lapis)] text-white shadow-xs'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              <Smartphone size={15} />
              <span>{isRTL ? '📱 حضوری (۱ گوشی)' : '📱 Local (1 Phone)'}</span>
            </button>
            <button
              type="button"
              onClick={() => { sound.playClick(); setDeviceMode('two_phones'); }}
              className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === 'two_phones'
                  ? 'bg-gradient-to-r from-[#2347C5] to-[#E0533C] text-white shadow-xs'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              }`}
            >
              <Globe size={15} />
              <span>{isRTL ? '🌐 آنلاین (۲ گوشی)' : '🌐 Online (2 Phones)'}</span>
            </button>
          </div>

          {/* TWO PHONES (ONLINE 1v1 DUEL) SECTION */}
          {deviceMode === 'two_phones' && (
            <div className="p-3.5 bg-gradient-to-br from-blue-50/80 to-red-50/80 dark:from-blue-950/30 dark:to-red-950/30 border-2 border-[var(--lapis)]/40 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-[var(--lapis)]" />
                <h4 className="text-xs font-black text-[var(--ink)]">
                  {isRTL ? 'مسابقه زنده دونفره روی دو گوشی جداگانه' : 'Live 1v1 Duel on 2 Separate Phones'}
                </h4>
              </div>
              <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                {isRTL 
                  ? 'هر بازیکن روی گوشی خودش بازی می‌کند؛ کارت‌ها و پاسخ‌ها هم‌زمان و زنده در هر دو گوشی همگام می‌شوند!'
                  : 'Each player plays on their own device. Cards, reflexes, and scores sync in real-time!'}
              </p>

              <div className="space-y-2 pt-1">
                {/* Quick 1v1 Matchmaking */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    onStartOnlineDuel?.('__matchmake__');
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-[#2347C5] to-[#E0533C] hover:brightness-105 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Swords size={15} />
                  <span>{isRTL ? '⚡ مچ‌یابی آنلاین دونفره (سریع)' : '⚡ Find 1v1 Online Duel Match'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    onStartOnlineDuel?.();
                  }}
                  className="w-full py-2.5 px-3 bg-[var(--lapis)] hover:bg-[#1a38a0] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Wifi size={14} />
                  <span>{isRTL ? '👑 ایجاد اتاق دوئل آنلاین (میزبان)' : '👑 Host Online Duel Room'}</span>
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={onlineRoomCodeInput}
                    onChange={e => setOnlineRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder={isRTL ? 'کد اتاق حریف (مثلاً D28)' : 'Room Code (e.g. D28)'}
                    className="flex-1 text-xs font-black px-3 py-2 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] outline-none uppercase"
                  />
                  <button
                    type="button"
                    disabled={!onlineRoomCodeInput.trim()}
                    onClick={() => {
                      sound.playClick();
                      onClose();
                      onStartOnlineDuel?.(onlineRoomCodeInput.trim());
                    }}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <KeyRound size={14} />
                    <span>{isRTL ? 'ورود' : 'Join'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Players Card Configuration (Used for 1 phone and setup) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Player 1 (Blue) */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border-2 border-[#2347C5]/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#2347C5]">
                  {isRTL ? 'بازیکن ۱ (پایین / آبی)' : 'Player 1 (Bottom / Blue)'}
                </span>
                <span className="text-xl drop-shadow-sm">{player1Avatar}</span>
              </div>
              <input
                type="text"
                value={player1Name}
                onChange={e => setPlayer1Name(e.target.value)}
                maxLength={16}
                className="w-full text-xs font-bold px-2 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] outline-none"
                placeholder={isRTL ? 'نام بازیکن ۱' : 'Player 1'}
              />
              <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
                {ARCADE_CHARACTERS.slice(0, 10).map(c => (
                  <button
                    key={`p1-${c.emoji}`}
                    type="button"
                    title={isRTL ? c.nameFa : c.nameEn}
                    onClick={() => { sound.playClick(); setPlayer1Avatar(c.emoji); }}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform ${
                      player1Avatar === c.emoji 
                        ? 'bg-[#2347C5] text-white scale-110 shadow-[0_0_8px_rgba(35,71,197,0.5)]' 
                        : 'bg-[var(--panel)] hover:bg-[var(--bg)]'
                    }`}
                  >
                    {c.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Player 2 (Red) */}
            <div className="p-3 bg-red-50/60 dark:bg-red-950/20 border-2 border-[#E0533C]/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#E0533C]">
                  {isRTL ? 'بازیکن ۲ (بالا / قرمز)' : 'Player 2 (Top / Red)'}
                </span>
                <span className="text-xl drop-shadow-sm">{player2Avatar}</span>
              </div>
              <input
                type="text"
                value={player2Name}
                onChange={e => setPlayer2Name(e.target.value)}
                maxLength={16}
                className="w-full text-xs font-bold px-2 py-1.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[var(--ink)] outline-none"
                placeholder={isRTL ? 'نام بازیکن ۲' : 'Player 2'}
              />
              <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
                {ARCADE_CHARACTERS.slice(6, 16).map(c => (
                  <button
                    key={`p2-${c.emoji}`}
                    type="button"
                    title={isRTL ? c.nameFa : c.nameEn}
                    onClick={() => { sound.playClick(); setPlayer2Avatar(c.emoji); }}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform ${
                      player2Avatar === c.emoji 
                        ? 'bg-[#E0533C] text-white scale-110 shadow-[0_0_8px_rgba(224,83,60,0.5)]' 
                        : 'bg-[var(--panel)] hover:bg-[var(--bg)]'
                    }`}
                  >
                    {c.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Match Score Target */}
          <div className="bg-[var(--bg)] p-3 rounded-2xl border border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[var(--ink)]">
                <Trophy size={14} className="text-[var(--saffron)]" />
                <span>{isRTL ? 'شرط پیروزی مسابقه (امتیاز هدف):' : 'Winning Score Target:'}</span>
              </span>
              <span className="text-xs font-black text-[var(--teal)]">
                {winningScore} {isRTL ? 'امتیاز' : 'PTS'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 7, 10].map(sc => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => { sound.playClick(); setWinningScore(sc); }}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    winningScore === sc
                      ? 'bg-[var(--teal)] text-white shadow-xs'
                      : 'bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--bg)]'
                  }`}
                >
                  {sc} {isRTL ? 'امتیاز' : 'pts'}
                </button>
              ))}
            </div>
          </div>

          {/* Screen Rotation Mode (Face-to-Face vs Side-by-Side) */}
          <div className="bg-[var(--bg)] p-3 rounded-2xl border border-[var(--line)] space-y-2">
            <span className="text-xs font-bold text-[var(--ink)] block">
              {isRTL ? 'نحوه نشستن و چیدمان صفحه گوشی:' : 'Screen Layout & Seating:'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { sound.playClick(); setFaceToFaceRotation(true); }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  faceToFaceRotation
                    ? 'bg-[var(--lapis-soft)] text-[var(--lapis)] border-[var(--lapis)] shadow-xs'
                    : 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--bg)]'
                }`}
              >
                <RotateCw size={18} className="rotate-180" />
                <span className="font-black">{isRTL ? 'رو در رو (۱۸۰ درجه)' : 'Face-to-Face (180°)'}</span>
                <span className="text-[10px] text-[var(--mute)]">{isRTL ? 'گوشی روی میز بین دو نفر' : 'Phone between players'}</span>
              </button>

              <button
                type="button"
                onClick={() => { sound.playClick(); setFaceToFaceRotation(false); }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  !faceToFaceRotation
                    ? 'bg-[var(--lapis-soft)] text-[var(--lapis)] border-[var(--lapis)] shadow-xs'
                    : 'bg-[var(--panel)] text-[var(--ink)] border-[var(--line)] hover:bg-[var(--bg)]'
                }`}
              >
                <Users size={18} />
                <span className="font-black">{isRTL ? 'کنار هم (هم‌جهت)' : 'Side-by-Side (0°)'}</span>
                <span className="text-[10px] text-[var(--mute)]">{isRTL ? 'روی مبل یا در دست' : 'Holding together'}</span>
              </button>
            </div>
          </div>

          {/* Language & CEFR Level */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-[var(--mute)] block mb-1">
                {isRTL ? 'زبان رقابت:' : 'Language:'}
              </label>
              <select
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value as Language)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] outline-none"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {isRTL ? `${l.persianName} (${l.name})` : `${l.name} (${l.code.toUpperCase()})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--mute)] block mb-1">
                {isRTL ? 'سطح دشواری (CEFR):' : 'Level:'}
              </label>
              <select
                value={cefrLevel}
                onChange={e => setCefrLevel(e.target.value as CEFRLevel)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] outline-none"
              >
                <option value="A1">{isRTL ? 'A1 (مبتدی)' : 'A1 (Beginner)'}</option>
                <option value="A2">{isRTL ? 'A2 (مقدماتی)' : 'A2 (Elementary)'}</option>
                <option value="B1">{isRTL ? 'B1 (متوسط)' : 'B1 (Intermediate)'}</option>
                <option value="B2">{isRTL ? 'B2 (پیشرفته)' : 'B2 (Upper-Intermediate)'}</option>
                <option value="all">{isRTL ? 'تمام سطوح (ترکیبی)' : 'All Levels (Mixed)'}</option>
              </select>
            </div>
          </div>

          {/* Sabotage Power-Ups Switch */}
          <div 
            onClick={() => setSabotageEnabled(!sabotageEnabled)}
            className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-xl border border-[var(--line)] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--saffron)]" />
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">
                  {isRTL ? 'آیتم ویژه شوک سرعت (Sabotage Shock)' : 'Speed Shock Power-Up'}
                </span>
                <span className="text-[10px] text-[var(--mute)]">
                  {isRTL ? 'هر بازیکن یک‌بار در بازی می‌تواند حریف را شوکه کند' : '1 shock per match to disrupt opponent'}
                </span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={sabotageEnabled} 
              readOnly 
              className="accent-[var(--teal)] w-4 h-4 cursor-pointer" 
            />
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--mute)] hover:text-[var(--ink)]"
          >
            {isRTL ? 'انصراف' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (deviceMode === 'two_phones') {
                sound.playClick();
                onClose();
                onStartOnlineDuel?.(onlineRoomCodeInput.trim() || undefined);
              } else {
                handleStart();
              }
            }}
            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#2347C5] to-[#E0533C] text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform cursor-pointer"
          >
            {deviceMode === 'two_phones' ? (
              <>
                <Globe size={18} />
                <span>{isRTL ? 'شروع دوئل آنلاین 🌐' : 'Start Online Duel 🌐'}</span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>{isRTL ? 'شروع مسابقه دوئل ⚔️' : 'Start Duel Match ⚔️'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
