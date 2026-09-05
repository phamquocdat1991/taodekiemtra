import React from "react";
import { FullExamState, MatrixData } from "../types";
import { Table, CheckCircle, Award } from "lucide-react";

interface MatrixStepViewProps {
  config: FullExamState;
  matrix: MatrixData | null;
}

export const MatrixStepView: React.FC<MatrixStepViewProps> = ({
  config,
  matrix,
}) => {
  if (!matrix) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-stone-400 border border-[#F6EEE6]">
        Đang chuẩn bị dữ liệu Ma trận...
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
            <Award className="w-3.5 h-3.5" /> PHỤ LỤC 1 (CHUẨN BỘ GD&ĐT)
          </span>
          <h2 className="text-lg md:text-2xl font-black text-[#071a33] uppercase tracking-wide">
            KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ
          </h2>
          <p className="text-xs md:text-sm text-stone-600 mt-1 font-medium">
            Môn: <span className="font-bold text-[#164e7a]">{config.general.subject}</span> – {config.general.grade} | Thời gian: <span className="font-bold">{config.general.duration} phút</span> | Bộ sách: {config.general.textbook}
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] shadow-2xs">
        <table className="w-full text-left text-xs md:text-sm border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-[#071a33] border-b border-[#e2e8f0] font-bold">
              <th className="p-3 text-center border-r border-[#e2e8f0] w-12">STT</th>
              <th className="p-3 border-r border-[#e2e8f0] min-w-[150px]">Chủ đề / Chương</th>
              <th className="p-3 border-r border-[#e2e8f0] min-w-[200px]">Đơn vị kiến thức / Kĩ năng</th>
              <th className="p-3 text-center border-r border-[#e2e8f0] bg-orange-50/70 w-14">NB</th>
              <th className="p-3 text-center border-r border-[#e2e8f0] bg-orange-50/70 w-14">TH</th>
              <th className="p-3 text-center border-r border-[#e2e8f0] bg-orange-50/70 w-14">VD</th>
              <th className="p-3 text-center border-r border-[#e2e8f0] bg-orange-50/70 w-14">VDC</th>
              <th className="p-3 text-center border-r border-[#e2e8f0] w-20">Tổng câu</th>
              <th className="p-3 text-center border-r border-[#e2e8f0] w-20">Điểm số</th>
              <th className="p-3 text-center w-20">Tỉ lệ (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {matrix.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                <td className="p-3 text-center font-bold text-stone-500 border-r border-[#e2e8f0]">
                  {row.stt || idx + 1}
                </td>
                <td className="p-3 font-bold text-[#071a33] border-r border-[#e2e8f0]">
                  {row.topic}
                </td>
                <td className="p-3 text-stone-700 border-r border-[#e2e8f0] font-medium">
                  {row.knowledgeUnit}
                  {row.questionType && (
                    <span className="block text-[11px] text-stone-400 mt-0.5">
                      ({row.questionType})
                    </span>
                  )}
                </td>
                <td className="p-3 text-center font-semibold text-stone-700 border-r border-[#e2e8f0] bg-orange-50/20">
                  {row.nb || "-"}
                </td>
                <td className="p-3 text-center font-semibold text-stone-700 border-r border-[#e2e8f0] bg-orange-50/20">
                  {row.th || "-"}
                </td>
                <td className="p-3 text-center font-semibold text-stone-700 border-r border-[#e2e8f0] bg-orange-50/20">
                  {row.vd || "-"}
                </td>
                <td className="p-3 text-center font-semibold text-stone-700 border-r border-[#e2e8f0] bg-orange-50/20">
                  {row.vdc || "-"}
                </td>
                <td className="p-3 text-center font-bold text-[#071a33] border-r border-[#e2e8f0]">
                  {row.totalQuestions}
                </td>
                <td className="p-3 text-center font-bold text-[#164e7a] border-r border-[#e2e8f0]">
                  {row.totalPoints}đ
                </td>
                <td className="p-3 text-center font-bold text-[#071a33]">
                  {row.percent}%
                </td>
              </tr>
            ))}

            {/* Summary Row */}
            <tr className="bg-[#f8fafc] font-bold text-[#071a33] border-t-2 border-stone-300">
              <td colSpan={3} className="p-3.5 text-center uppercase tracking-wider border-r border-[#e2e8f0]">
                TỔNG CỘNG TOÀN MA TRẬN
              </td>
              <td className="p-3.5 text-center border-r border-[#e2e8f0] bg-orange-100/60 font-black">
                {matrix.summary.totalNb}
              </td>
              <td className="p-3.5 text-center border-r border-[#e2e8f0] bg-orange-100/60 font-black">
                {matrix.summary.totalTh}
              </td>
              <td className="p-3.5 text-center border-r border-[#e2e8f0] bg-orange-100/60 font-black">
                {matrix.summary.totalVd}
              </td>
              <td className="p-3.5 text-center border-r border-[#e2e8f0] bg-orange-100/60 font-black">
                {matrix.summary.totalVdc}
              </td>
              <td className="p-3.5 text-center border-r border-[#e2e8f0] text-xs md:text-sm font-black">
                {matrix.summary.totalQuestions} câu
              </td>
              <td className="p-3.5 text-center border-r border-[#e2e8f0] text-xs md:text-sm text-[#164e7a] font-black">
                {matrix.summary.totalPoints.toFixed(1)}đ
              </td>
              <td className="p-3.5 text-center text-xs md:text-sm text-emerald-700 font-black">
                {matrix.summary.totalPercent}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footnote notes */}
      <div className="mt-5 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-3">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Ma trận tuân thủ phân bổ mức độ: NB ({config.cognition.nb}%) - TH ({config.cognition.th}%) - VD ({config.cognition.vd}%) - VDC ({config.cognition.vdc}%)</span>
        </div>
        <span className="font-bold text-stone-700">Tổng điểm: 10,0 / 10,0 điểm</span>
      </div>
    </div>
  );
};
