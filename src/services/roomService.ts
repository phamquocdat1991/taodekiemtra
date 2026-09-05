import type {
  AnswerData,
  DetailGuideData,
  ExamData,
  ExamResult,
  FullExamState,
  OnlineRoom,
  StudentAnswerMap,
} from "../types";
import { invokeFunction } from "../lib/supabase";

interface RoomEnvelope {
  room: OnlineRoom;
  pin?: string;
  attemptId?: string;
  attemptToken?: string;
  resumed?: boolean;
}

export interface SubmitResponse {
  reviewStatus:
    | "not_required"
    | "pending_ai"
    | "pending_teacher"
    | "approved"
    | "published";
  result: ExamResult;
  alreadySubmitted?: boolean;
}

export async function createRoom(
  config: FullExamState,
  exam: ExamData,
  answers: AnswerData,
  detail: DetailGuideData | null,
): Promise<string> {
  const data = await invokeFunction<RoomEnvelope>("room-api", {
    action: "create-room",
    config,
    exam,
    answers,
    detail,
  });
  if (!data.pin) throw new Error("Máy chủ chưa cấp mã PIN cho phòng thi.");
  return data.pin;
}

export async function getRoom(pin: string): Promise<OnlineRoom | null> {
  try {
    const data = await invokeFunction<RoomEnvelope>("room-api", {
      action: "lookup",
      pin,
    });
    return data.room;
  } catch {
    return null;
  }
}

export async function joinRoom(
  pin: string,
  studentName: string,
): Promise<OnlineRoom> {
  const storageKey = `exam_attempt_nonce_${pin.toUpperCase()}`;
  let clientNonce = sessionStorage.getItem(storageKey);
  if (!clientNonce) {
    clientNonce = crypto.randomUUID();
    sessionStorage.setItem(storageKey, clientNonce);
  }
  const data = await invokeFunction<RoomEnvelope>("room-api", {
    action: "join",
    pin,
    studentName,
    clientNonce,
  });
  if (!data.attemptId || !data.attemptToken) {
    throw new Error("Máy chủ chưa cấp phiên làm bài an toàn.");
  }
  return {
    ...data.room,
    attemptId: data.attemptId,
    attemptToken: data.attemptToken,
  };
}

export async function submitAnswers(
  room: OnlineRoom,
  answers: StudentAnswerMap,
): Promise<SubmitResponse> {
  if (!room.attemptId || !room.attemptToken) {
    throw new Error("Phiên làm bài không hợp lệ. Vui lòng vào lại bằng mã PIN.");
  }
  return invokeFunction<SubmitResponse>("room-api", {
    action: "submit",
    attemptId: room.attemptId,
    attemptToken: room.attemptToken,
    answers,
  });
}

export async function getStudentResult(room: OnlineRoom): Promise<SubmitResponse> {
  if (!room.attemptId || !room.attemptToken) {
    throw new Error("Phiên làm bài không hợp lệ.");
  }
  return invokeFunction<SubmitResponse>("room-api", {
    action: "result",
    attemptId: room.attemptId,
    attemptToken: room.attemptToken,
  });
}

export interface AiReviewItem {
  questionId: string;
  suggestedPoints: number;
  feedback: string;
  rubricBreakdown: Array<{
    criterion: string;
    points: number;
    comment?: string;
  }>;
}

export interface AiReview {
  items: AiReviewItem[];
  overallComment: string;
}

export type ReviewStatus = SubmitResponse["reviewStatus"];

export interface ClassroomSubmission {
  id: string;
  studentName: string;
  submittedAt: number;
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number | null;
  partResults: ExamResult["partResults"];
  reviewStatus: ReviewStatus;
  aiReview: AiReview | null;
  teacherReview: {
    items: Array<{ questionId: string; points: number; comment: string }>;
    reviewedAt: string;
  } | null;
}

export interface ClassroomResults {
  pin: string;
  submissionCount: number;
  submissions: ClassroomSubmission[];
  topWrongQuestions: Array<{
    questionNumber: string;
    wrongCount: number;
    wrongPercent: number;
    excerpt: string;
  }>;
  roomInfo: {
    subject: string;
    grade: string;
    expiresAt: number;
    status: string;
  };
}

export async function getRoomResults(pin: string): Promise<ClassroomResults> {
  return invokeFunction<ClassroomResults>("room-api", {
    action: "results",
    pin,
  });
}

export async function suggestEssayScores(
  attemptId: string,
  customApiKey?: string,
): Promise<{ aiReview: AiReview; reviewStatus: ReviewStatus }> {
  return invokeFunction("room-api", {
    action: "suggest-essay",
    attemptId,
    customApiKey: customApiKey || "",
  });
}

export async function approveEssayScores(
  attemptId: string,
  reviews: Array<{ questionId: string; points: number; comment: string }>,
): Promise<{ result: ExamResult; reviewStatus: ReviewStatus }> {
  return invokeFunction("room-api", {
    action: "approve-essay",
    attemptId,
    reviews,
  });
}

export async function publishResult(
  attemptId: string,
): Promise<{ reviewStatus: ReviewStatus; publishedAt: string }> {
  return invokeFunction("room-api", {
    action: "publish-result",
    attemptId,
  });
}

export async function closeRoom(pin: string): Promise<void> {
  await invokeFunction("room-api", { action: "close-room", pin });
}

export async function deleteRoom(pin: string): Promise<void> {
  await invokeFunction("room-api", { action: "delete-room", pin });
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

export async function generateRemedialTest(
  pin: string,
  customApiKey?: string,
): Promise<RemedialTest> {
  const data = await invokeFunction<{ result: RemedialTest }>("room-api", {
    action: "remedial",
    pin,
    customApiKey: customApiKey || "",
  });
  return data.result;
}
