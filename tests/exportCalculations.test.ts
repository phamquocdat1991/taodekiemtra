import assert from "node:assert/strict";
import test from "node:test";

import {
  summarizeAnswerData,
  summarizeMatrixRows,
  summarizeSpecificationRows,
} from "../src/lib/exportCalculations.ts";

test("tổng xuất file được tính từ hàng nguồn, không dùng số 10/100 ghi cứng", () => {
  assert.deepEqual(
    summarizeMatrixRows([
      { nb: 2, th: 1, vd: 0, vdc: 0, totalQuestions: 3, totalPoints: 2.5, percent: 25 },
      { nb: 1, th: 1, vd: 1, vdc: 0, totalQuestions: 3, totalPoints: 3.75, percent: 37.5 },
    ]),
    { nb: 3, th: 2, vd: 1, vdc: 0, questions: 6, points: 6.25, percent: 62.5 },
  );

  assert.deepEqual(summarizeSpecificationRows([{ points: 1.25 }, { points: 2.5 }]), {
    questions: 2,
    points: 3.75,
  });

  assert.deepEqual(
    summarizeAnswerData([{ items: [{ points: 0.25 }, { points: 1.5 }] }, { items: [{ points: 2 }] }]),
    { answers: 3, points: 3.75 },
  );
});
