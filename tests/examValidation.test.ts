import assert from "node:assert/strict";
import test from "node:test";

import { initialFullExamState } from "../src/data/defaultTemplates.ts";
import { validateExamConfig } from "../src/lib/examValidation.ts";

const copyConfig = () => structuredClone(initialFullExamState);

test("cấu hình mặc định hợp lệ", () => {
  const result = validateExamConfig(copyConfig());

  assert.equal(result.isValid, true);
  assert.equal(result.cognition.totalPercent, 100);
  assert.equal(result.structure.totalPercent, 100);
  assert.equal(result.structure.totalPoints, 10);
  assert.deepEqual(result.errors, []);
});

test("chặn tạo đề khi cấu trúc chỉ đạt 99%", () => {
  const config = copyConfig();
  config.structure.standard.shortAnswer.percent = 29;
  config.structure.standard.shortAnswer.points = 2.9;

  const result = validateExamConfig(config);

  assert.equal(result.isValid, false);
  assert.equal(result.structure.totalPercent, 99);
  assert.equal(result.structure.totalPoints, 9.9);
  assert.ok(result.errors.some((error) => error.code === "STRUCTURE_PERCENT"));
  assert.ok(result.errors.some((error) => error.code === "STRUCTURE_POINTS"));
});

test("chặn tạo đề khi tổng mức độ nhận thức khác 100%", () => {
  const config = copyConfig();
  config.cognition.nb = 41;

  const result = validateExamConfig(config);

  assert.equal(result.isValid, false);
  assert.equal(result.cognition.totalPercent, 101);
  assert.ok(result.errors.some((error) => error.code === "COGNITION_PERCENT"));
});

test("chặn số câu âm ở cấu trúc đang sử dụng", () => {
  const config = copyConfig();
  config.structure.standard.essay.count = -1;

  const result = validateExamConfig(config);

  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((error) => error.code === "QUESTION_COUNT"));
});

test("chỉ kiểm tra cấu trúc tương ứng loại môn học", () => {
  const config = copyConfig();
  config.structure.type = "language";
  config.structure.standard.shortAnswer.percent = 29;
  config.structure.standard.shortAnswer.points = 2.9;

  const result = validateExamConfig(config);

  assert.equal(result.isValid, true);
  assert.equal(result.structure.totalPercent, 100);
  assert.equal(result.structure.totalPoints, 10);
});
