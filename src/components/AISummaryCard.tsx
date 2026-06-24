import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Flame, Clock, BrainCircuit, RefreshCw, Zap, Trophy } from "lucide-react";
import { UserProfile } from "../types";

interface AISummaryData {
  success: boolean;
  hasScore: boolean;
  score: number;
  category: string;
  coachingHeadline: string;
  strategicAdvice: string;
  actionSteps: string[];
  estimatedTimeMinutes: string;
}

interface AISummaryCardProps {
  user: UserProfile;
  onNavigate: (tabId: "launch" | "leaderboard" | "history") => void;
  // Triggered when an assessment finishes, so we can re-fetch
  refreshTrigger?: number;
}

export default function AISummaryCard({ user, onNavigate, refreshTrigger }: AISummaryCardProps) {
  const [data, setData] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdvice = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await fetch(`/api/assessment/ai-career-summary?candidateId=${user.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load AI career coaching summary card:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [user.id, refreshTrigger]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAdvice();
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center space-y-3 shadow-xs" id="ai-summary-loader">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-mono">Synthesizing personalized learning telemetry...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div 
      className="bg-gradient-to-r from-indigo-900/95 via-slate-900/95 to-slate-950 text-white rounded-2xl border border-indigo-950 shadow-md relative overflow-hidden" 
      id="ai-summary-card"
    >
      {/* Decorative ambient blobs */}
      <div className="absolute right-0 top-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl"></div>
      <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl"></div>

      <div className="p-5 sm:p-6 relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start">
        
        {/* Left main content block */}
        <div className="space-y-4 flex-grow max-w-2xl">
          
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 rounded-full text-[10px] font-bold tracking-wider text-indigo-300 flex items-center gap-1 uppercase font-mono">
                <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                <span>AI Career Advisor Insights</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Powered by Gemini 3.5</span>
            </div>

            <button 
              onClick={handleManualRefresh} 
              disabled={refreshing}
              className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              title="Recalculate career advice dashboard scorecard"
              id="refresh-ai-advice-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>

          {/* Headline & Strategic Paragraph */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-black tracking-tight text-white font-sans flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{data.coachingHeadline}</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed font-sans">
              {data.strategicAdvice}
            </p>
          </div>

          {/* Actionable points */}
          <div className="space-y-2.5" id="ai-action-steps-list">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
              Strategic Skills Development Blueprint
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.actionSteps.map((step, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-2 items-start hover:bg-white/10 transition"
                  id={`ai-step-${idx}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-200 leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right metrics and action console */}
        <div className="w-full md:w-56 shrink-0 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between h-full space-y-4 self-stretch" id="ai-advice-console">
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Metrics Bench</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 font-bold rounded">
                {data.category}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Flame className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-mono">Latest Peak Score</span>
                <span className="text-sm font-black text-white font-sans">
                  {data.hasScore ? `${data.score}%` : "Not Ranked"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Clock className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-mono">Study Target</span>
                <span className="text-sm font-black text-white font-sans">{data.estimatedTimeMinutes}</span>
              </div>
            </div>
          </div>

          {/* Quick interactive navigation links */}
          <div className="pt-2.5 border-t border-white/5 flex flex-col gap-1.5" id="advice-navigation-group">
            <button
              onClick={() => onNavigate("launch")}
              className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] rounded-lg transition shadow-3xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Launch Assessment</span>
            </button>
            <button
              onClick={() => onNavigate("leaderboard")}
              className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Trophy className="w-3 h-3 text-indigo-400" />
              <span>Global Standings</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
