/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, AssessmentAttempt, DigitalCertificate, Question } from "../types";
import { 
  User, 
  MapPin, 
  Phone, 
  Linkedin, 
  FileText, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Award, 
  FileCheck, 
  Zap, 
  Clock, 
  AlertTriangle,
  History,
  ShieldAlert,
  Download,
  Activity,
  LogOut,
  Sparkles,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Twitter,
  Brain
} from "lucide-react";
import StrengthsWeaknessesModal from "./StrengthsWeaknessesModal";
import MockInterviewModal from "./MockInterviewModal";

interface CandidateDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onLaunchAssessment: (category: Question["category"], difficulty: Question["difficulty"]) => void;
  onViewCertificate: (certId: string) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

export default function CandidateDashboard(props: CandidateDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "history" | "launch" | "gdpr">("profile");
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [certs, setCerts] = useState<DigitalCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Strengths & Weaknesses Modal States
  const [selectedAnalysisAttemptId, setSelectedAnalysisAttemptId] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // AI Mock Interview States
  const [selectedInterviewAttemptId, setSelectedInterviewAttemptId] = useState<string | null>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  // Profile Form States
  const [fullName, setFullName] = useState(props.user.fullName || "");
  const [location, setLocation] = useState(props.user.location || "");
  const [contactNumber, setContactNumber] = useState(props.user.contactNumber || "");
  const [linkedinUrl, setLinkedinUrl] = useState(props.user.linkedinUrl || "");
  const [currentRole, setCurrentRole] = useState(props.user.currentRole || "");
  const [experienceLevel, setExperienceLevel] = useState(props.user.experienceLevel || "mid");
  const [yearsOfExperience, setYearsOfExperience] = useState(props.user.yearsOfExperience || 3);
  const [skills, setSkills] = useState<string[]>(props.user.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(props.user.mfaEnabled || false);

  // Share Achievements States
  const [selectedCertId, setSelectedCertId] = useState<string>("");
  const [shareTemplate, setShareTemplate] = useState<"linkedin" | "twitter" | "minimal" | "personal">("linkedin");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [includeScore, setIncludeScore] = useState(true);
  const [includeIntegrity, setIncludeIntegrity] = useState(true);
  const [customHashtags, setCustomHashtags] = useState("#TechScreen #Certified #CompetencyHub");

  useEffect(() => {
    if (certs.length > 0 && !selectedCertId) {
      setSelectedCertId(certs[0].id);
    }
  }, [certs, selectedCertId]);

  // Employment History Sub-form
  const [employmentHistory, setEmploymentHistory] = useState(props.user.employmentHistory || []);
  const [expCompany, setExpCompany] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expDuration, setExpDuration] = useState("");
  const [expDesc, setExpDesc] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [props.user.id]);

  const fetchHistory = async () => {
    try {
      // Fetch recruiter details to pull attempts and certs dynamically from backend
      const res = await fetch(`/api/recruiter/candidates?location=${props.user.location || ""}`);
      if (res.ok) {
        const list: any[] = await res.json();
        const me = list.find((u: any) => u.id === props.user.id);
        if (me) {
          setAttempts(me.attempts || []);
          setCerts(me.certs || []);
        }
      }
    } catch (err) {
      console.error("Failed to sync historical candidate attempts:", err);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (sk: string) => {
    setSkills(skills.filter(s => s !== sk));
  };

  const addEmployment = () => {
    if (expCompany.trim() && expRole.trim()) {
      setEmploymentHistory([
        ...employmentHistory,
        {
          company: expCompany,
          role: expRole,
          duration: expDuration || "N/A",
          description: expDesc
        }
      ]);
      setExpCompany("");
      setExpRole("");
      setExpDuration("");
      setExpDesc("");
    }
  };

  const removeEmployment = (idx: number) => {
    setEmploymentHistory(employmentHistory.filter((_, i) => i !== idx));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: props.user.id,
          location,
          contactNumber,
          linkedinUrl,
          currentRole,
          experienceLevel,
          yearsOfExperience,
          skills,
          employmentHistory,
          mfaEnabled
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      props.onUpdateUser(data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportGdprData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      profile: props.user,
      attempts,
      certificates: certs,
      gdprStatement: "In compliance with GDPR (General Data Protection Regulation) Article 15, this JSON dump contains all telemetry records, identity items, scoring history and metadata gathered on SaaS Screening Platform."
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gdpr-screening-audit-${props.user.fullName.replace(/\s+/g, "-").toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const selectedCert = certs.find(c => c.id === selectedCertId);

  const generateShareContent = () => {
    if (!selectedCert) return "";
    
    const certUrl = `https://techscreen.io/verify/${selectedCert.verificationHash}`;
    const techName = selectedCert.technologyArea;
    const scoreText = includeScore ? ` with a verified score of ${selectedCert.score}%` : "";
    
    const att = attempts.find(a => a.certificateId === selectedCert.id);
    const integrityText = includeIntegrity && att ? ` (Proctored integrity score: ${att.integrityScore}%)` : "";
    const ratingLevel = att?.skillRatingLevel ? ` [${att.skillRatingLevel} Level]` : "";

    const hashtags = customHashtags ? `\n\n${customHashtags}` : "";

    switch (shareTemplate) {
      case "linkedin":
        return `I am proud to share that I have officially certified my expertise in ${techName}${ratingLevel}${scoreText} on TechScreen! 🏆\n\nThe evaluation proctoring validated high technical competency standards${integrityText}.\n\nCheck out my digital credential here: ${certUrl}${hashtags}`;
      
      case "twitter":
        return `Just passed the TechScreen technical competency assessment for ${techName}${scoreText}! 💻\n\nIntegrity proctored & verified.${integrityText}\nVerify: ${certUrl}${hashtags}`;
      
      case "minimal":
        return `🏆 TechScreen Certified: ${techName} (${selectedCert.score}% Score)\n🔗 Credential Link: ${certUrl}\nVerification Hash: ${selectedCert.verificationHash}`;
      
      case "personal":
        return `Super excited to announce that I've received my TechScreen Professional Certification in ${techName}! Score: ${selectedCert.score}%. Feels great to have hard work verified! ✨ ${certUrl}`;
      
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative" id="candidate-dashboard-root">
      {/* Navbar Banner */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center relative z-20" id="candidate-nav">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <Award className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">Candidate Hub</span>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Verify & Earn Credentials</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="font-bold text-xs text-slate-900 block leading-tight">{props.user.fullName}</span>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Level: {props.user.experienceLevel?.toUpperCase() || "MID"}</span>
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

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-grid">
        {/* Left Sidebar Menu Tab select */}
        <aside className="lg:col-span-3 space-y-4" id="dashboard-aside">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center shadow-xs">
            <div className="w-16 h-16 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 text-2xl font-bold uppercase overflow-hidden mb-2.5">
              {props.user.avatarUrl ? (
                <img src={props.user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                props.user.fullName[0]
              )}
            </div>
            <h3 className="font-bold text-sm text-slate-900 leading-snug">{props.user.fullName}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{props.user.currentRole || "Professional Engineer"}</p>
            
            <div className="flex gap-1.5 mt-3 flex-wrap justify-center">
              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[9px] text-slate-500 font-mono rounded-md">
                MFA: {props.user.mfaEnabled ? "ON" : "OFF"}
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-700 font-mono rounded-md font-semibold">
                Active
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-1.5 space-y-1 shadow-xs" id="tab-controls-container">
            {[
              { id: "profile", label: "Professional Profile", icon: User },
              { id: "launch", label: "Launch Screening", icon: Zap },
              { id: "history", label: "Assessment Records", icon: History },
              { id: "gdpr", label: "GDPR Privacy Console", icon: ShieldAlert }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${isSelected ? "bg-indigo-50 text-indigo-700 font-bold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  id={`tab-select-${tab.id}`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Content Screen Panel */}
        <main className="lg:col-span-9" id="dashboard-main-content">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-4" id="profile-tab-form">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="profile-basic-card">
                <div className="border-b border-slate-150 pb-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User className="text-indigo-600 w-4.5 h-4.5" />
                    <span>Personal Details & Identity</span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Keep your screening profile verified for recruiting organizations.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">LinkedIn Profile Link</label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="https://linkedin.com/in/username"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Experience and Skills */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="profile-experience-card">
                <div className="border-b border-slate-150 pb-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="text-indigo-600 w-4.5 h-4.5" />
                    <span>Technical Qualifications</span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Configure experience levels to match balanced randomized algorithms.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Full Stack Engineer"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Difficulty Band</label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg px-2 py-1.5 text-xs text-slate-900 outline-none transition"
                      >
                        <option value="junior">Junior (0-2 yr)</option>
                        <option value="mid">Mid (2-5 yr)</option>
                        <option value="senior">Senior (5-10 yr)</option>
                        <option value="advanced">Advanced (10+)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Years Exp.</label>
                      <input
                        type="number"
                        min="0"
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills Chips */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expertise Technology Tags</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Add tech e.g. Docker"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="flex-grow px-2.5 py-1 text-xs bg-transparent outline-none border-none text-slate-900 placeholder-slate-400"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1" id="skills-chips">
                    {skills.map((sk) => (
                      <span key={sk} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-xs rounded-md font-mono text-indigo-700 font-semibold">
                        <span>{sk}</span>
                        <button type="button" onClick={() => removeSkill(sk)} className="text-rose-500 hover:text-rose-700 font-bold ml-1">×</button>
                      </span>
                    ))}
                    {skills.length === 0 && <span className="text-xs text-slate-400 font-mono">No tags configured. Add above.</span>}
                  </div>
                </div>
              </div>

              {/* Employment History Block */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="profile-employment-card">
                <div className="border-b border-slate-150 pb-3 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-indigo-600 w-4.5 h-4.5" />
                    <span>Employment History</span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Include previous positions to be referenced in candidate indexes.</p>
                </div>

                <div className="space-y-3 mb-4" id="experience-list">
                  {employmentHistory.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg relative">
                      <button
                        type="button"
                        onClick={() => removeEmployment(idx)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <h4 className="font-bold text-xs text-slate-900">{item.role}</h4>
                      <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">{item.company} — <span className="text-slate-400 font-normal">{item.duration}</span></p>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                  {employmentHistory.length === 0 && <div className="text-slate-450 text-xs font-mono">No historical work recorded. Write below.</div>}
                </div>

                {/* Sub-form */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={expCompany}
                      onChange={(e) => setExpCompany(e.target.value)}
                      className="bg-white border border-slate-200 rounded-md p-1.5 text-xs outline-none focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Mid Developer)"
                      value={expRole}
                      onChange={(e) => setExpRole(e.target.value)}
                      className="bg-white border border-slate-200 rounded-md p-1.5 text-xs outline-none focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 2024 - Present)"
                      value={expDuration}
                      onChange={(e) => setExpDuration(e.target.value)}
                      className="bg-white border border-slate-200 rounded-md p-1.5 text-xs outline-none focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <textarea
                    placeholder="Short summary of work accomplishments..."
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs outline-none focus:border-indigo-500 resize-none text-slate-900 placeholder-slate-400"
                  ></textarea>
                  <button
                    type="button"
                    onClick={addEmployment}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add Employment Entry</span>
                  </button>
                </div>
              </div>

              {/* MFA Flag Configuration */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap justify-between items-center shadow-xs" id="profile-mfa-card">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <span>Two-Factor Authentication (MFA)</span>
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">Protect login credentials with standard system pin verification challenges.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${mfaEnabled ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"}`}
                >
                  {mfaEnabled ? "✓ Enabled" : "Enable Security PIN"}
                </button>
              </div>

              {/* Action save buttons */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                  id="save-profile-btn"
                >
                  {loading ? "Saving Records..." : "Save Screening Profile"}
                </button>
                {saveSuccess && (
                  <span className="text-emerald-600 text-xs font-semibold animate-fade-in">
                    ✓ Profile successfully synced with SaaS repository database.
                  </span>
                )}
              </div>
            </form>
          )}

          {/* LAUNCH ASSESSMENT TAB */}
          {activeTab === "launch" && (
            <div className="space-y-4 animate-fade-in" id="launch-tab">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Zap className="text-indigo-600 w-4.5 h-4.5" />
                  <span>Start Your Screening Assessment</span>
                </h2>
                <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                  Select a domain. The engine will randomly extract from the question bank to structure a personalized assessment sheet. Your performance will determine certification, scoring metrics, and recruiter visibility rankings.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mt-3.5 flex items-start gap-2.5">
                  <AlertTriangle className="text-amber-600 w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-amber-800 text-xs">Anti-Cheat Proctoring Rules Active</h5>
                    <p className="text-[11px] text-amber-950 mt-0.5 leading-relaxed">
                      Launching establishes an isolated workspace. Fullscreen mode is enforced. Tab-switching, resize operations, and copy/paste triggers will downgrade your Integrity Index score in real-time. Make sure you have uninterrupted internet connectivity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="domains-grid">
                {[
                  {
                    name: "Full Stack Development",
                    desc: "Assessments spanning react functional hooks, rest endpoints, WebSockets concurrency, state caches, and index scaling.",
                    tech: ["React", "Node.js", "WebSockets", "SQL"]
                  },
                  {
                    name: "Front-End Development",
                    desc: "Responsive web layouts, render lifecycles, CSS flexbox/grid density, memoizations, and DOM manipulations.",
                    tech: ["HTML5", "CSS3", "React", "TypeScript"]
                  },
                  {
                    name: "Back-End Development",
                    desc: "Rest protocols, event loop blockings, asynchronous I/O architectures, DB clusters, and security tokens.",
                    tech: ["Express", "Python", "Go", "Docker"]
                  },
                  {
                    name: "UI/UX Development",
                    desc: "Framer design grids, micro-interactions, dark mode aesthetics, contrast ratios, and touch-target bounds.",
                    tech: ["Figma", "Design Systems", "Tailwind"]
                  },
                  {
                    name: "Quality Assurance",
                    desc: "Static reviews, penetration testing checks, OWASP injections, integration unit tests, and performance SLAs.",
                    tech: ["Jest", "Cypress", "Selenium", "OWASP"]
                  },
                  {
                    name: "Software Project Management",
                    desc: "Scrum commitments, commitment velocities, mid-sprint scope creep adjustments, and Jira planning systems.",
                    tech: ["Agile", "Scrum", "Jira", "Risk Management"]
                  }
                ].map((domain) => (
                  <div key={domain.name} className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-indigo-400 transition-all flex flex-col justify-between shadow-xs" id={`domain-card-${domain.name.replace(/\s+/g, "-")}`}>
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-xs text-slate-900">{domain.name}</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{domain.desc}</p>
                      <div className="flex gap-1.5 flex-wrap pt-1.5">
                        {domain.tech.map(t => (
                          <span key={t} className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-600 font-mono rounded-md font-medium">{t}</span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-150 flex items-center justify-between">
                      <div className="text-[11px] text-slate-450 font-mono">
                        Level: <span className="text-indigo-600 capitalize font-bold">{props.user.experienceLevel || "mid"}</span>
                      </div>
                      <button
                        onClick={() => props.onLaunchAssessment(domain.name as any, props.user.experienceLevel || "mid")}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                        id={`launch-btn-${domain.name.replace(/\s+/g, "-")}`}
                      >
                        <span>Take Assessment</span>
                        <Zap className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ASSESSMENT RECORDS TAB */}
          {activeTab === "history" && (
            <div className="space-y-4 animate-fade-in" id="history-tab">
              {/* Earned Certifications Grid */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="certified-registry-panel">
                <div className="border-b border-slate-150 pb-3 mb-3.5 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Award className="text-indigo-600 w-4.5 h-4.5" />
                      <span>Verified Credentials Registry</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">Certificates digitally signed and recorded on the public registry ledger.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="certs-list-container">
                  {certs.map((cert) => (
                    <div key={cert.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between relative overflow-hidden shadow-2xs" id={`cert-item-${cert.id}`}>
                      <div className="space-y-1 relative z-10">
                        <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                          Score: {cert.score}%
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 mt-1">{cert.technologyArea}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Issued: {cert.assessmentDate} • Hash: {cert.verificationHash.substr(0, 8)}</p>
                      </div>

                      <div className="flex items-center gap-2 relative z-10">
                        <button
                          onClick={() => {
                            setSelectedCertId(cert.id);
                            setTimeout(() => {
                              document.getElementById("share-achievement-console")?.scrollIntoView({ behavior: "smooth" });
                            }, 50);
                          }}
                          className={`px-2.5 py-1.5 border text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs ${selectedCertId === cert.id ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                          id={`select-share-btn-${cert.id}`}
                        >
                          <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{selectedCertId === cert.id ? "Active Share" : "Share"}</span>
                        </button>

                        <button
                          onClick={() => props.onViewCertificate(cert.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                          id={`view-cert-btn-${cert.id}`}
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {certs.length === 0 && (
                    <div className="col-span-2 p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2.5">
                      <Award className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-slate-700 text-xs font-bold">No active credentials earned yet.</p>
                      <p className="text-slate-500 text-[11px]">Earn certificates by completing assessments with scores ≥ 70% (Proficient).</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Achievements Console Section */}
              {certs.length > 0 && (
                <div 
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4" 
                  id="share-achievement-console"
                >
                  <div className="border-b border-slate-150 pb-3 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Share2 className="text-indigo-600 w-4.5 h-4.5" />
                        <span>Share Achievement Console</span>
                      </h2>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Broadcast your verified competencies directly to professional networks.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Pane: Customization Parameters */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* 1. Certification selector dropdown */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Select Credential to Share
                        </label>
                        <select
                          value={selectedCertId}
                          onChange={(e) => setSelectedCertId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none transition font-medium"
                          id="share-cert-dropdown"
                        >
                          {certs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.technologyArea} (Score: {c.score}% • {c.assessmentDate})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Style Preset selector tabs */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Sharing Style & Platform Preset
                        </label>
                        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          {[
                            { id: "linkedin", label: "LinkedIn" },
                            { id: "twitter", label: "X / Twitter" },
                            { id: "minimal", label: "Minimal" },
                            { id: "personal", label: "Personal" }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setShareTemplate(t.id as any)}
                              className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer text-center ${shareTemplate === t.id ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                              id={`share-style-tab-${t.id}`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Interactive Customization Switches */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-650 font-medium">Include Score</span>
                          <button
                            type="button"
                            onClick={() => setIncludeScore(!includeScore)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${includeScore ? "bg-indigo-600" : "bg-slate-300"}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${includeScore ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-650 font-medium">Include Proctor Integrity</span>
                          <button
                            type="button"
                            onClick={() => setIncludeIntegrity(!includeIntegrity)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${includeIntegrity ? "bg-indigo-600" : "bg-slate-300"}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${includeIntegrity ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        </div>

                        <div className="col-span-1 sm:col-span-2 space-y-1 pt-1.5 border-t border-slate-200/65">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Custom Post Hashtags
                          </label>
                          <input
                            type="text"
                            value={customHashtags}
                            onChange={(e) => setCustomHashtags(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono outline-none"
                            placeholder="e.g. #Certified #ReactJS"
                          />
                        </div>
                      </div>

                      {/* 4. Generated Textarea & Copy Actions */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Generated Post Snippet Text
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {generateShareContent().length} characters
                          </span>
                        </div>
                        <textarea
                          readOnly
                          value={generateShareContent()}
                          rows={5}
                          className="w-full bg-slate-950/5 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed select-all"
                          id="generated-post-textarea"
                        />

                        {/* Button Action Rows */}
                        <div className="flex flex-wrap gap-2.5 pt-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(generateShareContent());
                                setCopiedText(true);
                                setTimeout(() => setCopiedText(false), 2000);
                              } catch (err) {
                                console.error("Clipboard copy failed:", err);
                              }
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs ${copiedText ? "bg-emerald-600 text-white animate-pulse" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                            id="copy-snippet-btn"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied Snippet!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Post Text</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!selectedCert) return;
                              const certUrl = `https://techscreen.io/verify/${selectedCert.verificationHash}`;
                              try {
                                await navigator.clipboard.writeText(certUrl);
                                setCopiedLink(true);
                                setTimeout(() => setCopiedLink(false), 2000);
                              } catch (err) {
                                console.error("Clipboard copy failed:", err);
                              }
                            }}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${copiedLink ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                            id="copy-link-btn"
                          >
                            {copiedLink ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Verify Link</span>
                              </>
                            )}
                          </button>

                          {/* Quick Share Launch Intents */}
                          {selectedCert && (
                            <>
                              <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(generateShareContent())}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
                                id="share-twitter-direct-btn"
                              >
                                <Twitter className="w-3.5 h-3.5" />
                                <span>Post on X</span>
                              </a>
                              
                              <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://techscreen.io/verify/${selectedCert.verificationHash}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-[#0A66C2] hover:bg-[#0957a5] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
                                id="share-linkedin-direct-btn"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                                <span>Share LinkedIn</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right Pane: Premium Interactive Live Mockup Feed Post Card */}
                    <div className="lg:col-span-5 flex flex-col justify-start space-y-3">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Social Feed Live Preview
                      </span>

                      {/* Mock Social Feed Post */}
                      {selectedCert && (
                        <div className="border border-slate-200 bg-white rounded-2xl p-4 shadow-sm text-left relative overflow-hidden" id="mock-social-post-card">
                          
                          {/* Feed Header */}
                          <div className="flex items-start gap-2.5 mb-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase text-xs overflow-hidden flex-shrink-0">
                              {props.user.avatarUrl ? (
                                <img src={props.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                props.user.fullName ? props.user.fullName[0] : "U"
                              )}
                            </div>
                            <div className="min-w-0 flex-grow">
                              <span className="font-bold text-xs text-slate-900 block truncate leading-tight">
                                {props.user.fullName}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono truncate">
                                @{props.user.fullName ? props.user.fullName.replace(/\s+/g, "").toLowerCase() : "user"} • Just now
                              </span>
                            </div>
                          </div>

                          {/* Post snippet preview excerpt */}
                          <p className="text-[11px] text-slate-800 leading-relaxed mb-3 line-clamp-3 select-none whitespace-pre-line">
                            {generateShareContent().split("\n\n")[0]}
                          </p>

                          {/* Premium Holographic/Glowing Digital Badge Mockup */}
                          <div className="w-full bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 p-4 flex flex-col justify-between h-44 text-white shadow-md" id="share-hologram-badge">
                            
                            {/* Decorative background gradients */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.2)_0%,rgba(16,185,129,0.03)_60%,transparent_100%)] pointer-events-none"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.04] rounded-full blur-2xl"></div>
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:1rem_1rem]"></div>

                            {/* Badge Header Info */}
                            <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-indigo-600/20 border border-indigo-500/20 rounded-md text-indigo-400">
                                  <Award className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="text-[8px] font-mono tracking-widest text-indigo-400 uppercase font-bold block leading-none">
                                    TechScreen Certified
                                  </span>
                                  <span className="text-[7px] font-mono text-slate-400 block tracking-wider mt-0.5">
                                    PUBLIC TRUST REGISTRY
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-[9px] font-mono bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                {selectedCert.score}%
                              </div>
                            </div>

                            {/* Tech Area Display */}
                            <div className="space-y-0.5 my-2 relative z-10">
                              <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-white font-sans truncate">
                                {selectedCert.technologyArea}
                              </h4>
                              <p className="text-[8px] text-slate-400 font-mono truncate uppercase">
                                VERIFIED PROFESSIONAL COMPETENT
                              </p>
                            </div>

                            {/* Metadata stamp footer of hologram */}
                            <div className="flex justify-between items-end border-t border-slate-900 pt-2 relative z-10">
                              <div>
                                <span className="text-[8px] text-slate-500 block leading-none font-mono">CANDIDATE:</span>
                                <span className="text-[9px] font-bold text-slate-300 font-sans block truncate max-w-[120px]">{props.user.fullName}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-500 block leading-none font-mono">VERIFICATION:</span>
                                <span className="text-[9px] font-mono font-bold text-slate-400 block tracking-wider">
                                  {selectedCert.verificationHash.substr(0, 10).toUpperCase()}
                                </span>
                              </div>
                            </div>

                          </div>

                          {/* Post Card Footer */}
                          <div className="mt-2 text-[9px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100 pt-2">
                            <span>🔗 techscreen.io/verify/...</span>
                            <span className="flex items-center gap-1 text-indigo-600 font-bold">
                              <span>VERIFIED SECURE CERTIFICATE</span>
                              <FileCheck className="w-3 h-3" />
                            </span>
                          </div>

                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 text-center leading-relaxed">
                        *Post link connects viewers back to the secure public registry, showcasing your actual assessment telemetry and verified proctor history.
                      </span>

                    </div>

                  </div>

                </div>
              )}

              {/* Assessment attempts list */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="attempts-history-panel">
                <div className="border-b border-slate-150 pb-3 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="text-slate-400 w-4.5 h-4.5" />
                    <span>Attempt Log Matrix</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Historical overview of complete performance tests, times, and proctor records.</p>
                </div>

                <div className="overflow-x-auto" id="attempts-table-wrapper">
                  <table className="w-full text-left border-collapse text-xs" id="attempts-table">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Screening Domain</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Experience</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Date Taken</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Proctor Integrity</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Outcome Score</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attempts.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">{att.category}</td>
                          <td className="py-2.5 px-3.5 capitalize font-mono text-slate-500 text-[11px]">{att.difficulty}</td>
                          <td className="py-2.5 px-3.5 text-slate-550 font-mono text-[11px]">{att.endTime ? att.endTime.split("T")[0] : att.startTime.split("T")[0]}</td>
                          <td className="py-2.5 px-3.5">
                            <span className={`inline-flex items-center gap-1 font-mono font-bold ${att.integrityScore >= 80 ? "text-emerald-700" : att.integrityScore >= 60 ? "text-amber-700" : "text-rose-700"}`}>
                              {att.integrityScore}% 
                              <span className="text-[10px] text-slate-400 font-normal">({att.proctoringLogs.length} flags)</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5">
                            {att.status === "completed" ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 font-mono text-xs">{att.overallCandidateScore}/100</span>
                                <span className={`block text-[10px] font-semibold ${
                                  att.skillRatingLevel === "Expert" ? "text-emerald-700" :
                                  att.skillRatingLevel === "Advanced" ? "text-teal-700" :
                                  att.skillRatingLevel === "Proficient" ? "text-indigo-700" :
                                  att.skillRatingLevel === "Intermediate" ? "text-amber-700" : "text-rose-700"
                                }`}>
                                  {att.skillRatingLevel}
                                </span>
                                <div className="flex flex-col gap-1 items-start mt-1">
                                  <button
                                    onClick={() => {
                                      setSelectedAnalysisAttemptId(att.id);
                                      setIsAnalysisModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-800 transition cursor-pointer"
                                    title="View AI Advisor Strengths & Weaknesses analysis report"
                                  >
                                    <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                                    <span>AI Analysis</span>
                                  </button>
                                  
                                  {att.questions && att.questions.some(q => q.type === "coding") && (
                                    <button
                                      onClick={() => {
                                        setSelectedInterviewAttemptId(att.id);
                                        setIsInterviewModalOpen(true);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-750 hover:text-emerald-900 transition cursor-pointer"
                                      title="Start AI follow-up voice or text mock interview session"
                                    >
                                      <Brain className="w-3 h-3 text-emerald-500 animate-pulse" />
                                      <span>AI Mock Interview</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold italic capitalize">{att.status}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            {att.certificateId ? (
                              <button
                                onClick={() => props.onViewCertificate(att.certificateId!)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer text-xs"
                              >
                                Cert ID: {att.certificateId}
                              </button>
                            ) : (
                              <span className="text-slate-350 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {attempts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-slate-450 font-mono">No attempts on record. Select tab to launch.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Share Achievement Console */}
              {certs.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4" id="share-achievement-console">
                  <div className="border-b border-slate-150 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Share2 className="text-indigo-600 w-4.5 h-4.5" />
                      <span>Share Verified Achievement</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">Generate customized snippets or secure verification links optimized for your professional profiles.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left panel: Config */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Select Cert */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Certification</label>
                        <select
                          value={selectedCertId}
                          onChange={(e) => setSelectedCertId(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                        >
                          {certs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.technologyArea} (Score: {c.score}%)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Snippet Template Style */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Template Style</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "linkedin", label: "LinkedIn Post" },
                            { id: "twitter", label: "Twitter / X" },
                            { id: "minimal", label: "Minimal Tag" },
                            { id: "personal", label: "Personal Bio" }
                          ].map((tmpl) => (
                            <button
                              type="button"
                              key={tmpl.id}
                              onClick={() => setShareTemplate(tmpl.id as any)}
                              className={`py-1.5 px-2 border text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${shareTemplate === tmpl.id ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold" : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800"}`}
                            >
                              {tmpl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Config Options */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrics Inclusions</label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={includeScore}
                              onChange={(e) => setIncludeScore(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Include Assessment Score</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={includeIntegrity}
                              onChange={(e) => setIncludeIntegrity(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Include Security Integrity badge</span>
                          </label>
                        </div>
                      </div>

                      {/* Hashtags Input */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom Hashtags</label>
                        <input
                          type="text"
                          value={customHashtags}
                          onChange={(e) => setCustomHashtags(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Right panel: Live Preview & Copier */}
                    <div className="lg:col-span-7 flex flex-col justify-between p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3 font-sans text-slate-300">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                          <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">Live snippet preview</span>
                          <span className="text-[9px] text-indigo-400 bg-indigo-950/40 border border-indigo-900/60 px-2 py-0.5 rounded uppercase font-semibold">Ready to share</span>
                        </div>

                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                          {(() => {
                            const selectedCert = certs.find((c) => c.id === selectedCertId) || certs[0];
                            if (!selectedCert) return "Select a certificate to generate snippet.";
                            
                            const scoreStr = includeScore ? ` with an outstanding score of ${selectedCert.score}%` : "";
                            const integrityStr = includeIntegrity ? ` Verified with high anti-cheat proctoring integrity.` : "";
                            const verificationLink = `${window.location.origin}/verify/${selectedCert.id}`;

                            if (shareTemplate === "linkedin") {
                              return `🚀 Excited to share that I have officially certified in ${selectedCert.technologyArea}${scoreStr}! This verified credential certifies my advanced technical capabilities.${integrityStr}\n\n🔗 View dynamic proof of certification & code breakdown here: ${verificationLink}\n\n${customHashtags}`;
                            } else if (shareTemplate === "twitter") {
                              return `Just certified in ${selectedCert.technologyArea}${scoreStr} on TechScreen SaaS! Verified competency certificate: ${verificationLink} ${customHashtags}`;
                            } else if (shareTemplate === "minimal") {
                              return `Certified: ${selectedCert.technologyArea} (${selectedCert.score}%) | Verification Hash: ${selectedCert.verificationHash.substr(0, 16)}... | Verify: ${verificationLink}`;
                            } else {
                              return `Verified Software Engineer | Certified in ${selectedCert.technologyArea}${scoreStr} | Registry Verification link: ${verificationLink}`;
                            }
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => {
                            const selectedCert = certs.find((c) => c.id === selectedCertId) || certs[0];
                            if (!selectedCert) return;
                            const scoreStr = includeScore ? ` with an outstanding score of ${selectedCert.score}%` : "";
                            const integrityStr = includeIntegrity ? ` Verified with high anti-cheat proctoring integrity.` : "";
                            const verificationLink = `${window.location.origin}/verify/${selectedCert.id}`;
                            let txt = "";
                            if (shareTemplate === "linkedin") {
                              txt = `🚀 Excited to share that I have officially certified in ${selectedCert.technologyArea}${scoreStr}! This verified credential certifies my advanced technical capabilities.${integrityStr}\n\n🔗 View dynamic proof of certification & code breakdown here: ${verificationLink}\n\n${customHashtags}`;
                            } else if (shareTemplate === "twitter") {
                              txt = `Just certified in ${selectedCert.technologyArea}${scoreStr} on TechScreen SaaS! Verified competency certificate: ${verificationLink} ${customHashtags}`;
                            } else if (shareTemplate === "minimal") {
                              txt = `Certified: ${selectedCert.technologyArea} (${selectedCert.score}%) | Verification Hash: ${selectedCert.verificationHash.substr(0, 16)}... | Verify: ${verificationLink}`;
                            } else {
                              txt = `Verified Software Engineer | Certified in ${selectedCert.technologyArea}${scoreStr} | Registry Verification link: ${verificationLink}`;
                            }
                            navigator.clipboard.writeText(txt);
                            setCopiedText(true);
                            setTimeout(() => setCopiedText(false), 2000);
                          }}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                        >
                          {copiedText ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-indigo-200" />}
                          <span>{copiedText ? "Snippet Copied!" : "Copy Snippet"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const selectedCert = certs.find((c) => c.id === selectedCertId) || certs[0];
                            if (!selectedCert) return;
                            const verificationLink = `${window.location.origin}/verify/${selectedCert.id}`;
                            navigator.clipboard.writeText(verificationLink);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-800 cursor-pointer transition"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{copiedLink ? "Link Copied!" : "Copy Verification Link"}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* GDPR AUDIT TAB */}
          {activeTab === "gdpr" && (
            <div className="space-y-4 animate-fade-in" id="gdpr-tab">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="gdpr-box">
                <div className="border-b border-slate-150 pb-3 mb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="text-indigo-600 w-4.5 h-4.5" />
                    <span>GDPR Article 15 Data Portability Compliance</span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">As a registered IT resource, you have full legal control over your persisted cloud metrics.</p>
                </div>

                <div className="space-y-3 text-xs text-slate-500 leading-relaxed max-w-3xl">
                  <p>
                    Our platform enforces complete structural transparency. The following panel extracts the exact real-time JSON entry persisted inside our Cloud Database nodes linked to your candidate ID. It records credentials, certifications, proctoring violation logs, and historical compilations.
                  </p>
                  <p>
                    You may query, review, or export this dataset instantly to verify SOC 2 security compliance or migrate your credentials profile externally.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="font-bold text-slate-700 text-xs">Live Cloud DB Metadata Snapshot:</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 font-mono text-[10px] text-slate-600 max-h-60 overflow-y-auto shadow-2xs" id="gdpr-snapshot">
                    <pre>{JSON.stringify({
                      profile: props.user,
                      attemptsCount: attempts.length,
                      certificatesCount: certs.length,
                      gdprHash: "a4f89d02-e2bc-418b-967f-946ef22ac573"
                    }, null, 2)}</pre>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={exportGdprData}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      id="export-gdpr-btn"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Portable JSON Dump</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("To request complete deletion of this screening profile under GDPR Article 17, contact privacy@saas-screening.com.")}
                      className="px-3.5 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-650 text-xs font-bold rounded-lg transition cursor-pointer"
                      id="request-forget-btn"
                    >
                      Request Forget / Account Purge
                    </button>
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

      {isInterviewModalOpen && selectedInterviewAttemptId && (
        <MockInterviewModal
          attemptId={selectedInterviewAttemptId}
          onClose={() => {
            setIsInterviewModalOpen(false);
            setSelectedInterviewAttemptId(null);
          }}
        />
      )}
    </div>
  );
}
