import assert from "node:assert/strict";
import test from "node:test";

import { validateAuthInput } from "../src/lib/authValidation.ts";

test("chấp nhận email và mật khẩu giáo viên hợp lệ", () => {
  assert.deepEqual(validateAuthInput(" GIAOVIEN@EXAMPLE.COM ", "MatKhau!123"), {
    email: "giaovien@example.com",
    password: "MatKhau!123",
  });
});

test("từ chối email sai và mật khẩu ngắn", () => {
  assert.throws(() => validateAuthInput("sai-email", "MatKhau!123"), /email/i);
  assert.throws(() => validateAuthInput("gv@example.com", "1234567"), /8 ký tự/);
});
