import React from "react";
import {
  GeneralConfig,
  CognitionLevels,
  EducationLevel,
  ExamType,
  Textbook,
  ExamDifficulty,
} from "../types";
import { Settings, AlertCircle, CheckCircle2, Sliders } from "lucide-react";

interface GeneralConfigCardProps {
  general: GeneralConfig;
  cognition: CognitionLevels;
  onGeneralChange: (updated: Partial<GeneralConfig>) => void;
  onCognitionChange: (updated: Partial<CognitionLevels>) => void;
  onSubjectChange: (subject: string) => void;
}

const subjectsByLevel: Record<EducationLevel, string[]> = {
  "Tiểu học": [
    "Toán",
    "Tiếng Việt",
    "Tiếng Anh",
    "Khoa học",
    "Lịch sử và Địa lí",
    "Tin học và Công nghệ",
    "Đạo đức",
    "Hoạt động trải nghiệm",
  ],
  "Cấp 2 (THCS)": [
    "Toán",
    "Ngữ văn",
    "Tiếng Anh",
    "Khoa học tự nhiên",
    "Lịch sử và Địa lí",
    "Giáo dục công dân",
    "Tin học",
    "Công nghệ",
    "Ngoại ngữ khác",
  ],
  "Cấp 3 (THPT)": [
    "Toán",
    "Ngữ văn",
    "Tiếng Anh",
    "Vật lí",
    "Hóa học",
    "Sinh học",
    "Lịch sử",
    "Địa lí",
    "Giáo dục kinh tế và pháp luật",
    "Tin học",
    "Công nghệ",
    "Ngoại ngữ khác",
  ],
};

const gradesByLevel: Record<EducationLevel, string[]> = {
  "Tiểu học": ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"],
  "Cấp 2 (THCS)": ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"],
  "Cấp 3 (THPT)": ["Lớp 10", "Lớp 11", "Lớp 12"],
};

export const GeneralConfigCard: React.FC<GeneralConfigCardProps> = ({
  general,
  cognition,
  onGeneralChange,
  onCognitionChange,
  onSubjectChange,
}) => {
  const totalCognition =
    Number(cognition.nb || 0) +
    Number(cognition.th || 0) +
    Number(cognition.vd || 0) +
    Number(cognition.vdc || 0);

  const isCognitionValid = totalCognition === 100;

  const handleEducationLevelChange = (level: EducationLevel) => {
    const grades = gradesByLevel[level];
    const subjects = subjectsByLevel[level];
    onGeneralChange({
      educationLevel: level,
      grade: grades[0],
      subject: subjects[0],
    });
    onSubjectChange(subjects[0]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] p-5 md:p-6 mb-5 transition-all">
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#EFE7DF]">
        <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F5730B] flex items-center justify-center font-bold text-sm shrink-0">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-black text-[#431805] tracking-tight">1. Thiết lập chung</h2>
          <p className="text-xs text-stone-500 font-medium">Thông tin đơn vị, khối lớp, môn học và mức độ đề</p>
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-5">
        {/* Cơ quan chủ quản */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            CƠ QUAN CHỦ QUẢN
          </label>
          <input
            type="text"
            value={general.department}
            onChange={(e) => onGeneralChange({ department: e.target.value })}
            placeholder="VD: SỞ GD&ĐT HÀ NỘI"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-semibold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* Tên trường */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            TÊN TRƯỜNG
          </label>
          <input
            type="text"
            value={general.schoolName}
            onChange={(e) => onGeneralChange({ schoolName: e.target.value })}
            placeholder="VD: TRƯỜNG THPT CHU VĂN AN"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-semibold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* Đề kiểm tra */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            ĐỀ KIỂM TRA
          </label>
          <select
            value={general.examType}
            onChange={(e) => onGeneralChange({ examType: e.target.value as ExamType })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-bold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none cursor-pointer"
          >
            <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên (15-30p)</option>
            <option value="Giữa kì 1">Giữa kì 1</option>
            <option value="Cuối kì 1">Cuối kì 1</option>
            <option value="Giữa kì 2">Giữa kì 2</option>
            <option value="Cuối kì 2">Cuối kì 2</option>
            <option value="Tùy chỉnh">Tùy chỉnh</option>
          </select>
        </div>

        {/* Cấp học */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            CẤP HỌC
          </label>
          <select
            value={general.educationLevel}
            onChange={(e) => handleEducationLevelChange(e.target.value as EducationLevel)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-bold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none cursor-pointer"
          >
            <option value="Tiểu học">Tiểu học (Lớp 1 - 5)</option>
            <option value="Cấp 2 (THCS)">Cấp 2 (THCS: Lớp 6 - 9)</option>
            <option value="Cấp 3 (THPT)">Cấp 3 (THPT: Lớp 10 - 12)</option>
          </select>
        </div>

        {/* Lớp */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            LỚP
          </label>
          <select
            value={general.grade}
            onChange={(e) => onGeneralChange({ grade: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-bold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none cursor-pointer"
          >
            {gradesByLevel[general.educationLevel].map((gr) => (
              <option key={gr} value={gr}>
                {gr}
              </option>
            ))}
          </select>
        </div>

        {/* Môn học */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            MÔN HỌC
          </label>
          <select
            value={general.subject}
            onChange={(e) => {
              onGeneralChange({ subject: e.target.value });
              onSubjectChange(e.target.value);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-bold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none cursor-pointer"
          >
            {subjectsByLevel[general.educationLevel].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Bộ sách */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            BỘ SÁCH
          </label>
          <select
            value={general.textbook}
            onChange={(e) => onGeneralChange({ textbook: e.target.value as Textbook })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-bold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none cursor-pointer"
          >
            <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
            <option value="Cánh Diều">Cánh Diều</option>
            <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
            <option value="Bộ sách hiện hành">Bộ sách hiện hành (GDPT 2018)</option>
            <option value="Tùy chỉnh">Tùy chỉnh</option>
          </select>
        </div>

        {/* Thời gian */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            THỜI GIAN (PHÚT)
          </label>
          <div className="relative">
            <input
              type="number"
              min={15}
              max={180}
              step={5}
              value={general.duration}
              onChange={(e) => onGeneralChange({ duration: Number(e.target.value) || 45 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-semibold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none pr-16"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-stone-400 pointer-events-none">
              PHÚT
            </span>
          </div>
        </div>

        {/* Mức độ đề */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            MỨC ĐỘ ĐỀ
          </label>
          <select
            value={cognition.difficulty}
            onChange={(e) => onCognitionChange({ difficulty: e.target.value as ExamDifficulty })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm font-bold text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none cursor-pointer"
          >
            <option value="Dễ">Dễ (Học sinh đại trà)</option>
            <option value="Trung bình">Trung bình (Chuẩn kiến thức kĩ năng)</option>
            <option value="Khá">Khá (Phân hóa học sinh khá giỏi)</option>
            <option value="Khó">Khó (Đề khảo sát/chuyên/HSG)</option>
          </select>
        </div>
      </div>

      {/* Section III: Mức độ nhận thức */}
      <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#EFE7DF]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#8F310C]" />
            <h3 className="text-xs font-extrabold text-[#8F310C] uppercase tracking-wider">
              MỨC ĐỘ NHẬN THỨC (%) & MỨC ĐỘ ĐỀ
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isCognitionValid
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-red-100 text-red-700 border border-red-200 animate-pulse"
            }`}
          >
            {isCognitionValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            )}
            Tổng: {totalCognition}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* NB */}
          <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">NHẬN BIẾT (NB)</span>
              <span className="text-[10px] text-stone-400 font-medium">cơ bản</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={cognition.nb}
                onChange={(e) => onCognitionChange({ nb: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm font-bold text-blue-900 bg-blue-50/30 outline-none focus:border-blue-500"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-stone-400 font-bold">%</span>
            </div>
          </div>

          {/* TH */}
          <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">THÔNG HIỂU (TH)</span>
              <span className="text-[10px] text-stone-400 font-medium">hiểu sâu</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={cognition.th}
                onChange={(e) => onCognitionChange({ th: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm font-bold text-emerald-900 bg-emerald-50/30 outline-none focus:border-emerald-500"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-stone-400 font-bold">%</span>
            </div>
          </div>

          {/* VD */}
          <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">VẬN DỤNG (VD)</span>
              <span className="text-[10px] text-stone-400 font-medium">thực hành</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={cognition.vd}
                onChange={(e) => onCognitionChange({ vd: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm font-bold text-amber-900 bg-amber-50/30 outline-none focus:border-amber-500"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-stone-400 font-bold">%</span>
            </div>
          </div>

          {/* VDC */}
          <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">VẬN DỤNG CAO (VDC)</span>
              <span className="text-[10px] text-stone-400 font-medium">phân hóa</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={cognition.vdc}
                onChange={(e) => onCognitionChange({ vdc: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-sm font-bold text-rose-900 bg-rose-50/30 outline-none focus:border-rose-500"
              />
              <span className="absolute right-2.5 top-1.5 text-xs text-stone-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {!isCognitionValid && (
          <div className="mt-2.5 text-xs text-red-600 flex items-center gap-1.5 font-semibold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Tổng tỷ lệ mức độ nhận thức phải bằng đúng 100% để đảm bảo ma trận hợp lệ.</span>
          </div>
        )}
      </div>
    </div>
  );
};
