import React from "react";
import { WorkflowStep } from "../types";
import {
  Check,
  Bot,
  Pause,
  Play,
  FastForward,
  XCircle,
  Loader2,
} from "lucide-react";

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  completedSteps: number[];
  onStepClick: (step: WorkflowStep) => void;
  autoMode: boolean;
  autoCountdown: number | null;
  autoPaused: boolean;
  isGenerating: boolean;
  onPauseAuto: () => void;
  onResumeAuto: () => void;
  onSkipAuto: () => void;
  onCancelAuto: () => void;
}

const steps = [
  { id: 1, name: "1. MA TRẬN" },
  { id: 2, name: "2. ĐẶC TẢ" },
  { id: 3, name: "3. ĐỀ THI" },
  { id: 4, name: "4. ĐÁP ÁN" },
  { id: 5, name: "5. CHI TIẾT" },
  { id: 6, name: "6. TỔNG HỢP" },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  autoMode,
  autoCountdown,
  autoPaused,
  isGenerating,
  onPauseAuto,
  onResumeAuto,
  onSkipAuto,
  onCancelAuto,
}) => {
  return (
    <div className="mb-5 space-y-4">
      {/* 1. AUTO MODE ACTIVE BANNER (Nâu đậm) */}
      {autoMode && (
        <div className="bg-[#381E11] text-white rounded-2xl p-4 md:p-5 shadow-md border border-[#8F310C]/40 animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left Info */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#F5730B] text-white flex items-center justify-center shadow-sm shrink-0">
                <Bot className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm md:text-base text-white tracking-wide">
                    CHẾ ĐỘ TẠO ĐỀ TỰ ĐỘNG
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F5730B] text-white animate-pulse">
                    {autoPaused ? "ĐANG TẠM DỪNG" : "ĐANG TỰ ĐỘNG"}
                  </span>
                </div>
                <p className="text-xs text-orange-200 mt-0.5 font-medium">
                  {isGenerating
                    ? "Đang xử lý tạo nội dung cho bước tiếp theo..."
                    : autoCountdown !== null
                    ? `Tự động chuyển sang bước tiếp theo sau: ${autoCountdown} giây`
                    : "Đang sẵn sàng..."}
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              {autoPaused ? (
                <button
                  type="button"
                  onClick={onResumeAuto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>TIẾP TỤC TỰ ĐỘNG</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPauseAuto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs active:scale-95"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>TẠM DỪNG</span>
                </button>
              )}

              <button
                type="button"
                onClick={onSkipAuto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8F310C] hover:bg-[#a6390e] text-white transition-all shadow-xs active:scale-95"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>CHUYỂN NHANH QUA BƯỚC TIẾP THEO</span>
              </button>

              <button
                type="button"
                onClick={onCancelAuto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-700 hover:bg-red-700 text-white transition-all active:scale-95"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>HỦY TỰ ĐỘNG</span>
              </button>
            </div>
          </div>

          {/* Progress bar countdown (Cam) */}
          {autoCountdown !== null && !isGenerating && (
            <div className="w-full bg-stone-900/80 rounded-full h-1.5 mt-3.5 overflow-hidden">
              <div
                className="bg-[#F5730B] h-1.5 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((8 - autoCountdown) / 8) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 2. HORIZONTAL STEPPER CARD (Completed: Xanh mint, Active: Cam, Inactive: Xám) */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] p-3.5 md:p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[680px] gap-2">
          {steps.map((step, idx) => {
            const isCurrent = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isClickable = isCompleted || step.id === currentStep;

            return (
              <React.Fragment key={step.id}>
                {/* Step Item */}
                <button
                  type="button"
                  disabled={!isClickable && !autoMode}
                  onClick={() => onStepClick(step.id as WorkflowStep)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all select-none ${
                    isCurrent
                      ? "bg-orange-50/80 border-2 border-[#F5730B] text-[#F5730B] font-black shadow-2xs"
                      : isCompleted
                      ? "bg-emerald-50/80 border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100/70 cursor-pointer"
                      : "bg-stone-50 text-stone-400 border border-transparent cursor-not-allowed opacity-75"
                  }`}
                >
                  {/* Step Icon / Number */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isCurrent
                        ? "bg-[#F5730B] text-white shadow-2xs"
                        : isCompleted
                        ? "bg-[#10B981] text-white shadow-2xs"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent && isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      step.id
                    )}
                  </div>

                  <span className="text-xs font-bold whitespace-nowrap">
                    {step.name}
                  </span>
                </button>

                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-colors ${
                      completedSteps.includes(step.id)
                        ? "bg-[#10B981]"
                        : "bg-stone-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
