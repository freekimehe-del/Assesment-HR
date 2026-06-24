/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, Question, QuestionType } from "../types";
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
  Check
} from "lucide-react";

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function AdminDashboard(props: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"cms" | "metrics">("cms");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for creating a new question
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

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions");
      const data = await res.json();
      if (res.ok) {
        setQuestions(data);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    // Package options for MCQ
    let options: string[] | undefined = undefined;
    if (type === "mcq" || type === "multiselect" || type === "scenario") {
      options = [optionA, optionB, optionC, optionD].filter(opt => opt.trim() !== "");
    } else if (type === "boolean") {
      options = ["True", "False"];
    }

    // Package starter codes & test cases for coding
    let starter: { [language: string]: string } | undefined = undefined;
    let tests: any[] | undefined = undefined;

    if (type === "coding") {
      starter = {
        javascript: starterCodeJs || "function solution() {\n  return null;\n}",
        python: starterCodePy || "def solution():\n    return None"
      };
      tests = [
        { input: testCase1Input || "[1,2]", expectedOutput: testCase1Expected || "[1,2]", description: "Verify base duplicate arrays" },
        { input: testCase2Input || "[]", expectedOutput: testCase2Expected || "[]", description: "Verify empty arrays boundaries" }
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
        setSuccessMsg("Question inserted successfully into CMS repository.");
        setQuestions(prev => [...prev, data.question]);
        // Reset inputs
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
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to insert question:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you certain you want to delete this question? This action is non-reversible.")) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const triggerResetDb = async () => {
    if (!confirm("Reset database state to original defaults? All candidate screening sessions and newly created questions will be wiped.")) return;
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        alert("In-memory database successfully refreshed to defaults.");
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative" id="admin-dashboard-root">
      
      {/* Navbar Banner */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center relative z-20" id="admin-nav">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">Platform Administrator</span>
            <span className="text-[10px] text-indigo-650 font-semibold uppercase tracking-wider">CMS & Core SLA Monitors</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={triggerResetDb}
            className="px-3 py-1.5 bg-white border border-amber-250 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Reset DB State
          </button>
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

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-grid">
        {/* Left Side Tab trigger list */}
        <aside className="lg:col-span-3 space-y-4" id="admin-aside">
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 space-y-1 shadow-xs">
            <button
              onClick={() => setActiveTab("cms")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "cms" ? "bg-indigo-50 text-indigo-700 font-bold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              id="admin-tab-cms"
            >
              <FileCode className={`w-4 h-4 ${activeTab === "cms" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>Question Bank CMS</span>
              <span className="ml-auto px-1.5 py-0.5 bg-indigo-600 text-white font-mono text-[9px] font-bold rounded-md leading-none">
                {questions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "metrics" ? "bg-indigo-50 text-indigo-700 font-bold shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              id="admin-tab-metrics"
            >
              <Activity className={`w-4 h-4 ${activeTab === "metrics" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>Platform SLA Metrics</span>
            </button>
          </div>
        </aside>

        {/* Right side Panel container */}
        <main className="lg:col-span-9" id="admin-main">
          
          {/* QUESTION BANK CMS TAB */}
          {activeTab === "cms" && (
            <div className="space-y-4" id="cms-tab-panel">
              {/* Add Question panel form */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="add-question-panel">
                <div className="flex items-center gap-2 mb-3.5 border-b border-slate-150 pb-2.5">
                  <Plus className="w-4.5 h-4.5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Insert Question to CMS</h2>
                </div>

                {successMsg && (
                  <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-lg text-xs mb-4 font-semibold">
                    ✓ {successMsg}
                  </div>
                )}

                <form onSubmit={handleAddQuestion} className="space-y-3.5 text-xs" id="cms-form">
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

                  {/* MCQ specific inputs */}
                  {(type === "mcq" || type === "multiselect" || type === "scenario") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl" id="mcq-options-inputs">
                      <div>
                        <input
                          type="text"
                          placeholder="Option A (required)"
                          required
                          value={optionA}
                          onChange={(e) => setOptionA(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Option B (required)"
                          required
                          value={optionB}
                          onChange={(e) => setOptionB(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Option C"
                          value={optionC}
                          onChange={(e) => setOptionC(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Option D"
                          value={optionD}
                          onChange={(e) => setOptionD(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-900 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Coding specific inputs */}
                  {type === "coding" && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5" id="coding-cms-inputs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Coding specifications prompt (guidance)</label>
                        <textarea
                          placeholder="Describe instructions for compiler testing..."
                          value={codingPrompt}
                          onChange={(e) => setCodingPrompt(e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500 resize-none"
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-mono font-semibold mb-0.5">JS Starter Code</label>
                          <textarea
                            placeholder="function solution() {\n  return null;\n}"
                            value={starterCodeJs}
                            onChange={(e) => setStarterCodeJs(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-900 focus:border-indigo-500"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-mono font-semibold mb-0.5">Python Starter Code</label>
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
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Correct Answer</label>
                      <input
                        type="text"
                        required
                        placeholder={type === "multiselect" ? "A, B (comma-separated)" : "Option text or True/False"}
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Score Weightage (Points)</label>
                      <input
                        type="number"
                        min="1"
                        value={weightage}
                        onChange={(e) => setWeightage(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Time Allocated (seconds)</label>
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
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Option explanation (visible after grading)</label>
                    <textarea
                      placeholder="Explain why correct answer applies..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-indigo-500 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    {loading ? "Saving to Cloud database nodes..." : "Incorporate Question"}
                  </button>
                </form>
              </div>

              {/* Active list table */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="cms-list-panel">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Question Bank Index ({questions.length})</span>
                </h3>

                <div className="overflow-x-auto" id="cms-table-wrapper">
                  <table className="w-full text-left border-collapse text-xs" id="cms-table">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Category / Technology</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Title</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Difficulty</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Type</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px]">Points</th>
                        <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {questions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3.5">
                            <span className="font-bold text-slate-900 block leading-snug">{q.category}</span>
                            <span className="text-[9px] text-slate-500 font-mono font-medium">{q.technologyStack.join(", ") || "Generic"}</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700 max-w-xs truncate">{q.title}</td>
                          <td className="py-2.5 px-3.5 capitalize font-mono text-indigo-600 font-bold">{q.difficulty}</td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-500 uppercase text-[10px]">{q.type}</td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-700 font-bold">{q.weightage}</td>
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PLATFORM METRICS TAB */}
          {activeTab === "metrics" && (
            <div className="space-y-4" id="metrics-tab-panel">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="sla-grid">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Container SLA Uptime</span>
                  </div>
                  <span className="text-xl font-mono font-bold text-emerald-700">99.98%</span>
                  <p className="text-[10px] text-slate-500 leading-none">Target metrics: 99.90%</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Average Test Gen Speed</span>
                  </div>
                  <span className="text-xl font-mono font-bold text-slate-900">1.2 seconds</span>
                  <p className="text-[10px] text-slate-500 leading-none">Target latency limit: &lt;5s</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Average Search Speed</span>
                  </div>
                  <span className="text-xl font-mono font-bold text-slate-900">450ms</span>
                  <p className="text-[10px] text-slate-500 leading-none">Target latency limit: &lt;3s</p>
                </div>
              </div>

              {/* Server health monitors logs */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="container-health-card">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-indigo-650 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900">Active Kubernetes Container Health Logs</span>
                </div>
                
                <div className="space-y-1.5 font-mono text-[10px] text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-xl max-h-64 overflow-y-auto shadow-2xs" id="logs-terminal">
                  <div>[2026-06-23 16:14:02] INFO: Booting custom fullstack Express server...</div>
                  <div>[2026-06-23 16:14:03] INFO: Loading environmental variables. Loading key...</div>
                  <div>[2026-06-23 16:14:04] SUCCESS: Gemini 3.5-flash AI reviewer initialized. Telemetry header 'aistudio-build' active.</div>
                  <div>[2026-06-23 16:14:05] SUCCESS: Server listening on Port 3000, Host 0.0.0.0.</div>
                  <div>[2026-06-23 16:14:12] INFO: In-memory dbTables successfully initialized with defaults records.</div>
                  <div>[2026-06-23 16:14:20] INFO: SLA Performance levels verified. Health Status: Healthy.</div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
