import { FullExamState, ExamData, AnswerData, OnlineRoom, StudentAnswerMap, ExamResult } from "../types";

// Detect if server API is available
let _serverAvailable: boolean | null = null;
async function isServerAvailable(): Promise<boolean> {
  if (_serverAvailable !== null) return _serverAvailable;
  try {
    const r = await fetch("/api/health", { signal: AbortSignal.timeout(1500) });
    _serverAvailable = r.ok;
  } catch {
    _serverAvailable = false;
  }
  return _serverAvailable;
}

// ─── Create Room ──────────────────────────────────────────────────────────────
export async function createRoom(config: FullExamState, exam: ExamData, answers: AnswerData): Promise<string> {
  if (await isServerAvailable()) {
    const r = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, exam, answers }),
    });
    if (r.ok) {
      const data = await r.json();
      return data.pin;
    }
  }
  // Fallback: localStorage
  return createRoomLocal(config, exam, answers);
}

// ─── Get Room ─────────────────────────────────────────────────────────────────
export async function getRoom(pin: string): Promise<OnlineRoom | null> {
  if (await isServerAvailable()) {
    try {
      const r = await fetch(`/api/rooms/${pin.toUpperCase()}`);
      if (r.ok) {
        const data = await r.json();
        // Normalize to OnlineRoom shape
        return {
          pin: data.pin,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          config: data.config,
          exam: data.exam,
          answers: { parts: [] }, // answers not exposed to student
        } as OnlineRoom;
      }
      return null;
    } catch {
      // fall through to localStorage
    }
  }
  return getRoomLocal(pin);
}

// Sync version kept for legacy ExamRoomCard usage
export function getRoomSync(pin: string): OnlineRoom | null {
  return getRoomLocal(pin);
}

// ─── Submit Answers ───────────────────────────────────────────────────────────
export async function submitAnswers(
  pin: string,
  studentName: string,
  answers: StudentAnswerMap
): Promise<ExamResult | null> {
  if (await isServerAvailable()) {
    try {
      const r = await fetch(`/api/rooms/${pin.toUpperCase()}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, answers }),
      });
      if (r.ok) {
        const data = await r.json();
        return data.result as ExamResult;
      }
    } catch { /* fall through */ }
  }
  return null;
}

// ─── Get Results (Teacher Dashboard) ─────────────────────────────────────────
export async function getRoomResults(pin: string): Promise<ClassroomResults | null> {
  if (await isServerAvailable()) {
    try {
      const r = await fetch(`/api/rooms/${pin.toUpperCase()}/results`);
      if (r.ok) return await r.json();
    } catch { /* fall through */ }
  }
  return null;
}

// ─── Generate Remedial Test ───────────────────────────────────────────────────
export async function generateRemedialTest(pin: string, customApiKey?: string): Promise<RemedialTest | null> {
  const r = await fetch(`/api/rooms/${pin.toUpperCase()}/remedial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customApiKey: customApiKey || "" }),
  });
  if (r.ok) {
    const data = await r.json();
    return data.result as RemedialTest;
  }
  const err = await r.json().catch(() => ({ message: "Unknown error" }));
  throw new Error(err.message || "Failed to generate remedial test");
}

// ─── Delete Room ──────────────────────────────────────────────────────────────
export async function deleteRoom(pin: string): Promise<void> {
  if (await isServerAvailable()) {
    try {
      await fetch(`/api/rooms/${pin.toUpperCase()}`, { method: "DELETE" });
    } catch { /* fall through */ }
  }
  deleteRoomLocal(pin);
}

// ─── Local grade (used when server unavailable) ───────────────────────────────
export function gradeExam(room: OnlineRoom, studentAnswers: StudentAnswerMap): ExamResult {
  const result: ExamResult = {
    pin: room.pin, submittedAt: Date.now(), totalPoints: 0, earnedPoints: 0, scorePercent: 0, partResults: [],
  };
  for (const part of room.exam.parts) {
    const answerPart = room.answers.parts.find((ap: any) => ap.partTitle === part.partTitle);
    const partResult = { partTitle: part.partTitle, earnedPoints: 0, totalPoints: part.totalPoints, questions: [] as any[] };
    for (const q of part.questions) {
      const qKey = String(q.questionNumber);
      const studentAns = (studentAnswers[qKey] || "").trim().toUpperCase();
      const answerItem = answerPart?.items.find((a: any) => String(a.questionNumber) === qKey);
      const correctAns = extractAnswer(answerItem?.solutionSummary || "");
      const isCorrect = studentAns !== "" && studentAns === correctAns.toUpperCase();
      const earned = isCorrect ? q.points : 0;
      partResult.earnedPoints += earned;
      partResult.questions.push({ questionNumber: q.questionNumber, questionExcerpt: q.content?.substring(0, 80) + "...", studentAnswer: studentAnswers[qKey] || "", correctAnswer: correctAns || answerItem?.solutionSummary || "", isCorrect, points: q.points, earnedPoints: earned });
    }
    result.earnedPoints += partResult.earnedPoints;
    result.totalPoints += partResult.totalPoints;
    result.partResults.push(partResult);
  }
  result.scorePercent = result.totalPoints > 0 ? Math.round((result.earnedPoints / result.totalPoints) * 100) : 0;
  return result;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ClassroomResults {
  pin: string;
  submissionCount: number;
  submissions: Array<{
    studentName: string;
    submittedAt: number;
    earnedPoints: number;
    totalPoints: number;
    scorePercent: number;
    partResults: any[];
  }>;
  topWrongQuestions: Array<{ questionNumber: string; wrongCount: number; wrongPercent: number; excerpt: string }>;
  roomInfo: { subject: string; grade: string; expiresAt: number };
}

export interface RemedialTest {
  title: string;
  targetedWeaknesses: string[];
  questions: Array<{
    number: number;
    content: string;
    options: { A: string; B: string; C: string; D: string };
    answer: string;
    explanation: string;
  }>;
}

// ─── localStorage helpers (Phase 2 fallback) ─────────────────────────────────
const ROOM_PREFIX = "exam_room_";

function createRoomLocal(config: FullExamState, exam: ExamData, answers: AnswerData): string {
  const pin = generatePinLocal();
  const now = Date.now();
  const durationMs = ((config.general.duration || 50) + 5) * 60 * 1000;
  const room: OnlineRoom = { pin, createdAt: now, expiresAt: now + durationMs, config, exam, answers };
  localStorage.setItem(ROOM_PREFIX + pin, JSON.stringify(room));
  return pin;
}

function getRoomLocal(pin: string): OnlineRoom | null {
  try {
    const raw = localStorage.getItem(ROOM_PREFIX + pin.toUpperCase());
    if (!raw) return null;
    const room: OnlineRoom = JSON.parse(raw);
    if (Date.now() > room.expiresAt) { localStorage.removeItem(ROOM_PREFIX + pin.toUpperCase()); return null; }
    return room;
  } catch { return null; }
}

function deleteRoomLocal(pin: string): void {
  localStorage.removeItem(ROOM_PREFIX + pin.toUpperCase());
}

function generatePinLocal(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 6; i++) pin += chars[Math.floor(Math.random() * chars.length)];
  return localStorage.getItem(ROOM_PREFIX + pin) ? generatePinLocal() : pin;
}

function extractAnswer(s: string): string {
  if (!s) return "";
  const t = s.trim();
  const m1 = t.match(/^([A-Da-d])[.\s:)]/);
  if (m1) return m1[1].toUpperCase();
  const m2 = t.match(/^([A-Da-d])$/);
  if (m2) return m2[1].toUpperCase();
  return t.split(/[\s,;.]/)[0].toUpperCase();
}
