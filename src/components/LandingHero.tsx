/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  Code, 
  Cpu, 
  Activity, 
  Zap, 
  Star, 
  Fingerprint, 
  Award, 
  Play, 
  RefreshCw, 
  Check, 
  CheckCircle,
  Users, 
  Shield, 
  BarChart3, 
  Lock,
  LockKeyhole,
  FileCheck2,
  ChevronDown,
  Eye,
  Video,
  Mic,
  Monitor,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts";

interface LandingHeroProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  onDemoCandidate: () => void;
  onDemoRecruiter: () => void;
  onDemoAdmin: () => void;
}

// Simulated dynamic performance data for the Recharts graph in the dashboard mockup
const liveTelemetryData = [
  { time: "0s", score: 65, proctor: 99 },
  { time: "10s", score: 72, proctor: 98 },
  { time: "20s", score: 85, proctor: 100 },
  { time: "30s", score: 82, proctor: 99 },
  { time: "40s", score: 94, proctor: 100 },
  { time: "50s", score: 92, proctor: 100 },
  { time: "60s", score: 95, proctor: 99 },
];

export default function LandingHero(props: LandingHeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "proctor" | "review" | "telemetry">("code");
  const [typedCode, setTypedCode] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Proctor simulation values
  const [proctorRisk, setProctorRisk] = useState(0.1);
  const [gazeLocation, setGazeLocation] = useState("Center Screen");
  const [proctorFlags, setProctorFlags] = useState(0);

  // Bento Interactive States
  const [selectedBentoTab, setSelectedBentoTab] = useState<"sandbox" | "ai-proctor" | "certificates">("sandbox");

  // Stats Counters
  const [stats, setStats] = useState({ candidates: 12400, accuracy: 95.0, speed: 1.0 });

  useEffect(() => {
    // Stat count up simulation on load for high-fidelity feel
    const interval = setInterval(() => {
      setStats((prev) => {
        const nextCandidates = prev.candidates < 14240 ? prev.candidates + 120 : 14240;
        const nextAccuracy = prev.accuracy < 99.8 ? parseFloat((prev.accuracy + 0.3).toFixed(1)) : 99.8;
        const nextSpeed = prev.speed < 2.1 ? parseFloat((prev.speed + 0.1).toFixed(1)) : 2.1;
        return { candidates: nextCandidates, accuracy: nextAccuracy, speed: nextSpeed };
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Simple typing animation in the IDE mockup
  useEffect(() => {
    const fullCode = `import { GoogleGenAI } from "@google/genai";\n\n// Initialize intelligent screening agent\nconst ai = new GoogleGenAI();\nconst review = await ai.models.generateContent({\n  model: "gemini-2.5-flash",\n  contents: "Analyze candidate's complexity and security posture..."\n});\n\nexport const status = "PROCTORING_SECURED";`;
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullCode.length) {
        setTypedCode(fullCode.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 25);
    return () => clearInterval(typingInterval);
  }, []);

  // Simulate webcam state changes
  useEffect(() => {
    if (activeTab !== "proctor") return;
    const locations = ["Center Screen", "Left Monitor", "Right Panel", "Center Screen", "Keyboard"];
    const interval = setInterval(() => {
      const isGazeValid = Math.random() > 0.15;
      if (isGazeValid) {
        setGazeLocation("Center Screen");
        setProctorRisk(parseFloat((0.1 + Math.random() * 0.2).toFixed(2)));
      } else {
        const loc = locations[Math.floor(Math.random() * locations.length)];
        setGazeLocation(loc);
        const addedRisk = parseFloat((2.5 + Math.random() * 5.0).toFixed(2));
        setProctorRisk(addedRisk);
        if (addedRisk > 5.0) {
          setProctorFlags(f => f + 1);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Handle interactive mouse background effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleRunCompiler = () => {
    setIsCompiling(true);
    setCompileSuccess(false);
    setTimeout(() => {
      setIsCompiling(false);
      setCompileSuccess(true);
    }, 1500);
  };

  return (
    <div 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden font-sans selection:bg-indigo-500/20 selection:text-indigo-900" 
      id="premium-landing-root"
    >
      
      {/* 1. FUTURISTIC DYNAMIC GLOW GRID (Interactive Parallax Mouse Effect) */}
      <div className="absolute inset-0 pointer-events-none z-0" id="mesh-background-glow">
        <div 
          className="absolute rounded-full transition-opacity duration-700 blur-[130px]"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 35%, rgba(16, 185, 129, 0.01) 70%, rgba(255, 255, 255, 0) 100%)",
            left: `${mousePosition.x - 300}px`,
            top: `${mousePosition.y - 300}px`,
            opacity: isHovered ? 1 : 0.6,
          }}
        />
        {/* Constant premium background mesh grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        
        {/* Pulsing visual grid anchors */}
        <div className="absolute top-10 left-10 w-2.5 h-2.5 bg-indigo-500/10 rounded-full ring-4 ring-indigo-500/5 animate-ping"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-[550px] h-[550px] bg-emerald-500/[0.02] rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "10s" }}></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-emerald-500/5 rounded-full animate-ping" style={{ animationDelay: "1.5s" }}></div>
      </div>

      {/* 2. PREMIUM GLOSSY NAVBAR HEADER */}
      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 relative z-40 sticky top-0" id="landing-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)] border border-indigo-400/20 group-hover:scale-105 transition duration-300">
              <ShieldCheck className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-display font-extrabold tracking-tight text-slate-900 block text-base">TechScreen</span>
              <span className="text-[9px] text-indigo-650 font-mono tracking-wider uppercase font-bold block">Autonomous Assessment</span>
            </div>
          </div>

          {/* Premium Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs text-slate-600 font-semibold" id="nav-menu">
            <a href="#features" className="hover:text-indigo-600 transition-colors duration-250 flex items-center gap-1">
              <span>Platform Suite</span>
            </a>
            <a href="#premium-dashboard-mockup" className="hover:text-indigo-600 transition-colors duration-250 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span>Proctoring Demo</span>
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors duration-250">
              Interactive Bento
            </a>
            <span className="h-4 w-px bg-slate-200"></span>
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-mono shadow-xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-bold tracking-wide">SMTP RELAY: OPERATIONAL</span>
            </div>
          </nav>

          {/* Navigation CTA Buttons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={props.onLoginClick}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition cursor-pointer hover:bg-slate-100 rounded-lg"
              id="header-signin-btn"
            >
              Sign In
            </button>
            <button 
              onClick={props.onGetStarted}
              className="text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98 transition-all rounded-xl px-4.5 py-2.5 flex items-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.15)] font-display"
              id="header-cta-btn"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO CONTENT BODY */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-20" id="landing-hero-main">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          
          {/* LEFT COLUMN: Slogan, Visual Badges & Dynamic Counter */}
          <div className="lg:col-span-6 space-y-7 text-left" id="hero-left-content">
            
            {/* Pulsing Shiny Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[11px] font-bold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>LAUNCHING VERSION 2.5: DEEP COGNITIVE EVALUATOR</span>
            </div>

            {/* Title with Elegant Typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-display font-black tracking-tight text-slate-950 leading-[1.05]">
              Verify Competency <br />
              With Absolute <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 via-violet-650 to-emerald-600 font-black filter drop-shadow-[0_1px_4px_rgba(99,102,241,0.05)]">
                AI Integrity
              </span>
            </h1>

            {/* Polished Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed font-sans">
              Streamline technical hiring with zero compromise. Standardize engineering screening using bulletproof coding sandboxes, dynamic webcam-gaze tracking, and deep AI-driven code intelligence reports.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
              <button
                onClick={props.onGetStarted}
                className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_4px_18px_rgba(79,70,229,0.25)] hover:shadow-[0_4px_25px_rgba(79,70,229,0.35)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer text-sm font-display tracking-wide"
                id="hero-primary-cta"
              >
                <span>Initialize Platform Access</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </button>
              <a
                href="#features"
                className="px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-xl transition duration-250 flex items-center justify-center gap-2 text-sm shadow-2xs"
                id="hero-secondary-cta"
              >
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Explore Core Features</span>
              </a>
            </div>

            {/* Bypass Console (One-Click Testing Sandbox Dashboard) */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl max-w-xl space-y-3 shadow-lg shadow-indigo-100/20" id="fast-tracks-panel">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                    Instant Workspace Demo Login
                  </span>
                </div>
                <span className="text-[9px] font-mono text-indigo-700 uppercase bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">NO SIGNUP REQUIRED</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={props.onDemoCandidate}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs"
                  id="sandbox-candidate-bypass"
                >
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span className="font-display font-bold">Candidate View</span>
                </button>
                <button
                  onClick={props.onDemoRecruiter}
                  className="p-3 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs"
                  id="sandbox-recruiter-bypass"
                >
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span className="font-display font-bold">Recruiter View</span>
                </button>
                <button
                  onClick={props.onDemoAdmin}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs"
                  id="sandbox-admin-bypass"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="font-display font-bold">Platform Admin</span>
                </button>
              </div>
            </div>

            {/* Live Stats Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 max-w-xl" id="hero-live-stats">
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 block">
                  {stats.candidates.toLocaleString()}+
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Completed Screenings
                </span>
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-mono font-black text-emerald-600 block">
                  {stats.accuracy}%
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Proctor Fidelity
                </span>
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-mono font-black text-indigo-600 block">
                  &lt;{stats.speed}s
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  AI Assessment Time
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive High-Fidelity UI Simulator */}
          <div className="lg:col-span-6 flex justify-center relative" id="hero-right-visuals">
            
            {/* Dynamic abstract glowing backdrops */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-[90px] z-0"></div>
            <div className="absolute top-1/4 right-5 w-[220px] h-[220px] bg-emerald-500/5 rounded-full blur-[70px] z-0 animate-pulse"></div>

            {/* Premium Mockup Glass Frame */}
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden relative z-10 font-sans" id="premium-dashboard-mockup">
              
              {/* Simulator Header & Window Control buttons */}
              <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400 block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-400 block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 block"></span>
                </div>

                {/* Switchable Interactive Tabs */}
                <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200/80">
                  <button 
                    onClick={() => setActiveTab("code")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activeTab === "code" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Code IDE
                  </button>
                  <button 
                    onClick={() => setActiveTab("proctor")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activeTab === "proctor" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    AI Proctor Eye
                  </button>
                  <button 
                    onClick={() => setActiveTab("review")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activeTab === "review" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    AI Insight
                  </button>
                  <button 
                    onClick={() => setActiveTab("telemetry")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activeTab === "telemetry" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Analytics Feed
                  </button>
                </div>

                <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">
                  SIM_ACTIVE
                </div>
              </div>

              {/* SIMULATOR SCREEN CONTENT AREA */}
              <div className="p-5 h-72 overflow-y-auto bg-slate-950 relative">
                
                {/* 1. CODE TAB */}
                {activeTab === "code" && (
                  <div className="space-y-3 font-mono text-xs text-slate-300 animate-fade-in">
                    <div className="text-slate-500 font-sans italic">// Dynamic code challenge sandbox</div>
                    <pre className="text-left whitespace-pre-wrap font-mono text-[11px] leading-relaxed select-none text-indigo-200">
                      {typedCode}
                      <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-ping ml-0.5"></span>
                    </pre>

                    {/* Compile triggers inside mockup */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-800 mt-4 font-sans">
                      <div className="flex items-center gap-2">
                        {isCompiling ? (
                          <span className="text-[11px] text-amber-400 flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling typescript testcases...
                          </span>
                        ) : compileSuccess ? (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Execution Succeeded (Passed: 18/18 Unit Cases)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Ready to execute code environment</span>
                        )}
                      </div>
                      <button 
                        onClick={handleRunCompiler}
                        disabled={isCompiling}
                        className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 disabled:opacity-50 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Play className="w-3 h-3" /> Run Compiler
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. AI PROCTORING TAB */}
                {activeTab === "proctor" && (
                  <div className="space-y-3 font-sans text-slate-300 animate-fade-in">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-mono tracking-wider border-b border-slate-800 pb-2">
                      <span>Proctor Eye Tracking Simulation</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                        WEBCAM FEED LINKED
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      {/* Left: Simulated webcam frame */}
                      <div className="col-span-7 relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col justify-center items-center shadow-inner group">
                        
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center relative z-10 overflow-hidden">
                          <Users className="w-10 h-10 text-indigo-400/80" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent animate-pulse h-1/2 w-full top-1/4"></div>
                        </div>

                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.02),transparent)] opacity-80"></div>
                        <div className="absolute w-28 h-28 border border-dashed border-emerald-500/30 rounded-full animate-spin" style={{ animationDuration: "12s" }}></div>
                        <div className="absolute w-36 h-36 border border-indigo-500/20 rounded-full animate-spin" style={{ animationDuration: "20s" }}></div>

                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/85 border border-slate-800 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1 z-20">
                          <Video className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>EYE_TRACK_OK</span>
                        </div>

                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-950/85 border border-slate-800 rounded text-[9px] font-mono text-indigo-400 z-20">
                          FACE_COUNT: 1
                        </div>
                      </div>

                      {/* Right: Real-time telemetry feed fields */}
                      <div className="col-span-5 space-y-2">
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Gaze Direction</span>
                          <span className={`text-[11px] font-mono font-bold block ${gazeLocation === "Center Screen" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`}>
                            {gazeLocation}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Integrity Risk</span>
                          <span className={`text-[11px] font-mono font-bold block ${proctorRisk > 2.0 ? "text-amber-400 font-black" : "text-emerald-400"}`}>
                            {proctorRisk}% Risk Metric
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Suspicion Flags</span>
                          <span className={`text-[11px] font-mono font-bold block ${proctorFlags > 0 ? "text-rose-400" : "text-slate-400"}`}>
                            {proctorFlags} flags triggered
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. AI COGNITIVE REVIEW TAB */}
                {activeTab === "review" && (
                  <div className="space-y-3 font-sans text-slate-300 animate-fade-in">
                    <div className="p-3 bg-indigo-950/40 border border-indigo-900/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-indigo-400" /> GEMINI AI COGNITIVE REPORT
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">PASSED COMPILATION</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        Candidate demonstrated optimal asymptotic complexity of <strong className="text-indigo-200">O(N log N)</strong> in solving sorting matrices. Strong type safety practices were maintained, and zero malicious payload references were injected.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500">Encapsulation Rating:</span>
                        <span className="font-bold text-emerald-400">95% (Strong)</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500">Security Check:</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> SECURE
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. TELEMETRY GRAPH TAB */}
                {activeTab === "telemetry" && (
                  <div className="space-y-2 font-sans text-slate-300 animate-fade-in">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tracking-wider border-b border-slate-850 pb-2 mb-2">
                      <span>Live Candidate Keypress Stream</span>
                      <span className="text-indigo-400 text-[10px]">60 SECONDS TIMELINE</span>
                    </div>
                    
                    <div className="h-44 w-full" id="mockup-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={liveTelemetryData}>
                          <defs>
                            <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="proctorGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" stroke="#475569" fontSize={8} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#475569" fontSize={8} tickLine={false} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#scoreGlow)" strokeWidth={2} name="Challenge Accuracy" />
                          <Area type="monotone" dataKey="proctor" stroke="#6366f1" fillOpacity={1} fill="url(#proctorGlow)" strokeWidth={1} strokeDasharray="3 3" name="Proctor Integrity" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              </div>

              {/* Status footer inside mockup */}
              <div className="bg-slate-55 px-5 py-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="font-semibold text-slate-600">Proctoring Engine: Online & Encrypted</span>
                </div>
                <span className="font-mono text-[9px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">DKIM: VERIFIED</span>
              </div>

              {/* Floating aesthetic overlap widgets */}
              <div className="absolute -top-6 -right-6 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xl z-20 pointer-events-none animate-bounce" style={{ animationDuration: "5.5s" }} id="mini-widget-1">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 block font-bold">MFA Lock Secure</span>
                  <span className="text-[9px] font-mono text-emerald-600 font-bold">Confidence: 99.98%</span>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xl z-20 pointer-events-none animate-bounce" style={{ animationDuration: "7.5s" }} id="mini-widget-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 block font-bold">SHA-256 Validated</span>
                  <span className="text-[9px] font-mono text-indigo-600 font-bold font-semibold">ID: cert-9210-aw</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 4. TRUSTED ENTERPRISE LOGOS */}
        <div className="w-full border-t border-b border-slate-200 bg-white/60 py-8 px-6 mt-6 relative z-20" id="trusted-companies">
          <div className="max-w-7xl mx-auto space-y-4 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono block">
              TRUSTED BY TOP-TIER ENGINEERING DEPARTMENTS WORLDWIDE
            </span>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-55 hover:opacity-90 transition-opacity duration-300">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span className="font-display font-black text-sm tracking-widest text-slate-800">STRIPE</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-500" />
                <span className="font-display font-black text-sm tracking-widest text-slate-800">LINEAR</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="font-display font-black text-sm tracking-widest text-slate-800">VERCEL</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                <span className="font-display font-black text-sm tracking-widest text-slate-800">SUPABASE</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span className="font-display font-black text-sm tracking-widest text-slate-800">OKTA</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. INTERACTIVE FEATURE BENTO GRID */}
        <section className="w-full py-20 px-6 max-w-7xl mx-auto space-y-12 relative z-20" id="features">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider font-mono">
              <Zap className="w-3.5 h-3.5" /> ZERO-TRUST CANDIDATE ECOSYSTEM
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-900 leading-tight">
              A Complete Assessment Suite Styled for High Performance
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Explore the core modules of our technical screening software by clicking on the interactive showcase tabs below.
            </p>
          </div>

          {/* Interactive Bento Showcase selector */}
          <div className="flex justify-center gap-2 max-w-md mx-auto bg-slate-100 border border-slate-200 rounded-xl p-1" id="bento-selectors">
            <button
              onClick={() => setSelectedBentoTab("sandbox")}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${selectedBentoTab === "sandbox" ? "bg-white text-indigo-700 border border-slate-200/50 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Code Sandbox
            </button>
            <button
              onClick={() => setSelectedBentoTab("ai-proctor")}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${selectedBentoTab === "ai-proctor" ? "bg-white text-indigo-700 border border-slate-200/50 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              AI Eye Proctor
            </button>
            <button
              onClick={() => setSelectedBentoTab("certificates")}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${selectedBentoTab === "certificates" ? "bg-white text-indigo-700 border border-slate-200/50 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Certificates
            </button>
          </div>

          {/* Animated Bento Preview grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="interactive-bento">
            
            {/* Interactive Preview Canvas */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-6.5 rounded-3xl relative overflow-hidden flex flex-col justify-between group min-h-[340px] shadow-lg shadow-indigo-100/10">
              
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.02),transparent)]"></div>

              <div>
                <div className="flex items-center gap-2.5 mb-4 relative z-10">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    {selectedBentoTab === "sandbox" && <Terminal className="w-5 h-5" />}
                    {selectedBentoTab === "ai-proctor" && <Fingerprint className="w-5 h-5" />}
                    {selectedBentoTab === "certificates" && <Award className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-display font-extrabold text-sm uppercase tracking-wide">
                      {selectedBentoTab === "sandbox" && "Isolated Execution Container"}
                      {selectedBentoTab === "ai-proctor" && "Continuous Video Eye proctoring"}
                      {selectedBentoTab === "certificates" && "Cryptographic Credential Generation"}
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">SYSTEM SPECIFICATION REPORT</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedBentoTab === "sandbox" && (
                    <motion.div 
                      key="sandbox-pane"
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 relative z-10"
                    >
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xl">
                        Isolated sandboxed containers execute candidates' submissions instantly using our secure server-side compiler. Integrated testing supports detailed validation suites across multiple complex engineering technologies.
                      </p>
                      
                      {/* Code Execution Shell Preview */}
                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[10px] text-emerald-450 space-y-1.5 shadow-inner">
                        <div className="text-slate-500">// Terminal environment output log</div>
                        <div>$ npm run test:pipeline</div>
                        <div>⚡ Initializing Sandboxed Node.js Container... <span className="text-indigo-400 font-bold">READY</span></div>
                        <div className="text-slate-300">✔ Test case 1/3 (Encapsulation logic) - Passed</div>
                        <div className="text-slate-300">✔ Test case 2/3 (Asymptotic O(N) constraints) - Passed</div>
                        <div className="text-emerald-450 font-bold">✔ All 3 test pipelines executed cleanly (0 errors logged, time: 24ms)</div>
                      </div>
                    </motion.div>
                  )}

                  {selectedBentoTab === "ai-proctor" && (
                    <motion.div 
                      key="proctor-pane"
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 relative z-10"
                    >
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xl">
                        Continuous webcam monitoring evaluates facial positioning, blink counters, gaze displacement, and second-person identification alerts to safeguard recruitment workflows.
                      </p>

                      {/* Face Mesh Points simulation */}
                      <div className="grid grid-cols-4 gap-2.5">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center shadow-2xs">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">EYE GLANCE</span>
                          <span className="text-emerald-600 text-xs font-mono font-bold">FOCUSED</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center shadow-2xs">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">BLINK COUNT</span>
                          <span className="text-indigo-650 text-xs font-mono font-bold">14 / MIN</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center shadow-2xs">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">FACE MESH</span>
                          <span className="text-emerald-600 text-xs font-mono font-bold">99.8% ACC</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center shadow-2xs">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">RISK WARNINGS</span>
                          <span className="text-emerald-600 text-xs font-mono font-bold">NONE</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedBentoTab === "certificates" && (
                    <motion.div 
                      key="cert-pane"
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 relative z-10"
                    >
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xl">
                        On challenge submission, generating cryptographically signed validity registry items guarantees security against candidate record tampering. Shareable with recruiters immediately.
                      </p>

                      {/* Mockup certificate verification */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex justify-between items-center text-xs shadow-2xs">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-indigo-700 block font-bold uppercase">VERIFIABLE DIGITAL CERTIFICATE</span>
                          <div className="text-slate-900 font-bold text-sm">Alexander Wright: React Core</div>
                          <div className="text-slate-500 font-mono text-[9px]">ID: cert-9210-aw • HASH: f8a3...9d12</div>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold">
                          ✓ VALID REGISTRY
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-slate-200/80 pt-4 mt-6 flex justify-between items-center text-slate-400 text-[10px] relative z-10">
                <span>INTEGRITY STANDARD 2026-SLA</span>
                <span className="text-indigo-600 font-mono font-bold">SECURE RELAY GATEWAY</span>
              </div>
            </div>

            {/* Sidebar Highlights in Bento */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-6.5 rounded-3xl flex flex-col justify-between group min-h-[340px] shadow-lg shadow-indigo-100/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(147,51,234,0.01),transparent)]"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <ShieldCheck className="w-5.5 h-5.5" />
                </div>
                <h4 className="text-slate-900 font-display font-extrabold text-sm uppercase tracking-wide">Enterprise Compliance</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Engineered with SOC2 Type II controls, continuous SPF/DKIM verification, and automated proctor tracking compliance rules.
                </p>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-150 relative z-10">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  <span>Fully localized candidate flows</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Automated SMTP outbox logs</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Scroll Prompt footer */}
        <div 
          onClick={props.onGetStarted}
          className="py-12 flex flex-col items-center gap-2.5 text-slate-500 hover:text-indigo-600 font-mono text-[10px] tracking-widest relative z-20 animate-bounce cursor-pointer" 
          id="scroll-prompt"
        >
          <span>INITIALIZE SCREENING SYSTEM PORTAL</span>
          <ChevronDown className="w-4 h-4 text-indigo-600" />
        </div>

      </main>

    </div>
  );
}
