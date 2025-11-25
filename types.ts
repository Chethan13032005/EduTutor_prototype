
export type InputType = 'topic' | 'text' | 'image' | 'document';

export interface InputContext {
  type: InputType;
  content: string | File;
}

export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution: string;
  xp?: number; // For gamification
  level?: number; // For gamification
}

// For the user creation/edit form
export type UserFormData = Omit<User, 'id' | 'institution' | 'xp' | 'level'>;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model' | 'system';
  text: string;
  isThinking?: boolean;
  isInProgress?: boolean; // Flag for streaming transcription
  sources?: { title: string; uri: string }[];
}


export enum AppState {
  LOGIN,
  // Admin States
  ADMIN_DASHBOARD,
  // Teacher States
  TEACHER_DASHBOARD,
  TEACHER_AI_HELPER,
  // Student States
  STUDENT_DASHBOARD,
  STUDENT_AI_TUTOR,
  TAKING_QUIZ,
  GRADING,
  RESULTS,
}

// --- Quiz Generation Config ---
export type QuizDifficulty = 'Easy' | 'Moderate' | 'Hard';

export interface QuizConfig {
    title?: string; // Optional user-provided title
    mcqCount: number;
    shortAnswerCount: number;
    mcqChoices: number;
    difficulty: QuizDifficulty;
}

// --- Quiz Structure ---
export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // Index of correct option
  explanation: string; // Reasoning for why it is correct
}

export interface ShortAnswerQuestion {
  id: string;
  question: string;
  modelAnswer: string; // Ideal answer for teacher reference
  explanation: string; // Key concepts to look for
}

export interface Quiz {
  title?: string; // AI generated or User provided title
  mcqs: MCQ[];
  shortAnswerQuestions: ShortAnswerQuestion[];
}

// --- Stored Data Structure ---
export interface StoredQuiz {
  id: string; // Unique code for students
  teacherId: string;
  title: string; // The final title used for display
  quiz: Quiz;
  context: InputContext;
  createdAt: string;
  difficulty?: QuizDifficulty; // Added for dashboard display
}

export interface StoredSubmission {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  results: GradedResults;
  submittedAt: string;
}

// --- User Interaction ---
export interface UserAnswers {
  [questionId: string]: string | number; // number for MCQ option index, string for short answer
}

// --- Grading & Results ---
export interface GradedMCQ extends MCQ {
  userAnswerIndex: number;
  isCorrect: boolean;
  feedback: string;
}

export interface GradedShortAnswer extends ShortAnswerQuestion {
  userAnswer: string;
  feedback: string;
  score: number; // out of 5
}

export interface GradedResults {
  mcqResults: GradedMCQ[];
  shortAnswerResults: GradedShortAnswer[];
  overallFeedback: string;
  scorePercentage: number;
  strengths: string[]; // New: List of strong concepts
  topicsToStudy: string[]; // Weak concepts
  studyPlan?: string[]; // Specific actionable tips
}
