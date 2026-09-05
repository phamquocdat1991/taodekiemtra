import { corsHeaders } from "./cors.ts";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function readJson(req: Request): Promise<Record<string, any>> {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    throw new HttpError(415, "Yêu cầu phải dùng định dạng JSON.");
  }
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Nội dung JSON không hợp lệ.");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ message: error.message }, error.status);
  }
  const message = error instanceof Error ? error.message : "Lỗi máy chủ không xác định.";
  return json({ message }, 500);
}
