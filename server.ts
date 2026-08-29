import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route for Gemini AI Exam Generation
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction, temperature, customApiKey } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt parameter" });
      }

      // Priority: 1. User-supplied custom key from session 2. Environment key
      const apiKey = (customApiKey && typeof customApiKey === "string" && customApiKey.trim())
        ? customApiKey.trim()
        : process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(401).json({
          error: "NO_API_KEY",
          message: "Chưa cấu hình API Key. Vui lòng nhấn 'NẠP API KEY' ở góc phải để nhập mã khóa Gemini."
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "Bạn là chuyên gia soạn thảo đề thi và khảo thí hàng đầu Việt Nam theo chuẩn GDPT 2018.",
          temperature: typeof temperature === "number" ? temperature : 0.4,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      return res.json({ result: text });
    } catch (error: any) {
      console.error("Gemini API Error:", error?.message || error);
      return res.status(500).json({
        error: "AI_GENERATION_FAILED",
        message: error?.message || "Lỗi khi gọi Gemini AI"
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Tao-De-Kiem-Tra-AI" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Tao De Kiem Tra] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
