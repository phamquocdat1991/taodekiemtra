import React from "react";
import { FolderHeart, Wand2, PlayCircle, AlertCircle } from "lucide-react";

interface StickyActionBarProps {
  isValid: boolean;
  onOpenPresets: () => void;
  onStartAuto: () => void;
  onStartManual: () => void;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  isValid,
  onOpenPresets,
  onStartAuto,
  onStartManual,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(7,26,51,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 sm:flex-row">
        {/* Left note if invalid */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium">
          {isValid ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Cấu hình hợp lệ, sẵn sàng sinh bộ đề chuẩn GDPT 2018
            </span>
          ) : (
            <span className="text-red-600 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Vui lòng kiểm tra mức độ nhận thức (100%) và điểm số (10đ)
            </span>
          )}
        </div>

        {/* 3 Action Buttons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* QUẢN LÝ CẤU HÌNH */}
          <button
            type="button"
            onClick={onOpenPresets}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-[#164e7a] shadow-xs transition-all hover:border-amber-200 hover:bg-amber-50 active:scale-95 sm:flex-none md:text-sm"
          >
            <FolderHeart className="h-4 w-4 text-[#164e7a]" />
            <span>QUẢN LÝ CẤU HÌNH</span>
          </button>

          {/* TẠO ĐỀ TỰ ĐỘNG */}
          <button
            type="button"
            disabled={!isValid}
            onClick={onStartAuto}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#071a33] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0c3152] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none md:px-5 md:text-sm"
          >
            <Wand2 className="h-4 w-4 text-amber-300" />
            <span>TẠO ĐỀ TỰ ĐỘNG</span>
          </button>

          {/* BẮT ĐẦU TẠO ĐỀ */}
          <button
            type="button"
            disabled={!isValid}
            onClick={onStartManual}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-[#071a33] shadow-sm transition-all hover:bg-amber-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none md:px-5 md:text-sm"
          >
            <PlayCircle className="h-4 w-4" />
            <span>BẮT ĐẦU TẠO ĐỀ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
