import React from "react";
import { WorkflowStep } from "../types";
import {
  ArrowLeft,
  RotateCw,
  ArrowRight,
  Edit3,
  Copy,
  FileDown,
  Check,
  Loader2,
} from "lucide-react";

interface StepToolbarProps {
  currentStep: WorkflowStep;
  isGenerating: boolean;
  onBack: () => void;
  onRegenerateCurrentStep: () => void;
  onContinue: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onExportWord: () => void;
  hasCopied: boolean;
}

const exportButtonLabels: Record<WorkflowStep, string> = {
  1: "XUẤT MA TRẬN",
  2: "XUẤT ĐẶC TẢ",
  3: "XUẤT ĐỀ THI",
  4: "XUẤT ĐÁP ÁN",
  5: "XUẤT CHI TIẾT",
  6: "XUẤT TẤT CẢ TỆP WORD",
};

export const StepToolbar: React.FC<StepToolbarProps> = ({
  currentStep,
  isGenerating,
  onBack,
  onRegenerateCurrentStep,
  onContinue,
  onEdit,
  onCopy,
  onExportWord,
  hasCopied,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(7,26,51,0.03)] border border-[#e2e8f0] p-3.5 mb-5 flex flex-wrap items-center justify-between gap-2.5">
      {/* Left Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* QUAY LẠI */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#f8fafc] text-stone-700 hover:bg-stone-100 border border-[#e2e8f0] transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>QUAY LẠI</span>
        </button>

        {/* TẠO LẠI BƯỚC NÀY */}
        {currentStep < 6 && (
          <button
            type="button"
            disabled={isGenerating}
            onClick={onRegenerateCurrentStep}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-50/80 text-[#164e7a] hover:bg-orange-100 border border-orange-200 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            title="Chỉ tạo lại nội dung cho bước hiện tại bằng Gemini AI"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f2a900]" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-[#f2a900]" />
            )}
            <span>TẠO LẠI BƯỚC NÀY</span>
          </button>
        )}
      </div>

      {/* Right Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* CHỈNH SỬA */}
        {currentStep < 6 && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#f8fafc] text-stone-700 hover:bg-stone-100 border border-[#e2e8f0] transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-stone-600" />
            <span>CHỈNH SỬA</span>
          </button>
        )}

        {/* COPY */}
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#f8fafc] text-stone-700 hover:bg-stone-100 border border-[#e2e8f0] transition-all active:scale-95 cursor-pointer"
        >
          {hasCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-stone-600" />
          )}
          <span>{hasCopied ? "ĐÃ COPY" : "COPY"}</span>
        </button>

        {/* XUẤT WORD */}
        <button
          type="button"
          onClick={onExportWord}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#164e7a] hover:bg-[#722709] text-white transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>{exportButtonLabels[currentStep] || "XUẤT WORD"}</span>
        </button>

        {/* TIẾP TỤC */}
        {currentStep < 6 && (
          <button
            type="button"
            disabled={isGenerating}
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#f2a900] hover:bg-[#d96408] text-white disabled:opacity-50 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>TIẾP TỤC</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
