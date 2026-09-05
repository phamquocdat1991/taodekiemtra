import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { OnlineRoom } from "../types";
import { closeRoom } from "../services/roomService";
import {
  Clock,
  Copy,
  CheckCircle2,
  Trash2,
  Users,
  QrCode,
  ExternalLink,
  X,
  BarChart3,
} from "lucide-react";

interface ExamRoomCardProps {
  room: OnlineRoom;
  onClose: () => void;
  onOpenDashboard: () => void;
}

function QRCodeDisplay({ value }: { value: string }) {
  return (
    <div role="img" aria-label="Mã QR vào phòng thi" className="rounded-2xl bg-white p-3 shadow-lg">
      <QRCodeSVG value={value} size={136} bgColor="#ffffff" fgColor="#071a33" level="M" />
    </div>
  );
}

export const ExamRoomCard: React.FC<ExamRoomCardProps> = ({ room, onClose, onOpenDashboard }) => {
  const [copied, setCopied] = useState<"pin" | "link" | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<any>(null);

  const appUrl = window.location.href.split("?")[0];
  const studentLink = `${appUrl}?pin=${room.pin}`;

  useEffect(() => {
    const update = () => {
      const remaining = room.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(remaining);
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [room.expiresAt]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(room.pin);
    setCopied("pin");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentLink);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClose = async () => {
    if (!window.confirm("Đóng phòng thi? Học sinh mới sẽ không thể tham gia, nhưng kết quả đã nộp vẫn được lưu.")) return;
    setIsClosing(true);
    setRoomError("");
    try {
      await closeRoom(room.pin);
      onClose();
    } catch (cause) {
      setRoomError(cause instanceof Error ? cause.message : "Không thể đóng phòng thi.");
    } finally {
      setIsClosing(false);
    }
  };

  const pctLeft = timeLeft / ((room.expiresAt - room.createdAt)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#071a33] via-[#0c3152] to-[#06172d] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Phòng thi trực tuyến</p>
              <p className="text-white font-black text-sm">{room.config.general.subject} – {room.config.general.grade}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ thông tin phòng"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PIN */}
        <div className="flex flex-col items-center py-6 px-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">Mã PIN phòng thi</p>
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-5xl md:text-6xl text-white tracking-[0.3em] select-all">
              {room.pin}
            </span>
            <button
              onClick={handleCopyPin}
              aria-label="Sao chép mã PIN"
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            >
              {copied === "pin" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span className="text-[9px] font-bold">{copied === "pin" ? "Đã chép" : "CHÉP"}</span>
            </button>
          </div>

          {/* Countdown */}
          <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full ${isExpired ? "bg-red-500/30 text-red-300" : timeLeft < 300000 ? "bg-amber-500/30 text-amber-300" : "bg-white/10 text-white/70"}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">
              {isExpired ? "Hết hạn" : `Còn lại: ${formatTime(timeLeft)}`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft < 300000 ? "bg-amber-400" : "bg-emerald-400"}`}
              style={{ width: `${Math.max(0, pctLeft)}%` }}
            />
          </div>
        </div>

        {/* QR + Info */}
        <div className="flex flex-col sm:flex-row items-center gap-5 px-5 pb-5">
          <div className="flex flex-col items-center gap-2">
            <QRCodeDisplay value={studentLink} />
            <p className="text-white/40 text-[10px] font-bold flex items-center gap-1">
              <QrCode className="h-3 w-3" /> Học sinh quét mã QR
            </p>
          </div>

          <div className="flex-1 space-y-3">
            {/* Exam info */}
            <div className="bg-white/5 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Thời gian thi</span>
                <span className="text-white font-bold">{room.config.general.duration} phút</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Tổng câu hỏi</span>
                <span className="text-white font-bold">
                  {room.exam.parts.reduce((s, p) => s + p.questions.length, 0)} câu
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Tổng điểm</span>
                <span className="text-white font-bold">{room.exam.totalPoints} điểm</span>
              </div>
            </div>

            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95"
            >
              {copied === "link" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {copied === "link" ? "Đã sao chép liên kết" : "SAO CHÉP LINK HỌC SINH"}
            </button>

            {/* Dashboard button */}
            <button
              onClick={onOpenDashboard}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/20 py-2.5 text-xs font-bold text-sky-200 transition-all hover:bg-sky-500/30 active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              XEM BẢNG ĐIỀU KHIỂN LỚP
            </button>

            {/* Close room button */}
            <button
              onClick={() => void handleClose()}
              disabled={isClosing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/20 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              {isClosing ? "ĐANG ĐÓNG…" : "ĐÓNG PHÒNG THI"}
            </button>
          </div>
        </div>
        {roomError && <p role="alert" className="mx-5 mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{roomError}</p>}
      </div>
    </div>
  );
};
