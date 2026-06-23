/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
  BookOpen
} from "lucide-react";

interface AssessmentEngineProps {
  attempt: AssessmentAttempt;
  onComplete: () => void;
  onExit: () => void;
}

export default function AssessmentEngine(props: AssessmentEngineProps) {
  const [attempt, setAttempt] = useState<AssessmentAttempt>(props.attempt);
  const [currentIdx, setCurrentIdx] = useState(0);
  const activeQuestion = attempt.questions[currentIdx];
  
  // Timer States
  const [overallRemaining, setOverallRemaining] = useState(() => {
    // Total allocated seconds
    return attempt.questions.reduce((sum, q) => sum + q.timeAllocation, 0);
  });
  const [questionRemaining, setQuestionRemaining] = useState(activeQuestion?.timeAllocation || 60);

  // Answer tracking
  const [selectedMcq, setSelectedMcq] = useState<string | string[]>("");
  const [fillInText, setFillInText] = useState("");
  
  // Code Editor States
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);

  // AI Review States
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<AICodeReviewResult | null>(null);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // Proctor Logs States
  const [proctorFlags, setProctorFlags] = useState<ProctoringLog[]>([]);
  const [integrityScore, setIntegrityScore] = useState(100);

  // Timers Refs
  const lastTimeRef = useRef<number>(Date.now());

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
    setQuestionRemaining(activeQuestion.timeAllocation);
  }, [currentIdx, activeQuestion]);

  // Handle automatic count downs
  useEffect(() => {
    const interval = setInterval(() => {
      setOverallRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmission();
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
    // 1. Tab switching (Blur events)
    const handleBlur = () => {
      logProctorEvent("tab_switch", "Candidate blurred workspace. Possible secondary lookup or communication.");
    };

    // 2. Fullscreen exit check
    const handleFullscreenExit = () => {
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
      currentAns = code;
    } else if (activeQuestion.type === "fill_in_blank") {
      currentAns = fillInText;
    } else {
      currentAns = selectedMcq;
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

      // Update local state copy
      const updatedAnswers = { ...attempt.answers, [activeQuestion.id]: currentAns };
      setAttempt(prev => ({
        ...prev,
        answers: updatedAnswers
      }));
    } catch (err) {
      console.error("Save answer failed:", err);
    }
  };

  const handleNextQuestion = async (autoExpired = false) => {
    await handleSaveCurrentState(autoExpired);
    if (currentIdx < attempt.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Completed last question, run final scoring calculations
      handleFinalSubmission();
    }
  };

  const handlePrevQuestion = async () => {
    await handleSaveCurrentState();
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  // Switch compiler starter code when language select updates
  const handleLanguageChange = (lang: string) => {
    setEditorLanguage(lang);
    const starter = activeQuestion.starterCode?.[lang] || "";
    setCode(starter);
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
        
        // Save unit test metrics back to attempt state
        attempt.codingTestsPassedCount = data.passedCount;
        attempt.codingTestsTotalCount = data.totalCount;
        attempt.selectedLanguage = editorLanguage;
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
  const handleFinalSubmission = async () => {
    setIsCompiling(true);
    setConsoleOutput("Finalizing all scoring calculations...\nComputing weighted technical scores & verifying certificate registries...");
    
    // Save last item first
    await handleSaveCurrentState();

    try {
      const res = await fetch("/api/assessment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id })
      });
      if (res.ok) {
        props.onComplete();
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden" id="assessment-workspace-root">
      
      {/* Top Screening Workspace Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap justify-between items-center relative z-20" id="assessment-header">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <Code className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">{attempt.category} Screening</span>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Isolated Proctor Environment</span>
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
        </div>
      </header>

      {/* Main Grid split: Left question/options, Right Playground */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 relative z-10 overflow-hidden" id="workspace-layout">
        
        {/* LEFT COLUMN: Question Details Frame (Col-span-5) */}
        <section className="lg:col-span-5 border-r border-slate-200 flex flex-col h-[calc(100vh-61px)] overflow-y-auto bg-white p-5 space-y-5" id="left-question-frame">
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

          {/* Left bottom Navigation buttons */}
          <div className="pt-4 border-t border-slate-150 flex items-center justify-between mt-auto bg-transparent" id="navigation-controls">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIdx === 0}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              id="prev-question-btn"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            
            <button
              onClick={() => handleNextQuestion(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
              id="next-question-btn"
            >
              <span>{currentIdx < attempt.questions.length - 1 ? "Next Item" : "Complete & Submit"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: Code Playground Editor (Col-span-7) */}
        <section className="lg:col-span-7 flex flex-col h-[calc(100vh-61px)] bg-slate-50 overflow-hidden" id="right-playground-frame">
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

              {/* Editor Workspace */}
              <div className="flex-grow flex relative overflow-hidden h-[45%]" id="editor-lines-row">
                <div className="w-10 bg-slate-100 border-r border-slate-200 select-none py-4 text-center font-mono text-[10px] text-slate-400 leading-relaxed text-right pr-2.5">
                  {Array.from({ length: 25 }, (_, i) => i + 1).map(n => <div key={n}>{n}</div>)}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-grow bg-white p-4 outline-none border-none text-slate-800 font-mono text-xs leading-relaxed resize-none h-full"
                  spellCheck="false"
                  placeholder="// Complete your programming assignment here..."
                  id="code-text-area"
                ></textarea>
              </div>

              {/* Compilation Test Cases details */}
              <div className="bg-white border-t border-slate-200 p-3.5" id="test-results-strip">
                <h5 className="text-[10px] font-bold text-slate-450 mb-1.5 font-sans tracking-wide uppercase">Test verification cases:</h5>
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
                        <div className="font-mono text-slate-450 truncate">In: {tc.input}</div>
                        <div className="font-mono text-slate-450 truncate">Exp: {tc.expectedOutput}</div>
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
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white" id="non-coding-preview">
              <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="font-bold text-xs text-slate-700">Workspace Sandbox is locked for non-coding queries.</h3>
              <p className="text-[11px] text-slate-450 max-w-xs leading-relaxed mt-1">
                Complete the MCQ choices, Multi-select criteria or Fill-in blanks inside the left panel. Choose 'Next Item' to advance.
              </p>
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
                  <p className="text-slate-450 text-[11px] mt-1">Reviewing formatting standards, complexity analysis, and security rules.</p>
                </div>
              </div>
            ) : aiReviewResult ? (
              <>
                {/* Score meters grid */}
                <div className="grid grid-cols-2 gap-2.5" id="scores-meters">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 shadow-3xs">
                    <span className="text-slate-450 text-[9px] uppercase font-bold tracking-wider block">Quality Index</span>
                    <span className="text-base font-mono font-bold text-indigo-700">{aiReviewResult.codeQualityScore}/100</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 shadow-3xs">
                    <span className="text-slate-450 text-[9px] uppercase font-bold tracking-wider block">Security Index</span>
                    <span className="text-base font-mono font-bold text-indigo-700">{aiReviewResult.securityScore}/100</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5 shadow-3xs">
                    <span className="text-slate-450 text-[9px] uppercase font-bold tracking-wider block">Maintainability</span>
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

    </div>
  );
}
