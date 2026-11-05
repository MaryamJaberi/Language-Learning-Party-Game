import React, { useState, useMemo } from 'react';
import { LanguageCard } from '../types';
import { getFocusPhrase, measureCard, shouldAutoTTS } from '../cardPacing';
import { isRtlLang } from '../ui';
import { Volume2 } from 'lucide-react';
import { sound } from '../soundManager';

interface Props {
  card: LanguageCard;
  isReverse?: boolean;
  onPlayFullAudio?: () => void;
  className?: string;
}

export const CardPacingSentence: React.FC<Props> = ({
  card,
  isReverse = false,
  onPlayFullAudio,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const textToDisplay = isReverse
    ? (card.translation || card.targetText || '')
    : (card.targetText || card.translation || '');

  const langToDisplay = isReverse
    ? (card.nativeLanguage || 'fa')
    : (card.targetLanguage || 'en');

  const isRTL = isRtlLang(langToDisplay);
  const measurement = card.measured || measureCard(card, langToDisplay, isReverse);
  const focus = getFocusPhrase(card, langToDisplay);
  const autoPlayAllowed = shouldAutoTTS(measurement.readSec, !!focus);

  // Split sentence around verbatim focus phrase
  const parts = useMemo(() => {
    if (!focus || !textToDisplay.includes(focus)) {
      return null;
    }
    const idx = textToDisplay.indexOf(focus);
    const before = textToDisplay.slice(0, idx);
    const matchedFocus = textToDisplay.slice(idx, idx + focus.length);
    const after = textToDisplay.slice(idx + focus.length);

    // If not expanded and text is long, truncate context with … without ever touching focus
    if (!isExpanded && textToDisplay.length > 70) {
      const truncatedBefore = before.length > 25 ? '…' + before.slice(-25) : before;
      const truncatedAfter = after.length > 25 ? after.slice(0, 25) + '…' : after;
      return {
        before: truncatedBefore,
        focus: matchedFocus,
        after: truncatedAfter,
        isTruncated: truncatedBefore !== before || truncatedAfter !== after
      };
    }

    return {
      before,
      focus: matchedFocus,
      after,
      isTruncated: false
    };
  }, [textToDisplay, focus, isExpanded]);

  const handleCardTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayFullAudio) {
      onPlayFullAudio();
    } else {
      sound.speak(textToDisplay, langToDisplay, { force: true });
    }
  };

  // Auto font-scale: scale down to 80% minimum for longer texts
  const fontSizeStyle: React.CSSProperties = useMemo(() => {
    if (measurement.units > 18) {
      return { fontSize: '80%' };
    }
    if (measurement.units > 12) {
      return { fontSize: '88%' };
    }
    return {};
  }, [measurement.units]);

  return (
    <div 
      className={`relative flex items-center justify-center gap-2 max-w-full select-none cursor-pointer group ${className}`}
      onClick={handleCardTap}
      title="برای شنیدن تلفظ کامل جمله ضربه بزنید"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div 
        style={fontSizeStyle}
        className="card-target-word max-w-full font-extrabold font-card-word tracking-tight leading-snug text-[var(--ink)] break-words line-clamp-3 text-center transition-all"
      >
        {parts ? (
          <>
            <span className="opacity-50 transition-opacity group-hover:opacity-75">
              {parts.before}
            </span>
            <span className="font-black text-[var(--ink)] dark:text-white px-1 underline decoration-[var(--turq)] decoration-2 rounded-sm bg-[var(--turq)]/10">
              {parts.focus}
            </span>
            <span className="opacity-50 transition-opacity group-hover:opacity-75">
              {parts.after}
            </span>
            {parts.isTruncated && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(prev => !prev);
                }}
                className="inline-block ml-1 text-xs text-[var(--turq)] font-bold underline"
              >
                (بیشتر)
              </button>
            )}
          </>
        ) : (
          <span>{textToDisplay}</span>
        )}
      </div>

      {/* Manual play button if readSec > 4 and no focus (rule 5) */}
      {(!autoPlayAllowed || parts) && (
        <button
          type="button"
          aria-label="پخش تلفظ صوتی"
          title="پخش تلفظ صوتی"
          onClick={(e) => {
            e.stopPropagation();
            sound.playClick();
            if (parts?.focus) {
              sound.speakTargetPhrase(parts.focus, langToDisplay);
            } else {
              sound.speakTargetPhrase(textToDisplay, langToDisplay);
            }
          }}
          className="p-2 bg-[var(--turq)] hover:brightness-105 text-white rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Volume2 size={16} />
        </button>
      )}
    </div>
  );
};
