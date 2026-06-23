/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, CandidateSearchFilter } from "../types";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from "recharts";
import { 
  Briefcase, 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  MapPin, 
  Award, 
  Users, 
  ArrowUpRight, 
  ChevronRight, 
  Zap, 
  UserPlus, 
  Building2, 
  Check, 
  History,
  Info,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  LogOut
} from "lucide-react";

interface RecruiterDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onViewCertificate: (certId: string) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

export default function RecruiterDashboard(props: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState<"search" | "compare" | "analytics" | "subscription">("search");
  
  // Search state
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters state
  const [skillFilter, setSkillFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [locationFilter, setLocationFilter] = useState("");
  const [certifiedOnly, setCertifiedOnly] = useState(false);

  // Candidate comparison matrix selections
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Invite recruiter sub-form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Hiring Manager");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Subscription upgrade state
  const [pricingSuccess, setPricingSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates();
    fetchAnalytics();
  }, [skillFilter, techFilter, experienceFilter, minScoreFilter, locationFilter, certifiedOnly]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (skillFilter) queryParams.append("skill", skillFilter);
      if (techFilter) queryParams.append("technology", techFilter);
      if (experienceFilter) queryParams.append("experience", experienceFilter);
      if (minScoreFilter > 0) queryParams.append("minScore", String(minScoreFilter));
      if (locationFilter) queryParams.append("location", locationFilter);
      if (certifiedOnly) queryParams.append("certifiedOnly", "true");

      const res = await fetch(`/api/recruiter/candidates?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCandidates(data);
      }
    } catch (err) {
      console.error("Failed to query candidate repositories:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/recruiter");
      const data = await res.json();
      if (res.ok) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  // Toggle compare selection
  const handleToggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(v => v !== id));
    } else {
      if (compareIds.length >= 3) {
        alert("Comparison is strictly limited to up to 3 candidates simultaneously.");
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  // Fetch matrix details when Compare Tab is selected
  useEffect(() => {
    if (activeTab === "compare" && compareIds.length > 0) {
      fetchComparisonMatrix();
    }
  }, [activeTab, compareIds]);

  const fetchComparisonMatrix = async () => {
    try {
      const res = await fetch("/api/recruiter/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: compareIds })
      });
      const data = await res.json();
      if (res.ok) {
        setComparisonData(data);
      }
    } catch (err) {
      console.error("Failed to fetch comparisons:", err);
    }
  };

  const handleInviteRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await fetch("/api/recruiter/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiterId: props.user.id,
          inviteEmail,
          inviteRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(true);
        setInviteEmail("");
        props.onUpdateUser({
          ...props.user,
          invitedRecruiters: data.invitedRecruiters
        });
        setTimeout(() => setInviteSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to invite recruiter:", err);
    }
  };

  const handleUpgradeSubscription = async (tier: "basic" | "professional" | "enterprise") => {
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: props.user.id, planTier: tier })
      });
      const data = await res.json();
      if (res.ok) {
        props.onUpdateUser(data.user);
        setPricingSuccess(tier);
        setTimeout(() => setPricingSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative" id="recruiter-dashboard-root">
      
      {/* Navbar Banner */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center relative z-20" id="recruiter-nav">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">Recruiter Dashboard</span>
            <span className="text-[10px] text-indigo-650 font-semibold uppercase tracking-wider">{props.user.companyName || "Organization Workspace"}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="font-bold text-xs text-slate-900 block leading-tight">{props.user.fullName}</span>
            <span className="text-[9px] text-indigo-650 font-mono font-bold uppercase tracking-wider">Plan: {props.user.subscriptionPlan}</span>
          </div>
          <button
            onClick={props.onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-950 text-slate-600 rounded-lg text-xs font-semibold transition cursor-pointer"
            id="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="recruiter-grid">
        {/* Left Side Tab trigger list */}
        <aside className="lg:col-span-3 space-y-4" id="recruiter-aside">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs" id="quota-card">
            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Usage Quota</h4>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Daily Search Queries</span>
                  <span className="font-semibold text-slate-700">{props.user.dailySearchQuotaUsed} / {props.user.subscriptionPlan === "basic" ? "100" : props.user.subscriptionPlan === "professional" ? "1000" : "unlimited"}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600" 
                    style={{ width: `${props.user.subscriptionPlan === "basic" ? (props.user.dailySearchQuotaUsed / 100) * 100 : (props.user.dailySearchQuotaUsed / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-[10px] text-slate-455 leading-tight">
                Reset occurs at 00:00 UTC daily. Upgrading expands capacity.
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-1.5 space-y-1 shadow-xs">
            {[
              { id: "search", label: "Talent Repository", icon: Search },
              { id: "compare", label: "Candidate Comparison", icon: SlidersHorizontal },
              { id: "analytics", label: "Talent Analytics", icon: TrendingUp },
              { id: "subscription", label: "Team & Subscriptions", icon: Building2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${isSelected ? "bg-indigo-50 text-indigo-700 font-bold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  id={`rec-tab-trigger-${tab.id}`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.id === "compare" && compareIds.length > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 bg-indigo-600 text-white font-bold rounded-md text-[9px] font-mono leading-none">
                      {compareIds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right side Panel container */}
        <main className="lg:col-span-9" id="recruiter-main">
          
          {/* TALENT REPOSITORY SEARCH TAB */}
          {activeTab === "search" && (
            <div className="space-y-4" id="search-tab-panel">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="filters-card">
                <div className="flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2.5">
                  <SlidersHorizontal className="w-4.5 h-4.5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Advanced Search Repository</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="filters-inputs-grid">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Skill Keyword</label>
                    <input
                      type="text"
                      placeholder="e.g. React, Docker"
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Technology Stack</label>
                    <input
                      type="text"
                      placeholder="e.g. TypeScript"
                      value={techFilter}
                      onChange={(e) => setTechFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Experience Level</label>
                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    >
                      <option value="">All Levels</option>
                      <option value="junior">Junior (0-2y)</option>
                      <option value="mid">Mid (2-5y)</option>
                      <option value="senior">Senior (5-10y)</option>
                      <option value="advanced">Advanced (10y+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Min Screening Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 70"
                      value={minScoreFilter || ""}
                      onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Candidate Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={certifiedOnly}
                        onChange={(e) => setCertifiedOnly(e.target.checked)}
                        className="rounded bg-white border border-slate-200 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="font-semibold">Certified Candidates Only</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Candidates Results List */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="candidates-results-panel">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Verified Candidates Available ({candidates.length})</span>
                  </h3>
                  {compareIds.length > 0 && (
                    <button
                      onClick={() => setActiveTab("compare")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                      id="launch-compare-tab-btn"
                    >
                      <span>Compare Selections ({compareIds.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100" id="candidates-list">
                  {candidates.map((cand) => (
                    <div key={cand.id} className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0" id={`cand-row-${cand.id}`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-xs text-slate-900">{cand.fullName}</h4>
                          <span className="text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-mono uppercase text-slate-500 font-bold">
                            {cand.experienceLevel}
                          </span>
                          {cand.certs.length > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-[9px] font-bold font-mono rounded-md">
                              ✓ Certified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {cand.currentRole || "Independent Engineer"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {cand.location || "Remote/Global"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cand.skills.map((sk: string) => (
                            <span key={sk} className="text-[9px] bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-slate-600 font-mono rounded-md font-semibold">{sk}</span>
                          ))}
                        </div>
                      </div>

                      {/* Performance metrics side */}
                      <div className="flex items-center gap-5" id={`cand-metrics-row-${cand.id}`}>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block leading-tight">Average Rating</span>
                          <span className="font-mono font-bold text-xs text-emerald-700">{cand.averageScore || "N/A"}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block leading-tight">Integrity Index</span>
                          <span className="font-mono font-bold text-xs text-indigo-600">{cand.integrityIndex}%</span>
                        </div>

                        {/* Actions controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleCompare(cand.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                              compareIds.includes(cand.id)
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                          >
                            {compareIds.includes(cand.id) ? "✓ Selected" : "Compare"}
                          </button>
                          {cand.certs.length > 0 && (
                            <button
                              onClick={() => props.onViewCertificate(cand.certs[0].id)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-emerald-700 rounded-lg text-emerald-600 transition cursor-pointer shadow-3xs"
                              title="Inspect verification credentials"
                            >
                              <Award className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {candidates.length === 0 && (
                    <div className="py-6 text-center text-slate-400 font-mono text-xs">No matching verified candidate profiles available. Try relaxing filters.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATE SIDE-BY-SIDE COMPARISON TAB */}
          {activeTab === "compare" && (
            <div className="space-y-4" id="compare-tab-panel">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="comparison-card">
                <div className="border-b border-slate-150 pb-3 mb-3.5 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="text-indigo-600 w-4.5 h-4.5" />
                      <span>Side-by-Side Screening Matrix</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">Objective evaluation of technical performance scores, skills, and proctoring integrity indices.</p>
                  </div>
                  {compareIds.length > 0 && (
                    <button
                      onClick={() => { setCompareIds([]); setComparisonData([]); }}
                      className="text-xs text-rose-600 hover:text-rose-800 underline font-semibold cursor-pointer"
                    >
                      Clear Selections
                    </button>
                  )}
                </div>

                {compareIds.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 font-sans space-y-3">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">No candidates selected for comparison.</p>
                    <p className="text-[11px] text-slate-500">Go to the Talent Repository, choose 'Compare' on up to 3 candidate cards, then return here.</p>
                    <button
                      onClick={() => setActiveTab("search")}
                      className="px-3.5 py-1.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Browse Talent Repository
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto" id="matrix-table-wrapper">
                    <table className="w-full text-left border-collapse text-xs" id="comparison-table">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-2 px-3 bg-slate-50 text-slate-500 font-mono uppercase font-bold text-[10px]">Screening Attributes</th>
                          {comparisonData.map((cand) => (
                            <th key={cand.id} className="py-2 px-3 bg-slate-50 text-slate-900 font-bold text-xs">{cand.fullName}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        <tr>
                          <td className="py-3.5 px-3 text-slate-500 font-bold text-[11px]">Current Role</td>
                          {comparisonData.map((cand) => (
                            <td key={cand.id} className="py-3.5 px-3 text-slate-800 font-semibold">{cand.currentRole || "Engineer"}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3.5 px-3 text-slate-500 font-bold text-[11px]">Experience Level</td>
                          {comparisonData.map((cand) => (
                            <td key={cand.id} className="py-3.5 px-3 text-slate-600 font-mono capitalize text-[11px]">{cand.experienceLevel} ({cand.yearsOfExperience}y)</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3.5 px-3 text-slate-500 font-bold text-[11px]">Average screening score</td>
                          {comparisonData.map((cand) => (
                            <td key={cand.id} className="py-3.5 px-3 text-xs font-bold text-emerald-700 font-mono">{cand.averageScore}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3.5 px-3 text-slate-500 font-bold text-[11px]">Proctor integrity index</td>
                          {comparisonData.map((cand) => (
                            <td key={cand.id} className="py-3.5 px-3 font-mono font-bold text-indigo-650">{cand.integrityIndex}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3.5 px-3 text-slate-500 font-bold text-[11px]">Earned certifications</td>
                          {comparisonData.map((cand) => (
                            <td key={cand.id} className="py-3.5 px-3 text-slate-600">
                              <div className="space-y-1">
                                {cand.certifications.map((cert: string) => (
                                  <span key={cert} className="block text-[10px] text-emerald-700 font-mono font-semibold">✓ {cert}</span>
                                ))}
                                {cand.certifications.length === 0 && <span className="text-slate-400 font-mono">—</span>}
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3.5 px-3 text-slate-500 font-bold text-[11px]">Expertise Technology</td>
                          {comparisonData.map((cand) => (
                            <td key={cand.id} className="py-3.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {cand.skills.map((s: string) => (
                                  <span key={s} className="text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 text-slate-600 font-mono rounded-md font-medium">{s}</span>
                                ))}
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3.5 px-3 text-slate-500 font-bold text-[11px]">Completed Screenings</td>
                          {comparisonData.map((cand) => (
                            <td key={cand.id} className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">{cand.attemptsCount} test sets</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TALENT ANALYTICS TAB */}
          {activeTab === "analytics" && analyticsData && (
            <div className="space-y-4" id="analytics-tab-panel">
              {/* KPIs strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="kpis-grid">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-xs">
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Verified IT pool</span>
                  <span className="text-xl font-mono font-bold text-slate-900">{analyticsData.kpis.totalCandidates}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-xs">
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Assessments Evaluated</span>
                  <span className="text-xl font-mono font-bold text-slate-900">{analyticsData.kpis.assessmentsTaken}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-xs">
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Uptime SLA</span>
                  <span className="text-xl font-mono font-bold text-emerald-700">{analyticsData.kpis.averageUptime}</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-xs">
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Mean Screening Score</span>
                  <span className="text-xl font-mono font-bold text-slate-900">{analyticsData.kpis.averageScore}%</span>
                </div>
              </div>

              {/* Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-split">
                
                {/* 1. Domain Average Score Bar Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="domain-avg-score-chart-card">
                  <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                    <span>Domain Screener Average Scores (%)</span>
                  </h3>
                  <div className="h-64 w-full font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.domainHeatmap || []}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={110} 
                          stroke="#64748b"
                          tickFormatter={(value) => value.split(" ")[0] + "..."}
                        />
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                          formatter={(value: any) => [`${value}%`, "Avg Score"]}
                        />
                        <Bar dataKey="avgScore" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                          {(analyticsData.domainHeatmap || []).map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.avgScore >= 80 ? "#10b981" : entry.avgScore >= 75 ? "#6366f1" : "#f59e0b"} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Candidate Proficiency Distribution (Pie Chart) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="proficiency-pie-chart-card">
                  <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-indigo-600" />
                    <span>Candidate Experience Distribution</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-7 h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.proficiencyDistribution || [
                              { name: "Junior (0-2y)", count: 12 },
                              { name: "Mid-Level (2-5y)", count: 24 },
                              { name: "Senior (5-10y)", count: 18 },
                              { name: "Advanced (10y+)", count: 8 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="count"
                          >
                            {[0, 1, 2, 3].map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={["#818cf8", "#4f46e5", "#3730a3", "#10b981"][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                            formatter={(value: any) => [`${value} candidates`, "Count"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="sm:col-span-5 space-y-2">
                      {(analyticsData.proficiencyDistribution || [
                        { name: "Junior (0-2y)", count: 12 },
                        { name: "Mid-Level (2-5y)", count: 24 },
                        { name: "Senior (5-10y)", count: 18 },
                        { name: "Advanced (10y+)", count: 8 }
                      ]).map((item: any, i: number) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: ["#818cf8", "#4f46e5", "#3730a3", "#10b981"][i % 4] }} 
                            />
                            <span>{item.name}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Candidate Score Buckets Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="score-dist-chart-card">
                  <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Candidate Score Profile Distribution</span>
                  </h3>
                  <div className="h-60 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analyticsData.scoreDistribution || [
                          { name: "Below 60%", count: 5 },
                          { name: "60% - 75%", count: 18 },
                          { name: "75% - 90%", count: 32 },
                          { name: "90% - 100%", count: 14 }
                        ]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" name="Candidates" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Funnel Area Chart representation */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="funnel-analytics">
                  <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-indigo-600" />
                    <span>Recruiting Pipeline Funnel Analytics</span>
                  </h3>
                  <div className="h-60 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.funnel || []}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="stage" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                          formatter={(value: any, name: string, props: any) => {
                            if (name === "pct") return [`${value}%`, "Conversion Rate"];
                            return [value, "Count"];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="count" name="Candidate Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pct" name="Conversion %" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TEAM & SUBSCRIPTION MANAGEMENT TAB */}
          {activeTab === "subscription" && (
            <div className="space-y-4 animate-fade-in" id="subscription-tab-panel">
              {/* Pricing Cards */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="pricing-panel">
                <div className="border-b border-slate-150 pb-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="text-indigo-600 w-4.5 h-4.5" />
                    <span>Corporate Subscription Tiers</span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Scale subscription limits and analytical options based on organizational recruiting workloads.</p>
                </div>

                {pricingSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-lg text-xs mb-4 font-semibold">
                    ✓ Your organization has successfully been upgraded to the standard SaaS <b>{pricingSuccess}</b> plan.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="pricing-grid">
                  {[
                    {
                      id: "basic",
                      name: "Basic Sandbox",
                      price: "Free",
                      searches: "100 searches / day",
                      features: ["Standard candidate search", "Scorecard report summary", "Static proctor records"],
                      active: props.user.subscriptionPlan === "basic"
                    },
                    {
                      id: "professional",
                      name: "Enterprise Pro",
                      price: "$199/mo",
                      searches: "1000 searches / day",
                      features: ["Unlimited candidate search", "Side-by-side matrices", "Full GDPR audit snapshot", "Standard team seats (3)"],
                      active: props.user.subscriptionPlan === "professional"
                    },
                    {
                      id: "enterprise",
                      name: "Unified Platform",
                      price: "Custom",
                      searches: "Unlimited queries",
                      features: ["API integrations access", "White-label custom templates", "Dedicated 24/7 technical lead", "Unlimited team seating"],
                      active: props.user.subscriptionPlan === "enterprise"
                    }
                  ].map((tier) => (
                    <div key={tier.id} className={`p-4.5 rounded-xl border transition-all flex flex-col justify-between ${tier.active ? "border-indigo-600 bg-indigo-50/15 shadow-sm" : "border-slate-200 bg-white"}`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-slate-900">{tier.name}</h4>
                          {tier.active && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-mono font-bold rounded-md uppercase">ACTIVE</span>}
                        </div>
                        <div className="my-3">
                          <span className="text-xl font-bold text-slate-900 font-mono">{tier.price}</span>
                        </div>
                        <ul className="space-y-1.5 mb-5 text-[11px] text-slate-500">
                          <li className="font-bold text-indigo-700 font-mono text-[10px] uppercase">⚡ {tier.searches}</li>
                          {tier.features.map((f, i) => (
                            <li key={i} className="flex gap-1.5 items-start">
                              <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => handleUpgradeSubscription(tier.id as any)}
                        disabled={tier.active}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-3xs ${
                          tier.active 
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {tier.active ? "Current Selection" : `Upgrade`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruiter Invites Management */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="team-invite-panel">
                <div className="border-b border-slate-150 pb-3 mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>Invite Recruiters & Hiring Managers</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Invite personnel to manage screenings and collaborate on matrix selections.</p>
                </div>

                <form onSubmit={handleInviteRecruiter} className="flex flex-wrap gap-2.5 max-w-xl pb-4 border-b border-slate-100" id="invite-subform">
                  <input
                    type="email"
                    required
                    placeholder="hiring.manager@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-slate-900"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800"
                  >
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Recruitment Lead">Recruitment Lead</option>
                    <option value="Technical Reviewer">Technical Reviewer</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    Send Invite
                  </button>
                </form>

                {inviteSuccess && (
                  <div className="text-emerald-700 text-xs mt-2 font-semibold">✓ Access invitation dispatched successfully.</div>
                )}

                {/* Team members list */}
                <div className="mt-4" id="team-members-list">
                  <h5 className="text-xs font-bold text-slate-500 mb-2.5">Active Workspace Seatings ({props.user.invitedRecruiters?.length || 0})</h5>
                  <div className="space-y-2">
                    {props.user.invitedRecruiters?.map((rec, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div>
                          <span className="font-bold text-slate-800 block">{rec.email}</span>
                          <span className="text-[10px] text-slate-400">Added: {rec.addedAt}</span>
                        </div>
                        <span className="text-[9px] bg-white border border-slate-200 px-2 py-0.5 text-slate-600 font-mono font-bold rounded-md shadow-3xs">{rec.role}</span>
                      </div>
                    ))}
                    {(!props.user.invitedRecruiters || props.user.invitedRecruiters.length === 0) && (
                      <div className="text-slate-400 font-mono text-[11px]">No invited team members recorded. Add workspace seats above.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
