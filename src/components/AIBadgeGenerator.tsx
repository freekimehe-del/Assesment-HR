import React, { useState } from "react";
import { Award, Copy, Check, Download, Sparkles, ShieldCheck, Zap, Info } from "lucide-react";
import { DigitalCertificate, UserProfile } from "../types";

export type BadgeTheme = "cyberpunk" | "obsidian" | "emerald" | "amethyst" | "gold";

interface BadgeThemeConfig {
  name: string;
  bgStart: string;
  bgEnd: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  textColor: string;
  accentColor: string;
}

export const BADGE_THEMES: Record<BadgeTheme, BadgeThemeConfig> = {
  cyberpunk: {
    name: "Cyberpunk Glow",
    bgStart: "#0f172a", // slate-900
    bgEnd: "#020617", // slate-950
    primaryColor: "#6366f1", // indigo-500
    secondaryColor: "#ec4899", // pink-500
    glowColor: "#818cf8", // indigo-400
    textColor: "#f8fafc", // slate-50
    accentColor: "#38bdf8" // sky-400
  },
  obsidian: {
    name: "Obsidian Quantum",
    bgStart: "#18181b", // zinc-900
    bgEnd: "#09090b", // zinc-950
    primaryColor: "#14b8a6", // teal-500
    secondaryColor: "#06b6d4", // cyan-500
    glowColor: "#2dd4bf", // teal-400
    textColor: "#fafafa", // zinc-50
    accentColor: "#22d3ee" // cyan-400
  },
  emerald: {
    name: "Emerald Peak",
    bgStart: "#064e3b", // emerald-900
    bgEnd: "#022c22", // emerald-950
    primaryColor: "#10b981", // emerald-500
    secondaryColor: "#10b981", // emerald-500
    glowColor: "#34d399", // emerald-400
    textColor: "#f0fdf4", // emerald-50
    accentColor: "#a7f3d0" // emerald-200
  },
  amethyst: {
    name: "Royal Amethyst",
    bgStart: "#3b0764", // purple-950
    bgEnd: "#1e1b4b", // indigo-950
    primaryColor: "#a855f7", // purple-500
    secondaryColor: "#f59e0b", // amber-500
    glowColor: "#c084fc", // purple-400
    textColor: "#faf5ff", // purple-50
    accentColor: "#fcd34d" // amber-300
  },
  gold: {
    name: "Gold Elite Mastery",
    bgStart: "#451a03", // amber-950
    bgEnd: "#1c1917", // stone-900
    primaryColor: "#fbbf24", // amber-400
    secondaryColor: "#d97706", // amber-650
    glowColor: "#fbbf24", // amber-400
    textColor: "#fffbeb", // amber-50
    accentColor: "#fef3c7" // amber-100
  }
};

interface AIBadgeSVGProps {
  technologyArea: string;
  score: number;
  candidateName: string;
  verificationHash: string;
  themeStyle: BadgeTheme;
  size?: number;
  id?: string;
}

export function AIBadgeSVG({
  technologyArea,
  score,
  candidateName,
  verificationHash,
  themeStyle,
  size = 300,
  id = "badge-svg"
}: AIBadgeSVGProps) {
  const theme = BADGE_THEMES[themeStyle] || BADGE_THEMES.cyberpunk;
  const shortHash = verificationHash.substr(0, 10).toUpperCase();
  
  // Choose central icon path based on category name
  const isFrontend = technologyArea.toLowerCase().includes("react") || technologyArea.toLowerCase().includes("front");
  const isSystemArch = technologyArea.toLowerCase().includes("arch") || technologyArea.toLowerCase().includes("system");
  const isSoftwareEng = technologyArea.toLowerCase().includes("software") || technologyArea.toLowerCase().includes("engine");
  
  // Performance Level Category Title
  let levelTitle = "CERTIFIED";
  if (score >= 90) {
    levelTitle = "ELITE MASTER";
  } else if (score >= 80) {
    levelTitle = "PRO EXPERT";
  } else if (score >= 70) {
    levelTitle = "PROFICIENT";
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 300 300" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      id={id}
      className="select-none filter drop-shadow-md"
    >
      <defs>
        {/* Main radial glow background */}
        <radialGradient id={`bgGrad-${themeStyle}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={theme.bgStart} />
          <stop offset="100%" stopColor={theme.bgEnd} />
        </radialGradient>

        {/* Primary Border Gradient */}
        <linearGradient id={`primaryGrad-${themeStyle}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.primaryColor} />
          <stop offset="50%" stopColor={theme.accentColor} />
          <stop offset="100%" stopColor={theme.secondaryColor} />
        </linearGradient>

        {/* Outer Glow Filter */}
        <filter id={`neonGlow-${themeStyle}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Inner shadow or subtle glow */}
        <filter id={`innerGlow-${themeStyle}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="boost">
            <feFuncA type="linear" slope="1.5" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="boost" operator="over" />
        </filter>

        {/* Text Arc paths: R=112 for perfect alignment */}
        {/* Top Arc (Clockwise path) */}
        <path 
          id={`textPathTop-${themeStyle}`} 
          d="M 38,150 A 112,112 0 0,1 262,150" 
          fill="none" 
        />
        {/* Bottom Arc (Counter-Clockwise path) */}
        <path 
          id={`textPathBottom-${themeStyle}`} 
          d="M 262,150 A 112,112 0 0,1 38,150" 
          fill="none" 
        />
      </defs>

      {/* 1. Base Circular Shield Layer */}
      <circle cx="150" cy="150" r="138" fill={`url(#bgGrad-${themeStyle})`} stroke={`url(#primaryGrad-${themeStyle})`} strokeWidth="3" />
      
      {/* 2. Outer Neon Accent Ring (Glow Effect) */}
      <circle 
        cx="150" 
        cy="150" 
        r="134" 
        stroke={theme.primaryColor} 
        strokeWidth="1.5" 
        strokeOpacity="0.4"
        filter={`url(#neonGlow-${themeStyle})`}
      />

      {/* 3. Tech-Lines Grid Background Pattern */}
      <circle cx="150" cy="150" r="126" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1" />
      <line x1="150" y1="24" x2="150" y2="276" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
      <line x1="24" y1="150" x2="276" y2="150" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
      <circle cx="150" cy="150" r="90" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />

      {/* 4. Dashed Orbit Ring */}
      <circle 
        cx="150" 
        cy="150" 
        r="121" 
        stroke={theme.accentColor} 
        strokeWidth="1" 
        strokeDasharray="4 6" 
        strokeOpacity="0.6" 
      />

      {/* 5. Circular Text labels curved on top and bottom arcs */}
      <text fill={theme.accentColor} fontSize="10" fontWeight="900" letterSpacing="2.5" fontFamily="monospace">
        <textPath href={`#textPathTop-${themeStyle}`} startOffset="50%" textAnchor="middle">
          TECHSCREEN CERTIFIED • {levelTitle}
        </textPath>
      </text>

      <text fill="#94a3b8" fontSize="8" fontWeight="600" letterSpacing="1.8" fontFamily="monospace">
        <textPath href={`#textPathBottom-${themeStyle}`} startOffset="50%" textAnchor="middle">
          HASH: {shortHash} • REGISTERED
        </textPath>
      </text>

      {/* 6. Inner Gold/Teal Plate Border */}
      <circle cx="150" cy="150" r="98" stroke={`url(#primaryGrad-${themeStyle})`} strokeWidth="2" strokeOpacity="0.8" />
      <circle cx="150" cy="150" r="94" fill={theme.bgEnd} fillOpacity="0.4" stroke={theme.glowColor} strokeWidth="1" strokeOpacity="0.2" />

      {/* 7. Central High-Tech Icon Visual */}
      <g transform="translate(150, 115) scale(1)">
        {isFrontend ? (
          // React Orbit Ring Graphic
          <g filter={`url(#innerGlow-${themeStyle})`}>
            <ellipse rx="24" ry="9" stroke={theme.primaryColor} strokeWidth="2" strokeOpacity="0.8" fill="none" transform="rotate(0)" />
            <ellipse rx="24" ry="9" stroke={theme.primaryColor} strokeWidth="2" strokeOpacity="0.8" fill="none" transform="rotate(60)" />
            <ellipse rx="24" ry="9" stroke={theme.primaryColor} strokeWidth="2" strokeOpacity="0.8" fill="none" transform="rotate(120)" />
            <circle r="6" fill={theme.accentColor} filter={`url(#neonGlow-${themeStyle})`} />
          </g>
        ) : isSystemArch ? (
          // System Nodes Graphic
          <g filter={`url(#innerGlow-${themeStyle})`} stroke={theme.primaryColor} strokeWidth="2" fill="none">
            <rect x="-18" y="-18" width="12" height="12" rx="2" fill={theme.bgStart} strokeWidth="2" />
            <rect x="6" y="-18" width="12" height="12" rx="2" fill={theme.bgStart} strokeWidth="2" />
            <rect x="-6" y="6" width="12" height="12" rx="2" fill={theme.accentColor} strokeWidth="2" />
            <path d="M -12 -6 L -6 6" strokeOpacity="0.6" />
            <path d="M 12 -6 L 6 6" strokeOpacity="0.6" />
            <path d="M -6 -12 L 6 -12" strokeOpacity="0.6" />
          </g>
        ) : (
          // Braces Code Stack Visual
          <g filter={`url(#innerGlow-${themeStyle})`}>
            {/* Elegant Shield + Code lines */}
            <path d="M-16,-18 L16,-18 L22,-2 L0,22 L-22,-2 Z" fill="none" stroke={theme.primaryColor} strokeWidth="2" />
            <text x="0" y="4" fill={theme.accentColor} fontSize="16" fontWeight="900" fontFamily="monospace" textAnchor="middle">&lt;/&gt;</text>
          </g>
        )}
      </g>

      {/* 8. Score Badge Placement */}
      <g transform="translate(150, 182)">
        {/* Mini plate */}
        <rect x="-42" y="-16" width="84" height="28" rx="6" fill={theme.bgStart} stroke={`url(#primaryGrad-${themeStyle})`} strokeWidth="1.5" />
        
        {/* Glow */}
        <rect x="-42" y="-16" width="84" height="28" rx="6" stroke={theme.glowColor} strokeWidth="1" strokeOpacity="0.3" filter={`url(#neonGlow-${themeStyle})`} />

        {/* Score Value */}
        <text x="0" y="4" fill={theme.textColor} fontSize="17" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="-0.5">
          {score}%
        </text>
        
        {/* Minor Tech Title */}
        <text x="0" y="24" fill={theme.accentColor} fontSize="6.5" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1.2" opacity="0.9">
          {technologyArea.toUpperCase()}
        </text>
      </g>

      {/* 9. Glowing Star Embellishments */}
      <g fill={theme.accentColor} opacity="0.8">
        {/* Left Sparkle */}
        <path d="M 64 140 L 66 142 L 64 144 L 62 142 Z" />
        {/* Right Sparkle */}
        <path d="M 236 140 L 238 142 L 236 144 L 234 142 Z" />
      </g>
    </svg>
  );
}

interface AIBadgeConsoleProps {
  user: UserProfile;
  certificate: DigitalCertificate;
  selectedTheme?: BadgeTheme;
  onChangeTheme?: (theme: BadgeTheme) => void;
}

export default function AIBadgeConsole({ 
  user, 
  certificate, 
  selectedTheme: propsTheme, 
  onChangeTheme 
}: AIBadgeConsoleProps) {
  const [localTheme, setLocalTheme] = useState<BadgeTheme>("cyberpunk");
  const selectedTheme = propsTheme !== undefined ? propsTheme : localTheme;
  const setSelectedTheme = (theme: BadgeTheme) => {
    if (onChangeTheme) {
      onChangeTheme(theme);
    } else {
      setLocalTheme(theme);
    }
  };
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Helper to copy SVG markup to clipboard
  const handleCopySVG = () => {
    const svgEl = document.getElementById(`interactive-cert-badge-${certificate.id}`);
    if (svgEl) {
      const svgMarkup = svgEl.outerHTML;
      navigator.clipboard.writeText(svgMarkup)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error("Could not copy SVG:", err));
    }
  };

  // Helper to trigger direct .svg download
  const handleDownloadSVG = () => {
    setDownloading(true);
    const svgEl = document.getElementById(`interactive-cert-badge-${certificate.id}`);
    if (svgEl) {
      const svgMarkup = svgEl.outerHTML;
      const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.technologyArea.replace(/\s+/g, "-")}-SaaS-Badge.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div 
      className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 space-y-5 shadow-md relative overflow-hidden"
      id={`ai-badge-console-${certificate.id}`}
    >
      {/* Decorative Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:1rem_1rem] pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row gap-5 items-center justify-between relative z-10">
        
        {/* Left: Interactive Customizer Panel */}
        <div className="space-y-4 flex-grow w-full sm:max-w-[55%]">
          <div className="space-y-1.5">
            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-400/25 rounded-md text-[9px] font-bold text-indigo-300 font-mono tracking-wider uppercase inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>SVG Cert-Seal Generator</span>
            </span>
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              Aesthetics Customizer
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Synthesize and customize a visually polished digital badge for <strong className="text-slate-200">{certificate.technologyArea}</strong> mastery. Use themes to fit your GitHub profile, LinkedIn post, or personal portfolio.
            </p>
          </div>

          {/* Theme selection buttons */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
              AI-Style Theme Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(Object.keys(BADGE_THEMES) as BadgeTheme[]).map((themeKey) => {
                const config = BADGE_THEMES[themeKey];
                const isActive = selectedTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => setSelectedTheme(themeKey)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-left transition flex items-center gap-2 border cursor-pointer ${
                      isActive 
                        ? "bg-indigo-600/15 border-indigo-500 text-white shadow-xs" 
                        : "bg-white/5 border-slate-800 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    }`}
                    id={`badge-theme-opt-${themeKey}`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs border border-white/10" 
                      style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
                    />
                    <span className="truncate">{config.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download & Copy Console Action Row */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={handleCopySVG}
              className={`px-3 py-1.8 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                copied 
                  ? "bg-emerald-600 text-white animate-pulse" 
                  : "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
              }`}
              id="btn-copy-svg-code"
              title="Copy SVG XML markup to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SVG XML Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SVG Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSVG}
              disabled={downloading}
              className="px-3 py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              id="btn-download-svg-file"
              title="Download standalone vector .svg file"
            >
              <Download className={`w-3.5 h-3.5 ${downloading ? "animate-bounce" : ""}`} />
              <span>Download Standalone SVG</span>
            </button>
          </div>
        </div>

        {/* Right: Live Dynamic Vector Display */}
        <div className="w-full sm:w-44 shrink-0 flex flex-col items-center justify-center space-y-2" id="badge-display-side">
          <div 
            className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-center shadow-inner relative group"
            id="badge-svg-display-frame"
          >
            {/* Visual shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"></div>
            
            <AIBadgeSVG
              technologyArea={certificate.technologyArea}
              score={certificate.score}
              candidateName={user.fullName}
              verificationHash={certificate.verificationHash}
              themeStyle={selectedTheme}
              size={152}
              id={`interactive-cert-badge-${certificate.id}`}
            />
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center block">
            Live Vector Seal Render
          </span>
        </div>

      </div>
    </div>
  );
}
