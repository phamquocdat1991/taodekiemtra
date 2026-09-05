export type EducationLevel = "Tiểu học" | "Cấp 2 (THCS)" | "Cấp 3 (THPT)";

export type ExamType =
  | "Kiểm tra thường xuyên"
  | "Giữa kì 1"
  | "Cuối kì 1"
  | "Giữa kì 2"
  | "Cuối kì 2"
  | "Tùy chỉnh";

export type Textbook =
  | "Bộ sách hiện hành"
  | "Kết nối tri thức với cuộc sống"
  | "Cánh Diều"
  | "Chân trời sáng tạo"
  | "Tùy chỉnh";

export type ExamDifficulty = "Dễ" | "Trung bình" | "Khá" | "Khó";

export interface GeneralConfig {
  department: string;
  schoolName: string;
  examType: ExamType;
  customExamType?: string;
  educationLevel: EducationLevel;
  grade: string;
  subject: string;
  textbook: Textbook;
  customTextbook?: string;
  duration: number; // phút
}

export interface CognitionLevels {
  nb: number; // Nhận biết
  th: number; // Thông hiểu
  vd: number; // Vận dụng
  vdc: number; // Vận dụng cao
  difficulty: ExamDifficulty;
}

export interface KnowledgeInput {
  content: string;
  attachmentName: string | null;
  attachmentSize: string | null;
  attachmentContent: string | null;
  additionalRequirements: string;
}

export interface QuestionRow {
  count: number;
  percent: number;
  points: number;
}

export interface StandardQuestionStructure {
  multipleChoice: QuestionRow;
  trueFalse: QuestionRow;
  shortAnswer: QuestionRow;
  essay: QuestionRow;
}

export interface LanguageQuestionStructure {
  listening: QuestionRow;
  languageFocus: QuestionRow;
  reading: QuestionRow;
  writing: QuestionRow;
}

export interface LiteratureQuestionStructure {
  preset: "6/4" | "5/5" | "custom";
  readingComprehension: QuestionRow;
  writingComposition: QuestionRow;
}

export type SubjectStructureType = "standard" | "language" | "literature";

export interface QuestionStructureState {
  type: SubjectStructureType;
  standard: StandardQuestionStructure;
  language: LanguageQuestionStructure;
  literature: LiteratureQuestionStructure;
}

export interface FullExamState {
  general: GeneralConfig;
  cognition: CognitionLevels;
  knowledge: KnowledgeInput;
  structure: QuestionStructureState;
}

// Step 1: Ma trận (Matrix)
export interface MatrixRow {
  stt: number;
  topic: string;
  knowledgeUnit: string;
  questionType: string;
  nb: number;
  th: number;
  vd: number;
  vdc: number;
  totalQuestions: number;
  totalPoints: number;
  percent: number;
}

export interface MatrixData {
  title: string;
  rows: MatrixRow[];
  summary: {
    totalNb: number;
    totalTh: number;
    totalVd: number;
    totalVdc: number;
    totalQuestions: number;
    totalPoints: number;
    totalPercent: number;
  };
}

// Step 2: Bản đặc tả (Specification)
export interface SpecificationRow {
  questionNumber: string;
  topic: string;
  knowledgeUnit: string;
  level: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";
  objective: string;
  estimatedTime: number;
  points: number;
}

export interface SpecificationData {
  title: string;
  rows: SpecificationRow[];
  totalTime: number;
  totalPoints: number;
}

// Step 3: Đề thi (Exam)
export interface ExamOption {
  key: string;
  text: string;
}

export interface SubQuestion {
  label: string; // a, b, c, d
  text: string;
}

export interface ExamQuestion {
  id: string;
  questionNumber: string | number;
  type: "multipleChoice" | "trueFalse" | "shortAnswer" | "essay" | "listening" | "language" | "reading" | "writing";
  content: string;
  passage?: string;
  options?: ExamOption[];
  subQuestions?: SubQuestion[];
  points: number;
}

export interface ExamPart {
  partTitle: string;
  description: string;
  passage?: string;
  totalPoints: number;
  questions: ExamQuestion[];
}

export interface ExamData {
  header: {
    department: string;
    schoolName: string;
    examTitle: string;
    subject: string;
    grade: string;
    duration: number;
    schoolYear: string;
  };
  parts: ExamPart[];
  totalPoints: number;
}

// Step 4: Đáp án (Answer Key)
export interface AnswerItem {
  questionId?: string;
  questionNumber: string | number;
  correctAnswer?: string | Record<string, string>;
  solutionSummary: string;
  points: number;
  note?: string;
}

export interface AnswerPart {
  partTitle: string;
  items: AnswerItem[];
}

export interface AnswerData {
  title: string;
  parts: AnswerPart[];
  totalPoints: number;
}

// Step 5: Hướng dẫn giải chi tiết (Detailed Guide)
export interface DetailGuideItem {
  questionId?: string;
  questionNumber: string | number;
  questionExcerpt: string;
  answer: string;
  detailedSolution: string;
  knowledgeUsed: string;
  trapAnalysis?: string;      // Bẫy tư duy và lỗ hổng nhận thức thường gặp
  commonMistakes?: string;
  rubric?: Array<{ criterion: string; points: number }>;
}

export interface DetailGuideData {
  title: string;
  items: DetailGuideItem[];
}

// Workflow Status
export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: number[];
  matrix: MatrixData | null;
  specification: SpecificationData | null;
  exam: ExamData | null;
  answers: AnswerData | null;
  detail: DetailGuideData | null;
  isGenerating: boolean;
  generatingStep: WorkflowStep | null;
  autoMode: boolean;
  autoCountdown: number | null;
  autoPaused: boolean;
  error: string | null;
}

export interface ConfigPreset {
  id: string;
  name: string;
  createdAt: string;
  config: FullExamState;
}

// ─── Phase 2: Online Exam Room ────────────────────────────────────────────────

export interface OnlineRoom {
  id?: string;
  pin: string;
  createdAt: number;           // timestamp ms
  expiresAt: number;           // timestamp ms (createdAt + duration * 60000)
  config: FullExamState;
  exam: ExamData;
  status?: "draft" | "open" | "closed" | "expired";
  answers?: AnswerData;
  detail?: DetailGuideData | null;
  attemptId?: string;
  attemptToken?: string;
}

// student answers: { questionId -> answer string }
export type StudentAnswerMap = Record<string, string>;

export interface QuestionResult {
  questionId: string;
  questionNumber: string | number;
  questionExcerpt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  points: number;
  earnedPoints: number;
  gradingStatus: "correct" | "incorrect" | "pending_review" | "reviewed";
  teacherComment?: string;
}

export interface ExamResult {
  pin: string;
  submittedAt: number;
  totalPoints: number;
  earnedPoints: number;
  scorePercent: number | null;
  manualReviewPoints?: number;
  manualReviewRequired?: boolean;
  status?: "graded" | "pending_teacher_review";
  partResults: Array<{
    partTitle: string;
    earnedPoints: number;
    totalPoints: number;
    manualReviewPoints?: number;
    questions: QuestionResult[];
  }>;
}
