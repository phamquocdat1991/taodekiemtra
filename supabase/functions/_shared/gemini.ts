interface GeminiRequest {
  apiKey: string;
  prompt: string;
  systemInstruction: string;
  temperature?: number;
  model?: string;
}

export async function generateGeminiText({
  apiKey,
  prompt,
  systemInstruction,
  temperature = 0.25,
  model = "gemini-3.8-flash",
}: GeminiRequest): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("Chưa cấu hình Gemini API key.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: Math.max(0, Math.min(1, temperature)),
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini từ chối yêu cầu: ${detail}`);
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text ?? "")
      .join("")
      .trim();
    if (!text) {
      throw new Error("Gemini không trả về nội dung.");
    }
    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Gemini phản hồi quá thời gian cho phép.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
