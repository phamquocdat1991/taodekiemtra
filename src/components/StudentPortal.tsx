import React, { useState, useRef, useEffect } from "react";
import { OnlineRoom } from "../types";
import { getRoom, joinRoom } from "../services/roomService";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Hash,
  AlertCircle,
  PlayCircle,
  Sparkles,
} from "lucide-react";

interface StudentPortalProps {
  initialPin?: string;
  onBack: () => void;
  onStartExam: (room: OnlineRoom, name: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  initialPin = "",
  onBack,
  onStartExam,
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string>("");
  const [foundRoom, setFoundRoom] = useState<OnlineRoom | null>(null);
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-fill if initialPin provided via URL
  useEffect(() => {
    if (initialPin && initialPin.length === 6) {
      const digits = initialPin.toUpperCase().split("").slice(0, 6);
      setPinDigits(digits);
      handleLookup(initialPin.toUpperCase());
    }
  }, [initialPin]);

  const fullPin = pinDigits.join("").toUpperCase();

  const handleDigitChange = (idx: number, val: string) => {
    const char = val.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(-1);
    const newDigits = [...pinDigits];
    newDigits[idx] = char;
    setPinDigits(newDigits);
    setError("");
    setFoundRoom(null);

    if (char && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    const pin = newDigits.join("");
    if (pin.length === 6) {
      handleLookup(pin);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pinDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleLookup = async (pin: string) => {
    setIsLoading(true);
    const room = await getRoom(pin);
    setIsLoading(false);
    if (!room) {
      setError("Không tìm thấy phòng thi. Vui lòng kiểm tra lại mã PIN.");
      setFoundRoom(null);
    } else {
      setFoundRoom(room);
      setError("");
    }
  };

  const handleStart = async () => {
    if (!foundRoom) return;
    if (!studentName.trim()) {
      setError("Vui lòng nhập họ tên trước khi bắt đầu làm bài.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const joinedRoom = await joinRoom(foundRoom.pin, studentName.trim());
      onStartExam(joinedRoom, studentName.trim());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể bắt đầu bài thi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#06172d] via-[#0c3152] to-[#071a33] p-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Giáo viên
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 shadow-xl shadow-amber-950/30">
            <Sparkles className="h-8 w-8 text-[#071a33]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            PHÒNG THI TRỰC TUYẾN
          </h1>
          <p className="text-white/50 text-sm font-medium mt-1">
            Nhập mã PIN để vào phòng thi
          </p>
        </div>

        {/* PIN Input Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <label className="block text-white/60 text-xs font-bold uppercase tracking-widest mb-4 text-center">
            Mã PIN (6 ký tự)
          </label>

          {/* OTP-style inputs */}
          <div className="flex justify-center gap-2.5 mb-6">
            {Array(6).fill(0).map((_, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                aria-label={`Ký tự PIN ${idx + 1}`}
                maxLength={1}
                value={pinDigits[idx]}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-14 md:w-13 md:h-16 text-center font-mono font-black text-xl md:text-2xl rounded-xl border-2 bg-white/10 text-white outline-none transition-all duration-200 ${
                  pinDigits[idx]
                    ? foundRoom
                      ? "border-emerald-400 bg-emerald-500/20"
                      : error
                      ? "border-red-400 bg-red-500/10"
                      : "border-amber-400 bg-amber-500/20"
                    : "border-white/20 focus:border-amber-400"
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {isLoading && (
            <div className="flex justify-center my-4">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-center gap-2 text-red-300 text-xs font-medium mb-4 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Room Info Preview */}
          {foundRoom && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <BookOpen className="w-4 h-4" />
                <span className="font-bold text-sm">{foundRoom.config.general.subject} – {foundRoom.config.general.grade}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-white/60">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{foundRoom.config.general.duration} phút</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <Hash className="w-3.5 h-3.5 text-blue-400" />
                  <span>{foundRoom.exam.parts.reduce((s, p) => s + p.questions.length, 0)} câu</span>
                </div>
              </div>

              {/* Student name input */}
              <div>
                <label htmlFor="student-name" className="block text-white/50 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  Họ và tên học sinh
                </label>
                <input
                  type="text"
                  id="student-name"
                  autoComplete="name"
                  placeholder="Nguyễn Văn An"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setError("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 focus:border-violet-400 text-white font-medium text-sm outline-none placeholder:text-white/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            disabled={!foundRoom || !studentName.trim() || isLoading}
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-amber-400 py-3.5 text-sm font-black text-[#071a33] shadow-lg shadow-amber-950/30 transition-all hover:bg-amber-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlayCircle className="w-5 h-5" />
            {isLoading ? "ĐANG KẾT NỐI…" : "BẮT ĐẦU LÀM BÀI"}
          </button>

          <p className="text-center text-white/30 text-[11px] font-medium mt-4">
            Hệ thống chạy trực tiếp trên trình duyệt, không cần cài đặt
          </p>
        </div>
      </div>
    </div>
  );
};
