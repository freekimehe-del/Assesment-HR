/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, Question, QuestionType, UserRole } from "../types";
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Activity, 
  Server, 
  Compass, 
  Clock, 
  Sparkles, 
  FileCode, 
  TrendingUp,
  AlertTriangle,
  Info,
  LogOut,
  Check,
  Users,
  Shield,
  Search,
  SlidersHorizontal,
  Edit2,
  RefreshCw,
  Copy,
  Upload,
  Download,
  Key,
  Archive,
  Lock,
  Mail,
  Sliders,
  Building,
  GraduationCap,
  Video
} from "lucide-react";
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
  Cell 
} from "recharts";

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

interface PermissionGroup {
  id: string;
  name: string;
  targetRole: "RECRUITER" | "CANDIDATE";
  permissions: string[];
}

export default function AdminDashboard(props: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "permissions" | "cms" | "integrations">("analytics");
  const [userSubTab, setUserSubTab] = useState<"recruiters" | "candidates">("recruiters");
  
  // Lists
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  
  // Loading & Messages
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filters
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [cmsSearchQuery, setCmsSearchQuery] = useState("");
  const [cmsCategoryFilter, setCmsCategoryFilter] = useState("all");
  const [cmsDifficultyFilter, setCmsDifficultyFilter] = useState("all");
  const [cmsTypeFilter, setCmsTypeFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // User Form states (Create / Edit)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormName, setUserFormName] = useState("");
  const [userFormRole, setUserFormRole] = useState<UserRole>(UserRole.RECRUITER);
  const [userFormDepartment, setUserFormDepartment] = useState("");
  const [userFormPermissionGroup, setUserFormPermissionGroup] = useState("");
  const [userFormMfaEnabled, setUserFormMfaEnabled] = useState(false);
  // Candidate Specifics
  const [userFormLocation, setUserFormLocation] = useState("");
  const [userFormContact, setUserFormContact] = useState("");
  const [userFormCurrentRole, setUserFormCurrentRole] = useState("");
  const [userFormExpLevel, setUserFormExpLevel] = useState<UserProfile["experienceLevel"]>("mid");
  const [userFormYearsOfExp, setUserFormYearsOfExp] = useState(2);
  // Recruiter Specifics
  const [userFormCompany, setUserFormCompany] = useState("");
  const [userFormSubPlan, setUserFormSubPlan] = useState<"basic" | "professional" | "enterprise">("professional");

  // Custom Permission Group Form
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [groupFormName, setGroupFormName] = useState("");
  const [groupFormRole, setGroupFormRole] = useState<"RECRUITER" | "CANDIDATE">("RECRUITER");
  const [groupFormPermissions, setGroupFormPermissions] = useState<string[]>([]);

  // CMS Form states for creating a new question
  const [showCmsAddForm, setShowCmsAddForm] = useState(false);
  const [type, setType] = useState<QuestionType>("mcq");
  const [difficulty, setDifficulty] = useState<Question["difficulty"]>("mid");
  const [category, setCategory] = useState<Question["category"]>("Full Stack Development");
  const [techStack, setTechStack] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [weightage, setWeightage] = useState(10);
  const [timeAllocation, setTimeAllocation] = useState(60);
  const [tags, setTags] = useState("");

  // Coding specific form states
  const [codingPrompt, setCodingPrompt] = useState("");
  const [starterCodeJs, setStarterCodeJs] = useState("");
  const [starterCodePy, setStarterCodePy] = useState("");
  const [testCase1Input, setTestCase1Input] = useState("");
  const [testCase1Expected, setTestCase1Expected] = useState("");
  const [testCase2Input, setTestCase2Input] = useState("");
  const [testCase2Expected, setTestCase2Expected] = useState("");

  // Server health simulation logs
  const [healthLogs, setHealthLogs] = useState<string[]>([
    "[" + new Date().toISOString() + "] INFO: Kubernetes cluster master node reporting ready state.",
    "[" + new Date().toISOString() + "] INFO: Express API middleware initialized.",
    "[" + new Date().toISOString() + "] SUCCESS: Cloud DB In-memory schema fully mapped & synced.",
    "[" + new Date().toISOString() + "] SUCCESS: Gemini Core 2.5-pro model review pipeline standing by.",
    "[" + new Date().toISOString() + "] INFO: Port 3000 Nginx reverse ingress channels established."
  ]);

  // Integrations states
  const [integrationsConfig, setIntegrationsConfig] = useState<any>({
    googleMeetEnabled: true,
    zoomEnabled: true,
    msTeamsEnabled: true,
    customLinksEnabled: true,
    apiCredentials: {
      googleClientId: "secured_client_id_oauth",
      zoomClientId: "secured_client_id_oauth",
      msTeamsClientId: "secured_client_id_oauth"
    },
    reminders: {
      notifyOnSchedule: true,
      notifyOnUpdate: true,
      notifyOnCancel: true,
      notifyOnReschedule: true,
      remind24h: true,
      remind1h: true,
      remind15m: true
    }
  });
  const [allInterviewsList, setAllInterviewsList] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [savingIntegrations, setSavingIntegrations] = useState(false);

  const fetchIntegrationsAndInterviews = async () => {
    try {
      setLoadingIntegrations(true);
      const [intRes, listRes] = await Promise.all([
        fetch("/api/admin/integrations"),
        fetch("/api/interviews")
      ]);
      const intData = await intRes.json();
      const listData = await listRes.json();
      
      if (intData.success) {
        setIntegrationsConfig(intData.settings);
      }
      if (listData.success) {
        setAllInterviewsList(listData.interviews);
      }
    } catch (e) {
      console.error("Failed to load integrations/interviews:", e);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  useEffect(() => {
    if (activeTab === "integrations") {
      fetchIntegrationsAndInterviews();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQuestions();
    fetchUsers();
    fetchPermissionGroups();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/admin/questions");
      const data = await res.json();
      if (res.ok) {
        setQuestions(data);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchPermissionGroups = async () => {
    try {
      const res = await fetch("/api/admin/permission-groups");
      const data = await res.json();
      if (res.ok && data.success) {
        setPermissionGroups(data.groups);
      }
    } catch (err) {
      console.error("Failed to fetch permission groups:", err);
    }
  };

  // Trigger alert sound or notice
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  // CMS actions
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let options: string[] | undefined = undefined;
    if (type === "mcq" || type === "multiselect" || type === "scenario") {
      options = [optionA, optionB, optionC, optionD].filter(opt => opt.trim() !== "");
    } else if (type === "boolean") {
      options = ["True", "False"];
    }

    let starter: { [language: string]: string } | undefined = undefined;
    let tests: any[] | undefined = undefined;

    if (type === "coding") {
      starter = {
        javascript: starterCodeJs || "function solution() {\n  return null;\n}",
        python: starterCodePy || "def solution():\n    return None"
      };
      tests = [
        { input: testCase1Input || "[1,2]", expectedOutput: testCase1Expected || "[1,2]", description: "Verify base cases" },
        { input: testCase2Input || "[]", expectedOutput: testCase2Expected || "[]", description: "Verify boundary cases" }
      ];
    }

    const payload = {
      type,
      difficulty,
      category,
      technologyStack: techStack.split(",").map(s => s.trim()).filter(Boolean),
      title,
      description,
      options,
      correctAnswer: type === "multiselect" ? correctAnswer.split(",").map(s => s.trim()) : correctAnswer,
      explanation,
      weightage,
      timeAllocation,
      tags: tags.split(",").map(s => s.trim()).filter(Boolean),
      codingPrompt,
      starterCode: starter,
      testCases: tests
    };

    try {
      const res = await fetch("/api/admin/questions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        triggerSuccess("New Question successfully added to Question Bank CMS.");
        setQuestions(prev => [...prev, data.question]);
        // Reset
        setTitle("");
        setDescription("");
        setOptionA("");
        setOptionB("");
        setOptionC("");
        setOptionD("");
        setCorrectAnswer("");
        setExplanation("");
        setCodingPrompt("");
        setTags("");
        setTechStack("");
        setShowCmsAddForm(false);
      } else {
        triggerError(data.error || "Failed to insert question.");
      }
    } catch (err) {
      triggerError("Server communication fault during insertion.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you certain you want to delete this question? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== id));
        triggerSuccess("Question successfully removed from repository.");
      }
    } catch (err) {
      triggerError("Delete failed.");
    }
  };

  const handleDuplicateQuestion = async (id: string) => {
    try {
      const res = await fetch("/api/admin/questions/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestions(prev => [...prev, data.question]);
        triggerSuccess(`Duplicated "${data.question.title}" successfully.`);
      }
    } catch (err) {
      triggerError("Duplication failed.");
    }
  };

  const handleToggleArchiveQuestion = async (id: string, isCurrentlyArchived: boolean) => {
    const url = isCurrentlyArchived ? "/api/admin/questions/restore" : "/api/admin/questions/archive";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, archived: !isCurrentlyArchived } as any : q));
        triggerSuccess(isCurrentlyArchived ? "Question successfully restored to active pool." : "Question archived successfully.");
      }
    } catch (err) {
      triggerError("Archiving status change failed.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (!confirm(`Are you certain you want to delete the ${selectedQuestionIds.length} selected questions?`)) return;
    try {
      const res = await fetch("/api/admin/questions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedQuestionIds })
      });
      if (res.ok) {
        setQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
        setSelectedQuestionIds([]);
        triggerSuccess("Selected questions deleted successfully in bulk.");
      }
    } catch (err) {
      triggerError("Bulk delete failed.");
    }
  };

  const handleBulkUpdateDifficulty = async (diffValue: Question["difficulty"]) => {
    if (selectedQuestionIds.length === 0) return;
    try {
      const res = await fetch("/api/admin/questions/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedQuestionIds, difficulty: diffValue })
      });
      if (res.ok) {
        setQuestions(prev => prev.map(q => selectedQuestionIds.includes(q.id) ? { ...q, difficulty: diffValue } : q));
        setSelectedQuestionIds([]);
        triggerSuccess(`Updated difficulty to "${diffValue}" for selected questions.`);
      }
    } catch (err) {
      triggerError("Bulk update failed.");
    }
  };

  const handleSimulateImport = async () => {
    const mockImport = [
      {
        title: "Advanced Event Loop Blocking Detection",
        description: "Analyze the code snippet and determine what blocks Node.js process orchestration.",
        type: "scenario",
        difficulty: "senior",
        category: "Back-End Development",
        technologyStack: ["Node.js", "v8"],
        correctAnswer: "The synchronous fs.readFileSync execution on high load.",
        weightage: 20,
        timeAllocation: 120,
        tags: ["Node.js", "Performance"]
      },
      {
        title: "PostgreSQL B-Tree Index Optimization",
        description: "Review a slow execution report and propose indices to optimize dynamic lookups.",
        type: "mcq",
        difficulty: "senior",
        category: "Back-End Development",
        technologyStack: ["SQL", "PostgreSQL"],
        correctAnswer: "Composite index on candidate_id and created_at.",
        options: ["Single index on candidate_id", "Composite index on candidate_id and created_at", "Partial index", "Full-text index"],
        weightage: 15,
        timeAllocation: 90,
        tags: ["SQL", "Indexing"]
      }
    ];

    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: mockImport })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchQuestions();
        triggerSuccess(`Import Simulation complete! ${data.count} enterprise questions added.`);
      }
    } catch (err) {
      triggerError("Import simulation failed.");
    }
  };

  const handleSimulateExport = () => {
    const headers = "id,type,difficulty,category,title,weightage\n";
    const rows = questions.map(q => `"${q.id}","${q.type}","${q.difficulty}","${q.category}","${q.title.replace(/"/g, '""')}",${q.weightage}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TechScreen_QuestionBank_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerSuccess("Export completed! Spreadsheet CSV dispatched for download.");
  };

  // User Actions
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormEmail("");
    setUserFormName("");
    setUserFormRole(UserRole.RECRUITER);
    setUserFormDepartment("");
    setUserFormPermissionGroup(permissionGroups.find(g => g.targetRole === "RECRUITER")?.id || "");
    setUserFormMfaEnabled(false);
    setUserFormLocation("New York, NY");
    setUserFormContact("");
    setUserFormCurrentRole("Software Engineer");
    setUserFormExpLevel("mid");
    setUserFormYearsOfExp(3);
    setUserFormCompany("");
    setUserFormSubPlan("professional");
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setUserFormEmail(u.email);
    setUserFormName(u.fullName);
    setUserFormRole(u.role);
    setUserFormDepartment(u.department || "");
    setUserFormPermissionGroup(u.permissionGroupId || "");
    setUserFormMfaEnabled(u.mfaEnabled);
    setUserFormLocation(u.location || "");
    setUserFormContact(u.contactNumber || "");
    setUserFormCurrentRole(u.currentRole || "");
    setUserFormExpLevel(u.experienceLevel || "mid");
    setUserFormYearsOfExp(u.yearsOfExperience || 0);
    setUserFormCompany(u.companyName || "");
    setUserFormSubPlan(u.subscriptionPlan || "professional");
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!editingUser;
    const url = isEdit ? "/api/admin/users/edit" : "/api/admin/users/create";
    
    const payload = {
      id: editingUser?.id,
      email: userFormEmail,
      fullName: userFormName,
      role: userFormRole,
      department: userFormDepartment,
      permissionGroupId: userFormPermissionGroup,
      mfaEnabled: userFormMfaEnabled,
      location: userFormLocation,
      contactNumber: userFormContact,
      currentRole: userFormCurrentRole,
      experienceLevel: userFormExpLevel,
      yearsOfExperience: userFormYearsOfExp,
      companyName: userFormCompany,
      subscriptionPlan: userFormSubPlan
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUsers();
        triggerSuccess(isEdit ? `Updated profile for ${userFormName}.` : `Created new user account for ${userFormName}.`);
        setShowUserModal(false);
      } else {
        triggerError(data.error || "Failed to process user account.");
      }
    } catch (err) {
      triggerError("Server connection error during user save.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        triggerSuccess(`User account for ${user.fullName} is now ${newStatus.toUpperCase()}.`);
        setHealthLogs(prev => [`[${new Date().toISOString()}] WARN: Administrator modified status for ${user.fullName} to ${newStatus}.`, ...prev]);
      }
    } catch (err) {
      triggerError("Failed to switch user status.");
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerSuccess(data.message);
      }
    } catch (err) {
      triggerError("Failed to trigger password reset.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you certain you want to permanently delete this user account? This cannot be restored.")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.filter(u => u.id !== userId));
        triggerSuccess("User account permanently purged.");
      }
    } catch (err) {
      triggerError("User deletion failed.");
    }
  };

  // Permission groups save
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormName("");
    setGroupFormRole("RECRUITER");
    setGroupFormPermissions([]);
  };

  const handleOpenEditGroup = (g: PermissionGroup) => {
    setEditingGroup(g);
    setGroupFormName(g.name);
    setGroupFormRole(g.targetRole);
    setGroupFormPermissions(g.permissions);
  };

  const handleTogglePermissionInForm = (perm: string) => {
    setGroupFormPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissionGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormName) return;

    const payload = {
      id: editingGroup?.id,
      name: groupFormName,
      targetRole: groupFormRole,
      permissions: groupFormPermissions
    };

    try {
      const res = await fetch("/api/admin/permission-groups/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPermissionGroups();
        triggerSuccess(data.message);
        setEditingGroup(null);
        setGroupFormName("");
        setGroupFormPermissions([]);
        setHealthLogs(prev => [`[${new Date().toISOString()}] INFO: Custom permission group '${groupFormName}' successfully saved & synchronized across live container tokens.`, ...prev]);
      }
    } catch (err) {
      triggerError("Failed to save permission group.");
    }
  };

  const triggerResetDb = async () => {
    if (!confirm("Reset database state to original defaults? All candidate screening sessions, customized permission groups, and newly created questions will be wiped.")) return;
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        triggerSuccess("In-memory database successfully refreshed to system defaults.");
        fetchQuestions();
        fetchUsers();
        fetchPermissionGroups();
      }
    } catch (err) {
      triggerError("Database wipe failed.");
    }
  };

  // --------------------------------------------------------
  // Computations for premium charts & numbers
  // --------------------------------------------------------
  const stats = useMemo(() => {
    const recruitersList = users.filter(u => u.role === UserRole.RECRUITER);
    const candidatesList = users.filter(u => u.role === UserRole.CANDIDATE);
    
    // In-memory stats counts
    const totalRecruiters = recruitersList.length;
    const activeRecruiters = recruitersList.filter(u => u.status !== "suspended").length;
    const totalCandidates = candidatesList.length;
    const activeCandidates = candidatesList.filter(u => u.status !== "suspended").length;

    // We can assume questions bank size
    const totalQuestions = questions.length;

    return {
      totalRecruiters,
      activeRecruiters,
      totalCandidates,
      activeCandidates,
      totalQuestions,
      testsCompleted: 42, // Seeded visual reports
      avgScore: 78,
      passRate: 74
    };
  }, [users, questions]);

  // Recruiter list filter
  const filteredRecruiters = useMemo(() => {
    return users.filter(u => {
      if (u.role !== UserRole.RECRUITER) return false;
      if (userSearchQuery.trim() === "") return true;
      const term = userSearchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.companyName || "").toLowerCase().includes(term) ||
        (u.department || "").toLowerCase().includes(term)
      );
    });
  }, [users, userSearchQuery]);

  // Candidate list filter
  const filteredCandidates = useMemo(() => {
    return users.filter(u => {
      if (u.role !== UserRole.CANDIDATE) return false;
      if (userSearchQuery.trim() === "") return true;
      const term = userSearchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.location || "").toLowerCase().includes(term) ||
        (u.currentRole || "").toLowerCase().includes(term)
      );
    });
  }, [users, userSearchQuery]);

  // Question list filter
  const filteredQuestionsList = useMemo(() => {
    return questions.filter(q => {
      // Archive filter
      const isArchived = (q as any).archived === true;
      if (isArchived && !showArchived) return false;
      if (!isArchived && showArchived) return false;

      // Category
      if (cmsCategoryFilter !== "all" && q.category !== cmsCategoryFilter) return false;
      // Difficulty
      if (cmsDifficultyFilter !== "all" && q.difficulty !== cmsDifficultyFilter) return false;
      // Type
      if (cmsTypeFilter !== "all" && q.type !== cmsTypeFilter) return false;

      if (cmsSearchQuery.trim() === "") return true;
      const term = cmsSearchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(term) ||
        q.description.toLowerCase().includes(term) ||
        q.technologyStack.some(t => t.toLowerCase().includes(term))
      );
    });
  }, [questions, cmsSearchQuery, cmsCategoryFilter, cmsDifficultyFilter, cmsTypeFilter, showArchived]);

  // Selection list helper
  const handleSelectAllQuestions = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuestionIds(filteredQuestionsList.map(q => q.id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const handleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Recharts Seed Data for elegant dashboards
  const monthlyActivityData = [
    { name: "Jan 2026", Screenings: 24, Certificates: 12, Candidates: 45 },
    { name: "Feb 2026", Screenings: 35, Certificates: 18, Candidates: 58 },
    { name: "Mar 2026", Screenings: 48, Certificates: 28, Candidates: 79 },
    { name: "Apr 2026", Screenings: 64, Certificates: 36, Candidates: 102 },
    { name: "May 2026", Screenings: 82, Certificates: 45, Candidates: 135 },
    { name: "Jun 2026", Screenings: 110, Certificates: 68, Candidates: 184 }
  ];

  const categoryDistributionData = [
    { name: "Full Stack", value: 38 },
    { name: "Front-End", value: 25 },
    { name: "Back-End", value: 20 },
    { name: "UI/UX Design", value: 10 },
    { name: "QA/Testing", value: 7 }
  ];

  const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

  // Available permissions definitions
  const recruiterPermissionsList = [
    "View Candidates", "Create Assessments", "Edit Assessments", "Delete Assessments", 
    "Assign Tests", "View Results", "Export Reports", "Download Reports", 
    "Schedule Interviews", "Manage Question Bank", "Invite Candidates", "Send Emails", 
    "AI Evaluation Access", "Dashboard Analytics"
  ];

  const candidatePermissionsList = [
    "View Assigned Tests", "Start Test", "Resume Test", "Submit Test", 
    "View Result", "Download Certificate", "Upload Resume", "Update Profile", 
    "View Interview Schedule"
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative" id="admin-dashboard-root">
      
      {/* Toast Notice Header */}
      {(successMsg || errorMsg) && (
        <div className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-bounce`}>
          <div className={`p-3.5 rounded-xl border shadow-lg text-xs font-bold flex items-center gap-2.5 ${successMsg ? 'bg-indigo-50 border-indigo-150 text-indigo-800' : 'bg-rose-50 border-rose-150 text-rose-800'}`}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{successMsg || errorMsg}</span>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center relative z-25" id="admin-nav">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">Platform Administrator</span>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider font-mono">Super-user Command Console</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerResetDb}
            className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Database State</span>
          </button>
          <button
            onClick={props.onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-950 text-slate-600 rounded-lg text-xs font-semibold transition cursor-pointer shadow-3xs"
            id="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-grid">
        
        {/* Sidebar Nav links */}
        <aside className="lg:col-span-3 space-y-4" id="admin-aside">
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 space-y-1 shadow-sm sticky top-20">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === "analytics" ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              id="admin-tab-analytics"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === "users" ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              id="admin-tab-users"
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
              <span className="ml-auto px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[9px] font-bold rounded-md leading-none">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("permissions")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === "permissions" ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              id="admin-tab-permissions"
            >
              <Shield className="w-4 h-4" />
              <span>Permission Control</span>
            </button>

            <button
              onClick={() => setActiveTab("cms")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === "cms" ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              id="admin-tab-cms"
            >
              <FileCode className="w-4 h-4" />
              <span>Question Bank CMS</span>
              <span className="ml-auto px-1.5 py-0.5 bg-emerald-600 text-white font-mono text-[9px] font-bold rounded-md leading-none">
                {questions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("integrations")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === "integrations" ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              id="admin-tab-integrations"
            >
              <Video className="w-4 h-4" />
              <span>Interview Integrations</span>
            </button>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-850 shadow-xs space-y-2 text-[11px] font-mono leading-relaxed" id="admin-quick-summary">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider mb-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Node Active</span>
            </span>
            <div className="space-y-1 text-slate-300">
              <p>Platform: <span className="text-white font-bold">TechScreen ATS</span></p>
              <p>Cluster Status: <span className="text-emerald-400 font-bold">Healthy</span></p>
              <p>Active Admins: <span className="text-white font-bold">1 (SLA Prime)</span></p>
              <p>Database Type: <span className="text-indigo-400 font-bold">In-Memory Engine</span></p>
            </div>
          </div>
        </aside>

        {/* Content Panel Area */}
        <main className="lg:col-span-9 space-y-6" id="admin-main">
          
          {/* ==================== TAB 1: ANALYTICS ==================== */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-fadeIn" id="analytics-tab-panel">
              
              {/* Premium Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="premium-stats-grid">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                  <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Total Recruiters</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900">{stats.totalRecruiters}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">({stats.activeRecruiters} active)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(stats.activeRecruiters / (stats.totalRecruiters || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                  <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Total Candidates</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900">{stats.totalCandidates}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">({stats.activeCandidates} active)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(stats.activeCandidates / (stats.totalCandidates || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                  <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Assessment Index</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900">{stats.totalQuestions}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Curated Challenge Items</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
                  <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Credential Pass Rate</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900">{stats.passRate}%</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Excellent</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stats.passRate}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="charts-grid">
                
                {/* Candidate Screenings over Time Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:col-span-8 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">Screening and Registrations</h3>
                      <p className="text-[10px] text-slate-400">Total monthly assessment logs generated & compiled</p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded">Live Update</span>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyActivityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScreenings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="Screenings" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorScreenings)" />
                        <Area type="monotone" dataKey="Certificates" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories pie chart distribution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:col-span-4 space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">Subject Distributions</h3>
                    <p className="text-[10px] text-slate-400">Attempts categorized by technical domain</p>
                  </div>
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-slate-800">142</span>
                      <span className="text-[8px] text-slate-400 font-semibold uppercase">Total Attempts</span>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto pt-1 text-[9px] text-slate-500 font-semibold">
                    {categoryDistributionData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span>{entry.name}</span>
                        </div>
                        <span className="font-mono text-slate-700 font-bold">{entry.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recruitment & Hiring Funnel Block */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="hiring-funnel-panel">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">Enterprise Recruitment Funnel Performance</h3>
                  <p className="text-[10px] text-slate-400">Tracking candidate progression from initial platform invite to final direct recruiter booking</p>
                </div>

                <div className="space-y-3" id="funnel-bars-container">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                      <span>1. Invite Dispatched / Pre-Screened Candidates</span>
                      <span className="font-mono text-slate-900">420 Users (100%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-lg transition-all duration-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                      <span>2. Assessment Initiated / Active Assessment Loops</span>
                      <span className="font-mono text-slate-900">294 Users (70%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-lg transition-all duration-500" style={{ width: '70%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                      <span>3. Assessment Completed / Credential Issued (Score &gt;= 70%)</span>
                      <span className="font-mono text-slate-900">189 Users (45%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-lg transition-all duration-500" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-700">
                      <span>4. Shortlisted / Interview Direct Scheduled</span>
                      <span className="font-mono text-slate-900">63 Users (15%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-lg overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-lg transition-all duration-500" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active container health monitor logs console */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3.5" id="health-console-card">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-450 animate-pulse" />
                    <span className="text-xs font-bold font-mono">LIVE KUBERNETES CONTAINER MONITOR</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold rounded">ONLINE</span>
                </div>
                
                <div className="space-y-1.5 font-mono text-[10px] text-slate-400 max-h-40 overflow-y-auto leading-relaxed scrollbar-thin" id="health-logs-terminal">
                  {healthLogs.map((log, index) => (
                    <div key={index} className="hover:text-white transition-colors">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: USER MANAGEMENT ==================== */}
          {activeTab === "users" && (
            <div className="space-y-5 animate-fadeIn" id="users-tab-panel">
              
              {/* Header actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm" id="users-control-bar">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:max-w-xs gap-2" id="users-search-wrapper">
                  <Search className="w-4 h-4 text-slate-450" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="bg-transparent text-xs text-slate-900 outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleSimulateImport}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-750 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 shadow-3xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Mock Data</span>
                  </button>
                  <button
                    onClick={handleOpenCreateUser}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/10"
                    id="btn-create-user"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create User Profile</span>
                  </button>
                </div>
              </div>

              {/* Sub tabs for Recruiters vs Candidates */}
              <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-1 shadow-sm w-fit" id="users-subtabs">
                <button
                  onClick={() => setUserSubTab("recruiters")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${userSubTab === "recruiters" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Building className="w-4 h-4" />
                  <span>Recruiters ({filteredRecruiters.length})</span>
                </button>
                <button
                  onClick={() => setUserSubTab("candidates")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${userSubTab === "candidates" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Candidates ({filteredCandidates.length})</span>
                </button>
              </div>

              {/* RECRUITERS TABLE VIEW */}
              {userSubTab === "recruiters" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="recruiters-panel">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs" id="recruiters-table">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Recruiter / Org</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Department</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Permission Role</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecruiters.map(u => {
                          const pGroup = permissionGroups.find(g => g.id === u.permissionGroupId);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold font-mono text-[11px]">
                                    {u.fullName.split(" ").map(n => n[0]).join("")}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 block leading-snug">{u.fullName}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">{u.email}</span>
                                    <span className="text-[9px] text-indigo-650 font-semibold block">{u.companyName || "No Company"} ({u.subscriptionPlan || "professional"})</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium text-slate-700">{u.department || "General HR"}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-md font-mono text-[10px] font-bold border border-slate-200">
                                  {pGroup ? pGroup.name : "Custom Lead"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider font-mono ${u.status === "suspended" ? "bg-rose-50 border border-rose-100 text-rose-700 animate-pulse" : "bg-emerald-50 border border-emerald-100 text-emerald-700"}`}>
                                  {u.status || "active"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${u.status === "suspended" ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"}`}
                                    title={u.status === "suspended" ? "Activate account" : "Suspend account"}
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleResetPassword(u.id)}
                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer transition"
                                    title="Reset credential instructions"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditUser(u)}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-indigo-700 cursor-pointer transition"
                                    title="Edit settings"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-rose-750 cursor-pointer transition"
                                    title="Delete account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CANDIDATES TABLE VIEW */}
              {userSubTab === "candidates" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="candidates-panel">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs" id="candidates-table">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Candidate Profile</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Experience Level</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Skills Match</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCandidates.map(u => {
                          const pGroup = permissionGroups.find(g => g.id === u.permissionGroupId);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full border border-slate-150 object-cover shrink-0" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                                      {u.fullName.split(" ").map(n => n[0]).join("")}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-slate-900 block leading-snug">{u.fullName}</span>
                                    <span className="text-[10px] text-slate-500 font-medium block leading-none">{u.email}</span>
                                    <span className="text-[9px] text-slate-400 font-medium block leading-relaxed">{u.location || "San Francisco, CA"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="capitalize font-mono font-bold text-slate-700">{u.experienceLevel || "mid"} ({u.yearsOfExperience || 2} yrs)</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {(u.skills || []).slice(0, 3).map(sk => (
                                    <span key={sk} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold font-mono">{sk}</span>
                                  ))}
                                  {(u.skills || []).length > 3 && (
                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-bold font-mono">+{u.skills!.length - 3}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider font-mono ${u.status === "suspended" ? "bg-rose-50 border border-rose-100 text-rose-700 animate-pulse" : "bg-emerald-50 border border-emerald-100 text-emerald-700"}`}>
                                  {u.status || "active"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${u.status === "suspended" ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"}`}
                                    title={u.status === "suspended" ? "Activate candidate account" : "Suspend candidate account"}
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleResetPassword(u.id)}
                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer transition"
                                    title="Reset credential instructions"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditUser(u)}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-indigo-700 cursor-pointer transition"
                                    title="Edit settings"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-rose-750 cursor-pointer transition"
                                    title="Delete candidate"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: PERMISSION CONTROL ==================== */}
          {activeTab === "permissions" && (
            <div className="space-y-6 animate-fadeIn" id="permissions-tab-panel">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="permissions-split-grid">
                
                {/* Available Groups */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:col-span-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">Permission Groups</h3>
                    <button
                      onClick={handleOpenCreateGroup}
                      className="text-indigo-650 hover:text-indigo-700 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Group</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto" id="perm-groups-list">
                    {permissionGroups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => handleOpenEditGroup(g)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer block ${editingGroup?.id === g.id ? "bg-indigo-50/50 border-indigo-300" : "bg-slate-50/30 border-slate-250 hover:bg-slate-50"}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-800">{g.name}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold font-mono rounded uppercase tracking-wider ${g.targetRole === "RECRUITER" ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700"}`}>
                            {g.targetRole}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">{g.permissions.length} active permissions mapped</p>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-[10px] text-indigo-800 font-medium flex gap-2">
                    <Info className="w-4 h-4 shrink-0 text-indigo-600" />
                    <span>Edits to custom permission groups are pushed instantly to all linked active session tokens without logging out.</span>
                  </div>
                </div>

                {/* Permissions matrix configuration pane */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm md:col-span-8 space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      {editingGroup ? `Modify Group Matrix: ${groupFormName}` : "Create/Configure Permission Matrix"}
                    </h3>
                    <p className="text-[10px] text-slate-400">Map specific SaaS capabilities to live roles</p>
                  </div>

                  <form onSubmit={handleSavePermissionGroup} className="space-y-4" id="perm-group-editor">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Group Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lead Technical Recruiter"
                          value={groupFormName}
                          onChange={(e) => setGroupFormName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Persona Role</label>
                        <select
                          value={groupFormRole}
                          onChange={(e) => {
                            setGroupFormRole(e.target.value as any);
                            setGroupFormPermissions([]);
                          }}
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 text-xs text-slate-900 outline-none"
                        >
                          <option value="RECRUITER">RECRUITER</option>
                          <option value="CANDIDATE">CANDIDATE</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Mapped Permission Access Checklist</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl" id="perm-checklist">
                        {groupFormRole === "RECRUITER" ? (
                          recruiterPermissionsList.map(perm => (
                            <label key={perm} className="flex items-center gap-2 px-2.5 py-2 hover:bg-white rounded-lg transition-colors text-slate-700 font-semibold text-[11px] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupFormPermissions.includes(perm)}
                                onChange={() => handleTogglePermissionInForm(perm)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{perm}</span>
                            </label>
                          ))
                        ) : (
                          candidatePermissionsList.map(perm => (
                            <label key={perm} className="flex items-center gap-2 px-2.5 py-2 hover:bg-white rounded-lg transition-colors text-slate-700 font-semibold text-[11px] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groupFormPermissions.includes(perm)}
                                onChange={() => handleTogglePermissionInForm(perm)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{perm}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                    >
                      {editingGroup ? "Synchronize Settings" : "Incorporate Custom Group"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: CMS QUESTION BANK ==================== */}
          {activeTab === "cms" && (
            <div className="space-y-5 animate-fadeIn" id="cms-tab-panel">
              
              {/* Insert Question toggleable Form panel */}
              {showCmsAddForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="add-question-panel">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-indigo-650" />
                      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Insert New Screening Challenge</h2>
                    </div>
                    <button
                      onClick={() => setShowCmsAddForm(false)}
                      className="text-slate-450 hover:text-slate-650 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleAddQuestion} className="space-y-4 text-xs" id="cms-form">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Question Type</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                        >
                          <option value="mcq">Single MCQ (Single Answer)</option>
                          <option value="multiselect">Multi-select (Multiple Answers)</option>
                          <option value="boolean">True/False</option>
                          <option value="fill_in_blank">Fill in the Blank</option>
                          <option value="scenario">Scenario-Based Case</option>
                          <option value="coding">Coding Sandbox Assignment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                        >
                          <option value="junior">Junior (0-2 yr)</option>
                          <option value="mid">Mid (2-5 yr)</option>
                          <option value="senior">Senior (5-10 yr)</option>
                          <option value="advanced">Advanced (10+ yr)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Domain Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                        >
                          <option value="Full Stack Development">Full Stack Development</option>
                          <option value="Front-End Development">Front-End Development</option>
                          <option value="Back-End Development">Back-End Development</option>
                          <option value="UI/UX Development">UI/UX Development</option>
                          <option value="Quality Assurance">Quality Assurance</option>
                          <option value="Software Project Management">Software Project Management</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Question Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Memory Management in Node.js"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tech Stack (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Node.js, V8 Engine"
                          value={techStack}
                          onChange={(e) => setTechStack(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Specification details</label>
                      <textarea
                        required
                        placeholder="Enter details of the technical prompt..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500 resize-y"
                      ></textarea>
                    </div>

                    {/* MCQ Options */}
                    {(type === "mcq" || type === "multiselect" || type === "scenario") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl" id="mcq-options-inputs">
                        <div>
                          <input
                            type="text"
                            placeholder="Option A (required)"
                            required
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Option B (required)"
                            required
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Option C"
                            value={optionC}
                            onChange={(e) => setOptionC(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Option D"
                            value={optionD}
                            onChange={(e) => setOptionD(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Coding details */}
                    {type === "coding" && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5" id="coding-cms-inputs">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Coding Specifications Instructions (Test Criteria)</label>
                          <textarea
                            placeholder="e.g., Write a function to check duplicates and output boolean."
                            value={codingPrompt}
                            onChange={(e) => setCodingPrompt(e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500 resize-none"
                          ></textarea>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-slate-550 font-mono font-bold mb-0.5">JS Starter Code</label>
                            <textarea
                              placeholder="function solution() {\n  return null;\n}"
                              value={starterCodeJs}
                              onChange={(e) => setStarterCodeJs(e.target.value)}
                              rows={3}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-900 focus:border-indigo-500"
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-550 font-mono font-bold mb-0.5">Python Starter Code</label>
                            <textarea
                              placeholder="def solution():\n    return None"
                              value={starterCodePy}
                              onChange={(e) => setStarterCodePy(e.target.value)}
                              rows={3}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-900 focus:border-indigo-500"
                            ></textarea>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div className="p-2.5 border border-slate-200 rounded-lg bg-white shadow-3xs">
                            <label className="block text-[10px] text-slate-500 font-mono font-bold mb-1">Test Case 1 (e.g. input: [2, 3], exp: [2])</label>
                            <input type="text" placeholder="Input" value={testCase1Input} onChange={e => setTestCase1Input(e.target.value)} className="w-full bg-slate-50 p-1.5 text-[10px] border border-slate-200 rounded-md mb-1 text-slate-900 outline-none"/>
                            <input type="text" placeholder="Expected" value={testCase1Expected} onChange={e => setTestCase1Expected(e.target.value)} className="w-full bg-slate-50 p-1.5 text-[10px] border border-slate-200 rounded-md text-slate-900 outline-none"/>
                          </div>
                          <div className="p-2.5 border border-slate-200 rounded-lg bg-white shadow-3xs">
                            <label className="block text-[10px] text-slate-500 font-mono font-bold mb-1">Test Case 2</label>
                            <input type="text" placeholder="Input" value={testCase2Input} onChange={e => setTestCase2Input(e.target.value)} className="w-full bg-slate-50 p-1.5 text-[10px] border border-slate-200 rounded-md mb-1 text-slate-900 outline-none"/>
                            <input type="text" placeholder="Expected" value={testCase2Expected} onChange={e => setTestCase2Expected(e.target.value)} className="w-full bg-slate-50 p-1.5 text-[10px] border border-slate-200 rounded-md text-slate-900 outline-none"/>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Correct Answer Match</label>
                        <input
                          type="text"
                          required
                          placeholder={type === "multiselect" ? "e.g. Option A, Option B" : "Correct answer details"}
                          value={correctAnswer}
                          onChange={(e) => setCorrectAnswer(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Points Weightage</label>
                        <input
                          type="number"
                          min="1"
                          value={weightage}
                          onChange={(e) => setWeightage(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Time Limit (secs)</label>
                        <input
                          type="number"
                          min="5"
                          value={timeAllocation}
                          onChange={(e) => setTimeAllocation(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Node.js, Performance, Concurrency"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Correct Solution Explanation</label>
                      <textarea
                        placeholder="Explain why this answer resolves the task correctly..."
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500 resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition cursor-pointer shadow-sm shadow-indigo-600/10"
                    >
                      {loading ? "Injecting..." : "Incorporate Question to CMS"}
                    </button>
                  </form>
                </div>
              )}

              {/* Advanced Search & Filtering controls */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5" id="cms-filters-card">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:max-w-xs gap-2" id="cms-search-wrapper">
                    <Search className="w-4 h-4 text-slate-450" />
                    <input
                      type="text"
                      placeholder="Search questions title or text..."
                      value={cmsSearchQuery}
                      onChange={(e) => setCmsSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-slate-900 outline-none w-full"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSimulateImport}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-650 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Inject enterprise spreadsheet items"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Spreadsheet Import</span>
                    </button>

                    <button
                      onClick={handleSimulateExport}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-650 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Download full challenge list as CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV Export</span>
                    </button>

                    <button
                      onClick={() => setShowCmsAddForm(true)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center text-xs text-slate-600 border-t border-slate-100 pt-3" id="cms-facets">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-450">Facet Filters:</span>
                  </div>

                  <select value={cmsCategoryFilter} onChange={(e) => setCmsCategoryFilter(e.target.value)} className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px] font-bold">
                    <option value="all">All Category Domains</option>
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="Front-End Development">Front-End Development</option>
                    <option value="Back-End Development">Back-End Development</option>
                    <option value="UI/UX Development">UI/UX Development</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Software Project Management">Software Project Management</option>
                  </select>

                  <select value={cmsDifficultyFilter} onChange={(e) => setCmsDifficultyFilter(e.target.value)} className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px] font-bold">
                    <option value="all">All Difficulties</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="advanced">Advanced</option>
                  </select>

                  <select value={cmsTypeFilter} onChange={(e) => setCmsTypeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px] font-bold">
                    <option value="all">All Types</option>
                    <option value="mcq">Single MCQ</option>
                    <option value="multiselect">Multi-select</option>
                    <option value="boolean">True/False</option>
                    <option value="fill_in_blank">Fill in Blank</option>
                    <option value="scenario">Scenario Case</option>
                    <option value="coding">Coding challenge</option>
                  </select>

                  <label className="flex items-center gap-1.5 ml-auto font-bold text-[11px] text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded text-indigo-650" />
                    <span>Show Archived Repository</span>
                  </label>
                </div>
              </div>

              {/* Bulk operations bar */}
              {selectedQuestionIds.length > 0 && (
                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex items-center justify-between text-xs animate-fadeIn" id="cms-bulk-actions">
                  <span className="font-bold text-indigo-800 font-mono">{selectedQuestionIds.length} items checked for bulk operation</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkUpdateDifficulty("senior")}
                      className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-750 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      Make Senior difficulty
                    </button>
                    <button
                      onClick={() => handleBulkUpdateDifficulty("advanced")}
                      className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-750 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      Make Advanced difficulty
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Selected</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CMS Repository List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="cms-repository-list-panel">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs" id="cms-index-table">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/40">
                        <th className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={filteredQuestionsList.length > 0 && selectedQuestionIds.length === filteredQuestionsList.length}
                            onChange={handleSelectAllQuestions}
                            className="rounded text-indigo-650"
                          />
                        </th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Title / Category</th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Tech stack</th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Complexity</th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Points / Time</th>
                        <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right">Repository Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredQuestionsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            No challenges match active filters in repository database.
                          </td>
                        </tr>
                      ) : (
                        filteredQuestionsList.map(q => {
                          const isChecked = selectedQuestionIds.includes(q.id);
                          const isArchived = (q as any).archived === true;
                          return (
                            <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSelectQuestion(q.id)}
                                  className="rounded text-indigo-650"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <div>
                                  <span className="font-bold text-slate-900 block leading-snug">{q.title}</span>
                                  <span className="text-[10px] text-indigo-650 font-semibold">{q.category}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {q.technologyStack.map(t => (
                                    <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-650 font-bold font-mono text-[9px] rounded">{t}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  <span className="capitalize font-mono font-bold text-indigo-700 block text-[10px]">{q.difficulty}</span>
                                  <span className="uppercase font-mono text-[9px] text-slate-400 block font-semibold">{q.type}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-mono text-[10px] text-slate-700 font-semibold">
                                  <span className="block font-bold text-slate-900">{q.weightage} Points</span>
                                  <span className="block text-[9px] text-slate-400 font-medium">{q.timeAllocation} seconds</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleToggleArchiveQuestion(q.id, isArchived)}
                                    className={`p-1.5 rounded-lg border cursor-pointer transition ${isArchived ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                                    title={isArchived ? "Restore to Active Question Pool" : "Archive challenge"}
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateQuestion(q.id)}
                                    className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-750 hover:bg-indigo-100 cursor-pointer transition"
                                    title="Duplicate question"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-750 hover:bg-rose-100 cursor-pointer transition"
                                    title="Permanently remove"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================== CREATE / EDIT USER MODAL ==================== */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="user-modal-root">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4" id="user-modal-card">
            
            <div className="bg-slate-950 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wide">
                  {editingUser ? `Modify Account Settings: ${editingUser.fullName}` : "Create Candidate or Recruiter Account"}
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs" id="user-modal-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={userFormName}
                    onChange={(e) => setUserFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. elena@company.com"
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Platform Role</label>
                  <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-xl" id="role-select-box">
                    <label className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="modal-role"
                        checked={userFormRole === UserRole.RECRUITER}
                        onChange={() => {
                          setUserFormRole(UserRole.RECRUITER);
                          setUserFormPermissionGroup(permissionGroups.find(g => g.targetRole === "RECRUITER")?.id || "");
                        }}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>RECRUITER (Organizational Buyer)</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="modal-role"
                        checked={userFormRole === UserRole.CANDIDATE}
                        onChange={() => {
                          setUserFormRole(UserRole.CANDIDATE);
                          setUserFormPermissionGroup(permissionGroups.find(g => g.targetRole === "CANDIDATE")?.id || "");
                        }}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>CANDIDATE (Assessment Taker)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* RECRUITER SPECIFICS */}
              {userFormRole === UserRole.RECRUITER && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3" id="recruiter-details-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                      <input
                        type="text"
                        placeholder="Vortex Tech Labs"
                        value={userFormCompany}
                        onChange={(e) => setUserFormCompany(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">SaaS Subscribing Plan</label>
                      <select
                        value={userFormSubPlan}
                        onChange={(e) => setUserFormSubPlan(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                      >
                        <option value="basic">Basic (Limited quota)</option>
                        <option value="professional">Professional (Team quota)</option>
                        <option value="enterprise">Enterprise (SLA scale)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Corporate Department / Group</label>
                    <input
                      type="text"
                      placeholder="e.g. Talent Acquisition"
                      value={userFormDepartment}
                      onChange={(e) => setUserFormDepartment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* CANDIDATE SPECIFICS */}
              {userFormRole === UserRole.CANDIDATE && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3" id="candidate-details-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Location / Timezone</label>
                      <input
                        type="text"
                        placeholder="New York, NY"
                        value={userFormLocation}
                        onChange={(e) => setUserFormLocation(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 987-6543"
                        value={userFormContact}
                        onChange={(e) => setUserFormContact(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target/Current Professional Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Backend Dev"
                        value={userFormCurrentRole}
                        onChange={(e) => setUserFormCurrentRole(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Years experience</label>
                      <input
                        type="number"
                        min="0"
                        value={userFormYearsOfExp}
                        onChange={(e) => setUserFormYearsOfExp(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Set assigned custom permission group */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Custom Permission Group</label>
                <select
                  value={userFormPermissionGroup}
                  onChange={(e) => setUserFormPermissionGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none font-bold"
                >
                  <option value="">-- Standard Heuristic Inherited --</option>
                  {permissionGroups
                    .filter(g => g.targetRole === (userFormRole === UserRole.RECRUITER ? "RECRUITER" : "CANDIDATE"))
                    .map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
              </div>

              {/* Multi-Factor Authentication */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between" id="mfa-toggle-row">
                <div>
                  <span className="block font-bold text-slate-800">Secure Two-Factor Authentication (2FA / MFA)</span>
                  <span className="block text-[10px] text-slate-400">Require secure TOTP authenticators during portal credentials validation</span>
                </div>
                <input
                  type="checkbox"
                  checked={userFormMfaEnabled}
                  onChange={(e) => setUserFormMfaEnabled(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-650 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  {loading ? "Processing..." : "Confirm Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
