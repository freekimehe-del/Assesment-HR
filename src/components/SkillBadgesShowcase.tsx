import React, { useState, useMemo } from "react";
import { 
  Award, 
  Lock, 
  Unlock, 
  Sparkles, 
  Check, 
  Share2, 
  Cpu, 
  Layers, 
  Monitor, 
  Layout, 
  ClipboardList, 
  ShieldCheck, 
  Trophy, 
  Eye, 
  X,
  Copy,
  Download,
  Info
} from "lucide-react";
import { UserProfile, AssessmentAttempt, DigitalCertificate } from "../types";
import { AIBadgeSVG, BADGE_THEMES, BadgeTheme } from "./AIBadgeGenerator";

interface SkillBadgeDef {
  id: string;
  name: string;
  category: string;
  threshold: number;
  description: string;
  iconType: "react" | "algorithm" | "architecture" | "uiux" | "agile" | "qa";
  badgeTheme: BadgeTheme;
}

const SKILL_BADGES_LIST: SkillBadgeDef[] = [
  {
    id: "react_expert",
    name: "React Expert",
    category: "Front-End Development",
    threshold: 85,
    description: "Earned by achieving 85%+ in Front-End Development. Certifies elite mastery of React Hooks, render cycles, state synchronization, and DOM efficiency.",
    iconType: "react",
    badgeTheme: "cyberpunk"
  },
  {
    id: "frontend_wizard",
    name: "Front-End Wizard",
    category: "Front-End Development",
    threshold: 70,
    description: "Earned by achieving 70%+ in Front-End Development. Certifies high proficiency in responsive layouts, utility classes, and standard visual patterns.",
    iconType: "react",
    badgeTheme: "emerald"
  },
  {
    id: "algorithm_master",
    name: "Algorithm Master",
    category: "Back-End Development",
    threshold: 85,
    description: "Earned by achieving 85%+ in Back-End Development. Certifies exceptional skill in design patterns, data structures, algorithms, and secure server-side logic.",
    iconType: "algorithm",
    badgeTheme: "obsidian"
  },
  {
    id: "backend_specialist",
    name: "Back-End Specialist",
    category: "Back-End Development",
    threshold: 70,
    description: "Earned by achieving 70%+ in Back-End Development. Certifies proficiency in REST APIs, controller routing, error handling, and robust typing.",
    iconType: "algorithm",
    badgeTheme: "amethyst"
  },
  {
    id: "fullstack_architect",
    name: "Full Stack Architect",
    category: "Full Stack Development",
    threshold: 85,
    description: "Earned by achieving 85%+ in Full Stack Development. Certifies advanced competency in full-stack orchestration, database indexes, and server caching.",
    iconType: "architecture",
    badgeTheme: "gold"
  },
  {
    id: "fullstack_engineer",
    name: "Full Stack Engineer",
    category: "Full Stack Development",
    threshold: 70,
    description: "Earned by achieving 70%+ in Full Stack Development. Certifies skill in full-stack flow, endpoint styling integration, and database operations.",
    iconType: "architecture",
    badgeTheme: "cyberpunk"
  },
  {
    id: "uiux_mastermind",
    name: "UI/UX Mastermind",
    category: "UI/UX Development",
    threshold: 85,
    description: "Earned by achieving 85%+ in UI/UX Development. Certifies mastery of high-fidelity layouts, micro-animations, theme management, and typography.",
    iconType: "uiux",
    badgeTheme: "amethyst"
  },
  {
    id: "uiux_developer",
    name: "UI/UX Developer",
    category: "UI/UX Development",
    threshold: 70,
    description: "Earned by achieving 70%+ in UI/UX Development. Certifies skill in styling systems, design systems compliance, and user navigation layouts.",
    iconType: "uiux",
    badgeTheme: "emerald"
  },
  {
    id: "qa_guru",
    name: "QA Guru",
    category: "Quality Assurance",
    threshold: 85,
    description: "Earned by achieving 85%+ in Quality Assurance. Certifies master-level automation design, boundary conditions mapping, and flawless coverage.",
    iconType: "qa",
    badgeTheme: "obsidian"
  },
  {
    id: "automation_expert",
    name: "Automation Expert",
    category: "Quality Assurance",
    threshold: 70,
    description: "Earned by achieving 70%+ in Quality Assurance. Certifies proficiency in test suites implementation, assertions, and integration checks.",
    iconType: "qa",
    badgeTheme: "cyberpunk"
  },
  {
    id: "agile_leader",
    name: "Agile Leader",
    category: "Software Project Management",
    threshold: 85,
    description: "Earned by achieving 85%+ in Software Project Management. Certifies director-level agility, milestone scheduling, delivery tracking, and velocity analysis.",
    iconType: "agile",
    badgeTheme: "gold"
  },
  {
    id: "scrum_specialist",
    name: "Scrum Specialist",
    category: "Software Project Management",
    threshold: 70,
    description: "Earned by achieving 70%+ in Software Project Management. Certifies solid comprehension of sprint mechanics, estimation practices, and backlog hygiene.",
    iconType: "agile",
    badgeTheme: "amethyst"
  }
];

const BadgeIcon = ({ type, className = "w-5 h-5" }: { type: string; className?: string }) => {
  switch (type) {
    case "react":
      return <Monitor className={className} />;
    case "algorithm":
      return <Cpu className={className} />;
    case "architecture":
      return <Layers className={className} />;
    case "uiux":
      return <Layout className={className} />;
    case "agile":
      return <ClipboardList className={className} />;
    case "qa":
      return <ShieldCheck className={className} />;
    default:
      return <Award className={className} />;
  }
};

interface SkillBadgesShowcaseProps {
  user: UserProfile;
  attempts: AssessmentAttempt[];
  certs: DigitalCertificate[];
}

export default function SkillBadgesShowcase({ user, attempts, certs }: SkillBadgesShowcaseProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedBadge, setSelectedBadge] = useState<SkillBadgeDef | null>(null);
  const [customTheme, setCustomTheme] = useState<BadgeTheme | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Derive highest score for each category
  const categoryScores = useMemo(() => {
    const scores: Record<string, number> = {};
    
    // 1. Process attempts
    attempts.forEach(att => {
      if (att.status === "completed" && att.overallCandidateScore !== undefined) {
        const cat = att.category;
        scores[cat] = Math.max(scores[cat] || 0, att.overallCandidateScore);
      }
    });
    
    // 2. Process certs
    certs.forEach(cert => {
      const cat = cert.technologyArea;
      scores[cat] = Math.max(scores[cat] || 0, cert.score);
    });
    
    // 3. Fallback for preset candidates (e.g. Alex Rivera)
    if (user.id === "user-candidate-1") {
      scores["Full Stack Development"] = Math.max(scores["Full Stack Development"] || 0, 85);
    }
    
    return scores;
  }, [attempts, certs, user.id]);

  // Map each badge definition to its status
  const badges = useMemo(() => {
    return SKILL_BADGES_LIST.map(def => {
      const highestScore = categoryScores[def.category] || 0;
      const isUnlocked = highestScore >= def.threshold;
      
      // Try to find the associated certificate or attempt
      const matchingCert = certs.find(c => c.technologyArea === def.category);
      const matchingAttempt = attempts.find(a => a.category === def.category && a.status === "completed");
      
      // Derive a mock or actual verification hash
      const verificationHash = matchingCert?.verificationHash || 
                            matchingAttempt?.id?.replace("attempt-", "") || 
                            "B0A2F9E58C174D3B";

      const dateEarned = matchingCert?.assessmentDate || 
                         matchingAttempt?.endTime?.split("T")[0] || 
                         "2026-06-25";

      return {
        ...def,
        isUnlocked,
        currentScore: highestScore,
        verificationHash,
        dateEarned
      };
    });
  }, [categoryScores, certs, attempts]);

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  const filteredBadges = useMemo(() => {
    if (filter === "unlocked") return badges.filter(b => b.isUnlocked);
    if (filter === "locked") return badges.filter(b => !b.isUnlocked);
    return badges;
  }, [badges, filter]);

  const activeBadgeDetails = useMemo(() => {
    if (!selectedBadge) return null;
    return badges.find(b => b.id === selectedBadge.id) || null;
  }, [selectedBadge, badges]);

  // Current active theme inside modal
  const modalTheme = customTheme || (selectedBadge?.badgeTheme || "cyberpunk");

  const handleCopySVG = () => {
    const svgEl = document.getElementById(`modal-badge-svg-${selectedBadge?.id}`);
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

  const handleDownloadSVG = () => {
    const svgEl = document.getElementById(`modal-badge-svg-${selectedBadge?.id}`);
    if (svgEl) {
      const svgMarkup = svgEl.outerHTML;
      const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedBadge?.name.replace(/\s+/g, "-")}-Skill-Badge.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getShareText = () => {
    if (!activeBadgeDetails) return "";
    return `🏆 I am excited to share that I have earned the verified '${activeBadgeDetails.name}' Skill Badge on TechScreen! \n\n🎯 Peak Category Score: ${Math.round(activeBadgeDetails.currentScore)}% in ${activeBadgeDetails.category}\n🔒 Verification Hash: ${activeBadgeDetails.verificationHash.toUpperCase()}\n\nCheck out my verified professional credentials! #TechScreen #Certified #CompetencyHub #SkillsFirst`;
  };

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(getShareText())
      .then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="profile-skill-badges-card">
      {/* Card Header */}
      <div className="border-b border-slate-150 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="text-indigo-600 w-4.5 h-4.5 animate-pulse" />
            <span>Verified Digital Skill Badges</span>
          </h2>
          <p className="text-slate-500 text-xs">
            Hit required assessment thresholds to unlock and display high-tech credentials.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
          <span className="text-[11px] font-bold text-indigo-800 font-mono">
            {unlockedCount} / {badges.length} Badges Unlocked
          </span>
        </div>
      </div>

      {/* Interactive Tabs / Filters */}
      <div className="flex items-center gap-2 mb-4 bg-slate-50 p-1 rounded-lg border border-slate-200/60 max-w-sm">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex-1 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
            filter === "all" ? "bg-white text-slate-800 shadow-xs border border-slate-150" : "text-slate-500 hover:text-slate-700"
          }`}
          id="badge-filter-all"
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("unlocked")}
          className={`flex-1 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
            filter === "unlocked" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-700"
          }`}
          id="badge-filter-unlocked"
        >
          Unlocked ({unlockedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("locked")}
          className={`flex-1 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
            filter === "locked" ? "bg-slate-250 text-slate-700 shadow-xs" : "text-slate-500 hover:text-slate-700"
          }`}
          id="badge-filter-locked"
        >
          Locked
        </button>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" id="badges-grid-container">
        {filteredBadges.map((badge) => {
          const isUnlocked = badge.isUnlocked;
          const config = BADGE_THEMES[badge.badgeTheme] || BADGE_THEMES.cyberpunk;
          const scorePercent = Math.min(100, Math.round((badge.currentScore / badge.threshold) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => isUnlocked && (setSelectedBadge(badge), setCustomTheme(null))}
              className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                isUnlocked
                  ? "bg-slate-900 border-slate-800 text-slate-100 hover:shadow-md hover:scale-[1.01] hover:border-slate-700 cursor-pointer group"
                  : "bg-slate-50/50 border-slate-200 text-slate-500 opacity-80"
              }`}
              id={`badge-card-${badge.id}`}
            >
              <div className="space-y-2.5">
                {/* Badge Header Row */}
                <div className="flex justify-between items-start">
                  <div 
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                      isUnlocked 
                        ? "text-white" 
                        : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}
                    style={isUnlocked ? { 
                      background: `linear-gradient(135deg, ${config.bgStart}, ${config.bgEnd})`,
                      borderColor: config.primaryColor,
                      boxShadow: `0 0 10px ${config.glowColor}25`
                    } : undefined}
                  >
                    <BadgeIcon type={badge.iconType} className="w-4.5 h-4.5" />
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                      <Unlock className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                {/* Name & description */}
                <div className="space-y-1">
                  <h4 className={`text-xs font-black ${isUnlocked ? "text-white group-hover:text-indigo-300" : "text-slate-700 font-bold"}`}>
                    {badge.name}
                  </h4>
                  <p className="text-[10px] leading-relaxed opacity-80 line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress or Score Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200/10 border-dashed">
                {isUnlocked ? (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-mono">Peak Score:</span>
                    <span className="font-extrabold text-indigo-400 font-mono text-xs flex items-center gap-1">
                      {Math.round(badge.currentScore)}%
                      <span className="text-[9px] text-emerald-400">({badge.threshold}% req)</span>
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">Required: {badge.threshold}%</span>
                      <span className="text-slate-500 font-mono font-bold">
                        {Math.round(badge.currentScore)}% Best
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL VIEW / THEME CUSTOMIZER MODAL */}
      {selectedBadge && activeBadgeDetails && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          id="badge-detail-modal-overlay"
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full text-slate-100 overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
            id="badge-detail-modal-card"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute right-4 top-4 p-1.5 bg-white/5 hover:bg-white/10 border border-slate-800 hover:text-white rounded-lg transition z-20 cursor-pointer"
              title="Close modal"
              id="close-badge-modal-btn"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Left Column: Vector Preview & Theme Switcher */}
            <div className="p-6 bg-slate-950/40 border-r border-slate-800 flex flex-col items-center justify-center md:w-[45%] shrink-0">
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-850 shadow-inner relative group mb-3">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"></div>
                <AIBadgeSVG
                  technologyArea={activeBadgeDetails.category}
                  score={activeBadgeDetails.currentScore}
                  candidateName={user.fullName}
                  verificationHash={activeBadgeDetails.verificationHash}
                  themeStyle={modalTheme}
                  size={160}
                  id={`modal-badge-svg-${activeBadgeDetails.id}`}
                />
              </div>

              <span className="text-[10px] font-mono text-slate-400 tracking-wider mb-4 uppercase">
                Vector Preview
              </span>

              {/* Theme Customizer Inside Detail View */}
              <div className="space-y-2 w-full">
                <label className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono text-center">
                  Synthesizer Theme
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(BADGE_THEMES) as BadgeTheme[]).map((themeKey) => {
                    const config = BADGE_THEMES[themeKey];
                    const isActive = modalTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => setCustomTheme(themeKey)}
                        className={`px-2 py-1.5 rounded-lg text-[9px] font-bold text-left transition flex items-center gap-1.5 border cursor-pointer truncate ${
                          isActive 
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-xs" 
                            : "bg-white/5 border-slate-850 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                        }`}
                        id={`modal-theme-btn-${themeKey}`}
                      >
                        <span 
                          className="w-2 h-2 rounded-full shrink-0 border border-white/10" 
                          style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
                        />
                        <span className="truncate">{config.name.replace(" Glow", "").replace(" Peak", "").replace(" Mastery", "")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Information, Verification & Social Sharing */}
            <div className="p-6 flex flex-col justify-between flex-grow">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-mono text-indigo-300 font-bold uppercase inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Verifiable Credential</span>
                  </span>
                  <h3 className="text-base font-black text-white">{activeBadgeDetails.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activeBadgeDetails.description}
                  </p>
                </div>

                {/* Score & Validation Bench */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">CATEGORY EXAMINED</span>
                    <span className="text-[11px] font-bold text-slate-200 truncate block">{activeBadgeDetails.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">PEAK PERFORMANCE</span>
                    <span className="text-[11px] font-extrabold text-indigo-400 block font-mono">
                      {Math.round(activeBadgeDetails.currentScore)}%
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-2 mt-1">
                    <span className="text-[9px] text-slate-400 block font-mono">DATE RECORDED</span>
                    <span className="text-[11px] font-bold text-slate-200 block">{activeBadgeDetails.dateEarned}</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 mt-1">
                    <span className="text-[9px] text-slate-400 block font-mono">REGISTRY HASH</span>
                    <span className="text-[11px] font-bold text-emerald-400 block font-mono truncate" title={activeBadgeDetails.verificationHash.toUpperCase()}>
                      {activeBadgeDetails.verificationHash.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Copy / Download buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopySVG}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      copied 
                        ? "bg-emerald-600 border-emerald-500 text-white" 
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                    }`}
                    id="modal-copy-svg"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied SVG Markup" : "Copy SVG Code"}</span>
                  </button>

                  <button
                    onClick={handleDownloadSVG}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    id="modal-download-svg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </button>
                </div>

                {/* Social Share Box */}
                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 block font-mono">
                    Professional Social Share Builder
                  </span>
                  <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-850 text-[10px] font-mono text-slate-300 leading-normal max-h-24 overflow-y-auto select-all">
                    {getShareText()}
                  </div>
                  <button
                    onClick={handleCopyShareText}
                    className={`w-full py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      copiedText
                        ? "bg-emerald-600/25 border-emerald-500 text-emerald-300"
                        : "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-300"
                    }`}
                    id="modal-copy-share"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedText ? "Share Text Copied!" : "Copy Ready-to-Post Share Text"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
