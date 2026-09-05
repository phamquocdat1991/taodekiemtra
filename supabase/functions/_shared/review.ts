import type { GradingResult } from "./grading.ts";

export interface TeacherQuestionReview {
  questionId: string;
  points: number;
  comment: string;
}

const round = (value: number) => Number(value.toFixed(2));

export function finalizeTeacherReview(
  pendingResult: GradingResult,
  reviews: TeacherQuestionReview[],
): GradingResult {
  const reviewsByQuestion = new Map<string, TeacherQuestionReview>();

  for (const review of reviews) {
    if (reviewsByQuestion.has(review.questionId)) {
      throw new Error(`Câu ${review.questionId} bị trùng trong phiếu duyệt.`);
    }
    reviewsByQuestion.set(review.questionId, review);
  }

  const pendingQuestions = pendingResult.partResults.flatMap((part) =>
    part.questions.filter((question) => question.gradingStatus === "pending_review"),
  );

  for (const question of pendingQuestions) {
    const review = reviewsByQuestion.get(question.questionId);
    if (!review) {
      throw new Error(`Câu ${question.questionId} chưa được duyệt.`);
    }
    if (
      !Number.isFinite(review.points) ||
      review.points < 0 ||
      review.points > question.points
    ) {
      throw new Error(
        `Điểm câu ${question.questionId} phải từ 0 đến ${question.points}.`,
      );
    }
  }

  const pendingIds = new Set(pendingQuestions.map((question) => question.questionId));
  for (const review of reviews) {
    if (!pendingIds.has(review.questionId)) {
      throw new Error(`Câu ${review.questionId} không thuộc danh sách cần duyệt.`);
    }
  }

  let earnedPoints = 0;
  const partResults = pendingResult.partResults.map((part) => {
    const questions = part.questions.map((question) => {
      if (question.gradingStatus !== "pending_review") return { ...question };

      const review = reviewsByQuestion.get(question.questionId)!;
      return {
        ...question,
        earnedPoints: round(review.points),
        gradingStatus: "reviewed" as const,
        teacherComment: review.comment.trim(),
      };
    });
    const partEarned = round(
      questions.reduce((total, question) => total + question.earnedPoints, 0),
    );
    earnedPoints += partEarned;

    return {
      ...part,
      earnedPoints: partEarned,
      manualReviewPoints: 0,
      questions,
    };
  });

  const roundedEarned = round(earnedPoints);
  return {
    ...pendingResult,
    earnedPoints: roundedEarned,
    scorePercent:
      pendingResult.totalPoints > 0
        ? Math.round((roundedEarned / pendingResult.totalPoints) * 100)
        : 0,
    manualReviewPoints: 0,
    manualReviewRequired: false,
    status: "graded",
    partResults,
  };
}
