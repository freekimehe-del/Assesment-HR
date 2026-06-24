import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ListTodo, 
  GraduationCap, 
  Brain, 
  Loader2 
} from "lucide-react";

interface StrengthsWeaknessesModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId: string | null;
}

interface AnalysisResult {
  strengths: { area: string; description: string }[];
  weaknesses: { area: string; description: string }[];
  summary: string;
  actionPlan: string[];
}

export default function StrengthsWeaknessesModal({ isOpen, onClose, attemptId }: StrengthsWeaknessesModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!isOpen || !attemptId) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/assessment/analyze-strengths-weaknesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId })
        });
        if (!res.ok) {
          throw new Error("Failed to generate AI feedback analysis.");
        }
        const data = await res.json();
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
        } else {
          throw new Error(data.error || "Analysis response structure was invalid.");
        }
      } catch (err: any) {
        console.error("AI Analysis Fetch Error:", err);
        setError(err.message || "An unexpected error occurred while communicating with the AI server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [isOpen, attemptId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="ai-analysis-modal-portal">
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            id="ai-analysis-modal-overlay"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            id="ai-analysis-modal-content"
          >
            {/* Elegant Header with Sparkly Accent */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 flex items-center justify-between" id="ai-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 animate-pulse">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    AI Post-Assessment Evaluation
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700 uppercase tracking-wider">
                      <Sparkles className="w-2.5 h-2.5" />
                      Gemini Advisor
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Detailed strengths, growth opportunities, and customized learning blueprints</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                id="close-analysis-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5" id="ai-modal-scrollable-body">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <Sparkles className="w-4 h-4 text-purple-500 absolute animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 font-mono">Analyzing screening performance logs...</p>
                    <p className="text-[10px] text-slate-400 max-w-xs">AI is auditing technical answers, compiling algorithmic constraints, and framing custom advice.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-850">Failed to generate AI Advisor summary</p>
                    <p className="text-[11px] text-rose-600 max-w-md bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 font-mono">{error}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
                  >
                    Close Advisor Panel
                  </button>
                </div>
              ) : analysis ? (
                <div className="space-y-5">
                  {/* Summary Callout Banner */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl relative overflow-hidden" id="ai-analysis-summary-card">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                    <div className="flex gap-3">
                      <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Executive Summary Scorecard</span>
                        <p className="text-[12px] text-slate-700 italic leading-relaxed mt-1 font-medium font-sans">
                          "{analysis.summary}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Columns Grid: Strengths vs Growth Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="ai-strengths-weaknesses-grid">
                    {/* Strengths Column */}
                    <div className="p-4 bg-emerald-50/35 border border-emerald-100 rounded-xl space-y-3" id="ai-strengths-panel">
                      <div className="flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h4 className="font-bold text-xs text-emerald-800">Verified Technical Strengths</h4>
                      </div>
                      <div className="space-y-3">
                        {analysis.strengths.map((str, i) => (
                          <div key={i} className="space-y-0.5">
                            <span className="font-bold text-[11px] text-emerald-900 block font-sans">{str.area}</span>
                            <span className="text-[10.5px] text-slate-600 block leading-normal">{str.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weaknesses / Growth Areas Column */}
                    <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl space-y-3" id="ai-weaknesses-panel">
                      <div className="flex items-center gap-1.5 border-b border-amber-100 pb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <h4 className="font-bold text-xs text-amber-800 font-sans">Targeted Growth Opportunities</h4>
                      </div>
                      <div className="space-y-3">
                        {analysis.weaknesses.map((weak, i) => (
                          <div key={i} className="space-y-0.5">
                            <span className="font-bold text-[11px] text-amber-900 block font-sans">{weak.area}</span>
                            <span className="text-[10.5px] text-slate-600 block leading-normal">{weak.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customized Interactive Action Plan / Syllabus */}
                  <div className="p-4.5 bg-indigo-50/15 border border-indigo-100 rounded-xl space-y-3" id="ai-action-plan-panel">
                    <div className="flex items-center gap-1.5 border-b border-indigo-100/50 pb-2">
                      <ListTodo className="w-4 h-4 text-indigo-600 shrink-0" />
                      <h4 className="font-bold text-xs text-indigo-900">Custom Architectural Action Plan</h4>
                    </div>
                    <div className="space-y-2.5">
                      {analysis.actionPlan.map((step, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <span className="w-4.5 h-4.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                            {idx + 1}
                          </span>
                          <p className="text-[11px] text-slate-700 leading-normal font-medium">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Elegant Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between" id="ai-modal-footer">
              <span className="text-[9px] text-slate-400 font-mono">
                System: Gemini Evaluation Nodes (Active Assessment Telemetry v3.5)
              </span>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-3xs"
                id="close-analysis-modal-footer-btn"
              >
                Dismiss Advisor
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
