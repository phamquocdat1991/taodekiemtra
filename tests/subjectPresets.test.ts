import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultPresets,
  initialFullExamState,
} from "../src/data/defaultTemplates.ts";
import { applySubjectPreset } from "../src/lib/subjectPresets.ts";

const copyConfig = () => structuredClone(initialFullExamState);

test("đổi sang Khoa học tự nhiên thay nội dung và yêu cầu Toán mặc định", () => {
  const config = copyConfig();
  config.general.educationLevel = "Cấp 2 (THCS)";
  config.general.grade = "Lớp 8";

  const updated = applySubjectPreset(config, "Khoa học tự nhiên", defaultPresets);
  const khtn = defaultPresets.find((preset) => preset.id === "preset-khtn-8")!;

  assert.equal(updated.general.subject, "Khoa học tự nhiên");
  assert.equal(updated.general.grade, "Lớp 8");
  assert.equal(updated.knowledge.content, khtn.state.knowledge.content);
  assert.equal(
    updated.knowledge.additionalRequirements,
    khtn.state.knowledge.additionalRequirements,
  );
  assert.deepEqual(updated.structure.standard, khtn.state.structure.standard);
});

test("giữ yêu cầu do giáo viên tự viết khi đổi môn", () => {
  const config = copyConfig();
  config.knowledge.additionalRequirements = "Ưu tiên câu hỏi gắn với địa phương.";

  const updated = applySubjectPreset(config, "Khoa học tự nhiên", defaultPresets);

  assert.equal(
    updated.knowledge.additionalRequirements,
    "Ưu tiên câu hỏi gắn với địa phương.",
  );
});

test("giữ tệp đính kèm khi áp dụng preset môn", () => {
  const config = copyConfig();
  config.knowledge.attachmentName = "ngu-lieu.pdf";
  config.knowledge.attachmentContent = "Nội dung tài liệu";
  config.knowledge.attachmentSize = "20 KB";

  const updated = applySubjectPreset(config, "Ngữ văn", defaultPresets);

  assert.equal(updated.knowledge.attachmentName, "ngu-lieu.pdf");
  assert.equal(updated.knowledge.attachmentContent, "Nội dung tài liệu");
  assert.equal(updated.knowledge.attachmentSize, "20 KB");
});

test("môn chưa có preset chỉ cập nhật tên môn", () => {
  const config = copyConfig();

  const updated = applySubjectPreset(config, "Vật lí", defaultPresets);

  assert.equal(updated.general.subject, "Vật lí");
  assert.equal(updated.knowledge.content, config.knowledge.content);
  assert.equal(updated.knowledge.additionalRequirements, config.knowledge.additionalRequirements);
});
