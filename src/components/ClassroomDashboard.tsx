import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  LoaderCircle,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { getCustomApiKey } from "../services/geminiService";
import {
  approveEssayScores,
  generateRemedialTest,
  getRoomResults,
  publishResult,
  suggestEssayScores,
  type ClassroomResults,
  type ClassroomSubmission,
  type RemedialTest,
} from "../services/roomService";

interface ClassroomDashboardProps {
  pin: string;
  onClose: () => void;
}

export const ClassroomDashboard: React.FC<ClassroomDashboardProps> = ({ pin, onClose }) => {
  const [data, setData] = useState<ClassroomResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remedial, setRemedial] = useState<RemedialTest | null>(null);
  const [remedialLoading, setRemedialLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const results = await getRoomResults(pin);
      setData(results);
      setError("");
      setLastRefresh(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu lớp học.");
    } finally {
      setLoading(false);
    }
  }, [pin]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const graded = useMemo(
    () => data?.submissions.filter((submission) => submission.scorePercent != null) ?? [],
    [data?.submissions],
  );
  const average = graded.length
    ? graded.reduce((total, submission) => total + submission.earnedPoints, 0) / graded.length
    : 0;
  const pendingCount = data?.submissions.filter((submission) =>
    ["pending_ai", "pending_teacher", "approved"].includes(submission.reviewStatus),
  ).length ?? 0;

  const createRemedial = async () => {
    setRemedialLoading(true);
    setError("");
    try {
      setRemedial(await generateRemedialTest(pin, getCustomApiKey() || ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo đề củng cố.");
    } finally {
      setRemedialLoading(false);
    }
  };

  if (loading) {
    return <div className="fixed inset-0 z-50 grid place-items-center bg-[#06172d]/90 p-4 backdrop-blur-sm" role="status"><div className="rounded-2xl border border-white/10 bg-[#0c2945] p-8 text-center text-white"><RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-300" /><p className="font-bold">Đang tải dữ liệu lớp học…</p></div></div>;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#06172d]/90 p-2 backdrop-blur-sm md:p-5" role="dialog" aria-modal="true" aria-labelledby="dashboard-title">
      <section className="mx-auto my-2 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#071a33] text-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300"><BarChart3 className="h-5 w-5" /></div>
            <div className="min-w-0"><h2 id="dashboard-title" className="truncate text-base font-black">Bảng điều khiển lớp học</h2><p className="truncate text-xs text-slate-400">{data?.roomInfo.subject} – {data?.roomInfo.grade} · PIN <span className="font-mono font-bold text-amber-300">{pin}</span></p></div>
          </div>
          <div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 text-[11px] text-slate-500 sm:flex"><RefreshCw className="h-3 w-3" />{lastRefresh.toLocaleTimeString("vi-VN")}</span><button type="button" onClick={onClose} aria-label="Đóng bảng điều khiển" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button></div>
        </header>

        <div className="space-y-5 p-4 md:p-6">
          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p>}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={Users} label="Đã nộp bài" value={String(data?.submissionCount ?? 0)} tone="text-sky-300" />
            <Stat icon={Trophy} label="Điểm trung bình" value={graded.length ? average.toFixed(1) : "—"} tone="text-amber-300" />
            <Stat icon={Brain} label="Chờ duyệt" value={String(pendingCount)} tone="text-violet-300" />
            <Stat icon={Clock} label="Trạng thái phòng" value={data?.roomInfo.status === "open" ? "Đang mở" : "Đã đóng"} tone="text-emerald-300" />
          </div>

          {data && data.topWrongQuestions.length > 0 && (
            <section className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-4"><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-300" /><h3 className="text-sm font-bold">Câu nhiều học sinh sai nhất</h3></div><div className="space-y-2.5">{data.topWrongQuestions.map((question) => <div key={`${question.questionNumber}-${question.excerpt}`} className="grid grid-cols-[4rem_1fr_4rem] items-center gap-3"><span className="text-xs font-black text-red-300">Câu {question.questionNumber}</span><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-red-400" style={{ width: `${question.wrongPercent}%` }} /></div><span className="text-right text-xs font-bold text-red-200">{question.wrongPercent}%</span></div>)}</div></section>
          )}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h3 className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-sky-300" />Danh sách bài nộp</h3><button type="button" onClick={() => void refresh()} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/15"><RefreshCw className="h-3 w-3" />Làm mới</button></div>
            {!data?.submissions.length ? <div className="py-10 text-center"><Users className="mx-auto mb-2 h-10 w-10 text-white/15" /><p className="text-sm text-slate-400">Chưa có học sinh nộp bài.</p></div> : <div className="divide-y divide-white/[0.06]">{[...data.submissions].sort((a, b) => b.submittedAt - a.submittedAt).map((submission, index) => {
              const expanded = expandedId === submission.id;
              return <article key={submission.id}><button type="button" onClick={() => setExpandedId(expanded ? null : submission.id)} className="grid w-full grid-cols-[2rem_1fr_auto_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"><span className="text-center text-xs font-bold text-slate-500">{index + 1}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{submission.studentName}</span><span className="block text-[11px] text-slate-500">{new Date(submission.submittedAt).toLocaleString("vi-VN")}</span></span><StatusBadge status={submission.reviewStatus} /><span className="flex items-center gap-2 text-sm font-black">{submission.scorePercent == null ? "—" : `${submission.earnedPoints.toFixed(1)}/${submission.totalPoints}`}{expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}</span></button>{expanded && <SubmissionDetail submission={submission} onUpdated={refresh} />}</article>;
            })}</div>}
          </section>

          {data && data.submissionCount > 0 && !remedial && <button type="button" onClick={() => void createRemedial()} disabled={remedialLoading} className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-amber-400 py-4 text-sm font-black text-[#071a33] shadow-lg shadow-amber-950/20 transition hover:bg-amber-300 disabled:opacity-60">{remedialLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" />AI đang tạo đề củng cố…</> : <><Brain className="h-4 w-4" />Tạo đề luyện củng cố bằng AI<Sparkles className="h-4 w-4" /></>}</button>}
          {remedial && <RemedialDisplay remedial={remedial} />}
        </div>
      </section>
    </div>
  );
};

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><Icon className={`mb-2 h-5 w-5 ${tone}`} /><p className="text-xl font-black md:text-2xl">{value}</p><p className="mt-0.5 text-[11px] font-bold text-slate-500">{label}</p></div>;
}

function StatusBadge({ status }: { status: ClassroomSubmission["reviewStatus"] }) {
  const map: Record<string, { label: string; classes: string }> = {
    not_required: { label: "Đã chấm", classes: "bg-emerald-500/15 text-emerald-300" },
    pending_ai: { label: "Chờ AI", classes: "bg-violet-500/15 text-violet-300" },
    pending_teacher: { label: "Chờ GV", classes: "bg-amber-400/15 text-amber-200" },
    approved: { label: "Chờ công bố", classes: "bg-sky-500/15 text-sky-300" },
    published: { label: "Đã công bố", classes: "bg-emerald-500/15 text-emerald-300" },
  };
  const current = map[status] ?? map.not_required;
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${current.classes}`}>{current.label}</span>;
}

function SubmissionDetail({ submission, onUpdated }: { submission: ClassroomSubmission; onUpdated: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<Record<string, { points: string; comment: string }>>(() =>
    Object.fromEntries((submission.aiReview?.items ?? []).map((item) => [item.questionId, { points: String(item.suggestedPoints), comment: item.feedback }])),
  );

  useEffect(() => {
    setReviews(Object.fromEntries((submission.aiReview?.items ?? []).map((item) => [item.questionId, { points: String(item.suggestedPoints), comment: item.feedback }])));
  }, [submission.aiReview]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try { await action(); await onUpdated(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể cập nhật bài làm."); } finally { setBusy(false); }
  };

  const pendingQuestions = submission.partResults.flatMap((part) => part.questions).filter((question) => question.gradingStatus === "pending_review");
  const approve = () => run(() => approveEssayScores(submission.id, pendingQuestions.map((question) => ({ questionId: question.questionId, points: Number(reviews[question.questionId]?.points), comment: reviews[question.questionId]?.comment ?? "" }))));

  return <div className="space-y-4 bg-black/15 px-4 py-4 md:pl-12">{error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p>}<div className="flex flex-wrap gap-1.5">{submission.partResults.flatMap((part) => part.questions).map((question) => <div key={question.questionId} title={`Câu ${question.questionNumber}`} className={`grid h-8 min-w-8 place-items-center rounded-lg border px-1 text-[10px] font-bold ${question.gradingStatus === "pending_review" ? "border-amber-400/30 bg-amber-400/15 text-amber-200" : question.isCorrect ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-red-500/30 bg-red-500/15 text-red-300"}`}>{String(question.questionNumber)}</div>)}</div>
    {submission.reviewStatus === "pending_ai" && <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.07] p-4"><h4 className="text-sm font-black text-violet-200">Tạo gợi ý điểm theo rubric</h4><p className="mt-1 text-xs leading-5 text-slate-400">AI phân tích bài làm và rubric; giáo viên vẫn phải kiểm tra, sửa nếu cần và xác nhận.</p><button type="button" disabled={busy} onClick={() => void run(() => suggestEssayScores(submission.id, getCustomApiKey() || ""))} className="mt-3 flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}AI gợi ý điểm</button></div>}
    {submission.reviewStatus === "pending_teacher" && submission.aiReview && <div className="space-y-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4"><div><h4 className="text-sm font-black text-amber-200">Giáo viên xác nhận điểm</h4><p className="mt-1 text-xs text-slate-400">{submission.aiReview.overallComment}</p></div>{pendingQuestions.map((question) => { const suggestion = submission.aiReview?.items.find((item) => item.questionId === question.questionId); const draft = reviews[question.questionId] ?? { points: String(suggestion?.suggestedPoints ?? 0), comment: suggestion?.feedback ?? "" }; return <div key={question.questionId} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-bold">Câu {question.questionNumber}: {question.questionExcerpt}</p><p className="mt-2 rounded-lg bg-black/15 p-2 text-xs leading-5 text-slate-300">{question.studentAnswer || "(Không có bài làm)"}</p><div className="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr]"><label className="text-[11px] font-bold text-slate-400">Điểm / {question.points}<input type="number" min={0} max={question.points} step="0.25" value={draft.points} onChange={(event) => setReviews((current) => ({ ...current, [question.questionId]: { ...draft, points: event.target.value } }))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white" /></label><label className="text-[11px] font-bold text-slate-400">Nhận xét<input value={draft.comment} onChange={(event) => setReviews((current) => ({ ...current, [question.questionId]: { ...draft, comment: event.target.value } }))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white" /></label></div>{suggestion && <p className="mt-2 text-[11px] text-amber-200">AI gợi ý {suggestion.suggestedPoints}/{question.points}: {suggestion.feedback}</p>}</div>; })}<button type="button" disabled={busy} onClick={() => void approve()} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-[#071a33] disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Xác nhận điểm</button></div>}
    {submission.reviewStatus === "approved" && <div className="flex flex-col gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="text-sm font-black text-sky-200">Điểm đã được giáo viên duyệt</h4><p className="mt-1 text-xs text-slate-400">Kết quả: {submission.earnedPoints.toFixed(1)}/{submission.totalPoints}. Học sinh chưa nhìn thấy cho đến khi công bố.</p></div><button type="button" disabled={busy} onClick={() => void run(() => publishResult(submission.id))} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Công bố điểm</button></div>}
    {submission.reviewStatus === "published" && <p className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-200"><CheckCircle2 className="h-4 w-4" />Điểm đã được công bố cho học sinh.</p>}
  </div>;
}

function RemedialDisplay({ remedial }: { remedial: RemedialTest }) {
  return <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5"><div className="mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-amber-300" /><h3 className="text-sm font-black">{remedial.title}</h3></div><div className="mb-4 flex flex-wrap gap-2">{remedial.targetedWeaknesses.map((item) => <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-300">{item}</span>)}</div><div className="space-y-3">{remedial.questions.map((question) => <article key={question.number} className="rounded-xl bg-black/15 p-4"><p className="text-sm font-semibold"><span className="mr-2 font-black text-amber-300">Câu {question.number}.</span>{question.content}</p><div className="mt-3 grid gap-1.5 sm:grid-cols-2">{Object.entries(question.options).map(([key, value]) => <p key={key} className={`rounded-lg px-3 py-2 text-xs ${question.answer === key ? "bg-emerald-500/15 text-emerald-200" : "bg-white/5 text-slate-300"}`}><strong>{key}.</strong> {value}</p>)}</div><p className="mt-3 text-xs leading-5 text-amber-100"><strong>Giải thích:</strong> {question.explanation}</p></article>)}</div></section>;
}
