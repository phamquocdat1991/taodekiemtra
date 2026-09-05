export interface AiRubricScore {
  criterion: string;
  points: number;
  comment?: string;
}

export interface AiQuestionSuggestion {
  questionId: string;
  suggestedPoints: number;
  feedback: string;
  rubricBreakdown: AiRubricScore[];
}

export interface AiReview {
  items: AiQuestionSuggestion[];
  overallComment: string;
}

export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(text.slice(first, last + 1)) as T;
    }
    throw new Error("AI không trả về JSON hợp lệ.");
  }
}

export function validateAiReview(result: any, input: any): AiReview {
  if (!input || !Array.isArray(input.items)) {
    throw new Error("Phản hồi AI thiếu danh sách gợi ý điểm.");
  }

  const pending = new Map<string, number>();
  for (const part of result?.partResults ?? []) {
    for (const question of part?.questions ?? []) {
      if (question?.gradingStatus === "pending_review") {
        pending.set(String(question.questionId), Number(question.points));
      }
    }
  }

  const seen = new Set<string>();
  const items: AiQuestionSuggestion[] = input.items.map((raw: any) => {
    const questionId = String(raw?.questionId ?? "");
    if (!pending.has(questionId)) {
      throw new Error(`Câu ${questionId || "không xác định"} không cần AI gợi ý.`);
    }
    if (seen.has(questionId)) {
      throw new Error(`Câu ${questionId} bị trùng trong gợi ý AI.`);
    }
    seen.add(questionId);

    const maximum = pending.get(questionId)!;
    const suggestedPoints = Number(raw?.suggestedPoints);
    if (
      !Number.isFinite(suggestedPoints) ||
      suggestedPoints < 0 ||
      suggestedPoints > maximum
    ) {
      throw new Error(`Điểm gợi ý câu ${questionId} phải từ 0 đến ${maximum}.`);
    }

    const rubricBreakdown = Array.isArray(raw?.rubricBreakdown)
      ? raw.rubricBreakdown.map((row: any) => ({
          criterion: String(row?.criterion ?? "").trim(),
          points: Number(row?.points) || 0,
          comment: String(row?.comment ?? "").trim() || undefined,
        }))
      : [];

    return {
      questionId,
      suggestedPoints,
      feedback: String(raw?.feedback ?? "").trim(),
      rubricBreakdown,
    };
  });

  for (const questionId of pending.keys()) {
    if (!seen.has(questionId)) {
      throw new Error(`Câu ${questionId} chưa có gợi ý từ AI.`);
    }
  }

  return {
    items,
    overallComment: String(input.overallComment ?? "").trim(),
  };
}
