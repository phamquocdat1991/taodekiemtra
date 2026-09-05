export type SubmittedAnswers = Record<string, string>;

interface GradeQuestion {
  id: string;
  questionNumber: string | number;
  type: string;
  content: string;
  points: number;
  subQuestions?: Array<{ label: string; text: string }>;
}

interface GradeExam {
  totalPoints: number;
  parts: Array<{
    partTitle: string;
    totalPoints: number;
    questions: GradeQuestion[];
  }>;
}

interface AnswerItem {
  questionId?: string;
  questionNumber: string | number;
  correctAnswer?: string | Record<string, string>;
  solutionSummary: string;
  points: number;
}

interface GradeAnswerKey {
  totalPoints: number;
  parts: Array<{
    partTitle: string;
    items: AnswerItem[];
  }>;
}

export interface GradedQuestion {
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

export interface GradingResult {
  earnedPoints: number;
  totalPoints: number;
  objectivePoints: number;
  manualReviewPoints: number;
  scorePercent: number | null;
  manualReviewRequired: boolean;
  status: "graded" | "pending_teacher_review";
  partResults: Array<{
    partTitle: string;
    earnedPoints: number;
    totalPoints: number;
    manualReviewPoints: number;
    questions: GradedQuestion[];
  }>;
}

const round = (value: number) => Number(value.toFixed(2));

const normalized = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi");

const normalizedLabel = (value: string) =>
  normalized(value).replace(/[^a-z0-9]/g, "");

function expectedText(item: AnswerItem | undefined): string {
  if (!item) return "";
  if (typeof item.correctAnswer === "string") return item.correctAnswer;

  const choice = item.solutionSummary.trim().match(/^([A-Da-d])(?:[.\s:)]|$)/);
  return choice ? choice[1].toUpperCase() : item.solutionSummary;
}

function isManualQuestion(type: string) {
  return type === "essay" || type === "writing";
}

function excerpt(content: string) {
  const clean = content.trim();
  return clean.length > 100 ? `${clean.slice(0, 100)}…` : clean;
}

function gradeTrueFalse(
  question: GradeQuestion,
  answerItem: AnswerItem | undefined,
  submitted: SubmittedAnswers,
): GradedQuestion {
  const expected =
    answerItem?.correctAnswer && typeof answerItem.correctAnswer === "object"
      ? answerItem.correctAnswer
      : {};
  const subQuestions = question.subQuestions ?? [];
  const pointPerStatement = subQuestions.length
    ? question.points / subQuestions.length
    : 0;
  let earnedPoints = 0;
  const studentValues: Record<string, string> = {};
  const expectedValues: Record<string, string> = {};

  for (const statement of subQuestions) {
    const label = normalizedLabel(statement.label);
    const studentAnswer = submitted[`${question.id}:${label}`] ?? "";
    const correctAnswer =
      expected[statement.label] ?? expected[label] ?? expected[`${label})`] ?? "";
    studentValues[label] = studentAnswer;
    expectedValues[label] = correctAnswer;
    if (normalized(studentAnswer) && normalized(studentAnswer) === normalized(correctAnswer)) {
      earnedPoints += pointPerStatement;
    }
  }

  const roundedEarned = round(earnedPoints);
  const fullyCorrect = round(roundedEarned) === round(question.points);

  return {
    questionId: question.id,
    questionNumber: question.questionNumber,
    questionExcerpt: excerpt(question.content),
    studentAnswer: JSON.stringify(studentValues),
    correctAnswer: JSON.stringify(expectedValues),
    isCorrect: fullyCorrect,
    points: question.points,
    earnedPoints: roundedEarned,
    gradingStatus: fullyCorrect ? "correct" : "incorrect",
  };
}

function gradeQuestion(
  question: GradeQuestion,
  answerItem: AnswerItem | undefined,
  submitted: SubmittedAnswers,
): GradedQuestion {
  if (isManualQuestion(question.type)) {
    return {
      questionId: question.id,
      questionNumber: question.questionNumber,
      questionExcerpt: excerpt(question.content),
      studentAnswer: submitted[question.id] ?? "",
      correctAnswer: answerItem?.solutionSummary ?? "",
      isCorrect: null,
      points: question.points,
      earnedPoints: 0,
      gradingStatus: "pending_review",
    };
  }

  if (question.type === "trueFalse") {
    return gradeTrueFalse(question, answerItem, submitted);
  }

  const studentAnswer = submitted[question.id] ?? "";
  const correctAnswer = expectedText(answerItem);
  const isCorrect =
    normalized(studentAnswer).length > 0 &&
    normalized(studentAnswer) === normalized(correctAnswer);

  return {
    questionId: question.id,
    questionNumber: question.questionNumber,
    questionExcerpt: excerpt(question.content),
    studentAnswer,
    correctAnswer,
    isCorrect,
    points: question.points,
    earnedPoints: isCorrect ? question.points : 0,
    gradingStatus: isCorrect ? "correct" : "incorrect",
  };
}

export function gradeExamSubmission(
  exam: GradeExam,
  answerKey: GradeAnswerKey,
  submitted: SubmittedAnswers,
): GradingResult {
  const answerItems = new Map(
    answerKey.parts
      .flatMap((part) => part.items)
      .filter((item): item is AnswerItem & { questionId: string } => Boolean(item.questionId))
      .map((item) => [item.questionId, item]),
  );
  let earnedPoints = 0;
  let objectivePoints = 0;
  let manualReviewPoints = 0;

  const partResults = exam.parts.map((part) => {
    let partEarned = 0;
    let partManual = 0;
    const questions = part.questions.map((question) => {
      const graded = gradeQuestion(question, answerItems.get(question.id), submitted);
      partEarned += graded.earnedPoints;
      if (graded.gradingStatus === "pending_review") {
        partManual += question.points;
      } else {
        objectivePoints += question.points;
      }
      return graded;
    });

    earnedPoints += partEarned;
    manualReviewPoints += partManual;
    return {
      partTitle: part.partTitle,
      earnedPoints: round(partEarned),
      totalPoints: part.totalPoints,
      manualReviewPoints: round(partManual),
      questions,
    };
  });

  const requiresReview = manualReviewPoints > 0;

  return {
    earnedPoints: round(earnedPoints),
    totalPoints: exam.totalPoints,
    objectivePoints: round(objectivePoints),
    manualReviewPoints: round(manualReviewPoints),
    scorePercent: requiresReview
      ? null
      : exam.totalPoints > 0
        ? Math.round((earnedPoints / exam.totalPoints) * 100)
        : 0,
    manualReviewRequired: requiresReview,
    status: requiresReview ? "pending_teacher_review" : "graded",
    partResults,
  };
}
