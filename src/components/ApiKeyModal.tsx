import React, { useState, useEffect } from "react";
import { Key, X, Check, ExternalLink, ShieldCheck, Trash2 } from "lucide-react";
import { getCustomApiKey, setCustomApiKey } from "../services/geminiService";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (hasKey: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getCustomApiKey() || "");
      setShowSavedMsg(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setCustomApiKey(apiKey);
    setShowSavedMsg(true);
    onKeySaved(Boolean(apiKey.trim()));
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKey("");
    setCustomApiKey("");
    onKeySaved(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e2e8f0] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#f2a900] flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#071a33]">
              Nạp API Key Gemini
            </h3>
            <p className="text-xs text-stone-500">
              Tùy chọn sử dụng API Key riêng của Thầy/Cô
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-stone-700 space-y-2 mb-4 leading-relaxed font-medium">
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Mặc định hệ thống đã có sẵn kết nối AI để tạo đề. Nếu muốn tăng hạn ngạch (quota) tốc độ cao, Thầy/Cô có thể dán API Key cá nhân từ Google AI Studio.
            </span>
          </p>
          <p className="text-[11px] text-stone-500">
            * Khóa API chỉ được lưu trong phiên trình duyệt hiện tại (Session) và không lưu trên máy chủ công cộng.
          </p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            GEMINI API KEY (AIzaSy...)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fafc]/60 border border-[#e2e8f0] focus:bg-white focus:border-[#f2a900] focus:ring-2 focus:ring-orange-100 text-sm font-mono text-[#071a33] outline-none transition-all"
          />
        </div>

        {/* Link to Google AI Studio */}
        <div className="mb-6 flex items-center justify-between text-xs">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f2a900] hover:underline font-bold flex items-center gap-1"
          >
            <span>Lấy khóa API miễn phí tại Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#e2e8f0]">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa khóa</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#f2a900] hover:bg-[#d96408] text-white transition-all shadow-sm cursor-pointer active:scale-95"
            >
              {showSavedMsg ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã lưu!</span>
                </>
              ) : (
                <span>Lưu khóa API</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
