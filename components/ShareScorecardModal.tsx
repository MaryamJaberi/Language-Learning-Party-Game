import React, { useState } from 'react';
import { Team, Player, TeamColor, Language, PlayedCardRecord, GameHistoryEntry } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TeamMascot } from './Mascots';
import { sound } from '../soundManager';
import { isRtlLang } from '../ui';
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  Trophy, 
  Crown, 
  Sparkles, 
  Award, 
  Flame, 
  MessageSquare, 
  Send, 
  Globe, 
  Zap,
  ExternalLink
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  winners: Team[];
  players: Player[];
  playedCards: PlayedCardRecord[];
  language: Language;
  historyEntry?: GameHistoryEntry;
}

export const ShareScorecardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  winners,
  players,
  playedCards = [],
  language,
  historyEntry
}) => {
  const [copied, setCopied] = useState(false);
  const [copyType, setCopyType] = useState<string | null>(null);

  if (!isOpen) return null;

  const isRTL = isRtlLang(language);
  const winnerColor = winners[0]?.color || TeamColor.Blue;
  const config = COLORS_MAP[winnerColor] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };
  
  const winnerPlayerNames = players
    .filter(p => winners.some(w => w.id === p.teamId))
    .map(p => p.name)
    .join(' و ');

  const totalCards = playedCards.length;
  const correctCards = playedCards.filter(c => c.guessedCorrectly).length;
  const accuracy = totalCards > 0 ? Math.round((correctCards / totalCards) * 100) : 100;
  const totalPoints = playedCards.reduce((sum, c) => sum + (c.pointsEarned || 0), 0);

  // MVP calculation (player who answered most correct cards)
  const playerStats: Record<string, { correct: number; points: number; team: TeamColor }> = {};
  playedCards.forEach(c => {
    if (!c.answeringPlayerName) return;
    if (!playerStats[c.answeringPlayerName]) {
      playerStats[c.answeringPlayerName] = { correct: 0, points: 0, team: c.answeringTeamColor };
    }
    if (c.guessedCorrectly) {
      playerStats[c.answeringPlayerName].correct += 1;
      playerStats[c.answeringPlayerName].points += (c.pointsEarned || 1);
    }
  });

  let mvpName = '';
  let mvpPoints = 0;
  Object.entries(playerStats).forEach(([name, stat]) => {
    if (stat.points > mvpPoints) {
      mvpPoints = stat.points;
      mvpName = name;
    }
  });

  // Top learned vocabulary
  const learnedWords = playedCards
    .filter(c => c.guessedCorrectly)
    .slice(0, 5)
    .map(c => `${c.card.targetText} (${c.card.translation}) [${c.card.cefrLevel}]`);

  // Build formatted text for sharing
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aistudio.google.com';
  
  const generateShareText = () => {
    return [
      `🎉 کارنامه مسابقه بازی دور (DOŪR - Language Party Game)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🏆 تیم برنده: تیم ${winnerColor === 'BLUE' ? 'آبی 💙' : winnerColor === 'RED' ? 'قرمز ❤️' : winnerColor === 'GREEN' ? 'سبز 💚' : 'زرد 💛'} (${winnerPlayerNames})`,
      `⭐ امتیاز کل: ${totalPoints} امتیاز`,
      `🎯 دقت پاسخ‌ها: ${accuracy}% (${correctCards} از ${totalCards} کلمه درست)`,
      mvpName ? `🥇 ستاره مسابقه (MVP): ${mvpName} با ${mvpPoints} امتیاز!` : '',
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📚 نمونه کلمات یادگرفته شده:`,
      ...learnedWords.map(w => `• ${w}`),
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⚡ همین حالا آنلاین بازی کنید:`,
      `${appUrl}`
    ].filter(Boolean).join('\n');
  };

  const handleNativeShare = async () => {
    sound.playClick();
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'کارنامه بازی دورهمی یادگیری زبان (دور)',
          text: text,
          url: appUrl
        });
      } catch (e) {
        // Fallback to clipboard
        handleCopyText('full');
      }
    } else {
      handleCopyText('full');
    }
  };

  const handleCopyText = (type: string) => {
    sound.playCorrect();
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setCopyType(type);
    setTimeout(() => {
      setCopied(false);
      setCopyType(null);
    }, 2500);
  };

  const handleWhatsAppShare = () => {
    sound.playClick();
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    sound.playClick();
    const text = encodeURIComponent(generateShareText());
    window.open(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${text}`, '_blank');
  };

  const handleDiscordShare = () => {
    sound.playClick();
    const formattedForDiscord = `\`\`\`yaml\n🏆 PARTY & CO (DOUR) SCORECARD\nWinner: ${winnerColor} Team (${winnerPlayerNames})\nScore: ${totalPoints} PTS | Accuracy: ${accuracy}%\nMVP: ${mvpName || 'All Players'}\n\`\`\`\nPlay here: ${appUrl}`;
    navigator.clipboard.writeText(formattedForDiscord);
    setCopied(true);
    setCopyType('discord');
    setTimeout(() => {
      setCopied(false);
      setCopyType(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm bg-[var(--panel)] text-[var(--ink)] rounded-[20px] border border-[var(--line)] shadow-[var(--shadow)] p-4 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--saffron)] text-[var(--ink)] flex items-center justify-center font-bold border border-[var(--line)] shadow-[var(--shadow-sm)]">
              <Share2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)] font-display uppercase tracking-wide">
                اشتراک‌گذاری کارنامه
              </h2>
              <span className="text-[10px] text-[var(--mute)] block font-medium">گزارش مسابقه و دستاوردهای زبانی</span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-[8px] bg-[var(--bg)] hover:bg-[var(--panel)] flex items-center justify-center text-[var(--ink)] border border-[var(--line)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Visual Scorecard Preview Card */}
        <div className="my-3 p-3.5 bg-[var(--bg)] text-[var(--ink)] rounded-[16px] border border-[var(--line)] space-y-2.5">
          
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold bg-[var(--ink)] text-[var(--bg)] px-2 py-0.5 rounded-[6px]">
                بازی دور
              </span>
              <span className="text-[10px] text-[var(--mute)] font-bold">DOŪR GAME</span>
            </div>
            <span className="text-[10px] font-bold text-[var(--mute)]">
              {new Date().toLocaleDateString('fa-IR')}
            </span>
          </div>

          {/* Winner Showcase */}
          <div className="flex items-center gap-2.5 p-2 bg-[var(--panel)] rounded-[14px] border border-[var(--line)]">
            <TeamMascot color={winnerColor} size={40} />
            <div className="min-w-0 flex-1 text-start">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--vermilion)]">
                <Crown size={14} />
                <span>تیم قهرمان: {winnerPlayerNames}</span>
              </div>
              <span className="text-[10px] text-[var(--mute)] font-bold block truncate">
                تیم {winnerColor === 'BLUE' ? 'آبی' : winnerColor === 'RED' ? 'قرمز' : winnerColor === 'GREEN' ? 'سبز' : 'زرد'}
              </span>
            </div>
          </div>

          {/* Key Stats Pill Row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-[var(--panel)] p-1.5 rounded-[12px] border border-[var(--line)]">
              <span className="text-[9px] text-[var(--mute)] font-bold block">مجموع امتیاز</span>
              <span className="text-base font-bold text-[var(--ink)]">{totalPoints} ⭐</span>
            </div>
            <div className="bg-[var(--panel)] p-1.5 rounded-[12px] border border-[var(--line)]">
              <span className="text-[9px] text-[var(--mute)] font-bold block">دقت پاسخ‌ها</span>
              <span className="text-base font-bold text-[var(--ink)]">{accuracy}% 🎯</span>
            </div>
            <div className="bg-[var(--panel)] p-1.5 rounded-[12px] border border-[var(--line)]">
              <span className="text-[9px] text-[var(--mute)] font-bold block">کارت درست</span>
              <span className="text-base font-bold text-[var(--ink)]">{correctCards}/{totalCards} 📚</span>
            </div>
          </div>

          {/* MVP Badge */}
          {mvpName && (
            <div className="p-1.5 bg-[var(--panel)] rounded-[12px] border border-[var(--line)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Flame size={15} className="text-[var(--vermilion)]" />
                <span className="font-bold text-[var(--ink)]">ستاره مسابقه (MVP):</span>
                <span className="font-bold text-[var(--vermilion)]">{mvpName}</span>
              </div>
              <span className="text-[10px] bg-[var(--vermilion)] text-white px-2 py-0.5 rounded-[6px] font-bold">
                {mvpPoints} امتیاز
              </span>
            </div>
          )}

          {/* Learned Vocab Preview */}
          {learnedWords.length > 0 && (
            <div className="text-start">
              <span className="text-[10px] font-bold text-[var(--mute)] block mb-1">
                کلمات یادگرفته شده در این دست:
              </span>
              <div className="flex flex-wrap gap-1">
                {learnedWords.slice(0, 4).map((w, idx) => (
                  <span key={idx} className="text-[9.5px] bg-[var(--panel)] text-[var(--ink)] px-2 py-0.5 rounded-[6px] border border-[var(--line)] font-bold">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Copy Feedback Alert */}
        {copied && (
          <div className="mb-2 p-2 bg-[var(--teal)] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-1.5 border border-[var(--line)] shadow-[var(--shadow-sm)] animate-bounce">
            <Check size={16} />
            <span>
              {copyType === 'discord' ? 'متن مخصوص دیسکورد کپی شد!' : 'متن کارنامه به کلیپ‌بورد کپی شد!'}
            </span>
          </div>
        )}

        {/* Share Action Buttons */}
        <div className="space-y-2 shrink-0">
          
          {/* Main Native Share Button */}
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 bg-[var(--vermilion)] hover:bg-[#c94b2a] text-white text-xs font-bold uppercase flex items-center justify-center gap-2 rounded-[12px] shadow-[var(--shadow-sm)] active:translate-y-0.5 transition-all"
          >
            <Share2 size={16} />
            <span>اشتراک مستقیم (واتس‌اپ، تلگرام، پیامک...)</span>
          </button>

          {/* Social Channels Quick Row */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleWhatsAppShare}
              className="py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[10px] font-bold text-xs shadow-[var(--shadow-sm)] flex items-center justify-center gap-1 active:translate-y-0.5 transition-all"
            >
              <MessageSquare size={14} />
              <span>واتس‌اپ</span>
            </button>

            <button
              onClick={handleTelegramShare}
              className="py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-[10px] font-bold text-xs shadow-[var(--shadow-sm)] flex items-center justify-center gap-1 active:translate-y-0.5 transition-all"
            >
              <Send size={14} />
              <span>تلگرام</span>
            </button>

            <button
              onClick={handleDiscordShare}
              className="py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-[10px] font-bold text-xs shadow-[var(--shadow-sm)] flex items-center justify-center gap-1 active:translate-y-0.5 transition-all"
            >
              <Zap size={14} />
              <span>دیسکورد</span>
            </button>
          </div>

          {/* Copy Full Text Button */}
          <button
            onClick={() => handleCopyText('full')}
            className="w-full py-2 bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] rounded-[12px] font-bold text-xs border border-[var(--line)] shadow-[var(--shadow-sm)] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all"
          >
            <Copy size={14} />
            <span>کپی متن خلاصه کارنامه</span>
          </button>

        </div>

      </div>
    </div>
  );
};

export default ShareScorecardModal;
