import React, { useState } from 'react';
import { Team, Player, TeamColor, Language, PlayedCardRecord, GameHistoryEntry } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TeamMascot } from './Mascots';
import { sound } from '../soundManager';
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

  const isRTL = language === 'fa' || language === 'ar';
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
      `🎉 کارنامه مسابقه بازی دور (Party & Co • SHOCK YOU!)`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#170B2C]/80 backdrop-blur-sm animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm bg-gradient-to-br from-[#241442] via-[#2f1857] to-[#43167a] text-white rounded-3xl border-[3.5px] border-[#FFE600] shadow-[6px_6px_0px_0px_#241442] p-4 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-2 border-b border-[#FFE600]/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFE600] text-[#1a0833] flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#241442]">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#FFE600] font-display uppercase tracking-wide">
                اشتراک‌گذاری کارنامه
              </h2>
              <span className="text-[10px] text-slate-300 block">گزارش مسابقه و دستاوردهای زبانی</span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visual Scorecard Preview Card */}
        <div className="my-3 p-3.5 bg-white text-[#1a0833] rounded-2xl border-[3px] border-[#241442] shadow-[3px_3px_0px_0px_#241442] space-y-2.5">
          
          {/* Top Brand Banner */}
          <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black bg-[#241442] text-[#FFE600] px-2 py-0.5 rounded-lg">
                PARTY & CO
              </span>
              <span className="text-[10px] text-slate-500 font-bold">SHOCK YOU!</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {new Date().toLocaleDateString('fa-IR')}
            </span>
          </div>

          {/* Winner Showcase */}
          <div className="flex items-center gap-2.5 p-2 bg-[#F8EFFF] rounded-xl border-2 border-[#241442]">
            <TeamMascot color={winnerColor} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-black text-[#FF007F]">
                <Crown size={14} />
                <span>تیم قهرمان: {winnerPlayerNames}</span>
              </div>
              <span className="text-[10px] text-slate-600 font-bold block truncate">
                تیم {winnerColor === 'BLUE' ? 'آبی' : winnerColor === 'RED' ? 'قرمز' : winnerColor === 'GREEN' ? 'سبز' : 'زرد'}
              </span>
            </div>
          </div>

          {/* Key Stats Pill Row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-[#EBFBFF] p-1.5 rounded-xl border border-[#00F0FF]">
              <span className="text-[9px] text-slate-500 font-bold block">مجموع امتیاز</span>
              <span className="text-base font-black text-[#241442]">{totalPoints} ⭐</span>
            </div>
            <div className="bg-[#EFFFEC] p-1.5 rounded-xl border border-[#39FF14]">
              <span className="text-[9px] text-slate-500 font-bold block">دقت پاسخ‌ها</span>
              <span className="text-base font-black text-[#1a0833]">{accuracy}% 🎯</span>
            </div>
            <div className="bg-[#FFF8EB] p-1.5 rounded-xl border border-[#FFE600]">
              <span className="text-[9px] text-slate-500 font-bold block">کارت درست</span>
              <span className="text-base font-black text-[#1a0833]">{correctCards}/{totalCards} 📚</span>
            </div>
          </div>

          {/* MVP Badge */}
          {mvpName && (
            <div className="p-1.5 bg-[#FFF0F5] rounded-xl border border-[#FF007F] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Flame size={15} className="text-[#FF007F]" />
                <span className="font-black text-[#1a0833]">ستاره مسابقه (MVP):</span>
                <span className="font-black text-[#FF007F]">{mvpName}</span>
              </div>
              <span className="text-[10px] bg-[#FF007F] text-white px-2 py-0.5 rounded-md font-black">
                {mvpPoints} امتیاز
              </span>
            </div>
          )}

          {/* Learned Vocab Preview */}
          {learnedWords.length > 0 && (
            <div className="text-start">
              <span className="text-[10px] font-black text-slate-600 block mb-1">
                کلمات یادگرفته شده در این دست:
              </span>
              <div className="flex flex-wrap gap-1">
                {learnedWords.slice(0, 4).map((w, idx) => (
                  <span key={idx} className="text-[9.5px] bg-slate-100 text-[#1a0833] px-2 py-0.5 rounded-md border border-slate-300 font-bold">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Copy Feedback Alert */}
        {copied && (
          <div className="mb-2 p-2 bg-[#39FF14] text-[#1a0833] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#241442] animate-bounce">
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
            className="pixel-btn pixel-btn-pink w-full py-2.5 text-sm font-black uppercase flex items-center justify-center gap-2 text-white shadow-[3px_3px_0px_0px_#241442]"
          >
            <Share2 size={16} />
            <span>اشتراک مستقیم (واتس‌اپ، تلگرام، پیامک...)</span>
          </button>

          {/* Social Channels Quick Row */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleWhatsAppShare}
              className="py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-xs border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1"
            >
              <MessageSquare size={14} />
              <span>واتس‌اپ</span>
            </button>

            <button
              onClick={handleTelegramShare}
              className="py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-black text-xs border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1"
            >
              <Send size={14} />
              <span>تلگرام</span>
            </button>

            <button
              onClick={handleDiscordShare}
              className="py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl font-black text-xs border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1"
            >
              <Zap size={14} />
              <span>دیسکورد</span>
            </button>
          </div>

          {/* Copy Full Text Button */}
          <button
            onClick={() => handleCopyText('full')}
            className="w-full py-2 bg-white hover:bg-slate-100 text-[#1a0833] rounded-xl font-black text-xs border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1.5"
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
