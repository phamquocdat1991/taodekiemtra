const PIN_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePin(value: unknown): string {
  const pin = String(value ?? "")
    .toUpperCase()
    .replace(/[\s-]/g, "");
  if (!PIN_PATTERN.test(pin)) {
    throw new Error("Mã PIN phải gồm 6 ký tự hợp lệ.");
  }
  return pin;
}

export function validateStudentName(value: unknown): string {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100) {
    throw new Error("Họ và tên học sinh phải từ 2 đến 100 ký tự.");
  }
  return name;
}

export function validateClientNonce(value: unknown): string {
  const nonce = String(value ?? "").trim().toLowerCase();
  if (!UUID_PATTERN.test(nonce)) {
    throw new Error("Mã phiên làm bài không hợp lệ.");
  }
  return nonce;
}

interface StudentRoomSource {
  id: string;
  pin: string;
  created_at: string;
  expires_at: string;
  config: unknown;
  exam: unknown;
  answer_key?: unknown;
  detail_guide?: unknown;
}

export function sanitizeStudentRoom(room: StudentRoomSource) {
  return {
    id: room.id,
    pin: room.pin,
    createdAt: new Date(room.created_at).getTime(),
    expiresAt: new Date(room.expires_at).getTime(),
    config: room.config,
    exam: room.exam,
  };
}

export function sanitizeStudentResult(result: any, canRevealAnswers: boolean): any {
  const safe = structuredClone(result);
  if (canRevealAnswers) return safe;

  for (const part of safe?.partResults ?? []) {
    for (const question of part?.questions ?? []) {
      if (question?.gradingStatus === "pending_review") {
        question.correctAnswer = "";
      }
    }
  }
  return safe;
}
