import React from "react";
import {
  QuestionStructureState,
  StandardQuestionStructure,
  LanguageQuestionStructure,
  LiteratureQuestionStructure,
} from "../types";
import { ListFilter, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";

// ─── Score Progress Bar Component ────────────────────────────────────────────
interface ScoreProgressBarProps {
  totalCount: number;
  totalPercent: number;
  totalPoints: number;
  isValid: boolean;
}

const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({
  totalCount,
  totalPercent,
  totalPoints,
  isValid,
}) => {
  const pct = Math.min(totalPercent, 100);
  const ptPct = Math.min((totalPoints / 10) * 100, 100);

  return (
    <div className={`mt-4 p-4 rounded-xl border-2 transition-all duration-300 ${
      isValid
        ? "bg-emerald-50/60 border-emerald-200"
        : "bg-red-50/60 border-red-200 animate-pulse-once"
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-extrabold text-stone-600 uppercase tracking-wide">
          Kiểm tra cấu trúc điểm
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          isValid
            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
            : "bg-red-100 text-red-600 border border-red-300"
        }`}>
          {isValid
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ ✓</>  
            : <><AlertCircle className="w-3.5 h-3.5" /> Chưa đạt chuẩn</>}
        </span>
      </div>

      {/* Tổng số câu */}
      <div className="text-center mb-3">
        <span className={`text-2xl font-black ${
          isValid ? "text-emerald-700" : "text-red-600"
        }`}>{totalCount}</span>
        <span className="text-xs font-bold text-stone-500 ml-1">câu</span>
      </div>

      {/* Thanh điểm */}
      <div className="space-y-2.5">
        {/* Tỷ lệ % */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-stone-500">Tỷ lệ (%)</span>
            <span className={`text-[11px] font-black ${
              totalPercent === 100 ? "text-emerald-600" : "text-red-500"
            }`}>{totalPercent}% / 100%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalPercent === 100
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : totalPercent > 100
                  ? "bg-gradient-to-r from-red-400 to-red-600"
                  : "bg-gradient-to-r from-amber-400 to-orange-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Tổng điểm */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-stone-500">Tổng điểm</span>
            <span className={`text-[11px] font-black ${
              totalPoints === 10 ? "text-emerald-600" : "text-red-500"
            }`}>{totalPoints}đ / 10đ</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalPoints === 10
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : totalPoints > 10
                  ? "bg-gradient-to-r from-red-400 to-red-600"
                  : "bg-gradient-to-r from-amber-400 to-orange-500"
              }`}
              style={{ width: `${ptPct}%` }}
            />
          </div>
        </div>
      </div>

      {!isValid && (
        <p className="mt-2.5 text-[10px] text-red-600 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          Tổng tỷ lệ phải đạt đúng 100% và tổng điểm phải đạt đúng 10.0đ.
        </p>
      )}
    </div>
  );
};

interface StructureCardProps {
  subject: string;
  structure: QuestionStructureState;
  onChange: (updated: Partial<QuestionStructureState>) => void;
}

export const StructureCard: React.FC<StructureCardProps> = ({
  subject,
  structure,
  onChange,
}) => {
  const isLanguage =
    structure.type === "language" ||
    subject.toLowerCase().includes("tiếng anh") ||
    subject.toLowerCase().includes("ngoại ngữ");

  const isLiterature =
    structure.type === "literature" ||
    subject.toLowerCase().includes("ngữ văn") ||
    subject.toLowerCase().includes("tiếng việt");

  // A. Standard Structure Calculations
  const std = structure.standard;
  const stdTotalPercent =
    Number(std.multipleChoice.percent || 0) +
    Number(std.trueFalse.percent || 0) +
    Number(std.shortAnswer.percent || 0) +
    Number(std.essay.percent || 0);

  const stdTotalPoints = Number(
    (
      Number(std.multipleChoice.points || 0) +
      Number(std.trueFalse.points || 0) +
      Number(std.shortAnswer.points || 0) +
      Number(std.essay.points || 0)
    ).toFixed(1)
  );

  const isStdValid = stdTotalPercent === 100 && stdTotalPoints === 10.0;

  const handleStdRowChange = (
    key: keyof StandardQuestionStructure,
    field: "count" | "percent" | "points",
    val: number
  ) => {
    const updated = { ...std };
    updated[key] = {
      ...updated[key],
      [field]: val,
    };
    // Auto-calculate points if percent changed
    if (field === "percent") {
      updated[key].points = Number(((val / 100) * 10).toFixed(1));
    }
    onChange({ standard: updated });
  };

  // B. Language Structure Calculations
  const lang = structure.language;
  const langTotalPercent =
    Number(lang.listening.percent || 0) +
    Number(lang.languageFocus.percent || 0) +
    Number(lang.reading.percent || 0) +
    Number(lang.writing.percent || 0);

  const langTotalPoints = Number(
    (
      Number(lang.listening.points || 0) +
      Number(lang.languageFocus.points || 0) +
      Number(lang.reading.points || 0) +
      Number(lang.writing.points || 0)
    ).toFixed(1)
  );

  const isLangValid = langTotalPercent === 100 && langTotalPoints === 10.0;

  const handleLangRowChange = (
    key: keyof LanguageQuestionStructure,
    field: "count" | "percent" | "points",
    val: number
  ) => {
    const updated = { ...lang };
    updated[key] = {
      ...updated[key],
      [field]: val,
    };
    if (field === "percent") {
      updated[key].points = Number(((val / 100) * 10).toFixed(1));
    }
    onChange({ language: updated });
  };

  const handleResetLang = () => {
    onChange({
      language: {
        listening: { count: 8, percent: 20, points: 2.0 },
        languageFocus: { count: 10, percent: 25, points: 2.5 },
        reading: { count: 10, percent: 30, points: 3.0 },
        writing: { count: 5, percent: 25, points: 2.5 },
      },
    });
  };

  // C. Literature Presets
  const lit = structure.literature;
  const setLiteraturePreset = (preset: "6/4" | "5/5") => {
    if (preset === "6/4") {
      onChange({
        literature: {
          preset: "6/4",
          readingComprehension: { count: 5, percent: 60, points: 6.0 },
          writingComposition: { count: 2, percent: 40, points: 4.0 },
        },
      });
    } else {
      onChange({
        literature: {
          preset: "5/5",
          readingComprehension: { count: 4, percent: 50, points: 5.0 },
          writingComposition: { count: 2, percent: 50, points: 5.0 },
        },
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(7,26,51,0.03)] border border-[#e2e8f0] border-l-4 border-l-[#f2a900] p-5 md:p-6 mb-5 transition-all">
      {/* Title depending on subject */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#f2a900] flex items-center justify-center font-bold text-sm shrink-0">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-[#071a33] tracking-tight">
              {isLanguage
                ? "4. Cấu trúc câu hỏi & Điểm (Đặc thù môn Ngoại ngữ)"
                : isLiterature
                ? "4. Cấu trúc câu hỏi & Điểm (Đặc thù môn Ngữ văn/Tiếng Việt)"
                : "4. Cấu trúc câu hỏi & Điểm"}
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              {isLanguage
                ? "Cấu trúc 4 phần chuẩn: Listening, Language Focus, Reading, Writing"
                : isLiterature
                ? "Định dạng kiểm tra Đọc hiểu và Làm văn theo chuẩn GDPT 2018"
                : "Cấu trúc đề thi chuẩn Bộ GD&ĐT gồm các dạng câu hỏi trắc nghiệm & tự luận"}
            </p>
          </div>
        </div>

        {isLanguage && (
          <button
            type="button"
            onClick={handleResetLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f8fafc] text-[#164e7a] border border-[#e2e8f0] hover:bg-orange-50 hover:border-orange-200 transition-all self-start sm:self-center active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset cấu trúc chuẩn</span>
          </button>
        )}
      </div>

      {/* CASE A: MÔN THÔNG THƯỜNG (TOÁN, LÍ, HÓA, SINH, KHTN, SỬ, ĐỊA, TIN,...) */}
      {!isLanguage && !isLiterature && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-xs font-bold text-stone-600 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Dạng câu hỏi</th>
                  <th className="pb-3 text-center">Số câu</th>
                  <th className="pb-3 text-center">Tỷ lệ (%)</th>
                  <th className="pb-3 text-center">Số điểm (đ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {/* Trắc nghiệm nhiều lựa chọn */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Trắc nghiệm (Nhiều lựa chọn A, B, C, D)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={std.multipleChoice.count}
                      aria-label="Số câu trắc nghiệm nhiều lựa chọn"
                      onChange={(e) =>
                        handleStdRowChange("multipleChoice", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={std.multipleChoice.percent}
                        aria-label="Tỷ lệ trắc nghiệm nhiều lựa chọn"
                        onChange={(e) =>
                          handleStdRowChange("multipleChoice", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">
                      {std.multipleChoice.points}đ
                    </span>
                  </td>
                </tr>

                {/* Đúng / Sai */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Trắc nghiệm Đúng / Sai (Mỗi câu 4 ý a, b, c, d)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={std.trueFalse.count}
                      aria-label="Số câu đúng sai"
                      onChange={(e) =>
                        handleStdRowChange("trueFalse", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={std.trueFalse.percent}
                        aria-label="Tỷ lệ câu đúng sai"
                        onChange={(e) =>
                          handleStdRowChange("trueFalse", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">
                      {std.trueFalse.points}đ
                    </span>
                  </td>
                </tr>

                {/* Trả lời ngắn */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Trả lời ngắn (Điền đáp số / kết quả)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={std.shortAnswer.count}
                      aria-label="Số câu trả lời ngắn"
                      onChange={(e) =>
                        handleStdRowChange("shortAnswer", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={std.shortAnswer.percent}
                        aria-label="Tỷ lệ câu trả lời ngắn"
                        onChange={(e) =>
                          handleStdRowChange("shortAnswer", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">
                      {std.shortAnswer.points}đ
                    </span>
                  </td>
                </tr>

                {/* Tự luận */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Tự luận (Trình bày chi tiết / Bài toán lớn)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={std.essay.count}
                      aria-label="Số câu tự luận"
                      onChange={(e) =>
                        handleStdRowChange("essay", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={std.essay.percent}
                        aria-label="Tỷ lệ câu tự luận"
                        onChange={(e) =>
                          handleStdRowChange("essay", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">{std.essay.points}đ</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Score Progress Bar – Standard */}
          <ScoreProgressBar
            totalCount={std.multipleChoice.count + std.trueFalse.count + std.shortAnswer.count + std.essay.count}
            totalPercent={stdTotalPercent}
            totalPoints={stdTotalPoints}
            isValid={isStdValid}
          />
        </div>
      )}

      {/* CASE B: NGOẠI NGỮ / TIẾNG ANH (4 PHẦN CHUẨN) */}
      {isLanguage && (
        <div>
          <div className="mb-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-[#164e7a] flex items-center justify-between">
            <span>CẤU TRÚC 4 PHẦN KIỂM TRA NGOẠI NGỮ</span>
            <span className="text-[11px] font-medium text-amber-700">Định dạng khảo thí quốc gia</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-xs font-bold text-stone-600 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Phần kiểm tra</th>
                  <th className="pb-3 text-center">Số câu</th>
                  <th className="pb-3 text-center">Tỷ lệ (%)</th>
                  <th className="pb-3 text-center">Số điểm (đ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {/* Listening */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Phần I: Nghe (Listening)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={lang.listening.count}
                      aria-label="Số câu nghe"
                      onChange={(e) =>
                        handleLangRowChange("listening", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={lang.listening.percent}
                        aria-label="Tỷ lệ phần nghe"
                        onChange={(e) =>
                          handleLangRowChange("listening", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">{lang.listening.points}đ</span>
                  </td>
                </tr>

                {/* Language Focus */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Phần II: Ngôn ngữ (Language Focus)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={lang.languageFocus.count}
                      aria-label="Số câu kiến thức ngôn ngữ"
                      onChange={(e) =>
                        handleLangRowChange("languageFocus", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={lang.languageFocus.percent}
                        aria-label="Tỷ lệ kiến thức ngôn ngữ"
                        onChange={(e) =>
                          handleLangRowChange("languageFocus", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">{lang.languageFocus.points}đ</span>
                  </td>
                </tr>

                {/* Reading */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Phần III: Đọc (Reading)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={lang.reading.count}
                      aria-label="Số câu đọc hiểu"
                      onChange={(e) =>
                        handleLangRowChange("reading", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={lang.reading.percent}
                        aria-label="Tỷ lệ đọc hiểu"
                        onChange={(e) =>
                          handleLangRowChange("reading", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">{lang.reading.points}đ</span>
                  </td>
                </tr>

                {/* Writing */}
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 pl-2 font-bold text-[#071a33]">
                    Phần IV: Viết (Writing)
                  </td>
                  <td className="py-3 text-center w-28">
                    <input
                      type="number"
                      min={0}
                      value={lang.writing.count}
                      aria-label="Số câu viết"
                      onChange={(e) =>
                        handleLangRowChange("writing", "count", Number(e.target.value) || 0)
                      }
                      className="w-20 px-2.5 py-1 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                    />
                  </td>
                  <td className="py-3 text-center w-28">
                    <div className="relative inline-block w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={lang.writing.percent}
                        aria-label="Tỷ lệ phần viết"
                        onChange={(e) =>
                          handleLangRowChange("writing", "percent", Number(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 pr-6 text-center font-bold text-[#071a33] rounded-lg border border-stone-200 focus:border-[#f2a900] outline-none"
                      />
                      <span className="absolute right-2 top-1 text-xs text-stone-400 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center w-28">
                    <span className="font-extrabold text-[#164e7a]">{lang.writing.points}đ</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Score Progress Bar – Language */}
          <ScoreProgressBar
            totalCount={lang.listening.count + lang.languageFocus.count + lang.reading.count + lang.writing.count}
            totalPercent={langTotalPercent}
            totalPoints={langTotalPoints}
            isValid={isLangValid}
          />
        </div>
      )}

      {/* CASE C: NGỮ VĂN / TIẾNG VIỆT */}
      {isLiterature && (
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="text-xs font-bold text-stone-600">Chọn Preset định dạng:</span>
            <button
              type="button"
              onClick={() => setLiteraturePreset("6/4")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                lit.preset === "6/4"
                  ? "bg-[#f2a900] text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Tỉ lệ 6/4 (Chuẩn)
            </button>
            <button
              type="button"
              onClick={() => setLiteraturePreset("5/5")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                lit.preset === "5/5"
                  ? "bg-[#f2a900] text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Tỉ lệ 5/5
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200/80">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-[#071a33] text-xs md:text-sm">Phần I: Đọc hiểu</h4>
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#f2a900] text-white">
                  {lit.readingComprehension.points} điểm ({lit.readingComprehension.percent}%)
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Gồm {lit.readingComprehension.count} câu hỏi phân hóa từ Nhận biết, Thông hiểu đến Vận dụng dựa trên văn bản ngữ liệu.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200/80">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-[#071a33] text-xs md:text-sm">Phần II: Viết / Làm văn</h4>
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#164e7a] text-white">
                  {lit.writingComposition.points} điểm ({lit.writingComposition.percent}%)
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Gồm 1 đoạn văn nghị luận xã hội (2.0đ) và 1 bài văn nghị luận văn học/xã hội ({lit.writingComposition.points - 2}đ).
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">
              Tổng điểm kiểm tra Ngữ văn:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✅ 100%
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✅ 10 Điểm
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
