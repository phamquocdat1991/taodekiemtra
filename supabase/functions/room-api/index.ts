import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type User } from "npm:@supabase/supabase-js@2.115.0";

import { extractJson, validateAiReview } from "../_shared/aiReview.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAttemptToken, sha256Hex } from "../_shared/crypto.ts";
import { generateGeminiText } from "../_shared/gemini.ts";
import { gradeExamSubmission } from "../_shared/grading.ts";
import { errorResponse, HttpError, json, readJson } from "../_shared/http.ts";
import { finalizeTeacherReview } from "../_shared/review.ts";
import {
  normalizePin,
  sanitizeStudentResult,
  sanitizeStudentRoom,
  validateClientNonce,
  validateStudentName,
} from "../_shared/roomValidation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey =
  Deno.env.get("SUPABASE_SECRET_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";
const tokenSecret = Deno.env.get("ATTEMPT_TOKEN_SECRET") || serviceKey;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makePin() {
  const random = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(random, (byte) => PIN_CHARS[byte % PIN_CHARS.length]).join("");
}

function ensureObject(value: unknown, label: string): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `${label} không hợp lệ.`);
  }
  return value as Record<string, any>;
}

async function requireTeacher(req: Request): Promise<User> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new HttpError(401, "Vui lòng đăng nhập tài khoản giáo viên.");

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Phiên đăng nhập đã hết hạn.");
  return data.user;
}

async function ownedRoom(userId: string, pinValue?: unknown, roomId?: unknown) {
  let query = admin.from("exam_rooms").select("*").eq("teacher_id", userId);
  if (roomId) query = query.eq("id", String(roomId));
  else query = query.eq("pin", normalizePin(pinValue));
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, "Không tìm thấy phòng thi của giáo viên.");
  return data;
}

async function validateAttempt(attemptId: unknown, token: unknown) {
  const id = String(attemptId ?? "");
  const rawToken = String(token ?? "");
  if (!id || !rawToken) throw new HttpError(401, "Thiếu mã xác thực bài làm.");
  const { data, error } = await admin.rpc("validate_attempt_token", {
    p_attempt_id: id,
    p_token_hash: await sha256Hex(rawToken),
  });
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(401, "Mã xác thực bài làm không hợp lệ hoặc đã hết hạn.");
  return id;
}

function roomForTeacher(room: any) {
  return {
    id: room.id,
    pin: room.pin,
    createdAt: new Date(room.created_at).getTime(),
    expiresAt: new Date(room.expires_at).getTime(),
    status: room.status,
    config: room.config,
    exam: room.exam,
    answers: room.answer_key,
    detail: room.detail_guide,
  };
}

async function createRoom(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const config = ensureObject(body.config, "Cấu hình đề");
  const exam = ensureObject(body.exam, "Đề thi");
  const answers = ensureObject(body.answers, "Đáp án");
  const detail = body.detail == null ? null : ensureObject(body.detail, "Rubric chi tiết");
  const duration = Number(config?.general?.duration);
  if (!Number.isFinite(duration) || duration < 5 || duration > 300) {
    throw new HttpError(400, "Thời gian làm bài phải từ 5 đến 300 phút.");
  }

  const now = Date.now();
  const expiresAt = new Date(now + (duration + 5) * 60_000).toISOString();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await admin
      .from("exam_rooms")
      .insert({
        teacher_id: teacher.id,
        pin: makePin(),
        status: "open",
        config,
        exam,
        answer_key: answers,
        detail_guide: detail,
        expires_at: expiresAt,
      })
      .select("*")
      .single();
    if (!error && data) return json({ room: roomForTeacher(data), pin: data.pin }, 201);
    if (error?.code !== "23505") throw new Error(error?.message || "Không thể tạo phòng thi.");
  }
  throw new HttpError(503, "Chưa thể cấp mã PIN duy nhất. Vui lòng thử lại.");
}

async function joinRoom(body: Record<string, any>) {
  const pin = normalizePin(body.pin);
  const studentName = validateStudentName(body.studentName);
  const clientNonce = validateClientNonce(body.clientNonce);
  const { data: room, error: roomError } = await admin
    .from("exam_rooms")
    .select("*")
    .eq("pin", pin)
    .eq("status", "open")
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new HttpError(404, "Mã PIN không tồn tại hoặc phòng thi đã đóng.");
  if (Date.parse(room.expires_at) <= Date.now()) {
    await admin
      .from("exam_rooms")
      .update({ status: "expired", closed_at: new Date().toISOString() })
      .eq("id", room.id);
    throw new HttpError(410, "Phòng thi đã hết hạn.");
  }

  let { data: attempt, error: selectError } = await admin
    .from("exam_attempts")
    .select("*")
    .eq("room_id", room.id)
    .eq("client_nonce", clientNonce)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);

  if (!attempt) {
    const inserted = await admin
      .from("exam_attempts")
      .insert({
        room_id: room.id,
        client_nonce: clientNonce,
        student_name: studentName,
      })
      .select("*")
      .single();
    if (inserted.error?.code === "23505") {
      const retry = await admin
        .from("exam_attempts")
        .select("*")
        .eq("room_id", room.id)
        .eq("client_nonce", clientNonce)
        .single();
      attempt = retry.data;
      selectError = retry.error;
    } else {
      attempt = inserted.data;
      selectError = inserted.error;
    }
    if (selectError || !attempt) throw new Error(selectError?.message || "Không thể tạo lượt thi.");
  }

  if (attempt.student_name !== studentName) {
    throw new HttpError(409, "Phiên làm bài này đã được dùng cho học sinh khác.");
  }

  const attemptToken = await createAttemptToken(tokenSecret, room.id, clientNonce);
  const { error: tokenError } = await admin.rpc("upsert_attempt_token", {
    p_attempt_id: attempt.id,
    p_token_hash: await sha256Hex(attemptToken),
    p_expires_at: room.expires_at,
  });
  if (tokenError) throw new Error(tokenError.message);

  return json({
    room: sanitizeStudentRoom(room),
    attemptId: attempt.id,
    attemptToken,
    resumed: attempt.status !== "in_progress",
  });
}

async function lookupRoom(body: Record<string, any>) {
  const pin = normalizePin(body.pin);
  const { data: room, error } = await admin
    .from("exam_rooms")
    .select("*")
    .eq("pin", pin)
    .eq("status", "open")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!room) throw new HttpError(404, "Mã PIN không tồn tại hoặc phòng thi đã đóng.");
  if (Date.parse(room.expires_at) <= Date.now()) {
    await admin
      .from("exam_rooms")
      .update({ status: "expired", closed_at: new Date().toISOString() })
      .eq("id", room.id);
    throw new HttpError(410, "Phòng thi đã hết hạn.");
  }
  return json({ room: sanitizeStudentRoom(room) });
}

async function submitAttempt(body: Record<string, any>) {
  const attemptId = await validateAttempt(body.attemptId, body.attemptToken);
  const answers = ensureObject(body.answers, "Bài làm");
  if (JSON.stringify(answers).length > 200_000) {
    throw new HttpError(413, "Bài làm vượt quá dung lượng cho phép.");
  }

  const { data: attempt, error: attemptError } = await admin
    .from("exam_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();
  if (attemptError || !attempt) throw new HttpError(404, "Không tìm thấy lượt thi.");
  if (attempt.status !== "in_progress") {
    return json({
      reviewStatus: attempt.review_status,
      result: sanitizeStudentResult(attempt.result, attempt.review_status === "published"),
      alreadySubmitted: true,
    });
  }

  const { data: room, error: roomError } = await admin
    .from("exam_rooms")
    .select("*")
    .eq("id", attempt.room_id)
    .single();
  if (roomError || !room) throw new HttpError(404, "Không tìm thấy phòng thi.");

  const graded = gradeExamSubmission(room.exam, room.answer_key, answers);
  const submittedAt = new Date().toISOString();
  const reviewStatus = graded.manualReviewRequired ? "pending_ai" : "not_required";
  const { data: saved, error: saveError } = await admin
    .from("exam_attempts")
    .update({
      answers,
      result: graded,
      score: graded.earnedPoints,
      score_percent: graded.scorePercent,
      status: Date.parse(room.expires_at) < Date.now() ? "timed_out" : "submitted",
      submitted_at: submittedAt,
      review_status: reviewStatus,
    })
    .eq("id", attemptId)
    .eq("status", "in_progress")
    .select("*")
    .single();
  if (saveError || !saved) throw new Error(saveError?.message || "Không thể lưu bài làm.");

  return json({
    reviewStatus,
    result: sanitizeStudentResult(graded, false),
    alreadySubmitted: false,
  });
}

async function getStudentResult(body: Record<string, any>) {
  const attemptId = await validateAttempt(body.attemptId, body.attemptToken);
  const { data, error } = await admin
    .from("exam_attempts")
    .select("status, review_status, result, submitted_at, published_at")
    .eq("id", attemptId)
    .single();
  if (error || !data) throw new HttpError(404, "Không tìm thấy kết quả.");
  const visible = data.review_status === "published" || data.review_status === "not_required";
  return json({
    status: data.status,
    reviewStatus: data.review_status,
    publishedAt: data.published_at,
    result: data.result ? sanitizeStudentResult(data.result, visible) : null,
  });
}

function summarizeAttempts(room: any, attempts: any[]) {
  const wrong = new Map<string, { questionNumber: string; wrongCount: number; excerpt: string }>();
  for (const attempt of attempts) {
    for (const part of attempt.result?.partResults ?? []) {
      for (const question of part.questions ?? []) {
        if (question.isCorrect === false) {
          const key = String(question.questionId);
          const current = wrong.get(key) ?? {
            questionNumber: String(question.questionNumber),
            wrongCount: 0,
            excerpt: question.questionExcerpt,
          };
          current.wrongCount += 1;
          wrong.set(key, current);
        }
      }
    }
  }
  const count = Math.max(attempts.length, 1);
  return {
    pin: room.pin,
    submissionCount: attempts.length,
    submissions: attempts.map((attempt) => ({
      id: attempt.id,
      studentName: attempt.student_name,
      submittedAt: Date.parse(attempt.submitted_at),
      earnedPoints: Number(attempt.score ?? 0),
      totalPoints: Number(attempt.result?.totalPoints ?? room.exam?.totalPoints ?? 10),
      scorePercent: attempt.score_percent,
      partResults: attempt.result?.partResults ?? [],
      reviewStatus: attempt.review_status,
      aiReview: attempt.ai_review,
      teacherReview: attempt.teacher_review,
    })),
    topWrongQuestions: [...wrong.values()]
      .map((item) => ({
        ...item,
        wrongPercent: Math.round((item.wrongCount / count) * 100),
      }))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 5),
    roomInfo: {
      subject: room.config?.general?.subject ?? "",
      grade: room.config?.general?.grade ?? "",
      expiresAt: Date.parse(room.expires_at),
      status: room.status,
    },
  };
}

async function roomResults(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const room = await ownedRoom(teacher.id, body.pin, body.roomId);
  const { data, error } = await admin
    .from("exam_attempts")
    .select("*")
    .eq("room_id", room.id)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return json(summarizeAttempts(room, data ?? []));
}

async function suggestEssay(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const attemptId = String(body.attemptId ?? "");
  const { data: attempt, error } = await admin
    .from("exam_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();
  if (error || !attempt) throw new HttpError(404, "Không tìm thấy bài làm.");
  const room = await ownedRoom(teacher.id, undefined, attempt.room_id);
  if (!["pending_ai", "pending_teacher"].includes(attempt.review_status)) {
    throw new HttpError(409, "Bài làm không ở trạng thái cần AI gợi ý.");
  }

  const pendingQuestions = (attempt.result?.partResults ?? [])
    .flatMap((part: any) => part.questions ?? [])
    .filter((question: any) => question.gradingStatus === "pending_review");
  const rubricItems = new Map(
    (room.detail_guide?.items ?? []).map((item: any) => [String(item.questionId), item]),
  );
  const payload = pendingQuestions.map((question: any) => ({
    questionId: question.questionId,
    question: question.questionExcerpt,
    studentAnswer: question.studentAnswer,
    maximumPoints: question.points,
    referenceAnswer: question.correctAnswer,
    rubric: rubricItems.get(String(question.questionId))?.rubric ?? [],
  }));

  const apiKey = String(body.customApiKey ?? Deno.env.get("GEMINI_API_KEY") ?? "");
  const raw = await generateGeminiText({
    apiKey,
    model: Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash",
    systemInstruction:
      "Bạn là trợ lý chấm thi. Chỉ đề xuất điểm theo rubric; không được coi điểm là quyết định cuối cùng của giáo viên. Chỉ trả về JSON.",
    prompt: `Đề xuất điểm cho các câu tự luận sau. Không vượt maximumPoints. Trả JSON dạng {"items":[{"questionId":"...","suggestedPoints":0,"feedback":"...","rubricBreakdown":[{"criterion":"...","points":0,"comment":"..."}]}],"overallComment":"..."}. Dữ liệu: ${JSON.stringify(payload)}`,
    temperature: 0.15,
  });
  const aiReview = validateAiReview(attempt.result, extractJson(raw));
  const { error: updateError } = await admin
    .from("exam_attempts")
    .update({ ai_review: aiReview, review_status: "pending_teacher" })
    .eq("id", attempt.id);
  if (updateError) throw new Error(updateError.message);
  return json({ aiReview, reviewStatus: "pending_teacher" });
}

async function approveEssay(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const attemptId = String(body.attemptId ?? "");
  const { data: attempt, error } = await admin
    .from("exam_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();
  if (error || !attempt) throw new HttpError(404, "Không tìm thấy bài làm.");
  await ownedRoom(teacher.id, undefined, attempt.room_id);
  if (attempt.review_status !== "pending_teacher" || !attempt.ai_review) {
    throw new HttpError(409, "Bài làm chưa có gợi ý AI để giáo viên duyệt.");
  }
  if (!Array.isArray(body.reviews)) {
    throw new HttpError(400, "Phiếu duyệt của giáo viên không hợp lệ.");
  }

  const finalResult = finalizeTeacherReview(attempt.result, body.reviews);
  const reviewedAt = new Date().toISOString();
  const teacherReview = { items: body.reviews, reviewedAt };
  const { error: updateError } = await admin
    .from("exam_attempts")
    .update({
      result: finalResult,
      score: finalResult.earnedPoints,
      score_percent: finalResult.scorePercent,
      review_status: "approved",
      teacher_review: teacherReview,
      reviewed_by: teacher.id,
      reviewed_at: reviewedAt,
    })
    .eq("id", attempt.id);
  if (updateError) throw new Error(updateError.message);
  return json({ result: finalResult, reviewStatus: "approved" });
}

async function publishResult(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const attemptId = String(body.attemptId ?? "");
  const { data: attempt, error } = await admin
    .from("exam_attempts")
    .select("id, room_id, review_status")
    .eq("id", attemptId)
    .single();
  if (error || !attempt) throw new HttpError(404, "Không tìm thấy bài làm.");
  await ownedRoom(teacher.id, undefined, attempt.room_id);
  if (attempt.review_status !== "approved") {
    throw new HttpError(409, "Giáo viên phải duyệt điểm trước khi công bố.");
  }
  const publishedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("exam_attempts")
    .update({ review_status: "published", published_at: publishedAt })
    .eq("id", attempt.id);
  if (updateError) throw new Error(updateError.message);
  return json({ reviewStatus: "published", publishedAt });
}

async function closeRoom(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const room = await ownedRoom(teacher.id, body.pin, body.roomId);
  if (room.status === "open") {
    const { error } = await admin
      .from("exam_rooms")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", room.id);
    if (error) throw new Error(error.message);
  }
  return json({ success: true });
}

async function deleteRoom(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const room = await ownedRoom(teacher.id, body.pin, body.roomId);
  const { error } = await admin.from("exam_rooms").delete().eq("id", room.id);
  if (error) throw new Error(error.message);
  return json({ success: true });
}

async function remedialTest(req: Request, body: Record<string, any>) {
  const teacher = await requireTeacher(req);
  const room = await ownedRoom(teacher.id, body.pin, body.roomId);
  const { data, error } = await admin
    .from("exam_attempts")
    .select("result")
    .eq("room_id", room.id)
    .not("submitted_at", "is", null);
  if (error) throw new Error(error.message);
  const summary = summarizeAttempts(room, data ?? []);
  if (!summary.topWrongQuestions.length) {
    throw new HttpError(409, "Chưa có đủ câu trả lời sai để tạo đề củng cố.");
  }
  const apiKey = String(body.customApiKey ?? Deno.env.get("GEMINI_API_KEY") ?? "");
  const raw = await generateGeminiText({
    apiKey,
    model: Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash",
    systemInstruction: "Bạn là giáo viên Việt Nam. Chỉ trả về JSON hợp lệ.",
    prompt: `Tạo đề luyện củng cố 5 câu trắc nghiệm cho ${room.config?.general?.subject}, ${room.config?.general?.grade}, tập trung vào các lỗi ${JSON.stringify(summary.topWrongQuestions)}. Trả JSON {"title":"...","targetedWeaknesses":["..."],"questions":[{"number":1,"content":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"..."}]}.`,
    temperature: 0.35,
  });
  return json({ result: extractJson(raw) });
}

const handlers: Record<
  string,
  (req: Request, body: Record<string, any>) => Promise<Response>
> = {
  "create-room": createRoom,
  lookup: (_req, body) => lookupRoom(body),
  join: (_req, body) => joinRoom(body),
  submit: (_req, body) => submitAttempt(body),
  result: (_req, body) => getStudentResult(body),
  results: roomResults,
  "suggest-essay": suggestEssay,
  "approve-essay": approveEssay,
  "publish-result": publishResult,
  "close-room": closeRoom,
  "delete-room": deleteRoom,
  remedial: remedialTest,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Phương thức không được hỗ trợ." }, 405);
  try {
    if (!supabaseUrl || !serviceKey || !tokenSecret) {
      throw new Error("Edge Function chưa có đủ cấu hình Supabase.");
    }
    const body = await readJson(req);
    const action = String(body.action ?? "");
    const handler = handlers[action];
    if (!handler) throw new HttpError(400, "Hành động phòng thi không hợp lệ.");
    return await handler(req, body);
  } catch (error) {
    return errorResponse(error);
  }
});
