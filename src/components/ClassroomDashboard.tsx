import React, { useState, useEffect, useCallback } from "react";
import { getRoomResults, generateRemedialTest, ClassroomResults, RemedialTest } from "../services/roomService";
import { getCustomApiKey } from "../services/geminiService";
import {
  BarChart3, Users, Trophy, AlertTriangle, RefreshCw,
  Brain, CheckCircle2, XCircle, Clock, Zap, X, ChevronDown, ChevronUp,
} from "lucide-react";

interface ClassroomDashboardProps {
  pin: string;
  onClose: () => void;
}

export const ClassroomDashboard: React.FC<ClassroomDashboardProps> = ({ pin, onClose }) => {
  const [data, setData] = useState<ClassroomResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [remedial, setRemedial] = useState<RemedialTest | null>(null);
  const [remedialLoading, setRemedialLoading] = useState(false);
  const [remedialError, setRemedialError] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const results = await getRoomResults(pin);
    if (results) { setData(results); setLastRefresh(new Date()); }
    setLoading(false);
  }, [pin]);

  // Poll every 5 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleGenerateRemedial = async () => {
    setRemedialLoading(true);
    setRemedialError("");
    try {
      const key = getCustomApiKey();
      const result = await generateRemedialTest(pin, key || "");
      setRemedial(result);
    } catch (err: any) {
      setRemedialError(err.message || "Loi sinh de luyen. Thu lai sau.");
    } finally {
      setRemedialLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-white font-bold">Dang tai du lieu lop hoc...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#1e1b4b] border border-red-500/30 rounded-2xl p-8 text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold mb-4">Khong the tai du lieu. Server co the khong hoat dong.</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-sm">Dong</button>
        </div>
      </div>
    );
  }

  const avgScore = data.submissions.length > 0
    ? data.submissions.reduce((s, sub) => s + sub.earnedPoints, 0) / data.submissions.length
    : 0;

  const totalPoints = data.submissions[0]?.totalPoints || 10;

  // Score histogram: 0-2, 2-4, 4-6, 6-8, 8-10
  const buckets = [0, 0, 0, 0, 0];
  for (const s of data.submissions) {
    const idx = Math.min(4, Math.floor((s.earnedPoints / totalPoints) * 5));
    buckets[idx]++;
  }
  const maxBucket = Math.max(...buckets, 1);

  const gradeLabel = (pts: number) => {
    const pct = pts / totalPoints;
    if (pct >= 0.9) return { label: "Xuat sac", color: "text-emerald-400" };
    if (pct >= 0.8) return { label: "Gioi", color: "text-green-400" };
    if (pct >= 0.65) return { label: "Kha", color: "text-amber-400" };
    if (pct >= 0.5) return { label: "TB", color: "text-orange-400" };
    return { label: "Yeu", color: "text-red-400" };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-gradient-to-b from-[#1e1b4b] to-[#0f0c29] border border-white/10 rounded-3xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-base">Dashboard Lop Hoc</h2>
              <p className="text-white/40 text-xs">{data.roomInfo.subject} – {data.roomInfo.grade} | PIN: <span className="font-mono font-bold text-violet-300">{pin}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-white/30 text-[11px]">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Tu dong cap nhat
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Users className="w-5 h-5 text-violet-400 mx-auto mb-1" />
              <p className="text-white font-black text-2xl">{data.submissionCount}</p>
              <p className="text-white/40 text-[11px] font-bold">Da nop bai</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-white font-black text-2xl">{avgScore.toFixed(1)}</p>
              <p className="text-white/40 text-[11px] font-bold">Diem TB</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-white font-black text-sm">{lastRefresh.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
              <p className="text-white/40 text-[11px] font-bold">Cap nhat luc</p>
            </div>
          </div>

          {/* Histogram */}
          {data.submissionCount > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-bold text-sm">Pho diem lop</h3>
              </div>
              <div className="flex items-end gap-2 h-24">
                {buckets.map((count, i) => {
                  const labels = ["0–2", "2–4", "4–6", "6–8", "8–10"];
                  const colors = ["bg-red-500", "bg-orange-500", "bg-amber-400", "bg-lime-400", "bg-emerald-500"];
                  const heightPct = (count / maxBucket) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-white/50 text-[10px] font-bold">{count > 0 ? count : ""}</span>
                      <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${Math.max(4, heightPct)}%`, backgroundColor: "transparent" }}>
                        <div className={`w-full h-full rounded-t-lg ${colors[i]}`} style={{ height: `${Math.max(4, heightPct)}%` }} />
                      </div>
                      <span className="text-white/40 text-[10px]">{labels[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Wrong Questions */}
          {data.topWrongQuestions.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-white font-bold text-sm">Cau hoi nhieu hoc sinh sai nhat</h3>
              </div>
              <div className="space-y-2">
                {data.topWrongQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-red-400 font-black text-xs w-12 shrink-0">Cau {q.questionNumber}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${q.wrongPercent}%` }} />
                    </div>
                    <span className="text-red-300 text-xs font-bold w-12 text-right shrink-0">{q.wrongPercent}% sai</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student List */}
          {data.submissions.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" /> Danh sach hoc sinh da nop bai ({data.submissionCount})
                </h3>
              </div>
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                {data.submissions.sort((a, b) => b.earnedPoints - a.earnedPoints).map((sub, i) => {
                  const g = gradeLabel(sub.earnedPoints);
                  const isExpanded = expandedStudent === sub.studentName;
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedStudent(isExpanded ? null : sub.studentName)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
                      >
                        <span className="text-white/30 text-xs w-5 text-center font-bold">{i + 1}</span>
                        <span className="text-white font-medium text-sm flex-1 truncate">{sub.studentName}</span>
                        <span className={`text-xs font-bold ${g.color}`}>{g.label}</span>
                        <span className="text-white font-black text-sm w-16 text-right">{sub.earnedPoints.toFixed(1)}/{sub.totalPoints}d</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 bg-black/20">
                          <div className="flex flex-wrap gap-1.5">
                            {sub.partResults.flatMap((pr: any) =>
                              pr.questions.map((q: any, qi: number) => (
                                <div
                                  key={qi}
                                  title={`Cau ${q.questionNumber}: ${q.isCorrect ? "Dung" : "Sai"} | ${q.studentAnswer || "(bo)"} → ${q.correctAnswer}`}
                                  className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center ${q.isCorrect ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
                                >
                                  {String(q.questionNumber)}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remedial Test Button */}
          {data.submissionCount > 0 && !remedial && (
            <button
              onClick={handleGenerateRemedial}
              disabled={remedialLoading}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-black text-sm disabled:opacity-60 transition-all active:scale-95 shadow-lg shadow-purple-900/40"
            >
              {remedialLoading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> AI dang phan tich va sinh de luyen...</>
                : <><Brain className="w-4 h-4" /> SINH DE LUYEN CUNG CO AI<Zap className="w-4 h-4 text-amber-300" /></>}
            </button>
          )}

          {remedialError && (
            <p className="text-red-300 text-xs font-medium text-center">{remedialError}</p>
          )}

          {/* Remedial Test Result */}
          {remedial && <RemedialTestDisplay remedial={remedial} />}

          {data.submissionCount === 0 && (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Chua co hoc sinh nop bai.</p>
              <p className="text-white/20 text-xs mt-1">Trang se tu dong cap nhat moi 5 giay.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function RemedialTestDisplay({ remedial }: { remedial: RemedialTest }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? remedial.questions : remedial.questions.slice(0, 3);

  return (
    <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-violet-400" />
        <h3 className="text-white font-black text-sm">{remedial.title}</h3>
      </div>
      {remedial.targetedWeaknesses.length > 0 && (
        <div className="mb-4 space-y-1">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Diem yeu duoc nham toi:</p>
          {remedial.targetedWeaknesses.map((w, i) => (
            <p key={i} className="text-violet-300 text-xs font-medium flex items-start gap-1.5">
              <span className="text-violet-400 font-black shrink-0">•</span>{w}
            </p>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {displayed.map((q, i) => (
          <div key={i} className="bg-black/20 rounded-xl p-4">
            <p className="text-white font-semibold text-sm mb-3">
              <span className="text-violet-300 font-black mr-2">Cau {q.number}.</span>{q.content}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
              {Object.entries(q.options).map(([k, v]) => (
                <div key={k} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-medium ${q.answer === k ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-white/5 text-white/60"}`}>
                  <span className={`font-black shrink-0 ${q.answer === k ? "text-emerald-400" : "text-white/40"}`}>{k}.</span>{v}
                </div>
              ))}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <p className="text-amber-300 text-[11px] font-bold mb-0.5">Giai thich:</p>
              <p className="text-amber-200/80 text-xs">{q.explanation}</p>
            </div>
          </div>
        ))}
      </div>
      {remedial.questions.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold transition-all"
        >
          {showAll ? "Thu gon" : `Xem them ${remedial.questions.length - 3} cau...`}
        </button>
      )}
    </div>
  );
}
