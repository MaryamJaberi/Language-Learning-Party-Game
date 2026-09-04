import React, { useEffect, useState } from 'react';
import { Team, Player, TeamColor, Language, PlayedCardRecord } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  Zap, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Award,
  ChevronDown,
  ChevronUp,
  Volume2,
  Share2
} from 'lucide-react';
import ShareScorecardModal from '../components/ShareScorecardModal';

interface Props {
  winners: Team[];
  players: Player[];
  playedCards?: PlayedCardRecord[];
  onRestart: () => void;
  language: Language;
  isPoolExhausted?: boolean;
}

const EndGameScreen: React.FC<Props> = ({ 
  winners, 
  players, 
  playedCards = [], 
  onRestart, 
  language, 
  isPoolExhausted 
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.fa;
  const isTie = winners.length > 1;
  const winnerColor = winners[0]?.color || TeamColor.Blue;
  const config = COLORS_MAP[winnerColor] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };
  const isRTL = language === 'fa' || language === 'ar';

  const [activeTab, setActiveTab] = useState<'podium' | 'learning' | 'cards'>('podium');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    sound.playWinner();
  }, []);

  function labelWinnerNames(teamId: number): string {
    return players.filter(p => p.teamId === teamId).map(p => p.name).join(' & ');
  }

  // Calculate learning stats
  const totalCards = playedCards.length;
  const correctCards = playedCards.filter(c => c.guessedCorrectly).length;
  const accuracy = totalCards > 0 ? Math.round((correctCards / totalCards) * 100) : 100;
  const totalPoints = playedCards.reduce((sum, c) => sum + (c.pointsEarned || 0), 0);

  // Group by language
  const languageStats: Record<string, { total: number; correct: number }> = {};
  playedCards.forEach(c => {
    const lang = c.card.targetLanguage;
    if (!languageStats[lang]) languageStats[lang] = { total: 0, correct: 0 };
    languageStats[lang].total += 1;
    if (c.guessedCorrectly) languageStats[lang].correct += 1;
  });

  const missedCards = playedCards.filter(c => !c.guessedCorrectly);

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3 sm:p-4 text-center select-none overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Pool warning banner */}
      {isPoolExhausted && (
        <div className="mb-1.5 px-3 py-1 bg-[#FFE600] border-2 border-[#241442] text-[#1a0833] rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#241442] flex items-center gap-2 shrink-0">
          <Zap size={14} color="#1a0833" fill="#1a0833" />
          <span>{t.wordsFinished}</span>
        </div>
      )}

      {/* Tabs Header (Podium vs Learning Summary vs Review Cards) */}
      <div className="w-full flex gap-1.5 mb-2 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('podium');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs border-2 border-[#241442] transition-all flex items-center justify-center gap-1 ${
            activeTab === 'podium'
              ? 'bg-gradient-to-r from-[#FFE600] to-[#FFF033] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Trophy size={14} className="text-[#FF007F]" />
          <span>سکوی قهرمانی 🏆</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('learning');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs border-2 border-[#241442] transition-all flex items-center justify-center gap-1 ${
            activeTab === 'learning'
              ? 'bg-gradient-to-r from-[#00F0FF] to-[#39FF14] text-[#1a0833] shadow-[2px_2px_0px_0px_#241442]'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Award size={14} className="text-[#241442]" />
          <span>گزارش یادگیری 📊</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('cards');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs border-2 border-[#241442] transition-all flex items-center justify-center gap-1 ${
            activeTab === 'cards'
              ? 'bg-gradient-to-r from-[#FF007F] to-[#FF2E93] text-white shadow-[2px_2px_0px_0px_#241442]'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BookOpen size={14} className="text-white" />
          <span>مرور کارت‌ها ({totalCards})</span>
        </button>
      </div>

      {/* Main Scrollable View */}
      <div className="min-h-0 flex-1 w-full overflow-y-auto pr-1 pb-2 space-y-2.5 overscroll-contain">
        
        {/* TAB 1: PODIUM & CHAMPIONS */}
        {activeTab === 'podium' && (
          <div className="flex flex-col items-center space-y-3">
            
            {/* Dazzling Trophy & Mascot */}
            <div className="my-1 relative flex items-center justify-center">
              <div className="absolute -inset-4 bg-[#FFE600] rounded-full blur-xl opacity-40 animate-pulse"></div>
              <Trophy size={64} color="#FFE600" fill="#FFE600" className="drop-shadow-[0_0_10px_rgba(255,230,0,0.8)]" />
            </div>

            {/* Victory Header Card */}
            <div className="pixel-card-shock bg-gradient-to-br from-[#2f1857] via-[#48167d] to-[#6d1cb3] text-white p-3.5 w-full border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] rounded-3xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles size={16} color="#00F0FF" />
                <h1 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFE600] via-[#FF007F] to-[#00F0FF]">
                  {isTie ? t.tie : winners.length === 1 ? t.winner : t.winners}
                </h1>
                <Sparkles size={16} color="#FFE600" />
              </div>
              <p className="text-[11px] text-[#00F0FF] font-black uppercase tracking-widest">
                {language === 'fa' ? '✨ تبریک به قهرمانان مسابقه یادگیری زبان! ✨' : '✨ CHAMPIONS OF THE LANGUAGE PARTY! ✨'}
              </p>
            </div>

            {/* Winning details card */}
            {!isTie && winners.length === 1 ? (
              <div 
                className="w-full bg-white p-3.5 rounded-3xl border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] relative overflow-hidden"
                style={{ borderColor: config.hex }}
              >
                <div className="absolute -right-2 top-0 opacity-20">
                  <TeamMascot color={winnerColor} size={80} animate={false} />
                </div>

                <div 
                  className={`text-base sm:text-lg font-black uppercase mb-2 ${config.text} py-1 px-3.5 rounded-2xl border-2 border-[#241442] inline-flex items-center gap-2 shadow-[2px_2px_0px_0px_#241442]`}
                  style={{ backgroundColor: config.hex }}
                >
                  <Crown size={16} color="#1a0833" />
                  <span>{t.teamNames[winnerColor]}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 mt-1">
                  {players.filter(p => p.teamId === winners[0].id).map(p => (
                    <span key={p.id} className="text-sm font-black text-[#1a0833] bg-[#F8EFFF] border-2 border-[#241442] px-3 py-1.5 rounded-xl w-11/12 shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-2">
                      <Crown size={14} color="#FF007F" />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-3xl border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] w-full space-y-2">
                <div className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.winners}</div>
                {winners.map(w => {
                  const configW = COLORS_MAP[w.color] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };
                  return (
                    <div 
                      key={w.id} 
                      className="p-2.5 rounded-2xl border-[2.5px] border-[#241442] text-[#1a0833] font-bold flex items-center justify-between shadow-[2px_2px_0px_0px_#241442]"
                      style={{ borderLeftWidth: '6px', borderLeftColor: configW.hex }}
                    >
                      <div className="flex items-center gap-2">
                        <TeamMascot color={w.color} size={26} animate={false} />
                        <span className="font-black truncate text-sm">{labelWinnerNames(w.id)}</span>
                      </div>
                      <span className="text-[10px] bg-[#39FF14] text-[#1a0833] border border-[#241442] px-2 py-0.5 rounded-lg font-black">
                        مساوی
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mascot celebration */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442]">
              <TeamMascot color="PARTY" size={32} />
              <span className="text-[11px] text-[#1a0833] font-black">
                {language === 'fa' ? 'دورهمی شاد و پر از یادگیری!' : 'Awesome language party round!'}
              </span>
            </div>

          </div>
        )}

        {/* TAB 2: LEARNING STATS & MASTERY */}
        {activeTab === 'learning' && (
          <div className="space-y-3 text-start">
            
            {/* Quick KPI Cards Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-2xl border-2 border-[#241442] text-center shadow-[2px_2px_0px_0px_#241442]">
                <span className="text-[10px] text-slate-500 font-bold block">دقت پاسخ‌ها</span>
                <span className="text-xl font-black text-[#FF007F]">{accuracy}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border-2 border-[#241442] text-center shadow-[2px_2px_0px_0px_#241442]">
                <span className="text-[10px] text-slate-500 font-bold block">کارت‌های موفق</span>
                <span className="text-xl font-black text-[#39FF14]">{correctCards}/{totalCards}</span>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border-2 border-[#241442] text-center shadow-[2px_2px_0px_0px_#241442]">
                <span className="text-[10px] text-slate-500 font-bold block">مجموع امتیاز</span>
                <span className="text-xl font-black text-[#FFE600]">{totalPoints}</span>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-white p-3 rounded-2xl border-[3px] border-[#241442] shadow-[3px_3px_0px_0px_#241442]">
              <h3 className="text-xs font-black uppercase text-[#1a0833] mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#FF007F]" />
                <span>عملکرد بر تفکیک زبان‌های مسابقه:</span>
              </h3>
              
              <div className="space-y-2">
                {Object.entries(languageStats).map(([langCode, stat]) => {
                  const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                  const langPct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  return (
                    <div key={langCode} className="bg-[#F8EFFF] p-2 rounded-xl border border-[#241442] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{langInfo?.flag || '🌐'}</span>
                        <div>
                          <span className="font-black text-xs text-[#1a0833]">{langInfo?.name || langCode}</span>
                          <span className="text-[10px] text-slate-500 block font-bold">
                            {stat.correct} از {stat.total} کارت درست
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-[#241442] text-[#39FF14] px-2 py-0.5 rounded-lg">
                        {langPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Missed Cards Spaced Repetition Box */}
            {missedCards.length > 0 && (
              <div className="bg-[#FFF4F6] p-3 rounded-2xl border-[3px] border-[#FF1058] shadow-[3px_3px_0px_0px_#241442]">
                <h3 className="text-xs font-black uppercase text-[#FF1058] mb-1.5 flex items-center gap-1.5">
                  <XCircle size={15} />
                  <span>کارت‌های نیازمند تمرین و مرور مجدد ({missedCards.length})</span>
                </h3>
                <p className="text-[10.5px] text-slate-700 font-bold mb-2">
                  این کارت‌ها را در بازی بعدی مرور کنید تا ملکه ذهنتان شوند:
                </p>
                <div className="space-y-1.5">
                  {missedCards.map((mc, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-[#FF1058] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-black text-[#1a0833] block">{mc.card.targetText}</span>
                        <span className="text-[10px] text-slate-500">{mc.card.translation}</span>
                      </div>
                      <span className="text-[9px] bg-[#241442] text-white px-1.5 py-0.5 rounded font-black">
                        {mc.card.targetLanguage.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: REVIEW ALL PLAYED CARDS */}
        {activeTab === 'cards' && (
          <div className="space-y-2 text-start">
            {playedCards.length === 0 ? (
              <div className="bg-white p-4 rounded-2xl border-2 border-[#241442] text-center text-xs font-bold text-slate-600">
                هنوز کارتی در این مسابقه بازی نشده است.
              </div>
            ) : (
              playedCards.map((record, index) => {
                const isExpanded = expandedCardId === record.card.id || expandedCardId === String(index);
                const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === record.card.targetLanguage);

                return (
                  <div 
                    key={index} 
                    className="bg-white p-2.5 rounded-2xl border-2 border-[#241442] shadow-[2px_2px_0px_0px_#241442]"
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedCardId(isExpanded ? null : String(index))}
                    >
                      <div className="flex items-center gap-2">
                        {record.guessedCorrectly ? (
                          <CheckCircle2 size={18} className="text-[#39FF14] shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-[#FF1058] shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{langInfo?.flag}</span>
                            <span className="font-black text-xs text-[#1a0833]">{record.card.targetText}</span>
                            <button
                              type="button"
                              title="تلفظ زبان هدف"
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.speak(record.card.targetText, record.card.targetLanguage, { force: true });
                              }}
                              className="p-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700"
                            >
                              <Volume2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-600 font-bold">{record.card.translation}</span>
                            <button
                              type="button"
                              title="تلفظ زبان من"
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.speak(record.card.translation, record.card.nativeLanguage || language, { force: true });
                              }}
                              className="p-0.5 rounded-full text-slate-500"
                            >
                              <Volume2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-[#F4E8FF] text-[#1a0833] px-1.5 py-0.5 rounded border border-[#241442] font-black">
                          {record.card.cefrLevel}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    {/* Expanded details (Grammar & Pronunciation) */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-[10.5px] space-y-1 bg-[#F9F5FF] p-2 rounded-xl">
                        {record.card.grammarPoint && (
                          <div>
                            <span className="font-black text-[#FF007F]">نکته گرامری / الگو: </span>
                            <span className="text-slate-800">{record.card.grammarPoint}</span>
                          </div>
                        )}
                        {record.card.pronunciation && (
                          <div>
                            <span className="font-black text-[#00F0FF]">راهنمای تلفظ: </span>
                            <span className="text-slate-800 font-mono">{record.card.pronunciation}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-black text-slate-600">پاسخ‌دهنده: </span>
                          <span className="text-[#1a0833] font-bold">{record.answeringPlayerName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Action Buttons Row: Share Scorecard + Play Again */}
      <div className="w-full flex flex-col gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setIsShareModalOpen(true);
          }}
          className="pixel-btn pixel-btn-yellow w-full py-2.5 text-sm font-black uppercase tracking-wider text-[#1a0833] flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#241442]"
        >
          <Share2 size={16} />
          <span>{language === 'fa' ? 'اشتراک‌گذاری کارنامه مسابقه 📤' : 'Share Match Scorecard 📤'}</span>
        </button>

        {/* Play Again button */}
        <button 
          type="button"
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="pixel-btn pixel-btn-pink w-full py-3 text-base font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#241442]"
        >
          <RotateCcw size={18} />
          <span>{t.playAgain || t.returnMenu}</span>
          <Zap size={18} color="#FFE600" fill="#FFE600" />
        </button>
      </div>

      {/* Share Scorecard Modal */}
      <ShareScorecardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        winners={winners}
        players={players}
        playedCards={playedCards}
        language={language}
      />

    </div>
  );
};

export default EndGameScreen;
