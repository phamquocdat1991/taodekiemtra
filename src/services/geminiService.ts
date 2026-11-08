import { GoogleGenAI } from "@google/genai";
import {
  FullExamState,
  MatrixData,
  SpecificationData,
  ExamData,
  AnswerData,
  DetailGuideData,
  ExamQuestion,
  AnswerItem,
  DetailGuideItem,
} from "../types";
import {
  generateSmartMatrix,
  generateSmartSpecification,
  generateSmartExam,
  generateSmartAnswers,
  generateSmartDetailGuide,
} from "./mockDataGenerator";

export function getCustomApiKey(): string | null {
  try {
    return sessionStorage.getItem("gemini_user_api_key") || null;
  } catch {
    return null;
  }
}

export function setCustomApiKey(key: string) {
  try {
    if (key.trim()) {
      sessionStorage.setItem("gemini_user_api_key", key.trim());
    } else {
      sessionStorage.removeItem("gemini_user_api_key");
    }
  } catch (e) {
    console.error("Cannot save to sessionStorage", e);
  }
}

// Clean and extract JSON string from raw text
function extractAndParseJSON<T>(rawText: string): T {
  let cleanText = rawText.trim();
  // Remove markdown code fence ```json ... ```
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  // Try direct parse
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    // Attempt simple repair: match { ... } or [ ... ]
    const firstBrace = cleanText.indexOf("{");
    const lastBrace = cleanText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sub = cleanText.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sub);
      } catch (subErr) {
        console.warn("Regex JSON repair attempt failed, falling back", subErr);
      }
    }
    throw new Error("Không thể phân tích dữ liệu JSON từ AI: " + (err as Error).message);
  }
}

async function callDirectClientGemini(apiKey: string, prompt: string, systemInstruction?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ];
  let lastErr: any = null;
  for (const m of models) {
    try {
      const resp = await ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          systemInstruction:
            systemInstruction ||
            "Bạn là chuyên gia khảo thí, soạn thảo đề kiểm tra theo chuẩn Chương trình GDPT 2018 của Bộ Giáo dục và Đào tạo Việt Nam. Bạn PHẢI trả về duy nhất định dạng JSON chuẩn không kèm bất kỳ giải thích Markdown nào bên ngoài.",
          responseMimeType: "application/json",
          temperature: 0.35,
        },
      });
      if (resp.text) return resp.text.trim();
    } catch (e: any) {
      lastErr = e;
      console.warn(`[Client-Side Gemini] Model ${m} gặp sự cố: ${e?.message}, chuyển model tiếp theo...`);
    }
  }
  throw new Error("Lỗi gọi trực tiếp Gemini: " + (lastErr?.message || "Không có phản hồi"));
}

export interface ExamStructureAnalysis {
  isLanguage: boolean;
  isLiterature: boolean;
  isStandard: boolean;
  isPureEssay: boolean;
  hasMultipleChoice: boolean;
  hasTrueFalse: boolean;
  hasShortAnswer: boolean;
  hasEssay: boolean;
  zeroNb: boolean;
  zeroTh: boolean;
  zeroVd: boolean;
  zeroVdc: boolean;
  totalQuestionsTarget: number;
  structureSummary: string;
  strictMatrixRules: string;
  strictSpecRules: string;
  strictExamRules: string;
}

export function analyzeExamStructure(config: FullExamState): ExamStructureAnalysis {
  const { general, structure, cognition } = config;
  const isLanguage =
    structure.type === "language" ||
    general.subject.toLowerCase().includes("tiếng anh") ||
    general.subject.toLowerCase().includes("ngoại ngữ");
  const isLiterature =
    structure.type === "literature" ||
    general.subject.toLowerCase().includes("ngữ văn") ||
    general.subject.toLowerCase().includes("tiếng việt");
  const isStandard = !isLanguage && !isLiterature;

  const std = structure.standard;
  const hasMultipleChoice = isStandard && (std.multipleChoice.count > 0 || std.multipleChoice.percent > 0);
  const hasTrueFalse = isStandard && (std.trueFalse.count > 0 || std.trueFalse.percent > 0);
  const hasShortAnswer = isStandard && (std.shortAnswer.count > 0 || std.shortAnswer.percent > 0);
  const hasEssay = isStandard ? (std.essay.count > 0 || std.essay.percent > 0) : true;

  const isPureEssay =
    isStandard &&
    !hasMultipleChoice &&
    !hasTrueFalse &&
    !hasShortAnswer &&
    hasEssay;

  const zeroNb = (cognition.nb || 0) <= 0;
  const zeroTh = (cognition.th || 0) <= 0;
  const zeroVd = (cognition.vd || 0) <= 0;
  const zeroVdc = (cognition.vdc || 0) <= 0;

  let totalQuestionsTarget = 0;
  if (isStandard) {
    totalQuestionsTarget =
      std.multipleChoice.count +
      std.trueFalse.count +
      std.shortAnswer.count +
      std.essay.count;
    if (totalQuestionsTarget === 0) totalQuestionsTarget = isPureEssay ? 5 : 20;
  } else if (isLiterature) {
    totalQuestionsTarget =
      structure.literature.readingComprehension.count +
      structure.literature.writingComposition.count;
  } else if (isLanguage) {
    totalQuestionsTarget =
      structure.language.listening.count +
      structure.language.languageFocus.count +
      structure.language.reading.count +
      structure.language.writing.count;
  }

  let structureSummary = "";
  if (isStandard) {
    if (isPureEssay) {
      structureSummary = `ĐỀ THI 100% TỰ LUẬN (${std.essay.count || 5} câu tự luận = ${std.essay.points || 10.0} điểm). TUYỆT ĐỐI KHÔNG CÓ TRẮC NGHIỆM! (Trắc nghiệm nhiều lựa chọn: 0 câu, Đúng/Sai: 0 câu, Trả lời ngắn: 0 câu).`;
    } else {
      const partsList: string[] = [];
      if (hasMultipleChoice) partsList.push(`- Trắc nghiệm nhiều lựa chọn: ${std.multipleChoice.count} câu (${std.multipleChoice.percent}%, ${std.multipleChoice.points}đ)`);
      if (hasTrueFalse) partsList.push(`- Trắc nghiệm Đúng/Sai: ${std.trueFalse.count} câu (${std.trueFalse.percent}%, ${std.trueFalse.points}đ)`);
      if (hasShortAnswer) partsList.push(`- Trả lời ngắn: ${std.shortAnswer.count} câu (${std.shortAnswer.percent}%, ${std.shortAnswer.points}đ)`);
      if (hasEssay) partsList.push(`- Tự luận: ${std.essay.count} câu (${std.essay.percent}%, ${std.essay.points}đ)`);
      structureSummary = partsList.join("\n");
    }
  } else if (isLiterature) {
    structureSummary = `ĐẶC THÙ NGỮ VĂN: Phần Đọc hiểu (${structure.literature.readingComprehension.points}đ, ${structure.literature.readingComprehension.count} câu) và Phần Viết/Làm văn (${structure.literature.writingComposition.points}đ, ${structure.literature.writingComposition.count} câu).`;
  } else if (isLanguage) {
    structureSummary = `ĐẶC THÙ NGOẠI NGỮ: Listening (${structure.language.listening.points}đ), Language Focus (${structure.language.languageFocus.points}đ), Reading (${structure.language.reading.points}đ), Writing (${structure.language.writing.points}đ).`;
  }

  // Strict Matrix Rules
  const matrixRules: string[] = [];
  if (zeroNb) {
    matrixRules.push("🔴 BẮT BUỘC: Mức độ Nhận biết (NB) = 0%! Cột 'nb' ở TẤT CẢ các dòng trong ma trận PHẢI BẰNG 0. Trường 'summary.totalNb' PHẢI BẰNG ĐÚNG 0! Tuyệt đối không được có bất kỳ câu hỏi nhận biết nào.");
  }
  if (zeroTh) {
    matrixRules.push("🔴 BẮT BUỘC: Mức độ Thông hiểu (TH) = 0%! Cột 'th' ở TẤT CẢ các dòng PHẢI BẰNG 0. Trường 'summary.totalTh' PHẢI BẰNG 0!");
  }
  if (zeroVd) {
    matrixRules.push("🔴 BẮT BUỘC: Mức độ Vận dụng (VD) = 0%! Cột 'vd' ở TẤT CẢ các dòng PHẢI BẰNG 0. Trường 'summary.totalVd' PHẢI BẰNG 0!");
  }
  if (zeroVdc) {
    matrixRules.push("🔴 BẮT BUỘC: Mức độ Vận dụng cao (VDC) = 0%! Cột 'vdc' ở TẤT CẢ các dòng PHẢI BẰNG 0. Trường 'summary.totalVdc' PHẢI BẰNG 0!");
  }

  if (isStandard) {
    if (isPureEssay) {
      matrixRules.push(`🔴 BẮT BUỘC: ĐÂY LÀ ĐỀ 100% TỰ LUẬN! (Tổng cộng đúng ${std.essay.count || 5} câu tự luận = ${std.essay.points || 10.0} điểm).`);
      matrixRules.push("- Cột 'questionType' ở TẤT CẢ các dòng trong ma trận BẮT BUỘC PHẢI LÀ 'Tự luận' (hoặc 'Tự luận giải toán / giải quyết vấn đề').");
      matrixRules.push("- TUYỆT ĐỐI CẤM KHÔNG ĐƯỢC XUẤT HIỆN TỪ 'Trắc nghiệm', 'Nhiều lựa chọn', 'Đúng/Sai', 'Trả lời ngắn'!");
    } else {
      if (!hasMultipleChoice) matrixRules.push("- CẤM: Không có trắc nghiệm nhiều lựa chọn (số câu = 0).");
      if (!hasTrueFalse) matrixRules.push("- CẤM: Không có trắc nghiệm Đúng/Sai (số câu = 0).");
      if (!hasShortAnswer) matrixRules.push("- CẤM: Không có câu trả lời ngắn (số câu = 0).");
      if (!hasEssay) matrixRules.push("- CẤM: Không có câu tự luận (số câu = 0).");
    }
  }

  // Strict Spec Rules
  const specRules: string[] = [];
  if (zeroNb) {
    specRules.push("🔴 BẮT BUỘC: Không có mức độ Nhận biết (NB = 0%). Bản đặc tả TUYỆT ĐỐI KHÔNG ĐƯỢC có câu nào có level = 'Nhận biết'! Chỉ được dùng 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'.");
  }
  if (isPureEssay) {
    specRules.push("🔴 BẮT BUỘC: Đề 100% Tự luận. Bản đặc tả chỉ gồm các câu tự luận, mục tiêu cần đạt tập trung vào phân tích, tính toán, lập luận và giải quyết vấn đề.");
  }

  // Strict Exam Rules
  const examRules: string[] = [];
  if (zeroNb) {
    examRules.push("🔴 BẮT BUỘC: Đề thi không có câu hỏi ở mức độ Nhận biết. Các câu hỏi phải ở mức độ Thông hiểu, Vận dụng, Vận dụng cao theo đúng Bản đặc tả.");
  }
  if (isPureEssay) {
    examRules.push("🔴 BẮT BUỘC: ĐÂY LÀ ĐỀ THI 100% TỰ LUẬN!");
    examRules.push("- Tuyệt đối KHÔNG ĐƯỢC TẠO câu hỏi trắc nghiệm, không có phương án A, B, C, D, không có Đúng/Sai, không có điền khuyết!");
    examRules.push(`- Đề thi chỉ gồm các câu hỏi TỰ LUẬN (type: 'essay'), chia thành 1 phần duy nhất 'PHẦN TỰ LUẬN (10,0 ĐIỂM)' hoặc các bài toán tự luận lớn.`);
    examRules.push("- Mỗi câu tự luận phải có nội dung hoàn chỉnh, yêu cầu trình bày chi tiết các bước giải, lập luận, chứng minh hoặc giải thích.");
  }

  return {
    isLanguage,
    isLiterature,
    isStandard,
    isPureEssay,
    hasMultipleChoice,
    hasTrueFalse,
    hasShortAnswer,
    hasEssay,
    zeroNb,
    zeroTh,
    zeroVd,
    zeroVdc,
    totalQuestionsTarget,
    structureSummary,
    strictMatrixRules: matrixRules.join("\n"),
    strictSpecRules: specRules.join("\n"),
    strictExamRules: examRules.join("\n"),
  };
}

async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  const customApiKey = getCustomApiKey();
  try {
    const response = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        systemInstruction:
          systemInstruction ||
          "Bạn là chuyên gia khảo thí, soạn thảo đề kiểm tra theo chuẩn Chương trình GDPT 2018 của Bộ Giáo dục và Đào tạo Việt Nam. Bạn PHẢI trả về duy nhất định dạng JSON chuẩn không kèm bất kỳ giải thích Markdown nào bên ngoài.",
        customApiKey,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result;
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.message || `Lỗi từ máy chủ: ${response.status}`;

    if (customApiKey && (response.status === 404 || response.status >= 500 || errData.error === "NO_API_KEY")) {
      console.warn("Máy chủ không phản hồi hoặc thiếu key, chuyển sang gọi trực tiếp Gemini từ trình duyệt...");
      return await callDirectClientGemini(customApiKey, prompt, systemInstruction);
    }
    throw new Error(errMsg);
  } catch (err: any) {
    if (customApiKey) {
      console.warn("Kết nối máy chủ bị lỗi, tự động chuyển sang gọi trực tiếp Gemini từ trình duyệt...", err);
      return await callDirectClientGemini(customApiKey, prompt, systemInstruction);
    }
    throw err;
  }
}

// STEP 1: GENERATE MATRIX
export async function generateMatrixAI(config: FullExamState): Promise<MatrixData> {
  const analysis = analyzeExamStructure(config);
  try {
    const prompt = `
Hãy tạo MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ chuẩn Bộ Giáo dục và Đào tạo Việt Nam (Phụ lục 1) theo cấu hình sau:
- Môn học: ${config.general.subject} - ${config.general.grade} (${config.general.educationLevel})
- Cơ quan: ${config.general.department} - Trường: ${config.general.schoolName}
- Loại đề: ${config.general.examType}
- Thời gian làm bài: ${config.general.duration} phút
- Bộ sách: ${config.general.textbook}
- Mức độ nhận thức: Nhận biết (NB) ${config.cognition.nb}%, Thông hiểu (TH) ${config.cognition.th}%, Vận dụng (VD) ${config.cognition.vd}%, Vận dụng cao (VDC) ${config.cognition.vdc}%.
- Mức độ đề: ${config.cognition.difficulty}
- Nội dung kiến thức trọng tâm:
${config.knowledge.content}
${config.knowledge.attachmentContent ? `\nDữ liệu từ tài liệu đính kèm:\n${config.knowledge.attachmentContent.slice(0, 3000)}` : ""}
- Yêu cầu bổ sung của giáo viên:
${config.knowledge.additionalRequirements || "Không có"}
- Cấu trúc câu hỏi chi tiết:
${analysis.structureSummary}

${analysis.strictMatrixRules}

YÊU CẦU ĐẦU RA JSON:
{
  "title": "KHUNG MA TRẬN ĐỀ KIỂM TRA ${config.general.examType.toUpperCase()}\\nMÔN: ${config.general.subject.toUpperCase()} - ${config.general.grade.toUpperCase()}",
  "rows": [
    {
      "stt": 1,
      "topic": "Tên chương / Chủ đề",
      "knowledgeUnit": "Tên bài / Đơn vị kiến thức cụ thể",
      "questionType": "${analysis.isPureEssay ? "Tự luận" : "Trắc nghiệm / Tự luận theo cấu trúc"}",
      "nb": ${analysis.zeroNb ? 0 : 2},
      "th": 2,
      "vd": 1,
      "vdc": 0,
      "totalQuestions": 5,
      "totalPoints": 3.0,
      "percent": 30
    }
  ],
  "summary": {
    "totalNb": ${analysis.zeroNb ? 0 : 2},
    "totalTh": 3,
    "totalVd": 2,
    "totalVdc": 1,
    "totalQuestions": 8,
    "totalPoints": 10.0,
    "totalPercent": 100
  }
}
Tổng số điểm toàn ma trận PHẢI BẰNG ĐÚNG 10.0 điểm và tổng tỷ lệ PHẢI BẰNG ĐÚNG 100%.
`;

    const raw = await callGeminiApi(prompt);
    const parsed = extractAndParseJSON<MatrixData>(raw);
    if (!parsed.rows || parsed.rows.length === 0) {
      throw new Error("Ma trận rỗng");
    }

    // Guardrail Post-Processing: Đảm bảo tuân thủ nghiêm ngặt cấu hình giáo viên
    if (analysis.zeroNb) {
      parsed.rows.forEach((r) => {
        if (r.nb > 0) {
          r.th = (r.th || 0) + r.nb;
          r.nb = 0;
        }
      });
    }

    if (analysis.isPureEssay) {
      parsed.rows.forEach((r) => {
        r.questionType = "Tự luận";
      });
    }

    // Ensure 10 pts and 100%
    parsed.summary = {
      totalNb: parsed.rows.reduce((s, r) => s + (r.nb || 0), 0),
      totalTh: parsed.rows.reduce((s, r) => s + (r.th || 0), 0),
      totalVd: parsed.rows.reduce((s, r) => s + (r.vd || 0), 0),
      totalVdc: parsed.rows.reduce((s, r) => s + (r.vdc || 0), 0),
      totalQuestions: parsed.rows.reduce((s, r) => s + (r.totalQuestions || 0), 0),
      totalPoints: 10.0,
      totalPercent: 100,
    };
    return parsed;
  } catch (error) {
    console.warn("AI Generation failed for Matrix, falling back to smart generator:", error);
    return generateSmartMatrix(config);
  }
}

// STEP 2: GENERATE SPECIFICATION
export async function generateSpecificationAI(
  config: FullExamState,
  matrix: MatrixData
): Promise<SpecificationData> {
  const analysis = analyzeExamStructure(config);
  try {
    const prompt = `
Dựa vào Ma trận đã tạo dưới đây, hãy sinh BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ (Phụ lục 2) chuẩn Bộ Giáo dục:
THÔNG TIN:
- Môn: ${config.general.subject} - Lớp ${config.general.grade}
- Ma trận: ${JSON.stringify(matrix.rows)}

${analysis.strictSpecRules}

YÊU CẦU: Mỗi câu trong bản đặc tả phải ánh xạ 1:1 với ma trận và xác định rõ Yêu cầu cần đạt, Mức độ, Thời gian dự kiến và Điểm số.

YÊU CẦU ĐẦU RA JSON:
{
  "title": "BẢN ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA ${config.general.examType.toUpperCase()}\\nMÔN: ${config.general.subject.toUpperCase()} - ${config.general.grade.toUpperCase()}",
  "rows": [
    {
      "questionNumber": "Câu 1",
      "topic": "Chủ đề",
      "knowledgeUnit": "Đơn vị kiến thức",
      "level": "${analysis.zeroNb ? "Thông hiểu" : "Nhận biết"}",
      "objective": "Yêu cầu cần đạt chi tiết của câu hỏi...",
      "estimatedTime": 2,
      "points": 0.25
    }
  ],
  "totalTime": ${config.general.duration},
  "totalPoints": 10.0
}
`;

    const raw = await callGeminiApi(prompt);
    const parsed = extractAndParseJSON<SpecificationData>(raw);
    if (!parsed.rows || parsed.rows.length === 0) {
      throw new Error("Bản đặc tả rỗng");
    }

    // Guardrail Post-Processing cho Specification:
    if (analysis.zeroNb) {
      parsed.rows.forEach((r) => {
        if (r.level === "Nhận biết") {
          r.level = "Thông hiểu";
          if (!r.objective.includes("Hiểu") && !r.objective.includes("Giải thích")) {
            r.objective = r.objective.replace(/^Nhận biết\s*/i, "Hiểu và giải thích ");
          }
        }
      });
    }

    parsed.totalTime = config.general.duration;
    parsed.totalPoints = 10.0;
    return parsed;
  } catch (error) {
    console.warn("AI Generation failed for Spec, falling back to smart generator:", error);
    return generateSmartSpecification(config, matrix);
  }
}

// STEP 3: GENERATE EXAM
export async function generateExamAI(
  config: FullExamState,
  matrix: MatrixData,
  spec: SpecificationData
): Promise<ExamData> {
  const analysis = analyzeExamStructure(config);
  try {
    const prompt = `
Dựa vào Ma trận và Bản đặc tả đã có, hãy tạo ĐỀ KIỂM TRA ĐỊNH KỲ HOÀN CHỈNH cho học sinh:
- Cơ quan chủ quản: ${config.general.department}
- Tên trường: ${config.general.schoolName}
- Môn: ${config.general.subject} - Lớp ${config.general.grade}
- Thời gian: ${config.general.duration} phút
- Đề thi: ${config.general.examType}
- Cấu trúc: ${analysis.structureSummary}
- Tổng số điểm: ĐÚNG 10.0 điểm.
- ĐẶC BIỆT: KHÔNG HIỂN THỊ ĐÁP ÁN TRONG ĐỀ THI DÀNH CHO HỌC SINH.
- Câu hỏi bám sát chuẩn kiến thức, ngôn ngữ sư phạm chuẩn mực tiếng Việt Unicode.
- Nếu là môn Toán/Khoa học: ghi rõ công thức và số liệu chính xác.
- Nếu là Ngữ văn: có đoạn trích ngữ liệu đọc hiểu và phần viết.
- Nếu là Tiếng Anh: chia rõ các phần Listening, Language Focus, Reading, Writing.

BẢN ĐẶC TẢ CHI TIẾT TỪNG CÂU HỎI (BẮT BUỘC KHỚP 1:1, KHÔNG ĐƯỢC TỰ Ý TẠO THÊM HOẶC BỎ BỚT CÂU):
${JSON.stringify(
  spec.rows.map((r) => ({
    cau: r.questionNumber,
    chuDe: r.topic,
    donViKienThuc: r.knowledgeUnit,
    mucDo: r.level,
    diem: r.points,
    yeuCauCanDat: r.objective,
  }))
)}

${analysis.strictExamRules}

YÊU CẦU ĐẦU RA JSON:
{
  "header": {
    "department": "${config.general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO"}",
    "schoolName": "${config.general.schoolName || "TRƯỜNG THPT CHU VĂN AN"}",
    "examTitle": "ĐỀ KIỂM TRA ${config.general.examType.toUpperCase()}",
    "subject": "${config.general.subject}",
    "grade": "${config.general.grade}",
    "duration": ${config.general.duration},
    "schoolYear": "2025 - 2026"
  },
  "totalPoints": 10.0,
  "parts": ${
    analysis.isPureEssay
      ? `[
    {
      "partTitle": "PHẦN BÀI TẬP TỰ LUẬN (10,0 ĐIỂM)",
      "description": "Thí sinh trình bày chi tiết lời giải các câu hỏi sau vào giấy làm bài.",
      "totalPoints": 10.0,
      "questions": [
        {
          "id": "tl_1",
          "questionNumber": 1,
          "type": "essay",
          "content": "Nội dung bài tự luận 1 (yêu cầu bài toán hoàn chỉnh, tính toán, chứng minh hoặc giải thích)...",
          "points": 2.0
        }
      ]
    }
  ]`
      : `[
    {
      "partTitle": "PHẦN I. CÂU TRẮC NGHIỆM...",
      "description": "Hướng dẫn làm bài phần I...",
      "passage": "Đoạn văn nếu có hoặc để trống",
      "totalPoints": 3.0,
      "questions": [
        {
          "id": "q1",
          "questionNumber": 1,
          "type": "multipleChoice",
          "content": "Nội dung câu hỏi...",
          "options": [
            { "key": "A", "text": "Phương án A" },
            { "key": "B", "text": "Phương án B" },
            { "key": "C", "text": "Phương án C" },
            { "key": "D", "text": "Phương án D" }
          ],
          "points": 0.25
        }
      ]
    }
  ]`
  }
}
`;

    const raw = await callGeminiApi(prompt);
    const parsed = extractAndParseJSON<ExamData>(raw);
    if (!parsed.parts || parsed.parts.length === 0) {
      throw new Error("Đề thi rỗng");
    }

    // Guardrail Post-Processing: Nếu người dùng cài 100% tự luận, lọc sạch mọi dấu vết trắc nghiệm
    if (analysis.isPureEssay) {
      parsed.parts.forEach((part) => {
        if (/trắc nghiệm|nhiều lựa chọn|đúng[\s/]*sai/i.test(part.partTitle)) {
          part.partTitle = "PHẦN BÀI TẬP TỰ LUẬN";
          part.description = "Thí sinh trình bày chi tiết lời giải các câu hỏi sau vào giấy làm bài.";
        }
        part.questions.forEach((q) => {
          q.type = "essay";
          delete q.options;
          delete q.subQuestions;
        });
      });
    }

    parsed.totalPoints = 10.0;
    return parsed;
  } catch (error) {
    console.warn("AI Generation failed for Exam, falling back to smart generator:", error);
    return generateSmartExam(config, spec);
  }
}

// STEP 4: GENERATE ANSWERS
export async function generateAnswersAI(
  config: FullExamState,
  exam: ExamData
): Promise<AnswerData> {
  try {
    const prompt = `
Dựa vào Đề thi sau đây, hãy tạo ĐÁP ÁN VÀ BIỂU ĐIỂM CHI TIẾT (khớp 1:1 với đề thi, tổng điểm đúng 10.0):
Đề thi:
${JSON.stringify(exam)}

YÊU CẦU ĐẦU RA JSON:
{
  "title": "ĐÁP ÁN VÀ BIỂU ĐIỂM ĐỀ KIỂM TRA...",
  "totalPoints": 10.0,
  "parts": [
    {
      "partTitle": "Tên phần tương ứng trong đề",
      "items": [
        {
          "questionNumber": "Câu 1",
          "solutionSummary": "Đáp án đúng hoặc Lời giải tóm tắt",
          "points": 0.25,
          "note": "Ghi chú chấm điểm nếu có"
        }
      ]
    }
  ]
}
`;

    const raw = await callGeminiApi(prompt);
    const parsed = extractAndParseJSON<AnswerData>(raw);
    if (!parsed.parts || parsed.parts.length === 0) {
      throw new Error("Đáp án rỗng");
    }
    parsed.totalPoints = 10.0;
    return parsed;
  } catch (error) {
    console.warn("AI Generation failed for Answers, falling back to smart generator:", error);
    return generateSmartAnswers(config, exam);
  }
}

// STEP 5: GENERATE DETAIL GUIDE
export async function generateDetailGuideAI(
  config: FullExamState,
  exam: ExamData,
  answers: AnswerData
): Promise<DetailGuideData> {
  try {
    const prompt = `
Dựa vào Đề thi và Đáp án đã có, hãy tạo HƯỚNG DẪN GIẢI CHI TIẾT DÀNH CHO GIÁO VIÊN:
Đề thi: ${JSON.stringify(exam)}
Đáp án: ${JSON.stringify(answers)}

YÊU CẦU:
Với từng câu hỏi, hãy cung cấp:
1. Đáp án đúng
2. Cách giải / các bước lập luận chi tiết
3. Đơn vị kiến thức / định lý / quy tắc áp dụng
4. Lỗi thường gặp của học sinh và lưu ý phòng tránh
5. Tiêu chí chấm điểm chi tiết (Rubric)

YÊU CẦU ĐẦU RA JSON:
{
  "title": "HƯỚNG DẪN GIẢI CHI TIẾT VÀ LƯU Ý SƯ PHẠM",
  "items": [
    {
      "questionNumber": "Câu 1",
      "questionExcerpt": "Đoạn trích câu hỏi...",
      "answer": "Đáp án",
      "detailedSolution": "Lời giải từng bước...",
      "knowledgeUsed": "Kiến thức sử dụng...",
      "commonMistakes": "Lỗi thường gặp của học sinh...",
      "rubric": [
        { "criterion": "Tiêu chí 1", "points": 0.5 }
      ]
    }
  ]
}
`;

    const raw = await callGeminiApi(prompt);
    const parsed = extractAndParseJSON<DetailGuideData>(raw);
    if (!parsed.items || parsed.items.length === 0) {
      throw new Error("Hướng dẫn giải rỗng");
    }
    return parsed;
  } catch (error) {
    console.warn("AI Generation failed for Detail Guide, falling back to smart generator:", error);
    return generateSmartDetailGuide(config, exam, answers);
  }
}

export interface RegenerateQuestionResponse {
  question: ExamQuestion;
  answerItem: AnswerItem;
  detailItem?: DetailGuideItem;
}

/**
 * Sinh câu hỏi mới tương đương bằng AI khi giáo viên muốn đổi 1 câu cụ thể
 */
export async function regenerateQuestionAI(
  question: ExamQuestion,
  subject: string,
  grade: string,
  cognitionLevel?: string
): Promise<RegenerateQuestionResponse> {
  const customApiKey = getCustomApiKey();
  const fallbackPrompt = `
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

  try {
    const response = await fetch("/api/gemini/regenerate-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        subject,
        grade,
        cognitionLevel: cognitionLevel || "Thông hiểu",
        customApiKey,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result;
    }

    const errData = await response.json().catch(() => ({}));
    if (customApiKey && (response.status === 404 || response.status >= 500 || errData.error === "NO_API_KEY")) {
      const text = await callDirectClientGemini(customApiKey, fallbackPrompt);
      return extractAndParseJSON<RegenerateQuestionResponse>(text);
    }
    throw new Error(errData.message || `Lỗi từ máy chủ: ${response.status}`);
  } catch (err: any) {
    if (customApiKey) {
      const text = await callDirectClientGemini(customApiKey, fallbackPrompt);
      return extractAndParseJSON<RegenerateQuestionResponse>(text);
    }
    throw err;
  }
}
