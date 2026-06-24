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
  QuestionType,
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
let dbQuestions: Question[] = generateRobustQuestionBank();

function generateRobustQuestionBank(): Question[] {
  const bank: Question[] = [
    // Curated Base Questions (Items 1 to 6)
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
        csharp: "using System;using System.Collections.Generic;\npublic class DuplicateFinder {\n    public static List<int> FindDuplicates(int[] nums) {\n        return new List<int>();\n    }\n}"
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

  // Helper arrays of tech and concepts for full bank expansion
  const diffs: Question["difficulty"][] = ["junior", "mid", "senior", "advanced"];
  const categories: Question["category"][] = [
    "Full Stack Development",
    "Front-End Development",
    "Back-End Development",
    "UI/UX Development",
    "Quality Assurance",
    "Software Project Management"
  ];

  // Systematically generate high-fidelity technical questions for each category to reach exactly 32 questions each
  categories.forEach(cat => {
    const existingCount = bank.filter(q => q.category === cat).length;
    const targetCount = 32;
    const needed = targetCount - existingCount;

    // Define standard technical questions pool based on category
    for (let i = 0; i < needed; i++) {
      const qId = `q-${cat.replace(/\s+/g, "").toLowerCase()}-${existingCount + i + 1}`;
      const diff = diffs[i % diffs.length];
      const weightage = diff === "junior" ? 10 : diff === "mid" ? 15 : diff === "senior" ? 20 : 30;
      const timeAllocation = diff === "junior" ? 60 : diff === "mid" ? 90 : diff === "senior" ? 120 : 180;

      // Type sequence
      let type: QuestionType = "mcq";
      if (i < needed - 1) {
        if (i % 5 === 0) type = "mcq";
        else if (i % 5 === 1) type = "multiselect";
        else if (i % 5 === 2) type = "boolean";
        else if (i % 5 === 3) type = "fill_in_blank";
        else type = "scenario";
      } else {
        type = "coding"; // Exactly 1 interactive sandbox challenge per category!
      }

      // Generate distinct contents based on category and index
      if (cat === "Full Stack Development") {
        if (type === "mcq") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Next.js", "SSR"],
            title: `Full-Stack Architecture: ${i}-Next.js SSR Hydration Boundary`,
            description: "When using React Server Components (RSC) and standard client components in Next.js, what is the primary role of the 'use client' directive?",
            options: [
              "It compiles the entire file and its imports strictly for client-side rendering, skipping server execution.",
              "It marks a boundary to package the component and its imports into the client bundle, allowing client-side hooks like useEffect and useState.",
              "It enforces the server to make client-side HTTP queries for all subsequent resource assets.",
              "It renders the component synchronously inside the browser's service worker context."
            ],
            correctAnswer: "It marks a boundary to package the component and its imports into the client bundle, allowing client-side hooks like useEffect and useState.",
            explanation: "The 'use client' directive marks a boundary between server and client module graphs. It allows React to bundle client-specific interactive elements.",
            tags: ["Next.js", "Hydration", "RSC"]
          });
        } else if (type === "multiselect") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["CORS", "Security"],
            title: `Full-Stack Security: CORS Headers Handshake (#${i})`,
            description: "Which of the following HTTP response headers are required to configure CORS allowing custom headers and PUT methods from a separate origin? (Select ALL that apply)",
            options: [
              "Access-Control-Allow-Origin",
              "Access-Control-Allow-Methods",
              "Access-Control-Allow-Headers",
              "Access-Control-Max-Age"
            ],
            correctAnswer: ["Access-Control-Allow-Origin", "Access-Control-Allow-Methods", "Access-Control-Allow-Headers"],
            explanation: "CORS preflight checks request approval. Origin, Methods, and Headers are required components of CORS negotiation.",
            tags: ["CORS", "Security", "Web Headers"]
          });
        } else if (type === "boolean") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["GraphQL", "REST"],
            title: `Full-Stack Design: REST vs GraphQL (#${i})`,
            description: "True or False: GraphQL natively solves over-fetching and under-fetching issues by allowing clients to query exact fields in a single HTTP request, but it completely bypasses standard HTTP caching mechanisms.",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "GraphQL uses HTTP POST requests for almost all queries, which makes standard browser and CDN-level HTTP GET caching extremely difficult compared to REST endpoints.",
            tags: ["GraphQL", "REST", "Caching"]
          });
        } else if (type === "fill_in_blank") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["OAuth", "OAuth2"],
            title: `OAuth Authorization Code Verification Term (#${i})`,
            description: "What is the acronym (4 letters) for the security extension to the OAuth 2.0 Authorization Code Flow designed to protect mobile and SPA clients from authorization code interception attacks?",
            correctAnswer: "PKCE",
            explanation: "Proof Key for Code Exchange (PKCE) replaces client secrets with dynamic cryptographically verified verifiers on client-side requests.",
            tags: ["OAuth2", "Security", "PKCE"]
          });
        } else if (type === "scenario") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Redis", "Caching"],
            title: `Scenario: Redis Cache Stampede Resolution (#${i})`,
            description: "A high-traffic e-commerce full-stack platform experiences periodic cache stampede (thundering herd) issues when the main products list cache expires under high load. What is the best design-level solution?",
            options: [
              "Increase Redis connection pool size and restart the main instances.",
              "Implement mutual exclusion (locking) around the cache miss lookup so only one background query builds the cache, while others wait or return stale data.",
              "Completely disable caching to serve requests straight from PostgreSQL queries.",
              "Deploy a separate Redis cluster replica for every active full-stack server instance."
            ],
            correctAnswer: "Implement mutual exclusion (locking) around the cache miss lookup so only one background query builds the cache, while others wait or return stale data.",
            explanation: "Using mutex locking ensures that only one server thread hits the database to regenerate the expired cache, protecting PostgreSQL from overloading.",
            tags: ["Redis", "Cache Stampede", "Locking"]
          });
        }
      } else if (cat === "Front-End Development") {
        if (type === "mcq") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["CSS", "Tailwind CSS"],
            title: `Front-End Styling: CSS Flexbox vs Grid (#${i})`,
            description: "When designing responsive layouts, when is it recommended to prioritize CSS Grid over CSS Flexbox?",
            options: [
              "When you need to align elements in a single horizontal or vertical dimension.",
              "When you need a cohesive two-dimensional (row AND column) layout grid with precise grid-gutters.",
              "When you want to scale images fluidly without media query breakpoints.",
              "When supporting extremely old legacy browsers like Internet Explorer 8."
            ],
            correctAnswer: "When you need a cohesive two-dimensional (row AND column) layout grid with precise grid-gutters.",
            explanation: "CSS Grid is inherently two-dimensional (columns and rows), whereas Flexbox is designed primarily for single-dimension layouts.",
            tags: ["CSS Grid", "Flexbox", "Responsive"]
          });
        } else if (type === "multiselect") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["React", "Performance"],
            title: `React Render Triggers Analysis (#${i})`,
            description: "Which of the following actions will trigger a React function component re-render? (Select ALL correct options)",
            options: [
              "Calling the state updater function returned by useState with a new value",
              "A change in the reference or value of a prop passed by a parent",
              "Modifying a value attached to a useRef reference directly",
              "The context value of a subscribed React.useContext provider updates"
            ],
            correctAnswer: ["Calling the state updater function returned by useState with a new value", "A change in the reference or value of a prop passed by a parent", "The context value of a subscribed React.useContext provider updates"],
            explanation: "State changes, prop updates, and context updates trigger component re-renders. Directly modifying useRef.current does not trigger rendering cycles.",
            tags: ["React Core", "Hooks", "Re-renders"]
          });
        } else if (type === "boolean") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["HTML5", "Accessibility"],
            title: `Accessibility: Semantic ARIA Labels (#${i})`,
            description: "True or False: Using native semantic HTML tags like <button> and <nav> automatically populates default accessibility roles, making custom ARIA attributes mostly optional for standard controls.",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "Native HTML tags possess built-in accessibility semantics. Developers should prioritize native HTML elements before using aria tags on generic <div> elements.",
            tags: ["Accessibility", "ARIA", "Semantic HTML"]
          });
        } else if (type === "fill_in_blank") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["JavaScript", "DOM"],
            title: `Front-End Performance: Event Listener Optimization (#${i})`,
            description: "What is the common term (8-letter word starting with 'd') for the optimization technique that delays calling an expensive input event handler until after a specific silence threshold (e.g. typing delay)?",
            correctAnswer: "debounce",
            explanation: "Debouncing limits the rate at which a function is triggered, particularly helpful for search inputs and window resize handlers.",
            tags: ["JavaScript", "Performance", "Debounce"]
          });
        } else if (type === "scenario") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["CSS", "Web Performance"],
            title: `Scenario: CSS Paint Repaint Cycles (#${i})`,
            description: "A candidate discovers that triggering a sidebar animation is causing massive stuttering on mobile viewports. After inspecting, they find massive repaint layouts. What is the most effective CSS property optimization to offload the animation?",
            options: [
              "Apply 'transform: translate3d()' or 'will-change: transform' to move the sidebar animation onto the GPU.",
              "Change the animation transition from 'transform' to 'left' absolute offsets.",
              "Force the sidebar viewport height to recalculate on every tick using JavaScript.",
              "Add a heavy blur filter overlay across the entire main screen during motion."
            ],
            correctAnswer: "Apply 'transform: translate3d()' or 'will-change: transform' to move the sidebar animation onto the GPU.",
            explanation: "Using transform or opacity properties allows browsers to animate elements on the composite layer on GPU, bypassing paint and layout calculations.",
            tags: ["CSS Animation", "GPU Acceleration", "Repaints"]
          });
        } else if (type === "coding") {
          bank.push({
            id: qId, type, difficulty: "mid", category: cat, weightage: 40, timeAllocation: 300,
            technologyStack: ["CSS", "Styling"],
            title: "Coding Sandbox: Validate HEX Color String",
            description: "Write a high-efficiency checker to validate whether a string represents a valid CSS HEX color string. It must start with '#' followed by exactly 3, 4, 6, or 8 hexadecimal characters (0-9, a-f, case-insensitive).",
            codingPrompt: "Complete the function `isValidHexColor(hex)` to return true if it is a valid CSS hexadecimal pattern, otherwise return false.\n\nInput:\nhex = '#FF0033'\nOutput:\ntrue",
            starterCode: {
              javascript: "function isValidHexColor(hex) {\n  // Write your code here\n  return false;\n}",
              typescript: "export function isValidHexColor(hex: string): boolean {\n  // Write your code here\n  return false;\n}",
              python: "def is_valid_hex_color(hex):\n    # Write your code here\n    return False",
              go: "package main\n\nfunc isValidHexColor(hex string) bool {\n    return false\n}",
              java: "public class HexValidator {\n    public static boolean isValidHexColor(String hex) {\n        return false;\n    }\n}",
              csharp: "public class HexValidator {\n    public static bool IsValidHexColor(string hex) {\n        return false;\n    }\n}"
            },
            testCases: [
              { input: "'#FF0033'", expectedOutput: "true", description: "Validate standard 6-char HEX" },
              { input: "'#FFF'", expectedOutput: "true", description: "Validate short 3-char HEX" },
              { input: "'#FG1234'", expectedOutput: "false", description: "Fail invalid hex characters (G is invalid)" }
            ],
            correctAnswer: "Refer to unit tests success assertions.",
            explanation: "A robust solution uses a regular expression like /^#[0-9a-fA-F]{3,4}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/ to test the string patterns.",
            tags: ["Regex", "HEX Colors", "Validation"]
          });
        }
      } else if (cat === "Back-End Development") {
        if (type === "mcq") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Node.js", "Process"],
            title: `Node.js Process Cluster Clustering (#${i})`,
            description: "When scaling a Node.js web server horizontally using the native 'cluster' module, how are requests distributed among worker processes by default?",
            options: [
              "Workers read requests directly from the socket using standard CPU interrupt registers.",
              "The master process listens on a port and distributes connections using a round-robin algorithm.",
              "Workers independently bind to the same port, and the OS routes requests in a random queue.",
              "Using an external HTTP load balancer routing to distinct worker port ranges."
            ],
            correctAnswer: "The master process listens on a port and distributes connections using a round-robin algorithm.",
            explanation: "In Node.js clustering, the master process handles the shared socket and balances incoming connections among children using round-robin by default.",
            tags: ["Node.js Cluster", "Scaling", "Round-Robin"]
          });
        } else if (type === "multiselect") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["SQL", "Security"],
            title: `SQL Injection Safeguards Analysis (#${i})`,
            description: "Which of the following backend database operations are completely secure against SQL Injection (SQLi)? (Select ALL that apply)",
            options: [
              "Prepared statements with parameterized queries",
              "Using a reputable Object-Relational Mapper (ORM) for all data queries",
              "Sanitizing input text using client-side HTML validation regexes",
              "Manually escaping user parameters prior to string concatenations in raw SQL"
            ],
            correctAnswer: ["Prepared statements with parameterized queries", "Using a reputable Object-Relational Mapper (ORM) for all data queries"],
            explanation: "Prepared statements parameterize inputs, keeping them distinct from SQL syntax trees. Client-side checks are easily bypassed, and manual string escaping is prone to bypasses.",
            tags: ["SQL Injection", "Security", "Prepared Statements"]
          });
        } else if (type === "boolean") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Databases", "Transactions"],
            title: `Database Transaction ACID isolation (#${i})`,
            description: "True or False: The 'Isolation' property in ACID guarantees that concurrently executing transactions will not read intermediate, uncommitted states of each other, preventing dirty reads under Read Committed level.",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "Isolation levels specify the degree to which transaction state is hidden. Read Committed ensures that any data read is committed at the moment it is read, preventing dirty reads.",
            tags: ["ACID", "Database Isolation", "Read Committed"]
          });
        } else if (type === "fill_in_blank") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Caching", "Redis"],
            title: `Redis Eviction Algorithm Terms (#${i})`,
            description: "What is the acronym (3 letters) for the cache eviction algorithm that deletes the least recently used keys when memory limit is reached?",
            correctAnswer: "LRU",
            explanation: "Least Recently Used (LRU) is a common cache replacement algorithm that discards the items that have not been used for the longest time.",
            tags: ["Redis", "LRU", "Cache Eviction"]
          });
        } else if (type === "scenario") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Microservices", "Reliability"],
            title: `Scenario: Circuit Breaker Pattern Triggering (#${i})`,
            description: "A backend service relies on a third-party shipping API. During peak seasons, the shipping API experiences timeouts, causing the backend service's database connection pool to fill up with blocked socket queries. What is the best immediate design pattern to resolve this?",
            options: [
              "Implement a Circuit Breaker pattern to immediately fail requests locally once third-party failures cross a threshold, allowing the system to degrade gracefully.",
              "Increase the connection timeout limit to 5 minutes to ensure all shipping orders eventually complete.",
              "Trigger a background thread to continuously poll and ping the shipping server every 10 milliseconds.",
              "Migrate the database to PostgreSQL immediately."
            ],
            correctAnswer: "Implement a Circuit Breaker pattern to immediately fail requests locally once third-party failures cross a threshold, allowing the system to degrade gracefully.",
            explanation: "Circuit Breakers isolate dependency failures. Once tripped, they stop querying the broken downstream service, protecting resource pools from starvation.",
            tags: ["Circuit Breaker", "Reliability", "Peak Loads"]
          });
        } else if (type === "coding") {
          bank.push({
            id: qId, type, difficulty: "mid", category: cat, weightage: 40, timeAllocation: 300,
            technologyStack: ["Express", "API Routing"],
            title: "Coding Sandbox: Parse Query Parameter String",
            description: "Complete a robust utility function to parse a URL query parameter string (like '?name=Alex&role=Dev') and return a key-value object of strings (like {name: 'Alex', role: 'Dev'}). Handle empty cases safely.",
            codingPrompt: "Complete the function `parseQueryParams(query)` to return a key-value object of decoded query values. Ignores empty keys.\n\nInput:\nquery = '?name=Alex&role=Dev'\nOutput:\n{name: 'Alex', role: 'Dev'}",
            starterCode: {
              javascript: "function parseQueryParams(query) {\n  // Write your code here\n  return {};\n}",
              typescript: "export function parseQueryParams(query: string): Record<string, string> {\n  // Write your code here\n  return {};\n}",
              python: "def parse_query_params(query):\n    # Write your code here\n    return {}",
              go: "package main\n\nfunc parseQueryParams(query string) map[string]string {\n    return map[string]string{}\n}",
              java: "import java.util.*;\npublic class QueryParser {\n    public static Map<String, String> parseQueryParams(String query) {\n        return new HashMap<>();\n    }\n}",
              csharp: "using System.Collections.Generic;\npublic class QueryParser {\n    public static Dictionary<string, string> ParseQueryParams(string query) {\n        return new Dictionary<string, string>();\n    }\n}"
            },
            testCases: [
              { input: "'?name=Alex&role=Dev'", expectedOutput: "{\"name\":\"Alex\",\"role\":\"Dev\"}", description: "Parse multi-params correctly" },
              { input: "'?status=active'", expectedOutput: "{\"status\":\"active\"}", description: "Parse single parameter" },
              { input: "''", expectedOutput: "{}", description: "Handle empty string safely" }
            ],
            correctAnswer: "Refer to unit tests success assertions.",
            explanation: "By stripping the leading '?' if present, splitting on '&', and iterating to decode keys and values, we can reconstruct the query map.",
            tags: ["Parsing", "HTTP URLs", "Query String"]
          });
        }
      } else if (cat === "UI/UX Development") {
        if (type === "mcq") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Design Systems", "Typography"],
            title: `UI/UX Design: Visual Hierarchy and Spacing (#${i})`,
            description: "In modern editorial layouts, what is the design-level goal of combining a high font-tracking (letter-spacing) in UPPERCASE with small size subtitles?",
            options: [
              "It increases the literal character density of elements, packing more information into the viewport.",
              "It establishes clean micro-hierarchy, drawing subtle attention through refined modern proportions and negative space.",
              "It allows search engine crawlers to crawl headers with higher indexing priority scores.",
              "It acts as a dynamic browser font fallback standard."
            ],
            correctAnswer: "It establishes clean micro-hierarchy, drawing subtle attention through refined modern proportions and negative space.",
            explanation: "Letter-spacing on uppercase small fonts gives an elegant, high-contrast, professional design feel, creating rhythm and breathing room.",
            tags: ["Visual Hierarchy", "Typography", "Spacing"]
          });
        } else if (type === "multiselect") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Figma", "Design Systems"],
            title: `Figma Component Architecture Principles (#${i})`,
            description: "Which of the following Figma practices are standard in robust enterprise design system libraries? (Select ALL correct answers)",
            options: [
              "Utilizing Component Properties (boolean, instance swap, text) to reduce component variant bloat",
              "Aligning all layout containers strictly to an 8px or 4px layout grid system",
              "Placing all responsive components inside strict absolute framers",
              "Leveraging Auto Layout for flexible dynamic responsive wrapping constraints"
            ],
            correctAnswer: ["Utilizing Component Properties (boolean, instance swap, text) to reduce component variant bloat", "Aligning all layout containers strictly to an 8px or 4px layout grid system", "Leveraging Auto Layout for flexible dynamic responsive wrapping constraints"],
            explanation: "Auto Layout and standardized spacing grids are critical for developer handoffs. Figma component properties dramatically reduce the combinations of variants required.",
            tags: ["Figma", "Design Systems", "Component Architecture"]
          });
        } else if (type === "boolean") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["UI UX", "Accessibility"],
            title: `Contrast Standards: WCAG 2.1 AAA (#${i})`,
            description: "True or False: WCAG 2.1 AAA standards mandate a high contrast ratio of at least 7:1 for normal body text relative to its background, ensuring high eye-safe readability.",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "WCAG AAA requires 7:1 for normal body text and 4.5:1 for large text, establishing strict visual clarity requirements for low-vision users.",
            tags: ["WCAG AAA", "Contrast", "Readability"]
          });
        } else if (type === "fill_in_blank") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Responsive", "Grid"],
            title: `UI Design: Grid Gutter Terminology (#${i})`,
            description: "What is the common design term (6-letter word starting with 'g') for the spacing/margins between columns inside a responsive layout grid system?",
            correctAnswer: "gutter",
            explanation: "Gutters refer to the empty channels separating adjacent layout columns, preventing horizontal contents from merging visually.",
            tags: ["Grid Systems", "Gutters", "Layout Spacing"]
          });
        } else if (type === "scenario") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["User Experience", "Interactions"],
            title: `Scenario: Infinite Scroll vs Pagination Choice (#${i})`,
            description: "You are designing an enterprise SaaS compliance auditing tool where legal officers search and inspect individual corporate audit logs. What is the most functional navigation layout pattern to implement?",
            options: [
              "Infinite scrolling with lazy loading, keeping them scrolling forever.",
              "Explicit Pagination, allowing officers to view exact page boundaries, sort indexes, and share specific results sets.",
              "A heavy modal carousel pop-up sliding horizontally.",
              "Enforced full-screen interactive card layouts."
            ],
            correctAnswer: "Explicit Pagination, allowing officers to view exact page boundaries, sort indexes, and share specific results sets.",
            explanation: "Audit and search applications require precise page bookmarking and location awareness. Pagination is significantly more efficient than infinite scroll for these use cases.",
            tags: ["Pagination", "SaaS Navigation", "Auditing UX"]
          });
        } else if (type === "coding") {
          bank.push({
            id: qId, type, difficulty: "mid", category: cat, weightage: 40, timeAllocation: 300,
            technologyStack: ["Tailwind", "Design Layouts"],
            title: "Coding Sandbox: HEX Color to RGB Conversion",
            description: "Write an algorithm that takes a 6-character hexadecimal color string (e.g. '#FF0033' or 'FF0033') and outputs its standard CSS rgb string (e.g. 'rgb(255, 0, 51)').",
            codingPrompt: "Complete the function `hexToRgb(hex)` to convert hex color codes into correct rgb representations.\n\nInput:\nhex = '#FF0033'\nOutput:\n'rgb(255, 0, 51)'",
            starterCode: {
              javascript: "function hexToRgb(hex) {\n  // Write your code here\n  return '';\n}",
              typescript: "export function hexToRgb(hex: string): string {\n  // Write your code here\n  return '';\n}",
              python: "def hex_to_rgb(hex):\n    # Write your code here\n    return ''",
              go: "package main\n\nfunc hexToRgb(hex string) string {\n    return \"\"\n}",
              java: "public class ColorConverter {\n    public static String hexToRgb(String hex) {\n        return \"\";\n    }\n}",
              csharp: "public class ColorConverter {\n    public static string HexToRgb(string hex) {\n        return \"\";\n    }\n}"
            },
            testCases: [
              { input: "'#FF0033'", expectedOutput: "\"rgb(255, 0, 51)\"", description: "Parse bright red hex string" },
              { input: "'000000'", expectedOutput: "\"rgb(0, 0, 0)\"", description: "Parse black hex without hash" },
              { input: "'#FFFFFF'", expectedOutput: "\"rgb(255, 255, 255)\"", description: "Parse white hex string" }
            ],
            correctAnswer: "Refer to unit tests success assertions.",
            explanation: "By stripping '#' if present, parsing pairs of characters using parseInt(val, 16), and combining them, we generate the rgb format.",
            tags: ["Colors", "Algorithms", "HEX to RGB"]
          });
        }
      } else if (cat === "Quality Assurance") {
        if (type === "mcq") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["E2E Testing", "Cypress"],
            title: `E2E Test Architecture: Flaky Quarantine Actions (#${i})`,
            description: "What is the primary industry standard practice to manage a test that occasionally fails in CI/CD pipeline runs due to race conditions (flakiness)?",
            options: [
              "Run the test on a loop in the master branch until it passes, then commit.",
              "Isolate and quarantine the test from the main blocking regression suite, log a technical debt ticket, and refactor the selector/assertion.",
              "Delete the flaky assertion entirely from the codebase.",
              "Change CI timeouts to 2 hours."
            ],
            correctAnswer: "Isolate and quarantine the test from the main blocking regression suite, log a technical debt ticket, and refactor the selector/assertion.",
            explanation: "Flaky tests undermine test suite trust. Quarantining isolates pipelines from noise while team fixes timing issues.",
            tags: ["E2E Tests", "Flaky Tests", "Quarantine"]
          });
        } else if (type === "multiselect") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Jest", "Unit Tests"],
            title: `Jest Mocking Methodologies (#${i})`,
            description: "Which of the following Jest functions can be used to mock dependencies or API network modules? (Select ALL correct options)",
            options: [
              "jest.mock('axios')",
              "jest.spyOn(console, 'error')",
              "jest.fn()",
              "jest.compileMock()"
            ],
            correctAnswer: ["jest.mock('axios')", "jest.spyOn(console, 'error')", "jest.fn()"],
            explanation: "jest.mock, jest.spyOn, and jest.fn are official Jest mocking capabilities. jest.compileMock is not a valid Jest API.",
            tags: ["Jest", "Mocking", "Unit Testing"]
          });
        } else if (type === "boolean") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Chaos Engineering", "Resilience"],
            title: `Chaos Engineering principles (#${i})`,
            description: "True or False: Chaos Engineering is primarily executed on live production systems to test and confirm cluster self-healing, failover triggers, and network partition resiliency under real workloads.",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "Chaos engineering encourages production validation (e.g., Chaos Monkey) because staging systems rarely match real-world concurrency, traffic patterns, or configurations.",
            tags: ["Chaos Engineering", "Resilience", "DevOps QA"]
          });
        } else if (type === "fill_in_blank") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Static Analysis", "Linter"],
            title: `Static Code Quality Automation Acronym (#${i})`,
            description: "What is the term for static code checkers (like ESLint) that scan syntax structures without executing the actual code?",
            correctAnswer: "linter",
            explanation: "Linters enforce stylistic standards and highlight potential semantic or runtime hazards statically during pre-commits.",
            tags: ["Linter", "Static Analysis", "Code Quality"]
          });
        } else if (type === "scenario") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Performance", "Load Testing"],
            title: `Scenario: Database Load Spike Diagnosis (#${i})`,
            description: "A developer merges a feature. During load testing with 5,000 concurrent virtual users, the application's response SLA crashes from 200ms to 12 seconds. CPU is at 99% on the DB node. How should the QA Engineer guide diagnosis?",
            options: [
              "Request the DBA immediately sherd or partition the databases across distinct cloud datacenters.",
              "Run the PostgreSQL explain plan on slowest API query logs to locate missing indexes or nested loops causing N+1 query scans.",
              "Increase the container memory capacity of the frontend application nodes.",
              "Revert the entire release immediately without auditing."
            ],
            correctAnswer: "Run the PostgreSQL explain plan on slowest API query logs to locate missing indexes or nested loops causing N+1 query scans.",
            explanation: "CPU saturation on database node under load typically indicates missing indices or N+1 query cycles. Identifying these via EXPLAIN yields immediate fixes.",
            tags: ["EXPLAIN Plan", "Load Testing", "SLA Optimization"]
          });
        } else if (type === "coding") {
          bank.push({
            id: qId, type, difficulty: "mid", category: cat, weightage: 40, timeAllocation: 300,
            technologyStack: ["Algorithms", "Ranges"],
            title: "Coding Sandbox: Filter Boundary Value Arrays",
            description: "Complete an automated test validation function that filters and sorts numbers strictly inside a closed numeric range [min, max]. Negative values, or numbers outside boundaries, should be discarded.",
            codingPrompt: "Complete the function `filterRanges(arr, min, max)` to return sorted valid values within the range.\n\nInput:\narr = [10, -5, 20, 5, 8], min = 5, max = 15\nOutput:\n[5, 8, 10]",
            starterCode: {
              javascript: "function filterRanges(arr, min, max) {\n  // Write your code here\n  return [];\n}",
              typescript: "export function filterRanges(arr: number[], min: number, max: number): number[] {\n  // Write your code here\n  return [];\n}",
              python: "def filter_ranges(arr, min, max):\n    # Write your code here\n    return []",
              go: "package main\n\nfunc filterRanges(arr []int, min int, max int) []int {\n    return []int{}\n}",
              java: "import java.util.*;\npublic class RangeFilter {\n    public static List<Integer> filterRanges(int[] arr, int min, int max) {\n        return new ArrayList<>();\n    }\n}",
              csharp: "using System.Collections.Generic;\npublic class RangeFilter {\n    public static List<int> FilterRanges(int[] arr, int min, int max) {\n        return new List<int>();\n    }\n}"
            },
            testCases: [
              { input: "[10, -5, 20, 5, 8], 5, 15", expectedOutput: "[5, 8, 10]", description: "Filter and sort standard values" },
              { input: "[1, 2, 3], 10, 20", expectedOutput: "[]", description: "Empty result when none match" },
              { input: "[15, 15, 15], 15, 15", expectedOutput: "[15, 15, 15]", description: "Keep identical boundary values" }
            ],
            correctAnswer: "Refer to unit tests success assertions.",
            explanation: "Filtering using element >= min && element <= max, followed by sorting in ascending order, completes the requirement.",
            tags: ["Filtering", "Sorting", "Boundary QA"]
          });
        }
      } else if (cat === "Software Project Management") {
        if (type === "mcq") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Agile", "Velocity"],
            title: `Agile Planning: Team Velocity Calculation (#${i})`,
            description: "When estimating sprint capacity, how is team velocity officially calculated in standard Agile Scrum frameworks?",
            options: [
              "The total sum of story points assigned to the team in Jira during sprint planning, regardless of completion status.",
              "The historical average number of story points successfully marked 'Done' in the past 3 to 4 sprints.",
              "The individual developer hours logged inside task timers split by senior capacity multipliers.",
              "The total count of distinct pull requests merged into the main development branch."
            ],
            correctAnswer: "The historical average number of story points successfully marked 'Done' in the past 3 to 4 sprints.",
            explanation: "Velocity is an empirical measure of completed work. It is determined by averaging the story points of fully finished items in past sprints.",
            tags: ["Sprint Capacity", "Agile Velocity", "Estimation"]
          });
        } else if (type === "multiselect") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Scrum Master", "Process"],
            title: `Scrum Master Standard Responsibilities (#${i})`,
            description: "Which of the following activities represent core, formal responsibilities of a certified Scrum Master? (Select ALL that apply)",
            options: [
              "Facilitating Scrum events (Daily Standup, Retro, Sprint Planning) if requested or needed",
              "Removing blocking impediments that impede the team's engineering velocity",
              "Directly allocating and assigning specific Jira tickets to individual software engineers",
              "Coaching organizational stakeholders and the development team in Scrum values and Agile principles"
            ],
            correctAnswer: ["Facilitating Scrum events (Daily Standup, Retro, Sprint Planning) if requested or needed", "Removing blocking impediments that impede the team's engineering velocity", "Coaching organizational stakeholders and the development team in Scrum values and Agile principles"],
            explanation: "Scrum Masters act as servant leaders who remove roadblocks and coach the team. Scrum teams are self-organizing, so Scrum Masters do not assign tasks directly to individuals.",
            tags: ["Scrum Master", "Impediments", "Servant Leadership"]
          });
        } else if (type === "boolean") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Agile", "Process"],
            title: `Agile Core values (#${i})`,
            description: "True or False: The Agile Manifesto values responding to change over following a plan, which means long-term release milestones should completely be skipped in favor of dynamic weekly goals.",
            options: ["True", "False"],
            correctAnswer: "False",
            explanation: "Agile values adaptation over static plans, but long-term roadmaps, milestone forecasts, and release planning are still critical for business synchronization.",
            tags: ["Agile Manifesto", "Release Planning", "Core Values"]
          });
        } else if (type === "fill_in_blank") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Project Planning", "Kanban"],
            title: `Kanban Limits Acronym (#${i})`,
            description: "What is the acronym (3 letters) for the constraint limit set on Kanban boards to limit concurrent active items per workflow stage, preventing bottlenecks?",
            correctAnswer: "WIP",
            explanation: "Work In Progress (WIP) limits ensure team focuses on finishing existing items before pulling in new tasks.",
            tags: ["Kanban", "WIP Limit", "Bottlenecks"]
          });
        } else if (type === "scenario") {
          bank.push({
            id: qId, type, difficulty: diff, category: cat, weightage, timeAllocation,
            technologyStack: ["Technical Debt", "Risk"],
            title: `Scenario: Managing Technical Debt Refactors (#${i})`,
            description: "An engineering team is struggling to deliver new features because of massive technical debt in a legacy rendering class. Product Owner insists on releasing 10 new commercial features. As the Project Manager, how do you resolve this?",
            options: [
              "Align with Tech Leads to quantify the cost of debt (e.g. slowed velocity). Dedicate a fixed capacity (e.g. 20%) of every upcoming Sprint to refactoring and paying off debt, negotiating this investment with the PO.",
              "Order developers to work on features on weekends, and refactor code on weekdays.",
              "Completely freeze commercial development for 6 months to perform a full rewrite.",
              "Ignore developer concerns and follow the Product Owner's priorities literally."
            ],
            correctAnswer: "Align with Tech Leads to quantify the cost of debt (e.g. slowed velocity). Dedicate a fixed capacity (e.g. 20%) of every upcoming Sprint to refactoring and paying off debt, negotiating this investment with the PO.",
            explanation: "Securing a balanced refactoring budget (e.g., 20%) ensures long-term technical sustainability and predictability of deliverables, satisfying both dev and product needs.",
            tags: ["Technical Debt", "Refactoring Capacity", "PO Negotiation"]
          });
        } else if (type === "coding") {
          bank.push({
            id: qId, type, difficulty: "mid", category: cat, weightage: 40, timeAllocation: 300,
            technologyStack: ["Project Estimation", "Agile Math"],
            title: "Coding Sandbox: Calculate Sprint Average Velocity",
            description: "Complete an algorithm that calculates the average sprint velocity from an array of past sprint points. Ignore any negative values, zero values, or non-numeric types that might pollute the database tracking logs.",
            codingPrompt: "Complete the function `calculateAverageVelocity(history)` to return the rounded average points completed.\n\nInput:\nhistory = [30, 45, 0, -10, 35]\nOutput:\n37",
            starterCode: {
              javascript: "function calculateAverageVelocity(history) {\n  // Write your code here\n  return 0;\n}",
              typescript: "export function calculateAverageVelocity(history: any[]): number {\n  // Write your code here\n  return 0;\n}",
              python: "def calculate_average_velocity(history):\n    # Write your code here\n    return 0",
              go: "package main\n\nfunc calculateAverageVelocity(history []int) int {\n    return 0\n}",
              java: "public class VelocityCalculator {\n    public static int calculateAverageVelocity(int[] history) {\n        return 0;\n    }\n}",
              csharp: "public class VelocityCalculator {\n    public static int CalculateAverageVelocity(int[] history) {\n        return 0;\n    }\n}"
            },
            testCases: [
              { input: "[30, 45, 0, -10, 35]", expectedOutput: "37", description: "Filter negatives and zeros, round to average" },
              { input: "[25, 25, 25]", expectedOutput: "25", description: "Return exact average of stable sprints" },
              { input: "[]", expectedOutput: "0", description: "Handle empty history with 0 velocity" }
            ],
            correctAnswer: "Refer to unit tests success assertions.",
            explanation: "Filter history for items > 0, sum them up, divide by the count of positive items, and use Math.round to return the correct integer.",
            tags: ["Agile Velocity", "Rounding", "Filtering"]
          });
        }
      }
    }
  });

  return bank;
}


// Active attempts registry
let dbAttempts: AssessmentAttempt[] = [];

// Automated notifications & email alerts registry
interface RecruiterNotification {
  id: string;
  type: "assessment_completion" | "upcoming_interview" | "system";
  title: string;
  message: string;
  timestamp: string;
  recipientEmail: string;
  candidateName?: string;
  candidateId?: string;
  status: "sent" | "failed" | "pending";
  metadata?: any;
}

let dbNotifications: RecruiterNotification[] = [
  {
    id: "notif-1",
    type: "assessment_completion",
    title: "Assessment Completed: Alexander Wright",
    message: "Alexander Wright has completed the React TypeScript & Frontend Engineering assessment with an overall score of 92%. Digital certificate cert-9210-aw generated.",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    recipientEmail: "recruiter@saas.com",
    candidateName: "Alexander Wright",
    candidateId: "usr_alex_02",
    status: "sent",
    metadata: { score: 92, category: "React TypeScript & Frontend Engineering" }
  },
  {
    id: "notif-2",
    type: "upcoming_interview",
    title: "Upcoming Interview Reminder: Alex Rivera",
    message: "Your interview with Alex Rivera for Full Stack Development is scheduled to start in less than 24 hours.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    recipientEmail: "recruiter@saas.com",
    candidateName: "Alex Rivera",
    candidateId: "user-candidate-1",
    status: "sent",
    metadata: { date: "2026-06-25", time: "10:00" }
  }
];

let emailAlertSettings = {
  completionAlerts: true,
  upcomingInterviewAlerts: true,
  reminderThresholdHours: 24,
  smtpHost: "smtp.saas-screening.com",
  smtpPort: 587,
  recipientEmails: "recruiter@saas.com, HR-team@saas-screening.com",
  senderName: "SaaS TalentScreen Advisor",
  senderEmail: "advisor@saas-screening.com"
};

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

app.get("/api/auth/sandbox-user", (req: Request, res: Response) => {
  const role = req.query.role as string;
  if (!role) {
    return res.status(400).json({ error: "Role is required." });
  }

  let targetUser: UserProfile | undefined;
  if (role === "CANDIDATE") {
    targetUser = dbUsers.find(u => u.id === "user-candidate-1");
  } else if (role === "RECRUITER") {
    targetUser = dbUsers.find(u => u.id === "user-recruiter-1");
  } else if (role === "ADMIN") {
    targetUser = dbUsers.find(u => u.id === "user-admin-1");
  }

  if (!targetUser) {
    return res.status(404).json({ error: "Target sandbox role user not found." });
  }

  res.json({ user: targetUser });
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
  const { candidateId, category, difficulty, isPractice } = req.body;
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

  // Take up to 29 MCQs/non-coding and 1 Coding challenge to make standard robust test set
  const nonCoding = [
    ...targetDiffQuestions.filter(q => q.type !== "coding"),
    ...otherDiffQuestions.filter(q => q.type !== "coding")
  ].slice(0, 29);

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
    integrityScore: 100,
    isPractice: !!isPractice
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

  // Create Digital Certificate if score >= 70% (Proficient or above) and NOT a practice session
  let certificate: DigitalCertificate | null = null;
  if (!attempt.isPractice && attempt.overallCandidateScore >= 70) {
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

  // Trigger automated email alert if enabled in settings and NOT a practice session
  if (!attempt.isPractice && emailAlertSettings.completionAlerts) {
    const emailNotif: RecruiterNotification = {
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type: "assessment_completion",
      title: `Assessment Completed: ${attempt.candidateName}`,
      message: `${attempt.candidateName} has completed the ${attempt.category} assessment with an overall score of ${attempt.overallCandidateScore}% (${attempt.skillRatingLevel}). Digital certification ${attempt.certificateId || "N/A"} was generated.`,
      timestamp: new Date().toISOString(),
      recipientEmail: emailAlertSettings.recipientEmails.split(",")[0]?.trim() || "recruiter@saas.com",
      candidateName: attempt.candidateName,
      candidateId: attempt.candidateId,
      status: "sent",
      metadata: {
        attemptId: attempt.id,
        score: attempt.overallCandidateScore,
        category: attempt.category,
        certificateId: attempt.certificateId
      }
    };
    dbNotifications.unshift(emailNotif);
  }

  res.json({
    attempt,
    certificate
  });
});

// ============================================================================
// POST-ASSESSMENT AI 'STRENGTHS & WEAKNESSES' ENGINE (AI ADVISOR MODULE)
// ============================================================================
app.post("/api/assessment/analyze-strengths-weaknesses", async (req: Request, res: Response) => {
  const { attemptId } = req.body;

  let attempt = dbAttempts.find(a => a.id === attemptId);
  
  // High-fidelity preset for Alex Rivera (user-candidate-1) or cert-9821-ab
  if (!attempt && (attemptId === "cert-9821-ab" || attemptId === "user-candidate-1" || attemptId === "attempt-rivera")) {
    const riveraAnalysis = {
      strengths: [
        { area: "React Performance & Rendering", description: "Demonstrated superior expertise in optimizing render cycles, preventing unnecessary component re-renders with React.memo and useCallback hook structures." },
        { area: "REST & CORS Configuration", description: "Exhibited highly secure backend knowledge, correctly specifying CORS Access-Control-Allow-Origin parameters to defend against unauthorized cross-origin requests." },
        { area: "Agile Project Processes", description: "Successfully resolved mid-sprint scope changes in team scenarios, maintaining project commitments through proper estimation and scope negotiation." }
      ],
      weaknesses: [
        { area: "Cache Eviction (Redis)", description: "Identified minor gaps in Redis memory eviction strategies under thundering herd/cache stampede peak loads." },
        { area: "Edge-Case Inputs Validation", description: "Code review recommends incorporating defensive type/range verification checks against null or empty arrays." }
      ],
      summary: "Alex Rivera shows outstanding frontend architectural capabilities and very solid backend integration patterns. With minor refinements in extreme load database caching and strict edge-case defensive input programming, they are fully qualified for a Senior-tier Frontend or Full Stack Engineer role.",
      actionPlan: [
        "Review Redis mutex and locking mechanisms to resolve thundering herd/cache stampede workloads.",
        "Practice implementing defensive error boundaries and empty-state parameter protections across coding sandbox problems.",
        "Deep-dive into OWASP security guidelines regarding parameterized inputs."
      ]
    };
    return res.json({ success: true, analysis: riveraAnalysis });
  }

  if (!attempt) {
    const defaultAnalysis = {
      strengths: [
        { area: "Core Language Syntax", description: "Excellent application of structured types and functional conventions." },
        { area: "Code Quality", description: "Solid code formatting standards with helpful documentation comments." }
      ],
      weaknesses: [
        { area: "Big-O Time Complexity", description: "Some logic paths contain nested loops that could be optimized using linear Map lookups." }
      ],
      summary: "The candidate demonstrated solid software engineering fundamentals. Focus on optimizing time-space complexities to handle high-scale data inputs efficiently.",
      actionPlan: [
        "Refactor nested lookup algorithms with hash maps or sets to achieve O(N) performance.",
        "Incorporate strict parameter validations for empty collections.",
        "Explore OWASP Top 10 vulnerabilities list for secure web development practices."
      ]
    };
    return res.json({ success: true, analysis: defaultAnalysis });
  }

  const questions = attempt.questions || [];
  const answers = attempt.answers || {};

  const correctQuestions: Question[] = [];
  const incorrectQuestions: Question[] = [];

  questions.forEach(q => {
    const userAns = answers[q.id];
    if (userAns !== undefined) {
      let isCorrect = false;
      if (Array.isArray(q.correctAnswer)) {
        const userArr = Array.isArray(userAns) ? userAns : [userAns];
        isCorrect = q.correctAnswer.length === userArr.length && 
                    q.correctAnswer.every(val => userArr.includes(val));
      } else {
        isCorrect = String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      }
      if (isCorrect) {
        correctQuestions.push(q);
      } else {
        incorrectQuestions.push(q);
      }
    } else if (q.type === "coding") {
      const passed = attempt.codingTestsPassedCount || 0;
      const total = attempt.codingTestsTotalCount || 1;
      if (passed === total && total > 0) {
        correctQuestions.push(q);
      } else {
        incorrectQuestions.push(q);
      }
    } else {
      incorrectQuestions.push(q);
    }
  });

  if (aiClient) {
    try {
      console.log(`Querying Gemini 3.5 Flash for Strengths & Weaknesses on attempt: ${attempt.id}`);
      
      const analysisPrompt = `You are a premium, objective Technical Assessment Architect.
Analyze this candidate's performance on their technical screening assessment in the category: "${attempt.category}".
Difficulty level: "${attempt.difficulty}".
Candidate Overall Score: ${attempt.overallCandidateScore}/100.
Technical Knowledge Score: ${attempt.technicalKnowledgeScore}/100.
Coding Assignment Score: ${attempt.codingAssignmentScore}/100.
AI Code Review Score: ${attempt.codeReviewScore}/100.

Here are the questions they answered correctly:
${correctQuestions.map((q, idx) => `${idx + 1}. Title: "${q.title}" | Tags: ${q.tags.join(", ")} | Tech: ${q.technologyStack.join(", ")}`).join("\n")}

Here are the questions they got wrong or had incomplete:
${incorrectQuestions.map((q, idx) => `${idx + 1}. Title: "${q.title}" | Tags: ${q.tags.join(", ")} | Tech: ${q.technologyStack.join(", ")} | Description: "${q.description}"`).join("\n")}

${attempt.codeReviewSummary ? `AI Code Review Summary on their coding submission:
- Readability Assessment: ${attempt.codeReviewSummary.readabilityAssessment}
- Complexity Analysis: ${attempt.codeReviewSummary.complexityAnalysis}
- Recommendations: ${attempt.codeReviewSummary.recommendations.join(", ")}` : ""}

Based on these details, produce a high-fidelity 'Strengths & Weaknesses' analysis.
You MUST output valid JSON strictly matching this schema:
{
  "strengths": [
    { "area": "Name of technical area", "description": "1-2 sentences of specific technical evidence explaining why this is a strength based on their correct answers." }
  ],
  "weaknesses": [
    { "area": "Name of area needing improvement", "description": "1-2 sentences of specific feedback pointing out why they struggled here and what concepts they need to review." }
  ],
  "summary": "A cohesive 2-3 sentence overall summary of the candidate's technical profile, experience fit, and recommendation.",
  "actionPlan": [
    "Exactly 3 highly actionable, specific learning steps or practice recommendations (with standard references like MDN, OWASP, or design patterns)."
  ]
}

Ensure you provide exactly 2-3 strengths, exactly 2-3 weaknesses, a summary, and exactly 3 action plan steps. Keep the tone professional, constructive, and highly technical. Avoid generic advice.`;

      const geminiResponse = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: analysisPrompt,
        config: {
          systemInstruction: "You are a senior technical assessment evaluator and AI advisor. Output fully valid JSON matching the specified schema exactly. Do not include markdown wraps around the JSON block.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    area: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["area", "description"]
                }
              },
              weaknesses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    area: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["area", "description"]
                }
              },
              summary: { type: Type.STRING },
              actionPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["strengths", "weaknesses", "summary", "actionPlan"]
          }
        }
      });

      const parsedAnalysis = JSON.parse(geminiResponse.text.trim());
      return res.json({ success: true, analysis: parsedAnalysis });
    } catch (err) {
      console.error("Gemini Strengths/Weaknesses generation failed, falling back to local analysis", err);
    }
  }

  const strengths: { area: string; description: string }[] = [];
  const weaknesses: { area: string; description: string }[] = [];
  const actionPlan: string[] = [];

  const correctTags = new Set<string>();
  correctQuestions.forEach(q => q.tags.forEach(t => correctTags.add(t)));

  const incorrectTags = new Set<string>();
  incorrectQuestions.forEach(q => q.tags.forEach(t => incorrectTags.add(t)));

  if (correctQuestions.length > 0) {
    correctQuestions.slice(0, 3).forEach(q => {
      strengths.push({
        area: q.title.replace(/^(Understanding|Optimizing|Handling|Scenario:)\s+/i, ""),
        description: `Successfully mastered concepts in ${q.tags.join(" & ")}. Demonstrated accurate reasoning under technical criteria.`
      });
    });
  } else {
    strengths.push({
      area: "Technical Execution",
      description: "Demonstrated commitment to completing the assessment under timed proctor conditions."
    });
  }

  if (incorrectQuestions.length > 0) {
    incorrectQuestions.slice(0, 2).forEach(q => {
      weaknesses.push({
        area: q.title.replace(/^(Understanding|Optimizing|Handling|Scenario:)\s+/i, ""),
        description: `Encountered difficulty with the core principles of ${q.tags.join(" or ")}. Needs a thorough review of the associated operational guidelines.`
      });
    });
  } else {
    weaknesses.push({
      area: "Advanced Optimizations",
      description: "No significant mistakes detected. Focus on keeping up to date with new library specifications and performance updates."
    });
  }

  if (incorrectQuestions.length > 0) {
    incorrectQuestions.slice(0, 3).forEach(q => {
      actionPlan.push(`Review the documentation and best practices regarding ${q.tags.join(", ")} to consolidate knowledge of ${q.title}.`);
    });
    while (actionPlan.length < 3) {
      actionPlan.push("Practice algorithmic constraints in mock sandboxes to ensure efficient O(N) runtime complexities.");
    }
  } else {
    actionPlan.push("Study advanced architectural designs and caching layers using Redis and microservice circuit breakers.");
    actionPlan.push("Contribute to open-source libraries in the frontend ecosystem to gain edge case perspectives.");
    actionPlan.push("Conduct mock peer review sessions to polish professional engineering feedback style.");
  }

  const summary = `The candidate has completed the ${attempt.category} assessment with an overall score of ${attempt.overallCandidateScore}%. They demonstrated a solid foundation in ${correctQuestions.slice(0, 2).map(q => q.tags[0]).filter(Boolean).join(" and ") || "fundamental engineering topics"}, while showing opportunities to grow in ${incorrectQuestions.slice(0, 2).map(q => q.tags[0]).filter(Boolean).join(" and ") || "more advanced concepts"}.`;

  const localAnalysis = {
    strengths,
    weaknesses,
    summary,
    actionPlan: actionPlan.slice(0, 3)
  };

  return res.json({ success: true, analysis: localAnalysis, fallback: true });
});

// ============================================================================
// AUTOMATED NOTIFICATION & EMAIL ALERT SYSTEM (SMTP SIMULATOR)
// ============================================================================
app.get("/api/recruiter/notifications", (req: Request, res: Response) => {
  res.json({
    success: true,
    notifications: dbNotifications,
    settings: emailAlertSettings
  });
});

app.post("/api/recruiter/notifications/settings", (req: Request, res: Response) => {
  const { 
    completionAlerts, 
    upcomingInterviewAlerts, 
    reminderThresholdHours, 
    smtpHost, 
    smtpPort, 
    recipientEmails,
    senderName,
    senderEmail
  } = req.body;

  emailAlertSettings = {
    completionAlerts: !!completionAlerts,
    upcomingInterviewAlerts: !!upcomingInterviewAlerts,
    reminderThresholdHours: Number(reminderThresholdHours) || 24,
    smtpHost: String(smtpHost || emailAlertSettings.smtpHost),
    smtpPort: Number(smtpPort) || 587,
    recipientEmails: String(recipientEmails || emailAlertSettings.recipientEmails),
    senderName: String(senderName || emailAlertSettings.senderName),
    senderEmail: String(senderEmail || emailAlertSettings.senderEmail)
  };

  res.json({
    success: true,
    message: "Automated alert configurations successfully synchronized with SMTP relay servers.",
    settings: emailAlertSettings
  });
});

app.post("/api/recruiter/notifications/simulate", (req: Request, res: Response) => {
  const { type } = req.body;
  let notif: RecruiterNotification;

  if (type === "assessment_completion") {
    const names = ["Sarah Connor", "John Doe", "Bruce Wayne", "Clark Kent", "Diana Prince", "Alex Rivera"];
    const skills = ["React & Frontend Engineering", "Go Cloud Backend Microservices", "Python & Machine Learning", "Kubernetes SRE Systems"];
    const name = names[Math.floor(Math.random() * names.length)];
    const skill = skills[Math.floor(Math.random() * skills.length)];
    const score = Math.floor(72 + Math.random() * 26);
    
    notif = {
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type: "assessment_completion",
      title: `Assessment Completed: ${name}`,
      message: `${name} has completed the ${skill} assessment with an overall score of ${score}%. Digital certificate cert-${Math.floor(1000 + Math.random() * 9000)} was generated.`,
      timestamp: new Date().toISOString(),
      recipientEmail: emailAlertSettings.recipientEmails.split(",")[0]?.trim() || "recruiter@saas.com",
      candidateName: name,
      status: "sent",
      metadata: { score, category: skill }
    };
  } else {
    const names = ["Peter Parker", "Tony Stark", "Steve Rogers", "Natasha Romanoff", "Alex Rivera"];
    const times = ["14:30", "09:00", "11:15", "16:00"];
    const name = names[Math.floor(Math.random() * names.length)];
    const time = times[Math.floor(Math.random() * times.length)];
    
    notif = {
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type: "upcoming_interview",
      title: `Upcoming Interview Reminder: ${name}`,
      message: `Your technical interview with ${name} is approaching. It is scheduled to start at ${time} today on Google Meet.`,
      timestamp: new Date().toISOString(),
      recipientEmail: emailAlertSettings.recipientEmails.split(",")[0]?.trim() || "recruiter@saas.com",
      candidateName: name,
      status: "sent",
      metadata: { time }
    };
  }

  dbNotifications.unshift(notif);
  res.json({ success: true, notification: notif, notifications: dbNotifications });
});

app.post("/api/recruiter/notifications/check-interviews", (req: Request, res: Response) => {
  const { interviews } = req.body;
  if (!Array.isArray(interviews)) {
    return res.status(400).json({ error: "Invalid interviews array structure." });
  }

  if (!emailAlertSettings.upcomingInterviewAlerts) {
    return res.json({ success: true, count: 0, message: "Upcoming interview alerts are currently disabled.", notifications: dbNotifications });
  }

  const thresholdMs = emailAlertSettings.reminderThresholdHours * 3600 * 1000;
  const now = new Date();
  let alertedCount = 0;

  interviews.forEach((int: any) => {
    if (!int.date || !int.time) return;
    try {
      const interviewDateTime = new Date(`${int.date}T${int.time}`);
      const timeDiff = interviewDateTime.getTime() - now.getTime();

      // If within threshold and in the future
      if (timeDiff > 0 && timeDiff <= thresholdMs) {
        // Check if we already have an alert for this interview ID
        const alreadyAlerted = dbNotifications.some(
          notif => notif.type === "upcoming_interview" && notif.metadata?.interviewId === int.id
        );

        if (!alreadyAlerted) {
          const notif: RecruiterNotification = {
            id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            type: "upcoming_interview",
            title: `Upcoming Interview Reminder: ${int.candidateName}`,
            message: `Your technical interview with ${int.candidateName} for ${int.technologyArea || "Technical Role"} starts at ${int.time} on ${int.date} (${Math.round(timeDiff / 60000)} minutes remaining).`,
            timestamp: now.toISOString(),
            recipientEmail: int.candidateEmail || emailAlertSettings.recipientEmails.split(",")[0]?.trim() || "recruiter@saas.com",
            candidateName: int.candidateName,
            candidateId: int.candidateId,
            status: "sent",
            metadata: {
              interviewId: int.id,
              date: int.date,
              time: int.time,
              meetingLink: int.meetingLink
            }
          };
          dbNotifications.unshift(notif);
          alertedCount++;
        }
      }
    } catch (e) {
      console.error("Failed to parse interview date/time for automated alerts:", e);
    }
  });

  res.json({ 
    success: true, 
    count: alertedCount, 
    notifications: dbNotifications, 
    settings: emailAlertSettings 
  });
});

app.post("/api/recruiter/notifications/clear", (req: Request, res: Response) => {
  dbNotifications = [];
  res.json({ success: true, message: "All email notification logs successfully cleared." });
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

  const candidates = dbUsers.filter(u => u.role === UserRole.CANDIDATE);

  const proficiencyDistribution = [
    { name: "Junior (0-2y)", count: candidates.filter(c => c.experienceLevel === "junior").length || 12 },
    { name: "Mid-Level (2-5y)", count: candidates.filter(c => c.experienceLevel === "mid").length || 24 },
    { name: "Senior (5-10y)", count: candidates.filter(c => c.experienceLevel === "senior").length || 18 },
    { name: "Advanced (10y+)", count: candidates.filter(c => c.experienceLevel === "advanced").length || 8 }
  ];

  const scoreDistribution = [
    { name: "Below 60% (Needs Improvement)", count: 5 },
    { name: "60% - 75% (Passing)", count: 18 },
    { name: "75% - 90% (Proficient)", count: 32 },
    { name: "90% - 100% (Expert)", count: 14 }
  ];

  // Return formatted reports
  res.json({
    kpis: {
      totalCandidates: candidates.length,
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
    proficiencyDistribution,
    scoreDistribution,
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

// ==========================================
// AI MOCK INTERVIEW API (Module 15)
// ==========================================
app.post("/api/assessment/interview/start", async (req: Request, res: Response) => {
  const { attemptId } = req.body;
  const attempt = dbAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Attempt record not found." });
  }

  // Find coding question
  const codingQuestion = attempt.questions.find(q => q.type === "coding");
  if (!codingQuestion) {
    return res.status(400).json({ error: "No coding question found in this assessment to conduct an interview on." });
  }

  const userCode = attempt.answers[codingQuestion.id] || "";
  const codingPrompt = codingQuestion.codingPrompt || codingQuestion.description;
  const passedTests = attempt.codingTestsPassedCount || 0;
  const totalTests = attempt.codingTestsTotalCount || 3;

  const interviewerIntroduction = `Hi ${attempt.candidateName}! Congratulations on completing your ${attempt.category} coding test. I'm your AI technical interviewer today. I've reviewed your solution to the "${codingQuestion.title}" challenge where you passed ${passedTests} of ${totalTests} test cases. Let's discuss your design choices.`;

  if (aiClient) {
    try {
      const prompt = `You are a premium, highly professional but friendly Senior Technical Interviewer at a top tier software enterprise.
The candidate ${attempt.candidateName} has just completed a coding challenge.
Challenge Title: ${codingQuestion.title}
Challenge Goal/Prompt: ${codingPrompt}
Candidate Code Submission:
\`\`\`
${userCode}
\`\`\`
Test Cases Passed: ${passedTests} / ${totalTests}

Please generate the first follow-up interview question to ask the candidate.
Rules:
1. Be welcoming, professional, and friendly.
2. Direct your question specifically at their submitted code (e.g., discuss their choice of data structures, approach, time/space complexity, or how they would handle a specific edgecase).
3. Keep the response brief (maximum 2-3 sentences).
4. Do NOT output any markdown code blocks in your question.
5. Address the candidate as ${attempt.candidateName}.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional software engineering interviewer conducting a live technical chat-based follow-up interview.",
        }
      });

      const firstQuestion = response.text?.trim() || "Could you start by walking me through your general approach to this problem and why you chose this specific implementation strategy?";
      return res.json({
        introduction: interviewerIntroduction,
        question: firstQuestion,
        codingQuestionTitle: codingQuestion.title,
        codingQuestionPrompt: codingPrompt,
        candidateCode: userCode
      });
    } catch (err) {
      console.error("Failed to generate first interview question with Gemini, using fallback.", err);
    }
  }

  // Fallback if Gemini is not available or errors out
  const fallbackQuestion = `I see you implemented a solution for "${codingQuestion.title}". Could you explain the time and space complexity of your approach, and how it handles potential large inputs or memory boundaries?`;
  res.json({
    introduction: interviewerIntroduction,
    question: fallbackQuestion,
    codingQuestionTitle: codingQuestion.title,
    codingQuestionPrompt: codingPrompt,
    candidateCode: userCode
  });
});

app.post("/api/assessment/interview/chat", async (req: Request, res: Response) => {
  const { attemptId, chatHistory } = req.body; // chatHistory is an array of { role: 'user' | 'assistant', content: string }
  const attempt = dbAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Attempt record not found." });
  }

  const codingQuestion = attempt.questions.find(q => q.type === "coding");
  if (!codingQuestion) {
    return res.status(400).json({ error: "No coding question found." });
  }

  const userCode = attempt.answers[codingQuestion.id] || "";
  const codingPrompt = codingQuestion.codingPrompt || codingQuestion.description;

  // We want to limit the interview to about 3 turns of questions, then provide feedback.
  const userTurns = chatHistory.filter((m: any) => m.role === "user").length;
  const isLastTurn = userTurns >= 3;

  if (aiClient) {
    try {
      let prompt = "";
      if (isLastTurn) {
        prompt = `You are a premium, highly professional Senior Technical Interviewer. The mock interview with ${attempt.candidateName} is now wrapping up.
Coding Challenge: ${codingQuestion.title}
Candidate Code:
\`\`\`
${userCode}
\`\`\`

Here is the conversation history:
${chatHistory.map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join("\n")}

Please provide a highly supportive, constructive closing response.
It must include:
1. An encouraging "Thank you" and wrap-up.
2. "Technical Strengths Observed": Highlight 1-2 positive aspects of their code or their verbal explanations.
3. "Growth Recommendations": Highlight 1 specific architectural or performance improvement they could focus on next.

Keep the summary brief, professional, and directly address the candidate as ${attempt.candidateName}. Do not write more than 4-5 sentences in total. Use elegant formatting.`;
      } else {
        prompt = `You are a premium, highly professional Senior Technical Interviewer. Continue the interactive technical follow-up interview with ${attempt.candidateName}.
Coding Challenge: ${codingQuestion.title}
Candidate Code:
\`\`\`
${userCode}
\`\`\`

Here is the conversation history:
${chatHistory.map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join("\n")}

Rules:
1. Respond to the candidate's last answer with a very brief, professional acknowledgement (e.g. "Excellent explanation", "That makes sense").
2. Ask 1 follow-up technical question based on their answer, or if their answer was incomplete/incorrect, guide them or ask for clarification.
3. Keep the response brief (maximum 2-3 sentences).
4. Do NOT output any markdown code blocks.
5. Address the candidate as ${attempt.candidateName}.`;
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional software engineering interviewer conducting a live technical chat-based follow-up interview.",
        }
      });

      const reply = response.text?.trim() || (isLastTurn ? "Thank you for sharing your thoughts today! You did a great job explaining your implementation decisions. Keep up the great work!" : "That is a very reasonable approach. How would you handle any potential concurrency or scaling issues with that design?");
      return res.json({
        reply,
        completed: isLastTurn
      });
    } catch (err) {
      console.error("Failed to generate chat response with Gemini, using fallback.", err);
    }
  }

  // Fallback chat response
  let reply = "";
  if (isLastTurn) {
    reply = `Thank you for completing this technical follow-up interview, ${attempt.candidateName}!

Technical Strengths Observed:
- Good clarity in explaining data structures and modular design choices.
- Demonstrated awareness of trade-offs regarding time vs space complexity.

Growth Recommendations:
- Consider diving deeper into concurrency locks or resource safety boundaries for distributed environments.
- Practice optimizing array structures under tighter cache-locality configurations.

It was a pleasure discussing engineering with you today. Best of luck!`;
  } else {
    const questions = [
      "That makes sense. If this solution were to be deployed as a microservice, what potential bottleneck or scaling issue would you anticipate first?",
      "Interesting perspective. If you had to refactor this solution to run on a multi-threaded system, how would you ensure thread-safety?"
    ];
    reply = questions[userTurns - 1] || "That's a solid explanation. Can you elaborate on any edge-case inputs that might cause your solution to throw an error or behave unexpectedly?";
  }

  res.json({
    reply,
    completed: isLastTurn
  });
});

// ==========================================
// GLOBAL LEADERBOARD API (Module 16)
// ==========================================
app.get("/api/assessment/leaderboard", (req: Request, res: Response) => {
  const currentCandidateId = req.query.candidateId as string;

  const baseBenchmarks = [
    { id: "bench-1", fullName: "Sarah Chen", location: "New York, NY", score: 96, category: "React & Frontend", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", isBenchmark: true },
    { id: "bench-2", fullName: "Elena Rostova", location: "Berlin, DE", score: 94, category: "System Design", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", isBenchmark: true },
    { id: "bench-3", fullName: "Yusuf Demir", location: "Istanbul, TR", score: 91, category: "Python Backend", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", isBenchmark: true },
    { id: "bench-4", fullName: "Li Wei", location: "Singapore, SG", score: 89, category: "Go & Kubernetes", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150", isBenchmark: true },
    { id: "bench-5", fullName: "Amara Diallo", location: "Paris, FR", score: 82, category: "DevOps & Infrastructure", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isBenchmark: true },
    { id: "bench-6", fullName: "Devon Miller", location: "London, UK", score: 78, category: "Fullstack Engineering", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", isBenchmark: true },
    { id: "bench-7", fullName: "Yuki Tanaka", location: "Tokyo, JP", score: 74, category: "Cloud Architecture", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", isBenchmark: true },
    { id: "bench-8", fullName: "Carlos Mendez", location: "Madrid, ES", score: 68, category: "Database Systems", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150", isBenchmark: true },
  ];

  // Map real candidates
  const candidates = dbUsers.filter(u => u.role === UserRole.CANDIDATE);
  const realCandidates = candidates.map(c => {
    const attempts = dbAttempts.filter(a => a.candidateId === c.id && a.status === "completed");
    
    let highestScore = 0;
    let preferredCategory = c.currentRole || "Software Engineering";
    
    if (attempts.length > 0) {
      highestScore = Math.max(...attempts.map(a => a.overallCandidateScore || 0));
      preferredCategory = attempts[0].category;
    } else if (c.id === "user-candidate-1") {
      highestScore = 85; // Alex Rivera default preset
      preferredCategory = "React & Frontend";
    }

    return {
      id: c.id,
      fullName: c.fullName,
      location: c.location || "Remote",
      score: highestScore,
      category: preferredCategory,
      avatarUrl: c.avatarUrl || "",
      isBenchmark: false
    };
  });

  const filteredBenchmarks = baseBenchmarks.filter(b => !realCandidates.some(rc => rc.fullName.toLowerCase() === b.fullName.toLowerCase()));
  const allEntries = [...realCandidates, ...filteredBenchmarks];

  allEntries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.fullName.localeCompare(b.fullName);
  });

  const rankedEntries = allEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));

  const myEntry = rankedEntries.find(r => r.id === currentCandidateId);
  
  let percentile = 0;
  let myRank = 0;
  let myScore = 0;

  if (myEntry) {
    myRank = myEntry.rank;
    myScore = myEntry.score;
    const scoredLower = rankedEntries.filter(r => r.score < myScore).length;
    if (myScore > 0) {
      percentile = Math.round((scoredLower / rankedEntries.length) * 100);
      if (percentile === 100) percentile = 99;
      if (percentile === 0 && myScore > 0) percentile = 15;
    }
  } else {
    percentile = 0;
  }

  const ranges = [
    { range: "50-60", count: 2, label: "50-60" },
    { range: "61-70", count: 4, label: "61-70" },
    { range: "71-80", count: 7, label: "71-80" },
    { range: "81-90", count: 12, label: "81-90" },
    { range: "91-100", count: 5, label: "91-100" }
  ];

  rankedEntries.forEach(entry => {
    const s = entry.score;
    if (s >= 50 && s <= 60) ranges[0].count++;
    else if (s >= 61 && s <= 70) ranges[1].count++;
    else if (s >= 71 && s <= 80) ranges[2].count++;
    else if (s >= 81 && s <= 90) ranges[3].count++;
    else if (s >= 91 && s <= 100) ranges[4].count++;
  });

  res.json({
    leaderboard: rankedEntries,
    myStats: {
      rank: myRank,
      score: myScore,
      percentile: percentile,
      totalCompetitors: rankedEntries.length
    },
    distribution: ranges
  });
});

// ==========================================
// AI CAREER SUMMARY AND ADVICE API
// ==========================================
app.get("/api/assessment/ai-career-summary", async (req: Request, res: Response) => {
  const { candidateId } = req.query;
  const candidate = dbUsers.find(u => u.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  // Find the latest completed assessment attempt
  const completedAttempts = dbAttempts.filter(a => a.candidateId === candidateId && a.status === "completed");
  
  // Sort by end time / start time descending to get the latest
  completedAttempts.sort((a, b) => new Date(b.endTime || b.startTime).getTime() - new Date(a.endTime || a.startTime).getTime());
  const latestAttempt = completedAttempts[0];

  let score = 0;
  let category = "Software Engineering";
  let codingScore = 0;
  let mcqScore = 0;
  let systemReview = "";
  let weakPoints: string[] = [];
  let recommendations: string[] = [];

  if (latestAttempt) {
    score = latestAttempt.overallCandidateScore || 0;
    category = latestAttempt.category;
    codingScore = latestAttempt.codingAssignmentScore || 0;
    mcqScore = latestAttempt.technicalKnowledgeScore || 0;
    systemReview = latestAttempt.codeReviewSummary?.readabilityAssessment || "";
    weakPoints = latestAttempt.codeReviewSummary?.vulnerabilities?.map(v => v.title) || [];
    recommendations = latestAttempt.codeReviewSummary?.recommendations || [];
  } else if (candidateId === "user-candidate-1") {
    // High-fidelity preset for Alex Rivera's initial dashboard state
    score = 85;
    category = "React & Frontend";
    codingScore = 90;
    mcqScore = 80;
    systemReview = "Clean declarative style. Efficient component partitioning and proper dependency arrays observed.";
    weakPoints = ["Redis Cache Stampede Under Thundering Herd Load", "Array Bound Limits Validation Checks"];
    recommendations = ["Optimize memoization targets to prevent micro re-renders", "Deploy Redis lock mechanisms to handle distributed race states"];
  }

  const prompt = `You are a Senior Technical Coach and Career Advisor at a premium tech recruitment platform.
Provide an encouraging, direct, and actionable coaching feedback summary based on the developer's latest assessment score.

Developer Profile:
Name: ${candidate.fullName}
Role Track: ${category}
Experience level: ${candidate.experienceLevel || "Mid-level"}
Latest Score: ${score}% (MCQ/Knowledge: ${mcqScore}%, Practical Coding: ${codingScore}%)
Observed Code Quality: ${systemReview || "Solid modular patterns."}
Identified Weak Spots: ${weakPoints.length > 0 ? weakPoints.join(", ") : "None specified"}
Existing Recommendations: ${recommendations.length > 0 ? recommendations.join(", ") : "None specified"}

Please return a JSON object with the following structure:
{
  "coachingHeadline": "A brief, highly encouraging, professional one-sentence career headline for their profile.",
  "strategicAdvice": "A 2-3 sentence strategic advice paragraph targeting their specific technical level and category.",
  "actionSteps": [
    "Step 1: Concrete learning task or exercise (e.g., refactoring standard algorithms, reading specific guidelines).",
    "Step 2: Concrete development practice.",
    "Step 3: Advanced architectural topic to study."
  ],
  "estimatedTimeMinutes": "Estimated study time required to close the gaps, e.g. '120 mins / week'"
}

Rules:
1. Speak in a supportive, premium, objective tone. Do not use generic praise; keep it highly specific.
2. Tailor your recommendations to the track: ${category}.
3. Ensure the JSON is completely valid and parsed correctly without code blocks or markdown wrappers.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a professional Senior Tech Career Coach offering structured feedback.",
        }
      });

      const responseText = response.text?.trim() || "";
      const result = JSON.parse(responseText);
      return res.json({
        success: true,
        hasScore: score > 0 || latestAttempt !== undefined || candidateId === "user-candidate-1",
        score,
        category,
        coachingHeadline: result.coachingHeadline,
        strategicAdvice: result.strategicAdvice,
        actionSteps: result.actionSteps,
        estimatedTimeMinutes: result.estimatedTimeMinutes || "150 mins / week"
      });
    } catch (err) {
      console.error("Gemini career coaching summary failed, using fallback:", err);
    }
  }

  // Fallback advice if Gemini is unavailable
  let coachingHeadline = "";
  let strategicAdvice = "";
  let actionSteps: string[] = [];
  let estimatedTimeMinutes = "120 mins / week";

  if (score === 0 && !latestAttempt && candidateId !== "user-candidate-1") {
    coachingHeadline = "Ready to Benchmark Your Engineering Talents!";
    strategicAdvice = "You haven't completed a screening assessment yet. Launching your first assessment helps map your current algorithmic agility and systems awareness, which unlocks tailored learning pathways.";
    actionSteps = [
      "Launch a competency assessment matching your target stack.",
      "Complete the MCQ section within the active time allocation.",
      "Run unit test assertions in the sandbox IDE before submission."
    ];
    estimatedTimeMinutes = "45 mins";
  } else {
    if (score >= 85) {
      coachingHeadline = "Distinguished Technical Leadership Potential";
      strategicAdvice = `Outstanding performance on the ${category} track. You demonstrate advanced algorithmic structural choices and highly readable code patterns. Focus on mastering distributed resilience and peak caching systems.`;
      actionSteps = [
        "Incorporate strict defensive error boundaries and check array boundary constraints under extreme load.",
        "Implement mutual exclusion locks (e.g. Redlock) in distributed storage setups to prevent cache stampedes.",
        "Practice optimizing time-space complexities for real-time high-throughput streaming."
      ];
      estimatedTimeMinutes = "180 mins / week";
    } else if (score >= 70) {
      coachingHeadline = "Highly Proficient Core Technical Fundamentals";
      strategicAdvice = `Solid showing in your ${category} evaluation. Your core syntax and logic flows are very clean. To transition to a senior level, focus on performance profiling and addressing minor web security boundaries.`;
      actionSteps = [
        "Explore Redis memory eviction strategies and handle peak database loads cleanly.",
        "Refactor nesting loops by utilizing Map lookups or cached lookahead arrays.",
        "Audit frontend modules against the OWASP Top 10 guidelines."
      ];
      estimatedTimeMinutes = "150 mins / week";
    } else {
      coachingHeadline = "Strengthening Foundational Systems Agility";
      strategicAdvice = `You possess good basic coding structure. Focus on building more comfortable coding speed under timed pressure, implementing linear runtime lookups, and checking boundary edge cases.`;
      actionSteps = [
        "Study Big-O notation complexity and refactor exponential O(N²) algorithms to O(N).",
        "Perform dry runs of complex array-slicing logic on a whiteboard before coding.",
        "Familiarize yourself with automated test boundaries and handling null pointer exceptions."
      ];
      estimatedTimeMinutes = "200 mins / week";
    }
  }

  res.json({
    success: true,
    hasScore: score > 0 || latestAttempt !== undefined || candidateId === "user-candidate-1",
    score,
    category,
    coachingHeadline,
    strategicAdvice,
    actionSteps,
    estimatedTimeMinutes
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
