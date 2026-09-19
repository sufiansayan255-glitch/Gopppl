import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Trash2,
  Download,
  FileJson,
  Sparkles,
  AlertCircle,
  Minimize2,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { AppLanguage } from '../types';

interface JsonFormatterProps {
  language: AppLanguage;
  theme?: 'light' | 'dark';
}

const SAMPLE_JSONS = {
  user: {
    id: 'usr_9824',
    name: 'Muhammad Ali',
    role: 'Admin',
    active: true,
    preferences: {
      theme: 'dark',
      notifications: true,
      languages: ['Urdu', 'English']
    },
    meta: {
      loginCount: 42,
      lastLogin: new Date().toISOString()
    }
  },
  ecommerce: {
    orderId: 'ORD-2026-991',
    customer: {
      name: 'Ahmed Khan',
      city: 'Karachi',
      country: 'Pakistan'
    },
    items: [
      { id: 'item_1', name: 'Wireless Headphones', price: 4500, qty: 1 },
      { id: 'item_2', name: 'USB-C Cable', price: 650, qty: 2 }
    ],
    currency: 'PKR',
    total: 5800,
    status: 'Delivered'
  }
};

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ language, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const isUrdu = language === 'ur';

  const [inputJson, setInputJson] = useState<string>(
    JSON.stringify(SAMPLE_JSONS.user, null, 2)
  );
  const [outputJson, setOutputJson] = useState<string>(
    JSON.stringify(SAMPLE_JSONS.user, null, 4)
  );
  const [indentSize, setIndentSize] = useState<number>(4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<{ keys: number; bytes: number; lines: number } | null>(() => {
    try {
      const parsed = SAMPLE_JSONS.user;
      return {
        keys: Object.keys(parsed).length,
        bytes: new Blob([JSON.stringify(parsed)]).size,
        lines: JSON.stringify(parsed, null, 4).split('\n').length
      };
    } catch {
      return null;
    }
  });

  const formatJSON = (spaces = indentSize) => {
    if (!inputJson.trim()) {
      setOutputJson('');
      setErrorMessage(null);
      setStats(null);
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, spaces);
      setOutputJson(formatted);
      setErrorMessage(null);

      // Compute statistics
      const keysCount = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1;
      const byteSize = new Blob([formatted]).size;
      const lineCount = formatted.split('\n').length;
      setStats({ keys: keysCount, bytes: byteSize, lines: lineCount });
    } catch (err: any) {
      setErrorMessage(err.message || (isUrdu ? 'غلط JSON فارمیٹ ہے!' : 'Invalid JSON!'));
    }
  };

  const minifyJSON = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setOutputJson(minified);
      setErrorMessage(null);
      const byteSize = new Blob([minified]).size;
      setStats({
        keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1,
        bytes: byteSize,
        lines: 1
      });
    } catch (err: any) {
      setErrorMessage(err.message || (isUrdu ? 'غلط JSON فارمیٹ ہے!' : 'Invalid JSON!'));
    }
  };

  const handleCopy = () => {
    const textToCopy = outputJson || inputJson;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputJson('');
    setOutputJson('');
    setErrorMessage(null);
    setStats(null);
  };

  const handleDownload = () => {
    const textToSave = outputJson || inputJson;
    if (!textToSave) return;
    const blob = new Blob([textToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sparkflow-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadSample = (type: 'user' | 'ecommerce') => {
    const data = SAMPLE_JSONS[type];
    const text = JSON.stringify(data, null, 2);
    setInputJson(text);
    const formatted = JSON.stringify(data, null, indentSize);
    setOutputJson(formatted);
    setErrorMessage(null);
    setStats({
      keys: Object.keys(data).length,
      bytes: new Blob([formatted]).size,
      lines: formatted.split('\n').length
    });
  };

  return (
    <div id="json-formatter-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3
            className={`text-base font-bold flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            <FileJson className="w-5 h-5 text-blue-500" />
            <span>{isUrdu ? '🛠️ JSON فارمیٹر (JSON Formatter Pro)' : '🛠️ JSON Formatter (Pro Tool)'}</span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isUrdu
              ? 'اپنے JSON ڈیٹا کو فوری فارمیٹ کریں، غلطیاں درست کریں اور خوبصورت بنائیں'
              : 'Beautify, validate, minify, and inspect JSON payloads with zero latency'}
          </p>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isUrdu ? 'سیمپل:' : 'Samples:'}
          </span>
          <button
            onClick={() => loadSample('user')}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#121212] hover:bg-slate-800 border-[#262626] text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            User Profile
          </button>
          <button
            onClick={() => loadSample('ecommerce')}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#121212] hover:bg-slate-800 border-[#262626] text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            E-Commerce
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 font-mono text-[11px] break-all">{errorMessage}</div>
        </div>
      )}

      {/* Main Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="jsonInput"
              className="text-xs font-bold text-slate-400 flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-500" />
              <span>{isUrdu ? 'JSON ان پٹ (Raw Input):' : 'Raw JSON Input:'}</span>
            </label>
            <span className="text-[11px] text-slate-500">
              {inputJson.length} {isUrdu ? 'حروف' : 'chars'}
            </span>
          </div>

          <textarea
            id="jsonInput"
            value={inputJson}
            onChange={(e) => {
              setInputJson(e.target.value);
              setErrorMessage(null);
            }}
            placeholder='{"channel": "Smart Spark TV"}'
            rows={12}
            className={`w-full p-3.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y leading-relaxed ${
              isDark
                ? 'bg-[#0f172a] border-[#334155] text-slate-200 placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Right Column: Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="jsonOutput"
              className="text-xs font-bold text-slate-400 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isUrdu ? 'فارمیٹڈ آؤٹ پٹ (Formatted Output):' : 'Formatted Output:'}</span>
            </label>
            {stats && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{stats.lines} lines</span>
                <span>•</span>
                <span>{(stats.bytes / 1024).toFixed(2)} KB</span>
              </div>
            )}
          </div>

          <textarea
            id="jsonOutput"
            readOnly
            value={outputJson}
            placeholder={isUrdu ? 'فارمیٹڈ رزلٹ یہاں ظاہر ہوگا...' : 'Formatted JSON result will appear here...'}
            rows={12}
            className={`w-full p-3.5 rounded-xl text-xs font-mono border focus:outline-none transition-all resize-y leading-relaxed ${
              isDark
                ? 'bg-[#0f172a] border-[#334155] text-emerald-400 placeholder-slate-600'
                : 'bg-slate-50 border-slate-200 text-emerald-700 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Action Controls & Format Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Beautify Button */}
          <button
            id="format-json-btn"
            onClick={() => formatJSON(indentSize)}
            className={`btn btn-action py-2.5 px-5 font-bold rounded-xl text-xs sm:text-sm text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isDark
                ? 'bg-[#3b82f6] hover:bg-[#2563eb] shadow-blue-500/20'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-blue-600/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isUrdu ? 'خوبصورت بنائیں (Beautify JSON)' : 'Format JSON (Beautify)'}</span>
          </button>

          {/* Minify Button */}
          <button
            onClick={minifyJSON}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#1e293b] hover:bg-slate-700 border-[#334155] text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'مختصر کریں (Minify)' : 'Minify'}</span>
          </button>

          {/* Indent Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 hidden sm:inline">{isUrdu ? 'اسپیس:' : 'Spaces:'}</span>
            <select
              value={indentSize}
              onChange={(e) => {
                const s = Number(e.target.value);
                setIndentSize(s);
                formatJSON(s);
              }}
              className={`py-2 px-2.5 rounded-xl border text-xs cursor-pointer focus:outline-none ${
                isDark
                  ? 'bg-[#1e293b] border-[#334155] text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
              <option value={6}>6 Spaces</option>
            </select>
          </div>
        </div>

        {/* Secondary Tool Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#1e293b] hover:bg-slate-700 border-[#334155] text-slate-300'
                : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700'
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
                : 'Copy Output'}
            </span>
          </button>

          <button
            onClick={handleDownload}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#1e293b] hover:bg-slate-700 border-[#334155] text-slate-300'
                : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ڈاؤنلوڈ' : 'Download .json'}</span>
          </button>

          <button
            onClick={handleClear}
            className={`p-2 rounded-xl border text-slate-400 hover:text-rose-400 cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#1e293b] hover:bg-rose-950/40 border-[#334155]'
                : 'bg-white hover:bg-rose-50 border-slate-200'
            }`}
            title={isUrdu ? 'تمام صاف کریں' : 'Clear All'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
