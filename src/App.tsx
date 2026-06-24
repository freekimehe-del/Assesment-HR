/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, AssessmentAttempt, Question } from "./types";
import AuthScreen from "./components/AuthScreen";
import CandidateDashboard from "./components/CandidateDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AssessmentEngine from "./components/AssessmentEngine";
import CertificateViewer from "./components/CertificateViewer";
import { Award, Bell, Check, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToastProps {
  key?: React.Key;
  toast: {
    id: string;
    type: string;
    title: string;
    message: string;
    duration: number;
    action?: { label: string; onClick: () => void };
  };
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getStyleAndIcon = () => {
    switch (toast.type) {
      case "certificate":
        return {
          bgColor: "bg-slate-900 border-emerald-500 text-white shadow-emerald-500/10",
          icon: <Award className="w-5 h-5 text-emerald-400 shrink-0" />,
          accentBar: "bg-emerald-500"
        };
      case "request":
        return {
          bgColor: "bg-slate-900 border-indigo-500 text-white shadow-indigo-500/10",
          icon: <Bell className="w-5 h-5 text-indigo-400 shrink-0 animate-bounce" />,
          accentBar: "bg-indigo-500"
        };
      default:
        return {
          bgColor: "bg-white border-slate-200 text-slate-900 shadow-slate-100",
          icon: <Check className="w-5 h-5 text-emerald-500 shrink-0" />,
          accentBar: "bg-indigo-500"
        };
    }
  };

  const { bgColor, icon, accentBar } = getStyleAndIcon();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
      className={`max-w-md w-full border rounded-xl overflow-hidden shadow-lg backdrop-blur-md p-4 flex gap-3 relative transition-all ${bgColor}`}
      id={`toast-${toast.id}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`}></div>
      {icon}
      <div className="flex-1 space-y-1">
        <h4 className="font-bold text-xs leading-tight">{toast.title}</h4>
        <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{toast.message}</p>
        {toast.action && (
          <div className="pt-1.5 flex items-center gap-2">
            <button
              onClick={() => {
                toast.action?.onClick();
                onClose(toast.id);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded transition cursor-pointer flex items-center gap-1 shadow-xs"
              id={`toast-action-btn-${toast.id}`}
            >
              <span>{toast.action.label}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onClose(toast.id)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 text-[10px] font-medium rounded transition cursor-pointer"
              id={`toast-dismiss-btn-${toast.id}`}
            >
              Ignore
            </button>
          </div>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-200 p-0.5 rounded-full transition cursor-pointer self-start shrink-0"
        id={`toast-close-btn-${toast.id}`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<"auth" | "candidate" | "recruiter" | "admin" | "assessment" | "certificate">("auth");
  const [activeAttempt, setActiveAttempt] = useState<AssessmentAttempt | null>(null);
  const [activeCertificateId, setActiveCertificateId] = useState<string | undefined>(undefined);

  // Toast notifications state
  const [toasts, setToasts] = useState<any[]>([]);
  const [lastCheckedRequestIds, setLastCheckedRequestIds] = useState<string[]>([]);

  const addToast = (toast: { type: string; title: string; message: string; duration?: number; action?: { label: string; onClick: () => void } }) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newToast = { ...toast, id, duration: toast.duration || 5000 };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Poll for assessment requests from recruiters if user is a Candidate
  useEffect(() => {
    if (!user || user.role !== UserRole.CANDIDATE || view !== "candidate") return;

    const checkRequests = async () => {
      try {
        const res = await fetch(`/api/assessment/requests/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.requests) {
            const pending = data.requests.filter((r: any) => r.status === "pending");
            
            pending.forEach((req: any) => {
              if (!lastCheckedRequestIds.includes(req.id)) {
                // Trigger a beautiful toast!
                addToast({
                  type: "request",
                  title: `🔔 Screening Requested: ${req.category}`,
                  message: `${req.recruiterName} from ${req.companyName} has requested you to complete a ${req.difficulty} difficulty technical assessment.`,
                  duration: 9000,
                  action: {
                    label: "Launch Assessment",
                    onClick: () => {
                      handleLaunchAssessment(req.category as any, req.difficulty as any);
                      // dismiss on server
                      fetch(`/api/assessment/requests/${req.id}/dismiss`, { method: "POST" });
                    }
                  }
                });
                setLastCheckedRequestIds(prev => [...prev, req.id]);
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to poll assessment requests:", err);
      }
    };

    checkRequests();
    const interval = setInterval(checkRequests, 5000);
    return () => clearInterval(interval);
  }, [user, view, lastCheckedRequestIds]);

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

  const handleAssessmentComplete = (score?: number, category?: string, certId?: string) => {
    // Return candidate back to dashboard where they can review past score logs
    setView("candidate");
    setActiveAttempt(null);
    if (score !== undefined && score >= 70 && category) {
      addToast({
        type: "certificate",
        title: "🏆 Technical Credential Issued!",
        message: `Outstanding! You scored ${score}% (Proficient) in ${category}. Your secure digital certificate (${certId || "active"}) has been compiled & verified.`,
        duration: 9000,
        action: certId ? {
          label: "View Certificate",
          onClick: () => {
            handleViewCertificate(certId);
          }
        } : undefined
      });
    }
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

      {/* Floating Toast Alerts Panel */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 w-full max-w-sm px-4 md:px-0" id="toast-notifications-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
