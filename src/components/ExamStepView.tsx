import React, { useState } from "react";
import { FullExamState, ExamData, AnswerData } from "../types";
import {
  FileText,
  Shuffle,
  Download,
  Table,
  CheckCircle2,
  Sparkles,
  Printer,
  ChevronDown,
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";
import { generateExamVariants, ExamShufflerResult } from "../lib/examShuffler";
import {
  generateAnswerSheetDocxBlob,
  exportShuffledVariantsZip,
  downloadBlob,
} from "../services/wordExportService";

interface ExamStepViewProps {
  config: FullExamState;
  exam: ExamData | null;
  answers?: AnswerData | null;
}

export const ExamStepView: React.FC<ExamStepViewProps> = ({
  config,
  exam,
  answers,
}) => {
  const [shuffledResult, setShuffledResult] = useState<ExamShufflerResult | null>(null);
  const [activeCode, setActiveCode] = useState<string>("101");
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  if (!exam) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-[#F6EEE6]">
        Đang chuẩn bị dữ liệu Đề thi...
      </div>
    );
  }

  // Handle Shuffling
  const handleShuffle = () => {
    if (!exam || !answers) return;
    const result = generateExamVariants(exam, answers, ["101", "102", "103", "104"]);
    setShuffledResult(result);
    setActiveCode("101");
  };

  // Get active exam variant
  const currentVariant = shuffledResult?.variants.find((v) => v.code === activeCode);
  const displayExam = currentVariant ? currentVariant.exam : exam;

  // Check if exam has multiple choice questions
  const hasMultipleChoiceQuestions = displayExam.parts.some((p) =>
    p.questions.some((q) => q.type === "multipleChoice" || q.type === "trueFalse")
  );

  // Export Answer Sheet
  const handleExportAnswerSheet = async () => {
    try {
      const blob = await generateAnswerSheetDocxBlob(config, displayExam);
      downloadBlob(blob, `Phieu_To_Trac_Nghiem_${config.general.subject}_${config.general.grade}.docx`);
    } catch (e) {
      console.error("Lỗi xuất phiếu trắc nghiệm:", e);
    }
  };

  // Export 4 variants ZIP
  const handleExportVariantsZip = async () => {
    if (!shuffledResult) return;
    setIsExportingZip(true);
    try {
      await exportShuffledVariantsZip(config, shuffledResult);
    } catch (e) {
      console.error("Lỗi xuất 4 mã đề:", e);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar for Shuffling & Answer Sheet */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-stone-50 p-4 rounded-2xl border border-orange-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <Shuffle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-black text-[#431805]">
              Quản lý Mã Đề & Khảo Thí Lớp Học
            </h4>
            <p className="text-[11px] text-stone-500">
              Hoán vị câu hỏi & phương án để chống học sinh quay cóp, sinh phiếu soi đáp án
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {!shuffledResult ? (
            <button
              type="button"
              onClick={handleShuffle}
              disabled={!answers}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-[#F5730B] hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Tự động sinh 4 mã đề hoán vị 101, 102, 103, 104"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo 4 Mã Đề Hoán Vị</span>
            </button>
          ) : (
            <>
              {/* Code Selector Tabs */}
              <div className="flex items-center bg-white border border-orange-200 rounded-xl p-1 shadow-2xs">
                {shuffledResult.codes.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setActiveCode(code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeCode === code
                        ? "bg-[#F5730B] text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    Mã {code}
                  </button>
                ))}
              </div>

              {/* View Comparison Matrix */}
              <button
                type="button"
                onClick={() => setShowMatrixModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#8F310C] hover:bg-orange-50 border border-orange-200 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <Table className="w-3.5 h-3.5 text-[#F5730B]" />
                <span>Bảng Soi Đáp Án</span>
              </button>

              {/* Download 4 variants zip */}
              <button
                type="button"
                onClick={handleExportVariantsZip}
                disabled={isExportingZip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#002060] hover:bg-blue-900 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingZip ? "Đang nén ZIP..." : "Tải 4 Mã Đề (.zip)"}</span>
              </button>
            </>
          )}

          {/* Export Answer Sheet (chỉ hiển thị nếu đề có câu trắc nghiệm) */}
          {hasMultipleChoiceQuestions ? (
            <button
              type="button"
              onClick={handleExportAnswerSheet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Xuất file Word phiếu tô trắc nghiệm chuẩn Bộ GD&ĐT"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Phiếu Tô Trắc Nghiệm (.docx)</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-[#8F310C] border border-orange-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F5730B]" />
              <span>Đề thi 100% Tự luận</span>
            </span>
          )}
        </div>
      </div>

      {/* Official Exam Paper View */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] p-5 md:p-8 font-serif leading-relaxed transition-all">
        {/* Official Exam Paper Header */}
        <div className="border-b-2 border-stone-800 pb-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3">
            {/* Left Column */}
            <div className="text-center md:text-left font-sans">
              <p className="font-bold text-xs uppercase tracking-wider text-stone-800">
                {config.general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO"}
              </p>
              <p className="font-extrabold text-sm uppercase tracking-wide text-[#431805]">
                {config.general.schoolName || "TRƯỜNG THPT CHU VĂN AN"}
              </p>
              <p className="text-xs font-medium text-stone-600 mt-1">
                (Đề thi gồm có {displayExam.parts.reduce((s, p) => s + p.questions.length, 0)} câu hỏi)
              </p>
            </div>

            {/* Right Column */}
            <div className="text-center md:text-right font-sans">
              <p className="font-black text-sm uppercase tracking-wide text-[#8F310C]">
                {displayExam.header.examTitle || "ĐỀ KIỂM TRA ĐỊNH KỲ CHÍNH THỨC"}
              </p>
              <p className="text-xs font-bold text-stone-800 mt-0.5">
                NĂM HỌC: {displayExam.header.schoolYear || "2025 - 2026"}
              </p>
              <p className="text-xs text-stone-700">
                Môn: <strong className="text-[#431805]">{config.general.subject} – {config.general.grade}</strong>
              </p>
              <p className="text-xs text-stone-600 italic">
                Thời gian làm bài: <strong>{config.general.duration} phút</strong> (không kể thời gian giao đề)
              </p>
            </div>
          </div>

          {/* Student Name and SBD box */}
          <div className="mt-4 pt-3 border-t border-dashed border-stone-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-stone-700 font-sans">
            <div className="w-full sm:w-1/2">
              Họ và tên thí sinh: ............................................................................
            </div>
            <div className="w-full sm:w-1/2 sm:text-right">
              Số báo danh: ................................. Mã đề:{" "}
              <span className="font-black text-sm text-[#8F310C] border-2 border-[#8F310C] px-2 py-0.5 rounded-lg bg-orange-50">
                {activeCode}
              </span>
            </div>
          </div>
        </div>

        {/* Exam Content Parts */}
        <div className="space-y-8">
          {displayExam.parts.map((part, pIdx) => (
            <div key={pIdx} className="space-y-4">
              {/* Part Title */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border-l-4 border-l-[#F5730B] border border-[#EFE7DF]">
                <h3 className="font-bold text-sm md:text-base text-[#431805] uppercase tracking-wide font-sans">
                  {part.partTitle}
                </h3>
                {part.description && (
                  <p className="text-xs text-stone-600 italic mt-1 font-sans">
                    {part.description}
                  </p>
                )}
              </div>

              {/* Reading Passage if any */}
              {part.passage && (
                <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200 text-xs md:text-sm italic text-stone-800 leading-relaxed font-sans">
                  <div className="font-bold not-italic text-[#8F310C] mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Đọc đoạn trích ngữ liệu sau và trả lời các câu hỏi:
                  </div>
                  <MathRenderer text={part.passage} />
                </div>
              )}

              {/* Questions list */}
              <div className="space-y-5">
                {part.questions.map((q) => (
                  <div key={q.id || q.questionNumber} className="text-xs md:text-sm pl-2">
                    <div className="flex items-start gap-1.5 text-stone-900 font-sans leading-relaxed">
                      <strong className="text-[#8F310C] shrink-0 font-bold">
                        Câu {q.questionNumber}:
                      </strong>
                      <span>
                        <MathRenderer text={q.content} />{" "}
                        <span className="text-stone-500 font-normal italic text-xs">
                          ({q.points} điểm)
                        </span>
                      </span>
                    </div>

                    {/* Multiple Choice Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2.5 font-sans pl-4">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-stone-50 border border-transparent hover:border-[#EFE7DF] transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {opt.key}
                            </span>
                            <span className="text-stone-800 text-xs md:text-sm font-medium">
                              <MathRenderer text={opt.text} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True / False Sub-questions */}
                    {q.subQuestions && q.subQuestions.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 font-sans pl-4">
                        {q.subQuestions.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EFE7DF] text-xs md:text-sm"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#8F310C] shrink-0">
                                {sub.label}
                              </span>
                              <span className="text-stone-800 font-medium">
                                <MathRenderer text={sub.text} />
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-xs font-semibold text-stone-400">
                              <span className="px-2 py-0.5 rounded bg-white border border-stone-200">[ Đúng ]</span>
                              <span className="px-2 py-0.5 rounded bg-white border border-stone-200">[ Sai ]</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* End of Exam */}
        <div className="mt-12 pt-6 border-t border-stone-300 text-center font-sans">
          <p className="font-bold text-xs tracking-widest text-stone-600 uppercase">
            ---------- HẾT ----------
          </p>
          <p className="text-xs text-stone-400 italic mt-1">
            (Cán bộ coi thi không giải thích gì thêm)
          </p>
        </div>
      </div>

      {/* Comparison Matrix Modal */}
      {showMatrixModal && shuffledResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-[#EFE7DF] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h3 className="font-black text-lg text-[#431805]">
                  Bảng Ma Trận Soi Đáp Án 4 Mã Đề
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Đối chiếu đáp án nhanh phục vụ chấm thi tập trung trên lớp
                </p>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-orange-100/70 text-[#8F310C] font-bold">
                    <th className="p-2.5 border border-orange-200 text-center w-14">Câu</th>
                    <th className="p-2.5 border border-orange-200">Trích đoạn câu hỏi</th>
                    {shuffledResult.codes.map((c) => (
                      <th key={c} className="p-2.5 border border-orange-200 text-center w-20">
                        Mã {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {shuffledResult.comparisonMatrix.map((r) => (
                    <tr key={r.stt} className="hover:bg-stone-50">
                      <td className="p-2 border border-stone-200 text-center font-bold text-stone-700">
                        {r.stt}
                      </td>
                      <td className="p-2 border border-stone-200 text-stone-700">
                        {r.questionExcerpt}
                      </td>
                      {shuffledResult.codes.map((c) => (
                        <td
                          key={c}
                          className="p-2 border border-stone-200 text-center font-black text-[#8F310C] bg-orange-50/30"
                        >
                          {r.keysByCode[c] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F5730B] text-white hover:brightness-105"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
