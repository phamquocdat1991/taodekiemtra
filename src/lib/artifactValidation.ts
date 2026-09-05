import type {
  AnswerData,
  DetailGuideData,
  ExamData,
  FullExamState,
  MatrixData,
  SpecificationData,
} from "../types.ts";
import { validateExamConfig } from "./examValidation.ts";

export type ArtifactValidationCode =
  | "CONFIG_INVALID"
  | "MATRIX_EMPTY"
  | "MATRIX_QUESTIONS"
  | "MATRIX_POINTS"
  | "MATRIX_PERCENT"
  | "MATRIX_SUMMARY"
  | "SPEC_QUESTIONS"
  | "SPEC_POINTS"
  | "SPEC_DURATION"
  | "EXAM_SUBJECT"
  | "EXAM_GRADE"
  | "EXAM_DURATION"
  | "EXAM_QUESTIONS"
  | "EXAM_POINTS"
  | "EXAM_QUESTION_ID"
  | "ANSWER_MAPPING"
  | "ANSWER_CORRECT_VALUE"
  | "ANSWER_POINTS"
  | "DETAIL_MAPPING"
  | "DETAIL_RUBRIC";

export interface ArtifactValidationIssue {
  code: ArtifactValidationCode;
  message: string;
}

export class ArtifactValidationError extends Error {
  readonly issues: ArtifactValidationIssue[];

  constructor(stage: string, issues: ArtifactValidationIssue[]) {
    super(`${stage} không hợp lệ: ${issues.map((issue) => issue.message).join(" ")}`);
    this.name = "ArtifactValidationError";
    this.issues = issues;
  }
}

const numberSum = (values: number[]) =>
  Number(values.reduce((total, value) => total + Number(value || 0), 0).toFixed(2));

const sameNumber = (left: number, right: number) => Math.abs(left - right) < 0.001;

const normalized = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

function pushIf(
  issues: ArtifactValidationIssue[],
  condition: boolean,
  code: ArtifactValidationCode,
  message: string,
) {
  if (condition) issues.push({ code, message });
}

export function validateMatrixArtifact(
  config: FullExamState,
  matrix: MatrixData,
): ArtifactValidationIssue[] {
  const issues: ArtifactValidationIssue[] = [];
  const configValidation = validateExamConfig(config);
  const rowQuestionCount = numberSum(matrix.rows?.map((row) => row.totalQuestions) ?? []);
  const rowPoints = numberSum(matrix.rows?.map((row) => row.totalPoints) ?? []);
  const rowPercent = numberSum(matrix.rows?.map((row) => row.percent) ?? []);

  pushIf(
    issues,
    !configValidation.isValid,
    "CONFIG_INVALID",
    "Cấu hình nguồn chưa hợp lệ.",
  );
  pushIf(issues, !matrix.rows?.length, "MATRIX_EMPTY", "Ma trận không có hàng dữ liệu.");
  pushIf(
    issues,
    rowQuestionCount !== configValidation.structure.totalCount,
    "MATRIX_QUESTIONS",
    `Số câu trong ma trận (${rowQuestionCount}) không khớp cấu hình (${configValidation.structure.totalCount}).`,
  );
  pushIf(
    issues,
    !sameNumber(rowPoints, 10),
    "MATRIX_POINTS",
    `Tổng điểm các hàng ma trận phải bằng 10, hiện tại là ${rowPoints}.`,
  );
  pushIf(
    issues,
    !sameNumber(rowPercent, 100),
    "MATRIX_PERCENT",
    `Tổng tỷ lệ các hàng ma trận phải bằng 100%, hiện tại là ${rowPercent}%.`,
  );

  const summaryMismatch =
    !matrix.summary ||
    matrix.summary.totalQuestions !== rowQuestionCount ||
    !sameNumber(matrix.summary.totalPoints, rowPoints) ||
    !sameNumber(matrix.summary.totalPercent, rowPercent) ||
    matrix.summary.totalNb !== numberSum(matrix.rows.map((row) => row.nb)) ||
    matrix.summary.totalTh !== numberSum(matrix.rows.map((row) => row.th)) ||
    matrix.summary.totalVd !== numberSum(matrix.rows.map((row) => row.vd)) ||
    matrix.summary.totalVdc !== numberSum(matrix.rows.map((row) => row.vdc));
  pushIf(
    issues,
    summaryMismatch,
    "MATRIX_SUMMARY",
    "Dòng tổng kết ma trận không khớp dữ liệu các hàng.",
  );

  return issues;
}

export function assertMatrixValid(config: FullExamState, matrix: MatrixData): void {
  const issues = validateMatrixArtifact(config, matrix);
  if (issues.length) throw new ArtifactValidationError("Ma trận", issues);
}

export function validateSpecificationArtifact(
  config: FullExamState,
  matrix: MatrixData,
  specification: SpecificationData,
): ArtifactValidationIssue[] {
  const issues: ArtifactValidationIssue[] = [];
  const expectedQuestions = matrix.summary.totalQuestions;
  const rowPoints = numberSum(specification.rows?.map((row) => row.points) ?? []);

  pushIf(
    issues,
    specification.rows?.length !== expectedQuestions,
    "SPEC_QUESTIONS",
    `Bản đặc tả phải có ${expectedQuestions} câu, hiện tại có ${specification.rows?.length ?? 0}.`,
  );
  pushIf(
    issues,
    !sameNumber(rowPoints, 10) || !sameNumber(specification.totalPoints, rowPoints),
    "SPEC_POINTS",
    `Tổng điểm bản đặc tả không khớp 10 điểm (hiện tại ${rowPoints}).`,
  );
  pushIf(
    issues,
    specification.totalTime !== config.general.duration,
    "SPEC_DURATION",
    "Thời gian bản đặc tả không khớp cấu hình.",
  );

  return issues;
}

export function assertSpecificationValid(
  config: FullExamState,
  matrix: MatrixData,
  specification: SpecificationData,
): void {
  const issues = validateSpecificationArtifact(config, matrix, specification);
  if (issues.length) throw new ArtifactValidationError("Bản đặc tả", issues);
}

export function validateExamArtifact(
  config: FullExamState,
  matrix: MatrixData,
  specification: SpecificationData,
  exam: ExamData,
): ArtifactValidationIssue[] {
  const issues: ArtifactValidationIssue[] = [];
  const questions = exam.parts?.flatMap((part) => part.questions ?? []) ?? [];
  const ids = questions.map((question) => question.id?.trim()).filter(Boolean);
  const questionPoints = numberSum(questions.map((question) => question.points));
  const partPoints = numberSum(exam.parts?.map((part) => part.totalPoints) ?? []);

  pushIf(
    issues,
    normalized(exam.header?.subject ?? "") !== normalized(config.general.subject),
    "EXAM_SUBJECT",
    `Môn học trong đề (${exam.header?.subject || "trống"}) không khớp cấu hình (${config.general.subject}).`,
  );
  pushIf(
    issues,
    normalized(exam.header?.grade ?? "") !== normalized(config.general.grade),
    "EXAM_GRADE",
    `Lớp trong đề (${exam.header?.grade || "trống"}) không khớp cấu hình (${config.general.grade}).`,
  );
  pushIf(
    issues,
    exam.header?.duration !== config.general.duration,
    "EXAM_DURATION",
    "Thời gian trong đề không khớp cấu hình.",
  );
  pushIf(
    issues,
    questions.length !== matrix.summary.totalQuestions ||
      questions.length !== specification.rows.length,
    "EXAM_QUESTIONS",
    `Số câu trong đề (${questions.length}) không khớp ma trận/đặc tả.`,
  );
  pushIf(
    issues,
    !sameNumber(questionPoints, 10) ||
      !sameNumber(partPoints, questionPoints) ||
      !sameNumber(exam.totalPoints, questionPoints),
    "EXAM_POINTS",
    `Tổng điểm câu hỏi, từng phần và toàn đề phải cùng bằng 10 (hiện tại ${questionPoints}).`,
  );
  pushIf(
    issues,
    ids.length !== questions.length || new Set(ids).size !== ids.length,
    "EXAM_QUESTION_ID",
    "Mỗi câu phải có ID câu hỏi duy nhất trên toàn đề.",
  );

  return issues;
}

export function assertExamValid(
  config: FullExamState,
  matrix: MatrixData,
  specification: SpecificationData,
  exam: ExamData,
): void {
  const issues = validateExamArtifact(config, matrix, specification, exam);
  if (issues.length) throw new ArtifactValidationError("Đề thi", issues);
}

export function validateAnswersArtifact(
  exam: ExamData,
  answers: AnswerData,
): ArtifactValidationIssue[] {
  const issues: ArtifactValidationIssue[] = [];
  const examQuestions = exam.parts.flatMap((part) => part.questions);
  const answerItems = answers.parts?.flatMap((part) => part.items ?? []) ?? [];
  const examIds = examQuestions.map((question) => question.id);
  const answerIds = answerItems.map((item) => item.questionId).filter(Boolean) as string[];
  const expected = new Set(examIds);
  const actual = new Set(answerIds);
  const mappingInvalid =
    answerIds.length !== examIds.length ||
    actual.size !== answerIds.length ||
    examIds.some((id) => !actual.has(id)) ||
    answerIds.some((id) => !expected.has(id));

  pushIf(
    issues,
    mappingInvalid,
    "ANSWER_MAPPING",
    "Ánh xạ đáp án phải chứa đúng một mục cho mỗi questionId của đề.",
  );

  const answersById = new Map(answerItems.map((item) => [item.questionId, item]));
  const hasUnreadableObjectiveAnswer = examQuestions.some((question) => {
    if (question.type === "essay" || question.type === "writing") return false;
    const correctAnswer = answersById.get(question.id)?.correctAnswer;
    if (question.type === "trueFalse") {
      return !correctAnswer || typeof correctAnswer !== "object" || !Object.keys(correctAnswer).length;
    }
    return typeof correctAnswer !== "string" || !correctAnswer.trim();
  });
  pushIf(
    issues,
    hasUnreadableObjectiveAnswer,
    "ANSWER_CORRECT_VALUE",
    "Mỗi câu khách quan phải có trường correctAnswer máy đọc được.",
  );

  const itemPoints = numberSum(answerItems.map((item) => item.points));
  pushIf(
    issues,
    !sameNumber(itemPoints, exam.totalPoints) ||
      !sameNumber(answers.totalPoints, itemPoints),
    "ANSWER_POINTS",
    "Tổng điểm đáp án không khớp tổng điểm đề thi.",
  );

  return issues;
}

export function assertAnswersValid(exam: ExamData, answers: AnswerData): void {
  const issues = validateAnswersArtifact(exam, answers);
  if (issues.length) throw new ArtifactValidationError("Đáp án", issues);
}

export function validateDetailGuideArtifact(
  exam: ExamData,
  detail: DetailGuideData,
): ArtifactValidationIssue[] {
  const examIds = new Set(
    exam.parts.flatMap((part) => part.questions.map((question) => question.id)),
  );
  const detailIds = detail.items.map((item) => item.questionId).filter(Boolean) as string[];
  const valid =
    detailIds.length === examIds.size &&
    new Set(detailIds).size === detailIds.length &&
    detailIds.every((id) => examIds.has(id));

  const issues: ArtifactValidationIssue[] = [];
  pushIf(
    issues,
    !valid,
    "DETAIL_MAPPING",
    "Hướng dẫn giải phải ánh xạ đúng một mục cho mỗi questionId của đề.",
  );

  const detailById = new Map(detail.items.map((item) => [item.questionId, item]));
  const invalidRubric = exam.parts
    .flatMap((part) => part.questions)
    .filter((question) => question.type === "essay" || question.type === "writing")
    .some((question) => {
      const rubric = detailById.get(question.id)?.rubric;
      return !rubric?.length || !sameNumber(numberSum(rubric.map((row) => row.points)), question.points);
    });
  pushIf(
    issues,
    invalidRubric,
    "DETAIL_RUBRIC",
    "Rubric của mỗi câu tự luận phải có tiêu chí và tổng điểm khớp điểm tối đa của câu.",
  );

  return issues;
}

export function assertDetailGuideValid(exam: ExamData, detail: DetailGuideData): void {
  const issues = validateDetailGuideArtifact(exam, detail);
  if (issues.length) throw new ArtifactValidationError("Hướng dẫn giải", issues);
}
