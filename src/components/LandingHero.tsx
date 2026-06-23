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
  ChevronDown
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
  const [activeTab, setActiveTab] = useState<"code" | "review" | "telemetry">("code");
  const [typedCode, setTypedCode] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Stats Counters
  const [stats, setStats] = useState({ candidates: 0, accuracy: 0, speed: 0 });

  useEffect(() => {
    // Stat count up simulation on load
    const interval = setInterval(() => {
      setStats((prev) => {
        const nextCandidates = prev.candidates < 14240 ? prev.candidates + 370 : 14240;
        const nextAccuracy = prev.accuracy < 99.8 ? parseFloat((prev.accuracy + 2.5).toFixed(1)) : 99.8;
        const nextSpeed = prev.speed < 2.1 ? parseFloat((prev.speed + 0.1).toFixed(1)) : 2.1;
        return { candidates: nextCandidates, accuracy: nextAccuracy, speed: nextSpeed };
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Simple typing animation in the IDE mockup
  useEffect(() => {
    const fullCode = `import { GoogleGenAI } from "@google/genai";\n\n// Initialize intelligent screening agent\nconst ai = new GoogleGenAI();\nconst review = await ai.models.generateContent({\n  model: "gemini-2.5-flash",\n  contents: "Analyze candidates complexity and security posture..."\n});\n\nexport const status = "PROCTORING_SECURED";`;
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullCode.length) {
        setTypedCode(fullCode.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 35);
    return () => clearInterval(typingInterval);
  }, []);

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
    }, 1800);
  };

  return (
    <div 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden" 
      id="premium-landing-root"
    >
      
      {/* 1. Futuristic Dynamic Glow Grid (Interactive Parallax Mouse Effect) */}
      <div className="absolute inset-0 pointer-events-none z-0" id="mesh-background-glow">
        <div 
          className="absolute rounded-full transition-opacity duration-500 blur-[130px]"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(0, 0, 0, 0) 100%)",
            left: `${mousePosition.x - 300}px`,
            top: `${mousePosition.y - 300}px`,
            opacity: isHovered ? 1 : 0.4,
          }}
        />
        {/* Constant background mesh grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[140px]"></div>
      </div>

      {/* 2. Sleek Glassmorphic Header Navigation */}
      <header className="w-full bg-slate-950/70 backdrop-blur-md border-b border-slate-900/80 px-6 py-4 relative z-40 sticky top-0" id="landing-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-sans font-bold tracking-tight text-white block text-sm leading-none">TechScreen</span>
              <span className="text-[9px] text-indigo-400 font-mono tracking-wider uppercase font-semibold">SaaS Competency Hub</span>
            </div>
          </div>

          {/* Quick Info Menu */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#telemetry-preview" className="hover:text-white transition">Proctor Demo</a>
            <a href="#quick-sandbox" className="hover:text-white transition">Sandbox Hub</a>
            <span className="h-4 w-px bg-slate-800"></span>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-full text-[10px] font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span>COMPLIANT STATUS: SECURED</span>
            </div>
          </nav>

          {/* CTA Group */}
          <div className="flex items-center gap-3">
            <button 
              onClick={props.onLoginClick}
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 transition cursor-pointer"
              id="header-signin-btn"
            >
              Sign In
            </button>
            <button 
              onClick={props.onGetStarted}
              className="text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 transition-all rounded-lg px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-indigo-500/10"
              id="header-cta-btn"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section Body */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-20" id="landing-hero-main">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* LEFT COLUMN: Premium Copy & Counters */}
          <div className="lg:col-span-6 space-y-6 text-left" id="hero-left-content">
            
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 rounded-full text-xs font-semibold tracking-wide shadow-inner animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>NEW: Gemini-Powered Autonomous Assessment 2.0</span>
            </div>

            {/* Master Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              Standardize & Certify <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 drop-shadow-sm">
                Engineering Competency
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
              Eliminate recruitment guesswork. Deploy enterprise-grade coding tests, dynamic multi-language sandboxes, real-time AI eye proctoring, and automated code review summaries.
            </p>

            {/* CTA Buttons with Micro-interactions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={props.onGetStarted}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer text-sm"
                id="hero-primary-cta"
              >
                <span>Initialize Platform Access</span>
                <ArrowRight className="w-4 h-4 text-indigo-200" />
              </button>
              <a
                href="#features"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition duration-300 flex items-center justify-center gap-2 text-sm"
                id="hero-secondary-cta"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Explore SLA Features</span>
              </a>
            </div>

            {/* Interactive Demo Fast-Tracks Panel */}
            <div className="p-4 bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl max-w-xl space-y-3 shadow-md" id="fast-tracks-panel">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                  Sandbox Bypass Console (One-Click Testing)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={props.onDemoCandidate}
                  className="px-2.5 py-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800/60 text-slate-300 hover:text-indigo-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all"
                  id="sandbox-candidate-bypass"
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Candidate</span>
                </button>
                <button
                  onClick={props.onDemoRecruiter}
                  className="px-2.5 py-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800/60 text-slate-300 hover:text-indigo-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all"
                  id="sandbox-recruiter-bypass"
                >
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Recruiter</span>
                </button>
                <button
                  onClick={props.onDemoAdmin}
                  className="px-2.5 py-2 bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-800/60 text-slate-300 hover:text-indigo-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all"
                  id="sandbox-admin-bypass"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Platform Admin</span>
                </button>
              </div>
            </div>

            {/* Live Stats Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-900 max-w-xl" id="hero-live-stats">
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-white block">
                  {stats.candidates.toLocaleString()}+
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                  Completed Tests
                </span>
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 block">
                  {stats.accuracy}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                  Proctor Precision
                </span>
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-indigo-400 block">
                  &lt;{stats.speed}s
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                  AI Review Time
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Premium High-Fidelity Interactive Dashboard Mockup */}
          <div className="lg:col-span-6 flex justify-center relative" id="hero-right-visuals">
            
            {/* Background Glow effects for mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px] z-0"></div>
            <div className="absolute top-1/4 right-10 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] z-0"></div>

            {/* High-fidelity Mockup Glass Wrapper */}
            <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 font-sans" id="premium-dashboard-mockup">
              
              {/* OS / Header bar of IDE */}
              <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
                </div>
                <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  <button 
                    onClick={() => setActiveTab("code")}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition ${activeTab === "code" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Sandbox.ts
                  </button>
                  <button 
                    onClick={() => setActiveTab("review")}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition ${activeTab === "review" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    AI Review
                  </button>
                  <button 
                    onClick={() => setActiveTab("telemetry")}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition ${activeTab === "telemetry" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Proctoring Log
                  </button>
                </div>
                <div className="text-[11px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/60 px-2 py-0.5 rounded-md">
                  LIVE SECURED
                </div>
              </div>

              {/* IDE Content Area */}
              <div className="p-4 h-64 font-mono text-xs overflow-y-auto bg-slate-950/40">
                
                {activeTab === "code" && (
                  <div className="space-y-2 text-slate-300">
                    <div className="text-slate-500">// Simulated Screening coding challenge</div>
                    <pre className="text-left whitespace-pre-wrap font-mono text-[11px] leading-relaxed select-none">
                      {typedCode}
                      <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-ping ml-0.5"></span>
                    </pre>

                    {/* Compile trigger within mockup */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-900 mt-4">
                      <div className="flex items-center gap-2">
                        {isCompiling ? (
                          <span className="text-[11px] text-amber-400 flex items-center gap-1 font-sans">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Compiling sandbox set...
                          </span>
                        ) : compileSuccess ? (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-sans">
                            <Check className="w-3 h-3" /> Execution succeeded (Passed: 14/14 cases)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-sans">Ready to compile</span>
                        )}
                      </div>
                      <button 
                        onClick={handleRunCompiler}
                        disabled={isCompiling}
                        className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 disabled:opacity-50 text-[10px] font-sans font-bold rounded-lg flex items-center gap-1 cursor-pointer transition"
                      >
                        <Play className="w-3 h-3" /> Run Compiler
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "review" && (
                  <div className="space-y-3 font-sans text-slate-300">
                    <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-indigo-400" /> GEMINI AI METRIC REPORT
                        </span>
                        <span className="text-[11px] font-mono font-extrabold text-emerald-400">SCORE: 92%</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Code demonstrated elegant asymptotic complexity of <strong className="text-indigo-200">O(N log N)</strong>. Clean encapsulation and appropriate memory bounds with zero security vulnerabilities found.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">Complexity:</span>
                        <span className="font-semibold text-white">Optimal</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">Security check:</span>
                        <span className="font-semibold text-emerald-400">PASSED</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "telemetry" && (
                  <div className="space-y-2 font-sans text-slate-300">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-900 pb-1.5 mb-2">
                      <span>Proctoring Category</span>
                      <span>Telemetry Feed</span>
                    </div>
                    
                    {/* Live streaming graph inside IDE mockup! */}
                    <div className="h-40 w-full" id="mockup-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={liveTelemetryData}>
                          <defs>
                            <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" stroke="#475569" fontSize={8} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#475569" fontSize={8} tickLine={false} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#scoreGlow)" strokeWidth={2} name="Screening Accuracy" />
                          <Area type="monotone" dataKey="proctor" stroke="#6366f1" fill="none" strokeWidth={1} strokeDasharray="3 3" name="Proctor Integrity" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              </div>

              {/* Status bar & Floating Micro Cards */}
              <div className="bg-slate-950 px-4 py-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>Proctoring Module: Active</span>
                </div>
                <span>Candidate ID: usr_alex_02</span>
              </div>

              {/* Layered Floating Mini-Widgets overlapping the mockup card for high-end depth */}
              <div className="absolute -top-6 -right-6 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg z-20 pointer-events-none animate-bounce" style={{ animationDuration: "6s" }} id="mini-widget-1">
                <div className="p-1 bg-emerald-500/15 text-emerald-400 rounded-lg">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">MFA Verified</span>
                  <span className="text-[9px] font-mono text-emerald-400">Match Accuracy: 99.9%</span>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg z-20 pointer-events-none animate-bounce" style={{ animationDuration: "8s" }} id="mini-widget-2">
                <div className="p-1 bg-indigo-500/15 text-indigo-400 rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Credential Logged</span>
                  <span className="text-[9px] font-mono text-indigo-400">Hash: df6e...b37e</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 4. Trusted Enterprise Logos (Sleek, low-opacity minimalist layout) */}
        <div className="w-full border-t border-b border-slate-900 bg-slate-950/40 py-8 px-6 mt-4 relative z-20" id="trusted-companies">
          <div className="max-w-7xl mx-auto space-y-4 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono block">
              Trusted by leading engineering organizations
            </span>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 hover:opacity-75 transition-opacity duration-300">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4.5 h-4.5 text-slate-400" />
                <span className="font-bold text-sm tracking-widest text-white">STRIPE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Code className="w-4.5 h-4.5 text-slate-400" />
                <span className="font-bold text-sm tracking-widest text-white">LINEAR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-slate-400" />
                <span className="font-bold text-sm tracking-widest text-white">VERCEL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4.5 h-4.5 text-slate-400" />
                <span className="font-bold text-sm tracking-widest text-white">SUPABASE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-slate-400" />
                <span className="font-bold text-sm tracking-widest text-white">OKTA</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Features Highlight Section (Bento Grid) */}
        <section className="w-full py-16 px-6 max-w-7xl mx-auto space-y-12 relative z-20" id="features">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider font-mono">
              <Zap className="w-3 h-3" /> Zero-Trust Proctoring & Validation
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              SaaS Assessment Features Designed for Security
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              An interconnected set of tools empowering both candidate sandboxing and recruiter insight dashboards.
            </p>
          </div>

          {/* Bento-style Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="bento-grid">
            
            {/* Feature Card 1 */}
            <div className="bg-slate-900/40 border border-slate-900 hover:border-indigo-500/20 p-6 rounded-2xl space-y-3 shadow-md transition-all duration-300 group hover:bg-slate-900/60" id="feature-bento-1">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Dynamic Isolated Sandboxes</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Execute testing in securely isolated containers with Node, Python, and SQL environments. Integrated with automated test execution suites.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-slate-900/40 border border-slate-900 hover:border-indigo-500/20 p-6 rounded-2xl space-y-3 shadow-md transition-all duration-300 group hover:bg-slate-900/60" id="feature-bento-2">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-300">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">AI Face & Eye Proctoring</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Autonomous browser restrictions, screen tracking, and live face scanning flag potential auxiliary aid usage with high verification integrity.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-slate-900/40 border border-slate-900 hover:border-indigo-500/20 p-6 rounded-2xl space-y-3 shadow-md transition-all duration-300 group hover:bg-slate-900/60" id="feature-bento-3">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform duration-300">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Digital Validity Certificates</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Generate tamper-proof public validity registries representing candidate scores. Verifiable securely by recruiters in a click.
              </p>
            </div>

          </div>
        </section>

        {/* Scroll Indicator */}
        <div className="py-6 flex flex-col items-center gap-1.5 text-slate-500 font-mono text-[10px] tracking-widest relative z-20 animate-bounce cursor-pointer mt-4" id="scroll-prompt">
          <span>PROCTOR SPECIFICATIONS</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

      </main>

    </div>
  );
}
