import React from "react";
import { AlertCircle, CheckCircle2, Clock3, FileQuestion, Gauge, School } from "lucide-react";

import type { ExamConfigValidation } from "../lib/examValidation";
import type { FullExamState } from "../types";

export function ConfigurationSummary({ config, validation }: { config: FullExamState; validation: ExamConfigValidation }) {
  const rows = [
    { icon: School, label: "Đơn vị", value: config.general.schoolName || "Chưa nhập" },
    { icon: FileQuestion, label: "Môn – lớp", value: `${config.general.subject} · ${config.general.grade}` },
    { icon: Clock3, label: "Thời lượng", value: `${config.general.duration} phút` },
    { icon: Gauge, label: "Độ khó", value: config.cognition.difficulty },
  ];

  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start" aria-label="Tóm tắt cấu hình">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(7,26,51,0.06)]">
        <div className="border-b border-slate-100 bg-[#071a33] px-4 py-3 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Tóm tắt nhanh</p>
          <h2 className="mt-1 text-sm font-black">Cấu hình đề kiểm tra</h2>
        </div>
        <dl className="divide-y divide-slate-100 px-4">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="grid grid-cols-[1.5rem_1fr] gap-x-2 py-3">
              <Icon className="mt-0.5 h-4 w-4 text-[#a36300]" />
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-0.5 break-words text-xs font-bold leading-5 text-[#071a33]">{value}</dd></div>
            </div>
          ))}
        </dl>
      </section>

      <section className={`rounded-2xl border p-4 ${validation.isValid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex items-start gap-2.5">
          {validation.isValid ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />}
          <div><h3 className={`text-sm font-black ${validation.isValid ? "text-emerald-800" : "text-amber-900"}`}>{validation.isValid ? "Sẵn sàng tạo đề" : "Cần hoàn thiện"}</h3><p className={`mt-1 text-xs leading-5 ${validation.isValid ? "text-emerald-700" : "text-amber-800"}`}>{validation.isValid ? `${validation.structure.totalCount} câu · ${validation.structure.totalPoints} điểm · 100% mức độ` : `${validation.errors.length} mục chưa hợp lệ`}</p></div>
        </div>
        {!validation.isValid && <ul className="mt-3 space-y-2 border-t border-amber-200 pt-3">{validation.errors.map((error) => <li key={error.code} className="text-[11px] font-semibold leading-4 text-amber-900">• {error.message}</li>)}</ul>}
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#164e7a]">Quyền riêng tư</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">Đáp án và rubric chỉ dành cho giáo viên. Học sinh nhận đề qua mã PIN, không thể đọc trực tiếp dữ liệu đáp án.</p>
      </section>
    </aside>
  );
}
