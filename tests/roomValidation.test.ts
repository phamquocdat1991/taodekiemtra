import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePin,
  sanitizeStudentResult,
  sanitizeStudentRoom,
  validateClientNonce,
  validateStudentName,
} from "../supabase/functions/_shared/roomValidation.ts";

test("chuẩn hóa PIN nhưng loại bỏ ký tự dễ nhầm hoặc sai định dạng", () => {
  assert.equal(normalizePin(" ab2-3cd "), "AB23CD");
  assert.throws(() => normalizePin("AB01CD"), /PIN/);
  assert.throws(() => normalizePin("ABC"), /PIN/);
});

test("kiểm tra tên học sinh và client nonce", () => {
  assert.equal(validateStudentName("  Nguyễn Văn A  "), "Nguyễn Văn A");
  assert.throws(() => validateStudentName("A"), /họ và tên/i);
  assert.equal(
    validateClientNonce("d9428888-122b-4a68-a3ee-2a5f7bc72f7a"),
    "d9428888-122b-4a68-a3ee-2a5f7bc72f7a",
  );
  assert.throws(() => validateClientNonce("not-a-uuid"), /phiên làm bài/i);
});

test("dữ liệu phòng gửi học sinh không chứa đáp án hoặc rubric", () => {
  const room = sanitizeStudentRoom({
    id: "room-1",
    pin: "AB23CD",
    created_at: "2026-09-05T00:00:00Z",
    expires_at: "2026-09-05T01:00:00Z",
    config: { general: { subject: "Toán" } },
    exam: { parts: [] },
    answer_key: { secret: "A" },
    detail_guide: { rubric: "bí mật" },
  });

  assert.equal("answer_key" in room, false);
  assert.equal("detail_guide" in room, false);
  assert.equal(room.pin, "AB23CD");
});

test("kết quả tự luận chưa công bố không làm lộ đáp án/rubric", () => {
  const result = sanitizeStudentResult(
    {
      earnedPoints: 2,
      totalPoints: 10,
      scorePercent: null,
      manualReviewRequired: true,
      partResults: [
        {
          partTitle: "Tự luận",
          questions: [
            {
              questionId: "essay-1",
              studentAnswer: "Bài làm",
              correctAnswer: "Lời giải bí mật",
              gradingStatus: "pending_review",
            },
          ],
        },
      ],
    },
    false,
  );

  assert.equal(result.partResults[0].questions[0].correctAnswer, "");
  assert.equal(result.partResults[0].questions[0].studentAnswer, "Bài làm");
});
