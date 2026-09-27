import express from "express";
import { GoogleGenAI } from "@google/genai";

// In-Memory Room Store with anti-cheat support
export interface StudentSubmission {
  studentName: string;
  submittedAt: number;
  answers: Record<string, string>;
  tabSwitchCount: number;
  result: {
    earnedPoints: number;
    totalPoints: number;
    scorePercent: number;
    partResults: Array<{
      partTitle: string;
      earnedPoints: number;
      totalPoints: number;
      questions: Array<{
        questionNumber: string | number;
        questionExcerpt: string;
        studentAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        points: number;
        earnedPoints: number;
      }>;
    }>;
  };
}

export interface ServerRoom {
  pin: string;
  createdAt: number;
  expiresAt: number;
  config: any;
  exam: any;
  answers: any;
  submissions: Map<string, StudentSubmission>;
}

export const rooms = new Map<string, ServerRoom>();

// Auto-cleanup expired rooms every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [pin, room] of rooms) {
    if (now > room.expiresAt + 30 * 60 * 1000) {
      rooms.delete(pin);
    }
  }
}, 10 * 60 * 1000);

function generatePin(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(pin) ? generatePin() : pin;
}

function extractChoiceKey(s: string): string {
  if (!s) return "";
  const t = s.trim();
  const m1 = t.match(/^([A-Da-d])[.\s:)]/);
  if (m1) return m1[1].toUpperCase();
  const m2 = t.match(/^([A-Da-d])$/);
  if (m2) return m2[1].toUpperCase();
  return t.split(/[\s,;.]/)[0].toUpperCase();
}

function matchShortAnswerServer(studentInput: string, expectedAnswer: string): boolean {
  if (!studentInput || !expectedAnswer) return false;
  const cleanStudent = studentInput.trim().toLowerCase().replace(/\s+/g, "");
  const cleanExpected = expectedAnswer.trim().toLowerCase().replace(/\s+/g, "");

  if (cleanStudent === cleanExpected) return true;

  const dotStudent = cleanStudent.replace(/,/g, ".");
  const dotExpected = cleanExpected.replace(/,/g, ".");
  if (dotStudent === dotExpected) return true;

  const numStudent = parseFloat(dotStudent);
  const numExpected = parseFloat(dotExpected);
  if (!isNaN(numStudent) && !isNaN(numExpected)) {
    if (Math.abs(numStudent - numExpected) < 0.0001) return true;
  }

  if (dotStudent.includes("/") && dotExpected.includes("/")) {
    const [sn, sd] = dotStudent.split("/").map(Number);
    const [en, ed] = dotExpected.split("/").map(Number);
    if (!isNaN(sn) && !isNaN(sd) && sd !== 0 && !isNaN(en) && !isNaN(ed) && ed !== 0) {
      if (Math.abs(sn / sd - en / ed) < 0.0001) return true;
    }
  }
  return false;
}

function gradeSubmission(room: ServerRoom, studentAnswers: Record<string, string>) {
  let totalEarned = 0;
  let totalPoints = 0;
  const partResults: any[] = [];

  for (const part of room.exam.parts) {
    const answerPart = room.answers.parts.find((ap: any) => ap.partTitle === part.partTitle);
    const partResult = {
      partTitle: part.partTitle,
      earnedPoints: 0,
      totalPoints: part.totalPoints,
      questions: [] as any[],
    };

    for (const q of part.questions) {
      const qKey = String(q.questionNumber);
      const answerItem = answerPart?.items.find((a: any) => String(a.questionNumber) === qKey);
      const qType = q.type || (q.options ? "multipleChoice" : q.subQuestions ? "trueFalse" : "shortAnswer");

      let isCorrect = false;
      let earned = 0;
      let displayCorrectAnswer = answerItem?.solutionSummary || "";

      if (qType === "multipleChoice") {
        const studentAns = (studentAnswers[qKey] || "").trim().toUpperCase();
        const correctAns = extractChoiceKey(answerItem?.solutionSummary || "");
        isCorrect = studentAns !== "" && studentAns === correctAns;
        earned = isCorrect ? q.points : 0;
        displayCorrectAnswer = correctAns || answerItem?.solutionSummary || "";
      } else if (qType === "trueFalse" && q.subQuestions && q.subQuestions.length > 0) {
        let correctCount = 0;
        const totalStatements = q.subQuestions.length;
        const rawStudentAns = studentAnswers[qKey] || "";

        let parsedStudentChoices: Record<string, string> = {};
        try {
          if (rawStudentAns.startsWith("{")) {
            parsedStudentChoices = JSON.parse(rawStudentAns);
          }
        } catch {
          // ignore
        }

        const labels = ["a", "b", "c", "d"];
        labels.forEach((label) => {
          const sChoice = (parsedStudentChoices[label] || studentAnswers[`${qKey}:${label}`] || "").trim().toUpperCase();
          const expectedSummary = (answerItem?.solutionSummary || "").toUpperCase();
          const isStatementTrue = expectedSummary.includes(`${label}) ĐÚNG`) || expectedSummary.includes(`${label}: ĐÚNG`) || expectedSummary.includes(`${label}. ĐÚNG`);
          const expectedVal = isStatementTrue ? "ĐÚNG" : "SAI";

          if (sChoice === expectedVal || (sChoice.startsWith("Đ") && expectedVal === "ĐÚNG") || (sChoice.startsWith("S") && expectedVal === "SAI")) {
            correctCount++;
          }
        });

        // Non-linear MOET scale: 1 -> 0.1, 2 -> 0.25, 3 -> 0.5, 4 -> 1.0
        let scale = 0;
        if (correctCount === 1) scale = 0.1;
        else if (correctCount === 2) scale = 0.25;
        else if (correctCount === 3) scale = 0.5;
        else if (correctCount === 4) scale = 1.0;

        earned = Number(((scale / 1.0) * q.points).toFixed(2));
        isCorrect = correctCount === totalStatements;
      } else if (qType === "shortAnswer") {
        const studentAns = (studentAnswers[qKey] || "").trim();
        const correctAns = answerItem?.solutionSummary || "";
        isCorrect = matchShortAnswerServer(studentAns, correctAns);
        earned = isCorrect ? q.points : 0;
      } else {
        isCorrect = false;
        earned = 0;
      }

      partResult.earnedPoints += earned;
      partResult.questions.push({
        questionNumber: q.questionNumber,
        questionExcerpt: (q.content || "").substring(0, 80) + ((q.content || "").length > 80 ? "..." : ""),
        studentAnswer: studentAnswers[qKey] || "",
        correctAnswer: displayCorrectAnswer,
        isCorrect,
        points: q.points,
        earnedPoints: earned,
      });
    }

    partResult.earnedPoints = Number(partResult.earnedPoints.toFixed(2));
    totalEarned += partResult.earnedPoints;
    totalPoints += partResult.totalPoints;
    partResults.push(partResult);
  }

  return {
    earnedPoints: Number(totalEarned.toFixed(2)),
    totalPoints,
    scorePercent: totalPoints > 0 ? Math.round((totalEarned / totalPoints) * 100) : 0,
    partResults,
  };
}

// 4-Tier Cascading Resilience Gateway for Gemini
const GEMINI_WATERFALL = [
  { model: process.env.GEMINI_MODEL || "gemini-3.8-flash", timeoutMs: 25000 },
  { model: "gemini-3.7-flash", timeoutMs: 20000 },
  { model: "gemini-3.6-flash", timeoutMs: 18000 },
  { model: "gemini-3.5-flash-lite", timeoutMs: 15000 },
];

async function callResilientGemini(
  apiKey: string,
  prompt: string,
  systemInstruction?: string,
  temperature = 0.3
): Promise<{ text: string; model: string }> {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
  let lastError: any = null;

  for (const candidate of GEMINI_WATERFALL) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new Error(`Timeout sau ${candidate.timeoutMs}ms`)),
      candidate.timeoutMs
    );
    try {
      const response = await ai.models.generateContent({
        model: candidate.model,
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            "Bạn là chuyên gia khảo thí, soạn thảo đề kiểm tra chuẩn GDPT 2018 của Bộ Giáo dục và Đào tạo Việt Nam. Bạn PHẢI trả về JSON chuẩn xác.",
          temperature,
          responseMimeType: "application/json",
          abortSignal: controller.signal,
        },
      });
      clearTimeout(timer);
      if (response.text) {
        return { text: response.text.trim(), model: candidate.model };
      }
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`[Gemini Gateway] Model ${candidate.model} gặp lỗi: ${err?.message}, chuyển tầng dự phòng...`);
    }
  }

  throw new Error(lastError?.message || "Tất cả các model Gemini đều không phản hồi.");
}

export const app = express();
app.use(express.json({ limit: "50mb" }));

// GET /api/health
app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", service: "He-Thong-Khao-Thi-AI", activeRooms: rooms.size });
});

// POST /api/rooms/create
app.post("/api/rooms/create", (req: any, res: any) => {
  const { config, exam, answers } = req.body;
  if (!config || !exam || !answers) return res.status(400).json({ error: "Missing data" });
  const pin = generatePin();
  const now = Date.now();
  const durationMs = ((config.general?.duration || 50) + 5) * 60 * 1000;
  rooms.set(pin, { pin, createdAt: now, expiresAt: now + durationMs, config, exam, answers, submissions: new Map() });
  console.log(`[Room] Created: ${pin}`);
  return res.json({
    pin,
    createdAt: now,
    expiresAt: now + durationMs,
    subject: config.general?.subject,
    grade: config.general?.grade,
    duration: config.general?.duration,
    totalQuestions: exam.parts?.reduce((s: number, p: any) => s + p.questions.length, 0),
  });
});

// GET /api/rooms/:pin
app.get("/api/rooms/:pin", (req: any, res: any) => {
  const room = rooms.get(req.params.pin.toUpperCase());
  if (!room || Date.now() > room.expiresAt) {
    rooms.delete(req.params.pin.toUpperCase());
    return res.status(404).json({ error: "Room not found or expired" });
  }
  return res.json({
    pin: room.pin,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    config: room.config,
    exam: room.exam,
  });
});

// POST /api/rooms/:pin/submit
app.post("/api/rooms/:pin/submit", (req: any, res: any) => {
  const pin = req.params.pin.toUpperCase();
  const room = rooms.get(pin);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const { studentName, answers, tabSwitchCount } = req.body;
  if (!studentName || !answers) return res.status(400).json({ error: "Missing data" });

  const result = gradeSubmission(room, answers);
  room.submissions.set(studentName, {
    studentName,
    submittedAt: Date.now(),
    answers,
    tabSwitchCount: Number(tabSwitchCount) || 0,
    result,
  });
  console.log(`[Room] ${pin}: ${studentName} -> ${result.earnedPoints}/${result.totalPoints}pts (Rời màn hình: ${tabSwitchCount || 0} lần)`);
  return res.json({ success: true, result });
});

// GET /api/rooms/:pin/results
app.get("/api/rooms/:pin/results", (req: any, res: any) => {
  const pin = req.params.pin.toUpperCase();
  const room = rooms.get(pin);
  if (!room) return res.status(404).json({ error: "Room not found" });

  const subs = Array.from(room.submissions.values()).map((s) => ({
    studentName: s.studentName,
    submittedAt: s.submittedAt,
    earnedPoints: s.result.earnedPoints,
    totalPoints: s.result.totalPoints,
    scorePercent: s.result.scorePercent,
    tabSwitchCount: s.tabSwitchCount || 0,
    partResults: s.result.partResults,
  }));

  const wrongCounts: Record<string, { count: number; excerpt: string; correctAnswer: string }> = {};
  for (const sub of room.submissions.values()) {
    for (const part of sub.result.partResults) {
      for (const q of part.questions) {
        if (!q.isCorrect) {
          const k = String(q.questionNumber);
          if (!wrongCounts[k]) {
            wrongCounts[k] = { count: 0, excerpt: q.questionExcerpt, correctAnswer: q.correctAnswer };
          }
          wrongCounts[k].count++;
        }
      }
    }
  }

  const topWrong = Object.entries(wrongCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([qNum, v]) => ({
      questionNumber: qNum,
      wrongCount: v.count,
      wrongPercent: subs.length > 0 ? Math.round((v.count / subs.length) * 100) : 0,
      excerpt: v.excerpt,
    }));

  return res.json({
    pin,
    submissionCount: subs.length,
    submissions: subs,
    topWrongQuestions: topWrong,
    roomInfo: {
      subject: room.config.general?.subject,
      grade: room.config.general?.grade,
      expiresAt: room.expiresAt,
    },
  });
});

// POST /api/rooms/:pin/remedial
app.post("/api/rooms/:pin/remedial", async (req: any, res: any) => {
  const pin = req.params.pin.toUpperCase();
  const room = rooms.get(pin);
  if (!room) return res.status(404).json({ error: "Room not found" });

  const { customApiKey } = req.body;
  const apiKey = (customApiKey && typeof customApiKey === "string" && customApiKey.trim())
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(401).json({ error: "NO_API_KEY" });
  const subs = Array.from(room.submissions.values());
  if (subs.length === 0) return res.status(400).json({ error: "No submissions yet" });

  const wrongCounts: Record<string, { count: number; excerpt: string; correctAnswer: string }> = {};
  for (const sub of subs) {
    for (const part of sub.result.partResults) {
      for (const q of part.questions) {
        if (!q.isCorrect) {
          const k = String(q.questionNumber);
          if (!wrongCounts[k]) wrongCounts[k] = { count: 0, excerpt: q.questionExcerpt, correctAnswer: q.correctAnswer };
          wrongCounts[k].count++;
        }
      }
    }
  }
  const weakPoints = Object.entries(wrongCounts)
    .filter(([, v]) => v.count >= Math.max(1, Math.floor(subs.length * 0.3)))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([qNum, v]) => `Câu ${qNum}: ${v.excerpt} (${Math.round((v.count / subs.length) * 100)}% lớp làm sai, đáp án đúng: ${v.correctAnswer})`);

  if (weakPoints.length === 0) {
    return res.status(400).json({
      error: "INSUFFICIENT_DATA",
      message: "Không đủ dữ liệu phân tích. Cần ít nhất 30% học sinh làm sai cùng một câu.",
    });
  }

  const prompt = `Bạn là chuyên gia sư phạm Việt Nam. Đây là kết quả phân tích bài kiểm tra môn ${room.config.general?.subject} lớp ${room.config.general?.grade}.\n\nCác lỗ hổng kiến thức phát hiện:\n${weakPoints.join("\n")}\n\nHãy sinh 10 câu luyện tập củng cố để khắc phục đúng các điểm yếu trên.\nMỗi câu phải:\n1. Bám sát điểm yếu phát hiện\n2. Có 4 lựa chọn A/B/C/D rõ ràng\n3. Có giải thích ngắn gọn\n\nTrả về duy nhất định dạng JSON:\n{"title":"ĐỀ LUYỆN TẬP CỦNG CỐ - ${room.config.general?.subject} ${room.config.general?.grade}","targetedWeaknesses":["mô tả điểm yếu 1"],"questions":[{"number":1,"content":"Nội dung câu hỏi","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"Giải thích ngắn gọn"}]}`;

  try {
    const outcome = await callResilientGemini(apiKey, prompt);
    return res.json({ result: JSON.parse(outcome.text || "{}"), meta: { usedModel: outcome.model } });
  } catch (err: any) {
    return res.status(500).json({ error: "AI_FAILED", message: err?.message || "Lỗi tạo đề củng cố." });
  }
});

// DELETE /api/rooms/:pin
app.delete("/api/rooms/:pin", (req: any, res: any) => {
  return res.json({ success: rooms.delete(req.params.pin.toUpperCase()) });
});

// POST /api/gemini/generate
app.post("/api/gemini/generate", async (req: any, res: any) => {
  try {
    const { prompt, systemInstruction, temperature, customApiKey } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt parameter" });

    const apiKey = (customApiKey && typeof customApiKey === "string" && customApiKey.trim())
      ? customApiKey.trim()
      : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({
        error: "NO_API_KEY",
        message: "Chưa cấu hình API Key. Thầy/Cô vui lòng nhấn nút NẠP API KEY để nhập khóa Gemini.",
      });
    }

    const outcome = await callResilientGemini(
      apiKey,
      prompt,
      systemInstruction,
      typeof temperature === "number" ? temperature : 0.35
    );

    return res.json({ result: outcome.text || "{}", usedModel: outcome.model });
  } catch (error: any) {
    return res.status(500).json({
      error: "AI_GENERATION_FAILED",
      message: error?.message || "Lỗi kết nối Gemini AI. Vui lòng thử lại.",
    });
  }
});

// POST /api/gemini/regenerate-question
app.post("/api/gemini/regenerate-question", async (req: any, res: any) => {
  try {
    const { question, subject, grade, cognitionLevel, customApiKey } = req.body;
    if (!question) return res.status(400).json({ error: "Missing question data" });

    const apiKey = (customApiKey && typeof customApiKey === "string" && customApiKey.trim())
      ? customApiKey.trim()
      : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: "NO_API_KEY", message: "Chưa cấu hình API Key." });
    }

    const prompt = `
Bạn là chuyên gia khảo thí Việt Nam. Hãy tạo 1 câu hỏi MỚI TƯƠNG ĐƯƠNG hoàn toàn với câu hỏi sau về đơn vị kiến thức, độ khó và dạng thức, nhưng ĐỔI SỐ LIỆU hoặc NGỮ LIỆU để giáo viên thay thế vào đề thi:
- Môn học: ${subject || "Môn học"} - Lớp: ${grade || "Lớp"}
- Mức độ nhận thức: ${cognitionLevel || "Thông hiểu"}
- Câu hỏi gốc: ${JSON.stringify(question)}

Yêu cầu xuất ra JSON chuẩn:
{
  "question": {
    "id": "${question.id || "q_new"}",
    "questionNumber": "${question.questionNumber || 1}",
    "type": "${question.type || "multipleChoice"}",
    "content": "Nội dung câu hỏi mới...",
    "passage": "${question.passage ? "Đoạn trích mới nếu có..." : ""}",
    "options": [
      { "key": "A", "text": "Phương án A mới" },
      { "key": "B", "text": "Phương án B mới" },
      { "key": "C", "text": "Phương án C mới" },
      { "key": "D", "text": "Phương án D mới" }
    ],
    "subQuestions": ${question.subQuestions ? `[
      { "label": "a)", "text": "Ý a mới" },
      { "label": "b)", "text": "Ý b mới" },
      { "label": "c)", "text": "Ý c mới" },
      { "label": "d)", "text": "Ý d mới" }
    ]` : "null"},
    "points": ${question.points || 0.25}
  },
  "answerItem": {
    "questionNumber": "${question.questionNumber || 1}",
    "solutionSummary": "Đáp án đúng (VD: B hoặc bảng Đúng/Sai)",
    "points": ${question.points || 0.25}
  },
  "detailItem": {
    "questionNumber": "${question.questionNumber || 1}",
    "questionExcerpt": "Tóm tắt câu hỏi",
    "answer": "Đáp án đúng",
    "detailedSolution": "Lời giải chi tiết từng bước",
    "knowledgeUsed": "Đơn vị kiến thức áp dụng",
    "trapAnalysis": "Bẫy tư duy học sinh hay mắc phải"
  }
}
`;

    const outcome = await callResilientGemini(apiKey, prompt, undefined, 0.4);
    return res.json({ result: JSON.parse(outcome.text || "{}"), usedModel: outcome.model });
  } catch (error: any) {
    return res.status(500).json({ error: "REGEN_FAILED", message: error?.message || "Lỗi sinh câu hỏi tương đương" });
  }
});

export default app;
