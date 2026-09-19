import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Copy,
  Check,
  Trash2,
  Send,
  Sparkles,
  Volume2,
  AlertCircle,
  Globe,
  Radio,
  FileText,
  ExternalLink,
  ShieldAlert,
  Play,
  RotateCcw
} from 'lucide-react';
import { AppLanguage } from '../types';

interface VoiceDictationProps {
  language: AppLanguage;
  theme?: 'light' | 'dark';
  onSendToAnalyzer?: (text: string) => void;
  onSendToTextStats?: (text: string) => void;
}

const SAMPLE_DICTATIONS: Record<string, string[]> = {
  'ur-PK': [
    'یہ پروڈکٹ بہت زبردست ہے، لیکن قیمت میں کچھ رعایت ہونی چاہیے۔',
    'کیا یہ کورئیر کے ذریعے لاہور اور کراچی میں ڈیلیور ہو سکتا ہے؟',
    'آج کے تمام ٹاسکس مکمل ہو چکے ہیں اور نیا کنٹینٹ تیار ہے۔'
  ],
  'en-US': [
    'The overall user experience is fast and responsive with great battery life.',
    'Could you please share the pricing breakdown and bulk discount options?',
    'All priority tasks for today have been reviewed and updated.'
  ],
  'hi-IN': [
    'Ye product bohot acha hai lekin iski delivery thodi fast honi chahiye.',
    'Kya ye Roman Urdu aur English dono mein available hai?',
    'Bohat shandar suite hai, productivity bohot increase ho gayi hai.'
  ]
};

export const VoiceDictation: React.FC<VoiceDictationProps> = ({
  language,
  theme = 'dark',
  onSendToAnalyzer,
  onSendToTextStats
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [voiceLang, setVoiceLang] = useState<string>(language === 'ur' ? 'ur-PK' : 'en-US');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const isDark = theme === 'dark';
  const isUrdu = language === 'ur';

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(
        isUrdu
          ? 'اس براؤزر میں وائس اسپیچ ریکگنیشن سپورٹ نہیں ہے۔ براہ کرم گوگل کروم یا مائیکروسافٹ ایج استعمال کریں۔'
          : 'Speech Recognition API is not supported in this browser. Please use Google Chrome, Edge, or Safari.'
      );
    }
  }, [isUrdu]);

  const requestMicrophoneAccess = async (): Promise<boolean> => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop the audio stream so SpeechRecognition can take over
        stream.getTracks().forEach((track) => track.stop());
        setIsPermissionDenied(false);
        setErrorMessage(null);
        return true;
      } catch (err: any) {
        console.warn('Microphone permission request error:', err);
        setIsPermissionDenied(true);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage(
            isUrdu
              ? 'براؤزر نے مائیکروفون کی اجازت مسترد کر دی ہے۔ براہ کرم ایڈریس بار میں لاک 🔒 آئیکن پر کلک کر کے مائیک کی اجازت دیں یا نیا ٹیب کھولیں۔'
              : 'Microphone permission was blocked. Please click the Lock 🔒 icon in your browser address bar to allow microphone access, or open the app in a new tab.'
          );
        } else {
          setErrorMessage(err.message || 'Microphone access failed');
        }
        return false;
      }
    }
    return true;
  };

  const toggleListening = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        isUrdu
          ? 'اس براؤزر میں اسپیچ ریکگنیشن دستیاب نہیں ہے۔'
          : 'Speech recognition is not supported in this browser.'
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      setInterimText('');
      return;
    }

    setErrorMessage(null);
    setIsPermissionDenied(false);

    // Pre-request getUserMedia to trigger the browser microphone prompt cleanly if needed
    const hasAccess = await requestMicrophoneAccess();
    if (!hasAccess) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        setIsPermissionDenied(false);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTrans = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTrans += result[0].transcript + ' ';
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (finalTrans) {
          setTranscript((prev) =>
            prev ? prev.trim() + '\n' + finalTrans.trim() : finalTrans.trim()
          );
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning/event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsPermissionDenied(true);
          setErrorMessage(
            isUrdu
              ? 'مائیکروفون کی اجازت درکار ہے۔ براہ کرم براؤزر کی سیٹنگز میں مائیکروفون کی اجازت دیں، یا نئی ونڈو میں کھولیں۔'
              : 'Microphone access is blocked or restricted. Please allow microphone access in browser settings or open in a new tab.'
          );
        } else if (event.error === 'no-speech') {
          // Silent timeout when user stops talking, keep going or end gracefully
        } else if (event.error === 'network') {
          setErrorMessage(
            isUrdu
              ? 'نیٹ ورک کنکشن کا مسئلہ پیش آیا ہے۔'
              : 'Speech recognition network error occurred.'
          );
        } else {
          setErrorMessage(`Speech info: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Recognition start caught error:', err);
      setIsPermissionDenied(true);
      setErrorMessage(
        isUrdu
          ? 'مائیکروفون شروع نہیں ہو سکا۔ براہ کرم اجازت چیک کریں یا ڈیمو ٹیکسٹ آزمائیں۔'
          : 'Could not initialize speech recognition. Check microphone permissions.'
      );
      setIsListening(false);
    }
  };

  const handleApplySample = (sample: string) => {
    setTranscript((prev) => (prev ? prev.trim() + '\n' + sample : sample));
    setErrorMessage(null);
  };

  const handleCopy = () => {
    const fullText = (transcript + (interimText ? ' ' + interimText : '')).trim();
    if (!fullText) return;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setTranscript('');
    setInterimText('');
    setErrorMessage(null);
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const activeSamples = SAMPLE_DICTATIONS[voiceLang] || SAMPLE_DICTATIONS['en-US'];

  return (
    <div id="voice-dictation-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Title & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3
            className={`text-base font-bold flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            <Radio
              className={`w-5 h-5 ${
                isListening ? 'text-rose-500 animate-pulse' : 'text-blue-500'
              }`}
            />
            <span>
              {isUrdu
                ? '🎙️ وائس ٹو ٹیکسٹ (Voice Dictation)'
                : '🎙️ Voice Dictation (Speech to Text)'}
            </span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isUrdu
              ? 'مائیک کے ذریعے اردو یا انگریزی میں بولیں، خودکار طور پر متن تحریر ہوگا'
              : 'Speak naturally in Urdu or English to convert your voice to text in real time'}
          </p>
        </div>

        {/* Language selector for Voice Input */}
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
            disabled={isListening}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none transition-colors ${
              isDark
                ? 'bg-[#121212] border-[#262626] text-slate-200'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="ur-PK">اردو (پاکستان) - Urdu</option>
            <option value="en-US">English (US)</option>
            <option value="en-PK">English (Pakistan)</option>
            <option value="hi-IN">Roman Urdu / Hindi</option>
            <option value="ar-SA">العربية (Arabic)</option>
          </select>
        </div>
      </div>

      {/* Permission Warning / Error Alert */}
      {errorMessage && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
            isPermissionDenied
              ? isDark
                ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              {isPermissionDenied && (
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {isUrdu
                    ? 'حل: براؤزر ایڈریس بار میں لاک کے نشان پر کلک کر کے مائیکروفون کو "Allow" کریں، یا نیچے دیا گیا ڈیمو ٹیکسٹ ٹرائی کریں۔'
                    : 'Tip: Click the lock icon in the address bar to allow Microphone, or use the instant demo dictation chips below.'}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={toggleListening}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs border flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-amber-900/40 border-amber-700/60 text-amber-100 hover:bg-amber-900/60'
                  : 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'دوبارہ اجازت طلب کریں' : 'Request Permission Again'}</span>
            </button>
            <button
              onClick={openInNewTab}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs border flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'نئے ٹیب میں کھولیں' : 'Open in New Tab'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Start / Stop Voice Button */}
      <button
        id="start-voice-btn"
        onClick={toggleListening}
        className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
          isListening
            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 animate-pulse'
            : isDark
            ? 'bg-[#3b82f6] hover:bg-[#2563eb] shadow-blue-500/20'
            : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-blue-600/20'
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-5 h-5" />
            <span>
              {isUrdu
                ? '⏹️ بولنا بند کریں (Stop Listening)'
                : '⏹️ Stop Dictation (Listening...)'}
            </span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>
              {isUrdu
                ? '🎙️ بولنا شروع کریں (Start Voice)'
                : '🎙️ Start Speaking (Voice to Text)'}
            </span>
          </>
        )}
      </button>

      {/* Visualizer Pulsing Wave when listening */}
      {isListening && (
        <div className="flex items-center justify-center gap-1.5 py-2">
          <span className="text-xs font-semibold text-rose-500 mr-2 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            {isUrdu ? 'سن رہا ہے...' : 'Recording & Listening...'}
          </span>
          {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9, 0.3].map((delay, idx) => (
            <span
              key={idx}
              className="w-1 bg-blue-500 rounded-full animate-bounce"
              style={{
                height: `${12 + (idx % 3) * 10}px`,
                animationDuration: `${0.6 + delay * 0.4}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Quick Sample Chips for immediate test if mic is offline */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          {isUrdu ? 'فوری سیمپل وائس ٹیکسٹ (Quick Demo Dictations):' : 'Instant Demo Voice Transcripts:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {activeSamples.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleApplySample(sample)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 text-left ${
                isDark
                  ? 'bg-[#121212] hover:bg-slate-800 border-[#262626] text-slate-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Play className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-[320px]">{sample}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transcript Textarea */}
      <div className="relative">
        <textarea
          id="voiceText"
          value={transcript + (interimText ? (transcript ? ' ' : '') + interimText : '')}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={
            isUrdu
              ? 'آپ کی آواز یہاں آئے گی...'
              : language === 'roman_ur'
              ? 'Aap ki aawaz yahan likhi jayegi...'
              : 'Your voice transcript will appear here in real-time...'
          }
          rows={6}
          className={`w-full border rounded-xl p-4 text-sm font-arabic transition-all resize-y leading-relaxed focus:outline-none focus:ring-2 ${
            isDark
              ? 'bg-[#1a1a1a] border-[#262626] focus:border-blue-500 text-slate-100 placeholder:text-slate-500 focus:ring-blue-500/20'
              : 'bg-[#f1f5f9] border-[#e2e8f0] focus:border-blue-600 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500/20'
          }`}
        />
        {interimText && (
          <span className="absolute bottom-3 right-3 text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
            live typing...
          </span>
        )}
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!transcript.trim()}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#1a1a1a] border-[#262626] text-slate-200 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>
              {copied
                ? isUrdu
                  ? 'کاپی ہو گیا!'
                  : 'Copied!'
                : isUrdu
                ? 'کاپی کریں'
                : 'Copy Text'}
            </span>
          </button>

          <button
            onClick={handleClear}
            disabled={!transcript.trim() && !interimText.trim()}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#1a1a1a] border-[#262626] text-rose-400 hover:bg-rose-950/30'
                : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'صاف کریں' : 'Clear'}</span>
          </button>
        </div>

        {/* Transfer buttons to other tools */}
        <div className="flex items-center gap-2">
          {onSendToAnalyzer && (
            <button
              onClick={() => onSendToAnalyzer(transcript.trim())}
              disabled={!transcript.trim()}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-blue-950/40 border-blue-800/60 text-blue-300 hover:bg-blue-900/50'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'کمنٹ اینالائزر میں بھیجیں' : 'Send to Comment Reader'}</span>
            </button>
          )}

          {onSendToTextStats && (
            <button
              onClick={() => onSendToTextStats(transcript.trim())}
              disabled={!transcript.trim()}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-slate-900 border-[#262626] text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ٹیکسٹ انالیٹکس' : 'Analyze Stats'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

