import React from "react";
import { FullExamState, ExamData } from "../types";
import { FileText } from "lucide-react";

interface ExamStepViewProps {
  config: FullExamState;
  exam: ExamData | null;
}

export const ExamStepView: React.FC<ExamStepViewProps> = ({
  config,
  exam,
}) => {
  if (!exam) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-[#F6EEE6]">
        Đang chuẩn bị dữ liệu Đề thi...
      </div>
    );
  }

  return (
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
              (Đề thi gồm có {exam.parts.reduce((s, p) => s + p.questions.length, 0)} câu hỏi)
            </p>
          </div>

          {/* Right Column */}
          <div className="text-center md:text-right font-sans">
            <p className="font-black text-sm uppercase tracking-wide text-[#8F310C]">
              {exam.header.examTitle || "ĐỀ KIỂM TRA ĐỊNH KỲ CHÍNH THỨC"}
            </p>
            <p className="text-xs font-bold text-stone-800 mt-0.5">
              NĂM HỌC: {exam.header.schoolYear || "2025 - 2026"}
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
            Số báo danh: ................................. Mã đề: <span className="font-bold border border-stone-400 px-2 py-0.5 rounded">101</span>
          </div>
        </div>
      </div>

      {/* Exam Content Parts */}
      <div className="space-y-8">
        {exam.parts.map((part, pIdx) => (
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
                {part.passage}
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
                      {q.content}{" "}
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
                          <span className="text-stone-800 text-xs md:text-sm font-medium">{opt.text}</span>
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
                            <span className="text-stone-800 font-medium">{sub.text}</span>
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
  );
};
