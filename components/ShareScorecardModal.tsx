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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E1B2E]/60 backdrop-blur-sm animate-fade-in font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm bg-[#FFFBF4] text-[#1E1B2E] rounded-[24px] border-2 border-[#1E1B2E] shadow-[6px_6px_0px_0px_#1E1B2E] p-4 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#1E1B2E]/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#F2B63D] text-[#1E1B2E] flex items-center justify-center font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
              <Share2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B2E] font-display uppercase tracking-wide">
                اشتراک‌گذاری کارنامه
              </h2>
              <span className="text-[10px] text-[#1E1B2E]/70 block font-medium">گزارش مسابقه و دستاوردهای زبانی</span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-[8px] bg-[#F4EDE1] hover:bg-[#ebdcc8] flex items-center justify-center text-[#1E1B2E] border border-[#1E1B2E] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Visual Scorecard Preview Card */}
        <div className="my-3 p-3.5 bg-[#F4EDE1] text-[#1E1B2E] rounded-[18px] border-2 border-[#1E1B2E] space-y-2.5">
          
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between border-b border-[#1E1B2E]/20 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold bg-[#1E1B2E] text-[#FFFBF4] px-2 py-0.5 rounded-[6px]">
                بازی دور
              </span>
              <span className="text-[10px] text-[#1E1B2E]/70 font-bold">DOŪR GAME</span>
            </div>
            <span className="text-[10px] font-bold text-[#1E1B2E]/60">
              {new Date().toLocaleDateString('fa-IR')}
            </span>
          </div>

          {/* Winner Showcase */}
          <div className="flex items-center gap-2.5 p-2 bg-[#FFFBF4] rounded-[14px] border-2 border-[#1E1B2E]">
            <TeamMascot color={winnerColor} size={40} />
            <div className="min-w-0 flex-1 text-start">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#E0603F]">
                <Crown size={14} />
                <span>تیم قهرمان: {winnerPlayerNames}</span>
              </div>
              <span className="text-[10px] text-[#1E1B2E]/70 font-bold block truncate">
                تیم {winnerColor === 'BLUE' ? 'آبی' : winnerColor === 'RED' ? 'قرمز' : winnerColor === 'GREEN' ? 'سبز' : 'زرد'}
              </span>
            </div>
          </div>

          {/* Key Stats Pill Row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-[#FFFBF4] p-1.5 rounded-[12px] border-2 border-[#1E1B2E]">
              <span className="text-[9px] text-[#1E1B2E]/70 font-bold block">مجموع امتیاز</span>
              <span className="text-base font-bold text-[#1E1B2E]">{totalPoints} ⭐</span>
            </div>
            <div className="bg-[#FFFBF4] p-1.5 rounded-[12px] border-2 border-[#1E1B2E]">
              <span className="text-[9px] text-[#1E1B2E]/70 font-bold block">دقت پاسخ‌ها</span>
              <span className="text-base font-bold text-[#1E1B2E]">{accuracy}% 🎯</span>
            </div>
            <div className="bg-[#FFFBF4] p-1.5 rounded-[12px] border-2 border-[#1E1B2E]">
              <span className="text-[9px] text-[#1E1B2E]/70 font-bold block">کارت درست</span>
              <span className="text-base font-bold text-[#1E1B2E]">{correctCards}/{totalCards} 📚</span>
            </div>
          </div>

          {/* MVP Badge */}
          {mvpName && (
            <div className="p-1.5 bg-[#FFFBF4] rounded-[12px] border-2 border-[#1E1B2E] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Flame size={15} className="text-[#E0603F]" />
                <span className="font-bold text-[#1E1B2E]">ستاره مسابقه (MVP):</span>
                <span className="font-bold text-[#E0603F]">{mvpName}</span>
              </div>
              <span className="text-[10px] bg-[#E0603F] text-white px-2 py-0.5 rounded-[6px] font-bold">
                {mvpPoints} امتیاز
              </span>
            </div>
          )}

          {/* Learned Vocab Preview */}
          {learnedWords.length > 0 && (
            <div className="text-start">
              <span className="text-[10px] font-bold text-[#1E1B2E]/70 block mb-1">
                کلمات یادگرفته شده در این دست:
              </span>
              <div className="flex flex-wrap gap-1">
                {learnedWords.slice(0, 4).map((w, idx) => (
                  <span key={idx} className="text-[9.5px] bg-[#FFFBF4] text-[#1E1B2E] px-2 py-0.5 rounded-[6px] border border-[#1E1B2E] font-bold">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Copy Feedback Alert */}
        {copied && (
          <div className="mb-2 p-2 bg-[#1E9E93] text-white rounded-[12px] font-bold text-xs flex items-center justify-center gap-1.5 border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] animate-bounce">
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
            className="pixel-btn pixel-btn-orange w-full py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-2 rounded-[12px]"
          >
            <Share2 size={16} />
            <span>اشتراک مستقیم (واتس‌اپ، تلگرام، پیامک...)</span>
          </button>

          {/* Social Channels Quick Row */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleWhatsAppShare}
              className="py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[10px] font-bold text-xs border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-1"
            >
              <MessageSquare size={14} />
              <span>واتس‌اپ</span>
            </button>

            <button
              onClick={handleTelegramShare}
              className="py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-[10px] font-bold text-xs border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-1"
            >
              <Send size={14} />
              <span>تلگرام</span>
            </button>

            <button
              onClick={handleDiscordShare}
              className="py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-[10px] font-bold text-xs border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-1"
            >
              <Zap size={14} />
              <span>دیسکورد</span>
            </button>
          </div>

          {/* Copy Full Text Button */}
          <button
            onClick={() => handleCopyText('full')}
            className="w-full py-2 bg-[#FFFBF4] hover:bg-[#F4EDE1] text-[#1E1B2E] rounded-[12px] font-bold text-xs border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-1.5"
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
