import mammoth from "mammoth";

export interface ParsedFileResult {
  fileName: string;
  fileSize: string;
  charCount: number;
  content: string;
  preview: string;
}

/**
 * Extracts plain text content from uploaded files (.docx, .txt, etc.)
 */
export async function parseUploadedFile(file: File): Promise<ParsedFileResult> {
  const fileName = file.name;
  const fileSize =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

  const lowerName = fileName.toLowerCase();

  let extractedContent = "";

  if (lowerName.endsWith(".docx")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedContent = result.value.trim();
    } catch (err) {
      console.warn("Lỗi đọc file .docx bằng mammoth, thử chế độ text thô:", err);
      extractedContent = await readAsPlainText(file);
    }
  } else if (lowerName.endsWith(".txt")) {
    extractedContent = await readAsPlainText(file);
  } else if (lowerName.endsWith(".pdf")) {
    // Basic text extraction or fallback notice
    try {
      const text = await readAsPlainText(file);
      // If binary garbage or unparseable, provide useful summary
      if (text.includes("%PDF") && text.length > 500) {
        // Simple string extraction of stream text
        const matches = text.match(/\(([^()]+)\)/g);
        if (matches && matches.length > 20) {
          extractedContent = matches.map((m) => m.slice(1, -1)).join(" ").trim();
        } else {
          extractedContent = `[Tài liệu PDF: ${fileName} - Đã tải lên. Để AI phân tích tối ưu nhất, hãy ưu tiên tệp văn bản .docx hoặc copy nội dung vào ô bên dưới].`;
        }
      } else {
        extractedContent = text;
      }
    } catch {
      extractedContent = `[Tài liệu PDF: ${fileName} - Đã tải lên].`;
    }
  } else {
    extractedContent = await readAsPlainText(file);
  }

  // Clean extra whitespace
  extractedContent = extractedContent.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

  const charCount = extractedContent.length;
  const preview =
    extractedContent.length > 300
      ? extractedContent.slice(0, 300) + "..."
      : extractedContent;

  return {
    fileName,
    fileSize,
    charCount,
    content: extractedContent,
    preview,
  };
}

function readAsPlainText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}
