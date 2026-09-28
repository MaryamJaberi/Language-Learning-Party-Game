import React, { useEffect, useState } from 'react';
import { Team, Player, TeamColor, Language, PlayedCardRecord } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { tUI, isRtlLang } from '../ui';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { markCardsAsSeen, saveWeakCards } from '../contentEngine';
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
  const t = tUI(language);
  const isRTL = isRtlLang(language);
  const isTie = winners.length > 1;
  const winnerColor = winners[0]?.color || TeamColor.Blue;
  const config = COLORS_MAP[winnerColor] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };

  const [activeTab, setActiveTab] = useState<'podium' | 'learning' | 'cards'>('podium');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    sound.playWinner();
    // Persist learning progress
    if (playedCards && playedCards.length > 0) {
      const allCardIds = playedCards.map(p => p.card.id);
      markCardsAsSeen(allCardIds);
      const missed = playedCards.filter(p => !p.guessedCorrectly).map(p => p.card);
      if (missed.length > 0) {
        saveWeakCards(missed).catch(console.error);
      }
      const learned = playedCards.filter(p => p.guessedCorrectly).map(p => p.card.id);
      try {
        const storedLearned = JSON.parse(localStorage.getItem('dor_learned_cards') || '[]');
        const updatedLearned = Array.from(new Set([...storedLearned, ...learned]));
        localStorage.setItem('dor_learned_cards', JSON.stringify(updatedLearned));
      } catch (e) {
        // ignore
      }
    }
  }, [playedCards]);

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
    <div className="h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3 sm:p-4 text-center select-none overflow-hidden font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Pool warning banner */}
      {isPoolExhausted && (
        <div className="mb-1.5 px-3 py-1 bg-[#F2B63D] border-2 border-[#1E1B2E] text-[#1E1B2E] rounded-[14px] font-bold text-xs shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center gap-2 shrink-0">
          <Zap size={14} color="#1E1B2E" fill="#1E1B2E" />
          <span>{t.wordsFinished}</span>
        </div>
      )}

      {/* Tabs Header (Podium vs Learning Summary vs Review Cards) */}
      <div className="w-full flex gap-1.5 mb-2 shrink-0 font-ui">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('podium');
          }}
          className={`flex-1 py-2 rounded-[14px] font-bold text-xs border-2 border-[#1E1B2E] transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#1E1B2E] ${
            activeTab === 'podium'
              ? 'bg-[#F2B63D] text-[#1E1B2E]'
              : 'bg-[#FFFBF4] text-[#1E1B2E]/70 hover:bg-[#F4EDE1]'
          }`}
        >
          <Trophy size={14} className="text-[#E0603F]" />
          <span>{isRTL ? 'سکوی قهرمانی 🏆' : 'Podium 🏆'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('learning');
          }}
          className={`flex-1 py-2 rounded-[14px] font-bold text-xs border-2 border-[#1E1B2E] transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#1E1B2E] ${
            activeTab === 'learning'
              ? 'bg-[#1E9E93] text-white'
              : 'bg-[#FFFBF4] text-[#1E1B2E]/70 hover:bg-[#F4EDE1]'
          }`}
        >
          <Award size={14} className="text-[#1E1B2E]" />
          <span>{isRTL ? 'گزارش یادگیری 📊' : 'Learning Stats 📊'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('cards');
          }}
          className={`flex-1 py-2 rounded-[14px] font-bold text-xs border-2 border-[#1E1B2E] transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#1E1B2E] ${
            activeTab === 'cards'
              ? 'bg-[#E0603F] text-white'
              : 'bg-[#FFFBF4] text-[#1E1B2E]/70 hover:bg-[#F4EDE1]'
          }`}
        >
          <BookOpen size={14} />
          <span>{isRTL ? `مرور کارت‌ها (${totalCards})` : `Card Review (${totalCards})`}</span>
        </button>
      </div>

      {/* Main Scrollable View */}
      <div className="min-h-0 flex-1 w-full overflow-y-auto pr-1 pb-2 space-y-2.5 overscroll-contain font-ui">
        
        {/* TAB 1: PODIUM & CHAMPIONS */}
        {activeTab === 'podium' && (
          <div className="flex flex-col items-center space-y-3">
            
            {/* Dazzling Trophy & Mascot */}
            <div className="my-1 relative flex items-center justify-center">
              <Trophy size={60} color="#F2B63D" fill="#F2B63D" className="drop-shadow-[2px_2px_0px_#1E1B2E]" />
            </div>

            {/* Victory Header Card */}
            <div className="bg-[#FFFBF4] text-[#1E1B2E] p-3.5 w-full border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] rounded-[24px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles size={16} color="#E0603F" />
                <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wider text-[#1E1B2E]">
                  {isTie ? t.tie : winners.length === 1 ? t.winner : t.winners}
                </h1>
                <Sparkles size={16} color="#1E9E93" />
              </div>
              <p className="text-[11px] text-[#1E1B2E]/70 font-bold uppercase tracking-wide">
                {language === 'fa' ? '✨ تبریک به قهرمانان مسابقه یادگیری زبان! ✨' : '✨ CHAMPIONS OF THE LANGUAGE PARTY! ✨'}
              </p>
            </div>

            {/* Winning details card */}
            {!isTie && winners.length === 1 ? (
              <div 
                className="w-full bg-[#FFFBF4] p-3.5 rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] relative overflow-hidden"
              >
                <div className="absolute -right-2 top-0 opacity-15">
                  <TeamMascot color={winnerColor} size={80} animate={false} />
                </div>

                <div 
                  className="text-base sm:text-lg font-bold uppercase mb-2 py-1 px-4 rounded-[14px] border-2 border-[#1E1B2E] inline-flex items-center gap-2 shadow-[2px_2px_0px_0px_#1E1B2E] bg-[#F2B63D] text-[#1E1B2E]"
                >
                  <Crown size={16} color="#1E1B2E" />
                  <span>{t.teamNames[winnerColor]}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 mt-1">
                  {players.filter(p => p.teamId === winners[0].id).map(p => (
                    <span key={p.id} className="text-sm font-bold text-[#1E1B2E] bg-[#F4EDE1] border-2 border-[#1E1B2E] px-3.5 py-1.5 rounded-[12px] w-11/12 shadow-[2px_2px_0px_0px_#1E1B2E] flex items-center justify-center gap-2">
                      <Crown size={14} color="#E0603F" />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#FFFBF4] p-3 rounded-[24px] border-2 border-[#1E1B2E] shadow-[4px_4px_0px_0px_#1E1B2E] w-full space-y-2">
                <div className="text-xs font-bold text-[#1E1B2E]/70 uppercase tracking-widest">{t.winners}</div>
                {winners.map(w => {
                  const configW = COLORS_MAP[w.color] || { bg: 'bg-[#1E9E93]', text: 'text-[#1E1B2E]', hex: '#1E9E93' };
                  return (
                    <div 
                      key={w.id} 
                      className="p-2.5 rounded-[16px] border-2 border-[#1E1B2E] text-[#1E1B2E] font-bold flex items-center justify-between shadow-[2px_2px_0px_0px_#1E1B2E] bg-[#F4EDE1]"
                      style={{ borderLeftWidth: '6px', borderLeftColor: configW.hex }}
                    >
                      <div className="flex items-center gap-2">
                        <TeamMascot color={w.color} size={26} animate={false} />
                        <span className="font-bold truncate text-sm">{labelWinnerNames(w.id)}</span>
                      </div>
                      <span className="text-[10.5px] bg-[#F2B63D] text-[#1E1B2E] border border-[#1E1B2E] px-2 py-0.5 rounded-[8px] font-bold">
                        {t.tie || (isRTL ? 'مساوی' : 'Tie')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mascot celebration */}
            <div className="flex items-center gap-2 bg-[#FFFBF4] px-3.5 py-1.5 rounded-full border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]">
              <TeamMascot color="PARTY" size={28} />
              <span className="text-[11px] text-[#1E1B2E] font-bold">
                {language === 'fa' ? 'دورهمی شاد و پر از یادگیری!' : 'Awesome language party round!'}
              </span>
            </div>

          </div>
        )}

        {/* TAB 2: LEARNING STATS & MASTERY */}
        {activeTab === 'learning' && (
          <div className="space-y-3 text-start font-ui">
            
            {/* Quick KPI Cards Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#FFFBF4] p-2.5 rounded-[16px] border-2 border-[#1E1B2E] text-center shadow-[2px_2px_0px_0px_#1E1B2E]">
                <span className="text-[10px] text-[#1E1B2E]/70 font-bold block">{isRTL ? 'دقت پاسخ‌ها' : 'Accuracy'}</span>
                <span className="text-xl font-bold text-[#E0603F]">{accuracy}%</span>
              </div>
              <div className="bg-[#FFFBF4] p-2.5 rounded-[16px] border-2 border-[#1E1B2E] text-center shadow-[2px_2px_0px_0px_#1E1B2E]">
                <span className="text-[10px] text-[#1E1B2E]/70 font-bold block">{isRTL ? 'کارت‌های موفق' : 'Correct'}</span>
                <span className="text-xl font-bold text-[#1E9E93]">{correctCards}/{totalCards}</span>
              </div>
              <div className="bg-[#FFFBF4] p-2.5 rounded-[16px] border-2 border-[#1E1B2E] text-center shadow-[2px_2px_0px_0px_#1E1B2E]">
                <span className="text-[10px] text-[#1E1B2E]/70 font-bold block">{isRTL ? 'مجموع امتیاز' : 'Total Points'}</span>
                <span className="text-xl font-bold text-[#F2B63D]">{totalPoints}</span>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-[#FFFBF4] p-3 rounded-[20px] border-2 border-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E]">
              <h3 className="text-xs font-bold uppercase text-[#1E1B2E] mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#E0603F]" />
                <span>{isRTL ? 'عملکرد بر تفکیک زبان‌های مسابقه:' : 'Performance by Match Language:'}</span>
              </h3>
              
              <div className="space-y-2">
                {Object.entries(languageStats).map(([langCode, stat]) => {
                  const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                  const langPct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  return (
                    <div key={langCode} className="bg-[#F4EDE1] p-2.5 rounded-[14px] border-2 border-[#1E1B2E] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{langInfo?.flag || '🌐'}</span>
                        <div>
                          <span className="font-bold text-xs text-[#1E1B2E]">{langInfo?.name || langCode}</span>
                          <span className="text-[10px] text-[#1E1B2E]/70 block font-medium">
                            {isRTL ? `${stat.correct} از ${stat.total} کارت درست` : `${stat.correct} of ${stat.total} correct`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-[#1E9E93] text-white px-2.5 py-0.5 rounded-[8px] border border-[#1E1B2E]">
                        {langPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Missed Cards Spaced Repetition Box */}
            {missedCards.length > 0 && (
              <div className="bg-[#FFFBF4] p-3 rounded-[20px] border-2 border-[#E0603F] shadow-[3px_3px_0px_0px_#1E1B2E]">
                <h3 className="text-xs font-bold uppercase text-[#E0603F] mb-1.5 flex items-center gap-1.5">
                  <XCircle size={15} />
                  <span>{isRTL ? `کارت‌های نیازمند تمرین و مرور مجدد (${missedCards.length})` : `Cards for Review & Practice (${missedCards.length})`}</span>
                </h3>
                <p className="text-[10.5px] text-[#1E1B2E]/70 font-medium mb-2">
                  {isRTL 
                    ? 'این کارت‌ها را در بازی بعدی مرور کنید تا ملکه ذهنتان شوند:' 
                    : 'Review these cards to master them in your next session:'}
                </p>
                <div className="space-y-1.5">
                  {missedCards.map((mc, idx) => (
                    <div key={idx} className="bg-[#F4EDE1] p-2 rounded-[12px] border-2 border-[#1E1B2E] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[#1E1B2E] block">{mc.card.targetText}</span>
                        <span className="text-[10px] text-[#1E1B2E]/70">{mc.card.translation}</span>
                      </div>
                      <span className="text-[9.5px] bg-[#1E1B2E] text-[#FFFBF4] px-1.5 py-0.5 rounded font-bold font-mono">
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
          <div className="space-y-2 text-start font-ui">
            {playedCards.length === 0 ? (
              <div className="bg-[#FFFBF4] p-4 rounded-[20px] border-2 border-[#1E1B2E] text-center text-xs font-bold text-[#1E1B2E]/70">
                {isRTL ? 'هنوز کارتی در این مسابقه بازی نشده است.' : 'No cards played yet in this match.'}
              </div>
            ) : (
              playedCards.map((record, index) => {
                const isExpanded = expandedCardId === record.card.id || expandedCardId === String(index);
                const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === record.card.targetLanguage);

                return (
                  <div 
                    key={index} 
                    className="bg-[#FFFBF4] p-2.5 rounded-[16px] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E]"
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedCardId(isExpanded ? null : String(index))}
                    >
                      <div className="flex items-center gap-2">
                        {record.guessedCorrectly ? (
                          <CheckCircle2 size={18} className="text-[#1E9E93] shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-[#E0603F] shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{langInfo?.flag}</span>
                            <span className="font-bold text-xs text-[#1E1B2E]">{record.card.targetText}</span>
                            <button
                              type="button"
                              title={isRTL ? "تلفظ زبان هدف" : "Target language audio"}
                              onClick={(e) => {
                                 e.stopPropagation();
                                 sound.speak(record.card.targetText, record.card.targetLanguage, { force: true });
                              }}
                              className="p-1 rounded-full bg-[#F4EDE1] border border-[#1E1B2E] text-[#1E1B2E]"
                            >
                              <Volume2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#1E1B2E]/70 font-medium">{record.card.translation}</span>
                            <button
                              type="button"
                              title={isRTL ? "تلفظ زبان من" : "My language audio"}
                              onClick={(e) => {
                                 e.stopPropagation();
                                 sound.speak(record.card.translation, record.card.nativeLanguage || language, { force: true });
                              }}
                              className="p-0.5 rounded-full text-[#1E1B2E]/70"
                            >
                              <Volume2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] bg-[#F4EDE1] text-[#1E1B2E] px-1.5 py-0.5 rounded-[6px] border border-[#1E1B2E] font-bold">
                          {record.card.cefrLevel}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    {/* Expanded details (Grammar & Pronunciation) */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t-2 border-[#1E1B2E]/15 text-[10.5px] space-y-1 bg-[#F4EDE1] p-2 rounded-[12px]">
                        {record.card.grammarPoint && (
                          <div>
                            <span className="font-bold text-[#E0603F]">{isRTL ? 'نکته گرامری / الگو: ' : 'Grammar Note / Pattern: '}</span>
                            <span className="text-[#1E1B2E]">{record.card.grammarPoint}</span>
                          </div>
                        )}
                        {record.card.pronunciation && (
                          <div>
                            <span className="font-bold text-[#1E9E93]">{isRTL ? 'راهنمای تلفظ: ' : 'Pronunciation Guide: '}</span>
                            <span className="text-[#1E1B2E] font-mono">{record.card.pronunciation}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-[#1E1B2E]/70">{isRTL ? 'پاسخ‌دهنده: ' : 'Answered By: '}</span>
                          <span className="text-[#1E1B2E] font-bold">{record.answeringPlayerName}</span>
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
      <div className="w-full flex flex-col gap-2 shrink-0 font-ui">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setIsShareModalOpen(true);
          }}
          className="pixel-btn pixel-btn-mustard w-full py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[18px]"
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
          className="pixel-btn pixel-btn-teal w-full py-3.5 text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-[18px]"
        >
          <RotateCcw size={18} />
          <span>{t.playAgain || t.returnMenu}</span>
          <Zap size={18} />
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
