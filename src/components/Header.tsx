import React from "react";
import { Lightbulb, Key, BookOpen, LogOut, Sparkles, ShieldCheck, Crown, GraduationCap } from "lucide-react";

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  onOpenGuideModal: () => void;
  onSignOut: () => void;
  hasCustomKey: boolean;
  onGoToStudentPortal: () => void;
  teacherEmail: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKeyModal,
  onOpenGuideModal,
  onSignOut,
  hasCustomKey,
  onGoToStudentPortal,
  teacherEmail,
}) => {
  const initials = teacherEmail.slice(0, 2).toLocaleUpperCase("vi") || "GV";
  return (
    <header className="mb-5 rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_35px_rgba(7,26,51,0.07)] transition-all md:p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-start sm:items-center gap-3.5 md:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071a33] text-amber-300 shadow-md md:h-14 md:w-14">
            <Lightbulb className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            {/* Developer Credit Requirement */}
            <div className="mb-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#a36300] md:text-xs">
              Phát triển bởi: Anh Giáo PHẠM QUỐC ĐẠT
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black tracking-tight text-[#071a33] md:text-2xl lg:text-3xl">
                TẠO ĐỀ KIỂM TRA
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-[#8a5700]">
                <Crown className="w-3 h-3 text-amber-600" /> VIP
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-[#164e7a]">
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
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
              hasCustomKey
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "border-slate-200 bg-slate-50 text-[#164e7a] hover:border-amber-200 hover:bg-amber-50"
            }`}
            title="Nhập API Key cá nhân của thầy cô"
          >
            <Key className="h-3.5 w-3.5 text-[#a36300]" />
            <span>NẠP API KEY</span>
            {hasCustomKey && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={onOpenGuideModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span>HƯỚNG DẪN</span>
          </button>

          {/* Student Portal Button */}
          <button
            onClick={onGoToStudentPortal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0c3152] bg-[#071a33] px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0c3152] active:scale-95"
            title="Học sinh vào phòng thi bằng mã PIN"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>VÀO PHÒNG THI</span>
          </button>

          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-95"
            title={`Đăng xuất ${teacherEmail}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ĐĂNG XUẤT</span>
          </button>

          {/* Round Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#071a33] to-[#164e7a] text-xs font-bold text-white shadow-inner" title={teacherEmail || "Tài khoản giáo viên"}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
