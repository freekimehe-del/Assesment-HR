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

  const handleLaunchAssessment = async (category: Question["category"], difficulty: Question["difficulty"]) => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/assessment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: user.id,
          category,
          difficulty
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
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white font-sans" id="app-root">
      
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
