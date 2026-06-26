/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Editor from "@monaco-editor/react";
import { AssessmentAttempt, Question, ProctoringLog, AICodeReviewResult } from "../types";
import { 
  ShieldAlert, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Code, 
  Bug, 
  Compass, 
  TrendingUp,
  Award,
  BookOpen,
  Terminal,
  FileText,
  Lightbulb,
  Zap,
  Check,
  LogOut,
  Sun,
  Moon,
  Keyboard,
  Grid
} from "lucide-react";

interface AssessmentEngineProps {
  attempt: AssessmentAttempt;
  onComplete: (score?: number, category?: string, certId?: string) => void;
  onExit: () => void;
}

export default function AssessmentEngine(props: AssessmentEngineProps) {
  const [attempt, setAttempt] = useState<AssessmentAttempt>(() => {
    const base = props.attempt;
    try {
      const localData = localStorage.getItem(`techscreen_assessment_draft_${base.id}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && parsed.answers) {
          return {
            ...base,
            answers: {
              ...base.answers,
              ...parsed.answers
            }
          };
        }
      }
    } catch (e) {
      console.error("Failed to restore initial local storage draft:", e);
    }
    return base;
  });

  const [currentIdx, setCurrentIdx] = useState(() => {
    try {
      const localData = localStorage.getItem(`techscreen_assessment_draft_${props.attempt.id}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && typeof parsed.currentIdx === "number" && parsed.currentIdx < props.attempt.questions.length && parsed.currentIdx >= 0) {
          return parsed.currentIdx;
        }
      }
    } catch (e) {
      console.error("Failed to restore initial currentIdx:", e);
    }
    return 0;
  });

  const activeQuestion = attempt.questions[currentIdx];
  
  // Timer States
  const [overallRemaining, setOverallRemaining] = useState(() => {
    try {
      const localData = localStorage.getItem(`techscreen_assessment_draft_${props.attempt.id}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && typeof parsed.overallRemaining === "number" && parsed.overallRemaining > 0) {
          return parsed.overallRemaining;
        }
      }
    } catch (e) {
      console.error("Failed to restore overallRemaining:", e);
    }
    return attempt.questions.reduce((sum, q) => sum + q.timeAllocation, 0);
  });

  const [questionRemaining, setQuestionRemaining] = useState(() => {
    try {
      const localData = localStorage.getItem(`techscreen_assessment_draft_${props.attempt.id}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && typeof parsed.questionRemaining === "number" && parsed.questionRemaining > 0) {
          return parsed.questionRemaining;
        }
      }
    } catch (e) {
      console.error("Failed to restore questionRemaining:", e);
    }
    return activeQuestion?.timeAllocation || 60;
  });

  // Answer tracking
  const [selectedMcq, setSelectedMcq] = useState<string | string[]>("");
  const [fillInText, setFillInText] = useState("");
  
  // Code Editor States
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [showShortcuts, setShowShortcuts] = useState(false);

  // AI Review States
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<AICodeReviewResult | null>(null);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // Scratchpad States for non-coding questions
  const [scratchpadText, setScratchpadText] = useState("");
  const [scratchpadLanguage, setScratchpadLanguage] = useState("sql");
  const [scratchpadIsGenerating, setScratchpadIsGenerating] = useState(false);
  const [scratchpadExplanation, setScratchpadExplanation] = useState<string | null>(null);
  const [scratchpadTips, setScratchpadTips] = useState<string[]>([]);
  const [scratchpadIntegrityText, setScratchpadIntegrityText] = useState<string | null>(null);
  const [scratchpadActiveTab, setScratchpadActiveTab] = useState<"editor" | "ai">("editor");
  const [scratchpadConsole, setScratchpadConsole] = useState("");
  const [isScratchpadDryRunning, setIsScratchpadDryRunning] = useState(false);

  const runScratchpadDryRun = () => {
    setIsScratchpadDryRunning(true);
    setScratchpadConsole("Initializing temporary dry-run thread...\nEvaluating query syntax rules...");
    setTimeout(() => {
      const lower = scratchpadText.toLowerCase();
      let logs = `[Dry-run ${new Date().toLocaleTimeString()}] Target environment: Mock In-Memory DB Node\n`;
      if (!scratchpadText.trim()) {
        logs += "⚠️ WARNING: Sandbox workspace is completely empty. Write your dry-run query or notes above.";
      } else if (scratchpadLanguage === "sql") {
        if (lower.includes("select") && lower.includes("from")) {
          logs += "✅ Query parsed successfully.\nRows affected: 0 (Read-Only Mode)\nSchema validation: PASS\nOutput Schema: [Computed columns match specification tags]";
        } else {
          logs += "ℹ&nbsp; Text parsed successfully as notes.\nTip: Use standard SQL 'SELECT ... FROM ...' to run table dry-runs.";
        }
      } else {
        logs += "✅ Notes compile dry-run: PASS\nSyntax validator: No issues detected in draft thread.";
      }
      setScratchpadConsole(logs);
      setIsScratchpadDryRunning(false);
    }, 1000);
  };

  const handleQueryScratchpadExplain = async () => {
    setScratchpadIsGenerating(true);
    setScratchpadActiveTab("ai");
    try {
      const res = await fetch("/api/assessment/scratchpad-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionTitle: activeQuestion.title,
          questionDescription: activeQuestion.description,
          scratchpadText
        })
      });
      const data = await res.json();
      if (res.ok) {
        setScratchpadExplanation(data.explanation);
        setScratchpadTips(data.conceptualTips || []);
        setScratchpadIntegrityText(data.integrityWarning || "");
      } else {
        alert(data.error || "Could not retrieve conceptual explanation.");
      }
    } catch (err) {
      console.error("Scratchpad AI call failed:", err);
    } finally {
      setScratchpadIsGenerating(false);
    }
  };

  // Proctor Logs States
  const [proctorFlags, setProctorFlags] = useState<ProctoringLog[]>([]);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Concurrency Guard
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);

  // Timers Refs
  const lastTimeRef = useRef<number>(Date.now());

  // Input states refs to avoid stale interval closures
  const codeRef = useRef(code);
  const selectedMcqRef = useRef(selectedMcq);
  const fillInTextRef = useRef(fillInText);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    selectedMcqRef.current = selectedMcq;
  }, [selectedMcq]);

  useEffect(() => {
    fillInTextRef.current = fillInText;
  }, [fillInText]);

  // Save current question's live input and timer values to localStorage
  useEffect(() => {
    if (!activeQuestion) return;
    
    let currentAns: any = "";
    if (activeQuestion.type === "coding") {
      currentAns = code;
    } else if (activeQuestion.type === "fill_in_blank") {
      currentAns = fillInText;
    } else {
      currentAns = selectedMcq;
    }

    try {
      const storageKey = `techscreen_assessment_draft_${attempt.id}`;
      const localData = localStorage.getItem(storageKey);
      let existingAnswers = { ...attempt.answers };
      
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && parsed.answers) {
          existingAnswers = { ...parsed.answers };
        }
      }
      
      existingAnswers[activeQuestion.id] = currentAns;

      const payload = {
        answers: existingAnswers,
        currentIdx,
        overallRemaining,
        questionRemaining,
        lastSavedAt: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save draft to localStorage:", e);
    }
  }, [code, fillInText, selectedMcq, currentIdx, overallRemaining, questionRemaining, attempt.id, activeQuestion]);

  // Editor scroll ref and handler
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Real-time progress and pacing calculations
  const totalTime = React.useMemo(() => {
    return attempt.questions.reduce((sum, q) => sum + q.timeAllocation, 0);
  }, [attempt.questions]);

  const overallTimeRatio = overallRemaining / Math.max(1, totalTime);
  const questionTimeRatio = questionRemaining / Math.max(1, activeQuestion?.timeAllocation || 60);

  const answeredCount = React.useMemo(() => {
    return attempt.questions.filter(q => {
      const ans = attempt.answers[q.id];
      if (Array.isArray(ans)) return ans.length > 0;
      return ans !== undefined && ans !== null && ans !== "";
    }).length;
  }, [attempt.answers, attempt.questions]);

  const completionPercent = Math.min(100, Math.round((answeredCount / Math.max(1, attempt.questions.length)) * 100));

  // Pacing alerts
  const { pacingStatus, pacingAdvice, pacingWarning } = React.useMemo(() => {
    const remainingQuestionsCount = attempt.questions.length - answeredCount;
    if (questionRemaining < 15) {
      return {
        pacingStatus: "Question Timeout Warning!",
        pacingAdvice: "The timer for this specific question is almost up. Save or submit your current response.",
        pacingWarning: true
      };
    }

    const avgTimePerRemainingQuestion = remainingQuestionsCount > 0 ? overallRemaining / remainingQuestionsCount : 0;
    const avgAllocation = totalTime / attempt.questions.length;

    if (remainingQuestionsCount === 0) {
      return {
        pacingStatus: "All Questions Attempted",
        pacingAdvice: "Great work! Review your answers or submit your assessment to complete.",
        pacingWarning: false
      };
    }

    const formatSeconds = (totalSec: number) => {
      const m = Math.floor(totalSec / 60);
      const s = Math.round(totalSec % 60);
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    if (avgTimePerRemainingQuestion >= avgAllocation * 0.95) {
      return {
        pacingStatus: "Pacing Status: Excellent",
        pacingAdvice: `You have an average of ${formatSeconds(avgTimePerRemainingQuestion)} per remaining question. You're set up for success at this pace!`,
        pacingWarning: false
      };
    } else if (avgTimePerRemainingQuestion >= avgAllocation * 0.7) {
      return {
        pacingStatus: "Pacing Status: On Track",
        pacingAdvice: `You have an average of ${formatSeconds(avgTimePerRemainingQuestion)} remaining per question. Maintain this steady rate.`,
        pacingWarning: false
      };
    } else {
      return {
        pacingStatus: "Pacing Status: Slightly Behind",
        pacingAdvice: `You only have ${formatSeconds(avgTimePerRemainingQuestion)} per remaining question. Consider picking up the pace.`,
        pacingWarning: true
      };
    }
  }, [attempt.questions, answeredCount, overallRemaining, questionRemaining, totalTime]);

  // Restore existing answer if candidate has saved any
  useEffect(() => {
    const savedAns = attempt.answers[activeQuestion.id];
    if (activeQuestion.type === "coding") {
      setEditorLanguage(attempt.selectedLanguage || "javascript");
      const starter = activeQuestion.starterCode?.[attempt.selectedLanguage || "javascript"] || "";
      setCode(savedAns ? String(savedAns) : starter);
    } else if (activeQuestion.type === "fill_in_blank") {
      setFillInText(savedAns ? String(savedAns) : "");
    } else {
      setSelectedMcq(savedAns || "");
    }

    // For non-coding questions, initialize scratchpad with proper defaults
    if (activeQuestion.type !== "coding") {
      setScratchpadText("");
      setScratchpadExplanation(null);
      setScratchpadTips([]);
      setScratchpadIntegrityText(null);
      setScratchpadActiveTab("editor");
      setScratchpadConsole("");
      const hasSqlTag = activeQuestion.tags.some(t => {
        const lowerT = t.toLowerCase();
        return lowerT.includes("sql") || lowerT.includes("database") || lowerT.includes("query");
      });
      setScratchpadLanguage(hasSqlTag ? "sql" : "notes");
    }

    setQuestionRemaining(activeQuestion.timeAllocation);
  }, [currentIdx, activeQuestion]);

  // Handle automatic count downs
  useEffect(() => {
    const interval = setInterval(() => {
      setOverallRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmission(true);
          return 0;
        }
        return prev - 1;
      });

      setQuestionRemaining(prev => {
        if (prev <= 1) {
          // Question specific limit expired - save and move forward
          handleNextQuestion(true);
          return activeQuestion.timeAllocation;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIdx, activeQuestion]);

  // ==========================================
  // SECURE PROCTOR CONTROLS (Module 6)
  // ==========================================
  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);

    // 1. Tab switching (Blur events)
    const handleBlur = () => {
      logProctorEvent("tab_switch", "Candidate blurred workspace. Possible secondary lookup or communication.");
    };

    // 2. Fullscreen exit check
    const handleFullscreenExit = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        logProctorEvent("fullscreen_exit", "Candidate exited enforced fullscreen workspace frame.");
      }
    };

    // 3. Prevent Copy, Cut, Paste
    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logProctorEvent("copy_paste_attempt", "Copy, cut or paste action blocked inside delivery environment.");
    };

    // 4. Window resize logs
    const handleResize = () => {
      logProctorEvent("resize", `Window size mutated to W: ${window.innerWidth}px, H: ${window.innerHeight}px`);
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenExit);
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    window.addEventListener("resize", handleResize);

    // Prompt user to enter fullscreen on initialization for compliance
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenExit);
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const logProctorEvent = async (type: ProctoringLog["eventType"], details: string) => {
    try {
      const res = await fetch("/api/assessment/proctor-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id, eventType: type, details })
      });
      const data = await res.json();
      if (res.ok) {
        setIntegrityScore(data.integrityScore);
        const log: ProctoringLog = { timestamp: new Date().toISOString(), eventType: type, details };
        setProctorFlags(prev => [log, ...prev]);
      }
    } catch (err) {
      console.error("Proctor communication failed:", err);
    }
  };

  // ==========================================
  // CORE QUESTION NAVIGATION & STATE SYNC
  // ==========================================
  const handleSaveCurrentState = async (autoExpired = false) => {
    // Determine target answer string
    let currentAns: any = "";
    if (activeQuestion.type === "coding") {
      currentAns = codeRef.current;
    } else if (activeQuestion.type === "fill_in_blank") {
      currentAns = fillInTextRef.current;
    } else {
      currentAns = selectedMcqRef.current;
    }

    // Measure time spent
    const now = Date.now();
    const timeSpent = Math.round((now - lastTimeRef.current) / 1000);
    lastTimeRef.current = now;

    try {
      await fetch("/api/assessment/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId: activeQuestion.id,
          answer: currentAns,
          timeSpent,
          currentQuestionIndex: currentIdx
        })
      });

      // Update local state copy safely
      setAttempt(prev => {
        const updatedAnswers = { ...prev.answers, [activeQuestion.id]: currentAns };
        return {
          ...prev,
          answers: updatedAnswers
        };
      });
    } catch (err) {
      console.error("Save answer failed:", err);
    }
  };

  const handleNextQuestion = async (autoExpired = false) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);
    try {
      await handleSaveCurrentState(autoExpired);
      if (currentIdx < attempt.questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        await handleFinalSubmission(false);
      }
    } finally {
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }
  };

  const handlePrevQuestion = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);
    try {
      await handleSaveCurrentState();
      if (currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
      }
    } finally {
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }
  };

  // Switch compiler starter code when language select updates
  const handleLanguageChange = (lang: string) => {
    setEditorLanguage(lang);
    const starter = activeQuestion.starterCode?.[lang] || "";
    setCode(starter);
    setAttempt(prev => ({
      ...prev,
      selectedLanguage: lang
    }));
  };

  // Configure keybindings and behaviors on Monaco load
  const handleEditorMount = (editor: any, monaco: any) => {
    // Custom save hotkey Cmd+S / Ctrl+S inside Monaco
    editor.addAction({
      id: "quick-save-progress",
      label: "Quick Save Assessment Progress",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        handleSaveCurrentState();
        return null;
      }
    });

    // Custom format hint hotkey
    editor.addAction({
      id: "monaco-format-hint",
      label: "View Formatting Guidelines",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      run: () => {
        alert("Pro-tip: Code is auto-formatted by Monaco. Use Alt + Shift + F (on Windows/Linux) or Option + Shift + F (on macOS) for instant neat blocks!");
        return null;
      }
    });
  };

  // ==========================================
  // INTERACTIVE SANDBOX COMPILER (Module 7)
  // ==========================================
  const runCodeSandbox = async () => {
    setIsCompiling(true);
    setConsoleOutput("Initializing standard sandbox isolated runner...\nBuilding typescript abstract dependencies...");
    
    try {
      const res = await fetch("/api/assessment/compile-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: editorLanguage,
          code,
          testCases: activeQuestion.testCases
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setConsoleOutput(data.stdout);
        setTestResults(data.testResults);
        
        // Save unit test metrics back to attempt state safely
        setAttempt(prev => ({
          ...prev,
          codingTestsPassedCount: data.passedCount,
          codingTestsTotalCount: data.totalCount,
          selectedLanguage: editorLanguage
        }));
      } else {
        setConsoleOutput(`Error compilation metrics:\n ${data.error}`);
      }
    } catch (err: any) {
      setConsoleOutput(`Runtime connection error:\n ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  // ==========================================
  // GEMINI AUTOMATED STATIC AUDITS (Module 8)
  // ==========================================
  const triggerAiCodeReview = async () => {
    setIsAiReviewing(true);
    setAiReviewResult(null);
    setShowAiDrawer(true);

    try {
      const res = await fetch("/api/assessment/submit-code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId: activeQuestion.id,
          language: editorLanguage,
          code
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiReviewResult(data.review);
      } else {
        alert(`AI evaluation failed to finalize: ${data.error}`);
      }
    } catch (err: any) {
      console.error("AI review communication failed:", err);
    } finally {
      setIsAiReviewing(false);
    }
  };

  // ==========================================
  // FINAL EVALUATION ENGINE DISPATCH (Module 9)
  // ==========================================
  const handleFinalSubmission = async (shouldSave = true) => {
    setIsCompiling(true);
    setConsoleOutput("Finalizing all scoring calculations...\nComputing weighted technical scores & verifying certificate registries...");
    
    if (shouldSave) {
      await handleSaveCurrentState();
    }

    try {
      const res = await fetch("/api/assessment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id })
      });
      if (res.ok) {
        const data = await res.json();
        // Clear local storage draft upon successful evaluation
        try {
          localStorage.removeItem(`techscreen_assessment_draft_${attempt.id}`);
        } catch (e) {
          console.error("Failed to remove draft from localStorage on completion:", e);
        }
        props.onComplete(data.attempt?.overallCandidateScore, data.attempt?.category, data.certificate?.id);
      } else {
        alert("Scoring engine could not submit. Retrying active connection...");
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleMcqSelect = (opt: string) => {
    if (activeQuestion.type === "multiselect") {
      const arr = Array.isArray(selectedMcq) ? selectedMcq : [];
      if (arr.includes(opt)) {
        setSelectedMcq(arr.filter(v => v !== opt));
      } else {
        setSelectedMcq([...arr, opt]);
      }
    } else {
      setSelectedMcq(opt);
    }
  };

  const formatTimerValue = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const isCurrentAnswered = React.useMemo(() => {
    if (!activeQuestion) return false;
    if (activeQuestion.type === "coding") {
      return code.trim() !== "";
    } else if (activeQuestion.type === "fill_in_blank") {
      return fillInText.trim() !== "";
    } else {
      // mcq, multiselect, boolean, scenario
      if (Array.isArray(selectedMcq)) {
        return selectedMcq.length > 0;
      }
      return selectedMcq !== undefined && selectedMcq !== null && selectedMcq !== "";
    }
  }, [activeQuestion, code, fillInText, selectedMcq]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden" id="assessment-workspace-root">
      
      {attempt.isPractice && (
        <div className="bg-amber-50 border-b border-amber-250 text-amber-900 px-6 py-2 text-xs flex justify-between items-center z-20 font-sans font-medium" id="practice-session-banner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span><strong>Practice Session Mode:</strong> Simulating real-world assessment pressure using non-certified test samples.</span>
          </div>
          <span className="text-[10px] bg-amber-100/70 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider">
            Non-Certified Sample
          </span>
        </div>
      )}

      {/* Top Screening Workspace Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap justify-between items-center relative z-20" id="assessment-header">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <Code className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 block leading-tight">{attempt.category} Screening</span>
              {attempt.isPractice && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded uppercase font-mono border border-amber-250">
                  Practice
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Isolated Proctor Environment</span>
              <span className="text-[10px] text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium font-mono" title="Your work is backed up securely in local storage">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Auto-saved
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Countdown clocks */}
        <div className="flex items-center gap-4" id="timers-strip">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 font-medium">Section Limit:</span>
            <span className="font-mono font-bold text-indigo-700">{formatTimerValue(overallRemaining)}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="text-slate-500 font-medium">This Question:</span>
            <span className="font-mono font-bold text-amber-700">{formatTimerValue(questionRemaining)}</span>
          </div>

          <div className="flex items-center gap-2 bg-white border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span className="text-slate-500 font-medium">Integrity:</span>
            <span className="font-mono font-bold text-rose-700">{integrityScore}%</span>
          </div>

          {!isFullscreen && (
            <button
              onClick={() => {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Restore Enforced Fullscreen</span>
            </button>
          )}

          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 border border-slate-250 hover:bg-slate-200 hover:border-slate-350 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-400/50"
            id="exit-assessment-btn"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Exit Session</span>
          </button>
        </div>
      </header>

      {/* Real-time Overall Assessment Time Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 relative z-20" id="overall-pacing-progress-bar">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${
            overallTimeRatio < 0.15 
              ? "bg-rose-500 animate-pulse" 
              : overallTimeRatio < 0.35 
              ? "bg-amber-500" 
              : "bg-emerald-500"
          }`}
          style={{ width: `${(1 - overallTimeRatio) * 100}%` }}
        />
      </div>

      {/* Main Grid split: Left question/options, Right Playground */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 relative z-10 overflow-y-auto lg:overflow-hidden" id="workspace-layout">
        
        {/* LEFT COLUMN: Question Details Frame (Col-span-5) */}
        <section className="lg:col-span-5 border-r border-slate-200 flex flex-col h-auto lg:h-[calc(100vh-61px)] overflow-visible lg:overflow-hidden bg-white relative" id="left-question-frame">
          {/* Loading Transition Overlay */}
          {isNavigating && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center z-50 animate-fade-in" id="loading-transition-overlay">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-slate-550 font-sans tracking-wide">Syncing and Loading Next Item...</span>
              </div>
            </div>
          )}

          {/* Real-time Secure Proctoring & Active Assessment Timer HUD */}
          <div className="bg-slate-900 text-white p-3 px-4 flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 shadow-sm relative z-30 font-sans" id="proctor-live-hud">
            {/* Left: Security Status Badge & Heartbeat */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">PROCTOR LOCK</span>
                  <span className="px-1.5 py-0.25 bg-emerald-500/10 border border-emerald-500/25 rounded text-[8px] font-bold uppercase text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono">SECURE INTEGRITY CHANNEL</p>
              </div>
            </div>

            {/* Middle: Assessment Live Remaining Countdown Timer */}
            <div className="flex items-center justify-between sm:justify-center gap-4 bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl" id="proctor-hud-countdown">
              <div className="flex items-center gap-2">
                <Clock className={`w-3.5 h-3.5 ${overallRemaining / Math.max(1, totalTime) < 0.15 ? "text-rose-400 animate-pulse" : "text-indigo-400"}`} />
                <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold tracking-wide">Time Remaining</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`font-mono text-base font-black tracking-tight leading-none ${
                  (overallRemaining / Math.max(1, totalTime)) < 0.15 
                    ? "text-rose-500 animate-pulse" 
                    : (overallRemaining / Math.max(1, totalTime)) < 0.35 
                    ? "text-amber-500" 
                    : "text-indigo-400"
                }`}>
                  {formatTimerValue(overallRemaining)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">/ {formatTimerValue(totalTime)}</span>
              </div>
            </div>

            {/* Right: Security integrity Index HUD Indicator */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
              <div className="hidden sm:block text-left sm:text-right">
                <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono tracking-wider">Integrity Index</span>
                <p className="text-[10px] text-slate-500 font-mono leading-none">Continuous Check</p>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                <div className="w-1.5 h-6 bg-slate-800 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute bottom-0 w-full rounded-full transition-all duration-500"
                    style={{ 
                      height: `${integrityScore}%`,
                      backgroundColor: integrityScore > 85 ? '#10b981' : integrityScore > 60 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
                <div>
                  <span className={`font-mono text-xs font-extrabold ${
                    integrityScore > 85 ? 'text-emerald-400' : integrityScore > 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>{integrityScore}%</span>
                  <span className="text-[8px] text-slate-500 block leading-none font-mono">SECURE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-5 flex flex-col space-y-5" id="left-question-scroll-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex flex-col space-y-5 flex-grow"
                id="active-question-wrapper"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-bold rounded-lg uppercase tracking-wider font-mono">
                    Question {currentIdx + 1} of {attempt.questions.length}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-semibold">Points: {activeQuestion.weightage}</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight leading-snug">{activeQuestion.title}</h1>
                  <div className="flex gap-1.5 flex-wrap">
                    {activeQuestion.tags.map(tag => (
                      <span key={tag} className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 font-mono px-2 py-0.5 rounded-md font-medium">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Real-time Pacing & Progress Monitor Widget */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-3xs" id="pacing-dashboard-card">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <span>Pace & Progress Monitor</span>
                    </span>
                    <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                      {completionPercent}% Questions Done
                    </span>
                  </div>

                  {/* Question Quick-Jump Navigator (Grid) */}
                  <div className="border-t border-b border-slate-200/60 py-3 animate-fade-in" id="monaco-question-navigator">
                    <div className="flex justify-between items-center text-[11px] mb-1.5">
                      <span className="text-slate-600 font-bold flex items-center gap-1">
                        <Grid className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        <span>Interactive Question Sheet</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono italic">Click to Navigate</span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-1 bg-white border border-slate-150 rounded-lg max-h-[140px] overflow-y-auto">
                      {attempt.questions.map((q, idx) => {
                        const isCurrent = idx === currentIdx;
                        const isAnswered = attempt.answers[q.id] !== undefined && attempt.answers[q.id] !== null && attempt.answers[q.id] !== "";
                        return (
                          <button
                            key={q.id}
                            onClick={async () => {
                              if (isNavigatingRef.current) return;
                              isNavigatingRef.current = true;
                              setIsNavigating(true);
                              try {
                                await handleSaveCurrentState();
                                setCurrentIdx(idx);
                              } finally {
                                isNavigatingRef.current = false;
                                setIsNavigating(false);
                              }
                            }}
                            className={`h-7 rounded-md font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                              isCurrent
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1 font-extrabold shadow-sm"
                                : isAnswered
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                            title={`Question ${idx + 1} (${isAnswered ? "Answered" : "Unanswered"})`}
                            id={`quick-nav-question-${idx}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Progress Bars */}
                  <div className="space-y-3">
                    {/* Question Completion Bar */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-slate-600 font-medium">Progress by Questions</span>
                        <span className="font-mono font-bold text-slate-800">{answeredCount} of {attempt.questions.length} completed</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden" id="questions-progress-bar">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Time Remaining Bar */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-slate-600 font-medium">Overall Duration Progress</span>
                        <span className="font-mono font-bold text-slate-800">{formatTimerValue(overallRemaining)} remaining</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden" id="time-progress-bar">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                            overallTimeRatio < 0.15 
                              ? "bg-rose-500 animate-pulse" 
                              : overallTimeRatio < 0.35 
                              ? "bg-amber-500" 
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${(1 - overallTimeRatio) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Current Question Time Bar */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-slate-600 font-medium">Current Question Timeout</span>
                        <span className={`font-mono font-bold ${questionTimeRatio < 0.2 ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>
                          {formatTimerValue(questionRemaining)} / {formatTimerValue(activeQuestion.timeAllocation)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden" id="question-time-progress-bar">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                            questionTimeRatio < 0.2 
                              ? "bg-rose-500 animate-pulse" 
                              : questionTimeRatio < 0.4 
                              ? "bg-amber-500" 
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${questionTimeRatio * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pacing Advice Banner */}
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 transition-colors duration-300 ${
                    pacingWarning 
                      ? "bg-rose-50 border border-rose-200 text-rose-800" 
                      : "bg-indigo-50 border border-indigo-100 text-indigo-800"
                  }`} id="pacing-advice-container">
                    <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${pacingWarning ? "text-rose-600 animate-pulse" : "text-indigo-600"}`} />
                    <div className="space-y-0.5">
                      <span className="font-bold block text-[12px]">{pacingStatus}</span>
                      <span className="text-slate-600 text-[11px] block leading-relaxed">{pacingAdvice}</span>
                    </div>
                  </div>

                  {/* Prominent "Save & Return" button inside screen */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs gap-3 shadow-3xs" id="proctor-hud-pause-card">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 block text-[11px]">Save & Return to Dashboard</span>
                      <span className="text-[10px] text-slate-500 block">Progress is secured and auto-saved.</span>
                    </div>
                    <button
                      onClick={() => setShowExitConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-lg transition text-[11px] cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-700"
                      id="save-exit-pacing-btn"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pause & Return</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3" id="question-prompt-text">
                  <div className="flex gap-2 items-center text-indigo-650 text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>Specification details</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-sans">{activeQuestion.description}</p>
                </div>

                {/* CHOOSE SELECTION AREAS */}

                {/* 1. MCQ OPTIONS */}
                {(activeQuestion.type === "mcq" || activeQuestion.type === "multiselect" || activeQuestion.type === "boolean" || activeQuestion.type === "scenario") && activeQuestion.options && (
                  <div className="space-y-2 pt-1" id="mcq-options-container">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {activeQuestion.type === "multiselect" ? "Select Multiple Answers:" : "Choose One Option:"}
                    </label>
                    
                    <div className="space-y-2">
                      {activeQuestion.options.map((opt, idx) => {
                        const isChecked = Array.isArray(selectedMcq) 
                          ? selectedMcq.includes(opt) 
                          : selectedMcq === opt;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => handleMcqSelect(opt)}
                            className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 text-xs font-semibold leading-relaxed ${
                              isChecked 
                                ? "border-indigo-500 bg-indigo-50/20 text-indigo-700" 
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                            id={`mcq-opt-${idx}`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] border flex-shrink-0 mt-0.5 ${
                              isChecked ? "border-indigo-500 bg-indigo-650 text-white" : "border-slate-300 text-slate-400 bg-transparent"
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. FILL IN THE BLANK */}
                {activeQuestion.type === "fill_in_blank" && (
                  <div className="space-y-2 pt-1" id="fill-in-container">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Type Your Technical Answer:
                    </label>
                    <input
                      type="text"
                      placeholder="Type precise term here (case insensitive)..."
                      value={fillInText}
                      onChange={(e) => setFillInText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-mono focus:border-indigo-500 text-slate-950 outline-none transition"
                      id="fill-in-input"
                    />
                  </div>
                )}

                {/* 3. CODING SPECIFIC SPECIFICATIONS PANEL */}
                {activeQuestion.type === "coding" && activeQuestion.codingPrompt && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs leading-relaxed" id="coding-specific-prompt">
                    <h5 className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-amber-700" />
                      <span>Coding Exercise Rules</span>
                    </h5>
                    <p className="text-amber-950 font-mono whitespace-pre-wrap text-[11px]">{activeQuestion.codingPrompt}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Left bottom Sticky Navigation controls bar */}
          <div className="p-4 border-t border-slate-150 flex items-center justify-between bg-slate-50 shrink-0 z-10 animate-fade-in" id="navigation-controls">
            <div className="flex items-center gap-2">
              {currentIdx > 0 ? (
                <button
                  onClick={handlePrevQuestion}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400/50"
                  id="prev-question-btn"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div className="w-1" />
              )}

              <button
                onClick={() => setShowExitConfirm(true)}
                className="px-3 py-1.5 border border-slate-205 hover:bg-slate-100 text-slate-650 hover:text-slate-900 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400/50"
                id="bottom-return-btn"
                title="Save assessment state and return to dashboard"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Return to Screen</span>
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {isCurrentAnswered ? (
                <motion.button
                  key="next-btn-active"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleNextQuestion(false)}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-150/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  id="next-question-btn"
                >
                  <span>{currentIdx < attempt.questions.length - 1 ? "Next Question" : "Submit Assessment"}</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  key="next-btn-skip"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleNextQuestion(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-750 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300/50"
                  id="skip-question-btn"
                >
                  <span>{currentIdx < attempt.questions.length - 1 ? "Skip & Next" : "Submit Unfinished"}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT COLUMN: Code Playground Editor (Col-span-7) */}
        <section className="lg:col-span-7 flex flex-col h-auto lg:h-[calc(100vh-61px)] bg-slate-50 overflow-visible lg:overflow-hidden" id="right-playground-frame">
          {activeQuestion.type === "coding" ? (
            <div className="flex flex-col h-full overflow-hidden" id="coding-workspace">
              {/* Language selection strip */}
              <div className="bg-white px-5 py-2 border-b border-slate-200 flex items-center justify-between" id="editor-actionbar">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Language:</span>
                  <select
                    value={editorLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-indigo-700 font-bold px-2 py-1 outline-none cursor-pointer"
                    id="language-select"
                  >
                    <option value="javascript">JavaScript (ES6)</option>
                    <option value="typescript">TypeScript (5.x)</option>
                    <option value="python">Python (3.11)</option>
                    <option value="go">Go (1.21)</option>
                    <option value="java">Java (JDK 21)</option>
                    <option value="csharp">C# (Core 8)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={runCodeSandbox}
                    disabled={isCompiling}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-3xs"
                    id="run-sandbox-btn"
                  >
                    <Play className="w-3 h-3 text-emerald-600 fill-current" />
                    <span>Compile & Run</span>
                  </button>
                  
                  <button
                    onClick={triggerAiCodeReview}
                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-3xs"
                    id="ai-audit-btn"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                    <span>Run AI Code Audit</span>
                  </button>
                </div>
              </div>

              {/* Monaco-based Editor Workspace */}
              <div className="flex-grow flex flex-col relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-sm min-h-[450px]" id="editor-lines-row">
                {/* Monaco Editor Sub-Header */}
                <div className="flex justify-between items-center bg-slate-950 px-4 py-2 text-slate-400 border-b border-slate-800" id="monaco-toolbar">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                      IDE Mode
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <Code className="w-3.5 h-3.5 text-slate-500" />
                      <span>{editorLanguage.toUpperCase()} Compiler Sandboxed</span>
                    </div>
                  </div>

                  {/* Editor Actions: Dark/Light Theme & Keyboard Shortcuts Help */}
                  <div className="flex items-center gap-3">
                    {/* Hotkeys Information Toggle */}
                    <button
                      onClick={() => setShowShortcuts(!showShortcuts)}
                      className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md cursor-pointer transition"
                      title="Show keyboard shortcuts"
                      id="editor-shortcuts-btn"
                    >
                      <Keyboard className="w-3 h-3 text-slate-400" />
                      <span>Shortcuts Guide</span>
                    </button>

                    {/* Theme Switcher */}
                    <button
                      onClick={() => setEditorTheme(prev => prev === "vs-dark" ? "light" : "vs-dark")}
                      className="flex items-center gap-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-2 py-1 rounded-md cursor-pointer transition"
                      title="Switch editor theme"
                      id="editor-theme-toggle"
                    >
                      {editorTheme === "vs-dark" ? (
                        <>
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>Light UI</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3 h-3 text-indigo-400" />
                          <span>Dark UI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Shortcuts Help Overlay Panel */}
                {showShortcuts && (
                  <div className="absolute top-11 right-4 z-40 bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-xl max-w-xs space-y-3 text-slate-300 animate-in fade-in slide-in-from-top-2 duration-150" id="monaco-shortcuts-overlay">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                        Monaco IDE Shortcuts
                      </span>
                      <button 
                        onClick={() => setShowShortcuts(false)}
                        className="text-slate-500 hover:text-slate-300 font-bold font-mono text-[11px]"
                      >
                        [ESC]
                      </button>
                    </div>
                    <div className="space-y-2 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Auto-Format Code:</span>
                        <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 border border-slate-800 font-mono">Shift+Alt+F</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Comment Selection:</span>
                        <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 border border-slate-800 font-mono">Ctrl+/</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Trigger Suggestions:</span>
                        <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 border border-slate-800 font-mono">Ctrl+Space</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Multi-Cursor Select:</span>
                        <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 border border-slate-800 font-mono">Alt+Click</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quick-Save Progress:</span>
                        <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 border border-slate-800 font-mono">Ctrl+S</kbd>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 italic leading-snug">
                      These core bindings operate directly in the sandboxed editor frame to maximize assessment speed.
                    </p>
                  </div>
                )}

                {/* The Live Monaco Editor */}
                <div className="flex-grow w-full relative h-[400px]" id="monaco-editor-pane">
                  <Editor
                    height="100%"
                    width="100%"
                    language={editorLanguage === "javascript" ? "javascript" : editorLanguage === "typescript" ? "typescript" : editorLanguage === "python" ? "python" : editorLanguage === "go" ? "go" : editorLanguage === "java" ? "java" : "csharp"}
                    theme={editorTheme}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    onMount={handleEditorMount}
                    loading={
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3 font-sans">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                        <span className="text-xs font-mono tracking-wider">Mounting Live Monaco Compiler IDE...</span>
                      </div>
                    }
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "JetBrains Mono, Fira Code, Menlo, Courier New, monospace",
                      lineNumbers: "on",
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      automaticLayout: true,
                      tabSize: 2,
                      scrollBeyondLastLine: false,
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                      wordWrap: "on",
                      renderLineHighlight: "all",
                      scrollbar: {
                        vertical: "visible",
                        horizontal: "visible",
                        useShadows: false,
                        verticalHasArrows: false,
                        horizontalHasArrows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10
                      }
                    }}
                  />
                </div>

                {/* Monaco Editor Status Footer */}
                <div className="bg-slate-950/80 border-t border-slate-850 px-4 py-1.5 text-[10px] font-mono text-slate-500 flex justify-between items-center" id="monaco-footer">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      INTELLISENSE READY
                    </span>
                    <span>•</span>
                    <span>TAB SIZE: 2</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                    <span>STATUS: ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Compilation Test Cases details */}
              <div className="bg-white border-t border-slate-200 p-3.5" id="test-results-strip">
                <h5 className="text-[10px] font-bold text-slate-500 mb-1.5 font-sans tracking-wide uppercase">Test verification cases:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="tests-panels">
                  {(activeQuestion.testCases || []).map((tc, index) => {
                    const matchResult = testResults[index];
                    return (
                      <div key={index} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 text-[11px] shadow-3xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Case #{index + 1}</span>
                          {matchResult ? (
                            matchResult.passed ? (
                              <span className="text-emerald-700 font-bold font-mono">PASS</span>
                            ) : (
                              <span className="text-rose-600 font-bold font-mono">FAIL</span>
                            )
                          ) : (
                            <span className="text-slate-400 font-mono">PENDING</span>
                          )}
                        </div>
                        <div className="font-mono text-slate-500 truncate">In: {tc.input}</div>
                        <div className="font-mono text-slate-500 truncate">Exp: {tc.expectedOutput}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COMPILER EXECUTION CONSOLE */}
              <div className="bg-white border-t border-slate-200 h-[30%] flex flex-col overflow-hidden" id="console-terminal-pane">
                <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Terminal Compilation Logs Console</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap select-all bg-slate-50">
                  {consoleOutput || "Terminal idle. Compile and Execute code to trigger standard input tests."}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-slate-50 overflow-hidden" id="scratchpad-sandbox-root">
              {/* Header with beautiful interactive tabs */}
              <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3" id="scratchpad-header">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <Terminal className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 leading-none">Interactive Sandbox Scratchpad</h4>
                    <span className="text-[9px] text-slate-400 font-medium">Verify your logic and brainstorm drafting choices</span>
                  </div>
                </div>

                {/* Tab selections */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200" id="scratchpad-tabs-bar">
                  <button
                    onClick={() => setScratchpadActiveTab("editor")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                      scratchpadActiveTab === "editor" 
                        ? "bg-white text-indigo-700 shadow-2xs border border-slate-200" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Draft Sandbox</span>
                  </button>
                  <button
                    onClick={handleQueryScratchpadExplain}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                      scratchpadActiveTab === "ai" 
                        ? "bg-white text-indigo-700 shadow-2xs border border-slate-200" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ask AI concept</span>
                  </button>
                </div>
              </div>

              {/* Tab views content */}
              <div className="flex-grow flex flex-col overflow-hidden" id="scratchpad-view-body">
                {scratchpadActiveTab === "editor" ? (
                  <div className="flex-grow flex flex-col overflow-hidden h-full">
                    {/* Dialect selectors and trigger button bar */}
                    <div className="bg-white border-b border-slate-200 px-5 py-2 flex items-center justify-between" id="scratchpad-editor-actions">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Draft Dialect:</span>
                        <select
                          value={scratchpadLanguage}
                          onChange={(e) => setScratchpadLanguage(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-indigo-600 font-bold px-2 py-1 outline-none cursor-pointer"
                          id="scratchpad-language-select"
                        >
                          <option value="sql">SQL Syntax draft</option>
                          <option value="notes">Scratchpad Plain Notes</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={runScratchpadDryRun}
                          disabled={isScratchpadDryRunning}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-3xs"
                          id="scratchpad-dryrun-btn"
                        >
                          <Play className="w-3 h-3 text-emerald-600 fill-current" />
                          <span>Dry-Run Notes</span>
                        </button>
                        <button
                          onClick={handleQueryScratchpadExplain}
                          className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-3xs"
                          id="scratchpad-ai-explain-btn"
                        >
                          <Zap className="w-3 h-3 text-white" />
                          <span>Ask Advisor</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Draft typing workspace */}
                    <div className="flex-grow flex relative overflow-hidden h-[50%]" id="scratchpad-editor-workspace">
                      <textarea
                        value={scratchpadText}
                        onChange={(e) => setScratchpadText(e.target.value)}
                        className="flex-grow bg-white p-4 outline-none border-none text-slate-800 font-mono text-xs leading-relaxed resize-none h-full placeholder:text-slate-350"
                        spellCheck="false"
                        placeholder={
                          scratchpadLanguage === "sql"
                            ? "-- Write dry-run SQL queries here...\n-- Example:\nSELECT * FROM user_accounts WHERE is_verified = TRUE;"
                            : "// Draft your thoughts, logic, or option tradeoffs here...\n// e.g. prepared statements prevent SQL Injection because they separate SQL query structure from data values."
                        }
                        id="scratchpad-text-area"
                      ></textarea>
                    </div>

                    {/* Interactive terminal output console */}
                    <div className="bg-white border-t border-slate-200 h-[35%] flex flex-col overflow-hidden" id="scratchpad-terminal">
                      <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-200 text-slate-500 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Draft terminal monitor</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap bg-slate-50 select-all">
                        {scratchpadConsole || "Draft terminal idle. Click 'Dry-Run Notes' to parse or validate draft text syntax."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-white" id="scratchpad-ai-view">
                    {scratchpadIsGenerating ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">SaaS Gemini advisor is processing concepts...</h4>
                          <p className="text-slate-400 text-[10px] mt-1">Fetching secure, non-leaking architectural parameters.</p>
                        </div>
                      </div>
                    ) : scratchpadExplanation ? (
                      <div className="space-y-4 animate-fade-in">
                        {/* Concept explainer markdown card */}
                        <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs" id="ai-concept-description">
                          <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-indigo-650" />
                            <span>SaaS Concept Explanation</span>
                          </h5>
                          <div className="text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap font-sans text-[11.5px]">
                            {scratchpadExplanation}
                          </div>
                        </div>

                        {/* Conceptual Tips list */}
                        {scratchpadTips.length > 0 && (
                          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2.5 text-xs" id="ai-conceptual-tips">
                            <h5 className="font-bold text-emerald-800 flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-700" />
                              <span>Key Conceptual Tips</span>
                            </h5>
                            <ul className="space-y-1.5 text-slate-700 text-[11px] font-sans">
                              {scratchpadTips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="text-emerald-600 font-bold font-mono shrink-0 mt-0.5">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Integrity Alert Banner */}
                        {scratchpadIntegrityText && (
                          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-[11px] text-indigo-800 font-medium" id="ai-integrity-alert">
                            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{scratchpadIntegrityText}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center" id="ai-empty-state">
                        <Sparkles className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
                        <h4 className="font-bold text-xs text-slate-700">Need a secure conceptual hint?</h4>
                        <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                          Click 'Ask Advisor' to generate standard security or engineering best practices about this question without violating proctoring criteria.
                        </p>
                        <button
                          onClick={handleQueryScratchpadExplain}
                          className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition shadow-3xs cursor-pointer"
                        >
                          Generate Concept Guide
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* SLIDING AI CODE AUDIT REVIEW DRAWER (Module 8) */}
      {showAiDrawer && (
        <div className="absolute top-[61px] right-0 w-full max-w-lg h-[calc(100vh-61px)] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-slide-in overflow-hidden" id="ai-review-drawer">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600 w-4.5 h-4.5" />
              <div>
                <h3 className="font-bold text-xs text-slate-900 block">Automated AI Code Audit Review</h3>
                <span className="text-[9px] text-slate-500 font-mono font-semibold uppercase tracking-wider">Gemini 3.5 Flash Sandbox</span>
              </div>
            </div>
            <button
              onClick={() => setShowAiDrawer(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-850 border border-slate-200 px-3 py-1.5 rounded-lg transition hover:bg-slate-50 cursor-pointer"
            >
              Close Report
            </button>
          </div>

          <div className="flex-grow p-5 overflow-y-auto space-y-5 text-xs bg-white text-slate-700" id="ai-drawer-body">
            {isAiReviewing ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <h4 className="font-bold text-slate-800">Executing Gemini static analysis...</h4>
                  <p className="text-slate-500 text-[11px] mt-1">Reviewing formatting standards, complexity analysis, and security rules.</p>
                </div>
              </div>
            ) : aiReviewResult ? (
              <>
                {/* Score meters grid */}
                <div className="grid grid-cols-2 gap-2.5" id="scores-meters">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 shadow-3xs">
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Quality Index</span>
                    <span className="text-base font-mono font-bold text-indigo-700">{aiReviewResult.codeQualityScore}/100</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 shadow-3xs">
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Security Index</span>
                    <span className="text-base font-mono font-bold text-indigo-700">{aiReviewResult.securityScore}/100</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 shadow-3xs">
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Maintainability</span>
                    <span className="text-base font-mono font-bold text-indigo-700">{aiReviewResult.maintainabilityScore}/100</span>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-0.5 shadow-2xs">
                    <span className="text-indigo-600 text-[9px] uppercase font-bold tracking-wider block">Overall Engineering</span>
                    <span className="text-base font-mono font-bold text-indigo-800">{aiReviewResult.overallEngineeringScore}/100</span>
                  </div>
                </div>

                {/* Complexity Summary */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-3xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Complexity & Algorithm Bounds</span>
                  </div>
                  <p className="text-slate-600 font-mono leading-relaxed text-[11px]">{aiReviewResult.complexityAnalysis}</p>
                </div>

                {/* Readability comments */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-3xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span>Formatting & Code Readability</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{aiReviewResult.readabilityAssessment}</p>
                </div>

                {/* Vulnerabilities panel */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-rose-500" />
                    <span>Identified Vulnerability Risks ({aiReviewResult.vulnerabilities.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {aiReviewResult.vulnerabilities.map((vuln, i) => (
                      <div key={i} className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-800 text-xs">{vuln.title}</span>
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[8px] uppercase font-mono font-bold rounded-md">{vuln.severity}</span>
                        </div>
                        <p className="text-rose-950 text-[11px] mt-1">{vuln.desc}</p>
                        <div className="mt-2 text-slate-800 font-mono bg-white p-2 rounded text-[10px] border border-rose-100">Fix: {vuln.fix}</div>
                      </div>
                    ))}
                    {aiReviewResult.vulnerabilities.length === 0 && <p className="text-slate-400 italic">No vulnerability risks logged by static reviewer.</p>}
                  </div>
                </div>

                {/* Action recommendations lists */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    <span>Actionable Recommendations</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {aiReviewResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-2 items-start text-slate-600">
                        <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-500 font-bold flex-shrink-0 mt-0.5 font-mono">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed text-[11px]">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 p-8">No audit summary logs found. Click 'Run AI Code Audit' above.</div>
            )}
          </div>
        </div>
      )}

      {/* Exit Session Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[999] p-4" id="exit-confirmation-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative"
              id="exit-confirmation-modal-card"
            >
              {/* Header Decorative accent */}
              <div className="h-2 bg-slate-200" />
              
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Pause & Exit Assessment?</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your answers will be saved. However, the section time limit remains active. You can resume this session later from the candidate dashboard.
                  </p>
                </div>

                {/* Confirm Options */}
                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300"
                    id="cancel-exit-btn"
                  >
                    Keep Testing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExitConfirm(false);
                      props.onExit();
                    }}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-rose-150/30 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="confirm-exit-btn"
                  >
                    Yes, Exit Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
