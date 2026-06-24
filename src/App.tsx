/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile, UserRole, AssessmentAttempt, Question } from "./types";
import AuthScreen from "./components/AuthScreen";
import CandidateDashboard from "./components/CandidateDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AssessmentEngine from "./components/AssessmentEngine";
import CertificateViewer from "./components/CertificateViewer";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<"auth" | "candidate" | "recruiter" | "admin" | "assessment" | "certificate">("auth");
  const [activeAttempt, setActiveAttempt] = useState<AssessmentAttempt | null>(null);
  const [activeCertificateId, setActiveCertificateId] = useState<string | undefined>(undefined);

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === UserRole.CANDIDATE) {
      setView("candidate");
    } else if (authenticatedUser.role === UserRole.RECRUITER) {
      setView("recruiter");
    } else if (authenticatedUser.role === UserRole.ADMIN) {
      setView("admin");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView("auth");
    setActiveAttempt(null);
    setActiveCertificateId(undefined);
  };

  const handleRoleSwitch = async (role: "CANDIDATE" | "RECRUITER" | "ADMIN") => {
    try {
      const res = await fetch(`/api/auth/sandbox-user?role=${role}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        if (role === "CANDIDATE") setView("candidate");
        else if (role === "RECRUITER") setView("recruiter");
        else if (role === "ADMIN") setView("admin");
      } else {
        alert(data.error || "Failed to switch sandbox role.");
      }
    } catch (err) {
      console.error("Failed to swap sandbox user roles:", err);
    }
  };

  const handleLaunchAssessment = async (category: Question["category"], difficulty: Question["difficulty"], isPractice?: boolean) => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/assessment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: user.id,
          category,
          difficulty,
          isPractice: !!isPractice
        })
      });
      const data = await res.json();
      
      if (res.ok && data.attempt) {
        setActiveAttempt(data.attempt);
        setView("assessment");
      } else {
        alert(data.error || "Failed to generate dynamic assessment sets.");
      }
    } catch (err) {
      console.error("Failed to compile candidate attempt set:", err);
    }
  };

  const handleViewCertificate = (certId: string) => {
    setActiveCertificateId(certId);
    setView("certificate");
  };

  const handleExitCertificate = () => {
    if (user) {
      if (user.role === UserRole.CANDIDATE) setView("candidate");
      else if (user.role === UserRole.RECRUITER) setView("recruiter");
      else setView("admin");
    } else {
      setView("auth");
    }
    setActiveCertificateId(undefined);
  };

  const handleAssessmentComplete = () => {
    // Return candidate back to dashboard where they can review past score logs
    setView("candidate");
    setActiveAttempt(null);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white flex flex-col font-sans" id="app-root">
      
      {/* Dev Sandbox System Interconnection Bar */}
      <div className="bg-slate-900 text-slate-100 px-4 py-2 text-xs flex flex-col md:flex-row gap-2 justify-between items-center border-b border-slate-800 shrink-0 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono tracking-wider font-semibold uppercase text-slate-300">SYSTEM INTERCONNECTION HUB (DEV SANDBOX)</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400">Switch role on-the-fly to test interconnected feedback loops:</span>
          <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
            <button
              onClick={() => handleRoleSwitch("CANDIDATE")}
              disabled={view === "assessment"}
              className={`px-3 py-1 rounded transition-all font-semibold cursor-pointer ${
                user?.role === UserRole.CANDIDATE && view !== "assessment"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Candidate (Alex)
            </button>
            <button
              onClick={() => handleRoleSwitch("RECRUITER")}
              disabled={view === "assessment"}
              className={`px-3 py-1 rounded transition-all font-semibold cursor-pointer ${
                user?.role === UserRole.RECRUITER && view !== "assessment"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Recruiter (Marcus)
            </button>
            <button
              onClick={() => handleRoleSwitch("ADMIN")}
              disabled={view === "assessment"}
              className={`px-3 py-1 rounded transition-all font-semibold cursor-pointer ${
                user?.role === UserRole.ADMIN && view !== "assessment"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Admin (Platform)
            </button>
          </div>
          {view === "assessment" && (
            <span className="text-rose-400 animate-pulse font-mono font-semibold">Assessment Active - Sandbox Locked</span>
          )}
        </div>
      </div>

      {/* 1. Portal Entrance (Not Authenticated) */}
      {view === "auth" && !user && (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}

      {/* 2. Candidate Dashboard View */}
      {view === "candidate" && user && user.role === UserRole.CANDIDATE && (
        <CandidateDashboard
          user={user}
          onLogout={handleLogout}
          onLaunchAssessment={handleLaunchAssessment}
          onViewCertificate={handleViewCertificate}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* 3. Recruiter/Organization Dashboard View */}
      {view === "recruiter" && user && user.role === UserRole.RECRUITER && (
        <RecruiterDashboard
          user={user}
          onLogout={handleLogout}
          onViewCertificate={handleViewCertificate}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* 4. Platform Administrator View */}
      {view === "admin" && user && user.role === UserRole.ADMIN && (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* 5. Isolated Assessment Sandbox Engine */}
      {view === "assessment" && activeAttempt && (
        <AssessmentEngine
          attempt={activeAttempt}
          onComplete={handleAssessmentComplete}
          onExit={() => setView("candidate")}
        />
      )}

      {/* 6. Certificate Registry Viewer */}
      {view === "certificate" && (
        <CertificateViewer
          certificateId={activeCertificateId}
          onBack={handleExitCertificate}
        />
      )}

    </div>
  );
}
