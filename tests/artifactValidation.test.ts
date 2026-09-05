import assert from "node:assert/strict";
import test from "node:test";

import { defaultPresets } from "../src/data/defaultTemplates.ts";
import {
  assertAnswersValid,
  assertDetailGuideValid,
  assertExamValid,
  assertMatrixValid,
  validateMatrixArtifact,
} from "../src/lib/artifactValidation.ts";
import type {
  AnswerData,
  ExamData,
  MatrixData,
  SpecificationData,
} from "../src/types.ts";

const khtnConfig = structuredClone(
  defaultPresets.find((preset) => preset.id === "preset-khtn-8")!.state,
);

const validMatrix: MatrixData = {
  title: "MA TRẬN ĐỀ KIỂM TRA KHOA HỌC TỰ NHIÊN 8",
  rows: [
    {
      stt: 1,
      topic: "Hóa học",
      knowledgeUnit: "Phản ứng hóa học",
      questionType: "Trắc nghiệm nhiều lựa chọn",
      nb: 8,
      th: 4,
      vd: 4,
      vdc: 0,
      totalQuestions: 16,
      totalPoints: 4,
      percent: 40,
    },
    {
      stt: 2,
      topic: "Vật lí",
      knowledgeUnit: "Khối lượng riêng và áp suất",
      questionType: "Tự luận",
      nb: 1,
      th: 1,
      vd: 1,
      vdc: 1,
      totalQuestions: 4,
      totalPoints: 6,
      percent: 60,
    },
  ],
  summary: {
    totalNb: 9,
    totalTh: 5,
    totalVd: 5,
    totalVdc: 1,
    totalQuestions: 20,
    totalPoints: 10,
    totalPercent: 100,
  },
};

const validSpec: SpecificationData = {
  title: "BẢN ĐẶC TẢ KHOA HỌC TỰ NHIÊN 8",
  rows: Array.from({ length: 20 }, (_, index) => ({
    questionNumber: `Câu ${index + 1}`,
    topic: index < 16 ? "Hóa học" : "Vật lí",
    knowledgeUnit: index < 16 ? "Phản ứng hóa học" : "Áp suất",
    level: "Nhận biết" as const,
    objective: "Đánh giá đúng nội dung kiến thức.",
    estimatedTime: 3,
    points: index < 16 ? 0.25 : 1.5,
  })),
  totalTime: 60,
  totalPoints: 10,
};

const validExam: ExamData = {
  header: {
    department: "PHÒNG GD&ĐT CẦU GIẤY",
    schoolName: "TRƯỜNG THCS CẦU GIẤY",
    examTitle: "ĐỀ KIỂM TRA CUỐI KÌ 1",
    subject: "Khoa học tự nhiên",
    grade: "Lớp 8",
    duration: 60,
    schoolYear: "2025 - 2026",
  },
  totalPoints: 10,
  parts: [
    {
      partTitle: "PHẦN I. TRẮC NGHIỆM",
      description: "Chọn một đáp án đúng.",
      totalPoints: 4,
      questions: Array.from({ length: 16 }, (_, index) => ({
        id: `mc-${index + 1}`,
        questionNumber: index + 1,
        type: "multipleChoice" as const,
        content: `Câu hỏi Hóa học ${index + 1}`,
        options: [
          { key: "A", text: "Phương án A" },
          { key: "B", text: "Phương án B" },
          { key: "C", text: "Phương án C" },
          { key: "D", text: "Phương án D" },
        ],
        points: 0.25,
      })),
    },
    {
      partTitle: "PHẦN II. TỰ LUẬN",
      description: "Trình bày lời giải.",
      totalPoints: 6,
      questions: Array.from({ length: 4 }, (_, index) => ({
        id: `essay-${index + 1}`,
        questionNumber: index + 17,
        type: "essay" as const,
        content: `Bài tập Vật lí ${index + 1}`,
        points: 1.5,
      })),
    },
  ],
};

test("ma trận hợp lệ khi tổng hàng và summary khớp cấu hình", () => {
  assert.equal(validateMatrixArtifact(khtnConfig, validMatrix).length, 0);
  assert.doesNotThrow(() => assertMatrixValid(khtnConfig, validMatrix));
});

test("phát hiện summary ghi 10 điểm trong khi các hàng chỉ có 7 điểm", () => {
  const matrix = structuredClone(validMatrix);
  matrix.rows[1].totalPoints = 3;
  matrix.rows[1].percent = 30;

  const errors = validateMatrixArtifact(khtnConfig, matrix);

  assert.ok(errors.some((error) => error.code === "MATRIX_POINTS"));
  assert.ok(errors.some((error) => error.code === "MATRIX_PERCENT"));
  assert.throws(() => assertMatrixValid(khtnConfig, matrix), /ma trận/i);
});

test("phát hiện đề sai môn hoặc sai lớp so với cấu hình", () => {
  const exam = structuredClone(validExam);
  exam.header.subject = "Toán";
  exam.header.grade = "Lớp 10";

  assert.throws(
    () => assertExamValid(khtnConfig, validMatrix, validSpec, exam),
    /môn học|lớp/i,
  );
});

test("phát hiện ID câu hỏi bị trùng giữa các phần", () => {
  const exam = structuredClone(validExam);
  exam.parts[1].questions[0].id = exam.parts[0].questions[0].id;

  assert.throws(
    () => assertExamValid(khtnConfig, validMatrix, validSpec, exam),
    /ID câu hỏi/i,
  );
});

test("đáp án phải ánh xạ đủ 20 câu bằng questionId", () => {
  const answers: AnswerData = {
    title: "ĐÁP ÁN",
    totalPoints: 10,
    parts: validExam.parts.map((part) => ({
      partTitle: part.partTitle,
      items: part.questions.map((question) => ({
        questionId: question.id,
        questionNumber: question.questionNumber,
        correctAnswer: question.type === "multipleChoice" ? "A" : undefined,
        solutionSummary: question.type === "multipleChoice" ? "A" : "Lời giải",
        points: question.points,
      })),
    })),
  };

  assert.doesNotThrow(() => assertAnswersValid(validExam, answers));

  answers.parts[1].items[0].questionId = "khong-ton-tai";
  assert.throws(() => assertAnswersValid(validExam, answers), /ánh xạ đáp án/i);
});

test("câu khách quan phải có correctAnswer máy đọc được", () => {
  const answers: AnswerData = {
    title: "ĐÁP ÁN",
    totalPoints: 10,
    parts: validExam.parts.map((part) => ({
      partTitle: part.partTitle,
      items: part.questions.map((question) => ({
        questionId: question.id,
        questionNumber: question.questionNumber,
        correctAnswer: question.type === "multipleChoice" ? "A" : undefined,
        solutionSummary: question.type === "multipleChoice" ? "A" : "Lời giải",
        points: question.points,
      })),
    })),
  };
  delete answers.parts[0].items[0].correctAnswer;

  assert.throws(() => assertAnswersValid(validExam, answers), /correctAnswer/);
});

test("rubric tự luận phải đủ tiêu chí và khớp điểm tối đa", () => {
  const detail = {
    title: "HƯỚNG DẪN",
    items: validExam.parts.flatMap((part) =>
      part.questions.map((question) => ({
        questionId: question.id,
        questionNumber: question.questionNumber,
        questionExcerpt: question.content,
        answer: "Đáp án",
        detailedSolution: "Lời giải",
        knowledgeUsed: "Kiến thức",
        rubric: question.type === "essay"
          ? [{ criterion: "Lập luận", points: question.points }]
          : [],
      })),
    ),
  };

  assert.doesNotThrow(() => assertDetailGuideValid(validExam, detail));
  detail.items.find((item) => item.questionId === "essay-1")!.rubric[0].points = 1;
  assert.throws(() => assertDetailGuideValid(validExam, detail), /rubric/i);
});
