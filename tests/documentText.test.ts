import assert from "node:assert/strict";
import test from "node:test";

import { extractTextFromDocumentXml, validateSourceFile } from "../src/lib/documentText.ts";

test("trích xuất đoạn và ký tự tiếng Việt từ document.xml của DOCX", () => {
  const xml = `<w:document><w:body><w:p><w:r><w:t>Chủ đề &amp; bài học</w:t></w:r></w:p><w:p><w:r><w:t>Hóa học 8</w:t></w:r></w:p></w:body></w:document>`;
  assert.equal(extractTextFromDocumentXml(xml), "Chủ đề & bài học\nHóa học 8");
});

test("chặn tệp sai định dạng hoặc vượt 10 MB", () => {
  assert.equal(validateSourceFile("nguon.DOCX", 1024), "docx");
  assert.equal(validateSourceFile("nguon.pdf", 1024), "pdf");
  assert.equal(validateSourceFile("nguon.txt", 1024), "txt");
  assert.throws(() => validateSourceFile("anh.png", 1024), /PDF, DOCX hoặc TXT/);
  assert.throws(() => validateSourceFile("nguon.pdf", 11 * 1024 * 1024), /10 MB/);
});
