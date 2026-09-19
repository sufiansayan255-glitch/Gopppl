import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  History,
  Lock
} from 'lucide-react';
import { AppLanguage } from '../types';

interface PasswordGeneratorProps {
  language: AppLanguage;
  theme?: 'light' | 'dark';
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  language,
  theme = 'dark'
}) => {
  const [password, setPassword] = useState<string>('');
  const [length, setLength] = useState<number>(14);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [copiedHistoryIdx, setCopiedHistoryIdx] = useState<number | null>(null);

  const isUrdu = language === 'ur';
  const isDark = theme === 'dark';

  const generatePassword = () => {
    let charset = '';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '@#$%&*!_+~=?';

    if (includeUpper) charset += upperChars;
    if (includeLower) charset += lowerChars;
    if (includeNumbers) charset += numberChars;
    if (includeSymbols) charset += symbolChars;

    if (!charset) {
      charset = lowerChars + numberChars;
    }

    let generated = '';
    // Ensure at least one from each selected group
    const mandatory: string[] = [];
    if (includeUpper) mandatory.push(upperChars[Math.floor(Math.random() * upperChars.length)]);
    if (includeLower) mandatory.push(lowerChars[Math.floor(Math.random() * lowerChars.length)]);
    if (includeNumbers) mandatory.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
    if (includeSymbols) mandatory.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);

    for (let i = mandatory.length; i < length; i++) {
      const randIdx = Math.floor(Math.random() * charset.length);
      generated += charset[randIdx];
    }

    // Shuffle characters
    const allChars = [...mandatory, ...generated.split('')].sort(() => Math.random() - 0.5);
    const finalPass = allChars.slice(0, length).join('');

    setPassword(finalPass);
    setCopied(false);
    setHistory((prev) => [finalPass, ...prev.filter((p) => p !== finalPass)].slice(0, 5));
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  const copyToClipboard = (textToCopy?: string) => {
    const val = textToCopy || password;
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate password strength
  const calculateStrength = () => {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-slate-700' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 3) return { score: 25, label: isUrdu ? 'کمزور (Weak)' : 'Weak', color: 'bg-rose-500' };
    if (score <= 5) return { score: 60, label: isUrdu ? 'مناسب (Good)' : 'Good', color: 'bg-amber-500' };
    if (score <= 6) return { score: 85, label: isUrdu ? 'مضبوط (Strong)' : 'Strong', color: 'bg-blue-500' };
    return { score: 100, label: isUrdu ? 'بہترین سیکیور (Ultra)' : 'Very Strong', color: 'bg-emerald-500' };
  };

  const strength = calculateStrength();

  return (
    <div id="password-generator-container" className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <label
          htmlFor="generatedPassword"
          className={`text-sm font-semibold flex items-center gap-2 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          <Lock className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          {isUrdu ? 'محفوظ پاس ورڈ جنریٹر (Secure Password Generator):' : 'Secure Password Generator:'}
        </label>
        <span
          className={`text-xs px-2 py-0.5 rounded border font-semibold ${
            isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {isUrdu ? '100% مقامی اور محفوظ' : '100% Client-Side'}
        </span>
      </div>

      {/* Password Display Field & Primary Buttons */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              id="generatedPassword"
              value={password}
              readOnly
              placeholder={isUrdu ? 'پاس ورڈ تیار کرنے کے لیے کلک کریں...' : 'Click generate to create secure pass'}
              className={`w-full border rounded-xl px-4 py-3.5 text-base sm:text-lg font-mono font-bold tracking-wider select-all transition-all focus:outline-none ${
                isDark
                  ? 'bg-[#070b12] border-slate-800 text-cyan-400 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-300 text-blue-700 focus:border-blue-600'
              }`}
            />
          </div>

          <button
            id="generate-pass-btn"
            onClick={generatePassword}
            className={`px-6 py-3.5 font-bold rounded-xl text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDark
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isUrdu ? 'دوبارہ بنائیں' : 'Generate'}</span>
          </button>
        </div>

        {/* Strength Progress Meter */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {isUrdu ? 'سیکیورٹی لیول:' : 'Security Strength:'}
            </span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {strength.label}
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              style={{ width: `${strength.score}%` }}
              className={`h-full ${strength.color} transition-all duration-300`}
            />
          </div>
        </div>
      </div>

      {/* Copy Action Button */}
      <button
        id="copy-pass-btn"
        onClick={() => copyToClipboard()}
        className={`w-full py-3 px-4 font-semibold text-xs sm:text-sm rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
          copied
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
            : isDark
            ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-white'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500">
              {isUrdu ? 'کلپ بورڈ پر کاپی ہو گیا!' : 'Password Copied to Clipboard!'}
            </span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>{isUrdu ? 'کلپ بورڈ پر کاپی کریں' : 'Copy to Clipboard'}</span>
          </>
        )}
      </button>

      {/* Customization Options */}
      <div
        className={`border rounded-2xl p-5 space-y-4 transition-colors ${
          isDark ? 'border-slate-800 bg-[#070b12]/60' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sliders className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {isUrdu ? 'پاس ورڈ کی ترتیبات' : 'Generator Controls & Parameters'}
          </h4>
        </div>

        {/* Length Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              {isUrdu ? 'پاس ورڈ کی لمبائی:' : 'Password Length:'}
            </span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${
              isDark ? 'bg-slate-800 text-blue-400' : 'bg-white border border-slate-200 text-blue-700'
            }`}>
              {length} {isUrdu ? 'حروف' : 'chars'}
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="32"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
              isDark ? 'bg-slate-800 accent-blue-500' : 'bg-slate-200 accent-blue-600'
            }`}
          />
          <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>6 (Short)</span>
            <span>14 (Standard)</span>
            <span>24 (Ultra)</span>
            <span>32 (Max)</span>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <label
            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              includeUpper
                ? isDark
                  ? 'bg-blue-950/30 border-blue-800/40 text-slate-200'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
                : isDark
                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <input
              type="checkbox"
              checked={includeUpper}
              onChange={(e) => setIncludeUpper(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>A-Z (Upper)</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              includeLower
                ? isDark
                  ? 'bg-blue-950/30 border-blue-800/40 text-slate-200'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
                : isDark
                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <input
              type="checkbox"
              checked={includeLower}
              onChange={(e) => setIncludeLower(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>a-z (Lower)</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              includeNumbers
                ? isDark
                  ? 'bg-blue-950/30 border-blue-800/40 text-slate-200'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
                : isDark
                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>0-9 (Digits)</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              includeSymbols
                ? isDark
                  ? 'bg-blue-950/30 border-blue-800/40 text-slate-200'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
                : isDark
                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>@#$& (Symbols)</span>
          </label>
        </div>
      </div>

      {/* Recent History */}
      {history.length > 1 && (
        <div className="space-y-2">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <History className="w-3.5 h-3.5" />
            {isUrdu ? 'حالیہ تیار کردہ پاس ورڈز' : 'Recent Passwords History'}
          </span>
          <div className="space-y-1.5">
            {history.slice(1).map((histPass, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-all ${
                  isDark
                    ? 'bg-[#070b12] border-slate-800 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="truncate max-w-xs sm:max-w-md">{histPass}</span>
                <button
                  onClick={() => {
                    copyToClipboard(histPass);
                    setCopiedHistoryIdx(idx);
                    setTimeout(() => setCopiedHistoryIdx(null), 2000);
                  }}
                  className="px-2 py-1 text-[11px] text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer font-sans font-semibold"
                >
                  {copiedHistoryIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHistoryIdx === idx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
