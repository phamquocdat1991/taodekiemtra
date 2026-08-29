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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFE7DF] shadow-[0_-4px_20px_rgba(67,24,5,0.06)] py-3 px-4">
      <div className="max-w-[1020px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-50 hover:border-orange-200 border border-[#EFE7DF] transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <FolderHeart className="w-4 h-4 text-[#8F310C]" />
            <span>QUẢN LÝ CẤU HÌNH</span>
          </button>

          {/* TẠO ĐỀ TỰ ĐỘNG */}
          <button
            type="button"
            disabled={!isValid}
            onClick={onStartAuto}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-[#431805] text-white hover:bg-[#5a2107] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-[#F5730B]" />
            <span>TẠO ĐỀ TỰ ĐỘNG</span>
          </button>

          {/* BẮT ĐẦU TẠO ĐỀ */}
          <button
            type="button"
            disabled={!isValid}
            onClick={onStartManual}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-[#F5730B] text-white hover:bg-[#e06606] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-white" />
            <span>BẮT ĐẦU TẠO ĐỀ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
