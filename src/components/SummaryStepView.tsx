import React, { useState } from "react";
import {
  FullExamState,
  MatrixData,
  SpecificationData,
  ExamData,
  AnswerData,
  DetailGuideData,
  WorkflowStep,
} from "../types";
import {
  CheckCircle2,
  FileDown,
  Archive,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  Eye,
  RotateCcw,
} from "lucide-react";
import { MatrixStepView } from "./MatrixStepView";
import { SpecStepView } from "./SpecStepView";
import { ExamStepView } from "./ExamStepView";
import { AnswerStepView } from "./AnswerStepView";
import { DetailStepView } from "./DetailStepView";

interface SummaryStepViewProps {
  config: FullExamState;
  matrix: MatrixData | null;
  spec: SpecificationData | null;
  exam: ExamData | null;
  answers: AnswerData | null;
  detail: DetailGuideData | null;
  onExportAllZip: () => void;
  onExportSingleDocx: (step: WorkflowStep) => void;
  onNewExam: () => void;
  onJumpToStep: (step: WorkflowStep) => void;
}

export const SummaryStepView: React.FC<SummaryStepViewProps> = ({
  config,
  matrix,
  spec,
  exam,
  answers,
  detail,
  onExportAllZip,
  onExportSingleDocx,
  onNewExam,
  onJumpToStep,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<WorkflowStep>(3); // default preview Exam

  return (
    <div className="space-y-6">
      {/* 1. Congratulation & Summary Header Card */}
      <div className="bg-gradient-to-br from-[#431805] via-[#6e2609] to-[#8F310C] text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden border border-[#EFE7DF]">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F5730B]" /> BỘ TÀI LIỆU KHẢO THÍ HOÀN THIỆN
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mb-2">
            ĐÃ HOÀN TẤT TẠO TRỌN BỘ 5 HỒ SƠ ĐỀ THI
          </h2>
          <p className="text-xs md:text-sm text-orange-100/90 max-w-2xl leading-relaxed">
            Bộ đề kiểm tra môn <strong>{config.general.subject} – {config.general.grade}</strong> ({config.general.duration} phút) đã được AI chuẩn hóa đồng bộ 100% theo quy định Thông tư Bộ GD&ĐT Việt Nam.
          </p>

          {/* Big ZIP Download button */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExportAllZip}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#431805] hover:bg-orange-50 font-black text-xs md:text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
            >
              <Archive className="w-4 h-4 text-[#F5730B]" />
              <span>TẢI TRỌN BỘ 5 TỆP (.ZIP)</span>
            </button>

            <button
              type="button"
              onClick={onNewExam}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm border border-white/20 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tạo đề mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid 5 Generated Artifacts with Single Download Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Step 1 Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] hover:border-orange-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-stone-500">1. PHỤ LỤC 1</span>
              <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Hoàn tất
              </span>
            </div>
            <h3 className="font-bold text-[#431805] text-sm md:text-base">
              Khung Ma Trận Đề
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Phân bổ {config.cognition.nb}% NB, {config.cognition.th}% TH, {config.cognition.vd}% VD, {config.cognition.vdc}% VDC.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFE7DF] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onJumpToStep(1)}
              className="text-xs font-bold text-[#F5730B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
            <button
              type="button"
              onClick={() => onExportSingleDocx(1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-50 text-xs font-bold transition-all border border-[#EFE7DF] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-[#F5730B]" />
              <span>Tải .docx</span>
            </button>
          </div>
        </div>

        {/* Step 2 Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] hover:border-orange-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-stone-500">2. PHỤ LỤC 2</span>
              <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Hoàn tất
              </span>
            </div>
            <h3 className="font-bold text-[#431805] text-sm md:text-base">
              Bản Đặc Tả Đề Thi
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Yêu cầu cần đạt chi tiết từng câu hỏi bám sát chuẩn GDPT 2018.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFE7DF] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onJumpToStep(2)}
              className="text-xs font-bold text-[#F5730B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
            <button
              type="button"
              onClick={() => onExportSingleDocx(2)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-50 text-xs font-bold transition-all border border-[#EFE7DF] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-[#F5730B]" />
              <span>Tải .docx</span>
            </button>
          </div>
        </div>

        {/* Step 3 Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] hover:border-orange-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-stone-500">3. ĐỀ HỌC SINH</span>
              <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Hoàn tất
              </span>
            </div>
            <h3 className="font-bold text-[#431805] text-sm md:text-base">
              Đề Thi Chính Thức
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Đề thi hoàn chỉnh dành cho học sinh làm bài, không chứa đáp án.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFE7DF] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onJumpToStep(3)}
              className="text-xs font-bold text-[#F5730B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
            <button
              type="button"
              onClick={() => onExportSingleDocx(3)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-50 text-xs font-bold transition-all border border-[#EFE7DF] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-[#F5730B]" />
              <span>Tải .docx</span>
            </button>
          </div>
        </div>

        {/* Step 4 Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] hover:border-orange-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-stone-500">4. ĐÁP ÁN</span>
              <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Hoàn tất
              </span>
            </div>
            <h3 className="font-bold text-[#431805] text-sm md:text-base">
              Đáp Án & Biểu Điểm
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Barem chuẩn 10,0 điểm khớp từng câu hỏi với đề thi.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFE7DF] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onJumpToStep(4)}
              className="text-xs font-bold text-[#F5730B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
            <button
              type="button"
              onClick={() => onExportSingleDocx(4)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-50 text-xs font-bold transition-all border border-[#EFE7DF] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-[#F5730B]" />
              <span>Tải .docx</span>
            </button>
          </div>
        </div>

        {/* Step 5 Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] hover:border-orange-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-stone-500">5. GIẢI CHI TIẾT</span>
              <span className="text-emerald-700 bg-emerald-50 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Hoàn tất
              </span>
            </div>
            <h3 className="font-bold text-[#431805] text-sm md:text-base">
              Hướng Dẫn Sư Phạm
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Lời giải chi tiết từng bước, lưu ý lỗi sai học sinh và Rubric chấm.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFE7DF] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onJumpToStep(5)}
              className="text-xs font-bold text-[#F5730B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
            <button
              type="button"
              onClick={() => onExportSingleDocx(5)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-50 text-xs font-bold transition-all border border-[#EFE7DF] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-[#F5730B]" />
              <span>Tải .docx</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Tabbed Preview Panel */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EFE7DF]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F5730B]" />
            <h3 className="font-bold text-[#431805] text-sm md:text-base">
              Xem nhanh nội dung tài liệu
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EFE7DF]">
            <button
              type="button"
              onClick={() => setActivePreviewTab(1)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePreviewTab === 1
                  ? "bg-white text-[#F5730B] shadow-xs border border-[#EFE7DF]"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Ma trận
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab(2)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePreviewTab === 2
                  ? "bg-white text-[#F5730B] shadow-xs border border-[#EFE7DF]"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Đặc tả
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab(3)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePreviewTab === 3
                  ? "bg-white text-[#F5730B] shadow-xs border border-[#EFE7DF]"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Đề thi
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab(4)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePreviewTab === 4
                  ? "bg-white text-[#F5730B] shadow-xs border border-[#EFE7DF]"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Đáp án
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab(5)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePreviewTab === 5
                  ? "bg-white text-[#F5730B] shadow-xs border border-[#EFE7DF]"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Giải chi tiết
            </button>
          </div>
        </div>

        {/* Selected Tab Content */}
        <div>
          {activePreviewTab === 1 && <MatrixStepView config={config} matrix={matrix} />}
          {activePreviewTab === 2 && <SpecStepView config={config} spec={spec} />}
          {activePreviewTab === 3 && <ExamStepView config={config} exam={exam} />}
          {activePreviewTab === 4 && <AnswerStepView config={config} answers={answers} />}
          {activePreviewTab === 5 && <DetailStepView config={config} detail={detail} />}
        </div>
      </div>
    </div>
  );
};
