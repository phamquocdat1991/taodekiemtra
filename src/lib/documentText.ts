export type SourceFileType = "pdf" | "docx" | "txt";

export function validateSourceFile(name: string, size: number): SourceFileType {
  if (size > 10 * 1024 * 1024) {
    throw new Error("Tệp nguồn không được vượt quá 10 MB.");
  }
  const extension = name.split(".").pop()?.toLocaleLowerCase("vi");
  if (extension !== "pdf" && extension !== "docx" && extension !== "txt") {
    throw new Error("Chỉ hỗ trợ tệp PDF, DOCX hoặc TXT.");
  }
  return extension;
}

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&");

export function extractTextFromDocumentXml(xml: string): string {
  return decodeXmlEntities(
    xml
      .replace(/<w:tab\s*\/?\s*>/gi, "\t")
      .replace(/<w:br\s*\/?\s*>/gi, "\n")
      .replace(/<\/w:p>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}
