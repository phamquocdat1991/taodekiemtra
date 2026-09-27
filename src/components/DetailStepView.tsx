import React from "react";
import { FullExamState, DetailGuideData } from "../types";
import { Award, AlertTriangle, BookCheck, Sparkles, Brain } from "lucide-react";
import { MathRenderer } from "./MathRenderer";

interface DetailStepViewProps {
  config: FullExamState;
  detail: DetailGuideData | null;
}

export const DetailStepView: React.FC<DetailStepViewProps> = ({
  config,
  detail,
}) => {
  if (!detail) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-[#F6EEE6]">
        Đang chuẩn bị dữ liệu Hướng dẫn giải chi tiết...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] p-5 md:p-8 transition-all">
      {/* Official Header */}
      <div className="border-b border-[#EFE7DF] pb-5 mb-6">
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
            <Sparkles className="w-3.5 h-3.5" /> TÀI LIỆU SƯ PHẠM
          </span>
          <h2 className="text-lg md:text-2xl font-black text-[#431805] uppercase tracking-wide">
            {detail.title || "HƯỚNG DẪN GIẢI CHI TIẾT & LƯU Ý SƯ PHẠM"}
          </h2>
          <p className="text-xs md:text-sm text-stone-600 mt-1 font-medium">
            Môn: <span className="font-bold text-[#8F310C]">{config.general.subject}</span> – {config.general.grade}
          </p>
        </div>
      </div>

      {/* Detail Items */}
      <div className="space-y-6">
        {detail.items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[#EFE7DF] bg-[#FAF8F5]/40 p-4 md:p-6 shadow-2xs hover:border-orange-200 transition-colors"
          >
            {/* Question Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#EFE7DF]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#8F310C] text-white font-black text-xs">
                  {item.questionNumber}
                </span>
                <span className="font-bold text-[#431805] text-sm md:text-base">
                  <MathRenderer text={item.questionExcerpt} />
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs self-start sm:self-center">
                <BookCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đáp án: <MathRenderer text={item.answer} /></span>
              </div>
            </div>

            {/* Solution Steps */}
            <div className="space-y-3 text-xs md:text-sm text-stone-800">
              <div>
                <strong className="text-[#8F310C] block mb-1 font-bold">
                  • Lời giải chi tiết:
                </strong>
                <div className="bg-white p-3.5 rounded-xl border border-[#EFE7DF] leading-relaxed font-medium">
                  <MathRenderer text={item.detailedSolution} />
                </div>
              </div>

              {/* Knowledge Used */}
              <div className="flex items-start gap-2 pt-1 font-medium">
                <strong className="text-stone-700 shrink-0 font-bold">• Kiến thức áp dụng:</strong>
                <span className="text-stone-600 italic"><MathRenderer text={item.knowledgeUsed} /></span>
              </div>

              {/* Trap Analysis – Bẫy tư duy & Lỗ hổng nhận thức */}
              {item.trapAnalysis && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3.5 flex items-start gap-2.5 text-violet-900 mt-2">
                  <Brain className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider block text-violet-700 mb-1">
                      ⚠️ Bẫy tư duy & Lỗ hổng nhận thức:
                    </span>
                    <span className="text-xs text-violet-800 leading-relaxed font-medium">
                      <MathRenderer text={item.trapAnalysis} />
                    </span>
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {item.commonMistakes && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider block text-amber-800">
                      Lưu ý sư phạm & Lỗi học sinh thường mắc:
                    </span>
                    <span className="text-xs text-amber-900 leading-relaxed font-medium">
                      {item.commonMistakes}
                    </span>
                  </div>
                </div>
              )}

              {/* Rubric Table if present */}
              {item.rubric && item.rubric.length > 0 && (
                <div className="mt-3 pt-2">
                  <span className="text-xs font-bold text-[#431805] uppercase tracking-wider block mb-1.5">
                    Barem chấm chi tiết (Rubric):
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-[#EFE7DF]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAF8F5] text-[#431805] font-bold">
                        <tr>
                          <th className="p-2 border-r border-[#EFE7DF]">Tiêu chí đánh giá</th>
                          <th className="p-2 text-center w-20">Điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE7DF]">
                        {item.rubric.map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-orange-50/30">
                            <td className="p-2 text-stone-700 border-r border-[#EFE7DF] font-medium">
                              {r.criterion}
                            </td>
                            <td className="p-2 text-center font-black text-[#8F310C]">
                              +{r.points}đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
