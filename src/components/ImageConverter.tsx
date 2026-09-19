import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  ArrowRight,
  Download,
  Trash2,
  Sliders,
  CheckCircle2,
  Sparkles,
  Maximize2,
  FileImage,
  Copy,
  RefreshCw
} from 'lucide-react';
import { AppLanguage } from '../types';

interface ImageConverterProps {
  language: AppLanguage;
  theme?: 'light' | 'dark';
}

interface ImageFileState {
  file: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  convertedUrl: string | null;
  convertedBlob: Blob | null;
  convertedSize: number | null;
  status: 'ready' | 'converting' | 'converted' | 'error';
  errorMessage?: string;
}

export const ImageConverter: React.FC<ImageConverterProps> = ({ language, theme = 'dark' }) => {
  const [images, setImages] = useState<ImageFileState[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.92);
  const [scale, setScale] = useState<number>(1);
  const [customWidth, setCustomWidth] = useState<number | ''>('');
  const [customHeight, setCustomHeight] = useState<number | ''>('');
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [isConvertingAll, setIsConvertingAll] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUrdu = language === 'ur';
  const isDark = theme === 'dark';

  const formatExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/bmp': 'bmp'
  };

  const formatNames: Record<string, string> = {
    'image/jpeg': 'JPEG / JPG (.jpg)',
    'image/png': 'PNG (.png) - Lossless with Alpha',
    'image/webp': 'WebP (.webp) - Modern Web Optimized',
    'image/bmp': 'BMP (.bmp) - Bitmap'
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageFileState[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            file,
            previewUrl,
            originalWidth: img.width,
            originalHeight: img.height,
            originalSize: file.size,
            convertedUrl: null,
            convertedBlob: null,
            convertedSize: null,
            status: 'ready'
          }
        ]);
      };
      img.src = previewUrl;
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const convertSingleImage = async (index: number): Promise<void> => {
    const item = images[index];
    if (!item) return;

    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, status: 'converting' } : img))
    );

    try {
      const img = new Image();
      img.src = item.previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      let targetWidth = item.originalWidth;
      let targetHeight = item.originalHeight;

      if (customWidth && customHeight) {
        targetWidth = Number(customWidth);
        targetHeight = Number(customHeight);
      } else if (scale !== 1) {
        targetWidth = Math.round(item.originalWidth * scale);
        targetHeight = Math.round(item.originalHeight * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context initialization failed');
      }

      // If converting to JPEG or BMP, paint background white to prevent black transparent areas
      if (selectedFormat === 'image/jpeg' || selectedFormat === 'image/bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Handle BMP fallback or standard toBlob
      const blob = await new Promise<Blob | null>((resolve) => {
        if (selectedFormat === 'image/bmp') {
          // Standard browser canvas might not support image/bmp natively, fallback to PNG or canvas-to-blob
          canvas.toBlob((b) => resolve(b), 'image/bmp');
        } else {
          canvas.toBlob(
            (b) => resolve(b),
            selectedFormat,
            selectedFormat === 'image/png' ? undefined : quality
          );
        }
      });

      if (!blob) {
        // Fallback to dataURL extraction
        const dataUrl = canvas.toDataURL(selectedFormat, quality);
        const res = await fetch(dataUrl);
        const fallbackBlob = await res.blob();
        const convertedUrl = URL.createObjectURL(fallbackBlob);
        setImages((prev) =>
          prev.map((itm, i) =>
            i === index
              ? {
                  ...itm,
                  convertedUrl,
                  convertedBlob: fallbackBlob,
                  convertedSize: fallbackBlob.size,
                  status: 'converted'
                }
              : itm
          )
        );
        return;
      }

      const convertedUrl = URL.createObjectURL(blob);
      setImages((prev) =>
        prev.map((itm, i) =>
          i === index
            ? {
                ...itm,
                convertedUrl,
                convertedBlob: blob,
                convertedSize: blob.size,
                status: 'converted'
              }
            : itm
        )
      );
    } catch (err: any) {
      setImages((prev) =>
        prev.map((itm, i) =>
          i === index
            ? { ...itm, status: 'error', errorMessage: err?.message || 'Conversion failed' }
            : itm
        )
      );
    }
  };

  const convertAllImages = async () => {
    if (images.length === 0) return;
    setIsConvertingAll(true);
    for (let i = 0; i < images.length; i++) {
      await convertSingleImage(i);
    }
    setIsConvertingAll(false);
  };

  const downloadImage = (item: ImageFileState, index: number) => {
    if (!item.convertedUrl) return;
    const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
    const ext = formatExtensions[selectedFormat] || 'jpg';
    const link = document.createElement('a');
    link.href = item.convertedUrl;
    link.download = `${baseName}-converted.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (item: ImageFileState, index: number) => {
    if (!item.convertedBlob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        // Clipboard item requires image/png
        if (item.convertedBlob.type === 'image/png') {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': item.convertedBlob })
          ]);
        } else {
          // Convert to png for clipboard
          const img = new Image();
          img.src = item.convertedUrl!;
          await new Promise((r) => (img.onload = r));
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob(async (b) => {
            if (b) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
            }
          }, 'image/png');
        }
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write error', err);
    }
  };

  const removeImage = (index: number) => {
    const item = images[index];
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    images.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });
    setImages([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div id="image-converter-workspace" className="space-y-6">
      {/* Upload Zone */}
      <div
        id="image-drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer group shadow-xl ${
          isDark
            ? 'border-slate-700/80 hover:border-cyan-500/70 bg-[#0d121f]/90 hover:bg-[#0f172a]'
            : 'border-slate-300 hover:border-blue-500/70 bg-white hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg ${
              isDark
                ? 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border-indigo-500/30 text-cyan-400'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-blue-600'}`}>
              {isUrdu
                ? 'تصویر اپ لوڈ یا ڈریگ کریں (JPG, PNG, WebP, BMP)'
                : 'Click to browse or drop your image here'}
            </h3>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isUrdu
                ? 'بیک وقت متعدد تصاویر فوری کنورٹ کریں۔ 100% پرائیویٹ اور براؤزر میں پروسیسنگ۔'
                : 'Supports JPG, PNG, WebP, BMP, AVIF & GIF. 100% Fast Client-Side Processing.'}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              Zero Server Uploads
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              Lossless & WebP Ready
            </span>
          </div>
        </div>
      </div>

      {/* Target Format & Compression Controls */}
      <div className={`border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <Sliders className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <h4 className={`text-sm font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {isUrdu ? 'کنورژن سیٹنگز (Target Format & Quality)' : 'Conversion & Optimization Controls'}
            </h4>
          </div>
          {images.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                id="clear-all-images-btn"
                onClick={clearAll}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'تمام تصاویر ہٹائیں' : 'Clear All'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Target Format Selector */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <FileImage className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-blue-600'}`} />
              <span>{isUrdu ? 'ہدف فارمیٹ منتخب کریں:' : 'Target Output Format:'}</span>
            </label>
            <select
              id="target-format-select"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#070b12] border-slate-700 focus:border-cyan-500 text-slate-100 focus:ring-cyan-500/20'
                  : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800 focus:ring-blue-500/20'
              }`}
            >
              <option value="image/jpeg">JPG / JPEG (.jpg)</option>
              <option value="image/png">PNG (.png)</option>
              <option value="image/webp">WebP (.webp)</option>
              <option value="image/bmp">BMP (.bmp)</option>
            </select>
          </div>

          {/* Quality Slider (for lossy formats) */}
          <div className="space-y-1.5">
            <div className={`flex items-center justify-between text-xs font-semibold ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <span>{isUrdu ? 'کوالٹی ریشو:' : 'Compression Quality:'}</span>
              <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                {Math.round(quality * 100)}%
              </span>
            </div>
            <div className="pt-2">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                disabled={selectedFormat === 'image/png' || selectedFormat === 'image/bmp'}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'bg-slate-800 accent-cyan-500' : 'bg-slate-200 accent-blue-600'
                }`}
              />
              <div className={`flex justify-between text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Smaller File</span>
                <span>Best Quality</span>
              </div>
            </div>
          </div>

          {/* Resolution Presets */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className={`text-xs font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Maximize2 className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-blue-600'}`} />
              <span>{isUrdu ? 'سائز / اسکیل منتخب کریں:' : 'Scale / Dimension Preset:'}</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '100%', val: 1 },
                { label: '75%', val: 0.75 },
                { label: '50%', val: 0.5 },
                { label: '25%', val: 0.25 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setScale(preset.val);
                    setCustomWidth('');
                    setCustomHeight('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    scale === preset.val && !customWidth
                      ? isDark
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-cyan-400/50 shadow-sm'
                        : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : isDark
                      ? 'bg-[#070b12] border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        {images.length > 0 && (
          <div className={`pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-100'
          }`}>
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{images.length}</span> {images.length === 1 ? 'image' : 'images'} loaded • Target: <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>{formatNames[selectedFormat]}</span>
            </div>
            <button
              id="convert-all-images-btn"
              onClick={convertAllImages}
              disabled={isConvertingAll}
              className={`w-full sm:w-auto px-6 py-2.5 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50 text-white ${
                isDark
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {isConvertingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isUrdu ? 'کنورٹ ہو رہا ہے...' : 'Converting All...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isUrdu ? 'تمام تصاویر کنورٹ کریں' : `Convert All to ${formatExtensions[selectedFormat].toUpperCase()}`}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Image Cards Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <ImageIcon className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>{isUrdu ? 'تصاویر کی فہرست اور نتائج' : 'Loaded Files & Conversion Status'}</span>
          </h4>

          <div className="grid grid-cols-1 gap-4">
            {images.map((item, index) => {
              const baseExt = item.file.name.split('.').pop()?.toUpperCase() || 'IMG';
              const targetExt = formatExtensions[selectedFormat].toUpperCase();
              const sizeDelta =
                item.convertedSize !== null
                  ? Math.round(((item.convertedSize - item.originalSize) / item.originalSize) * 100)
                  : null;

              return (
                <div
                  key={index}
                  id={`image-card-${index}`}
                  className={`border rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center gap-4 transition-all ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Thumbnail Preview */}
                  <div className={`relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden border flex items-center justify-center group ${
                    isDark ? 'bg-[#070b12] border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <img
                      src={item.convertedUrl || item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-slate-700">
                      {item.convertedUrl ? targetExt : baseExt}
                    </div>
                  </div>

                  {/* File Metadata & Stats */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold truncate max-w-xs sm:max-w-md ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {item.file.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.originalWidth} × {item.originalHeight} px • {formatFileSize(item.originalSize)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeImage(index)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress / Status Tag */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {item.status === 'ready' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                          isDark ? 'text-amber-400 bg-amber-950/40 border-amber-800/50' : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}>
                          Ready to Convert
                        </span>
                      )}
                      {item.status === 'converting' && (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium animate-pulse ${
                          isDark ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50' : 'text-blue-700 bg-blue-50 border-blue-200'
                        }`}>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Converting...
                        </span>
                      )}
                      {item.status === 'converted' && item.convertedSize && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${
                            isDark ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Converted ({formatFileSize(item.convertedSize)})
                          </span>
                          {sizeDelta !== null && (
                            <span
                              className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                                sizeDelta < 0
                                  ? isDark ? 'text-emerald-400 bg-emerald-950/20' : 'text-emerald-700 bg-emerald-100'
                                  : isDark ? 'text-amber-400 bg-amber-950/20' : 'text-amber-700 bg-amber-100'
                              }`}
                            >
                              {sizeDelta < 0 ? `${sizeDelta}% saved` : `+${sizeDelta}% size`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for this specific file */}
                  <div className={`flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    {item.status !== 'converted' ? (
                      <button
                        onClick={() => convertSingleImage(index)}
                        className={`w-full md:w-auto px-4 py-2 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                          isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Convert</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => copyToClipboard(item, index)}
                          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors border flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                          title="Copy image to clipboard"
                        >
                          {copiedIndex === index ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => downloadImage(item, index)}
                          className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download {targetExt}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
