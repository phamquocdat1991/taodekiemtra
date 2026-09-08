import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// In-Memory Room Store
interface StudentSubmission {
  studentName: string;
  submittedAt: number;
  answers: Record<string, string>;
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

interface ServerRoom {
  pin: string;
  createdAt: number;
  expiresAt: number;
  config: any;
  exam: any;
  answers: any;
  submissions: Map<string, StudentSubmission>;
}

const rooms = new Map<string, ServerRoom>();

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

function extractAnswer(s: string): string {
  if (!s) return "";
  const t = s.trim();
  const m1 = t.match(/^([A-Da-d])[.\s:)]/);
  if (m1) return m1[1].toUpperCase();
  const m2 = t.match(/^([A-Da-d])$/);
  if (m2) return m2[1].toUpperCase();
  return t.split(/[\s,;.]/)[0].toUpperCase();
}

function gradeSubmission(room: ServerRoom, studentAnswers: Record<string, string>) {
  let totalEarned = 0;
  let totalPoints = 0;
  const partResults: any[] = [];

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
      partResult.questions.push({
        questionNumber: q.questionNumber,
        questionExcerpt: (q.content || "").substring(0, 80) + ((q.content || "").length > 80 ? "..." : ""),
        studentAnswer: studentAnswers[qKey] || "",
        correctAnswer: correctAns || answerItem?.solutionSummary || "",
        isCorrect,
        points: q.points,
        earnedPoints: earned,
      });
    }
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

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: "50mb" }));

  // POST /api/rooms/create
  app.post("/api/rooms/create", (req: any, res: any) => {
    const { config, exam, answers } = req.body;
    if (!config || !exam || !answers) return res.status(400).json({ error: "Missing data" });
    const pin = generatePin();
    const now = Date.now();
    const durationMs = ((config.general?.duration || 50) + 5) * 60 * 1000;
    rooms.set(pin, { pin, createdAt: now, expiresAt: now + durationMs, config, exam, answers, submissions: new Map() });
    console.log(`[Room] Created: ${pin}`);
    return res.json({ pin, createdAt: now, expiresAt: now + durationMs, subject: config.general?.subject, grade: config.general?.grade, duration: config.general?.duration, totalQuestions: exam.parts?.reduce((s: number, p: any) => s + p.questions.length, 0) });
  });

  // GET /api/rooms/:pin
  app.get("/api/rooms/:pin", (req: any, res: any) => {
    const room = rooms.get(req.params.pin.toUpperCase());
    if (!room || Date.now() > room.expiresAt) { rooms.delete(req.params.pin.toUpperCase()); return res.status(404).json({ error: "Room not found or expired" }); }
    return res.json({ pin: room.pin, createdAt: room.createdAt, expiresAt: room.expiresAt, config: room.config, exam: room.exam });
  });

  // POST /api/rooms/:pin/submit
  app.post("/api/rooms/:pin/submit", (req: any, res: any) => {
    const pin = req.params.pin.toUpperCase();
    const room = rooms.get(pin);
    if (!room) return res.status(404).json({ error: "Room not found" });
    const { studentName, answers } = req.body;
    if (!studentName || !answers) return res.status(400).json({ error: "Missing data" });
    const result = gradeSubmission(room, answers);
    room.submissions.set(studentName, { studentName, submittedAt: Date.now(), answers, result });
    console.log(`[Room] ${pin}: ${studentName} -> ${result.earnedPoints}/${result.totalPoints}pts`);
    return res.json({ success: true, result });
  });

  // GET /api/rooms/:pin/results
  app.get("/api/rooms/:pin/results", (req: any, res: any) => {
    const pin = req.params.pin.toUpperCase();
    const room = rooms.get(pin);
    if (!room) return res.status(404).json({ error: "Room not found" });
    const subs = Array.from(room.submissions.values()).map(s => ({ studentName: s.studentName, submittedAt: s.submittedAt, earnedPoints: s.result.earnedPoints, totalPoints: s.result.totalPoints, scorePercent: s.result.scorePercent, partResults: s.result.partResults }));
    const wrongCounts: Record<string, { count: number; excerpt: string; correctAnswer: string }> = {};
    for (const sub of room.submissions.values()) {
      for (const part of sub.result.partResults) {
        for (const q of part.questions) {
          if (!q.isCorrect) { const k = String(q.questionNumber); if (!wrongCounts[k]) wrongCounts[k] = { count: 0, excerpt: q.questionExcerpt, correctAnswer: q.correctAnswer }; wrongCounts[k].count++; }
        }
      }
    }
    const topWrong = Object.entries(wrongCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([qNum, v]) => ({ questionNumber: qNum, wrongCount: v.count, wrongPercent: subs.length > 0 ? Math.round(v.count / subs.length * 100) : 0, excerpt: v.excerpt }));
    return res.json({ pin, submissionCount: subs.length, submissions: subs, topWrongQuestions: topWrong, roomInfo: { subject: room.config.general?.subject, grade: room.config.general?.grade, expiresAt: room.expiresAt } });
  });

  // POST /api/rooms/:pin/remedial
  app.post("/api/rooms/:pin/remedial", async (req: any, res: any) => {
    const pin = req.params.pin.toUpperCase();
    const room = rooms.get(pin);
    if (!room) return res.status(404).json({ error: "Room not found" });
    const { customApiKey } = req.body;
    const apiKey = (customApiKey && typeof customApiKey === "string" && customApiKey.trim()) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(401).json({ error: "NO_API_KEY" });
    const subs = Array.from(room.submissions.values());
    if (subs.length === 0) return res.status(400).json({ error: "No submissions yet" });

    const wrongCounts: Record<string, { count: number; excerpt: string; correctAnswer: string }> = {};
    for (const sub of subs) {
      for (const part of sub.result.partResults) {
        for (const q of part.questions) {
          if (!q.isCorrect) { const k = String(q.questionNumber); if (!wrongCounts[k]) wrongCounts[k] = { count: 0, excerpt: q.questionExcerpt, correctAnswer: q.correctAnswer }; wrongCounts[k].count++; }
        }
      }
    }
    const weakPoints = Object.entries(wrongCounts).filter(([, v]) => v.count >= Math.max(1, Math.floor(subs.length * 0.3))).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([qNum, v]) => `Cau ${qNum}: ${v.excerpt} (${Math.round(v.count/subs.length*100)}% lop sai, dap an dung: ${v.correctAnswer})`);

    if (weakPoints.length === 0) return res.status(400).json({ error: "INSUFFICIENT_DATA", message: "Khong du du lieu de phan tich. Can it nhat 30% hoc sinh lam sai cung mot cau." });

    const prompt = `Ban la chuyen gia su pham Viet Nam. Day la ket qua phan tich bai kiem tra mon ${room.config.general?.subject} lop ${room.config.general?.grade}.\n\nCac diem yeu phat hien:\n${weakPoints.join("\n")}\n\nHay sinh 10 cau luyen tap co muc tieu de khac phuc dung cac lo hong kien thuc tren.\nMoi cau phai:\n1. Khai thac dung diem yeu phat hien\n2. Co 4 lua chon A/B/C/D\n3. Co giai thich ngan\n\nTra ve JSON:\n{"title":"DE LUYEN CUNG CO - ${room.config.general?.subject} ${room.config.general?.grade}","targetedWeaknesses":["mo ta diem yeu 1"],"questions":[{"number":1,"content":"Noi dung cau hoi","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"Giai thich ngan gon"}]}`;

    const waterfall = [
      { model: process.env.GEMINI_MODEL || "gemini-3.8-flash", timeoutMs: 12000 },
      { model: "gemini-3.7-flash", timeoutMs: 10000 },
      { model: "gemini-3.6-flash", timeoutMs: 10000 },
      { model: "gemini-3.5-flash-lite", timeoutMs: 8000 },
    ];

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    let lastError: any = null;

    for (const candidate of waterfall) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error(`Timeout sau ${candidate.timeoutMs}ms`)), candidate.timeoutMs);
      try {
        const response = await ai.models.generateContent({
          model: candidate.model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            abortSignal: controller.signal,
          },
        });
        clearTimeout(timer);
        if (response.text) {
          return res.json({ result: JSON.parse(response.text.trim() || "{}"), meta: { usedModel: candidate.model } });
        }
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        console.warn(`[Taodekiemtra Resilience] Model ${candidate.model} gặp sự cố: ${err?.message}, chuyển model dự phòng...`);
      }
    }

    return res.status(500).json({ error: "AI_FAILED", message: lastError?.message || "Tất cả các model Gemini đều không phản hồi." });
  });

  // DELETE /api/rooms/:pin
  app.delete("/api/rooms/:pin", (req: any, res: any) => {
    return res.json({ success: rooms.delete(req.params.pin.toUpperCase()) });
  });

  // Existing Gemini endpoint
  app.post("/api/gemini/generate", async (req: any, res: any) => {
    try {
      const { prompt, systemInstruction, temperature, customApiKey } = req.body;
      if (!prompt) return res.status(400).json({ error: "Missing prompt parameter" });
      const apiKey = (customApiKey && typeof customApiKey === "string" && customApiKey.trim()) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(401).json({ error: "NO_API_KEY", message: "Chua cau hinh API Key. Vui long nhan NAP API KEY." });
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
      const response = await ai.models.generateContent({ model: "gemini-3.7-flash", contents: prompt, config: { systemInstruction: systemInstruction || "Ban la chuyen gia soan thao de thi Viet Nam.", temperature: typeof temperature === "number" ? temperature : 0.4, responseMimeType: "application/json" } });
      return res.json({ result: response.text || "{}" });
    } catch (error: any) {
      return res.status(500).json({ error: "AI_GENERATION_FAILED", message: error?.message || "Loi Gemini AI" });
    }
  });

  app.get("/api/health", (_req: any, res: any) => {
    res.json({ status: "ok", service: "Tao-De-Kiem-Tra-AI", activeRooms: rooms.size });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: any, res: any) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Tao De Kiem Tra] Server on http://0.0.0.0:${PORT}`);
  });
}

startServer();
