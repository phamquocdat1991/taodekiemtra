import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from "docx";
import saveAs from "file-saver";
import JSZip from "jszip";
import {
  FullExamState,
  MatrixData,
  SpecificationData,
  ExamData,
  AnswerData,
  DetailGuideData,
} from "../types";

// Standard cell border style
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

function createOfficialMoetHeader(
  department: string,
  schoolName: string,
  docTitle: string,
  subTitle: string
): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${(department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO").toUpperCase()}\n${(schoolName || "TRƯỜNG THPT CHU VĂN AN").toUpperCase()}`,
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: docTitle.toUpperCase(),
          bold: true,
          font: "Times New Roman",
          size: 28,
          color: "000000",
        }),
      ],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: subTitle,
          italics: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
      spacing: { after: 240 },
    }),
  ];
}

// 1. Export Matrix Docx
export async function generateMatrixDocxBlob(
  config: FullExamState,
  matrix: MatrixData
): Promise<Blob> {
  const headerRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "STT", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2200, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Chủ đề / Chương", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2800, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Nội dung / Đơn vị kiến thức", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 800, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "NB", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 800, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "TH", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 800, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "VD", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 800, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "VDC", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1000, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Tổng câu", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1000, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Điểm", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1000, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Tỉ lệ %", bold: true, font: "Times New Roman", size: 22 })],
            }),
          ],
        }),
      ],
    }),
  ];

  const dataRows = matrix.rows.map((row) => {
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.stt), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: row.topic, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: row.knowledgeUnit, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.nb || "-"), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.th || "-"), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.vd || "-"), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.vdc || "-"), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.totalQuestions), bold: true, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${row.totalPoints}đ`, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${row.percent}%`, font: "Times New Roman", size: 22 })] })],
        }),
      ],
    });
  });

  const summaryRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TỔNG CỘNG", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(matrix.summary.totalNb), bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(matrix.summary.totalTh), bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(matrix.summary.totalVd), bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(matrix.summary.totalVdc), bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(matrix.summary.totalQuestions), bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "10,0đ", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "100%", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
    ],
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerRows, ...dataRows, summaryRow],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 }, // ~2cm margins
          },
        },
        children: [
          ...createOfficialMoetHeader(
            config.general.department,
            config.general.schoolName,
            "PHỤ LỤC 1: MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ",
            `Môn: ${config.general.subject} – ${config.general.grade} | Thời gian: ${config.general.duration} phút`
          ),
          table,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

// 2. Export Specification Docx
export async function generateSpecDocxBlob(
  config: FullExamState,
  spec: SpecificationData
): Promise<Blob> {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 1200, type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Câu số", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Nội dung / Đơn vị kiến thức", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        width: { size: 4200, type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Yêu cầu cần đạt", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        width: { size: 1500, type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mức độ", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        width: { size: 1100, type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TG (phút)", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
      new TableCell({
        width: { size: 1000, type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Điểm", bold: true, font: "Times New Roman", size: 22 })] })],
      }),
    ],
  });

  const dataRows = spec.rows.map((r) => {
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.questionNumber, bold: true, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: `${r.topic} - ${r.knowledgeUnit}`, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: r.objective, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: r.level, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(r.estimatedTime), font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${r.points}đ`, font: "Times New Roman", size: 22 })] })],
        }),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } },
        },
        children: [
          ...createOfficialMoetHeader(
            config.general.department,
            config.general.schoolName,
            "PHỤ LỤC 2: BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ",
            `Môn: ${config.general.subject} – ${config.general.grade} | Tổng điểm: 10,0 điểm`
          ),
          table,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

// 3. Export Exam Docx
export async function generateExamDocxBlob(
  config: FullExamState,
  exam: ExamData
): Promise<Blob> {
  const contentParagraphs: Paragraph[] = [];

  exam.parts.forEach((part) => {
    contentParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: part.partTitle,
            bold: true,
            font: "Times New Roman",
            size: 26,
          }),
        ],
        spacing: { before: 240, after: 120 },
      })
    );

    if (part.description) {
      contentParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: part.description,
              italics: true,
              font: "Times New Roman",
              size: 24,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    if (part.passage) {
      contentParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: part.passage,
              italics: true,
              font: "Times New Roman",
              size: 24,
            }),
          ],
          spacing: { before: 120, after: 160 },
          indent: { left: 360, right: 360 },
        })
      );
    }

    part.questions.forEach((q) => {
      contentParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Câu ${q.questionNumber}: `,
              bold: true,
              font: "Times New Roman",
              size: 24,
            }),
            new TextRun({
              text: `${q.content} (${q.points} điểm)`,
              font: "Times New Roman",
              size: 24,
            }),
          ],
          spacing: { before: 120, after: 80 },
        })
      );

      // Options A, B, C, D
      if (q.options && q.options.length > 0) {
        const optionRuns = q.options.map(
          (opt) => `${opt.key}. ${opt.text}`
        );
        contentParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `    ${optionRuns.join("       ")}`,
                font: "Times New Roman",
                size: 24,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }

      // True/False sub-questions a, b, c, d
      if (q.subQuestions && q.subQuestions.length > 0) {
        q.subQuestions.forEach((sub) => {
          contentParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `    ${sub.label} ${sub.text}`,
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
              spacing: { after: 60 },
            })
          );
        });
      }
    });
  });

  // Footer / End
  contentParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "---------- HẾT ----------\n(Cán bộ coi thi không giải thích gì thêm)",
          italics: true,
          font: "Times New Roman",
          size: 22,
        }),
      ],
      spacing: { before: 360, after: 120 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } },
        },
        children: [
          ...createOfficialMoetHeader(
            config.general.department,
            config.general.schoolName,
            exam.header.examTitle || "ĐỀ KIỂM TRA ĐỊNH KỲ CHÍNH THỨC",
            `Môn: ${config.general.subject} – ${config.general.grade} | Thời gian: ${config.general.duration} phút`
          ),
          ...contentParagraphs,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

// 4. Export Answers Docx
export async function generateAnswersDocxBlob(
  config: FullExamState,
  answers: AnswerData
): Promise<Blob> {
  const content: (Paragraph | Table)[] = [];

  answers.parts.forEach((part) => {
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: part.partTitle,
            bold: true,
            font: "Times New Roman",
            size: 26,
          }),
        ],
        spacing: { before: 200, after: 120 },
      })
    );

    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Câu số", bold: true, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: 6800, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Đáp án / Hướng dẫn chấm", bold: true, font: "Times New Roman", size: 22 })] })],
        }),
        new TableCell({
          width: { size: 1400, type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: "F2F2F2" },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Điểm", bold: true, font: "Times New Roman", size: 22 })] })],
        }),
      ],
    });

    const rows = part.items.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.questionNumber), bold: true, font: "Times New Roman", size: 22 })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ children: [new TextRun({ text: `${item.solutionSummary} ${item.note ? `\n(${item.note})` : ""}`, font: "Times New Roman", size: 22 })] })],
            }),
            new TableCell({
              borders: cellBorders,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.points}đ`, font: "Times New Roman", size: 22 })] })],
            }),
          ],
        })
    );

    content.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...rows],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } },
        },
        children: [
          ...createOfficialMoetHeader(
            config.general.department,
            config.general.schoolName,
            "HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM",
            `Môn: ${config.general.subject} – ${config.general.grade} | Tổng điểm: 10,0 điểm`
          ),
          ...content,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

// 5. Export Detail Guide Docx
export async function generateDetailGuideDocxBlob(
  config: FullExamState,
  detail: DetailGuideData
): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  detail.items.forEach((item, idx) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${item.questionNumber}: ${item.questionExcerpt}`,
            bold: true,
            font: "Times New Roman",
            size: 24,
            color: "8F310C",
          }),
        ],
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "• Đáp án: ", bold: true, font: "Times New Roman", size: 22 }),
          new TextRun({ text: item.answer, font: "Times New Roman", size: 22 }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "• Hướng dẫn giải chi tiết:\n", bold: true, font: "Times New Roman", size: 22 }),
          new TextRun({ text: item.detailedSolution, font: "Times New Roman", size: 22 }),
        ],
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "• Kiến thức áp dụng: ", bold: true, font: "Times New Roman", size: 22 }),
          new TextRun({ text: item.knowledgeUsed, italics: true, font: "Times New Roman", size: 22 }),
        ],
        spacing: { after: 60 },
      })
    );

    if (item.commonMistakes) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• Lưu ý phòng tránh lỗi sai: ", bold: true, font: "Times New Roman", size: 22, color: "C2410C" }),
            new TextRun({ text: item.commonMistakes, font: "Times New Roman", size: 22 }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 } },
        },
        children: [
          ...createOfficialMoetHeader(
            config.general.department,
            config.general.schoolName,
            "HƯỚNG DẪN GIẢI CHI TIẾT & LƯU Ý SƯ PHẠM",
            `Môn: ${config.general.subject} – ${config.general.grade}`
          ),
          ...paragraphs,
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

// Download single blob
export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

// Export all as ZIP package
export async function exportAllFilesZip(
  config: FullExamState,
  matrix: MatrixData | null,
  spec: SpecificationData | null,
  exam: ExamData | null,
  answers: AnswerData | null,
  detail: DetailGuideData | null
) {
  const zip = new JSZip();
  const baseName = `De_Kiem_Tra_${config.general.subject}_${config.general.grade.replace(/\s+/g, "_")}`;

  if (matrix) {
    const b = await generateMatrixDocxBlob(config, matrix);
    zip.file(`1_PhuLuc1_MaTran_${baseName}.docx`, b);
  }
  if (spec) {
    const b = await generateSpecDocxBlob(config, spec);
    zip.file(`2_PhuLuc2_DacTa_${baseName}.docx`, b);
  }
  if (exam) {
    const b = await generateExamDocxBlob(config, exam);
    zip.file(`3_DeThi_${baseName}.docx`, b);
  }
  if (answers) {
    const b = await generateAnswersDocxBlob(config, answers);
    zip.file(`4_DapAn_${baseName}.docx`, b);
  }
  if (detail) {
    const b = await generateDetailGuideDocxBlob(config, detail);
    zip.file(`5_HuongDanGiai_${baseName}.docx`, b);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `Bo_De_${baseName}.zip`);
}
