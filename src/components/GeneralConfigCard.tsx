import React from "react";
import {
  GeneralConfig,
  CognitionLevels,
  EducationLevel,
  ExamType,
  Textbook,
  ExamDifficulty,
} from "../types";
import { Settings, AlertCircle, CheckCircle2, Sliders, Zap, Trophy, Flame, Sprout } from "lucide-react";

// ─── Difficulty Preset Data ───────────────────────────────────────────────────
interface DifficultyPreset {
  id: ExamDifficulty;
  label: string;
  subLabel: string;
  target: string;
  icon: React.ReactNode;
  nb: number;
  th: number;
  vd: number;
  vdc: number;
  bgClass: string;
  activeBgClass: string;
  borderClass: string;
  activeBorderClass: string;
  iconBgClass: string;
  labelColorClass: string;
}

const DIFFICULTY_PRESETS: DifficultyPreset[] = [
  {
    id: "Dễ",
    label: "Nền tảng",
    subLabel: "Củng cố kiến thức",
    target: "Mục tiêu 5 – 6đ",
    icon: <Sprout className="w-5 h-5" />,
    nb: 50, th: 35, vd: 15, vdc: 0,
    bgClass: "bg-sky-50/60 hover:bg-sky-100/80",
    activeBgClass: "bg-sky-100",
    borderClass: "border-sky-200",
    activeBorderClass: "border-sky-500",
    iconBgClass: "bg-sky-500 text-white",
    labelColorClass: "text-sky-700",
  },
  {
    id: "Trung bình",
    label: "Chuẩn",
    subLabel: "Tốt nghiệp / Định kỳ",
    target: "Mục tiêu 7 – 8đ",
    icon: <Zap className="w-5 h-5" />,
    nb: 40, th: 30, vd: 20, vdc: 10,
    bgClass: "bg-emerald-50/60 hover:bg-emerald-100/80",
    activeBgClass: "bg-emerald-100",
    borderClass: "border-emerald-200",
    activeBorderClass: "border-emerald-500",
    iconBgClass: "bg-emerald-500 text-white",
    labelColorClass: "text-emerald-700",
  },
  {
    id: "Khá",
    label: "Nâng cao",
    subLabel: "Bứt phá / Khảo sát",
    target: "Mục tiêu 8 – 9đ",
    icon: <Flame className="w-5 h-5" />,
    nb: 25, th: 30, vd: 30, vdc: 15,
    bgClass: "bg-amber-50/60 hover:bg-amber-100/80",
    activeBgClass: "bg-amber-100",
    borderClass: "border-amber-200",
    activeBorderClass: "border-amber-500",
    iconBgClass: "bg-amber-500 text-white",
    labelColorClass: "text-amber-700",
  },
  {
    id: "Khó",
    label: "Thử thách",
    subLabel: "Phân hóa / HSG",
    target: "Mục tiêu 9 – 10đ",
    icon: <Trophy className="w-5 h-5" />,
    nb: 15, th: 25, vd: 30, vdc: 30,
    bgClass: "bg-rose-50/60 hover:bg-rose-100/80",
    activeBgClass: "bg-rose-100",
    borderClass: "border-rose-200",
    activeBorderClass: "border-rose-500",
    iconBgClass: "bg-rose-500 text-white",
    labelColorClass: "text-rose-700",
  },
];

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

      {/* ── Preset Cards: Chọn cấp độ bẫy tư duy ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#8F310C]" />
          <h3 className="text-xs font-extrabold text-[#8F310C] uppercase tracking-wider">
            Chọn nhanh cấp độ đề (Tự động điền % nhận thức)
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {DIFFICULTY_PRESETS.map((preset) => {
            const isActive = cognition.difficulty === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onCognitionChange({
                    nb: preset.nb,
                    th: preset.th,
                    vd: preset.vd,
                    vdc: preset.vdc,
                    difficulty: preset.id,
                  })
                }
                className={`relative flex flex-col items-start gap-2 p-3.5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? `${preset.activeBgClass} ${preset.activeBorderClass} shadow-md`
                    : `${preset.bgClass} ${preset.borderClass} hover:shadow-sm`
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current animate-pulse" style={{ color: "inherit" }}>
                    <span className={`block w-2 h-2 rounded-full ${preset.iconBgClass.split(' ')[0]}`} />
                  </span>
                )}

                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${preset.iconBgClass}`}>
                  {preset.icon}
                </div>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm leading-tight ${preset.labelColorClass}`}>
                    {preset.label}
                  </p>
                  <p className="text-[11px] text-stone-500 font-medium leading-snug mt-0.5">
                    {preset.subLabel}
                  </p>
                  <p className={`text-[10px] font-bold mt-1.5 ${preset.labelColorClass}`}>
                    {preset.target}
                  </p>
                </div>

                {/* NB/TH/VD/VDC mini badges */}
                <div className="flex flex-wrap gap-1 w-full">
                  {[
                    { key: "NB", val: preset.nb, color: "text-blue-600 bg-blue-50" },
                    { key: "TH", val: preset.th, color: "text-emerald-600 bg-emerald-50" },
                    { key: "VD", val: preset.vd, color: "text-amber-600 bg-amber-50" },
                    { key: "VDC", val: preset.vdc, color: "text-rose-600 bg-rose-50" },
                  ].map((b) => (
                    <span key={b.key} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${b.color}`}>
                      {b.key}: {b.val}%
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-stone-400 font-medium mt-2 pl-1">
          💡 Bấm chọn một trong 4 cấp độ để tự động điền tỉ lệ % nhận thức bên dưới. Bạn vẫn có thể chỉnh tay sau đó.
        </p>
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

        {/* Thông báo cam kết khi NB = 0 */}
        {Number(cognition.nb || 0) === 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Cam kết Nhận biết (NB) = 0%:</strong> Ma trận, bản đặc tả và đề thi sẽ không có bất kỳ câu hỏi nhận biết nào, dồn 100% trọng tâm vào Thông hiểu, Vận dụng và Vận dụng cao.
            </span>
          </div>
        )}

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
