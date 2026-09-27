/**
 * Chuẩn hóa chấm điểm theo Quyết định số 764/QĐ-BGDĐT (Cấu trúc định dạng đề thi mới GDPT 2018)
 */

export interface TrueFalseResult {
  correctCount: number;
  totalStatements: number;
  earnedPoints: number;
  maxPoints: number;
}

/**
 * Tính điểm câu hỏi trắc nghiệm Đúng/Sai (Dạng thức II) theo chuẩn bậc thang Bộ GD&ĐT:
 * - Đúng 1 ý: 0,10 điểm
 * - Đúng 2 ý: 0,25 điểm
 * - Đúng 3 ý: 0,50 điểm
 * - Đúng 4 ý: 1,00 điểm
 * Nếu maxPoints của câu khác 1.0đ, tính tỷ lệ tương ứng.
 */
export function calculateTrueFalseScore(
  studentChoices: Record<string, string>, // { "a": "Đúng", "b": "Sai", ... }
  correctChoices: Record<string, string>, // { "a": "Đúng", "b": "Đúng", ... }
  maxPoints: number = 1.0
): TrueFalseResult {
  const statements = ["a", "b", "c", "d"];
  let correctCount = 0;

  for (const st of statements) {
    const studentAns = normalizeChoice(studentChoices[st] || studentChoices[`${st})`]);
    const correctAns = normalizeChoice(correctChoices[st] || correctChoices[`${st})`]);

    if (studentAns && correctAns && studentAns === correctAns) {
      correctCount++;
    }
  }

  // Official MOET Non-linear Scale for 4-statement question:
  let standardScore = 0;
  if (correctCount === 1) standardScore = 0.1;
  else if (correctCount === 2) standardScore = 0.25;
  else if (correctCount === 3) standardScore = 0.5;
  else if (correctCount === 4) standardScore = 1.0;

  const earnedPoints = Number(((standardScore / 1.0) * maxPoints).toFixed(2));

  return {
    correctCount,
    totalStatements: 4,
    earnedPoints,
    maxPoints,
  };
}

function normalizeChoice(val: string | undefined): string {
  if (!val) return "";
  const s = val.trim().toLowerCase();
  if (s === "đúng" || s === "dung" || s === "true" || s === "t" || s === "đ" || s === "d") return "ĐÚNG";
  if (s === "sai" || s === "false" || s === "f" || s === "s") return "SAI";
  return s.toUpperCase();
}

/**
 * Chuẩn hóa và so khớp câu trả lời ngắn (Dạng thức III):
 * Hỗ trợ số thập phân (cả dấu chấm và phẩy, ví dụ: "15.5" == "15,5"),
 * phân số ("3/4"), số âm ("-2"), khoảng trắng thừa.
 */
export function matchShortAnswer(studentInput: string, expectedAnswer: string): boolean {
  if (!studentInput || !expectedAnswer) return false;

  const cleanStudent = studentInput.trim().toLowerCase().replace(/\s+/g, "");
  const cleanExpected = expectedAnswer.trim().toLowerCase().replace(/\s+/g, "");

  // 1. Exact match
  if (cleanStudent === cleanExpected) return true;

  // 2. Comma vs Dot in decimals: "15,5" vs "15.5"
  const dotStudent = cleanStudent.replace(/,/g, ".");
  const dotExpected = cleanExpected.replace(/,/g, ".");
  if (dotStudent === dotExpected) return true;

  // 3. Numeric floating comparison
  const numStudent = parseFloat(dotStudent);
  const numExpected = parseFloat(dotExpected);
  if (!isNaN(numStudent) && !isNaN(numExpected)) {
    if (Math.abs(numStudent - numExpected) < 0.0001) return true;
  }

  // 4. Fraction comparison: "6/8" vs "3/4"
  if (dotStudent.includes("/") && dotExpected.includes("/")) {
    const [sn, sd] = dotStudent.split("/").map(Number);
    const [en, ed] = dotExpected.split("/").map(Number);
    if (!isNaN(sn) && !isNaN(sd) && sd !== 0 && !isNaN(en) && !isNaN(ed) && ed !== 0) {
      if (Math.abs(sn / sd - en / ed) < 0.0001) return true;
    }
  }

  return false;
}
