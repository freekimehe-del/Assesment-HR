import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Search, 
  Award, 
  TrendingUp, 
  User, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Target,
  Zap,
  Globe,
  ArrowRight,
  Medal,
  ChevronRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { UserProfile } from "../types";

interface LeaderboardEntry {
  id: string;
  fullName: string;
  location: string;
  score: number;
  category: string;
  avatarUrl: string;
  isBenchmark: boolean;
  rank: number;
}

interface MyStats {
  rank: number;
  score: number;
  percentile: number;
  totalCompetitors: number;
}

interface DistributionItem {
  range: string;
  count: number;
  label: string;
}

interface GlobalLeaderboardProps {
  user: UserProfile;
  onLaunchAssessment: () => void;
}

export default function GlobalLeaderboard({ user, onLaunchAssessment }: GlobalLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchLeaderboard();
  }, [user.id]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assessment/leaderboard?candidateId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setMyStats(data.myStats || null);
        setDistribution(data.distribution || []);
      }
    } catch (err) {
      console.error("Failed to fetch global leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered entries
  const filteredLeaderboard = leaderboard.filter(entry => {
    const matchesSearch = entry.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (categoryFilter === "all") return matchesSearch;
    return matchesSearch && entry.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  // Extract unique technology categories for filters
  const categories = ["all", ...Array.from(new Set(leaderboard.map(e => {
    if (e.category.includes("&")) return e.category.split("&")[0].trim();
    if (e.category.includes("and")) return e.category.split("and")[0].trim();
    return e.category;
  })))].slice(0, 6);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-3xs" id="leaderboard-loader">
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Compiling Global Competitor Cohorts...</p>
          <p className="text-[11px] text-slate-400 mt-1">Calculating verified developer percentiles and loading distribution curves...</p>
        </div>
      </div>
    );
  }

  const hasScore = myStats && myStats.score > 0;

  return (
    <div className="space-y-6" id="global-leaderboard-root">
      
      {/* 1. Standing & Statistics Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-950 shadow-md relative overflow-hidden" id="standing-stats-hero">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Globe className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
              <span>Verified Global Cohort</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
              Your Professional Standing
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Compare your verified performance telemetry against world-class developers globally. Higher scores boost profile recommendations to certified premium recruiters.
            </p>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-3 gap-3 shrink-0" id="stats-ribbon">
            
            {/* Stat: Rank */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block">Global Rank</span>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-white font-sans mt-1 block">
                {hasScore ? `#${myStats?.rank}` : "—"}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                of {myStats?.totalCompetitors}
              </span>
            </div>

            {/* Stat: Percentile */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block">Percentile</span>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-emerald-400 font-sans mt-1 block">
                {hasScore ? `${myStats?.percentile}th` : "—"}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {hasScore ? `Top ${100 - (myStats?.percentile || 0)}%` : "Unranked"}
              </span>
            </div>

            {/* Stat: High Score */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[90px] sm:min-w-[110px]">
              <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider block">Verified Peak</span>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-indigo-300 font-sans mt-1 block">
                {hasScore ? `${myStats?.score}%` : "—"}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                Competency Avg
              </span>
            </div>

          </div>
        </div>

        {/* Call to action for unranked candidates */}
        {!hasScore && (
          <div className="mt-5 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10" id="leaderboard-cta-banner">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-bounce" />
              </div>
              <p className="text-[11px] text-slate-300">
                You haven't completed any competency screening assessments yet. Launch a test to map your verified score onto the bell curve!
              </p>
            </div>
            <button
              onClick={onLaunchAssessment}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition whitespace-nowrap cursor-pointer hover:scale-[1.02]"
            >
              <span>Launch First Assessment</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Visual Cohort Distribution Bell Curve Chart (Recharts) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs" id="leaderboard-distribution-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-indigo-650" />
              <span>Verified Score Distribution Bell-Curve</span>
            </h3>
            <p className="text-[10px] text-slate-500">
              Where candidates cluster globally based on multi-language sandbox validation tests.
            </p>
          </div>
          {hasScore && (
            <div className="bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-lg text-[10px] text-indigo-800 font-semibold flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>Your Peak of {myStats?.score}% places you above {myStats?.percentile}% of contenders.</span>
            </div>
          )}
        </div>

        {/* Recharts Bar chart container */}
        <div className="h-44 w-full" id="recharts-bell-curve-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }} 
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: "#64748b", fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono border border-slate-800 shadow-lg">
                        <span className="font-bold text-indigo-300">Score Range: {data.range}%</span>
                        <div className="mt-0.5 text-slate-300">Contenders: {data.count} candidates</div>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {distribution.map((entry, idx) => {
                  // Highlight the bar representing the user's score
                  let isUserBar = false;
                  if (hasScore && myStats) {
                    const userScore = myStats.score;
                    if (userScore >= 50 && userScore <= 60 && idx === 0) isUserBar = true;
                    else if (userScore >= 61 && userScore <= 70 && idx === 1) isUserBar = true;
                    else if (userScore >= 71 && userScore <= 80 && idx === 2) isUserBar = true;
                    else if (userScore >= 81 && userScore <= 90 && idx === 3) isUserBar = true;
                    else if (userScore >= 91 && userScore <= 100 && idx === 4) isUserBar = true;
                  }

                  return (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={isUserBar ? "#6366f1" : "#cbd5e1"} 
                      className={isUserBar ? "opacity-100" : "opacity-80 hover:opacity-100 transition-opacity"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col md:flex-row items-center gap-3 justify-between" id="leaderboard-filters-bar">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 outline-none transition"
          />
        </div>

        {/* Filter categories */}
        <div className="flex gap-1.5 items-center overflow-x-auto w-full md:w-auto pb-1 md:pb-0" id="tech-filters-container">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 mr-1 hidden sm:inline">Track:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition capitalize shrink-0 cursor-pointer ${
                categoryFilter === cat 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat === "all" ? "All Languages" : cat}
            </button>
          ))}
        </div>

      </div>

      {/* 4. Ranked List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden" id="leaderboard-list-panel">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
            Verified Global Leaderboard Table
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            Showing {filteredLeaderboard.length} Candidates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-450 border-b border-slate-200 font-mono text-[9px] uppercase tracking-wider">
                <th className="py-2.5 px-4 text-center w-14">Rank</th>
                <th className="py-2.5 px-4">Developer Profile</th>
                <th className="py-2.5 px-4">Technology Track</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4 text-right">Verified Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((entry) => {
                const isMe = entry.id === user.id;
                
                // Rank specific visuals
                let rankIcon = null;
                let rankClass = "text-slate-500 bg-slate-100 border-slate-200";
                
                if (entry.rank === 1) {
                  rankIcon = <Award className="w-3.5 h-3.5 text-amber-500" />;
                  rankClass = "bg-amber-50 border-amber-200 text-amber-800 font-extrabold shadow-3xs";
                } else if (entry.rank === 2) {
                  rankIcon = <Medal className="w-3.5 h-3.5 text-slate-400" />;
                  rankClass = "bg-slate-50 border-slate-250 text-slate-700 font-extrabold";
                } else if (entry.rank === 3) {
                  rankIcon = <Medal className="w-3.5 h-3.5 text-amber-700" />;
                  rankClass = "bg-amber-50/50 border-amber-200 text-amber-900 font-bold";
                }

                return (
                  <tr 
                    key={entry.id} 
                    className={`border-b border-slate-100 transition-colors ${
                      isMe 
                        ? "bg-indigo-50/55 hover:bg-indigo-50 border-l-2 border-l-indigo-650" 
                        : "hover:bg-slate-50/50"
                    }`}
                    id={`leaderboard-row-${entry.id}`}
                  >
                    {/* Rank Badge Column */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`w-6 h-6 rounded-full border text-[11px] font-mono flex items-center justify-center gap-0.5 ${rankClass}`}>
                          {rankIcon ? null : entry.rank}
                          {rankIcon}
                        </span>
                      </div>
                    </td>

                    {/* Developer profile details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden shrink-0">
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt={entry.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            entry.fullName[0]
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                            <span>{entry.fullName}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.5 bg-indigo-600 text-white font-mono text-[8px] rounded font-extrabold uppercase">
                                You
                              </span>
                            )}
                            {entry.score >= 90 && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[8px] rounded font-mono font-bold flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Elite</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{entry.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {entry.category}
                      </span>
                    </td>

                    {/* Location Column */}
                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.location}</span>
                      </div>
                    </td>

                    {/* High score Column */}
                    <td className="py-3 px-4 text-right">
                      {entry.score > 0 ? (
                        <div>
                          <span className="font-black text-xs sm:text-sm text-slate-900 font-mono">
                            {entry.score}%
                          </span>
                          <span className="text-[8px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-150 px-1 py-0.5 rounded ml-1.5 font-mono">
                            VERIFIED
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unranked</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No matching competitors found for query: "{searchQuery || categoryFilter}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
