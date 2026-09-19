import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Globe,
  Wifi,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Share2,
  Palette,
  Maximize
} from 'lucide-react';
import { AppLanguage } from '../types';

interface QrGeneratorProps {
  language: AppLanguage;
  theme?: 'light' | 'dark';
}

const QR_PRESETS = [
  {
    id: 'url',
    label: 'Website',
    labelUr: 'ویب سائٹ',
    icon: Globe,
    placeholder: 'https://example.com',
    defaultVal: 'https://sparkflow.app'
  },
  {
    id: 'wifi',
    label: 'Wi-Fi Network',
    labelUr: 'وائی فائی',
    icon: Wifi,
    placeholder: 'WIFI:S:MyNetwork;T:WPA;P:Password123;;',
    defaultVal: 'WIFI:S:Office_WiFi;T:WPA;P:FastPass2026;;'
  },
  {
    id: 'email',
    label: 'Email',
    labelUr: 'ای میل',
    icon: Mail,
    placeholder: 'mailto:contact@example.com?subject=Hello',
    defaultVal: 'mailto:sufiansayan255@gmail.com?subject=SparkFlow%20Inquiry'
  },
  {
    id: 'phone',
    label: 'Phone Call',
    labelUr: 'فون نمبر',
    icon: Phone,
    placeholder: 'tel:+923001234567',
    defaultVal: 'tel:+923001234567'
  },
  {
    id: 'text',
    label: 'Plain Text',
    labelUr: 'عام ٹیکسٹ',
    icon: FileText,
    placeholder: 'Welcome to SparkFlow Suite',
    defaultVal: 'SparkFlow Ultimate Suite Pro - All in One Productivity Hub'
  }
];

const COLOR_THEMES = [
  { id: '000000', label: 'Black (काला / کالا)', darkColor: '#000000', lightColor: '#ffffff' },
  { id: '2563eb', label: 'Blue (नीला / نیلا)', darkColor: '#2563eb', lightColor: '#ffffff' },
  { id: '16a34a', label: 'Green (हरा / سبز)', darkColor: '#16a34a', lightColor: '#ffffff' },
  { id: 'dc2626', label: 'Red (लाल / سرخ)', darkColor: '#dc2626', lightColor: '#ffffff' },
  { id: '9333ea', label: 'Purple (बैंगनी / جامنی)', darkColor: '#9333ea', lightColor: '#ffffff' }
];

export const QrGenerator: React.FC<QrGeneratorProps> = ({ language, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const isUrdu = language === 'ur';

  const [text, setText] = useState<string>('https://youtube.com/@SmartSparkTV');
  const [selectedPreset, setSelectedPreset] = useState<string>('url');
  const [size, setSize] = useState<number>(200);
  const [selectedColor, setSelectedColor] = useState<string>('000000');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentColorConfig =
    COLOR_THEMES.find((c) => c.id === selectedColor) || COLOR_THEMES[0];

  const generateQRCode = async () => {
    if (!text.trim()) {
      setQrDataUrl('');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Generate client-side using qrcode package
      const url = await QRCode.toDataURL(text.trim(), {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: currentColorConfig.darkColor,
          light: currentColorConfig.lightColor
        }
      });
      setQrDataUrl(url);

      // Render to canvas if needed for direct export
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, text.trim(), {
          width: size,
          margin: 2,
          errorCorrectionLevel: errorLevel,
          color: {
            dark: currentColorConfig.darkColor,
            light: currentColorConfig.lightColor
          }
        });
      }
    } catch (err) {
      console.warn('Local QRCode generation fallback to API:', err);
      // Fallback to QR server API
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
        text
      )}`;
      setQrDataUrl(fallbackUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, [text, size, selectedColor, errorLevel]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `sparkflow-qr-${Date.now()}.png`;
    link.click();
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback copy text
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectPreset = (preset: typeof QR_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    setText(preset.defaultVal);
  };

  return (
    <div id="qr-generator-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3
            className={`text-base font-bold flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            <QrCode className="w-5 h-5 text-blue-500" />
            <span>{isUrdu ? '📱 QR کوڈ جنریٹر (QR Code Generator)' : '📱 QR Code Generator'}</span>
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isUrdu
              ? 'ویب سائٹ، وائی فائی، ای میل یا کسٹم ٹیکسٹ کے لیے فوری اعلی معیار کا QR کوڈ بنائیں'
              : 'Create high-resolution QR codes for websites, Wi-Fi keys, contacts, or raw text'}
          </p>
        </div>

        {/* Dimension & Level Quick Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">{isUrdu ? 'سائز:' : 'Size:'}</span>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className={`py-1.5 px-2.5 rounded-lg border text-xs cursor-pointer focus:outline-none ${
                isDark
                  ? 'bg-[#1e293b] border-[#334155] text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value={150}>150 x 150</option>
              <option value={200}>200 x 200</option>
              <option value={300}>300 x 300</option>
              <option value={400}>400 x 400</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preset Buttons Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {QR_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                isSelected
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : isDark
                  ? 'bg-[#1e293b] border border-[#334155] text-slate-300 hover:bg-slate-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isUrdu ? preset.labelUr : preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Input Form + QR Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Left Column (2 Cols): Controls & Inputs */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label
              htmlFor="qrText"
              className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{isUrdu ? 'لنک یا ٹیکسٹ لکھیں (Enter Content / Link):' : 'Enter URL or Content:'}</span>
            </label>
            <input
              type="text"
              id="qrText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                isUrdu
                  ? 'لنک یا ٹیکسٹ لکھیں...'
                  : 'Enter text, website URL, or phone number...'
              }
              className={`w-full p-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isDark
                  ? 'bg-[#0f172a] border-[#334155] text-slate-100 placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Color Palettes */}
          <div className="space-y-2">
            <label htmlFor="qrColor" className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-500" />
              <span>{isUrdu ? 'QR کوڈ کا رنگ منتخب کریں:' : 'Select QR Code Color:'}</span>
            </label>

            <select
              id="qrColor"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className={`w-full p-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#0f172a] border-[#334155] text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="000000">Black (काला / کالا)</option>
              <option value="2563eb">Blue (नीला / نیلا)</option>
              <option value="16a34a">Green (हरा / سبز)</option>
              <option value="dc2626">Red (लाल / سرخ)</option>
              <option value="9333ea">Purple (बैंगनी / جامنی)</option>
            </select>

            <div className="flex flex-wrap gap-2 pt-1">
              {COLOR_THEMES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    selectedColor === c.id
                      ? 'ring-2 ring-blue-500 border-transparent font-bold'
                      : isDark
                      ? 'border-[#334155] bg-[#0f172a] text-slate-300'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: c.darkColor }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button matching spec */}
          <button
            id="generate-qr-btn"
            onClick={generateQRCode}
            className={`btn btn-action py-3 px-5 font-bold rounded-xl text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer w-full ${
              isDark
                ? 'bg-[#3b82f6] hover:bg-[#2563eb] shadow-blue-500/20'
                : 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-blue-600/20'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{isUrdu ? 'QR کوڈ بنائیں (Generate QR Code)' : 'Generate QR Code'}</span>
          </button>
        </div>

        {/* Right Column (1 Col): Result Preview Box (`#qrOutput`) */}
        <div
          id="qrOutput"
          className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center space-y-4 transition-all shadow-sm ${
            isDark ? 'bg-[#0f172a] border-[#334155]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs font-bold text-slate-400">
            {isUrdu ? 'QR کوڈ لائیو پریویو' : 'Live QR Preview'}
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-xl shadow-md inline-block border border-slate-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Generated QR Code"
                className="w-auto max-h-[190px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-[150px] h-[150px] flex items-center justify-center text-slate-400 text-xs font-medium">
                {isUrdu ? 'کوڈ تیار نہیں ہوا' : 'Enter text above'}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Download & Copy Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#1e293b] hover:bg-slate-700 border-[#334155] text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ڈاؤنلوڈ PNG' : 'Download PNG'}</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={!qrDataUrl}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#1e293b] hover:bg-slate-700 border-[#334155] text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isUrdu ? 'امیج یا لنک کاپی کریں' : 'Copy image'}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : isUrdu ? 'کاپی' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
