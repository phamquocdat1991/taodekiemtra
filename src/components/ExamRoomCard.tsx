import React, { useState, useEffect, useRef } from "react";
import { OnlineRoom } from "../types";
import { deleteRoom } from "../services/roomService";
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

// Simple inline QR code using a public API (no extra deps)
function QRCodeDisplay({ value }: { value: string }) {
  const encoded = encodeURIComponent(value);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=1e1b4b&color=ffffff&qzone=1`;
  return (
    <img
      src={src}
      alt="QR Code phong thi"
      className="w-40 h-40 rounded-2xl shadow-lg"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export const ExamRoomCard: React.FC<ExamRoomCardProps> = ({ room, onClose, onOpenDashboard }) => {
  const [copied, setCopied] = useState<"pin" | "link" | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
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

  const handleClose = () => {
    deleteRoom(room.pin);
    onClose();
  };

  const pctLeft = timeLeft / ((room.expiresAt - room.createdAt)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Phong Thi Truc Tuyen</p>
              <p className="text-white font-black text-sm">{room.config.general.subject} – {room.config.general.grade}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PIN */}
        <div className="flex flex-col items-center py-6 px-5">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Ma PIN phong thi</p>
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-5xl md:text-6xl text-white tracking-[0.3em] select-all">
              {room.pin}
            </span>
            <button
              onClick={handleCopyPin}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            >
              {copied === "pin" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span className="text-[9px] font-bold">{copied === "pin" ? "Đa copy" : "COPY"}</span>
            </button>
          </div>

          {/* Countdown */}
          <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full ${isExpired ? "bg-red-500/30 text-red-300" : timeLeft < 300000 ? "bg-amber-500/30 text-amber-300" : "bg-white/10 text-white/70"}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">
              {isExpired ? "Het han" : `Con lai: ${formatTime(timeLeft)}`}
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
              <QrCode className="w-3 h-3" /> Hoc sinh quet ma QR
            </p>
          </div>

          <div className="flex-1 space-y-3">
            {/* Exam info */}
            <div className="bg-white/5 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Thoi gian thi</span>
                <span className="text-white font-bold">{room.config.general.duration} phut</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Tong cau hoi</span>
                <span className="text-white font-bold">
                  {room.exam.parts.reduce((s, p) => s + p.questions.length, 0)} cau
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50 font-medium">Tong diem</span>
                <span className="text-white font-bold">{room.exam.totalPoints} diem</span>
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
              {copied === "link" ? "Da copy link!" : "COPY LINK HOC SINH"}
            </button>

            {/* Dashboard button */}
            <button
              onClick={onOpenDashboard}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-bold border border-violet-500/30 transition-all active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              XEM DASHBOARD LOP
            </button>

            {/* Close room button */}
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/20 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              DONG PHONG THI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
