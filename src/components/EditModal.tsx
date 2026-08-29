import React, { useState, useEffect } from "react";
import { WorkflowStep } from "../types";
import { Edit3, X, Save, AlertCircle, Check } from "lucide-react";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: WorkflowStep;
  data: any;
  onSave: (step: WorkflowStep, updatedData: any) => void;
}

const stepTitles: Record<WorkflowStep, string> = {
  1: "Chỉnh sửa Khung Ma Trận",
  2: "Chỉnh sửa Bản Đặc Tả",
  3: "Chỉnh sửa Đề Thi",
  4: "Chỉnh sửa Đáp Án & Biểu Điểm",
  5: "Chỉnh sửa Hướng Dẫn Giải Chi Tiết",
  6: "Tổng Hợp",
};

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  step,
  data,
  onSave,
}) => {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && data) {
      setJsonText(JSON.stringify(data, null, 2));
      setError(null);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onSave(step, parsed);
      onClose();
    } catch (e) {
      setError("Cú pháp JSON không hợp lệ: " + (e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 md:p-8 shadow-xl border border-[#EFE7DF] relative flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-[#EFE7DF]">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F5730B] flex items-center justify-center font-bold">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#431805]">
              {stepTitles[step] || "Chỉnh sửa nội dung"}
            </h3>
            <p className="text-xs text-stone-500">
              Chỉnh sửa trực tiếp dữ liệu câu hỏi, nội dung và điểm số
            </p>
          </div>
        </div>

        {/* JSON Editor Textarea */}
        <div className="flex-1 min-h-[350px] flex flex-col">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (error) setError(null);
            }}
            className="flex-1 w-full p-4 rounded-xl border border-[#EFE7DF] bg-[#FAF8F5]/60 focus:bg-white font-mono text-xs text-[#431805] outline-none focus:border-[#F5730B] resize-none transition-all"
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-1.5 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-[#EFE7DF] flex items-center justify-between">
          <span className="text-xs text-stone-400">
            * Nhấn "Lưu thay đổi" để cập nhật ngay vào tài liệu
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#F5730B] hover:bg-[#d96408] text-white transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
