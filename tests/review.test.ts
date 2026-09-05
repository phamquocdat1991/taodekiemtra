import assert from "node:assert/strict";
import test from "node:test";

import { finalizeTeacherReview } from "../supabase/functions/_shared/review.ts";

const pendingResult = {
  earnedPoints: 3,
  totalPoints: 10,
  objectivePoints: 6,
  manualReviewPoints: 4,
  scorePercent: null,
  manualReviewRequired: true,
  status: "pending_teacher_review" as const,
  partResults: [
    {
      partTitle: "Trắc nghiệm",
      earnedPoints: 3,
      totalPoints: 6,
      manualReviewPoints: 0,
      questions: [
        {
          questionId: "q1",
          questionNumber: 1,
          questionExcerpt: "Chọn đáp án đúng",
          studentAnswer: "A",
          correctAnswer: "A",
          isCorrect: true,
          points: 3,
          earnedPoints: 3,
          gradingStatus: "correct" as const,
        },
      ],
    },
    {
      partTitle: "Tự luận",
      earnedPoints: 0,
      totalPoints: 4,
      manualReviewPoints: 4,
      questions: [
        {
          questionId: "essay-1",
          questionNumber: 2,
          questionExcerpt: "Trình bày lời giải",
          studentAnswer: "Bài làm",
          correctAnswer: "Rubric",
          isCorrect: null,
          points: 4,
          earnedPoints: 0,
          gradingStatus: "pending_review" as const,
        },
      ],
    },
  ],
};

test("giáo viên xác nhận điểm tự luận để tạo điểm cuối cùng", () => {
  const result = finalizeTeacherReview(pendingResult, [
    { questionId: "essay-1", points: 3.5, comment: "Lập luận đúng, thiếu kết luận." },
  ]);

  assert.equal(result.earnedPoints, 6.5);
  assert.equal(result.scorePercent, 65);
  assert.equal(result.manualReviewRequired, false);
  assert.equal(result.status, "graded");
  assert.equal(result.partResults[1].questions[0].gradingStatus, "reviewed");
});

test("không cho AI hoặc giáo viên chấm quá số điểm của câu", () => {
  assert.throws(
    () =>
      finalizeTeacherReview(pendingResult, [
        { questionId: "essay-1", points: 4.5, comment: "" },
      ]),
    /từ 0 đến 4/,
  );
});

test("bắt buộc giáo viên duyệt đủ mọi câu tự luận", () => {
  assert.throws(() => finalizeTeacherReview(pendingResult, []), /chưa được duyệt/);
});

test("không cho duyệt trùng một câu", () => {
  assert.throws(
    () =>
      finalizeTeacherReview(pendingResult, [
        { questionId: "essay-1", points: 3, comment: "" },
        { questionId: "essay-1", points: 2, comment: "" },
      ]),
    /bị trùng/,
  );
});
