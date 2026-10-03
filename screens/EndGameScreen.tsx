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
import { FlagIcon } from '../components/FlagIcon';

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
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col items-center justify-between p-3 sm:p-4 text-center select-none overflow-hidden font-ui bg-[var(--bg)] text-[var(--ink)]" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Pool warning banner */}
      {isPoolExhausted && (
        <div className="mb-1.5 px-3 py-1 bg-[var(--saffron)] text-[var(--ink)] rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 shrink-0">
          <Zap size={14} fill="currentColor" />
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
          className={`flex-1 py-2 px-1 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 ${
            activeTab === 'podium'
              ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs'
              : 'bg-[var(--panel)] text-[var(--mute)] hover:text-[var(--ink)] border-[var(--line)]'
          }`}
        >
          <Trophy size={14} className={activeTab === 'podium' ? 'text-[var(--saffron)]' : ''} />
          <span>{isRTL ? 'سکوی قهرمانی 🏆' : 'Podium 🏆'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('learning');
          }}
          className={`flex-1 py-2 px-1 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 ${
            activeTab === 'learning'
              ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs'
              : 'bg-[var(--panel)] text-[var(--mute)] hover:text-[var(--ink)] border-[var(--line)]'
          }`}
        >
          <Award size={14} />
          <span>{isRTL ? 'گزارش یادگیری 📊' : 'Stats 📊'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('cards');
          }}
          className={`flex-1 py-2 px-1 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 ${
            activeTab === 'cards'
              ? 'bg-[var(--lapis)] text-[var(--on-lapis)] border-[var(--lapis)] shadow-xs'
              : 'bg-[var(--panel)] text-[var(--mute)] hover:text-[var(--ink)] border-[var(--line)]'
          }`}
        >
          <BookOpen size={14} />
          <span>{isRTL ? `مرور (${totalCards})` : `Review (${totalCards})`}</span>
        </button>
      </div>

      {/* Main Scrollable View */}
      <div className="min-h-0 flex-1 w-full overflow-y-auto pr-0.5 pb-2 space-y-2.5 overscroll-contain font-ui">
        
        {/* TAB 1: PODIUM & CHAMPIONS */}
        {activeTab === 'podium' && (
          <div className="flex flex-col items-center space-y-3">
            
            {/* Dazzling Trophy & Mascot */}
            <div className="my-1 relative flex items-center justify-center">
              <Trophy size={60} className="text-[var(--saffron)] drop-shadow-md" fill="currentColor" />
            </div>

            {/* Victory Header Card */}
            <div className="bg-[var(--panel)] text-[var(--ink)] p-4 w-full border border-[var(--line)] shadow-xs rounded-[24px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles size={16} className="text-[var(--saffron)]" />
                <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wider text-[var(--ink)]">
                  {isTie ? t.tie : winners.length === 1 ? t.winner : t.winners}
                </h1>
                <Sparkles size={16} className="text-[var(--turq)]" />
              </div>
              <p className="text-[11px] text-[var(--mute)] font-bold uppercase tracking-wide">
                {language === 'fa' ? '✨ تبریک به قهرمانان مسابقه یادگیری زبان! ✨' : '✨ CHAMPIONS OF THE LANGUAGE PARTY! ✨'}
              </p>
            </div>

            {/* Winning details card */}
            {!isTie && winners.length === 1 ? (
              <div 
                className="w-full bg-[var(--panel)] p-4 rounded-[24px] border border-[var(--line)] shadow-xs relative overflow-hidden"
              >
                <div className="absolute -right-2 top-0 opacity-15">
                  <TeamMascot color={winnerColor} size={80} animate={false} />
                </div>

                <div 
                  className="text-base sm:text-lg font-bold uppercase mb-2 py-1 px-4 rounded-xl border border-[var(--lapis)]/20 inline-flex items-center gap-2 bg-[var(--lapis-soft)] text-[var(--lapis)]"
                >
                  <Crown size={16} />
                  <span>{t.teamNames[winnerColor]}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 mt-1">
                  {players.filter(p => p.teamId === winners[0].id).map(p => (
                    <span key={p.id} className="text-sm font-bold text-[var(--ink)] bg-[var(--bg)] border border-[var(--line)] px-3.5 py-1.5 rounded-xl w-11/12 shadow-xs flex items-center justify-center gap-2">
                      <Crown size={14} className="text-[var(--saffron)]" />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--panel)] p-3 rounded-[24px] border border-[var(--line)] shadow-xs w-full space-y-2">
                <div className="text-xs font-bold text-[var(--mute)] uppercase tracking-widest">{t.winners}</div>
                {winners.map(w => {
                  const configW = COLORS_MAP[w.color] || { bg: 'bg-[#12B5A4]', text: 'text-[#ffffff]', hex: '#12B5A4' };
                  return (
                    <div 
                      key={w.id} 
                      className="p-2.5 rounded-xl border border-[var(--line)] text-[var(--ink)] font-bold flex items-center justify-between shadow-xs bg-[var(--bg)]"
                      style={{ borderInlineStartWidth: '5px', borderInlineStartColor: configW.hex }}
                    >
                      <div className="flex items-center gap-2">
                        <TeamMascot color={w.color} size={26} animate={false} />
                        <span className="font-bold truncate text-sm">{labelWinnerNames(w.id)}</span>
                      </div>
                      <span className="text-[10.5px] bg-[var(--lapis-soft)] text-[var(--lapis)] px-2 py-0.5 rounded-md font-bold">
                        {t.tie || (isRTL ? 'مساوی' : 'Tie')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mascot celebration */}
            <div className="flex items-center gap-2 bg-[var(--panel)] px-4 py-2 rounded-full border border-[var(--line)] shadow-xs">
              <TeamMascot color="PARTY" size={28} />
              <span className="text-[11px] text-[var(--ink)] font-bold">
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
              <div className="bg-[var(--panel)] p-3 rounded-2xl border border-[var(--line)] text-center shadow-xs">
                <span className="text-[10px] text-[var(--mute)] font-bold block">{isRTL ? 'دقت پاسخ‌ها' : 'Accuracy'}</span>
                <span className="text-xl font-black text-[var(--turq)]">{accuracy}%</span>
              </div>
              <div className="bg-[var(--panel)] p-3 rounded-2xl border border-[var(--line)] text-center shadow-xs">
                <span className="text-[10px] text-[var(--mute)] font-bold block">{isRTL ? 'کارت‌های موفق' : 'Correct'}</span>
                <span className="text-xl font-black text-[var(--lapis)]">{correctCards}/{totalCards}</span>
              </div>
              <div className="bg-[var(--panel)] p-3 rounded-2xl border border-[var(--line)] text-center shadow-xs">
                <span className="text-[10px] text-[var(--mute)] font-bold block">{isRTL ? 'مجموع امتیاز' : 'Total Points'}</span>
                <span className="text-xl font-black text-[var(--saffron)]">{totalPoints}</span>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-[var(--panel)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs">
              <h3 className="text-xs font-bold uppercase text-[var(--ink)] mb-2.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--lapis)]" />
                <span>{isRTL ? 'عملکرد بر تفکیک زبان‌های مسابقه:' : 'Performance by Match Language:'}</span>
              </h3>
              
              <div className="space-y-2">
                {Object.entries(languageStats).map(([langCode, stat]) => {
                  const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                  const langPct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  return (
                    <div key={langCode} className="bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlagIcon language={langCode} size={22} />
                        <div>
                          <span className="font-bold text-xs text-[var(--ink)]">{langInfo?.nativeName || langInfo?.name || langCode}</span>
                          <span className="text-[10px] text-[var(--mute)] block font-medium">
                            {isRTL ? `${stat.correct} از ${stat.total} کارت درست` : `${stat.correct} of ${stat.total} correct`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-[var(--turq)] text-white px-2.5 py-0.5 rounded-lg">
                        {langPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Missed Cards Spaced Repetition Box */}
            {missedCards.length > 0 && (
              <div className="bg-[var(--panel)] p-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-xs">
                <h3 className="text-xs font-bold uppercase text-red-500 mb-1.5 flex items-center gap-1.5">
                  <XCircle size={15} />
                  <span>{isRTL ? `کارت‌های نیازمند تمرین و مرور مجدد (${missedCards.length})` : `Cards for Review & Practice (${missedCards.length})`}</span>
                </h3>
                <p className="text-[10.5px] text-[var(--mute)] font-medium mb-2">
                  {isRTL 
                    ? 'این کارت‌ها را در بازی بعدی مرور کنید تا ملکه ذهنتان شوند:' 
                    : 'Review these cards to master them in your next session:'}
                </p>
                <div className="space-y-1.5">
                  {missedCards.map((mc, idx) => (
                    <div key={idx} className="bg-[var(--bg)] p-2 rounded-xl border border-[var(--line)] flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[var(--ink)] block">{mc.card.targetText}</span>
                        <span className="text-[10px] text-[var(--mute)]">{mc.card.translation}</span>
                      </div>
                      <span className="text-[9.5px] bg-[var(--lapis-soft)] text-[var(--lapis)] px-1.5 py-0.5 rounded font-bold font-mono">
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
              <div className="bg-[var(--panel)] p-4 rounded-2xl border border-[var(--line)] text-center text-xs font-bold text-[var(--mute)]">
                {isRTL ? 'هنوز کارتی در این مسابقه بازی نشده است.' : 'No cards played yet in this match.'}
              </div>
            ) : (
              playedCards.map((record, index) => {
                const isExpanded = expandedCardId === record.card.id || expandedCardId === String(index);

                return (
                  <div 
                    key={index} 
                    className="bg-[var(--panel)] p-2.5 rounded-xl border border-[var(--line)] shadow-xs"
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedCardId(isExpanded ? null : String(index))}
                    >
                      <div className="flex items-center gap-2">
                        {record.guessedCorrectly ? (
                          <CheckCircle2 size={18} className="text-[var(--turq)] shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-red-500 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <FlagIcon language={record.card.targetLanguage} size={15} />
                            <span className="font-bold text-xs text-[var(--ink)]">{record.card.targetText}</span>
                            <button
                              type="button"
                              title={isRTL ? "تلفظ زبان هدف" : "Target language audio"}
                              onClick={(e) => {
                                 e.stopPropagation();
                                 sound.speak(record.card.targetText, record.card.targetLanguage, { force: true });
                              }}
                              className="p-1 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] cursor-pointer"
                            >
                              <Volume2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[var(--mute)] font-medium">{record.card.translation}</span>
                            <button
                              type="button"
                              title={isRTL ? "تلفظ زبان من" : "My language audio"}
                              onClick={(e) => {
                                 e.stopPropagation();
                                 sound.speak(record.card.translation, record.card.nativeLanguage || language, { force: true });
                              }}
                              className="p-0.5 rounded-full text-[var(--mute)] cursor-pointer"
                            >
                              <Volume2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] bg-[var(--lapis-soft)] text-[var(--lapis)] px-1.5 py-0.5 rounded-md font-bold">
                          {record.card.cefrLevel}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    {/* Expanded details (Grammar & Pronunciation) */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-[var(--line)] text-[10.5px] space-y-1 bg-[var(--bg)] p-2 rounded-lg">
                        {record.card.grammarPoint && (
                          <div>
                            <span className="font-bold text-[var(--saffron)]">{isRTL ? 'نکته گرامری / الگو: ' : 'Grammar Note / Pattern: '}</span>
                            <span className="text-[var(--ink)]">{record.card.grammarPoint}</span>
                          </div>
                        )}
                        {record.card.pronunciation && (
                          <div>
                            <span className="font-bold text-[var(--turq)]">{isRTL ? 'راهنمای تلفظ: ' : 'Pronunciation Guide: '}</span>
                            <span className="text-[var(--ink)] font-mono">{record.card.pronunciation}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-[var(--mute)]">{isRTL ? 'پاسخ‌دهنده: ' : 'Answered By: '}</span>
                          <span className="text-[var(--ink)] font-bold">{record.answeringPlayerName}</span>
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
      <div className="w-full flex flex-col gap-2 shrink-0 font-ui pt-1">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setIsShareModalOpen(true);
          }}
          className="w-full py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <Share2 size={16} className="text-[var(--lapis)]" />
          <span>{language === 'fa' ? 'اشتراک‌گذاری کارنامه مسابقه 📤' : 'Share Match Scorecard 📤'}</span>
        </button>

        {/* Play Again button */}
        <button 
          type="button"
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="w-full py-3.5 text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl bg-[var(--lapis)] hover:brightness-105 text-[var(--on-lapis)] shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <RotateCcw size={18} />
          <span>{t.playAgain || t.returnMenu}</span>
          <Zap size={18} fill="currentColor" />
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
