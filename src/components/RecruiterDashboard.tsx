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
  LogOut,
  Calendar,
  Video,
  Trash2,
  Plus,
  ExternalLink,
  Brain,
  Bell,
  Mail,
  Settings,
  Send,
  AlertCircle
} from "lucide-react";
import StrengthsWeaknessesModal from "./StrengthsWeaknessesModal";

interface RecruiterDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onViewCertificate: (certId: string) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

export default function RecruiterDashboard(props: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState<"search" | "compare" | "interviews" | "analytics" | "subscription" | "notifications">("search");
  
  // AI Strengths & Weaknesses Modal States
  const [selectedAnalysisAttemptId, setSelectedAnalysisAttemptId] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // Automated Alert System States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifSettings, setNotifSettings] = useState<any>({
    completionAlerts: true,
    upcomingInterviewAlerts: true,
    reminderThresholdHours: 24,
    smtpHost: "smtp.saas-screening.com",
    smtpPort: 587,
    recipientEmails: "recruiter@saas.com, HR-team@saas-screening.com",
    senderName: "SaaS TalentScreen Advisor",
    senderEmail: "advisor@saas-screening.com"
  });
  const [fetchingNotifications, setFetchingNotifications] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState<string | null>(null);
  const [notifSuccessMessage, setNotifSuccessMessage] = useState<string | null>(null);
  const [notifErrorMessage, setNotifErrorMessage] = useState<string | null>(null);
  const [selectedEmailBody, setSelectedEmailBody] = useState<any | null>(null);

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setFetchingNotifications(true);
    try {
      const res = await fetch("/api/recruiter/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setNotifSettings(data.settings || {});
        }
      }
    } catch (err) {
      console.error("Failed to fetch automated notifications:", err);
    } finally {
      if (showLoading) setFetchingNotifications(false);
    }
  };
  
  // Interview Scheduler State
  const [interviews, setInterviews] = useState<any[]>(() => {
    const saved = localStorage.getItem("techscreen_interviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved interviews", e);
      }
    }
    return [
      {
        id: "int_1",
        candidateId: "usr_alex_02",
        candidateName: "Alexander Wright",
        candidateEmail: "alex.wright@engineer.io",
        technologyArea: "React TypeScript & Frontend Engineering",
        score: 92,
        date: "2026-06-25",
        time: "10:00",
        duration: 45,
        type: "Technical Screening",
        platform: "Google Meet",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        notes: "Discuss React 19 concurrent features & server components architecture.",
        status: "confirmed"
      },
      {
        id: "int_2",
        candidateId: "usr_sarah_03",
        candidateName: "Sarah Jenkins",
        candidateEmail: "sarah.jenkins@cloud.net",
        technologyArea: "Node.js Backend & Scalable APIs",
        score: 88,
        date: "2026-06-26",
        time: "14:30",
        duration: 60,
        type: "System Design",
        platform: "Zoom",
        meetingLink: "https://zoom.us/j/9876543210",
        notes: "Deep dive on Redis caching layer strategy and database query optimization.",
        status: "scheduled"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("techscreen_interviews", JSON.stringify(interviews));
  }, [interviews]);

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (interviews.length > 0) {
      const checkInterviewsAlerts = async () => {
        try {
          await fetch("/api/recruiter/notifications/check-interviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interviews })
          });
          fetchNotifications(false);
        } catch (err) {
          console.error("Failed to check upcoming interview alerts:", err);
        }
      };
      
      checkInterviewsAlerts();
    }
  }, [interviews]);

  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [interviewDate, setInterviewDate] = useState("2026-06-24");
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [interviewType, setInterviewType] = useState("Technical Screening");
  const [interviewPlatform, setInterviewPlatform] = useState("Google Meet");
  const [interviewDuration, setInterviewDuration] = useState(45);
  const [interviewNotes, setInterviewNotes] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  
  // Search state
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const demoCandidates = [
    { id: "usr_alex_02", fullName: "Alexander Wright", email: "alex.wright@engineer.io", score: 92, area: "React TypeScript & Frontend Engineering" },
    { id: "usr_sarah_03", fullName: "Sarah Jenkins", email: "sarah.jenkins@cloud.net", score: 88, area: "Node.js Backend & Scalable APIs" },
    { id: "usr_michael_04", fullName: "Michael Chang", email: "m.chang@algorithms.org", score: 95, area: "Data Structures & Go" },
    { id: "usr_emily_05", fullName: "Emily Davis", email: "emily.d@mlops.ai", score: 91, area: "Python & Machine Learning" }
  ];
  
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

  const handleSaveNotifSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setNotifSuccessMessage(null);
    setNotifErrorMessage(null);
    try {
      const res = await fetch("/api/recruiter/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifSettings)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifSettings(data.settings);
          setNotifSuccessMessage("SMTP server settings synchronized and verified!");
          setTimeout(() => setNotifSuccessMessage(null), 4000);
        } else {
          setNotifErrorMessage("Failed to synchronize settings with relay.");
        }
      }
    } catch (err) {
      setNotifErrorMessage("Relay connection timed out.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSimulateNotification = async (type: string) => {
    setSimulationLoading(type);
    setNotifSuccessMessage(null);
    try {
      const res = await fetch("/api/recruiter/notifications/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setNotifSuccessMessage(`Simulated ${type === "assessment_completion" ? "candidate assessment completion email dispatch" : "upcoming interview schedule warning"}!`);
          setTimeout(() => setNotifSuccessMessage(null), 4000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulationLoading(null);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch("/api/recruiter/notifications/clear", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications([]);
        }
      }
    } catch (err) {
      console.error(err);
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
              { id: "interviews", label: "Interview Scheduler", icon: Calendar },
              { id: "notifications", label: "Automated Alerts", icon: Bell },
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
                  {tab.id === "notifications" && notifications.length > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 bg-rose-600 text-white font-bold rounded-full text-[9px] font-mono leading-none">
                      {notifications.length}
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
                          <button
                            onClick={() => {
                              setSelectedAnalysisAttemptId(cand.attempts?.[0]?.id || cand.certs?.[0]?.id || "cert-9821-ab");
                              setIsAnalysisModalOpen(true);
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-700 rounded-lg text-indigo-600 transition cursor-pointer shadow-3xs"
                            title="View AI Advisor Strengths & Weaknesses report"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
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
                            <td key={cand.id} className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                              <div>{cand.attemptsCount || cand.attempts?.length || 0} test sets</div>
                              <div className="mt-1.5 space-y-1">
                                {(cand.attempts || []).map((att: any) => (
                                  <button
                                    key={att.id}
                                    onClick={() => {
                                      setSelectedAnalysisAttemptId(att.id);
                                      setIsAnalysisModalOpen(true);
                                    }}
                                    className="block text-left text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
                                  >
                                    ✦ {att.category} AI Advisor
                                  </button>
                                ))}
                                {(!cand.attempts || cand.attempts.length === 0) && cand.id === "user-candidate-1" && (
                                  <button
                                    onClick={() => {
                                      setSelectedAnalysisAttemptId("cert-9821-ab");
                                      setIsAnalysisModalOpen(true);
                                    }}
                                    className="block text-left text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
                                  >
                                    ✦ Full Stack AI Advisor
                                  </button>
                                )}
                              </div>
                            </td>
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

          {/* INTERVIEW SCHEDULER TAB */}
          {activeTab === "interviews" && (
            <div className="space-y-4 animate-fade-in" id="interviews-tab-panel">
              {/* Alert notification banner */}
              {scheduleSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-pulse" id="schedule-success-banner">
                  <div className="flex items-center gap-2">
                    <Check className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Interview Booking Confirmed!</p>
                      <p className="text-emerald-600 text-[11px]">Calendar invitations synchronized successfully. SMTP relay sent email notifications to the candidate.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setScheduleSuccess(false)}
                    className="text-emerald-500 hover:text-emerald-700 font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Form to Book Interview */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs h-fit" id="book-interview-card">
                  <div className="border-b border-slate-150 pb-3 mb-4">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="text-indigo-600 w-4.5 h-4.5" />
                      <span>Book Interview Slot</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">Invite certified high-scoring candidates to a live-video technical interview.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      // Find chosen candidate
                      const allOpts = [
                        ...demoCandidates,
                        ...candidates.map(c => ({
                          id: c.id,
                          fullName: c.fullName,
                          email: c.email,
                          score: c.overallCandidateScore || 85,
                          area: c.latestCertifiedArea || "Full Stack"
                        }))
                      ];
                      const selectedId = selectedCandidateId || allOpts[0]?.id;
                      const cand = allOpts.find(o => o.id === selectedId);
                      if (!cand) return;

                      // Generate random meeting link based on platform
                      let link = "https://meet.google.com/abc-defg-hij";
                      if (interviewPlatform === "Zoom") {
                        link = `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                      } else if (interviewPlatform === "MS Teams") {
                        link = `https://teams.microsoft.com/l/meetup-join/${Math.random().toString(36).substring(2, 15)}`;
                      } else {
                        const code = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
                        link = `https://meet.google.com/${code}`;
                      }

                      const newInt = {
                        id: `int_${Date.now()}`,
                        candidateId: cand.id,
                        candidateName: cand.fullName,
                        candidateEmail: cand.email,
                        technologyArea: cand.area,
                        score: cand.score,
                        date: interviewDate,
                        time: interviewTime,
                        duration: interviewDuration,
                        type: interviewType,
                        platform: interviewPlatform,
                        meetingLink: link,
                        notes: interviewNotes,
                        status: "scheduled"
                      };

                      setInterviews([newInt, ...interviews]);
                      setScheduleSuccess(true);
                      setInterviewNotes("");
                      // Auto dismiss banner
                      setTimeout(() => setScheduleSuccess(false), 5000);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select High-Scoring Candidate</label>
                      <select
                        value={selectedCandidateId}
                        onChange={(e) => setSelectedCandidateId(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                        required
                      >
                        <option value="">-- Choose Candidate --</option>
                        {[
                          ...demoCandidates,
                          ...candidates
                            .filter(c => (c.overallCandidateScore || 0) >= 70 && !demoCandidates.some(dc => dc.id === c.id))
                            .map(c => ({
                              id: c.id,
                              fullName: c.fullName,
                              email: c.email,
                              score: c.overallCandidateScore,
                              area: c.latestCertifiedArea || "General Engineering"
                            }))
                        ].map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} (Score: {c.score}%, {c.area})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-0.5">*Only verified candidates who scored ≥ 70% are listed.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interview Date</label>
                        <input
                          type="date"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          min="2026-06-23"
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time (UTC)</label>
                        <input
                          type="time"
                          value={interviewTime}
                          onChange={(e) => setInterviewTime(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                        <select
                          value={interviewDuration}
                          onChange={(e) => setInterviewDuration(Number(e.target.value))}
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                        >
                          <option value={30}>30 Minutes</option>
                          <option value={45}>45 Minutes</option>
                          <option value={60}>60 Minutes</option>
                          <option value={90}>90 Minutes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Platform</label>
                        <select
                          value={interviewPlatform}
                          onChange={(e) => setInterviewPlatform(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                        >
                          <option value="Google Meet">Google Meet</option>
                          <option value="Zoom">Zoom Video</option>
                          <option value="MS Teams">Microsoft Teams</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interview Style / Type</label>
                      <select
                        value={interviewType}
                        onChange={(e) => setInterviewType(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                      >
                        <option value="Technical Screening">Technical Live Coding & Sandbox Review</option>
                        <option value="System Design">System Architecture & Scale Planning</option>
                        <option value="Cultural Fit">Cultural Fit & Professional Communication</option>
                        <option value="Final Executive Review">Executive Leadership Final Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Custom Notes / Brief</label>
                      <textarea
                        rows={2}
                        value={interviewNotes}
                        onChange={(e) => setInterviewNotes(e.target.value)}
                        placeholder="Focus on concurrent states & query performance walkthrough."
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Book Slot & Sync Calendar</span>
                    </button>
                  </form>
                </div>

                {/* Scheduled Interviews Display List */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="scheduled-list-card">
                  <div className="border-b border-slate-150 pb-3 mb-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Video className="text-indigo-600 w-4.5 h-4.5" />
                        <span>Upcoming Video Interviews ({interviews.length})</span>
                      </h2>
                      <p className="text-slate-500 text-xs mt-0.5">Real-time schedule of synchronized recruiter video screenings and assessments.</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1" id="scheduled-interviews-list">
                    {interviews.map((int) => (
                      <div key={int.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{int.candidateName}</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100 font-mono">
                              Score: {int.score}%
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${int.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                              {int.status}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 font-medium">{int.candidateEmail} • {int.technologyArea}</p>

                          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500 pt-1.5">
                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-150">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{int.date} at {int.time} UTC</span>
                            </span>
                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-150">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{int.duration} Mins</span>
                            </span>
                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-150 font-bold text-indigo-700">
                              <span>Type: {int.type}</span>
                            </span>
                          </div>

                          {int.notes && (
                            <p className="text-[11px] text-slate-500 bg-white border border-slate-150 p-2 rounded-lg italic mt-2">
                              " {int.notes} "
                            </p>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-stretch sm:items-end justify-between sm:justify-center gap-2 sm:min-w-32">
                          <a
                            href={int.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Call</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to cancel the interview for ${int.candidateName}?`)) {
                                setInterviews(interviews.filter(i => i.id !== int.id));
                              }
                            }}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 hover:text-rose-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sm:hidden">Cancel</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {interviews.length === 0 && (
                      <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2.5">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-slate-700 text-xs font-bold">No upcoming interviews scheduled yet.</p>
                        <p className="text-slate-500 text-[11px]">Choose a high-scoring candidate from the left panel and click book.</p>
                      </div>
                    )}
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

          {/* AUTOMATED ALERTS & NOTIFICATION SYSTEM TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-5 animate-fade-in" id="notifications-tab-panel">
              {/* Header metrics card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="border-b border-slate-150 pb-3 mb-4 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="text-indigo-600 w-4.5 h-4.5 animate-bounce" />
                      <span>SMTP Notification & Automated Alerts Hub</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">Configure automated recruiter email notifications triggered by candidate actions and scheduling alerts.</p>
                  </div>
                  <button
                    onClick={handleClearNotifications}
                    className="px-3 py-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 hover:border-rose-200 transition text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    Clear Outbox Logs
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outbox Logs</span>
                    <span className="block text-lg font-mono font-bold text-slate-800 mt-1">{notifications.length} Emails</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completion Rules</span>
                    <span className={`block text-xs font-bold mt-2 font-mono ${notifSettings.completionAlerts ? "text-emerald-600" : "text-slate-500"}`}>
                      {notifSettings.completionAlerts ? "✓ Enabled" : "✕ Disabled"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interview Reminders</span>
                    <span className={`block text-xs font-bold mt-2 font-mono ${notifSettings.upcomingInterviewAlerts ? "text-emerald-600" : "text-slate-500"}`}>
                      {notifSettings.upcomingInterviewAlerts ? `✓ Active (${notifSettings.reminderThresholdHours}h)` : "✕ Disabled"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Relay Gateway</span>
                    <span className="block text-[11px] font-bold text-indigo-600 mt-2 font-mono flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>{notifSettings.smtpHost}</span>
                    </span>
                  </div>
                </div>

                {notifSuccessMessage && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-lg text-xs font-semibold">
                    ✓ {notifSuccessMessage}
                  </div>
                )}

                {notifErrorMessage && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-250 text-rose-800 rounded-lg text-xs font-semibold">
                    ✕ {notifErrorMessage}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column - Dispatch Logs */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      <span>SMTP Relay Dispatch Logs & Outbox</span>
                    </h3>

                    <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
                      {notifications.map((notif) => {
                        const isCompletion = notif.type === "assessment_completion";
                        const isSelected = selectedEmailBody?.id === notif.id;

                        return (
                          <div
                            key={notif.id}
                            className={`p-4 border rounded-xl transition-all duration-250 ${
                              isSelected
                                ? "bg-indigo-50/40 border-indigo-250 shadow-3xs"
                                : "bg-white border-slate-200 hover:border-slate-350"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  isCompletion
                                    ? "bg-emerald-55 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-55 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {isCompletion ? "Assessment Done" : "Interview Schedule"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs mb-1">{notif.title}</h4>
                            <p className="text-slate-600 text-xs leading-relaxed font-sans mb-3">{notif.message}</p>

                            <div className="flex flex-wrap justify-between items-center gap-2 border-t border-slate-100 pt-2.5">
                              <div className="text-[10px] text-slate-455">
                                <span className="font-semibold text-slate-600">To:</span> <span className="font-mono text-indigo-650 bg-slate-50 px-1 py-0.5 rounded">{notif.recipientEmail}</span>
                              </div>
                              <button
                                onClick={() => setSelectedEmailBody(isSelected ? null : notif)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
                              >
                                <span>{isSelected ? "Hide Email Payload ✕" : "Inspect SMTP Envelope ✦"}</span>
                              </button>
                            </div>

                            {isSelected && (
                              <div className="mt-3.5 p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[10px] leading-relaxed border border-slate-800 animate-slide-down">
                                <div className="border-b border-slate-800 pb-2 mb-2 text-slate-400">
                                  <div>SMTP_HOST: {notifSettings.smtpHost}:{notifSettings.smtpPort}</div>
                                  <div>FROM: "{notifSettings.senderName}" &lt;{notifSettings.senderEmail}&gt;</div>
                                  <div>TO: &lt;{notif.recipientEmail}&gt;</div>
                                  <div>DATE: {new Date(notif.timestamp).toUTCString()}</div>
                                  <div>SUBJECT: {notif.title}</div>
                                  <div>MIME-Version: 1.0 (DKIM-SIGNED, SPF-PASS)</div>
                                </div>
                                <div className="text-emerald-400 font-sans p-2 bg-slate-950/60 rounded border border-slate-850 whitespace-pre-line text-[11px]">
                                  {notif.message}
                                  
                                  {"\n\n---\nAutomated screening system generated message. Do not reply directly to this mail."}
                                </div>
                                <div className="mt-2.5 text-right text-[9px] text-slate-500">
                                  Status: <span className="text-emerald-400 font-bold uppercase">250 OK (Message accepted for delivery)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {notifications.length === 0 && (
                        <div className="p-10 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2.5">
                          <Mail className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                          <p className="text-slate-700 text-xs font-bold">No notifications or emails logged yet.</p>
                          <p className="text-slate-500 text-[11px] max-w-sm mx-auto">Trigger simulated actions on the right panel or complete real tests to watch notifications pop up here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Rules & Simulators */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Automation Rule Book Configuration */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-500" />
                      <span>Alert Routing & SMTP Credentials</span>
                    </h3>

                    <form onSubmit={handleSaveNotifSettings} className="space-y-4">
                      <div className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifSettings.completionAlerts}
                            onChange={(e) => setNotifSettings({ ...notifSettings, completionAlerts: e.target.checked })}
                            className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Assessment Completion Alerts</span>
                            <span className="text-[10px] text-slate-455 block">Sends email automatically when any candidate submits an assessment</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-slate-150">
                          <input
                            type="checkbox"
                            checked={notifSettings.upcomingInterviewAlerts}
                            onChange={(e) => setNotifSettings({ ...notifSettings, upcomingInterviewAlerts: e.target.checked })}
                            className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Approaching Interview Reminders</span>
                            <span className="text-[10px] text-slate-455 block">Toggles alerts for technical interviews scheduled on the workspace</span>
                          </div>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reminder Window</label>
                          <select
                            value={notifSettings.reminderThresholdHours}
                            onChange={(e) => setNotifSettings({ ...notifSettings, reminderThresholdHours: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-800"
                          >
                            <option value={1}>1 Hour Before</option>
                            <option value={6}>6 Hours Before</option>
                            <option value={12}>12 Hours Before</option>
                            <option value={24}>24 Hours Before</option>
                            <option value={48}>48 Hours Before</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SMTP Port</label>
                          <input
                            type="number"
                            value={notifSettings.smtpPort}
                            onChange={(e) => setNotifSettings({ ...notifSettings, smtpPort: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SMTP Server Gateway</label>
                        <input
                          type="text"
                          required
                          value={notifSettings.smtpHost}
                          onChange={(e) => setNotifSettings({ ...notifSettings, smtpHost: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none text-slate-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Recipient Recruiter Emails</label>
                        <input
                          type="text"
                          required
                          value={notifSettings.recipientEmails}
                          onChange={(e) => setNotifSettings({ ...notifSettings, recipientEmails: e.target.value })}
                          placeholder="hiring@saas.com, cc-recruits@saas.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none text-slate-900"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">Separate multiple addresses with commas</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sender Name</label>
                          <input
                            type="text"
                            required
                            value={notifSettings.senderName}
                            onChange={(e) => setNotifSettings({ ...notifSettings, senderName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sender Address</label>
                          <input
                            type="email"
                            required
                            value={notifSettings.senderEmail}
                            onChange={(e) => setNotifSettings({ ...notifSettings, senderEmail: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-800 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        {savingSettings ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Synchronizing SMTP Relay...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify & Save SMTP Routing</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Manual Interactive Sandbox Simulator */}
                  <div className="bg-slate-900 text-slate-150 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-xs uppercase font-bold text-indigo-400 tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-indigo-400" />
                      <span>SMTP Notification Sandbox Simulator</span>
                    </h3>
                    <p className="text-slate-400 text-[11px] mb-4">Interactively trigger instant automated event notifications directly from candidates onto the workspace outbox.</p>

                    <div className="space-y-2.5">
                      <button
                        onClick={() => handleSimulateNotification("assessment_completion")}
                        disabled={simulationLoading !== null}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-100 disabled:text-slate-400 border border-slate-700 hover:border-slate-600 rounded-xl text-left text-xs font-semibold transition cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                          <div>
                            <span className="block font-bold">Simulate Candidate Completion</span>
                            <span className="text-[10px] text-slate-400 block font-normal">Fires real-time assessment scores and generates digital certificate</span>
                          </div>
                        </div>
                        {simulationLoading === "assessment_completion" ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSimulateNotification("upcoming_interview")}
                        disabled={simulationLoading !== null}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-100 disabled:text-slate-400 border border-slate-700 hover:border-slate-600 rounded-xl text-left text-xs font-semibold transition cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="block font-bold">Simulate Approaching Interview Reminder</span>
                            <span className="text-[10px] text-slate-400 block font-normal">Triggers scheduled meeting alert for workspace and candidates</span>
                          </div>
                        </div>
                        {simulationLoading === "upcoming_interview" ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <StrengthsWeaknessesModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        attemptId={selectedAnalysisAttemptId}
      />
    </div>
  );
}
