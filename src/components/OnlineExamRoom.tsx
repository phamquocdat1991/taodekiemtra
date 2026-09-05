import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

import type { ExamQuestion, ExamResult, OnlineRoom, StudentAnswerMap } from "../types";
import { getStudentResult, submitAnswers, type ReviewStatus } from "../services/roomService";

interface OnlineExamRoomProps {
  room: OnlineRoom;
  studentName: string;
  onFinish: () => void;
}

const statementKey = (questionId: string, label: string) =>
  `${questionId}:${label.toLocaleLowerCase("vi").replace(/[^a-z0-9]/g, "")}`;

export const OnlineExamRoom: React.FC<OnlineExamRoomProps> = ({ room, studentName, onFinish }) => {
  const allQuestions = useMemo(
    () =>
      room.exam.parts.flatMap((part) =>
        part.questions.map((question) => ({ ...question, partTitle: part.partTitle })),
      ),
    [room.exam.parts],
  );
  const maximumSeconds = room.config.general.duration * 60;
  const initialSeconds = Math.max(
    0,
    Math.min(maximumSeconds, Math.floor((room.expiresAt - Date.now()) / 1000)),
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const autoSubmittedRef = useRef(false);

  const currentQuestion = allQuestions[currentIdx];
  const answeredCount = allQuestions.filter((question) => {
    if (question.type === "trueFalse") {
      return (question.subQuestions ?? []).some((item) =>
        Boolean(answers[statementKey(question.id, item.label)]),
      );
    }
    return Boolean(answers[question.id]?.trim());
  }).length;

  const handleAnswer = (key: string, value: string) => {
    setAnswers((previous) => ({ ...previous, [key]: value }));
    setSubmitError("");
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || submitted) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await submitAnswers(room, answers);
      setResult(response.result);
      setReviewStatus(response.reviewStatus);
      setSubmitted(true);
      setShowConfirm(false);
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "Không thể nộp bài.");
      autoSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, room, submitted]);

  useEffect(() => {
    if (submitted) return;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted && !isSubmitting && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      void handleSubmit();
    }
  }, [handleSubmit, isSubmitting, submitted, timeLeft]);

  useEffect(() => {
    if (!submitted || !reviewStatus || !["pending_ai", "pending_teacher", "approved"].includes(reviewStatus)) {
      return;
    }
    const interval = window.setInterval(async () => {
      try {
        const response = await getStudentResult(room);
        setReviewStatus(response.reviewStatus);
        if (response.result) setResult(response.result);
      } catch {
        // Giữ màn hình chờ; học sinh có thể thử lại sau.
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [reviewStatus, room, submitted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  };

  if (submitted && result && reviewStatus && reviewStatus !== "not_required" && reviewStatus !== "published") {
    return (
      <PendingReviewScreen
        room={room}
        studentName={studentName}
        reviewStatus={reviewStatus}
        onFinish={onFinish}
      />
    );
  }

  if (submitted && result) {
    return <ResultScreen result={result} studentName={studentName} room={room} onFinish={onFinish} />;
  }

  if (!currentQuestion) {
    return <div className="grid min-h-screen place-items-center bg-[#071a33] text-white">Đề thi không có câu hỏi.</div>;
  }

  const urgent = timeLeft <= 300;
  const hasStandardOptions = Boolean(currentQuestion.options?.length);
  const needsWrittenAnswer = !hasStandardOptions && currentQuestion.type !== "trueFalse";

  return (
    <main className="flex min-h-screen flex-col bg-[#06172d]">
      <header className={`sticky top-0 z-40 border-b border-white/10 px-4 py-3 backdrop-blur-md ${urgent ? "bg-red-950/95" : "bg-[#071a33]/95"}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold uppercase text-slate-400">{room.config.general.subject} – {room.config.general.grade}</p>
            <p className="truncate text-sm font-bold text-white">{studentName}</p>
          </div>
          <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-base font-black ${urgent ? "animate-pulse bg-red-500 text-white" : "bg-white/10 text-white"}`} aria-label={`Thời gian còn lại ${formatTime(timeLeft)}`}>
            <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
          </div>
          <button type="button" onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-[#071a33] transition hover:bg-amber-300 active:scale-95">
            <Send className="h-3.5 w-3.5" /> Nộp bài
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-3xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(answeredCount / allQuestions.length) * 100}%` }} /></div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>Đã trả lời: {answeredCount}/{allQuestions.length}</span><span>Câu {currentIdx + 1}/{allQuestions.length}</span></div>
        </div>
      </header>

      <nav className="mx-auto w-full max-w-3xl px-4 pt-4" aria-label="Danh sách câu hỏi">
        <div className="flex flex-wrap gap-1.5">
          {allQuestions.map((question, index) => {
            const answered = question.type === "trueFalse"
              ? (question.subQuestions ?? []).some((item) => Boolean(answers[statementKey(question.id, item.label)]))
              : Boolean(answers[question.id]?.trim());
            return (
              <button key={question.id} type="button" onClick={() => setCurrentIdx(index)} aria-current={index === currentIdx ? "step" : undefined} className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition ${index === currentIdx ? "scale-105 bg-amber-400 text-[#071a33] ring-2 ring-amber-200" : answered ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300" : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                {String(question.questionNumber)}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        {submitError && <p role="alert" className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{submitError}</p>}
        <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 md:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-200">{currentQuestion.partTitle}</span>
            <span className="text-[11px] font-medium text-slate-400">{currentQuestion.points} điểm</span>
          </div>
          {currentQuestion.passage && <blockquote className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm italic leading-7 text-slate-300">{currentQuestion.passage}</blockquote>}
          <h1 className="mb-5 whitespace-pre-line text-base font-semibold leading-7 text-white md:text-lg"><span className="mr-2 font-black text-amber-300">Câu {currentQuestion.questionNumber}.</span>{currentQuestion.content}</h1>

          {hasStandardOptions && (
            <div className="space-y-2.5">
              {currentQuestion.options!.map((option) => {
                const selected = answers[currentQuestion.id] === option.key;
                return <button key={option.key} type="button" onClick={() => handleAnswer(currentQuestion.id, option.key)} aria-pressed={selected} className={`flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition active:scale-[0.99] ${selected ? "border-amber-400 bg-amber-400/15" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${selected ? "bg-amber-400 text-[#071a33]" : "bg-white/10 text-slate-300"}`}>{option.key}</span><span className="pt-0.5 text-sm font-medium leading-6 text-slate-100">{option.text}</span></button>;
              })}
            </div>
          )}

          {currentQuestion.type === "trueFalse" && currentQuestion.subQuestions && (
            <div className="space-y-3">
              {currentQuestion.subQuestions.map((statement) => {
                const key = statementKey(currentQuestion.id, statement.label);
                return <fieldset key={key} className="rounded-xl border border-white/10 bg-white/5 p-4"><legend className="sr-only">Chọn đúng hoặc sai cho ý {statement.label}</legend><p className="mb-3 text-sm font-medium leading-6 text-slate-200"><span className="mr-2 font-black text-amber-300">{statement.label}</span>{statement.text}</p><div className="flex gap-2">{["Đúng", "Sai"].map((choice) => <button key={choice} type="button" onClick={() => handleAnswer(key, choice)} aria-pressed={answers[key] === choice} className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${answers[key] === choice ? choice === "Đúng" ? "bg-emerald-500 text-white" : "bg-red-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>{choice}</button>)}</div></fieldset>;
              })}
            </div>
          )}

          {needsWrittenAnswer && (
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400" htmlFor={`answer-${currentQuestion.id}`}>
              {currentQuestion.type === "essay" || currentQuestion.type === "writing" ? "Bài làm" : "Đáp án / kết quả"}
              {currentQuestion.type === "essay" || currentQuestion.type === "writing" ? (
                <textarea id={`answer-${currentQuestion.id}`} value={answers[currentQuestion.id] ?? ""} onChange={(event) => handleAnswer(currentQuestion.id, event.target.value)} rows={8} placeholder="Nhập bài làm của em…" className="mt-2 w-full resize-y rounded-xl border-2 border-white/15 bg-white/10 px-4 py-3 text-sm font-medium normal-case leading-6 text-white outline-none placeholder:text-slate-500 focus:border-amber-400" />
              ) : (
                <input id={`answer-${currentQuestion.id}`} value={answers[currentQuestion.id] ?? ""} onChange={(event) => handleAnswer(currentQuestion.id, event.target.value)} placeholder="Nhập đáp án…" className="mt-2 w-full rounded-xl border-2 border-white/15 bg-white/10 px-4 py-3 text-center text-lg font-bold normal-case text-white outline-none placeholder:text-slate-500 focus:border-amber-400" />
              )}
            </label>
          )}
        </article>

        <div className="mt-4 flex justify-between gap-3">
          <button type="button" disabled={currentIdx === 0} onClick={() => setCurrentIdx((current) => current - 1)} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /> Trước</button>
          <button type="button" disabled={currentIdx === allQuestions.length - 1} onClick={() => setCurrentIdx((current) => current + 1)} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-30">Tiếp <ChevronRight className="h-4 w-4" /></button>
        </div>
      </section>

      {showConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="submit-title">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0c2945] p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-400" /><h2 id="submit-title" className="text-base font-black text-white">Xác nhận nộp bài?</h2></div>
            <p className="mb-1 text-sm text-slate-300">Em đã trả lời <strong className="text-white">{answeredCount}/{allQuestions.length} câu</strong>.</p>
            <p className="mb-5 text-xs leading-5 text-slate-400">Còn {allQuestions.length - answeredCount} câu chưa trả lời. Sau khi nộp, bài làm không thể sửa.</p>
            <div className="flex gap-2.5"><button type="button" onClick={() => setShowConfirm(false)} className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white hover:bg-white/20">Hủy</button><button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 text-sm font-black text-[#071a33] disabled:opacity-50">{isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{isSubmitting ? "Đang nộp…" : "Nộp bài"}</button></div>
          </div>
        </div>
      )}
    </main>
  );
};

function PendingReviewScreen({ room, studentName, reviewStatus, onFinish }: { room: OnlineRoom; studentName: string; reviewStatus: ReviewStatus; onFinish: () => void }) {
  const labels: Record<string, string> = {
    pending_ai: "Đang tạo gợi ý chấm theo rubric",
    pending_teacher: "Đang chờ giáo viên xác nhận điểm",
    approved: "Giáo viên đã duyệt, chờ công bố",
  };
  return <main className="grid min-h-screen place-items-center bg-[#06172d] p-4"><section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center text-white shadow-2xl"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-amber-400/15 text-amber-300"><Sparkles className="h-8 w-8" /></div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Đã nhận bài của {studentName}</p><h1 className="mt-3 text-2xl font-black">Bài tự luận cần giáo viên duyệt</h1><p className="mt-3 text-sm leading-6 text-slate-300">{labels[reviewStatus] ?? "Kết quả đang được xử lý"}. Trang này tự kiểm tra kết quả mới mỗi 5 giây.</p><div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100">AI chỉ đưa ra gợi ý. Điểm chỉ có hiệu lực sau khi giáo viên xác nhận và công bố.</div><p className="mt-5 text-xs text-slate-500">{room.config.general.subject} – {room.config.general.grade}</p><button type="button" onClick={onFinish} className="mt-6 rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold hover:bg-white/15">Thoát phòng thi</button></section></main>;
}

function ResultScreen({ result, studentName, room, onFinish }: { result: ExamResult; studentName: string; room: OnlineRoom; onFinish: () => void }) {
  const [count, setCount] = useState(0);
  const target = Number(result.earnedPoints.toFixed(1));
  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - started) / 1000, 1);
      setCount(Number((progress * target).toFixed(1)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const ratio = result.totalPoints > 0 ? target / result.totalPoints : 0;
  const grade = ratio >= 0.9 ? "Xuất sắc" : ratio >= 0.8 ? "Giỏi" : ratio >= 0.65 ? "Khá" : ratio >= 0.5 ? "Trung bình" : "Cần cố gắng";
  const color = ratio >= 0.8 ? "text-emerald-400" : ratio >= 0.65 ? "text-amber-300" : ratio >= 0.5 ? "text-orange-300" : "text-red-300";

  return <main className="min-h-screen bg-[#06172d] pb-10 text-white"><section className="border-b border-white/10 bg-gradient-to-br from-[#071a33] via-[#0c3152] to-[#071a33] px-6 py-10 text-center"><Trophy className="mx-auto mb-3 h-12 w-12 text-amber-400" /><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{studentName}</p><p className="mt-1 text-xs text-slate-400">{room.config.general.subject} – {room.config.general.grade}</p><div className="mt-4"><span className={`text-7xl font-black md:text-8xl ${color}`}>{count.toFixed(1)}</span><span className="text-2xl font-bold text-slate-500">/{result.totalPoints}</span></div><p className={`mt-2 text-lg font-black uppercase tracking-wider ${color}`}>{grade}</p><div className="mx-auto mt-5 grid max-w-xs grid-cols-2 gap-3"><div className="rounded-xl bg-white/5 p-3"><p className="text-[11px] font-bold text-slate-400">Tỷ lệ điểm</p><p className="text-xl font-black">{result.scorePercent ?? 0}%</p></div><div className="rounded-xl bg-white/5 p-3"><p className="text-[11px] font-bold text-slate-400">Tổng điểm</p><p className="text-xl font-black">{result.earnedPoints.toFixed(1)}/{result.totalPoints}</p></div></div></section><section className="mx-auto mt-6 w-full max-w-xl space-y-4 px-4"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-300" /><h2 className="text-sm font-bold">Phân tích theo phần</h2></div>{result.partResults.map((part) => <article key={part.partTitle} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-bold">{part.partTitle}</p><span className="text-xs font-bold text-slate-300">{part.earnedPoints.toFixed(1)}/{part.totalPoints} điểm</span></div><div className="flex flex-wrap gap-1.5">{part.questions.map((question) => <div key={question.questionId} title={`Câu ${question.questionNumber}: ${question.gradingStatus === "reviewed" ? "Đã duyệt" : question.isCorrect ? "Đúng" : "Sai"}`} className={`grid h-8 w-8 place-items-center rounded-lg border text-[10px] font-bold ${question.gradingStatus === "reviewed" ? "border-sky-500/30 bg-sky-500/20 text-sky-300" : question.isCorrect ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300" : question.studentAnswer === "" ? "border-white/10 bg-white/5 text-slate-500" : "border-red-500/30 bg-red-500/20 text-red-300"}`}>{String(question.questionNumber)}</div>)}</div></article>)}<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"><h3 className="border-b border-white/10 px-4 py-3 text-xs font-bold">Chi tiết từng câu</h3><div className="max-h-96 divide-y divide-white/5 overflow-y-auto">{result.partResults.flatMap((part) => part.questions).map((question) => <div key={question.questionId} className="flex items-start gap-3 px-4 py-3">{question.gradingStatus === "reviewed" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /> : question.isCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}<div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-200">Câu {question.questionNumber}: {question.questionExcerpt}</p><p className="mt-1 text-[11px] text-slate-400">Bài làm: <span className="font-semibold text-slate-300">{question.studentAnswer || "(bỏ trống)"}</span>{question.correctAnswer && <> · Đáp án: <span className="font-semibold text-slate-300">{question.correctAnswer}</span></>}</p>{question.teacherComment && <p className="mt-1 text-[11px] text-sky-300">Nhận xét: {question.teacherComment}</p>}</div><span className="shrink-0 text-xs font-black text-amber-300">+{question.earnedPoints.toFixed(2)}</span></div>)}</div></div><button type="button" onClick={onFinish} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-sm font-black text-[#071a33] hover:bg-amber-300"><RotateCcw className="h-4 w-4" /> Thi lại / Thoát</button></section></main>;
}
