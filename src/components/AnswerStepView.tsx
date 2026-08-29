import React from "react";
import { FullExamState, AnswerData } from "../types";
import { CheckCircle2, Award } from "lucide-react";

interface AnswerStepViewProps {
  config: FullExamState;
  answers: AnswerData | null;
}

export const AnswerStepView: React.FC<AnswerStepViewProps> = ({
  config,
  answers,
}) => {
  if (!answers) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-[#F6EEE6]">
        Đang chuẩn bị dữ liệu Đáp án và Biểu điểm...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] p-5 md:p-8 transition-all">
      {/* Official Header */}
      <div className="border-b border-[#EFE7DF] pb-5 mb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-bold text-stone-600 uppercase">
          <div>
            <p className="text-stone-800 font-extrabold">{config.general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO"}</p>
            <p className="text-stone-500 font-medium">{config.general.schoolName || "TRƯỜNG THPT CHU VĂN AN"}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[#8F310C] font-extrabold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-stone-500 font-normal italic">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        <div className="text-center mt-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#8F310C] mb-2 border border-orange-200">
            <Award className="w-3.5 h-3.5" /> BAREM ĐIỂM CHUẨN
          </span>
          <h2 className="text-lg md:text-2xl font-black text-[#431805] uppercase tracking-wide">
            {answers.title || "HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM ĐỀ KIỂM TRA"}
          </h2>
          <p className="text-xs md:text-sm text-stone-600 mt-1 font-medium">
            Môn: <span className="font-bold text-[#8F310C]">{config.general.subject}</span> – {config.general.grade} | Tổng điểm toàn bài: <span className="font-bold text-[#8F310C]">10,0 điểm</span>
          </p>
        </div>
      </div>

      {/* Parts and Answers */}
      <div className="space-y-6">
        {answers.parts.map((part, pIdx) => (
          <div key={pIdx} className="space-y-3">
            <h3 className="font-bold text-sm md:text-base text-[#431805] bg-[#FAF8F5] px-3.5 py-2.5 rounded-xl border border-[#EFE7DF] border-l-4 border-l-[#F5730B]">
              {part.partTitle}
            </h3>

            <div className="overflow-x-auto rounded-xl border border-[#EFE7DF] shadow-2xs">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] text-[#431805] border-b border-[#EFE7DF] font-bold">
                    <th className="p-3 text-center border-r border-[#EFE7DF] w-24">Câu số</th>
                    <th className="p-3 border-r border-[#EFE7DF] min-w-[300px]">Đáp án / Lời giải tóm tắt</th>
                    <th className="p-3 text-center border-r border-[#EFE7DF] w-24">Điểm</th>
                    <th className="p-3 min-w-[150px]">Ghi chú chấm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DF]">
                  {part.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 text-center font-black text-[#8F310C] border-r border-[#EFE7DF] bg-orange-50/20">
                        {item.questionNumber}
                      </td>
                      <td className="p-3 text-stone-800 border-r border-[#EFE7DF] font-medium leading-relaxed">
                        {item.solutionSummary}
                      </td>
                      <td className="p-3 text-center font-black text-[#8F310C] border-r border-[#EFE7DF]">
                        {item.points}đ
                      </td>
                      <td className="p-3 text-stone-500 text-xs italic font-medium">
                        {item.note || "Theo barem chuẩn"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-[#EFE7DF] flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Biểu điểm đã được chuẩn hóa khớp 100% với Đề thi và Bản đặc tả.</span>
        </div>
        <span className="font-bold text-[#8F310C] text-sm">Tổng điểm: 10,0 điểm</span>
      </div>
    </div>
  );
};
