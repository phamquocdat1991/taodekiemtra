import React, { useState, useEffect, useRef, useCallback } from "react";
import { OnlineRoom, StudentAnswerMap, ExamResult, ExamQuestion } from "../types";
import { gradeExam, submitAnswers } from "../services/roomService";
import { MathRenderer } from "./MathRenderer";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  BarChart3,
  RotateCcw,
  Maximize2,
  Minimize2,
  ShieldAlert,
} from "lucide-react";

interface OnlineExamRoomProps {
  room: OnlineRoom;
  studentName: string;
  onFinish: () => void;
}

export const OnlineExamRoom: React.FC<OnlineExamRoomProps> = ({
  room,
  studentName,
  onFinish,
}) => {
  const allQuestions = room.exam.parts.flatMap((p) =>
    p.questions.map((q) => ({ ...q, partTitle: p.partTitle }))
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(room.config.general.duration * 60);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<any>(null);

  // Anti-Cheat Monitoring
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for tab switches or minimizing
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);
          return next;
        });
      }
    };

    const handleBlur = () => {
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        setShowTabWarning(true);
        return next;
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const currentQ = allQuestions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleAnswer = (qNum: string | number, value: string) => {
    setAnswers((prev) => ({ ...prev, [String(qNum)]: value }));
  };

  const handleSubmit = useCallback(async (auto = false) => {
    clearInterval(timerRef.current);
    setIsSubmitting(true);
    let r = await submitAnswers(room.pin, studentName, answers, tabSwitchCount);
    if (!r) {
      // Fallback local grade if server fails
      r = gradeExam(room, answers);
    }
    setResult(r);
    setSubmitted(true);
    setIsSubmitting(false);
    setShowConfirm(false);
  }, [room, answers, studentName, tabSwitchCount]);

  const isUrgent = timeLeft <= 300; // 5 min

  if (submitted && result) {
    return <ResultScreen result={result} studentName={studentName} room={room} onFinish={onFinish} tabSwitchCount={tabSwitchCount} />;
  }

  return (
    <div
      className="min-h-screen bg-[#0f0c29] flex flex-col select-none"
      onCopy={(e) => {
        e.preventDefault();
        alert("Nội quy thi: Thầy/Cô không cho phép sao chép nội dung bài thi!");
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Sticky Header */}
      <div className={`sticky top-0 z-40 ${isUrgent ? "bg-red-900/90" : "bg-[#1e1b4b]/95"} backdrop-blur-md border-b border-white/10 px-4 py-3`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-[11px] font-bold uppercase truncate">{room.config.general.subject} – {room.config.general.grade}</p>
            <p className="text-white font-bold text-sm truncate">{studentName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-base ${isUrgent ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-white"}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-xs font-black transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              Nộp bài
            </button>
          </div>
        </div>

        {/* Anti-cheat Warning Banner */}
        {tabSwitchCount > 0 && (
          <div className="max-w-2xl mx-auto mt-2 bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-1.5 text-center text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Cảnh báo: Bạn đã rời khỏi màn hình làm bài {tabSwitchCount} lần! Giám thị sẽ được thông báo.</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${(answeredCount / allQuestions.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>Đã làm: {answeredCount}/{allQuestions.length} câu</span>
            <span>Câu {currentIdx + 1}/{allQuestions.length}</span>
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {allQuestions.map((q, idx) => {
            const isAnswered = Boolean(answers[String(q.questionNumber)]);
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-violet-500 text-white ring-2 ring-violet-300 scale-110"
                    : isAnswered
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                }`}
              >
                {String(q.questionNumber)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          {/* Part label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[11px] font-bold border border-violet-500/20">
              {(currentQ as any).partTitle}
            </span>
            <span className="text-white/30 text-[11px] font-medium">{currentQ.points} điểm</span>
          </div>

          {/* Passage if any */}
          {currentQ.passage && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-white/70 text-xs leading-relaxed italic">
              <MathRenderer text={currentQ.passage} />
            </div>
          )}

          {/* Question Content */}
          <div className="text-white font-semibold text-sm md:text-base leading-relaxed mb-5">
            <MathRenderer text={currentQ.content} />
          </div>

          {/* ANSWER UI by type */}
          {currentQ.type === "multipleChoice" && currentQ.options && (
            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const selected = answers[String(currentQ.questionNumber)] === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswer(currentQ.questionNumber, opt.key)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                      selected
                        ? "border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-900/20"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${selected ? "bg-violet-500 text-white" : "bg-white/10 text-white/60"}`}>
                      {opt.key}
                    </span>
                    <span className={`text-sm font-medium leading-relaxed ${selected ? "text-white" : "text-white/70"}`}>
                      <MathRenderer text={opt.text} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === "trueFalse" && currentQ.subQuestions && (
            <div className="space-y-2.5">
              {currentQ.subQuestions.map((sq) => {
                const cleanLabel = sq.label.replace(/[^a-z0-9]/gi, "").toLowerCase();
                const key1 = `${currentQ.questionNumber}:${cleanLabel}`;
                const key2 = `${currentQ.questionNumber}_${sq.label}`;
                const val = answers[key1] || answers[key2];

                return (
                  <div key={sq.label} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                    <div className="text-white/80 text-sm mb-3 font-medium">
                      <span className="text-violet-300 font-black mr-2">{sq.label}.</span>
                      <MathRenderer text={sq.text} />
                    </div>
                    <div className="flex gap-2">
                      {["ĐÚNG", "SAI"].map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => {
                            handleAnswer(key1, choice);
                            handleAnswer(key2, choice);
                          }}
                          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                            val === choice
                              ? choice === "ĐÚNG"
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                : "bg-red-500 text-white shadow-md shadow-red-500/30"
                              : "bg-white/10 text-white/50 hover:bg-white/20"
                          }`}
                        >
                          {choice === "ĐÚNG" ? "✓ ĐÚNG" : "✗ SAI"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(currentQ.type === "shortAnswer" || currentQ.type === "essay") && (
            <div className="space-y-2">
              <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-1">
                Điền đáp số / câu trả lời ngắn:
              </label>
              <input
                type="text"
                value={answers[String(currentQ.questionNumber)] || ""}
                onChange={(e) => handleAnswer(currentQ.questionNumber, e.target.value)}
                placeholder="VD: 15.5 hoặc 3/4 hoặc đáp án số..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 focus:border-violet-400 text-white font-bold text-base text-center outline-none placeholder:text-white/20 transition-all font-mono"
              />
            </div>
          )}
        </div>

        {/* Prev / Next */}
        <div className="flex justify-between mt-4 gap-3">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((p) => p - 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Truoc
          </button>
          <button
            disabled={currentIdx === allQuestions.length - 1}
            onClick={() => setCurrentIdx((p) => p + 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold disabled:opacity-30 transition-all"
          >
            Tiep
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirm Submit Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-white font-black text-base">Xac nhan nop bai?</h3>
            </div>
            <p className="text-white/60 text-sm mb-1">
              Ban da tra loi: <strong className="text-white">{answeredCount}/{allQuestions.length} cau</strong>
            </p>
            <p className="text-white/40 text-xs mb-5">
              Con {allQuestions.length - answeredCount} cau chua tra loi. Sau khi nop ban khong the sua.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
              >
                Huy
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Dang nop bai..." : "Nop bai ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Result Screen Component
function ResultScreen({
  result,
  studentName,
  room,
  onFinish,
  tabSwitchCount = 0,
}: {
  result: ExamResult;
  studentName: string;
  room: OnlineRoom;
  onFinish: () => void;
  tabSwitchCount?: number;
}) {
  const [count, setCount] = useState(0);
  const target = Number(result.earnedPoints.toFixed(1));

  useEffect(() => {
    let frame: any;
    const start = performance.now();
    const duration = 1500;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setCount(Number((t * target).toFixed(1)));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const grade = target >= 9 ? "Xuất sắc" : target >= 8 ? "Giỏi" : target >= 6.5 ? "Khá" : target >= 5 ? "Trung bình" : "Cần cố gắng";
  const gradeColor = target >= 8 ? "text-emerald-400" : target >= 6.5 ? "text-amber-400" : target >= 5 ? "text-orange-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#0f0c29] flex flex-col items-center pb-10">
      {/* Top score card */}
      <div className="w-full bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] px-6 py-10 flex flex-col items-center border-b border-white/10">
        <Trophy className="w-12 h-12 text-amber-400 mb-3" />
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{studentName}</p>
        <p className="text-white/50 text-xs mb-4">{room.config.general.subject} – {room.config.general.grade}</p>

        <div className="text-center mb-2">
          <span className={`font-black text-7xl md:text-8xl ${gradeColor}`}>
            {count.toFixed(1)}
          </span>
          <span className="text-white/40 font-bold text-2xl">/10</span>
        </div>

        <span className={`text-lg font-black uppercase tracking-wider ${gradeColor}`}>{grade}</span>

        <div className="mt-5 grid grid-cols-3 gap-2.5 w-full max-w-sm">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-white/50 text-[11px] font-bold">Tỷ lệ đúng</p>
            <p className="text-white font-black text-lg">{result.scorePercent}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-white/50 text-[11px] font-bold">Tổng điểm</p>
            <p className="text-white font-black text-lg">{result.earnedPoints.toFixed(1)}/{result.totalPoints}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-white/50 text-[11px] font-bold">Rời màn hình</p>
            <p className={`font-black text-lg ${tabSwitchCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {tabSwitchCount} lần
            </p>
          </div>
        </div>
      </div>

      {/* Part breakdown */}
      <div className="w-full max-w-lg px-4 mt-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h2 className="text-white font-bold text-sm">Phan tich theo phan</h2>
        </div>

        {result.partResults.map((pr, pIdx) => {
          const pct = pr.totalPoints > 0 ? (pr.earnedPoints / pr.totalPoints) * 100 : 0;
          return (
            <div key={pIdx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-white font-bold text-xs">{pr.partTitle}</p>
                <span className="text-white/60 text-xs font-bold">{pr.earnedPoints.toFixed(1)}/{pr.totalPoints}d</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {/* Question results */}
              <div className="flex flex-wrap gap-1.5">
                {pr.questions.map((qr, qIdx) => (
                  <div
                    key={qIdx}
                    title={`Cau ${qr.questionNumber}: ${qr.isCorrect ? "Dung" : "Sai"} | Dap an: ${qr.correctAnswer}`}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-default ${
                      qr.isCorrect
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : qr.studentAnswer === ""
                        ? "bg-white/5 text-white/30 border border-white/10"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {String(qr.questionNumber)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Detail table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-bold text-xs">Chi tiet tung cau</h3>
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {result.partResults.flatMap((pr) =>
              pr.questions.map((qr, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`shrink-0 ${qr.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                    {qr.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs font-medium truncate">
                      Cau {qr.questionNumber}: {qr.questionExcerpt}
                    </p>
                    <p className="text-white/40 text-[11px]">
                      Ban chon: <span className="text-white/60 font-bold">{qr.studentAnswer || "(bo trong)"}</span>
                      {" | "}
                      Dap an: <span className={`font-bold ${qr.isCorrect ? "text-emerald-400" : "text-red-400"}`}>{qr.correctAnswer}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-black ${qr.isCorrect ? "text-emerald-400" : "text-white/30"}`}>
                    +{qr.earnedPoints.toFixed(2)}d
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onFinish}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-sm mt-2 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Thi lai / Thoat
        </button>
      </div>
    </div>
  );
}
