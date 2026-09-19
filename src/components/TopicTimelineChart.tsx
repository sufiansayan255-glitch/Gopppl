import React, { useState, useId } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, Layers, Activity } from 'lucide-react';
import { TopicTimelinePoint, CommonTopic, AppLanguage } from '../types';

interface TopicTimelineChartProps {
  timeline: TopicTimelinePoint[];
  topics?: CommonTopic[];
  language: AppLanguage;
  theme?: 'light' | 'dark';
}

export const TopicTimelineChart: React.FC<TopicTimelineChartProps> = ({
  timeline,
  topics = [],
  language,
  theme = 'dark'
}) => {
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [activeTopics, setActiveTopics] = useState<Record<string, boolean>>({});
  const filterId = useId();
  const isDark = theme === 'dark';
  const isUrdu = language === 'ur';

  if (!timeline || timeline.length === 0) {
    return null;
  }

  // Fallback topics if not explicitly specified
  const effectiveTopics: CommonTopic[] = topics.length > 0
    ? topics
    : [
        { key: 'features', label: language === 'ur' ? 'فیچرز و کارکردگی' : 'Features & Hardware', color: '#6366f1', totalMentions: 1 },
        { key: 'pricing', label: language === 'ur' ? 'قیمت و آفرز' : 'Pricing & Deals', color: '#f59e0b', totalMentions: 1 },
        { key: 'inquiries', label: language === 'ur' ? 'سوالات و تجسس' : 'User Inquiries', color: '#06b6d4', totalMentions: 1 },
        { key: 'feedback', label: language === 'ur' ? 'صارفین کی آراء' : 'General Feedback', color: '#10b981', totalMentions: 1 }
      ];

  const toggleTopic = (key: string) => {
    setActiveTopics((prev) => {
      const next = { ...prev };
      if (next[key] === false) {
        delete next[key];
      } else {
        next[key] = false;
      }
      return next;
    });
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const segmentDesc =
        label === '0-20%'
          ? isUrdu ? 'ابتدائی پیغامات (Opening)' : 'Opening Phase (0-20%)'
          : label === '20-40%'
          ? isUrdu ? 'ابتدائی گفتگو (Early Discussion)' : 'Early Discussion (20-40%)'
          : label === '40-60%'
          ? isUrdu ? 'درمیانی بحث (Mid-point)' : 'Mid-point Discussion (40-60%)'
          : label === '60-80%'
          ? isUrdu ? 'آخری مرحلہ (Late Flow)' : 'Late Phase (60-80%)'
          : isUrdu ? 'اختتامی ریمارکس (Wrap-up)' : 'Closing Wrap-up (80-100%)';

      const totalInSegment = payload.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0);

      return (
        <div className={`p-3 rounded-xl shadow-2xl border text-xs min-w-[190px] ${
          isDark
            ? 'bg-[#070b12]/95 border-slate-700/80 text-slate-200'
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
        }`}>
          <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
            isDark ? 'border-slate-800 text-slate-200' : 'border-slate-100 text-slate-900'
          }`}>
            <span className="font-bold">{segmentDesc}</span>
            <span className="text-[10px] text-slate-400 font-mono">Total: {totalInSegment}</span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const topicDef = effectiveTopics.find((t) => t.key === entry.dataKey);
              const percentage = totalInSegment > 0 ? Math.round(((Number(entry.value) || 0) / totalInSegment) * 100) : 0;
              return (
                <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.color || topicDef?.color || '#6366f1' }}
                    />
                    <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                      {topicDef?.label || entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{entry.value}</span>
                    <span className="text-[10px] text-slate-400">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="topic-timeline-section" className={`border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Section Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
            isDark ? 'text-indigo-400' : 'text-blue-600'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span>
              {isUrdu
                ? 'موضوعات کا ارتقاء (TOPIC FREQUENCY OVER CONVERSATION LENGTH)'
                : 'TOPIC FREQUENCY OVER CONVERSATION LENGTH'}
            </span>
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isUrdu
              ? 'گفتگو کے دورانیے (0% سے 100%) میں مختلف موضوعات کے زیر بحث آنے کی رفتار کا جائزہ'
              : 'Chronological progression of key discussion themes from start to finish'}
          </p>
        </div>

        {/* Chart Type Toggle Button */}
        <div className={`flex items-center p-1 rounded-xl border self-start sm:self-auto text-xs ${
          isDark ? 'bg-[#070b12] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            id="topic-chart-area-btn"
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              chartType === 'area'
                ? isDark ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'bg-blue-600 text-white font-semibold shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ایریا چارٹ' : 'Area Flow'}</span>
          </button>
          <button
            id="topic-chart-line-btn"
            onClick={() => setChartType('line')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              chartType === 'line'
                ? isDark ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'bg-blue-600 text-white font-semibold shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'لائن چارٹ' : 'Multi-Line'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Topic Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {isUrdu ? 'موضوعات فلٹر کریں:' : 'Filter Topics:'}
        </span>
        {effectiveTopics.map((topic) => {
          const isHidden = activeTopics[topic.key] === false;
          return (
            <button
              key={topic.key}
              id={`filter-topic-${topic.key}`}
              onClick={() => toggleTopic(topic.key)}
              className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                isHidden
                  ? isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-600 line-through opacity-50'
                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-50'
                  : isDark
                  ? 'bg-[#070b12] border-slate-700/80 text-slate-200 hover:border-slate-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: topic.color }}
              />
              <span className="font-semibold">{topic.label}</span>
              {topic.totalMentions > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {topic.totalMentions}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Recharts Visualization Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={timeline} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                {effectiveTopics.map((topic) => (
                  <linearGradient
                    key={`grad-${topic.key}`}
                    id={`gradient-${topic.key}-${filterId}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={topic.color} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={topic.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
              <XAxis
                dataKey="segment"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={30}
                formatter={(value) => {
                  const topic = effectiveTopics.find((t) => t.key === value);
                  return (
                    <span className={`text-xs font-medium px-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {topic?.label || value}
                    </span>
                  );
                }}
              />
              {effectiveTopics.map((topic) => {
                if (activeTopics[topic.key] === false) return null;
                return (
                  <Area
                    key={topic.key}
                    type="monotone"
                    dataKey={topic.key}
                    name={topic.key}
                    stroke={topic.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#gradient-${topic.key}-${filterId})`}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1.5 }}
                  />
                );
              })}
            </AreaChart>
          ) : (
            <LineChart data={timeline} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
              <XAxis
                dataKey="segment"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={30}
                formatter={(value) => {
                  const topic = effectiveTopics.find((t) => t.key === value);
                  return (
                    <span className={`text-xs font-medium px-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {topic?.label || value}
                    </span>
                  );
                }}
              />
              {effectiveTopics.map((topic) => {
                if (activeTopics[topic.key] === false) return null;
                return (
                  <Line
                    key={topic.key}
                    type="monotone"
                    dataKey={topic.key}
                    name={topic.key}
                    stroke={topic.color}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 1.5, fill: isDark ? '#090d16' : '#ffffff', stroke: topic.color }}
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Conversation Phase Markers Footnote */}
      <div className={`grid grid-cols-5 gap-1 text-center pt-1 border-t ${
        isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-100 text-slate-400'
      }`}>
        <div className="text-[10px] font-medium">0% Start</div>
        <div className="text-[10px] font-medium">25% Early</div>
        <div className="text-[10px] font-medium">50% Mid-point</div>
        <div className="text-[10px] font-medium">75% Deep-dive</div>
        <div className="text-[10px] font-medium">100% Finish</div>
      </div>
    </div>
  );
};
