import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse, HttpError, json, readJson } from "../_shared/http.ts";
import { generateGeminiText } from "../_shared/gemini.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ message: "Phương thức không được hỗ trợ." }, 405);
  }

  try {
    const body = await readJson(req);
    const prompt = String(body.prompt ?? "").trim();
    const systemInstruction = String(
      body.systemInstruction ??
        "Bạn là chuyên gia khảo thí theo Chương trình GDPT 2018. Chỉ trả về JSON hợp lệ.",
    ).trim();
    if (!prompt || prompt.length > 120_000) {
      throw new HttpError(400, "Nội dung yêu cầu AI trống hoặc quá dài.");
    }

    const apiKey = String(body.customApiKey ?? Deno.env.get("GEMINI_API_KEY") ?? "");
    const result = await generateGeminiText({
      apiKey,
      prompt,
      systemInstruction,
      temperature: Number(body.temperature ?? 0.25),
      model: Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash",
    });
    return json({ result });
  } catch (error) {
    return errorResponse(error);
  }
});
