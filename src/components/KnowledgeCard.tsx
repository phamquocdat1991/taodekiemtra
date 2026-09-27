import React, { useRef, useState } from "react";
import { KnowledgeInput } from "../types";
import { BookOpen, Sparkles, Paperclip, X, FileText, Eye, Loader2 } from "lucide-react";
import { parseUploadedFile } from "../lib/fileParser";

interface KnowledgeCardProps {
  knowledge: KnowledgeInput;
  onChange: (updated: Partial<KnowledgeInput>) => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  knowledge,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const parsed = await parseUploadedFile(file);
      onChange({
        attachmentName: parsed.fileName,
        attachmentSize: `${parsed.fileSize} (${parsed.charCount.toLocaleString()} ký tự)`,
        attachmentContent: parsed.content,
      });
    } catch (err) {
      console.error("Lỗi bóc tách tệp:", err);
      onChange({
        attachmentName: file.name,
        attachmentSize: `${(file.size / 1024).toFixed(1)} KB`,
        attachmentContent: `[Tệp: ${file.name}]`,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveFile = () => {
    onChange({
      attachmentName: null,
      attachmentSize: null,
      attachmentContent: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      {/* Card Trái: 2. Nội dung kiến thức */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] p-5 md:p-6 flex flex-col justify-between transition-all">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-[#EFE7DF]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F5730B] flex items-center justify-center font-bold text-sm shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-[#431805] tracking-tight">
                  2. Nội dung kiến thức
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Liệt kê tên các bài học/chủ đề hoặc đính kèm tài liệu nguồn.
                </p>
              </div>
            </div>

            {/* File Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-50 hover:border-orange-200 border border-[#EFE7DF] transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-[#F5730B] animate-spin" />
                    <span>Đang bóc tách...</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-3.5 h-3.5 text-[#F5730B]" />
                    <span>Đính kèm tệp (.docx, .pdf)</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Attached File Display */}
          {knowledge.attachmentName && (
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-orange-50/90 to-amber-50/80 border border-orange-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-[#F5730B] shrink-0 font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#431805] truncate">
                      {knowledge.attachmentName}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ Đã bóc tách nội dung: {knowledge.attachmentSize}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-[#8F310C] bg-white border border-orange-200 hover:bg-orange-50 transition-colors"
                    title="Xem trước văn bản đã bóc tách"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{showPreview ? "Thu gọn" : "Xem text"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Bỏ tệp này"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {showPreview && knowledge.attachmentContent && (
                <div className="mt-2.5 pt-2.5 border-t border-orange-200/70">
                  <p className="text-[11px] font-bold text-[#8F310C] mb-1">Trích đoạn nội dung tệp:</p>
                  <div className="max-h-36 overflow-y-auto p-2 rounded-lg bg-white/90 text-xs font-mono text-stone-700 leading-relaxed border border-orange-100">
                    {knowledge.attachmentContent.slice(0, 1500)}
                    {knowledge.attachmentContent.length > 1500 && "..."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Textarea */}
          <textarea
            rows={7}
            value={knowledge.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Nhập tên bài học, chủ đề hoặc yêu cầu của Thầy/Cô tại đây. Nếu đính kèm tệp ở trên, dữ liệu tệp sẽ được gửi cho AI bóc tách và xử lý khi tạo đề."
            className="w-full p-3.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm leading-relaxed text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none resize-y"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400 font-medium">
          <span>Hỗ trợ định dạng: .pdf, .docx, .txt</span>
          <span>{knowledge.content.length} ký tự</span>
        </div>
      </div>

      {/* Card Phải: 3. Yêu cầu bổ sung */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(67,24,5,0.03)] border border-[#EFE7DF] border-l-4 border-l-[#F5730B] p-5 md:p-6 flex flex-col justify-between transition-all">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#EFE7DF]">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F5730B] flex items-center justify-center font-bold text-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-[#431805] tracking-tight">
                3. Yêu cầu bổ sung
              </h2>
              <p className="text-xs text-stone-500 font-medium">Chỉ dẫn riêng cho AI.</p>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            rows={7}
            value={knowledge.additionalRequirements}
            onChange={(e) => onChange({ additionalRequirements: e.target.value })}
            placeholder="VD: Cần 1 câu tự luận liên hệ thực tế; yêu cầu đặc thù môn Tiếng Anh, môn Ngữ Văn..."
            className="w-full p-3.5 rounded-xl border border-stone-200 focus:border-[#F5730B] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm leading-relaxed text-[#431805] bg-[#FAF8F5]/60 focus:bg-white transition-all outline-none resize-y"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400 font-medium">
          <span>Gợi ý: Thầy cô có thể quy định dạng bài, số lượng câu thực tiễn hoặc barem riêng.</span>
          <span>{knowledge.additionalRequirements.length} ký tự</span>
        </div>
      </div>
    </div>
  );
};
