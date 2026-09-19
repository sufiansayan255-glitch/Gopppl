import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  Download,
  Filter,
  Trash2,
  Volume2,
  VolumeX,
  Send,
  ArrowUpRight
} from 'lucide-react';
import { AppLanguage, SummaryReport, ChatMessage } from '../types';
import { TopicTimelineChart } from './TopicTimelineChart';

interface CommentReaderProps {
  language: AppLanguage;
  theme?: 'light' | 'dark';
  initialText?: string;
}

interface ParsedComment {
  id: number;
  user?: string;
  commentBody: string;
  text: string;
  type: 'positive' | 'negative' | 'question' | 'neutral';
  keywordsMatched: string[];
}

const POS_WORDS = [
  'good', 'nice', 'best', 'zabardast', 'acha', 'accha', 'awesome', 'great', 'love', 'superb',
  'shandar', 'khoob', 'maza', 'pasand', 'kamal', 'favorite', 'useful', 'helpful', 'behtareen',
  'اچھا', 'زبردست', 'بہترین', 'شاندار', 'پسند', 'کمال', 'عمدہ', 'خوبصورت', 'شکریہ', 'مفید'
];

const NEG_WORDS = [
  'bura', 'faltu', 'bekar', 'bad', 'hate', 'trash', 'stupid', 'ghatiya', 'worst', 'poor', 'slow',
  'problem', 'issue', 'masla', 'kharab', 'bakwas', 'waste', 'cheat', 'scam', 'terrible', 'ganda',
  'برا', 'فضول', 'بیکار', 'خراب', 'بکواس', 'مسئلہ', 'نقصان', 'دھوکہ', 'گھٹیا', 'مایوس'
];

const QUESTION_INDICATORS = [
  '?', '؟', 'kia', 'kya', 'kyun', 'kyu', 'kaise', 'kese', 'kab', 'kahan', 'kitna', 'price',
  'how', 'why', 'what', 'when', 'where', 'who', 'which', 'is there', 'can i', 'please tell', 'sach',
  'کیا', 'کیوں', 'کیسے', 'کہاں', 'کب', 'کتنا', 'قیمت', 'بتائیں', 'رہنمائی', 'سچ'
];

export const CommentReader: React.FC<CommentReaderProps> = ({ language, theme = 'dark', initialText }) => {
  const [platform, setPlatform] = useState<string>('YouTube');
  const [commentText, setCommentText] = useState<string>(
    initialText !== undefined
      ? initialText
      : `Ali: Yeh video bohat baki faltu hai bad\n` +
        `Ahmed: Amazing video, love it!\n` +
        `Raza: Kya yeh sach hai?\n` +
        `Fatima: Zabardast tutorial, bohot faida hua!\n` +
        `Usman: Delivery timing bohot kharab aur late thi\n` +
        `Ayesha: Iski price kitni hai aur kahan se milega?`
  );

  // Update if initialText changes
  React.useEffect(() => {
    if (initialText !== undefined && initialText !== '') {
      setCommentText(initialText);
    }
  }, [initialText]);

  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative' | 'question' | 'neutral'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Deep AI Analysis State
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<SummaryReport | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  // Chat Q&A State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const isUrdu = language === 'ur';
  const isDark = theme === 'dark';

  // Fast Client-Side Comment Parsing & User Tracking
  const analysis = useMemo(() => {
    if (!commentText.trim()) {
      return {
        total: 0,
        positive: 0,
        negative: 0,
        questions: 0,
        neutral: 0,
        posUsers: {} as Record<string, number>,
        negUsers: {} as Record<string, number>,
        quesUsers: {} as Record<string, number>,
        parsedList: [] as ParsedComment[]
      };
    }

    const rawLines = commentText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let posCount = 0;
    let negCount = 0;
    let quesCount = 0;
    let neutralCount = 0;

    const posUsers: Record<string, number> = {};
    const negUsers: Record<string, number> = {};
    const quesUsers: Record<string, number> = {};

    const parsedList: ParsedComment[] = rawLines.map((line, index) => {
      let user: string | undefined;
      let commentBody = line;

      if (line.includes(':')) {
        const parts = line.split(':');
        user = parts[0].trim();
        commentBody = parts.slice(1).join(':').trim();
      }

      const lower = commentBody.toLowerCase();
      const matchedWords: string[] = [];

      const isQues = QUESTION_INDICATORS.some((w) => {
        if (lower.includes(w)) {
          matchedWords.push(w);
          return true;
        }
        return false;
      });

      const isNeg = NEG_WORDS.some((w) => {
        if (lower.includes(w)) {
          matchedWords.push(w);
          return true;
        }
        return false;
      });

      const isPos = POS_WORDS.some((w) => {
        if (lower.includes(w)) {
          matchedWords.push(w);
          return true;
        }
        return false;
      });

      let type: 'positive' | 'negative' | 'question' | 'neutral' = 'neutral';
      if (isQues) {
        type = 'question';
        quesCount++;
        if (user) {
          quesUsers[user] = (quesUsers[user] || 0) + 1;
        }
      } else if (isNeg) {
        type = 'negative';
        negCount++;
        if (user) {
          negUsers[user] = (negUsers[user] || 0) + 1;
        }
      } else if (isPos) {
        type = 'positive';
        posCount++;
        if (user) {
          posUsers[user] = (posUsers[user] || 0) + 1;
        }
      } else {
        neutralCount++;
      }

      return {
        id: index + 1,
        user,
        commentBody,
        text: line,
        type,
        keywordsMatched: matchedWords
      };
    });

    return {
      total: rawLines.length,
      positive: posCount,
      negative: negCount,
      questions: quesCount,
      neutral: neutralCount,
      posUsers,
      negUsers,
      quesUsers,
      parsedList
    };
  }, [commentText]);

  const handleAnalyzeClick = () => {
    setHasAnalyzed(true);
  };

  const handleRunAiAnalysis = async () => {
    if (!commentText.trim()) return;

    setIsAiLoading(true);
    setChatMessages([]);
    setCompletedActions({});

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commentText,
          language
        })
      });

      if (!res.ok) throw new Error('AI analysis error');
      const data: SummaryReport = await res.json();
      setAiReport(data);
    } catch (err) {
      console.error('Failed to run AI comment analysis:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window) || !aiReport) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${aiReport.executiveSummary}. Key demands: ${aiReport.topDemands.map((d) => d.demand).join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSendChat = async (presetQuestion?: string) => {
    const query = presetQuestion || chatInput;
    if (!query.trim() || !commentText.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetQuestion) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commentText,
          question: query,
          language,
          history: chatMessages.map((m) => ({ role: m.role, text: m.text }))
        })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.answer || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyResults = () => {
    const lines = [
      `🗣️ COMMENT READER ANALYSIS:`,
      `• Total Comments: ${analysis.total}`,
      `• Positive (مثبت): ${analysis.positive}`,
      `• Negative (منفی): ${analysis.negative}`,
      `• Questions (سوالیہ): ${analysis.questions}`,
      `• Neutral: ${analysis.neutral}`,
      ``,
      `--- COMMENT BREAKDOWN ---`,
      ...analysis.parsedList.map((c) => `[${c.type.toUpperCase()}] ${c.text}`)
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredComments = analysis.parsedList.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  return (
    <div id="comment-reader-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Platform Selector Row */}
      <div className="space-y-1.5">
        <label
          htmlFor="platformSelect"
          className={`text-xs font-semibold flex items-center gap-2 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          <MessageSquare className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span>{isUrdu ? 'پلیٹ فارم منتخب کریں:' : 'Select Social Platform:'}</span>
        </label>
        <select
          id="platformSelect"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={`w-full py-2.5 px-3.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${
            isDark
              ? 'bg-[#0f172a] border-[#334155] text-slate-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <option value="YouTube">YouTube</option>
          <option value="Facebook">Facebook</option>
          <option value="Dailymotion">Dailymotion</option>
          <option value="Other">Other Platform</option>
        </select>
      </div>

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label
          htmlFor="commentArea"
          className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          {isUrdu
            ? 'کمنٹس اس طرح درج کریں (نام: کمنٹ):'
            : 'Enter Comments (Format: Name: Comment or text):'}
        </label>
        <span
          className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          {analysis.total} {isUrdu ? 'کل کمنٹس' : 'Comments Loaded'}
        </span>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="commentArea"
          data-id="commentInput"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={`مثال کے طور پر:
Ali: Yeh video bohat baki faltu hai bad
Ahmed: Amazing video, love it!
Raza: Kya yeh sach hai?`}
          rows={6}
          className={`w-full border rounded-xl p-4 text-sm font-arabic transition-all resize-y leading-relaxed focus:outline-none focus:ring-2 ${
            isUrdu ? 'urdu-text' : ''
          } ${
            isDark
              ? 'bg-[#1a1a1a] border-[#262626] focus:border-blue-500 text-slate-100 placeholder:text-slate-500 focus:ring-blue-500/20'
              : 'bg-[#f1f5f9] border-[#e2e8f0] focus:border-blue-600 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500/20'
          }`}
        />
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Fast Instant Client-Side Analyze Button */}
        <button
          id="analyze-comments-btn"
          onClick={handleAnalyzeClick}
          className={`btn btn-action py-3 px-4 font-bold rounded-xl text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isDark
              ? 'bg-[#3b82f6] hover:bg-[#2563eb] shadow-blue-500/20'
              : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-blue-600/20'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{isUrdu ? 'تفصیلی تجزیہ کریں (Analyze)' : 'تفصیلی تجزیہ کریں (Analyze)'}</span>
        </button>

        {/* Deep AI Intelligence Button */}
        <button
          id="deep-ai-comments-btn"
          onClick={handleRunAiAnalysis}
          disabled={isAiLoading || !commentText.trim()}
          className={`py-3 px-4 font-bold rounded-xl text-xs sm:text-sm border flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-900/80 hover:to-purple-900/80 border-indigo-700/50 text-indigo-200'
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 text-indigo-700 shadow-sm'
          }`}
        >
          {isAiLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isUrdu ? 'AI خلاصہ تیار ہو رہا ہے...' : 'Generating Deep AI Insights...'}</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>{isUrdu ? '⚡ مکمل AI انٹیلی جنس خلاصہ' : '⚡ Deep AI Intelligence Report'}</span>
            </>
          )}
        </button>
      </div>

      {/* Instant Result Box (Matching the exact output specified in request) */}
      {hasAnalyzed && (
        <div
          id="analysisOutput"
          data-id="analysisResult"
          className={`result result-box border-l-4 border-l-blue-500 border rounded-xl p-4 sm:p-5 space-y-4 transition-all duration-300 ${
            isUrdu ? 'urdu-text' : ''
          } ${
            isDark
              ? 'bg-[#0f172a] border-[#334155] text-slate-100'
              : 'bg-[#eef2ff] border-blue-200 text-[#1e1b4b]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-current/10">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span>📊</span>
              <span>{`📊 پلیٹ فارم: ${platform} کا تفصیلی تجزیہ`}</span>
            </h3>
            <button
              onClick={handleCopyResults}
              className="text-xs px-2.5 py-1 rounded-lg border border-current/20 flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>

          {/* User Tracker Detailed Breakdown (Negative / Positive / Questions) */}
          <div className={`p-4 rounded-xl border leading-relaxed text-xs sm:text-sm space-y-3 font-sans ${
            isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-blue-100'
          }`}>
            {/* Negative Users */}
            <div>
              <div className="font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                <span>❌</span>
                <span>منفی کمنٹس اور گالیاں دینے والے صارفین:</span>
              </div>
              <div className="mt-1 pl-4 space-y-1 text-slate-300 dark:text-slate-300">
                {Object.keys(analysis.negUsers).length === 0 ? (
                  <span className="text-slate-400">کوئی منفی کمنٹ نہیں ملا۔</span>
                ) : (
                  Object.keys(analysis.negUsers).map((u) => (
                    <div key={u} className="flex items-center gap-1">
                      <span>-</span>
                      <b className="text-rose-400">{u}</b>
                      <span>نے</span>
                      <b>{analysis.negUsers[u]}</b>
                      <span>بار منفی کمنٹ کیا ہے۔</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Positive Users */}
            <div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span>✅</span>
                <span>مثبت (پازیٹو) کمنٹس کرنے والے صارفین:</span>
              </div>
              <div className="mt-1 pl-4 space-y-1 text-slate-300 dark:text-slate-300">
                {Object.keys(analysis.posUsers).length === 0 ? (
                  <span className="text-slate-400">کوئی مثبت کمنٹ نہیں ملا۔</span>
                ) : (
                  Object.keys(analysis.posUsers).map((u) => (
                    <div key={u} className="flex items-center gap-1">
                      <span>-</span>
                      <b className="text-emerald-400">{u}</b>
                      <span>نے</span>
                      <b>{analysis.posUsers[u]}</b>
                      <span>بار تعریف کی ہے۔</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Question Users */}
            <div>
              <div className="font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                <span>❓</span>
                <span>سوالات پوچھنے والے صارفین:</span>
              </div>
              <div className="mt-1 pl-4 space-y-1 text-slate-300 dark:text-slate-300">
                {Object.keys(analysis.quesUsers).length === 0 ? (
                  <span className="text-slate-400">کوئی سوال نہیں ملا۔</span>
                ) : (
                  Object.keys(analysis.quesUsers).map((u) => (
                    <div key={u} className="flex items-center gap-1">
                      <span>-</span>
                      <b className="text-amber-400">{u}</b>
                      <span>نے</span>
                      <b>{analysis.quesUsers[u]}</b>
                      <span>بار سوال پوچھا ہے۔</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Core Metric Counters (Positive / Negative / Questions) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Positive */}
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#121212] border-emerald-900/40' : 'bg-white border-emerald-200'
            }`}>
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                <span>{isUrdu ? 'مثبت' : 'Positive'}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {analysis.positive}
              </div>
              <span className="text-[10px] text-slate-500">
                {analysis.total ? Math.round((analysis.positive / analysis.total) * 100) : 0}% of comments
              </span>
            </div>

            {/* Negative */}
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#121212] border-rose-900/40' : 'bg-white border-rose-200'
            }`}>
              <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">
                <span>{isUrdu ? 'منفی' : 'Negative'}</span>
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {analysis.negative}
              </div>
              <span className="text-[10px] text-slate-500">
                {analysis.total ? Math.round((analysis.negative / analysis.total) * 100) : 0}% of comments
              </span>
            </div>

            {/* Questions */}
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#121212] border-amber-900/40' : 'bg-white border-amber-200'
            }`}>
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
                <span>{isUrdu ? 'سوالیہ' : 'Questions'}</span>
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {analysis.questions}
              </div>
              <span className="text-[10px] text-slate-500">
                {analysis.total ? Math.round((analysis.questions / analysis.total) * 100) : 0}% inquiries
              </span>
            </div>

            {/* Total / Neutral */}
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#121212] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                <span>{isUrdu ? 'کل تعداد' : 'Total'}</span>
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">
                {analysis.total}
              </div>
              <span className="text-[10px] text-slate-500">
                {analysis.neutral} Neutral
              </span>
            </div>
          </div>

          {/* Filter Pills for Comment Lines */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {(['all', 'positive', 'negative', 'question', 'neutral'] as const).map((type) => {
              const isActive = filterType === type;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? isDark
                        ? 'bg-blue-950 border-blue-500 text-blue-300'
                        : 'bg-blue-600 border-blue-600 text-white'
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'all' && 'All'}
                  {type === 'positive' && `Positive (${analysis.positive})`}
                  {type === 'negative' && `Negative (${analysis.negative})`}
                  {type === 'question' && `Questions (${analysis.questions})`}
                  {type === 'neutral' && `Neutral (${analysis.neutral})`}
                </button>
              );
            })}
          </div>

          {/* Classified Line-by-Line List */}
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {filteredComments.map((item) => (
              <div
                key={item.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors ${
                  item.type === 'positive'
                    ? isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : item.type === 'negative'
                    ? isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' : 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : item.type === 'question'
                    ? isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-slate-500 mt-0.5">#{item.id}</span>
                  <p className="font-medium leading-relaxed break-words">{item.text}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 ${
                    item.type === 'positive'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : item.type === 'negative'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                      : item.type === 'question'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-500/20 text-slate-500'
                  }`}
                >
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep AI Intelligence Report Section */}
      {aiReport && (
        <div className="space-y-5 pt-4 animate-in fade-in duration-300">
          {/* Top Toolbar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {aiReport.sentimentToneLabel} • {aiReport.totalItemsAnalyzed || analysis.total}{' '}
                {isUrdu ? 'کمنٹس کا مکمل AI خلاصہ' : 'comments AI decoded'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {'speechSynthesis' in window && (
                <button
                  onClick={handleToggleSpeech}
                  title={isSpeaking ? 'Stop Audio' : 'Listen'}
                  className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                    isSpeaking
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-500'
                      : isDark
                      ? 'bg-[#1a1a1a] border-[#262626] text-slate-300 hover:text-white'
                      : 'bg-white border-[#e2e8f0] text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* SECTION 1: 📌 EXECUTIVE SUMMARY */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 shadow-xl transition-colors ${
              isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-white border-[#e2e8f0]'
            }`}
          >
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <span>📌</span>
              <span>{isUrdu ? 'مرکزی خلاصہ (EXECUTIVE SUMMARY)' : 'EXECUTIVE SUMMARY'}</span>
            </h2>
            <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {aiReport.executiveSummary}
            </p>
          </div>

          {/* TOPIC FREQUENCY OVER CONVERSATION LENGTH */}
          {aiReport.topicTimeline && aiReport.topicTimeline.length > 0 && (
            <TopicTimelineChart
              timeline={aiReport.topicTimeline}
              topics={aiReport.commonTopics}
              language={language}
              theme={theme}
            />
          )}

          {/* SECTION 3: 🔥 TOP DEMANDS & REQUESTS */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 shadow-xl transition-colors ${
              isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-white border-[#e2e8f0]'
            }`}
          >
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <span>🔥</span>
              <span>{isUrdu ? 'اہم فرمائشیں و مطالبات (TOP DEMANDS & REQUESTS)' : 'TOP DEMANDS & REQUESTS'}</span>
            </h2>
            <div className="space-y-2.5">
              {aiReport.topDemands.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start justify-between gap-3 border p-3.5 rounded-xl transition-colors ${
                    isDark
                      ? 'bg-[#121212] border-[#262626] hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center border mt-0.5 ${
                      isDark
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.demand}</p>
                      <span className={`text-xs mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.category}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.urgency.toLowerCase().includes('high')
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {item.urgency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: 💡 ACTIONABLE NEXT STEPS */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 shadow-xl transition-colors ${
              isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-white border-[#e2e8f0]'
            }`}
          >
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <span>💡</span>
              <span>{isUrdu ? 'فوری لائحہ عمل (ACTIONABLE NEXT STEPS)' : 'ACTIONABLE NEXT STEPS'}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* High Priority Tasks */}
              <div className={`border p-4 rounded-xl ${
                isDark ? 'bg-[#121212] border-rose-950/40' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {isUrdu ? 'فوری ترجیح (High Priority):' : 'High Priority (Immediate):'}
                </span>
                <div className="space-y-2.5">
                  {aiReport.actionableNextSteps.highPriority.map((action, idx) => {
                    const key = `high-${idx}`;
                    const isDone = !!completedActions[key];
                    return (
                      <div
                        key={key}
                        onClick={() => setCompletedActions((p) => ({ ...p, [key]: !p[key] }))}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60'
                            : isDark
                            ? 'bg-slate-900/60 border-[#262626] hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="mt-1 h-3.5 w-3.5 rounded border-slate-400 accent-blue-600 cursor-pointer"
                        />
                        <p
                          className={`text-xs font-medium leading-relaxed ${
                            isDone
                              ? 'line-through text-slate-400'
                              : isDark
                              ? 'text-slate-200'
                              : 'text-slate-800'
                          }`}
                        >
                          {action.task}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Low Priority / Secondary Tasks */}
              <div className={`border p-4 rounded-xl ${
                isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-xs font-bold uppercase tracking-wider block mb-3 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {isUrdu ? 'ثانوی ترجیح (Low Priority / Future):' : 'Secondary & Future Planning:'}
                </span>
                <div className="space-y-2.5">
                  {aiReport.actionableNextSteps.lowPriority.map((action, idx) => {
                    const key = `low-${idx}`;
                    const isDone = !!completedActions[key];
                    return (
                      <div
                        key={key}
                        onClick={() => setCompletedActions((p) => ({ ...p, [key]: !p[key] }))}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60'
                            : isDark
                            ? 'bg-slate-900/60 border-[#262626] hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="mt-1 h-3.5 w-3.5 rounded border-slate-400 accent-blue-600 cursor-pointer"
                        />
                        <p
                          className={`text-xs font-medium leading-relaxed ${
                            isDone
                              ? 'line-through text-slate-400'
                              : isDark
                              ? 'text-slate-300'
                              : 'text-slate-700'
                          }`}
                        >
                          {action.task}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Q&A Chat */}
          <div
            className={`border rounded-2xl p-5 sm:p-6 shadow-xl transition-colors ${
              isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-white border-[#e2e8f0]'
            }`}
          >
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <MessageSquare className="w-4 h-4" />
              <span>{isUrdu ? 'کمنٹس کے بارے میں سوال پوچھیں (Interactive Q&A)' : 'Ask Anything About These Comments'}</span>
            </h2>

            {/* Preset Query Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                isUrdu ? 'لوگوں کا سب سے بڑا گلہ یا مسئلہ کیا ہے؟' : 'What is the biggest user complaint?',
                isUrdu ? 'کس چیز کی تعریف سب سے زیادہ کی گئی؟' : 'What was praised the most?',
                isUrdu ? 'کسٹمر سپورٹ کے لیے کیا تجاویز ہیں؟' : 'Give 3 takeaways for customer support'
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(query)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-[#121212] hover:bg-slate-800 border-[#262626] text-blue-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-blue-700'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{query}</span>
                </button>
              ))}
            </div>

            {/* Chat History */}
            {chatMessages.length > 0 && (
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pe-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : isDark
                          ? 'bg-[#121212] border border-[#262626] text-slate-200 rounded-bl-none'
                          : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>{isUrdu ? 'جواب تلاش کیا جا رہا ہے...' : 'Analyzing transcript...'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={
                  isUrdu
                    ? 'ان کمنٹس کے حوالے سے سوال پوچھیں...'
                    : 'Ask a specific question about these comments...'
                }
                className={`flex-1 border rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-[#121212] border-[#262626] focus:border-blue-500 text-slate-100 focus:ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 focus:border-blue-600 text-slate-800 focus:ring-blue-500/20'
                }`}
              />
              <button
                onClick={() => handleSendChat()}
                disabled={isChatLoading || !chatInput.trim()}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white transition-colors cursor-pointer disabled:opacity-50 ${
                  isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
