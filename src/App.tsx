/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Zap,
  Sparkles,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Upload,
  BarChart3,
  Flame,
  Lightbulb,
  MessageSquare,
  Volume2,
  VolumeX,
  Send,
  CheckCircle2,
  FileText,
  HelpCircle,
  ArrowUpRight,
  Sun,
  Moon,
  ListTodo,
  KeyRound,
  Image as ImageIcon,
  Clock,
  AlignLeft,
  FileCode,
  Mic,
  FileJson,
  QrCode
} from 'lucide-react';
import { SAMPLE_DATASETS, SampleDataset } from './data/sampleDatasets';
import { SummaryReport, AppLanguage, ChatMessage } from './types';
import { TopicTimelineChart } from './components/TopicTimelineChart';
import { ImageConverter } from './components/ImageConverter';
import { TaskManager } from './components/TaskManager';
import { PasswordGenerator } from './components/PasswordGenerator';
import { CommentReader } from './components/CommentReader';
import { VoiceDictation } from './components/VoiceDictation';
import { JsonFormatter } from './components/JsonFormatter';
import { QrGenerator } from './components/QrGenerator';

type ActiveTabType = 'analyzer' | 'json' | 'qr' | 'voice' | 'tasks' | 'password' | 'converter' | 'summarizer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('analyzer');
  const [commentDraftText, setCommentDraftText] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('sparkflow_theme');
      return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [inputText, setInputText] = useState<string>('');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Completed Action Steps Tracking
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  // Interactive Transcript Q&A Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Set document direction locked to LTR for stable UI layout across languages
  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language === 'ur' ? 'ur' : language === 'roman_ur' ? 'ur-Latn' : 'en';
  }, [language]);

  // Sync theme attribute to document and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('sparkflow_theme', theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  }, [theme]);

  // Live text metrics calculation
  const textStats = useMemo(() => {
    const trimmed = inputText.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const charsWithSpaces = inputText.length;
    const charsWithoutSpaces = inputText.replace(/\s/g, '').length;
    const lines = trimmed ? inputText.split('\n').filter((l) => l.trim()).length : 0;
    const sentences = trimmed ? (inputText.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmed]).length : 0;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      lines,
      sentences,
      readingTimeMinutes
    };
  }, [inputText]);

  // Handle Speech Synthesis
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window) || !report) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${report.executiveSummary}. Key demands: ${report.topDemands.map((d) => d.demand).join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Main Generation Action
  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setChatMessages([]);
    setCompletedActions({});

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: SummaryReport = await response.json();
      setReport(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to summarize:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy structured report with EXACT requested headers
  const handleCopyReport = () => {
    if (!report) return;

    const lines = [
      `📌 EXECUTIVE SUMMARY:`,
      report.executiveSummary,
      ``,
      `📊 SENTIMENT & MOOD BREAKDOWN:`,
      `• Positive: ${report.sentiment.positive}%`,
      `• Inquiries: ${report.sentiment.inquiries}%`,
      `• Critical: ${report.sentiment.critical}%`,
      `• Neutral: ${report.sentiment.neutral}%`,
      `• Mood Note: ${report.sentiment.explanation}`,
      ``,
      `🔥 TOP DEMANDS & REQUESTS:`,
      ...report.topDemands.map((d, i) => `${i + 1}. [${d.category}] ${d.demand} (Urgency: ${d.urgency})`),
      ``,
      `💡 ACTIONABLE NEXT STEPS:`,
      `[High Priority]:`,
      ...report.actionableNextSteps.highPriority.map((a, i) => `  ${i + 1}. ${a.task}`),
      `[Low Priority]:`,
      ...report.actionableNextSteps.lowPriority.map((a, i) => `  ${i + 1}. ${a.task}`),
      ``,
      `💬 TOP USER QUOTES:`,
      ...report.topUserQuotes.map((q) => `• "${q.quote}" — ${q.speaker || 'User'}`),
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export JSON Report
  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sparkflow-intelligence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setReport(null);
      }
    };
    reader.readAsText(file);
  };

  // Interactive follow-up question
  const handleSendChat = async (presetQuestion?: string) => {
    const query = presetQuestion || chatInput;
    if (!query.trim() || !inputText.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetQuestion) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          question: query,
          language,
          history: chatMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.answer || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const isUrdu = language === 'ur';
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col items-center px-4 sm:px-8 py-8 transition-colors duration-200 ${
        isDark
          ? 'bg-[#050505] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200'
          : 'bg-[#f8fafc] text-slate-800 selection:bg-blue-100 selection:text-blue-900'
      }`}
    >
      {/* Main Container */}
      <div
        className={`w-full max-w-[950px] border rounded-[20px] p-6 sm:p-8 shadow-2xl transition-all ${
          isDark
            ? 'bg-[#121212] border-[#262626] shadow-black/80'
            : 'bg-white border-[#e2e8f0] shadow-slate-200/60'
        }`}
      >
        {/* Header */}
        <header
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b transition-colors ${
            isDark ? 'border-[#262626]' : 'border-[#e2e8f0]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-2xl border flex items-center justify-center shadow-lg transition-all ${
                isDark
                  ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400 shadow-blue-500/10'
                  : 'bg-blue-50 border-blue-200 text-blue-600 shadow-blue-500/5'
              }`}
            >
              <Zap className={`w-6 h-6 ${isDark ? 'fill-blue-400 text-blue-400' : 'fill-blue-600 text-blue-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-xl sm:text-2xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  SparkFlow Ultimate Suite v2
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    isDark
                      ? 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  v2 PRO
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                {isUrdu
                  ? 'سمارٹ لوکل پروڈکٹیوٹی اور میڈیا ٹول کٹ (100% پرائیویٹ اور محفوظ)'
                  : 'Smart Local Productivity & Media Toolkit'}
              </p>
            </div>
          </div>

          {/* Header Controls: Language Select & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Language Select Dropdown */}
            <select
              id="langChoice"
              value={language === 'ur' ? 'Urdu' : language === 'roman_ur' ? 'Roman Urdu' : 'English'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Urdu') setLanguage('ur');
                else if (val === 'Roman Urdu') setLanguage('roman_ur');
                else setLanguage('en');
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border outline-none cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#1a1a1a] border-[#262626] text-[#e2e8f0] focus:border-blue-500'
                  : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#334155] focus:border-blue-600'
              }`}
            >
              <option value="English">English</option>
              <option value="Roman Urdu">Roman Urdu</option>
              <option value="Urdu">اردو (Urdu)</option>
            </select>

            {/* Theme Toggle Button */}
            <button
              id="themeToggleBtn"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer text-base transition-all ${
                isDark
                  ? 'bg-[#1a1a1a] border-[#262626] text-amber-400 hover:text-white hover:border-slate-600 shadow-sm'
                  : 'bg-[#f1f5f9] border-[#e2e8f0] text-blue-600 hover:text-slate-900 hover:border-slate-300 shadow-sm'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Tab Navigation Navigation Bar */}
        <div
          className={`tab-bar tabs flex items-center gap-2 pb-3 mb-6 border-b overflow-x-auto transition-colors ${
            isDark ? 'border-[#262626]' : 'border-[#e2e8f0]'
          }`}
        >
          <button
            id="tab-analyzer"
            onClick={() => setActiveTab('analyzer')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analyzer'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isUrdu ? '🗣️ کمنٹ اینالائزر' : '🗣️ Comment Reader'}</span>
          </button>

          <button
            id="tab-json"
            onClick={() => setActiveTab('json')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'json'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>{isUrdu ? '🛠️ JSON فارمیٹر' : '🛠️ JSON Formatter'}</span>
          </button>

          <button
            id="tab-qr"
            onClick={() => setActiveTab('qr')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'qr'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{isUrdu ? '📱 QR جنریٹر' : '📱 QR Generator'}</span>
          </button>

          <button
            id="tab-voice"
            onClick={() => setActiveTab('voice')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'voice'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isUrdu ? '🎙️ وائس ٹو ٹیکسٹ' : '🎙️ Voice to Text'}</span>
          </button>

          <button
            id="tab-tasks"
            onClick={() => setActiveTab('tasks')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>{isUrdu ? '📋 ٹاسکس' : '📋 Tasks'}</span>
          </button>

          <button
            id="tab-password"
            onClick={() => setActiveTab('password')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'password'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{isUrdu ? '🔑 پاس ورڈ' : '🔑 Pass Gen'}</span>
          </button>

          <button
            id="tab-converter"
            onClick={() => setActiveTab('converter')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'converter'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{isUrdu ? '🖼️ امیج کنورٹر' : '🖼️ Img Converter'}</span>
          </button>

          <button
            id="tab-summarizer"
            onClick={() => setActiveTab('summarizer')}
            className={`tab-btn px-3.5 sm:px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'summarizer'
                ? isDark
                  ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-500/20 active'
                  : 'bg-[#2563eb] text-white shadow-md shadow-blue-600/20 active'
                : isDark
                ? 'bg-[#1a1a1a] border border-[#262626] text-[#94a3b8] hover:text-white'
                : 'bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isUrdu ? '💬 ٹیکسٹ انالیٹکس' : '💬 Text Stats'}</span>
          </button>
        </div>

        {/* Panel 1: Comment Reader Panel */}
        {activeTab === 'analyzer' && (
          <div id="analyzer" className="panel section-panel active">
            <CommentReader
              language={language}
              theme={theme}
              initialText={commentDraftText}
            />
          </div>
        )}

        {/* Panel: JSON Formatter Panel */}
        {activeTab === 'json' && (
          <div id="json" className="panel section-panel active">
            <JsonFormatter language={language} theme={theme} />
          </div>
        )}

        {/* Panel: QR Generator Panel */}
        {activeTab === 'qr' && (
          <div id="qr" className="panel section-panel active">
            <QrGenerator language={language} theme={theme} />
          </div>
        )}

        {/* Panel 2: Voice Dictation Panel */}
        {activeTab === 'voice' && (
          <div id="voice" className="panel section-panel active">
            <VoiceDictation
              language={language}
              theme={theme}
              onSendToAnalyzer={(text) => {
                setCommentDraftText(text);
                setActiveTab('analyzer');
              }}
              onSendToTextStats={(text) => {
                setInputText(text);
                setActiveTab('summarizer');
              }}
            />
          </div>
        )}

        {/* Panel 3: Task Manager Panel */}
        {activeTab === 'tasks' && (
          <div id="tasks" className="panel section-panel active">
            <TaskManager language={language} theme={theme} />
          </div>
        )}

        {/* Panel 4: Password Generator Panel */}
        {activeTab === 'password' && (
          <div id="password" className="panel section-panel active">
            <PasswordGenerator language={language} theme={theme} />
          </div>
        )}

        {/* Panel 5: Image Converter Panel */}
        {activeTab === 'converter' && (
          <div id="converter" className="panel section-panel active">
            <ImageConverter language={language} theme={theme} />
          </div>
        )}

        {/* Tab 5: Text & Word Stats & AI Intelligence Panel */}
        {activeTab === 'summarizer' && (
          <div id="summarizer" className="section-panel active space-y-6">
            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                {isUrdu ? 'سیمپلز آزمائیں:' : 'Quick Presets:'}
              </span>
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setInputText(sample.content);
                    setReport(null);
                  }}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#1a1a1a] hover:bg-slate-800 hover:border-blue-500/50 border-[#262626] text-[#e2e8f0]'
                      : 'bg-white hover:bg-slate-50 hover:border-blue-300 border-[#e2e8f0] text-slate-700 shadow-sm'
                  }`}
                >
                  {language === 'ur' ? sample.titleUrdu : sample.titleEnglish}
                </button>
              ))}
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setReport(null);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors ml-auto flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  {isUrdu ? 'صاف کریں' : 'Clear'}
                </button>
              )}
            </div>

            {/* Primary Textarea Input Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rawInput"
                  className={`text-sm font-semibold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-[#0f172a]'
                  }`}
                >
                  <FileText className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  {isUrdu
                    ? 'الفاظ، حروف اور خلاصے کے لیے متن یہاں پیسٹ کریں:'
                    : 'Paste text to analyze words, characters & insights:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.csv,.log,.json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-2.5 py-1 text-xs border rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#e2e8f0] bg-[#1a1a1a] hover:bg-slate-800 border-[#262626]'
                        : 'text-slate-700 bg-[#f1f5f9] hover:bg-slate-200 border-[#e2e8f0]'
                    }`}
                  >
                    <Upload className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    {isUrdu ? 'فائل لوڈ کریں' : 'Upload File'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="rawInput"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    language === 'ur'
                      ? 'یہاں یوٹیوب کمنٹس، واٹس ایپ چیٹس، کسٹمر فیڈبیک یا کوئی بھی تحریر لکھیں یا پیسٹ کریں...'
                      : language === 'roman_ur'
                      ? 'Yahan apna text, YouTube comments ya WhatsApp chat paste karen...'
                      : 'Type or paste your text here to get instant word metrics and AI intelligence...'
                  }
                  rows={6}
                  className={`w-full border rounded-xl p-4 text-sm font-arabic transition-all resize-y leading-relaxed focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-[#1a1a1a] border-[#262626] focus:border-blue-500 text-[#e2e8f0] placeholder:text-[#64748b] focus:ring-blue-500/20'
                      : 'bg-[#f1f5f9] border-[#e2e8f0] focus:border-blue-600 text-[#334155] placeholder:text-[#94a3b8] focus:ring-blue-500/20'
                  }`}
                />
              </div>
            </div>

            {/* Live Text Analytics Box (Exact Output Specified in Template) */}
            <div
              className={`result-box border rounded-xl p-4 space-y-3 transition-colors ${
                isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-[#f1f5f9] border-[#e2e8f0]'
              }`}
              style={{ display: 'block' }}
            >
              <div className="flex items-center justify-between border-b pb-2.5">
                <h3 className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  <BarChart3 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span>{isUrdu ? 'لائیو شماریات و تجزیہ (Live Text Analytics)' : 'Live Text Analytics'}</span>
                </h3>
                <span className={`text-[11px] font-mono font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  ~{textStats.readingTimeMinutes} min read
                </span>
              </div>

              {/* Metric Chips Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className={`p-2.5 rounded-lg border text-center ${
                  isDark ? 'bg-[#121212] border-[#262626]' : 'bg-white border-[#e2e8f0]'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {isUrdu ? 'کل الفاظ (Words)' : 'Total Words'}
                  </span>
                  <span className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {textStats.words}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border text-center ${
                  isDark ? 'bg-[#121212] border-[#262626]' : 'bg-white border-[#e2e8f0]'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {isUrdu ? 'حروف (Characters)' : 'Characters'}
                  </span>
                  <span className={`text-lg font-bold font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {textStats.charsWithSpaces}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border text-center ${
                  isDark ? 'bg-[#121212] border-[#262626]' : 'bg-white border-[#e2e8f0]'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {isUrdu ? 'جملے (Sentences)' : 'Sentences'}
                  </span>
                  <span className={`text-lg font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {textStats.sentences}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border text-center ${
                  isDark ? 'bg-[#121212] border-[#262626]' : 'bg-white border-[#e2e8f0]'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {isUrdu ? 'سطور (Lines)' : 'Lines'}
                  </span>
                  <span className={`text-lg font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {textStats.lines}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div id="textContent" className={`text-xs leading-relaxed ${isDark ? 'text-[#e2e8f0]' : 'text-[#334155]'}`}>
                {language === 'en' ? (
                  <>
                    <strong>Metrics:</strong> Total Words: {textStats.words} | Characters: {textStats.charsWithSpaces} | Lines: {textStats.lines}
                    <br />
                    <strong>Status:</strong> {inputText.trim() ? 'Text is analyzed and ready for AI insights or exporting.' : 'Ready for input.'}
                  </>
                ) : language === 'roman_ur' ? (
                  <>
                    <strong>Stats:</strong> Kul Alfaz (Words): {textStats.words} | Characters: {textStats.charsWithSpaces}
                    <br />
                    <strong>Status:</strong> {inputText.trim() ? 'Aapka text bilkul theek aur ready hai.' : 'Input ka intezar hai.'}
                  </>
                ) : (
                  <>
                    <strong>شماریات:</strong> کل الفاظ: {textStats.words} | حروف: {textStats.charsWithSpaces} | جملے: {textStats.sentences}
                    <br />
                    <strong>حالت:</strong> {inputText.trim() ? 'متن کا کامیابی سے تجزیہ ہو چکا ہے۔ AI انٹیلی جنس نچوڑ کے لیے تیار ہے۔' : 'متن درج کرنے کا انتظار ہے۔'}
                  </>
                )}
              </div>
            </div>

            {/* AI Intelligence Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className={`text-xs hidden sm:block ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                {isUrdu
                  ? '⚡ 3 سطری ایگزیکٹو نچوڑ، جذبات کا گراف، اہم مطالبات اور ایکشن پلان'
                  : '⚡ Generates 3-sentence summary, sentiment metrics, topic progression & action plan'}
              </p>
              <button
                id="generate-summary-btn"
                onClick={handleAnalyze}
                disabled={isLoading || !inputText.trim()}
                className={`w-full sm:w-auto px-7 py-3 font-semibold rounded-xl text-xs sm:text-sm text-white shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer ml-auto ${
                  isDark
                    ? 'bg-[#3b82f6] hover:bg-[#2563eb] shadow-blue-500/25'
                    : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-blue-600/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isUrdu ? 'انٹیلی جنس تیار ہو رہی ہے...' : 'Decoding Intelligence...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>{isUrdu ? 'انٹیلی جنٹ AI خلاصہ بنائیں' : 'Generate AI Summary & Insights'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Structured Results Display (Exact 5-Section Architecture) */}
            {report && (
              <div ref={resultsRef} className="space-y-5 pt-4 animate-in fade-in duration-300">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      {report.sentimentToneLabel} • {report.totalItemsAnalyzed || textStats.lines}{' '}
                      {isUrdu ? 'پیغامات' : 'items processed'}
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
                    <button
                      id="copy-brief-btn"
                      onClick={handleCopyReport}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#1a1a1a] hover:bg-slate-800 border-[#262626] text-slate-200'
                          : 'bg-white hover:bg-slate-50 border-[#e2e8f0] text-slate-700 shadow-sm'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">{isUrdu ? 'کاپی ہو گیا' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isUrdu ? 'کاپی کریں' : 'Copy Brief'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-[#1a1a1a] hover:bg-slate-800 border-[#262626] text-slate-300 hover:text-white'
                          : 'bg-white hover:bg-slate-50 border-[#e2e8f0] text-slate-700 shadow-sm'
                      }`}
                      title="Export JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
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
                    {report.executiveSummary}
                  </p>
                </div>

                {/* SECTION 2: 📊 SENTIMENT & MOOD BREAKDOWN */}
                <div
                  className={`border rounded-2xl p-5 sm:p-6 shadow-xl transition-colors ${
                    isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-white border-[#e2e8f0]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      <span>📊</span>
                      <span>{isUrdu ? 'جذبات و تاثرات (SENTIMENT & MOOD BREAKDOWN)' : 'SENTIMENT & MOOD BREAKDOWN'}</span>
                    </h2>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {report.sentiment.explanation}
                    </span>
                  </div>

                  {/* Visual Multi-Segment Bar */}
                  <div className={`h-3 w-full rounded-full overflow-hidden flex gap-0.5 ${isDark ? 'bg-slate-950' : 'bg-slate-200'}`}>
                    <div
                      style={{ width: `${report.sentiment.positive}%` }}
                      className="bg-emerald-500 transition-all duration-700"
                      title={`Positive: ${report.sentiment.positive}%`}
                    />
                    <div
                      style={{ width: `${report.sentiment.inquiries}%` }}
                      className="bg-amber-500 transition-all duration-700"
                      title={`Inquiries: ${report.sentiment.inquiries}%`}
                    />
                    <div
                      style={{ width: `${report.sentiment.critical}%` }}
                      className="bg-rose-500 transition-all duration-700"
                      title={`Critical: ${report.sentiment.critical}%`}
                    />
                    <div
                      style={{ width: `${report.sentiment.neutral}%` }}
                      className="bg-slate-500 transition-all duration-700"
                      title={`Neutral: ${report.sentiment.neutral}%`}
                    />
                  </div>

                  {/* Clean Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className={`border p-3 rounded-xl ${
                      isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isUrdu ? 'مثبت رائے' : 'Positive'}
                      </span>
                      <span className="text-xl font-bold text-emerald-500">
                        {report.sentiment.positive}%
                      </span>
                    </div>
                    <div className={`border p-3 rounded-xl ${
                      isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isUrdu ? 'سوالات و تجسس' : 'Inquiries'}
                      </span>
                      <span className="text-xl font-bold text-amber-500">
                        {report.sentiment.inquiries}%
                      </span>
                    </div>
                    <div className={`border p-3 rounded-xl ${
                      isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isUrdu ? 'تنقید و خدشات' : 'Critical'}
                      </span>
                      <span className="text-xl font-bold text-rose-500">
                        {report.sentiment.critical}%
                      </span>
                    </div>
                    <div className={`border p-3 rounded-xl ${
                      isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isUrdu ? 'غیر جانبدار' : 'Neutral'}
                      </span>
                      <span className={`text-xl font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {report.sentiment.neutral}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* TOPIC FREQUENCY OVER CONVERSATION LENGTH (RECHARTS VISUALIZATION) */}
                {report.topicTimeline && report.topicTimeline.length > 0 && (
                  <TopicTimelineChart
                    timeline={report.topicTimeline}
                    topics={report.commonTopics}
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
                    {report.topDemands.map((item, idx) => (
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
                        {report.actionableNextSteps.highPriority.map((action, idx) => {
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
                        {report.actionableNextSteps.lowPriority.map((action, idx) => {
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

                {/* SECTION 5: 💬 TOP USER QUOTES */}
                <div
                  className={`border rounded-2xl p-5 sm:p-6 shadow-xl transition-colors ${
                    isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-white border-[#e2e8f0]'
                  }`}
                >
                  <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <span>💬</span>
                    <span>{isUrdu ? 'نمایاں اقتباسات (TOP USER QUOTES)' : 'TOP USER QUOTES'}</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.topUserQuotes.map((q, idx) => (
                      <div
                        key={idx}
                        className={`border p-4 rounded-xl flex flex-col justify-between ${
                          isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <p className={`text-xs sm:text-sm italic leading-relaxed mb-3 ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          "{q.quote}"
                        </p>
                        {q.speaker && (
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            — {q.speaker} {q.context && `• ${q.context}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Q&A Assistant Grounded on Transcript */}
                <div
                  className={`border rounded-2xl p-5 shadow-xl transition-colors ${
                    isDark ? 'bg-[#1a1a1a] border-[#262626]' : 'bg-white border-[#e2e8f0]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isUrdu ? 'اس ڈیٹا سے سوال پوچھیں (Chat with Transcript)' : 'Ask Grounded Follow-up Questions'}
                    </h3>
                  </div>

                  {chatMessages.length > 0 && (
                    <div className={`space-y-2.5 mb-3 max-h-60 overflow-y-auto p-3 rounded-xl border ${
                      isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            msg.role === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : isDark
                                ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                                : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                            }`}
                          >
                            <p>{msg.text}</p>
                          </div>
                          <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.timestamp}</span>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex items-center gap-2 text-xs text-blue-500 p-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>{isUrdu ? 'جواب تیار ہو رہا ہے...' : 'Finding answer...'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder={
                        isUrdu
                          ? 'مثال: کیا کسی نے قیمت یا بیٹری پر اعتراض کیا تھا؟'
                          : 'e.g., What was the primary issue regarding battery life?'
                      }
                      className={`flex-1 border rounded-xl px-3.5 py-2 text-xs transition-all focus:outline-none focus:ring-2 ${
                        isDark
                          ? 'bg-[#121212] border-[#262626] text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20'
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-500/20'
                      }`}
                    />
                    <button
                      onClick={() => handleSendChat()}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'پوچھیں' : 'Ask'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-[#94a3b8]">
        <p>SparkFlow Ultimate Suite v2 • 100% Client-Side & Secure</p>
      </footer>
    </div>
  );
}
