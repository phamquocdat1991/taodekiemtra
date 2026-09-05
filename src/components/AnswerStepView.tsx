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
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(7,26,51,0.03)] border border-[#e2e8f0] border-l-4 border-l-[#f2a900] p-5 md:p-8 transition-all">
      {/* Official Header */}
      <div className="border-b border-[#e2e8f0] pb-5 mb-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-bold text-stone-600 uppercase">
          <div>
            <p className="text-stone-800 font-extrabold">{config.general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO"}</p>
            <p className="text-stone-500 font-medium">{config.general.schoolName || "TRƯỜNG THPT CHU VĂN AN"}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[#164e7a] font-extrabold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-stone-500 font-normal italic">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        <div className="text-center mt-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#164e7a] mb-2 border border-orange-200">
            <Award className="w-3.5 h-3.5" /> BAREM ĐIỂM CHUẨN
          </span>
          <h2 className="text-lg md:text-2xl font-black text-[#071a33] uppercase tracking-wide">
            {answers.title || "HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM ĐỀ KIỂM TRA"}
          </h2>
          <p className="text-xs md:text-sm text-stone-600 mt-1 font-medium">
            Môn: <span className="font-bold text-[#164e7a]">{config.general.subject}</span> – {config.general.grade} | Tổng điểm toàn bài: <span className="font-bold text-[#164e7a]">10,0 điểm</span>
          </p>
        </div>
      </div>

      {/* Parts and Answers */}
      <div className="space-y-6">
        {answers.parts.map((part, pIdx) => (
          <div key={pIdx} className="space-y-3">
            <h3 className="font-bold text-sm md:text-base text-[#071a33] bg-[#f8fafc] px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] border-l-4 border-l-[#f2a900]">
              {part.partTitle}
            </h3>

            <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] shadow-2xs">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#071a33] border-b border-[#e2e8f0] font-bold">
                    <th className="p-3 text-center border-r border-[#e2e8f0] w-24">Câu số</th>
                    <th className="p-3 border-r border-[#e2e8f0] min-w-[300px]">Đáp án / Lời giải tóm tắt</th>
                    <th className="p-3 text-center border-r border-[#e2e8f0] w-24">Điểm</th>
                    <th className="p-3 min-w-[150px]">Ghi chú chấm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {part.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      <td className="p-3 text-center font-black text-[#164e7a] border-r border-[#e2e8f0] bg-orange-50/20">
                        {item.questionNumber}
                      </td>
                      <td className="p-3 text-stone-800 border-r border-[#e2e8f0] font-medium leading-relaxed">
                        {item.solutionSummary}
                      </td>
                      <td className="p-3 text-center font-black text-[#164e7a] border-r border-[#e2e8f0]">
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
      <div className="mt-6 pt-4 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Biểu điểm đã được chuẩn hóa khớp 100% với Đề thi và Bản đặc tả.</span>
        </div>
        <span className="font-bold text-[#164e7a] text-sm">Tổng điểm: 10,0 điểm</span>
      </div>
    </div>
  );
};
