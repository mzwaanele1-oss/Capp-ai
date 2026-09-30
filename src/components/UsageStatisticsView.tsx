import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Wrench,
  Globe,
  Sparkles,
  Volume2,
  FileDown,
  Layers,
  Calendar,
  Zap,
  Info,
} from 'lucide-react';
import { Conversation } from '../types';
import { getDailyUsageStats, DailyUsageStats, ToolType } from '../utils/usageTracking';

interface UsageStatisticsViewProps {
  conversations: Conversation[];
}

type TimeRange = 7 | 14 | 30;
type ChartTab = 'both' | 'messages' | 'tools';

export const UsageStatisticsView: React.FC<UsageStatisticsViewProps> = ({ conversations }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [chartTab, setChartTab] = useState<ChartTab>('both');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute daily data for selected time range
  const dailyData: DailyUsageStats[] = useMemo(() => {
    return getDailyUsageStats(conversations, timeRange);
  }, [conversations, timeRange]);

  // Aggregate summary totals
  const summary = useMemo(() => {
    let totalMessages = 0;
    let userMessages = 0;
    let assistantMessages = 0;
    let totalWords = 0;
    let totalTools = 0;
    let activeDays = 0;

    const toolTotals: Record<ToolType, number> = {
      web_search: 0,
      image_studio: 0,
      speech_tts: 0,
      pdf_export: 0,
      markdown_export: 0,
      creative_tool: 0,
    };

    dailyData.forEach((day) => {
      totalMessages += day.totalMessages;
      userMessages += day.userMessages;
      assistantMessages += day.assistantMessages;
      totalWords += day.estimatedWords;
      totalTools += day.toolUsage.total;

      if (day.totalMessages > 0 || day.toolUsage.total > 0) {
        activeDays++;
      }

      toolTotals.web_search += day.toolUsage.web_search;
      toolTotals.image_studio += day.toolUsage.image_studio;
      toolTotals.speech_tts += day.toolUsage.speech_tts;
      toolTotals.pdf_export += day.toolUsage.pdf_export;
      toolTotals.markdown_export += day.toolUsage.markdown_export;
      toolTotals.creative_tool += day.toolUsage.creative_tool;
    });

    const avgDailyMessages = (totalMessages / timeRange).toFixed(1);

    return {
      totalMessages,
      userMessages,
      assistantMessages,
      totalWords,
      totalTools,
      activeDays,
      avgDailyMessages,
      toolTotals,
    };
  }, [dailyData, timeRange]);

  // Calculate maximum values for SVG scaling
  const maxMessageCount = useMemo(() => {
    const maxVal = Math.max(...dailyData.map((d) => d.totalMessages), 1);
    // Round up to nice step
    return Math.ceil(maxVal / 5) * 5 || 5;
  }, [dailyData]);

  const maxToolCount = useMemo(() => {
    const maxVal = Math.max(...dailyData.map((d) => d.toolUsage.total), 1);
    return Math.ceil(maxVal / 5) * 5 || 5;
  }, [dailyData]);

  // Tool categories metadata
  const toolCategories = [
    {
      key: 'web_search' as ToolType,
      label: 'Web Grounding',
      icon: Globe,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      stroke: '#10b981',
      count: summary.toolTotals.web_search,
    },
    {
      key: 'image_studio' as ToolType,
      label: 'Image Studio',
      icon: Sparkles,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      stroke: '#6366f1',
      count: summary.toolTotals.image_studio,
    },
    {
      key: 'speech_tts' as ToolType,
      label: 'Speech Audio',
      icon: Volume2,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      stroke: '#f59e0b',
      count: summary.toolTotals.speech_tts,
    },
    {
      key: 'pdf_export' as ToolType,
      label: 'PDF Export',
      icon: FileDown,
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      stroke: '#f43f5e',
      count: summary.toolTotals.pdf_export,
    },
    {
      key: 'creative_tool' as ToolType,
      label: 'Creative Tools',
      icon: Zap,
      color: 'bg-sky-500',
      textColor: 'text-sky-400',
      stroke: '#0ea5e9',
      count: summary.toolTotals.creative_tool,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Usage Statistics & Analytics</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Visualize your conversation volume and AI tool usage trends over time.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800 self-start sm:self-auto">
          {([7, 14, 30] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {range} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Messages Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Messages</span>
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {summary.totalMessages}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>{summary.userMessages} user</span>
            <span>•</span>
            <span>{summary.assistantMessages} bot</span>
          </div>
        </div>

        {/* Words Processed Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Words</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {summary.totalWords > 1000
              ? `${(summary.totalWords / 1000).toFixed(1)}k`
              : summary.totalWords}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1 truncate">
            {summary.totalWords.toLocaleString()} est. words
          </div>
        </div>

        {/* Tool Invocations Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tool Uses</span>
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {summary.totalTools}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Web, Vision, Speech</div>
        </div>

        {/* Active Days Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg / Day</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {summary.avgDailyMessages}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">
            {summary.activeDays} active {summary.activeDays === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Chart Selector View Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setChartTab('both')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            chartTab === 'both'
              ? 'bg-neutral-800 text-white border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Combined Overview
        </button>
        <button
          onClick={() => setChartTab('messages')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            chartTab === 'messages'
              ? 'bg-neutral-800 text-white border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Message Volume
        </button>
        <button
          onClick={() => setChartTab('tools')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            chartTab === 'tools'
              ? 'bg-neutral-800 text-white border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Tool Usage Trends
        </button>
      </div>

      {/* Interactive Charts Area */}
      <div className="space-y-6">
        {/* CHART 1: Message Volume Trend */}
        {(chartTab === 'both' || chartTab === 'messages') && (
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Message Volume Trend
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
                  User Prompts
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
                  AI Responses
                </span>
              </div>
            </div>

            {/* SVG Bar Chart for Message Volume */}
            <div className="relative h-48 w-full select-none pt-2">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Horizontal Guide Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 14 + (1 - ratio) * 120;
                  const labelValue = Math.round(maxMessageCount * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1="32"
                        y1={y}
                        x2="100%"
                        y2={y}
                        stroke="#262626"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x="24"
                        y={y + 3.5}
                        fill="#737373"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {labelValue}
                      </text>
                    </g>
                  );
                })}

                {/* Bars per day */}
                {dailyData.map((d, index) => {
                  const n = dailyData.length;
                  const barAreaWidth = 100 / n;
                  const xCenter = (index + 0.5) * barAreaWidth;
                  const barWidthPct = Math.min(barAreaWidth * 0.6, 6);

                  const userHeight = (d.userMessages / maxMessageCount) * 120;
                  const botHeight = (d.assistantMessages / maxMessageCount) * 120;
                  const totalHeight = userHeight + botHeight;

                  const isHovered = hoveredIndex === index;

                  return (
                    <g
                      key={d.dateStr}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      {/* Background hover highlight */}
                      {isHovered && (
                        <rect
                          x={`${xCenter - barAreaWidth * 0.45}%`}
                          y="10"
                          width={`${barAreaWidth * 0.9}%`}
                          height="132"
                          fill="#262626"
                          opacity="0.5"
                          rx="6"
                        />
                      )}

                      {/* Stacked Bar: User Message (Bottom) */}
                      {userHeight > 0 && (
                        <rect
                          x={`${xCenter - barWidthPct / 2}%`}
                          y={134 - userHeight}
                          width={`${barWidthPct}%`}
                          height={userHeight}
                          fill="#0284c7"
                          rx={botHeight > 0 ? 0 : 2}
                          className="transition-all duration-200"
                        />
                      )}

                      {/* Stacked Bar: Assistant Message (Top) */}
                      {botHeight > 0 && (
                        <rect
                          x={`${xCenter - barWidthPct / 2}%`}
                          y={134 - totalHeight}
                          width={`${barWidthPct}%`}
                          height={botHeight}
                          fill="#6366f1"
                          rx={2}
                          className="transition-all duration-200"
                        />
                      )}

                      {/* Zero State Dot if 0 messages */}
                      {totalHeight === 0 && (
                        <circle
                          cx={`${xCenter}%`}
                          cy="133"
                          r="1.5"
                          fill="#404040"
                        />
                      )}

                      {/* X-Axis Day Labels */}
                      <text
                        x={`${xCenter}%`}
                        y="152"
                        fill={isHovered ? '#ffffff' : '#737373'}
                        fontSize="9"
                        textAnchor="middle"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {timeRange === 30 ? (index % 5 === 0 ? d.label : '') : d.dayOfWeek}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredIndex !== null && dailyData[hoveredIndex] && (
                <div
                  className="absolute -top-3 z-30 pointer-events-none transform -translate-x-1/2 p-2 rounded-xl bg-neutral-900 border border-neutral-700 shadow-xl text-xs space-y-1"
                  style={{
                    left: `${((hoveredIndex + 0.5) / dailyData.length) * 100}%`,
                  }}
                >
                  <div className="font-semibold text-white border-b border-neutral-800 pb-1">
                    {dailyData[hoveredIndex].label} ({dailyData[hoveredIndex].dayOfWeek})
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sky-400">
                    <span>User:</span>
                    <span className="font-mono font-bold">
                      {dailyData[hoveredIndex].userMessages}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-indigo-400">
                    <span>CAPP AI:</span>
                    <span className="font-mono font-bold">
                      {dailyData[hoveredIndex].assistantMessages}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-neutral-300 font-bold border-t border-neutral-800 pt-1">
                    <span>Total:</span>
                    <span className="font-mono">{dailyData[hoveredIndex].totalMessages}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHART 2: Tool Usage Trends */}
        {(chartTab === 'both' || chartTab === 'tools') && (
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Tool Usage Trends
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Web
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  Images
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Speech
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  PDF
                </span>
              </div>
            </div>

            {/* SVG Area / Multi-line Chart for Tools */}
            <div className="relative h-48 w-full select-none pt-2">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Horizontal Guide Lines */}
                {[0, 0.5, 1].map((ratio) => {
                  const y = 14 + (1 - ratio) * 120;
                  const labelValue = Math.round(maxToolCount * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1="32"
                        y1={y}
                        x2="100%"
                        y2={y}
                        stroke="#262626"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x="24"
                        y={y + 3.5}
                        fill="#737373"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {labelValue}
                      </text>
                    </g>
                  );
                })}

                {/* Total Tool Usage Area Path */}
                {(() => {
                  const points = dailyData.map((d, index) => {
                    const xPct = ((index + 0.5) / dailyData.length) * 100;
                    const y = 134 - (d.toolUsage.total / maxToolCount) * 120;
                    return `${xPct},${y}`;
                  });

                  if (points.length < 2) return null;

                  const firstXPct = (0.5 / dailyData.length) * 100;
                  const lastXPct = ((dailyData.length - 0.5) / dailyData.length) * 100;
                  const areaPoints = `${firstXPct},134 ${points.join(' ')} ${lastXPct},134`;

                  return (
                    <g>
                      <polygon points={areaPoints} fill="url(#toolGradient)" opacity="0.25" />
                      <polyline
                        points={points.join(' ')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })()}

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="toolGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Points on line per day */}
                {dailyData.map((d, index) => {
                  const xPct = ((index + 0.5) / dailyData.length) * 100;
                  const y = 134 - (d.toolUsage.total / maxToolCount) * 120;
                  const isHovered = hoveredIndex === index;

                  return (
                    <g key={d.dateStr}>
                      <circle
                        cx={`${xPct}%`}
                        cy={y}
                        r={isHovered ? '4.5' : '3'}
                        fill={isHovered ? '#ffffff' : '#10b981'}
                        stroke="#0a0a0a"
                        strokeWidth="1.5"
                        className="transition-all"
                      />
                      <text
                        x={`${xPct}%`}
                        y="152"
                        fill={isHovered ? '#ffffff' : '#737373'}
                        fontSize="9"
                        textAnchor="middle"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {timeRange === 30 ? (index % 5 === 0 ? d.label : '') : d.dayOfWeek}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Tool Distribution Cards */}
      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>Feature & Tool Usage Breakdown ({timeRange} Days)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {toolCategories.map((tool) => {
            const Icon = tool.icon;
            const pct =
              summary.totalTools > 0
                ? Math.round((tool.count / summary.totalTools) * 100)
                : 0;

            return (
              <div
                key={tool.key}
                className="p-3 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-neutral-800 ${tool.textColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{tool.label}</div>
                    <div className="text-[10px] text-neutral-400">
                      {tool.count} uses • {pct}% of tools
                    </div>
                  </div>
                </div>

                <div className="w-20">
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tool.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {summary.totalTools === 0 && summary.totalMessages === 0 && (
          <div className="mt-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Start asking questions, uploading screenshots for Image Studio analysis, or exporting
              transcripts to see live trends visualized here!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
