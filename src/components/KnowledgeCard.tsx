import React, { useRef, useState } from "react";
import { KnowledgeInput } from "../types";
import { BookOpen, Sparkles, Paperclip, X, FileText } from "lucide-react";
import { extractTextFromDocumentXml, validateSourceFile } from "../lib/documentText";

interface KnowledgeCardProps {
  knowledge: KnowledgeInput;
  onChange: (updated: Partial<KnowledgeInput>) => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  knowledge,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

    setIsReadingFile(true);
    setFileError("");
    try {
      const type = validateSourceFile(file.name, file.size);
      let content = "";
      if (type === "txt") {
        content = await file.text();
      } else if (type === "docx") {
        const { default: JSZip } = await import("jszip");
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const documentXml = zip.file("word/document.xml");
        if (!documentXml) throw new Error("Tệp DOCX không có nội dung tài liệu hợp lệ.");
        content = extractTextFromDocumentXml(await documentXml.async("text"));
      } else {
        const [pdfjs, worker] = await Promise.all([
          import("pdfjs-dist/legacy/build/pdf.mjs"),
          import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const text = await page.getTextContent();
          pages.push(text.items.map((item) => ("str" in item ? item.str : "")).join(" "));
        }
        content = pages.join("\n");
      }
      content = content.trim().slice(0, 100_000);
      if (!content) {
        throw new Error("Không đọc được văn bản trong tệp. PDF dạng ảnh cần được OCR trước.");
      }
      onChange({ attachmentName: file.name, attachmentSize: sizeFormatted, attachmentContent: content });
    } catch (cause) {
      setFileError(cause instanceof Error ? cause.message : "Không thể đọc tệp nguồn.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsReadingFile(false);
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
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(7,26,51,0.03)] border border-[#e2e8f0] border-l-4 border-l-[#f2a900] p-5 md:p-6 flex flex-col justify-between transition-all">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#f2a900] flex items-center justify-center font-bold text-sm shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-[#071a33] tracking-tight">
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
                disabled={isReadingFile}
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f8fafc] text-[#164e7a] hover:bg-orange-50 hover:border-orange-200 border border-[#e2e8f0] transition-all shrink-0 active:scale-95"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#f2a900]" />
                <span>{isReadingFile ? "Đang đọc tệp…" : "Đính kèm tệp"}</span>
              </label>
            </div>
          </div>

          {/* Attached File Display */}
          {knowledge.attachmentName && (
            <div className="mb-3 p-2.5 rounded-xl bg-orange-50/80 border border-orange-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-[#f2a900] shrink-0" />
                <span className="text-xs font-bold text-[#071a33] truncate">
                  {knowledge.attachmentName}
                </span>
                <span className="text-[11px] text-stone-400 shrink-0">
                  ({knowledge.attachmentSize})
                </span>
              </div>
              <button
                type="button"
                aria-label={`Bỏ tệp ${knowledge.attachmentName}`}
                onClick={handleRemoveFile}
                className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Bỏ tệp này"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {fileError && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{fileError}</p>}

          {/* Textarea */}
          <textarea
            aria-label="Nội dung kiến thức"
            rows={7}
            value={knowledge.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Nhập tên bài học, chủ đề hoặc yêu cầu của Thầy/Cô tại đây. Nếu đính kèm tệp ở trên, dữ liệu tệp sẽ được gửi cho AI bóc tách và xử lý khi tạo đề."
            className="w-full p-3.5 rounded-xl border border-stone-200 focus:border-[#f2a900] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm leading-relaxed text-[#071a33] bg-[#f8fafc]/60 focus:bg-white transition-all outline-none resize-y"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400 font-medium">
          <span>Hỗ trợ định dạng: .pdf, .docx, .txt</span>
          <span>{knowledge.content.length} ký tự</span>
        </div>
      </div>

      {/* Card Phải: 3. Yêu cầu bổ sung */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(7,26,51,0.03)] border border-[#e2e8f0] border-l-4 border-l-[#f2a900] p-5 md:p-6 flex flex-col justify-between transition-all">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#e2e8f0]">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#f2a900] flex items-center justify-center font-bold text-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-[#071a33] tracking-tight">
                3. Yêu cầu bổ sung
              </h2>
              <p className="text-xs text-stone-500 font-medium">Chỉ dẫn riêng cho AI.</p>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            aria-label="Yêu cầu bổ sung cho AI"
            rows={7}
            value={knowledge.additionalRequirements}
            onChange={(e) => onChange({ additionalRequirements: e.target.value })}
            placeholder="VD: Cần 1 câu tự luận liên hệ thực tế; yêu cầu đặc thù môn Tiếng Anh, môn Ngữ Văn..."
            className="w-full p-3.5 rounded-xl border border-stone-200 focus:border-[#f2a900] focus:ring-2 focus:ring-orange-100 text-xs md:text-sm leading-relaxed text-[#071a33] bg-[#f8fafc]/60 focus:bg-white transition-all outline-none resize-y"
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
