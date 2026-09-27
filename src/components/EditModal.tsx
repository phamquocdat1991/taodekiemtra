import React, { useState, useEffect } from "react";
import { WorkflowStep, ExamData, ExamQuestion } from "../types";
import {
  Edit3,
  X,
  Save,
  AlertCircle,
  Check,
  Code,
  FileText,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";
import { regenerateQuestionAI } from "../services/geminiService";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: WorkflowStep;
  data: any;
  onSave: (step: WorkflowStep, updatedData: any) => void;
  subject?: string;
  grade?: string;
}

const stepTitles: Record<WorkflowStep, string> = {
  1: "Chỉnh sửa Khung Ma Trận",
  2: "Chỉnh sửa Bản Đặc Tả",
  3: "Chỉnh sửa Đề Thi (Trực Quan & AI)",
  4: "Chỉnh sửa Đáp Án & Biểu Điểm",
  5: "Chỉnh sửa Hướng Dẫn Giải Chi Tiết",
  6: "Tổng Hợp Toàn Bộ Hồ Sơ",
};

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  step,
  data,
  onSave,
  subject = "Môn học",
  grade = "Khối lớp",
}) => {
  const [tab, setTab] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [workingData, setWorkingData] = useState<any>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && data) {
      setWorkingData(JSON.parse(JSON.stringify(data)));
      setJsonText(JSON.stringify(data, null, 2));
      setError(null);
      setTab(step === 3 ? "visual" : "visual");
    }
  }, [isOpen, data, step]);

  if (!isOpen || !workingData) return null;

  const handleSave = () => {
    try {
      if (tab === "json") {
        const parsed = JSON.parse(jsonText);
        onSave(step, parsed);
      } else {
        onSave(step, workingData);
      }
      onClose();
    } catch (e) {
      setError("Cú pháp JSON không hợp lệ: " + (e as Error).message);
    }
  };

  // Single Question AI Regeneration
  const handleRegenerateQuestion = async (partIndex: number, qIndex: number) => {
    const q: ExamQuestion = workingData.parts[partIndex].questions[qIndex];
    const qId = q.id || String(q.questionNumber);
    setRegeneratingId(qId);
    setError(null);

    try {
      const response = await regenerateQuestionAI(q, subject, grade);
      if (response && response.question) {
        const updated = { ...workingData };
        updated.parts[partIndex].questions[qIndex] = {
          ...response.question,
          questionNumber: q.questionNumber, // Keep question number
        };
        setWorkingData(updated);
        setJsonText(JSON.stringify(updated, null, 2));
      }
    } catch (err: any) {
      setError("Lỗi sinh câu hỏi tương đương: " + (err?.message || "Không phản hồi"));
    } finally {
      setRegeneratingId(null);
    }
  };

  // Modify question content
  const handleUpdateQuestion = (partIndex: number, qIndex: number, field: string, value: any) => {
    const updated = { ...workingData };
    updated.parts[partIndex].questions[qIndex][field] = value;
    setWorkingData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  // Modify option text
  const handleUpdateOption = (
    partIndex: number,
    qIndex: number,
    optIndex: number,
    text: string
  ) => {
    const updated = { ...workingData };
    updated.parts[partIndex].questions[qIndex].options[optIndex].text = text;
    setWorkingData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  // Delete question
  const handleDeleteQuestion = (partIndex: number, qIndex: number) => {
    const updated = { ...workingData };
    updated.parts[partIndex].questions.splice(qIndex, 1);
    setWorkingData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 md:p-7 shadow-2xl border border-[#EFE7DF] relative flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 mb-3 border-b border-[#EFE7DF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F5730B] flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-[#431805]">
                {stepTitles[step] || "Chỉnh sửa nội dung"}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Chỉnh sửa trực quan nội dung câu hỏi, công thức toán và điểm số
              </p>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl mr-8 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab("visual");
                try {
                  setWorkingData(JSON.parse(jsonText));
                } catch {}
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                tab === "visual"
                  ? "bg-white text-[#F5730B] shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Trực quan (Form)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("json");
                setJsonText(JSON.stringify(workingData, null, 2));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                tab === "json"
                  ? "bg-white text-[#F5730B] shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON thô</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto min-h-[350px] pr-1">
          {tab === "json" ? (
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                if (error) setError(null);
              }}
              className="w-full h-full min-h-[420px] p-4 rounded-xl border border-[#EFE7DF] bg-[#FAF8F5]/60 focus:bg-white font-mono text-xs text-[#431805] outline-none focus:border-[#F5730B] resize-none transition-all"
              spellCheck={false}
            />
          ) : step === 3 && workingData.parts ? (
            // Visual Question Editor for Exam Data
            <div className="space-y-6">
              {workingData.parts.map((part: any, pIdx: number) => (
                <div key={pIdx} className="space-y-3">
                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-orange-200 flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wide text-[#8F310C]">
                      {part.partTitle} ({part.questions?.length || 0} câu)
                    </span>
                  </div>

                  <div className="space-y-4">
                    {part.questions?.map((q: ExamQuestion, qIdx: number) => {
                      const qId = q.id || String(q.questionNumber);
                      const isRegenerating = regeneratingId === qId;

                      return (
                        <div
                          key={qId}
                          className="p-4 rounded-2xl bg-white border border-[#EFE7DF] hover:border-orange-300 shadow-xs transition-all space-y-3"
                        >
                          {/* Question header row */}
                          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-[#F5730B] font-black text-xs">
                                Câu {q.questionNumber}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-stone-500">
                                <span>Điểm:</span>
                                <input
                                  type="number"
                                  step="0.05"
                                  value={q.points}
                                  onChange={(e) =>
                                    handleUpdateQuestion(
                                      pIdx,
                                      qIdx,
                                      "points",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 px-2 py-0.5 rounded border border-stone-200 text-xs font-bold text-[#431805]"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Single Question AI Regen button */}
                              <button
                                type="button"
                                disabled={isRegenerating}
                                onClick={() => handleRegenerateQuestion(pIdx, qIdx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-[#8F310C] hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                title="Yêu cầu AI sinh câu hỏi khác tương đương về độ khó và chủ đề"
                              >
                                {isRegenerating ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5730B]" />
                                    <span>Đang sinh...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-[#F5730B]" />
                                    <span>Đổi câu này (AI)</span>
                                  </>
                                )}
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(pIdx, qIdx)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa câu này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Question Content Editor */}
                          <div>
                            <label className="block text-[11px] font-bold text-stone-600 mb-1">
                              Nội dung câu hỏi (hỗ trợ $công thức toán$):
                            </label>
                            <textarea
                              rows={2}
                              value={q.content}
                              onChange={(e) =>
                                handleUpdateQuestion(pIdx, qIdx, "content", e.target.value)
                              }
                              className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-[#F5730B] text-xs text-[#431805] outline-none transition-all"
                            />
                            {/* Math Preview */}
                            {q.content.includes("$") && (
                              <div className="mt-1 p-2 rounded-lg bg-orange-50/50 border border-orange-100 text-xs">
                                <span className="font-bold text-[10px] text-orange-700 block mb-0.5">
                                  Xem trước công thức:
                                </span>
                                <MathRenderer text={q.content} />
                              </div>
                            )}
                          </div>

                          {/* Options if Multiple Choice */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={opt.key}
                                  className="flex items-center gap-1.5 p-1.5 rounded-xl border border-stone-200 bg-[#FAF8F5]/60"
                                >
                                  <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#F5730B] font-black text-xs flex items-center justify-center shrink-0">
                                    {opt.key}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) =>
                                      handleUpdateOption(pIdx, qIdx, optIdx, e.target.value)
                                    }
                                    className="flex-1 bg-transparent border-0 text-xs text-stone-800 outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* SubQuestions if True/False */}
                          {q.subQuestions && q.subQuestions.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {q.subQuestions.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex items-center gap-2 p-1.5 rounded-xl border border-stone-200 bg-[#FAF8F5]/60"
                                >
                                  <span className="font-bold text-xs text-[#8F310C] shrink-0">
                                    {sub.label}
                                  </span>
                                  <input
                                    type="text"
                                    value={sub.text}
                                    onChange={(e) => {
                                      const updated = { ...workingData };
                                      updated.parts[pIdx].questions[qIdx].subQuestions[sIdx].text =
                                        e.target.value;
                                      setWorkingData(updated);
                                      setJsonText(JSON.stringify(updated, null, 2));
                                    }}
                                    className="flex-1 bg-transparent border-0 text-xs text-stone-800 outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Default visual view for other steps
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 text-xs leading-relaxed space-y-2">
              <p className="font-bold text-[#8F310C]">
                Đang mở chế độ biên tập cho: {stepTitles[step]}
              </p>
              <p className="text-stone-600">
                Thầy/Cô có thể chuyển sang tab <strong>JSON thô</strong> để tùy biến nhanh chóng
                từng trường thuộc tính, hoặc xem kết quả trực quan trên trang chính sau khi lưu.
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-80 p-3 rounded-xl border border-stone-200 bg-white font-mono text-xs text-stone-800 outline-none focus:border-[#F5730B]"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3.5 border-t border-[#EFE7DF] flex items-center justify-between">
          <span className="text-xs text-stone-500">
            * Bấm "Lưu thay đổi" để cập nhật trực tiếp vào hệ thống khảo thí
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-[#F5730B] hover:brightness-105 transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
