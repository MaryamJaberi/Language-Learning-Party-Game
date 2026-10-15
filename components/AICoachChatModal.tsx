import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Bot, User, Sparkles, Zap, Brain, BookOpen, RefreshCw, Volume2 } from 'lucide-react';
import { chatWithGemini, transcribeAudioBlob, AudioRecorder, ChatMessage } from '../geminiService';
import { sound } from '../soundManager';

interface AICoachChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  learningLanguage?: string;
  guideLanguage?: string;
  isRTL?: boolean;
}

export const AICoachChatModal: React.FC<AICoachChatModalProps> = ({
  isOpen,
  onClose,
  learningLanguage = 'English',
  guideLanguage = 'Persian',
  isRTL = true,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `سلام! من مربی هوشمند و داور رسمی بازی «دور» هستم 🎮\nمی‌توانید برای رفع اختلاف حدس کلمات، تحلیل گرامر، تمرین مکالمه به زبان ${learningLanguage} یا هر سوالی از من کمک بگیرید. همچنین می‌توانید با دکمه میکروفون صدایتان را ضبط کنید تا با مدل هوش مصنوعی برایتان رونویسی شود!`,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState<'fast' | 'general' | 'complex'>('general');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || loading) return;

    sound.playClick();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Send conversation history to server-side Gemini chat
      const formattedHistory = newHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatWithGemini(
        formattedHistory,
        taskType,
        learningLanguage,
        guideLanguage
      );

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: Date.now(),
        modelUsed: res.model,
      };

      setMessages(prev => [...prev, assistantMsg]);
      sound.playSuccess();
    } catch (err: any) {
      sound.playError();
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ متاسفانه در دریافت پاسخ خطایی رخ داد: ${err.message || 'لطفاً دوباره تلاش کنید.'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Microphone toggle & audio transcription via gemini-3.5-transcribe
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      if (!recorderRef.current) return;
      setIsRecording(false);
      setIsTranscribing(true);
      sound.playClick();

      try {
        const audioBlob = await recorderRef.current.stop();
        const transcribedText = await transcribeAudioBlob(audioBlob, learningLanguage);
        if (transcribedText) {
          setInput(prev => (prev ? `${prev} ${transcribedText}` : transcribedText));
          sound.playSuccess();
        }
      } catch (err: any) {
        console.error('Audio transcription error:', err);
        sound.playError();
        alert(`خطا در رونویسی صوت: ${err.message || 'دسترسی میکروفون یا سرور بررسی شود'}`);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      sound.playClick();
      try {
        recorderRef.current = new AudioRecorder();
        await recorderRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error('Mic access error:', err);
        sound.playError();
        alert('لطفاً دسترسی به میکروفون را در مرورگر مجاز بفرمایید.');
      }
    }
  };

  const quickPrompts = [
    { label: '⚖️ داوری پاسخ در بازی', prompt: 'در دور بازی، هم‌تیمی من این پاسخ را گفت، آیا با توجه به کلمه روی کارت قابل قبول است یا باید رد شود؟' },
    { label: '💡 راهنمای گرامر و مثال', prompt: `یک توضیح کوتاه و بسیار شفاف از ساختار گرامری مهم در زبان ${learningLanguage} با ۳ مثال کاربردی بده.` },
    { label: '🗣️ مکالمه تمرینی کوتاه', prompt: `بیا یک مکالمه دونفره سریع برای سفارش غذا در رستوران به زبان ${learningLanguage} تمرین کنیم. تو شروع کن.` },
    { label: '🔥 اصطلاحات عامیانه و باحال', prompt: `۳ تا از جذاب‌ترین و به‌روزترین اصطلاحات عامیانه در زبان ${learningLanguage} با معنی فارسی برایم بگو.` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl h-[88dvh] max-h-[750px] flex flex-col bg-[#0e1428] border-2 border-[#FFE600]/40 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#15204A] via-[#1b2b63] to-[#15204A] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE600]/20 border border-[#FFE600]/60 flex items-center justify-center text-[#FFE600]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  مربی هوشمند و داور بازی دور
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE600]/20 text-[#FFE600] border border-[#FFE600]/30">
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                حل اختلاف ترجمه‌ها، تحلیل گرامر و تمرین تعاملی زبان {learningLanguage}
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

        {/* Model Speed Tabs (gemini-3.1-flash-lite / gemini-3.5-flash / gemini-3.1-pro-preview) */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-white/10 text-xs shrink-0">
          <span className="text-white/60 text-[11px] font-medium hidden sm:inline">
            سرعت و دقت مدل:
          </span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => {
                sound.playClick();
                setTaskType('fast');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                taskType === 'fast'
                  ? 'bg-[#12B5A4] text-[#0d1326] shadow'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <Zap className="w-3 h-3" />
              سریع (Flash Lite)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setTaskType('general');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                taskType === 'general'
                  ? 'bg-[#FFE600] text-[#0d1326] shadow'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <Brain className="w-3 h-3" />
              عمومی و مکالمه (3.5 Flash)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setTaskType('complex');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                taskType === 'complex'
                  ? 'bg-[#9333EA] text-white shadow'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              عمیق و گرامر (3.1 Pro)
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#FFE600]/20 border border-[#FFE600]/40 flex items-center justify-center text-[#FFE600] shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md ${
                  m.role === 'user'
                    ? 'bg-[#2347C5] text-white rounded-br-none border border-white/20'
                    : 'bg-[#15204A]/90 text-white/95 rounded-bl-none border border-white/10'
                }`}
              >
                {m.content}
                {m.modelUsed && (
                  <div className="mt-2 pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50">
                    <span>مدل: {m.modelUsed}</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#2347C5]/30 border border-[#2347C5] flex items-center justify-center text-[#2347C5] shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#FFE600]/20 border border-[#FFE600]/40 flex items-center justify-center text-[#FFE600] shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#15204A]/70 text-xs text-white/70 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFE600] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#FFE600] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#FFE600] animate-bounce [animation-delay:0.4s]" />
                <span>مربی در حال اندیشیدن و تدوین پاسخ...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-black/40 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp.prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-[11px] text-white/80 border border-white/10 transition-all"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Transcribing Indicator */}
        {isTranscribing && (
          <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center gap-2 border-t border-emerald-500/30 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            در حال رونویسی صدای شما با مدل gemini-3.5-transcribe...
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-[#0d1326] border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button (Audio Transcription via gemini-3.5-transcribe) */}
            <button
              type="button"
              onClick={handleToggleRecording}
              disabled={loading || isTranscribing}
              title={isRecording ? 'توقف ضبط' : 'صحبت با میکروفون (رونویسی با هوش مصنوعی)'}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-600/40'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? '🎙️ در حال ضبط صدایتان... دوباره کلیک کنید تا تمام شود' : 'از مربی هوشمند بپرسید یا واژه‌ای را ترجمه و داوری کنید...'}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#15204A]/60 border border-white/20 text-white text-xs sm:text-sm focus:border-[#FFE600] outline-none transition-colors"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#FFE600] to-amber-500 text-[#0d1326] font-bold hover:brightness-110 disabled:opacity-40 transition-all shadow flex items-center justify-center"
              aria-label="ارسال"
            >
              <Send className="w-5 h-5 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
