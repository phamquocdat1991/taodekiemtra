import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readMigration = (name: string) =>
  readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en");

test("exam_rooms có ràng buộc dữ liệu, RLS và chỉ mục theo chủ sở hữu", () => {
  const sql = readMigration("202609050001_exam_rooms.sql");

  assert.match(sql, /create table public\.exam_rooms/);
  assert.match(sql, /teacher_id uuid not null references auth\.users/);
  assert.match(sql, /check \(pin ~ '\^\[a-hj-np-z2-9\]/);
  assert.match(sql, /alter table public\.exam_rooms enable row level security/);
  assert.match(sql, /\(select auth\.uid\(\)\) = teacher_id/);
  assert.match(sql, /create index exam_rooms_teacher_created_idx/);
  assert.match(sql, /create unique index exam_rooms_open_pin_idx/);
});

test("token học sinh nằm trong private schema và không lộ qua Data API", () => {
  const sql = readMigration("202609050002_exam_attempts.sql");

  assert.match(sql, /create schema if not exists private/);
  assert.match(sql, /create table private\.exam_attempt_tokens/);
  assert.match(sql, /revoke all on schema private from public, anon, authenticated/);
  assert.match(sql, /create table public\.exam_attempts/);
  const publicAttemptsDefinition = sql.match(
    /create table public\.exam_attempts \((.*?)\);/,
  )?.[1];
  assert.ok(publicAttemptsDefinition);
  assert.doesNotMatch(publicAttemptsDefinition, /token_hash/);
  assert.match(sql, /alter table public\.exam_attempts enable row level security/);
  assert.match(sql, /room\.teacher_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /create index exam_attempts_room_submitted_idx/);
});

test("Realtime chỉ công bố bảng kết quả cần thiết", () => {
  const sql = readMigration("202609050003_realtime.sql");

  assert.match(sql, /alter publication supabase_realtime add table public\.exam_attempts/);
  assert.doesNotMatch(sql, /add table private\.exam_attempt_tokens/);
});

test("bảng token private bật RLS nhưng không có policy công khai", () => {
  const sql = readMigration("202609050004_private_token_rls.sql");

  assert.match(
    sql,
    /alter table private\.exam_attempt_tokens enable row level security/,
  );
  assert.doesNotMatch(sql, /create policy/);
});

test("bài tự luận bắt buộc đi qua AI gợi ý, giáo viên duyệt rồi mới công bố", () => {
  const sql = readMigration("202609050005_essay_review.sql");

  assert.match(sql, /add column review_status text not null default 'not_required'/);
  assert.match(
    sql,
    /review_status in \('not_required', 'pending_ai', 'pending_teacher', 'approved', 'published'\)/,
  );
  assert.match(sql, /add column ai_review jsonb/);
  assert.match(sql, /add column teacher_review jsonb/);
  assert.match(sql, /add column reviewed_by uuid references auth\.users/);
  assert.match(sql, /review_status in \('approved', 'published'\).*teacher_review is not null/s);
  assert.match(sql, /review_status = 'published'.*published_at is not null/s);
  assert.match(sql, /create index exam_attempts_pending_review_idx/);
});

test("khóa ngoại người duyệt có chỉ mục riêng", () => {
  const sql = readMigration("202609050006_reviewed_by_index.sql");

  assert.match(sql, /create index exam_attempts_reviewed_by_idx/);
  assert.match(sql, /on public\.exam_attempts \(reviewed_by\)/);
  assert.match(sql, /where reviewed_by is not null/);
});

test("Edge Function chỉ truy cập token qua RPC dành riêng cho service role", () => {
  const sql = readMigration("202609050007_attempt_token_rpc.sql");

  assert.match(sql, /create or replace function public\.upsert_attempt_token/);
  assert.match(sql, /create or replace function public\.validate_attempt_token/);
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /revoke all on function public\.upsert_attempt_token/);
  assert.match(sql, /grant execute on function public\.validate_attempt_token.*to service_role/);
  assert.doesNotMatch(sql, /grant execute.*to anon/);
});

test("phòng thi lưu rubric chi tiết để AI gợi ý điểm có căn cứ", () => {
  const sql = readMigration("202609050008_room_detail_guide.sql");

  assert.match(sql, /add column detail_guide jsonb/);
  assert.match(sql, /jsonb_typeof\(detail_guide\) = 'object'/);
});
