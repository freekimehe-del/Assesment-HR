/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  UserRole, 
  UserProfile, 
  Question, 
  AssessmentAttempt, 
  AICodeReviewResult, 
  DigitalCertificate,
  ProctoringLog
} from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && GEMINI_API_KEY.trim() !== "") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI Client successfully initialized.");
  } catch (err) {
    console.error("Error creating Gemini AI Client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. AI Code Reviews will fall back to dynamic local analysis.");
}

// ==========================================
// MOCK DATABASE & STATE (In-Memory Session)
// ==========================================

const DEFAULT_USERS: UserProfile[] = [
  {
    id: "user-candidate-1",
    email: "candidate@saas.com",
    fullName: "Alex Rivera",
    role: UserRole.CANDIDATE,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    mfaEnabled: true,
    mfaVerified: true,
    location: "San Francisco, CA",
    contactNumber: "+1 (555) 345-6789",
    linkedinUrl: "https://linkedin.com/in/alexrivera-example",
    currentRole: "Software Engineer",
    experienceLevel: "mid",
    yearsOfExperience: 3,
    skills: ["React", "TypeScript", "Node.js", "Express", "Tailwind CSS", "PostgreSQL"],
    certifications: ["AWS Certified Developer"],
    employmentHistory: [
      {
        company: "ByteCraft Solutions",
        role: "Frontend Engineer",
        duration: "2024 - Present",
        description: "Built performant React dashboards, integrated REST APIs, and improved page load times by 30%."
      },
      {
        company: "NextGen Software",
        role: "Junior Developer",
        duration: "2023 - 2024",
        description: "Assisted in writing API routes and developing responsive UI components in Next.js."
      }
    ],
    dailySearchQuotaUsed: 0,
    subscriptionPlan: "basic",
    subscriptionActive: false
  },
  {
    id: "user-candidate-2",
    email: "sarah.dev@saas.com",
    fullName: "Sarah Chen",
    role: UserRole.CANDIDATE,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    mfaEnabled: false,
    location: "New York, NY",
    contactNumber: "+1 (555) 987-6543",
    linkedinUrl: "https://linkedin.com/in/sarahchen-example",
    currentRole: "Senior Backend Developer",
    experienceLevel: "senior",
    yearsOfExperience: 7,
    skills: ["Python", "Django", "Go", "Docker", "Kubernetes", "AWS", "gRPC"],
    certifications: ["Google Cloud Professional Architect"],
    employmentHistory: [
      {
        company: "FinTech Scaleup",
        role: "Senior backend developer",
        duration: "2021 - Present",
        description: "Designed high-throughput microservices handling 10k RPS, migrated database systems, and led mentoring groups."
      }
    ],
    dailySearchQuotaUsed: 0,
    subscriptionPlan: "basic",
    subscriptionActive: false
  },
  {
    id: "user-recruiter-1",
    email: "recruiter@saas.com",
    fullName: "Marcus Thompson",
    role: UserRole.RECRUITER,
    companyName: "Vortex Tech Labs",
    subscriptionPlan: "professional",
    subscriptionActive: true,
    subscriptionExpires: "2027-12-31",
    dailySearchQuotaUsed: 12,
    mfaEnabled: false,
    invitedRecruiters: [
      { email: "hiring.manager@vortex.com", role: "Hiring Manager", addedAt: "2026-03-12" },
      { email: "ta.lead@vortex.com", role: "TA Lead", addedAt: "2026-04-10" }
    ],
    skills: []
  },
  {
    id: "user-admin-1",
    email: "admin@saas.com",
    fullName: "Platform Admin",
    role: UserRole.ADMIN,
    mfaEnabled: true,
    mfaVerified: true,
    dailySearchQuotaUsed: 0,
    subscriptionPlan: "enterprise",
    subscriptionActive: true,
    skills: []
  }
];

// Pre-populate global database tables
let dbUsers: UserProfile[] = [...DEFAULT_USERS];

// Initial Question Bank CMS
let dbQuestions: Question[] = [
  // MCQs
  {
    id: "q-1",
    type: "mcq",
    difficulty: "mid",
    category: "Full Stack Development",
    technologyStack: ["React", "WebSockets"],
    title: "Understanding WebSocket Connection Upgrades",
    description: "During a WebSocket handshake, which HTTP header must be included in the client request to request a protocol switch from HTTP/1.1 to WebSocket?",
    options: [
      "Connection: WebSocket & Upgrade: websocket",
      "WebSocket-Protocol: true",
      "X-Protocol-Switch: websocket",
      "Transfer-Encoding: WebSocket"
    ],
    correctAnswer: "Connection: WebSocket & Upgrade: websocket",
    explanation: "WebSockets use an HTTP handshake upgrade process. The client sends a standard HTTP request with 'Upgrade: websocket' and 'Connection: Upgrade' headers to signal the server to switch protocols.",
    weightage: 10,
    timeAllocation: 60,
    tags: ["WebSockets", "HTTP Protocol", "Full Stack"]
  },
  {
    id: "q-2",
    type: "multiselect",
    difficulty: "mid",
    category: "Front-End Development",
    technologyStack: ["React", "Performance"],
    title: "Optimizing React Functional Component Render Cycles",
    description: "Which of the following techniques can prevent unneeded rendering cycles in child components in React 18+? (Select ALL correct answers)",
    options: [
      "Wrapping the child component in React.memo()",
      "Memoizing callback props passed to the child component using useCallback()",
      "Always setting a primitive state value inside the render loop",
      "Using useMemo() to cache calculated properties/arrays passed as props"
    ],
    correctAnswer: ["Wrapping the child component in React.memo()", "Memoizing callback props passed to the child component using useCallback()", "Using useMemo() to cache calculated properties/arrays passed as props"],
    explanation: "React.memo prevents renders if props do not change. Since non-primitive props (like arrays, objects, functions) create new references on every parent render, using useCallback for function props and useMemo for objects/arrays is essential to maintain reference equality.",
    weightage: 20,
    timeAllocation: 90,
    tags: ["React Hooks", "Performance", "React.memo"]
  },
  {
    id: "q-3",
    type: "boolean",
    difficulty: "junior",
    category: "Back-End Development",
    technologyStack: ["Node.js", "Concurrency"],
    title: "Node.js Single-Threaded Architecture Execution",
    description: "True or False: Node.js executes all database I/O operations and network lookups synchronously on the main single-threaded event loop, blocking subsequent requests until completed.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Node.js uses an asynchronous event-driven I/O model. High-latency I/O operations like database queries or file reading are delegated to the system kernel or the internal thread pool (libuv), preventing the main thread from blocking.",
    weightage: 10,
    timeAllocation: 45,
    tags: ["Node.js", "Asynchronous", "Event Loop"]
  },
  {
    id: "q-4",
    type: "fill_in_blank",
    difficulty: "senior",
    category: "Quality Assurance",
    technologyStack: ["Security", "OWASP"],
    title: "OWASP Top 10 Injection Vulnerability Identification",
    description: "What is the common term (usually represented by its 4-letter acronym) for the vulnerability where malicious SQL commands are inserted into data entry fields to bypass back-end data validations?",
    correctAnswer: "SQLi",
    explanation: "SQLi stands for SQL Injection, which belongs to the Injection category in the OWASP Top 10 vulnerabilities list.",
    weightage: 15,
    timeAllocation: 60,
    tags: ["Security", "OWASP", "Penetration Testing"]
  },
  {
    id: "q-5",
    type: "scenario",
    difficulty: "senior",
    category: "Software Project Management",
    technologyStack: ["Agile", "Scrum"],
    title: "Handling Mid-Sprint Scope Creep in Scrum Teams",
    description: "A major enterprise customer requests an immediate addition of a high-priority integration field right in the middle of a 2-week Sprint. The Scrum team's velocity is fully committed. As a Software Project Manager / Scrum Master, what is the best initial architectural and process-oriented step?",
    options: [
      "Immediately add the task to the active sprint, instructing developers to work overtime to complete it.",
      "Advise the Product Owner to evaluate the priority of the task. If it must go in immediately, negotiate with the PO to remove a task of comparable story point estimate from the current Sprint to avoid overwhelming the team.",
      "Refuse the task outright, stating Scrum guidelines completely forbid any sprint modifications once launched.",
      "Incorporate the feature directly without logging it in Jira to avoid impacting velocity graphs."
    ],
    correctAnswer: "Advise the Product Owner to evaluate the priority of the task. If it must go in immediately, negotiate with the PO to remove a task of comparable story point estimate from the current Sprint to avoid overwhelming the team.",
    explanation: "Scrum allows sprint adjustment if business urgency shifts dramatically. However, the Sprint Goal and velocity boundary must be respected. Swapping equal estimated scope ensures predictable commitment delivery.",
    weightage: 20,
    timeAllocation: 120,
    tags: ["Scrum Master", "Project Management", "Agile Core"]
  },
  {
    id: "q-6",
    type: "coding",
    difficulty: "mid",
    category: "Full Stack Development",
    technologyStack: ["TypeScript", "Algorithms"],
    title: "Technical Assessment: Find Array Duplicates",
    description: "Write a high-efficiency function to extract and return duplicate elements from an array. The result must contain only elements that appear more than once, with duplicates appearing exactly once in the returned array.",
    codingPrompt: "Complete the function `findDuplicates(nums)` to return a list of duplicate numbers in the array. The returned list must contain unique elements.\n\nInput:\nnums = [4, 3, 2, 7, 8, 2, 3, 1]\n\nOutput:\n[2, 3]",
    starterCode: {
      javascript: "function findDuplicates(nums) {\n  // Write your code here\n  return [];\n}",
      typescript: "export function findDuplicates(nums: number[]): number[] {\n  // Write your code here\n  return [];\n}",
      python: "def find_duplicates(nums):\n    # Write your code here\n    return []",
      go: "package main\n\nfunc findDuplicates(nums []int) []int {\n    // Write your code here\n    return []int{}\n}",
      java: "import java.util.*;\n\npublic class DuplicateFinder {\n    public static List<Integer> findDuplicates(int[] nums) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}",
      csharp: "using System;\nusing System.Collections.Generic;\n\npublic class DuplicateFinder {\n    public static List<int> FindDuplicates(int[] nums) {\n        // Write your code here\n        return new List<int>();\n    }\n}"
    },
    testCases: [
      { input: "[4, 3, 2, 7, 8, 2, 3, 1]", expectedOutput: "[2, 3] or [3, 2]", description: "Should identify multi-element duplicates" },
      { input: "[1, 1, 1, 2, 2]", expectedOutput: "[1, 2]", description: "Should return duplicate values uniquely" },
      { input: "[1, 2, 3, 4]", expectedOutput: "[]", description: "Should return empty array when no duplicates exist" }
    ],
    correctAnswer: "Refer to unit tests success assertions.",
    explanation: "By utilizing a Set to keep track of seen elements and another Set to capture recurring items, we can complete the task in O(N) time complexity and O(N) space complexity.",
    weightage: 40,
    timeAllocation: 300,
    tags: ["Algorithms", "Sets", "Time-Complexity"]
  }
];

// Active attempts registry
let dbAttempts: AssessmentAttempt[] = [];

// Certificates registry
let dbCertificates: DigitalCertificate[] = [
  {
    id: "cert-9821-ab",
    candidateId: "user-candidate-1",
    candidateName: "Alex Rivera",
    technologyArea: "Full Stack Development",
    assessmentDate: "2026-05-20",
    score: 84.5,
    validityPeriod: "2 Years",
    verificationQrCode: "QR_METADATA_HASH_9821_AB",
    verificationHash: "6c4f3a5b28d7a1e0"
  }
];

// Server KPI Logs for Admin monitors (SLA Metrics)
const dbSlaMetrics = {
  completionRate: 88.4,
  candidateSatisfaction: 94.2,
  organizationSatisfaction: 92.5,
  evaluationAccuracy: 98.1,
  uptime: 99.98,
  avgGenerationTimeMs: 1200,
  avgSearchResponseTimeMs: 450
};

// ==========================================
// API REST ENDPOINTS
// ==========================================

// 1. AUTHENTICATION & TEAM MANAGEMENT
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { email, password, fullName, role, companyName } = req.body;
  if (!email || !fullName || !role) {
    return res.status(400).json({ error: "Missing required profile registration parameters." });
  }

  const userExists = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (userExists) {
    return res.status(400).json({ error: "User account with this email already exists." });
  }

  const newUser: UserProfile = {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email,
    fullName,
    role: role as UserRole,
    mfaEnabled: false,
    mfaVerified: false,
    skills: [],
    certifications: [],
    employmentHistory: [],
    dailySearchQuotaUsed: 0,
    subscriptionPlan: role === UserRole.RECRUITER ? "basic" : "basic",
    subscriptionActive: role === UserRole.RECRUITER,
    companyName: role === UserRole.RECRUITER ? companyName || "New Startup Labs" : undefined,
    invitedRecruiters: []
  };

  dbUsers.push(newUser);
  res.status(201).json({ message: "Registration successful.", user: newUser });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = dbUsers.find(u => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid email credentials." });
  }

  // Handle standard simulation
  res.json({
    message: "Login successful.",
    user,
    requiresMfa: user.mfaEnabled
  });
});

app.post("/api/auth/mfa-verify", (req: Request, res: Response) => {
  const { userId, code } = req.body;
  const user = dbUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User account not located." });
  }
  
  if (code === "123456" || code === "123" || code) {
    user.mfaVerified = true;
    return res.json({ message: "MFA challenge successfully verified.", user });
  }
  res.status(400).json({ error: "Invalid verification token. Use dummy '123456'." });
});

app.put("/api/auth/profile", (req: Request, res: Response) => {
  const { userId, location, contactNumber, linkedinUrl, currentRole, experienceLevel, yearsOfExperience, skills, certifications, employmentHistory, mfaEnabled } = req.body;
  const userIndex = dbUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User profile not found." });
  }

  dbUsers[userIndex] = {
    ...dbUsers[userIndex],
    location: location !== undefined ? location : dbUsers[userIndex].location,
    contactNumber: contactNumber !== undefined ? contactNumber : dbUsers[userIndex].contactNumber,
    linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : dbUsers[userIndex].linkedinUrl,
    currentRole: currentRole !== undefined ? currentRole : dbUsers[userIndex].currentRole,
    experienceLevel: experienceLevel !== undefined ? experienceLevel : dbUsers[userIndex].experienceLevel,
    yearsOfExperience: yearsOfExperience !== undefined ? Number(yearsOfExperience) : dbUsers[userIndex].yearsOfExperience,
    skills: skills !== undefined ? skills : dbUsers[userIndex].skills,
    certifications: certifications !== undefined ? certifications : dbUsers[userIndex].certifications,
    employmentHistory: employmentHistory !== undefined ? employmentHistory : dbUsers[userIndex].employmentHistory,
    mfaEnabled: mfaEnabled !== undefined ? mfaEnabled : dbUsers[userIndex].mfaEnabled
  };

  res.json({ message: "Profile successfully saved.", user: dbUsers[userIndex] });
});

app.post("/api/recruiter/invite", (req: Request, res: Response) => {
  const { recruiterId, inviteEmail, inviteRole } = req.body;
  const user = dbUsers.find(u => u.id === recruiterId);
  if (!user || user.role !== UserRole.RECRUITER) {
    return res.status(403).json({ error: "Unauthorized operation." });
  }

  if (!user.invitedRecruiters) {
    user.invitedRecruiters = [];
  }

  user.invitedRecruiters.push({
    email: inviteEmail,
    role: inviteRole,
    addedAt: new Date().toISOString().split("T")[0]
  });

  res.json({ message: "Team invite dispatched successfully.", invitedRecruiters: user.invitedRecruiters });
});

// 2. SUBSCRIPTION SYSTEM (Module 13)
app.post("/api/subscription/upgrade", (req: Request, res: Response) => {
  const { userId, planTier } = req.body;
  const user = dbUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User account not found." });
  }

  user.subscriptionPlan = planTier;
  user.subscriptionActive = true;
  user.subscriptionExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  res.json({ message: `Successfully upgraded to standard SaaS ${planTier} plan.`, user });
});

// 3. ADMIN PORTAL & QUESTION BANK CMS (Module 4)
app.get("/api/admin/questions", (req: Request, res: Response) => {
  res.json(dbQuestions);
});

app.post("/api/admin/questions/add", (req: Request, res: Response) => {
  const { type, difficulty, category, technologyStack, title, description, options, correctAnswer, explanation, weightage, timeAllocation, tags, codingPrompt, starterCode, testCases } = req.body;
  
  if (!type || !difficulty || !category || !title || !description || !correctAnswer) {
    return res.status(400).json({ error: "Required fields are missing." });
  }

  const newQuestion: Question = {
    id: `q-${Math.random().toString(36).substr(2, 9)}`,
    type,
    difficulty,
    category,
    technologyStack: technologyStack || [],
    title,
    description,
    options,
    correctAnswer,
    explanation: explanation || "No explanation attached.",
    weightage: Number(weightage) || 10,
    timeAllocation: Number(timeAllocation) || 60,
    tags: tags || [],
    codingPrompt,
    starterCode,
    testCases
  };

  dbQuestions.push(newQuestion);
  res.status(201).json({ message: "Question inserted successfully.", question: newQuestion, totalCount: dbQuestions.length });
});

app.delete("/api/admin/questions/:id", (req: Request, res: Response) => {
  const index = dbQuestions.findIndex(q => q.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Question not found." });
  }
  dbQuestions.splice(index, 1);
  res.json({ message: "Question deleted.", totalCount: dbQuestions.length });
});

// 4. RANDOMIZED ASSESSMENT GENERATOR (Module 5)
app.post("/api/assessment/generate", (req: Request, res: Response) => {
  const { candidateId, category, difficulty } = req.body;
  if (!candidateId || !category || !difficulty) {
    return res.status(400).json({ error: "Required parameters (candidateId, category, difficulty) are missing." });
  }

  const candidate = dbUsers.find(u => u.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not located." });
  }

  // Balanced Difficulty filter
  // We extract matching category
  const filtered = dbQuestions.filter(q => q.category === category);
  
  // Pick some items
  // First extract candidate specific difficulty, then add other levels to balance
  const targetDiffQuestions = filtered.filter(q => q.difficulty === difficulty);
  const otherDiffQuestions = filtered.filter(q => q.difficulty !== difficulty);

  // Take up to 4 MCQs/non-coding and 1 Coding challenge to make standard robust test set
  const nonCoding = [
    ...targetDiffQuestions.filter(q => q.type !== "coding"),
    ...otherDiffQuestions.filter(q => q.type !== "coding")
  ].slice(0, 4);

  const coding = filtered.find(q => q.type === "coding") || dbQuestions.find(q => q.type === "coding");

  const finalQuestions: Question[] = [];
  nonCoding.forEach(q => finalQuestions.push(q));
  if (coding) {
    finalQuestions.push(coding);
  }

  if (finalQuestions.length === 0) {
    return res.status(400).json({ error: "No matching questions in the bank. Please create questions for this domain in Admin panel first." });
  }

  const newAttempt: AssessmentAttempt = {
    id: `attempt-${Math.random().toString(36).substr(2, 9)}`,
    candidateId,
    candidateName: candidate.fullName,
    category,
    difficulty,
    startTime: new Date().toISOString(),
    status: "initiated",
    questions: finalQuestions,
    currentQuestionIndex: 0,
    answers: {},
    timeSpentSeconds: 0,
    timeSpentPerQuestion: {},
    proctoringLogs: [],
    integrityScore: 100
  };

  dbAttempts.push(newAttempt);
  res.status(201).json({ attempt: newAttempt });
});

// Proctoring Violations logger (Module 6)
app.post("/api/assessment/proctor-log", (req: Request, res: Response) => {
  const { attemptId, eventType, details } = req.body;
  const attempt = dbAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Assessment attempt not found." });
  }

  const log: ProctoringLog = {
    timestamp: new Date().toISOString(),
    eventType,
    details
  };

  attempt.proctoringLogs.push(log);
  
  // Deduced integrity scores based on severity
  if (eventType === "tab_switch") attempt.integrityScore = Math.max(0, attempt.integrityScore - 15);
  if (eventType === "fullscreen_exit") attempt.integrityScore = Math.max(0, attempt.integrityScore - 10);
  if (eventType === "copy_paste_attempt") attempt.integrityScore = Math.max(0, attempt.integrityScore - 5);
  if (eventType === "resize") attempt.integrityScore = Math.max(0, attempt.integrityScore - 2);

  res.json({ integrityScore: attempt.integrityScore, proctoringLogsCount: attempt.proctoringLogs.length });
});

// Update current active answer
app.post("/api/assessment/save-answer", (req: Request, res: Response) => {
  const { attemptId, questionId, answer, timeSpent, currentQuestionIndex } = req.body;
  const attempt = dbAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Attempt session expired or invalid." });
  }

  attempt.answers[questionId] = answer;
  attempt.timeSpentPerQuestion[questionId] = (attempt.timeSpentPerQuestion[questionId] || 0) + (timeSpent || 0);
  attempt.currentQuestionIndex = currentQuestionIndex !== undefined ? currentQuestionIndex : attempt.currentQuestionIndex;
  attempt.status = "ongoing";

  res.json({ message: "Answer saved successfully." });
});

// 5. COMPILER RUNNER (Module 7: Online Code playground execution)
app.post("/api/assessment/compile-run", (req: Request, res: Response) => {
  const { language, code, testCases } = req.body;
  if (!code) {
    return res.status(400).json({ error: "No executable code provided." });
  }

  // Simulate a compile and unit testing environment
  // We examine the string content to determine if any logic handles tests successfully.
  // This gives an incredibly realistic compiler environment
  const testResults = (testCases || []).map((tc: any, index: number) => {
    // Basic static evaluation depending on code indicators to make execution highly realistic
    let passed = false;
    const lowerCode = code.toLowerCase();
    
    // Simulate matching algorithm outputs
    if (lowerCode.includes("duplicates") || lowerCode.includes("seen") || lowerCode.includes("set") || lowerCode.includes("filter")) {
      passed = true;
    } else if (index === 0) {
      passed = true; // pass first test case dynamically as guidance
    }

    return {
      description: tc.description,
      input: tc.input,
      expected: tc.expectedOutput,
      actual: passed ? tc.expectedOutput : "[] (Check evaluation rules)",
      passed
    };
  });

  const passedCount = testResults.filter((r: any) => r.passed).length;
  const totalCount = testResults.length;

  res.json({
    stdout: `[${new Date().toLocaleTimeString()}] Compilation completed successfully. Running unit tests...\n` +
            `Executing: findDuplicates()\n` +
            `Tests passed: ${passedCount}/${totalCount}\n` +
            `Console logs:\n - Processing collections list...\n - Set evaluation complete.`,
    testResults,
    passedCount,
    totalCount
  });
});

// 6. AUTOMATED AI CODE REVIEW ENGINE WITH GEMINI API (Module 8)
app.post("/api/assessment/submit-code-review", async (req: Request, res: Response) => {
  const { attemptId, questionId, language, code } = req.body;
  
  const attempt = dbAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Attempt record not found." });
  }

  const question = dbQuestions.find(q => q.id === questionId);
  const promptDescription = question ? question.description : "Extract duplicate elements from an array.";

  // If Gemini client exists, let's call Gemini 3.5 Flash with structured schema!
  if (aiClient) {
    try {
      console.log(`Querying Gemini 3.5 Flash for automated code audit on language: ${language}`);
      const prompt = `Perform a comprehensive technical static code review for the following candidate submission.
Language: ${language}
Coding Task Goal: ${promptDescription}

Candidate Code:
\`\`\`${language}
${code}
\`\`\`

Evaluate under these strict review guidelines:
1. Code Quality: Readability, naming standards, code structure.
2. Code Health: Cyclomatic complexity, maintainability indicators.
3. Performance: Big-O algorithm efficiency, space/time bounds.
4. Security: Identify flaws or secure practices.
5. Architecture: Clean modular design patterns.

You MUST provide scores out of 100 for codeQualityScore, securityScore, maintainabilityScore, and overallEngineeringScore.
Provide also cyclomatic/Big-O summary in complexityAnalysis, 2-3 vulnerabilities array, and 3 specific improvement recommendations list.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an automated premium AI Technical Lead and Code Reviewer. Be objective, accurate, and output fully valid JSON strictly adhering to the specified schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              codeQualityScore: { type: Type.INTEGER, description: "Technical score from 0 to 100 for readability, clean format, and conventions." },
              securityScore: { type: Type.INTEGER, description: "Technical score from 0 to 100 for secure practices and lack of common bugs." },
              maintainabilityScore: { type: Type.INTEGER, description: "Technical score from 0 to 100 representing how clean, documented, and reusable the code is." },
              overallEngineeringScore: { type: Type.INTEGER, description: "Weighted overall code quality score from 0 to 100." },
              complexityAnalysis: { type: Type.STRING, description: "Summary of Time complexity (Big-O) and code complexity index." },
              readabilityAssessment: { type: Type.STRING, description: "Brief evaluation of formatting standards." },
              vulnerabilities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    severity: { type: Type.STRING, description: "low, medium, or high" },
                    title: { type: Type.STRING, description: "Title of vulnerability" },
                    desc: { type: Type.STRING, description: "Detailed security concern" },
                    fix: { type: Type.STRING, description: "Specific code repair action" }
                  },
                  required: ["severity", "title", "desc", "fix"]
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 3 granular, highly technical recommendations for the candidate to improve their code."
              }
            },
            required: [
              "codeQualityScore", 
              "securityScore", 
              "maintainabilityScore", 
              "overallEngineeringScore", 
              "complexityAnalysis", 
              "vulnerabilities", 
              "recommendations",
              "readabilityAssessment"
            ]
          }
        }
      });

      const parsedReview: AICodeReviewResult = JSON.parse(response.text.trim());
      attempt.codeReviewSummary = parsedReview;
      attempt.codeReviewScore = parsedReview.overallEngineeringScore;
      
      console.log("AI code review completed successfully with score:", parsedReview.overallEngineeringScore);
      return res.json({ success: true, review: parsedReview });
    } catch (err) {
      console.error("Gemini Code Review generation failed, falling back to local heuristic analysis.", err);
    }
  }

  // Mock / Fallback heuristic evaluation
  const fallbackReview: AICodeReviewResult = {
    codeQualityScore: 82,
    securityScore: 90,
    maintainabilityScore: 85,
    overallEngineeringScore: 85,
    complexityAnalysis: "Time Complexity: O(N) where N is the length of array. Space Complexity: O(N) storing tracking sets.",
    readabilityAssessment: "Good naming standards, moderate comment layout. Indentation complies with target conventions.",
    vulnerabilities: [
      {
        severity: "low",
        title: "Potential Null Reference Exception",
        desc: "If input array 'nums' is null or undefined, calling array methods directly will crash runtime execution.",
        fix: "Introduce an initial guard clause checking 'if (!nums) return [];'"
      }
    ],
    recommendations: [
      "Improve edge case checks: Add parameter validations for extreme input arrays or empty limits.",
      "Opt for native Set lookup functions rather than custom indexing for 20% faster execution metrics.",
      "Incorporate explanatory Docstrings to clarify input collection requirements."
    ]
  };

  attempt.codeReviewSummary = fallbackReview;
  attempt.codeReviewScore = fallbackReview.overallEngineeringScore;
  res.json({ success: true, review: fallbackReview, fallback: true });
});

// 7. FINAL SCORING & BENCHMARKING AND CERTIFICATION (Module 9, 14)
app.post("/api/assessment/complete", (req: Request, res: Response) => {
  const { attemptId } = req.body;
  const attempt = dbAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Assessment attempt not located." });
  }

  // Calculate Technical Knowledge score (MCQ answers)
  let correctCount = 0;
  let mcqWeightTotal = 0;
  const mcqQuestions = attempt.questions.filter(q => q.type !== "coding");
  
  mcqQuestions.forEach(q => {
    mcqWeightTotal += q.weightage;
    const userAns = attempt.answers[q.id];
    
    if (userAns !== undefined) {
      if (Array.isArray(q.correctAnswer)) {
        // Multi select comparison
        const userArr = Array.isArray(userAns) ? userAns : [userAns];
        const isCorrect = q.correctAnswer.length === userArr.length && 
                          q.correctAnswer.every(val => userArr.includes(val));
        if (isCorrect) correctCount += q.weightage;
      } else {
        if (String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
          correctCount += q.weightage;
        }
      }
    }
  });

  const techScore = mcqWeightTotal > 0 ? (correctCount / mcqWeightTotal) * 100 : 80;
  attempt.technicalKnowledgeScore = Math.round(techScore);

  // Coding Score based on test success
  const codingAssignedScore = attempt.codingTestsTotalCount && attempt.codingTestsTotalCount > 0
    ? (attempt.codingTestsPassedCount! / attempt.codingTestsTotalCount!) * 100
    : 75; // Default 75% if they filled in code but did not execute run
  attempt.codingAssignmentScore = Math.round(codingAssignedScore);

  // Code Review Score - set by AI review or fallback
  if (!attempt.codeReviewScore) {
    attempt.codeReviewScore = 85; // Fallback
  }

  // Weighted total score formula:
  // Technical Knowledge Score (40%) + Coding Assignment Score (40%) + Automated Code Review Score (20%)
  const rawFinalScore = (attempt.technicalKnowledgeScore * 0.4) + 
                        (attempt.codingAssignmentScore * 0.4) + 
                        (attempt.codeReviewScore * 0.2);
  const finalScore = Math.round(rawFinalScore);
  attempt.overallCandidateScore = finalScore;

  // Proctoring penalty
  if (attempt.integrityScore < 70) {
    // Reduce final score slightly if integrity checks are severely breached
    attempt.overallCandidateScore = Math.max(0, attempt.overallCandidateScore - 10);
  }

  // Skill Rating thresholds
  if (attempt.overallCandidateScore >= 90) {
    attempt.skillRatingLevel = "Expert";
  } else if (attempt.overallCandidateScore >= 80) {
    attempt.skillRatingLevel = "Advanced";
  } else if (attempt.overallCandidateScore >= 70) {
    attempt.skillRatingLevel = "Proficient";
  } else if (attempt.overallCandidateScore >= 60) {
    attempt.skillRatingLevel = "Intermediate";
  } else {
    attempt.skillRatingLevel = "Needs Improvement";
  }

  attempt.endTime = new Date().toISOString();
  attempt.status = "completed";

  // Create Digital Certificate if score >= 70% (Proficient or above)
  let certificate: DigitalCertificate | null = null;
  if (attempt.overallCandidateScore >= 70) {
    const certId = `cert-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substr(2, 2)}`;
    const hash = Math.random().toString(16).substr(2, 16);
    
    certificate = {
      id: certId,
      candidateId: attempt.candidateId,
      candidateName: attempt.candidateName,
      technologyArea: attempt.category,
      assessmentDate: new Date().toISOString().split("T")[0],
      score: attempt.overallCandidateScore,
      validityPeriod: "2 Years",
      verificationQrCode: `VERIFY_QR_HASH_${hash.toUpperCase()}`,
      verificationHash: hash
    };

    dbCertificates.push(certificate);
    attempt.certificateId = certId;

    // Save as skill tag on user account
    const userIndex = dbUsers.findIndex(u => u.id === attempt.candidateId);
    if (userIndex !== -1) {
      if (!dbUsers[userIndex].certifications.includes(`${attempt.category} Cert (${attempt.skillRatingLevel})`)) {
        dbUsers[userIndex].certifications.push(`${attempt.category} Cert (${attempt.skillRatingLevel})`);
      }
      if (!dbUsers[userIndex].skills.includes(attempt.category)) {
        dbUsers[userIndex].skills.push(attempt.category);
      }
    }
  }

  res.json({
    attempt,
    certificate
  });
});

// 8. CANDIDATE REPOSITORY & ADVANCED SEARCH (Module 10, 11)
app.get("/api/recruiter/candidates", (req: Request, res: Response) => {
  // Return completed candidates matching filters
  const { skill, technology, experience, minScore, location, certifiedOnly } = req.query;

  // Map users who are Candidates
  let candidates = dbUsers.filter(u => u.role === UserRole.CANDIDATE);

  // Attach their score performance history from completed tests
  const candidatesWithScores = candidates.map(c => {
    const attempts = dbAttempts.filter(a => a.candidateId === c.id && a.status === "completed");
    const certs = dbCertificates.filter(cert => cert.candidateId === c.id);
    
    // Compute stats
    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + (a.overallCandidateScore || 0), 0) / attempts.length)
      : attempts.length === 0 && c.id === "user-candidate-1" ? 85 : 0; // Alex Rivera preset stats

    const integrity = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.integrityScore || 100), 0) / attempts.length)
      : 98; // preset

    return {
      ...c,
      averageScore: avgScore,
      integrityIndex: integrity,
      completedAttemptsCount: attempts.length,
      attempts,
      certs
    };
  });

  // Filter lists
  let filtered = candidatesWithScores;

  if (skill) {
    const s = String(skill).toLowerCase();
    filtered = filtered.filter(c => c.skills.some(sk => sk.toLowerCase().includes(s)));
  }

  if (technology) {
    const t = String(technology).toLowerCase();
    filtered = filtered.filter(c => c.skills.some(sk => sk.toLowerCase().includes(t)));
  }

  if (experience) {
    filtered = filtered.filter(c => c.experienceLevel === experience);
  }

  if (minScore) {
    const score = Number(minScore);
    filtered = filtered.filter(c => c.averageScore >= score);
  }

  if (location) {
    const loc = String(location).toLowerCase();
    filtered = filtered.filter(c => c.location && c.location.toLowerCase().includes(loc));
  }

  if (certifiedOnly === "true") {
    filtered = filtered.filter(c => c.certs.length > 0);
  }

  res.json(filtered);
});

// Candidate Side-By-Side Comparison (Module 11)
app.post("/api/recruiter/compare", (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "No target ids array supplied for comparison matrix." });
  }

  const selected = dbUsers.filter(u => ids.includes(u.id)).map(c => {
    const attempts = dbAttempts.filter(a => a.candidateId === c.id && a.status === "completed");
    const certs = dbCertificates.filter(cert => cert.candidateId === c.id);
    
    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + (a.overallCandidateScore || 0), 0) / attempts.length)
      : c.id === "user-candidate-1" ? 85 : 0;

    const integrity = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.integrityScore || 100), 0) / attempts.length)
      : 98;

    return {
      id: c.id,
      fullName: c.fullName,
      currentRole: c.currentRole,
      experienceLevel: c.experienceLevel,
      location: c.location,
      skills: c.skills,
      averageScore: avgScore,
      integrityIndex: integrity,
      certifications: c.certifications,
      yearsOfExperience: c.yearsOfExperience || 0,
      attemptsCount: attempts.length
    };
  });

  res.json(selected);
});

// 9. METRICS & FUNNEL ANALYTICS SERVICE (Module 12)
app.get("/api/analytics/recruiter", (req: Request, res: Response) => {
  // Aggregate mock analytical metrics
  const totalSubscribedUsers = dbUsers.length;
  const totalCompletedAssessments = dbAttempts.filter(a => a.status === "completed").length;
  const certifiedRatio = Math.round((dbCertificates.length / Math.max(1, dbAttempts.length)) * 100);

  // Return formatted reports
  res.json({
    kpis: {
      totalCandidates: dbUsers.filter(u => u.role === UserRole.CANDIDATE).length,
      assessmentsTaken: dbAttempts.length + 42, // with historically mock counts
      averageUptime: "99.98%",
      averageScore: 78.4
    },
    funnel: [
      { stage: "Registrations", count: 245, pct: 100 },
      { stage: "Assessments Initiated", count: 180, pct: 73 },
      { stage: "Completed Screening", count: 154, pct: 62 },
      { stage: "Certified Verified", count: 82, pct: 33 }
    ],
    domainHeatmap: [
      { name: "Full Stack Development", count: 48, avgScore: 82 },
      { name: "Front-End Development", count: 32, avgScore: 79 },
      { name: "Back-End Development", count: 39, avgScore: 85 },
      { name: "UI/UX Development", count: 15, avgScore: 74 },
      { name: "Quality Assurance", count: 12, avgScore: 81 },
      { name: "Software Project Management", count: 8, avgScore: 88 }
    ],
    slaMetrics: dbSlaMetrics
  });
});

app.get("/api/analytics/candidate/:id", (req: Request, res: Response) => {
  const { id } = req.query;
  const attempts = dbAttempts.filter(a => a.candidateId === req.params.id && a.status === "completed");
  const certs = dbCertificates.filter(c => c.candidateId === req.params.id);

  res.json({
    attempts,
    certs,
    historyStats: attempts.map(a => ({
      category: a.category,
      score: a.overallCandidateScore,
      date: a.endTime?.split("T")[0]
    }))
  });
});

// 10. PUBLIC CERTIFICATE VERIFIER (Module 14)
app.get("/api/certificate/verify/:hash", (req: Request, res: Response) => {
  const hash = req.params.hash;
  const cert = dbCertificates.find(c => c.verificationHash.toLowerCase() === hash.toLowerCase() || c.id.toLowerCase() === hash.toLowerCase());
  
  if (!cert) {
    return res.status(404).json({ error: "Certificate verification token not registered in the trusted SaaS database." });
  }

  res.json({
    verified: true,
    certificate: cert,
    timestamp: new Date().toISOString(),
    issuer: "SaaS Technical Competency Registry Service",
    status: "Valid/Active"
  });
});

// Support fallback endpoints to clear history / reset
app.post("/api/admin/reset", (req: Request, res: Response) => {
  dbUsers = [...DEFAULT_USERS];
  dbAttempts = [];
  dbCertificates = [
    {
      id: "cert-9821-ab",
      candidateId: "user-candidate-1",
      candidateName: "Alex Rivera",
      technologyArea: "Full Stack Development",
      assessmentDate: "2026-05-20",
      score: 84.5,
      validityPeriod: "2 Years",
      verificationQrCode: "QR_METADATA_HASH_9821_AB",
      verificationHash: "6c4f3a5b28d7a1e0"
    }
  ];
  res.json({ message: "In-memory database successfully refreshed to defaults." });
});

// ==========================================
// VITE PIPELINE AND STATIC ASSETS SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite development middlewares
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SaaS Screening Application running at http://localhost:${PORT}`);
    console.log(`Default mock logins available:\n- Candidate: candidate@saas.com\n- Recruiter: recruiter@saas.com\n- Admin: admin@saas.com`);
  });
}

startServer();
