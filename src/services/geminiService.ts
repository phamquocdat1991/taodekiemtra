import {
  FullExamState,
  MatrixData,
  SpecificationData,
  ExamData,
  AnswerData,
  DetailGuideData,
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

async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  const customApiKey = getCustomApiKey();
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

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Lỗi từ máy chủ: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

// STEP 1: GENERATE MATRIX
export async function generateMatrixAI(config: FullExamState): Promise<MatrixData> {
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
- Cấu trúc câu hỏi: Loại ${config.structure.type}.

YÊU CẦU ĐẦU RA JSON:
{
  "title": "KHUNG MA TRẬN ĐỀ KIỂM TRA...",
  "rows": [
    {
      "stt": 1,
      "topic": "Tên chương / Chủ đề",
      "knowledgeUnit": "Tên bài / Đơn vị kiến thức cụ thể",
      "questionType": "Trắc nghiệm nhiều lựa chọn / Đúng Sai / Trả lời ngắn / Tự luận",
      "nb": 2,
      "th": 2,
      "vd": 1,
      "vdc": 0,
      "totalQuestions": 5,
      "totalPoints": 3.0,
      "percent": 30
    }
  ],
  "summary": {
    "totalNb": 4,
    "totalTh": 3,
    "totalVd": 2,
    "totalVdc": 1,
    "totalQuestions": 10,
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
    // ensure 10 pts and 100%
    parsed.summary = parsed.summary || {
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
  try {
    const prompt = `
Dựa vào Ma trận đã tạo dưới đây, hãy sinh BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ (Phụ lục 2) chuẩn Bộ Giáo dục:
THÔNG TIN:
- Môn: ${config.general.subject} - Lớp ${config.general.grade}
- Ma trận: ${JSON.stringify(matrix.rows)}

YÊU CẦU: Mỗi câu trong bản đặc tả phải ánh xạ 1:1 với ma trận và xác định rõ Yêu cầu cần đạt, Mức độ, Thời gian dự kiến và Điểm số.

YÊU CẦU ĐẦU RA JSON:
{
  "title": "BẢN ĐẶC TẢ ĐỀ KIỂM TRA...",
  "rows": [
    {
      "questionNumber": "Câu 1",
      "topic": "Chủ đề",
      "knowledgeUnit": "Đơn vị kiến thức",
      "level": "Nhận biết",
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
  try {
    const prompt = `
Dựa vào Ma trận và Bản đặc tả đã có, hãy tạo ĐỀ KIỂM TRA ĐỊNH KỲ HOÀN CHỈNH cho học sinh:
- Cơ quan chủ quản: ${config.general.department}
- Tên trường: ${config.general.schoolName}
- Môn: ${config.general.subject} - Lớp ${config.general.grade}
- Thời gian: ${config.general.duration} phút
- Đề thi: ${config.general.examType}
- Cấu trúc: ${config.structure.type}
- Tổng số điểm: ĐÚNG 10.0 điểm.
- ĐẶC BIỆT: KHÔNG HIỂN THỊ ĐÁP ÁN TRONG ĐỀ THI DÀNH CHO HỌC SINH.
- Câu hỏi bám sát chuẩn kiến thức, ngôn ngữ sư phạm chuẩn mực tiếng Việt Unicode.
- Nếu là môn Toán/Khoa học: ghi rõ công thức và số liệu chính xác.
- Nếu là Ngữ văn: có đoạn trích ngữ liệu đọc hiểu và phần viết.
- Nếu là Tiếng Anh: chia rõ các phần Listening, Language Focus, Reading, Writing.

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
  "parts": [
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
        },
        {
          "id": "q2",
          "questionNumber": 2,
          "type": "trueFalse",
          "content": "Nội dung câu hỏi Đúng/Sai...",
          "subQuestions": [
            { "label": "a)", "text": "Ý a" },
            { "label": "b)", "text": "Ý b" },
            { "label": "c)", "text": "Ý c" },
            { "label": "d)", "text": "Ý d" }
          ],
          "points": 1.0
        }
      ]
    }
  ]
}
`;

    const raw = await callGeminiApi(prompt);
    const parsed = extractAndParseJSON<ExamData>(raw);
    if (!parsed.parts || parsed.parts.length === 0) {
      throw new Error("Đề thi rỗng");
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
