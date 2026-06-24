/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User and Auth Definitions
export enum UserRole {
  CANDIDATE = "CANDIDATE",
  RECRUITER = "RECRUITER",
  ADMIN = "ADMIN"
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  mfaEnabled: boolean;
  mfaVerified?: boolean;
  
  // Candidate details
  location?: string;
  contactNumber?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  currentRole?: string;
  experienceLevel?: "junior" | "mid" | "senior" | "advanced"; // Junior (0-2y), Mid (2-5y), Senior (5-10y), Advanced (10y+)
  yearsOfExperience?: number;
  skills?: string[];
  certifications?: string[];
  employmentHistory?: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  
  // Recruiter / Org details
  companyName?: string;
  subscriptionPlan: "basic" | "professional" | "enterprise";
  subscriptionActive: boolean;
  subscriptionExpires?: string;
  invitedRecruiters?: { email: string; role: string; addedAt: string }[];
  dailySearchQuotaUsed: number;
}

// Subscription Config
export interface SubscriptionTier {
  id: "basic" | "professional" | "enterprise";
  name: string;
  price: string;
  features: string[];
  searchLimit: string;
  hasAnalytics: boolean;
  hasWhiteLabel: boolean;
  hasDedicatedSupport: boolean;
}

// Question Bank Definitions
export type QuestionType = "mcq" | "multiselect" | "boolean" | "fill_in_blank" | "scenario" | "coding";

export interface CodingTestCases {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: "junior" | "mid" | "senior" | "advanced";
  category: "Full Stack Development" | "Front-End Development" | "Back-End Development" | "UI/UX Development" | "Quality Assurance" | "Software Project Management";
  technologyStack: string[];
  title: string;
  description: string;
  options?: string[]; // MCQs or Multi-selects
  correctAnswer: string | string[]; // Can be string, array of strings for multi, or boolean/regex for fill-in
  explanation: string;
  weightage: number; // e.g., points (10, 20, 30)
  timeAllocation: number; // in seconds
  tags: string[];
  
  // Coding Specific
  codingPrompt?: string;
  starterCode?: { [language: string]: string };
  testCases?: CodingTestCases[];
}

// Assessment Delivery & Proctoring Definitions
export interface ProctoringLog {
  timestamp: string;
  eventType: "tab_switch" | "fullscreen_exit" | "copy_paste_attempt" | "resize" | "webcam_warning";
  details: string;
}

export interface AssessmentAttempt {
  id: string;
  candidateId: string;
  candidateName: string;
  category: Question["category"];
  difficulty: Question["difficulty"];
  startTime: string;
  endTime?: string;
  timeSpentSeconds: number;
  status: "initiated" | "ongoing" | "submitted" | "completed";
  isPractice?: boolean;
  
  // Assessment Delivery Set
  questions: Question[];
  currentQuestionIndex: number;
  answers: { [questionId: string]: string | string[] }; // user selections/code
  timeSpentPerQuestion: { [questionId: string]: number }; // tracks time per item
  
  // Coding Exercise specific states
  selectedLanguage?: string;
  codingCode?: string;
  codingOutput?: string;
  codingTestsPassedCount?: number;
  codingTestsTotalCount?: number;
  codingConsoleHistory?: { timestamp: string; input: string; output: string; success: boolean }[];
  
  // Proctoring Metrics
  proctoringLogs: ProctoringLog[];
  integrityScore: number; // 0-100 (reduced for violations)
  
  // Scorecard Outputs
  technicalKnowledgeScore?: number; // 0-100 (MCQs component, 40% weight)
  codingAssignmentScore?: number;  // 0-100 (Unit test success, 40% weight)
  codeReviewScore?: number;        // 0-100 (AI review score, 20% weight)
  overallCandidateScore?: number;  // 0-100 weighted
  skillRatingLevel?: "Expert" | "Advanced" | "Proficient" | "Intermediate" | "Needs Improvement";
  
  // AI Code Review Summary
  codeReviewSummary?: AICodeReviewResult;
  certificateId?: string;
}

// AI Code Review Structs
export interface AICodeReviewResult {
  codeQualityScore: number;     // 0-100
  securityScore: number;        // 0-100
  maintainabilityScore: number; // 0-100
  overallEngineeringScore: number; // 0-100
  complexityAnalysis: string;   // Cyclomatic or Time complexity review
  vulnerabilities: { severity: "low" | "medium" | "high"; title: string; desc: string; fix: string }[];
  recommendations: string[];
  readabilityAssessment: string;
}

// Certificate registry
export interface DigitalCertificate {
  id: string;
  candidateId: string;
  candidateName: string;
  technologyArea: string;
  assessmentDate: string;
  score: number;
  validityPeriod: string; // e.g. "2 Years"
  verificationQrCode: string; // QR Base64 or metadata string
  verificationHash: string; // Sha-like lookup hash
}

// Org recruitment search states
export interface CandidateSearchFilter {
  skill: string;
  technology: string;
  experience: string;
  minScore: number;
  location: string;
  certifiedOnly: boolean;
}
