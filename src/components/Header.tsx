import React from "react";
import { Lightbulb, Key, BookOpen, LogOut, Sparkles, ShieldCheck, Crown } from "lucide-react";

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  onOpenGuideModal: () => void;
  onResetSession: () => void;
  hasCustomKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKeyModal,
  onOpenGuideModal,
  onResetSession,
  hasCustomKey,
}) => {
  return (
    <header className="bg-white rounded-[28px] shadow-[0_2px_12px_rgba(67,24,5,0.04)] border border-[#EFE7DF] p-5 md:p-6 mb-5 transition-all">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-start sm:items-center gap-3.5 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#F5730B] flex items-center justify-center text-white shadow-md shrink-0">
            <Lightbulb className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            {/* Developer Credit Requirement */}
            <div className="text-[11px] md:text-xs font-extrabold text-[#8F310C] tracking-wide uppercase mb-0.5">
              Phát triển bởi: Anh Giáo PHẠM QUỐC ĐẠT
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-[#431805] tracking-tight">
                TẠO ĐỀ KIỂM TRA
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-[#8F310C] border border-amber-200">
                <Crown className="w-3 h-3 text-amber-600" /> VIP
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#F5730B] border border-orange-200">
                <Sparkles className="w-3 h-3" /> GEMINI AI
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> BẢN CHÍNH THỨC
              </span>
            </div>
            <p className="text-xs md:text-sm text-stone-600 font-medium">
              Hệ thống tạo đề chuẩn GDPT 2018 theo định dạng Bộ GD&ĐT
            </p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto justify-start sm:justify-end">
          <button
            onClick={onOpenApiKeyModal}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              hasCustomKey
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-[#FAF8F5] text-[#8F310C] border-[#EFE7DF] hover:bg-orange-50 hover:border-orange-200"
            }`}
            title="Nhập API Key cá nhân của thầy cô"
          >
            <Key className="w-3.5 h-3.5 text-[#F5730B]" />
            <span>NẠP API KEY</span>
            {hasCustomKey && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={onOpenGuideModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] text-stone-700 border border-[#EFE7DF] hover:bg-stone-100 transition-all active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span>HƯỚNG DẪN</span>
          </button>

          <button
            onClick={onResetSession}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] text-stone-600 border border-[#EFE7DF] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all active:scale-95"
            title="Làm mới cấu hình và bắt đầu lại"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ĐĂNG XUẤT</span>
          </button>

          {/* Round Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8F310C] to-[#F5730B] text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0" title="Tài khoản Giáo viên">
            GV
          </div>
        </div>
      </div>
    </header>
  );
};
