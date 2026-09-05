import assert from "node:assert/strict";
import test from "node:test";

import {
  extractJson,
  validateAiReview,
} from "../supabase/functions/_shared/aiReview.ts";

const pendingResult = {
  partResults: [
    {
      questions: [
        { questionId: "objective-1", points: 2, gradingStatus: "correct" },
        { questionId: "essay-1", points: 4, gradingStatus: "pending_review" },
      ],
    },
  ],
};

test("đọc JSON kể cả khi mô hình bọc trong markdown fence", () => {
  assert.deepEqual(extractJson("```json\n{\"ok\":true}\n```"), { ok: true });
});

test("AI phải gợi ý đủ câu tự luận và đúng giới hạn điểm", () => {
  const review = validateAiReview(pendingResult, {
    items: [
      {
        questionId: "essay-1",
        suggestedPoints: 3.25,
        feedback: "Lập luận đúng, thiếu kết luận.",
        rubricBreakdown: [{ criterion: "Lập luận", points: 3.25 }],
      },
    ],
    overallComment: "Cần kiểm tra lại phần kết luận.",
  });

  assert.equal(review.items[0].suggestedPoints, 3.25);
});

test("chặn gợi ý điểm vượt rubric", () => {
  assert.throws(
    () =>
      validateAiReview(pendingResult, {
        items: [
          {
            questionId: "essay-1",
            suggestedPoints: 5,
            feedback: "",
            rubricBreakdown: [],
          },
        ],
      }),
    /từ 0 đến 4/,
  );
});

test("chặn phản hồi thiếu câu tự luận cần duyệt", () => {
  assert.throws(
    () => validateAiReview(pendingResult, { items: [] }),
    /chưa có gợi ý/,
  );
});
