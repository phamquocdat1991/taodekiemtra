import React from "react";
import { FullExamState, SpecificationData } from "../types";
import { Award, Clock, CheckCircle2 } from "lucide-react";

interface SpecStepViewProps {
  config: FullExamState;
  spec: SpecificationData | null;
}

export const SpecStepView: React.FC<SpecStepViewProps> = ({
  config,
  spec,
}) => {
  if (!spec) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-[#F6EEE6]">
        Đang chuẩn bị dữ liệu Bản đặc tả...
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
            <Award className="w-3.5 h-3.5" /> PHỤ LỤC 2 (CHUẨN BỘ GD&ĐT)
          </span>
          <h2 className="text-lg md:text-2xl font-black text-[#431805] uppercase tracking-wide">
            BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
          </h2>
          <p className="text-xs md:text-sm text-stone-600 mt-1 font-medium">
            Môn: <span className="font-bold text-[#8F310C]">{config.general.subject}</span> – {config.general.grade} | Thời lượng: <span className="font-bold">{config.general.duration} phút</span>
          </p>
        </div>
      </div>

      {/* Specification Table */}
      <div className="overflow-x-auto rounded-xl border border-[#EFE7DF] shadow-2xs">
        <table className="w-full text-left text-xs md:text-sm border-collapse">
          <thead>
            <tr className="bg-[#FAF8F5] text-[#431805] border-b border-[#EFE7DF] font-bold">
              <th className="p-3 text-center border-r border-[#EFE7DF] w-20">Câu số</th>
              <th className="p-3 border-r border-[#EFE7DF] min-w-[180px]">Nội dung / Đơn vị kiến thức</th>
              <th className="p-3 border-r border-[#EFE7DF] min-w-[280px]">Yêu cầu cần đạt (GDPT 2018)</th>
              <th className="p-3 text-center border-r border-[#EFE7DF] w-28">Mức độ</th>
              <th className="p-3 text-center border-r border-[#EFE7DF] w-24">TG (phút)</th>
              <th className="p-3 text-center w-24">Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE7DF]">
            {spec.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                <td className="p-3 text-center font-black text-[#8F310C] border-r border-[#EFE7DF] bg-orange-50/20">
                  {row.questionNumber}
                </td>
                <td className="p-3 border-r border-[#EFE7DF]">
                  <div className="font-bold text-[#431805]">{row.topic}</div>
                  <div className="text-stone-600 text-xs mt-0.5">{row.knowledgeUnit}</div>
                </td>
                <td className="p-3 text-stone-700 leading-relaxed border-r border-[#EFE7DF] font-medium">
                  {row.objective}
                </td>
                <td className="p-3 text-center border-r border-[#EFE7DF]">
                  <span
                    className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${
                      row.level === "Nhận biết"
                        ? "bg-blue-100 text-blue-800"
                        : row.level === "Thông hiểu"
                        ? "bg-emerald-100 text-emerald-800"
                        : row.level === "Vận dụng"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {row.level}
                  </span>
                </td>
                <td className="p-3 text-center font-semibold text-stone-600 border-r border-[#EFE7DF]">
                  {row.estimatedTime}p
                </td>
                <td className="p-3 text-center font-black text-[#8F310C]">
                  {row.points}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Specification Footnotes */}
      <div className="mt-5 pt-4 border-t border-[#EFE7DF] flex flex-wrap items-center justify-between text-xs text-stone-600 gap-3">
        <div className="flex items-center gap-2 font-medium">
          <Clock className="w-4 h-4 text-[#F5730B]" />
          <span>Tổng thời gian ước tính: <strong>{spec.totalTime || config.general.duration} phút</strong></span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Tổng điểm bản đặc tả: <strong className="text-[#8F310C]">10,0 điểm</strong></span>
        </div>
      </div>
    </div>
  );
};
