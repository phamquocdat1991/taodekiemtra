import {
  FullExamState,
  MatrixData,
  SpecificationData,
  ExamData,
  AnswerData,
  DetailGuideData,
  ExamPart,
  ExamQuestion,
} from "../types";
import { analyzeExamStructure } from "./geminiService";

// Helper để trích xuất các chủ đề sạch từ knowledge.content
function extractTopics(content: string, defaultSubject: string): string[] {
  if (!content || !content.trim()) {
    return [
      `Chủ đề 1: Kiến thức trọng tâm môn ${defaultSubject}`,
      `Chủ đề 2: Kĩ năng biến đổi và giải quyết vấn đề`,
      `Chủ đề 3: Vận dụng thực tiễn và phát triển tư duy`,
    ];
  }
  const lines = content
    .split("\n")
    .map((l) => l.replace(/^[0-9.-]+\s*/, "").trim())
    .filter((l) => l.length > 3);
  if (lines.length === 0) {
    return [
      `Chủ đề 1: Kiến thức trọng tâm môn ${defaultSubject}`,
      `Chủ đề 2: Kĩ năng biến đổi và giải quyết vấn đề`,
      `Chủ đề 3: Vận dụng thực tiễn và phát triển tư duy`,
    ];
  }
  return lines.slice(0, 4);
}

// ─── STEP 1: SMART MATRIX GENERATOR ──────────────────────────────────────────
export function generateSmartMatrix(config: FullExamState): MatrixData {
  const analysis = analyzeExamStructure(config);
  const { general, cognition, knowledge } = config;
  const topics = extractTopics(knowledge.content, general.subject);

  // A. MÔN NGỮ VĂN
  if (analysis.isLiterature) {
    const is64 = config.structure.literature.preset === "6/4";
    const readPts = is64 ? 6.0 : 5.0;
    const writePts = is64 ? 4.0 : 5.0;
    const readPct = is64 ? 60 : 50;
    const writePct = is64 ? 40 : 50;

    // Nếu giáo viên để NB = 0% thì phần đọc hiểu không có câu NB
    const nbRead = analysis.zeroNb ? 0 : 2;
    const thRead = analysis.zeroNb ? 3 : 2;
    const vdRead = analysis.zeroNb ? 2 : 1;

    return {
      title: `KHUNG MA TRẬN ĐỀ KIỂM TRA ${general.examType.toUpperCase()}\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
      rows: [
        {
          stt: 1,
          topic: "Đọc hiểu văn bản",
          knowledgeUnit: "Văn bản nghệ thuật / Nghị luận / Thông tin (Ngoài SGK)",
          questionType: analysis.isPureEssay ? "Tự luận" : "Tự luận ngắn & Đọc hiểu",
          nb: nbRead,
          th: thRead,
          vd: vdRead,
          vdc: 0,
          totalQuestions: nbRead + thRead + vdRead,
          totalPoints: readPts,
          percent: readPct,
        },
        {
          stt: 2,
          topic: "Viết đoạn văn",
          knowledgeUnit: "Viết đoạn văn nghị luận xã hội (khoảng 200 chữ)",
          questionType: "Tự luận",
          nb: 0,
          th: 0,
          vd: 1,
          vdc: 0,
          totalQuestions: 1,
          totalPoints: 2.0,
          percent: 20,
        },
        {
          stt: 3,
          topic: "Viết bài văn",
          knowledgeUnit: "Viết bài văn nghị luận văn học / Xã hội",
          questionType: "Tự luận",
          nb: 0,
          th: 0,
          vd: 0,
          vdc: 1,
          totalQuestions: 1,
          totalPoints: writePts - 2.0,
          percent: writePct - 20,
        },
      ],
      summary: {
        totalNb: nbRead,
        totalTh: thRead,
        totalVd: vdRead + 1,
        totalVdc: 1,
        totalQuestions: nbRead + thRead + vdRead + 2,
        totalPoints: 10.0,
        totalPercent: 100,
      },
    };
  }

  // B. MÔN NGOẠI NGỮ
  if (analysis.isLanguage) {
    const lang = config.structure.language;
    const nbList = analysis.zeroNb ? 0 : 3;
    const thList = analysis.zeroNb ? 5 : 3;
    const nbLang = analysis.zeroNb ? 0 : 4;
    const thLang = analysis.zeroNb ? 6 : 4;
    const nbRead = analysis.zeroNb ? 0 : 3;
    const thRead = analysis.zeroNb ? 5 : 4;

    return {
      title: `KHUNG MA TRẬN ĐỀ KIỂM TRA ĐẶC THÙ NGOẠI NGỮ\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
      rows: [
        {
          stt: 1,
          topic: "Phần I: Nghe (Listening)",
          knowledgeUnit: "Nghe hiểu thông tin chi tiết & Nghe xác định Đúng/Sai",
          questionType: "Trắc nghiệm khách quan",
          nb: nbList,
          th: thList,
          vd: 2,
          vdc: 0,
          totalQuestions: lang.listening.count || 8,
          totalPoints: lang.listening.points || 2.0,
          percent: lang.listening.percent || 20,
        },
        {
          stt: 2,
          topic: "Phần II: Ngôn ngữ (Language)",
          knowledgeUnit: "Ngữ âm, Từ vựng, Ngữ pháp trọng tâm & Giao tiếp",
          questionType: "Trắc nghiệm nhiều lựa chọn",
          nb: nbLang,
          th: thLang,
          vd: 2,
          vdc: 0,
          totalQuestions: lang.languageFocus.count || 10,
          totalPoints: lang.languageFocus.points || 2.5,
          percent: lang.languageFocus.percent || 25,
        },
        {
          stt: 3,
          topic: "Phần III: Đọc (Reading)",
          knowledgeUnit: "Đọc điền từ vào đoạn văn & Đọc hiểu trả lời câu hỏi",
          questionType: "Trắc nghiệm & Ghép nối",
          nb: nbRead,
          th: thRead,
          vd: 2,
          vdc: 1,
          totalQuestions: lang.reading.count || 10,
          totalPoints: lang.reading.points || 3.0,
          percent: lang.reading.percent || 30,
        },
        {
          stt: 4,
          topic: "Phần IV: Viết (Writing)",
          knowledgeUnit: "Viết lại câu, Sắp xếp từ & Viết đoạn văn ngắn",
          questionType: "Tự luận",
          nb: 0,
          th: 1,
          vd: 3,
          vdc: 1,
          totalQuestions: lang.writing.count || 5,
          totalPoints: lang.writing.points || 2.5,
          percent: lang.writing.percent || 25,
        },
      ],
      summary: {
        totalNb: nbList + nbLang + nbRead,
        totalTh: thList + thLang + thRead + 1,
        totalVd: 9,
        totalVdc: 2,
        totalQuestions:
          (lang.listening.count || 8) +
          (lang.languageFocus.count || 10) +
          (lang.reading.count || 10) +
          (lang.writing.count || 5),
        totalPoints: 10.0,
        totalPercent: 100,
      },
    };
  }

  // C. MÔN THÔNG THƯỜNG (TOÁN, LÍ, HÓA, SINH, KHTN, SỬ, ĐỊA, TIN,...)
  const std = config.structure.standard;

  // TRƯỜNG HỢP C.1: 100% TỰ LUẬN
  if (analysis.isPureEssay) {
    const totalQuestions = std.essay.count || 5;
    // Điểm mỗi câu tự luận
    const ptsPerQ = Number((10.0 / totalQuestions).toFixed(1));

    // Phân bổ câu hỏi theo mức độ nhận thức
    // Nếu zeroNb: nb = 0
    let nbTarget = 0;
    let thTarget = 0;
    let vdTarget = 0;
    let vdcTarget = 0;

    if (analysis.zeroNb) {
      nbTarget = 0;
      thTarget = Math.max(1, Math.round(totalQuestions * ((cognition.th || 40) / 100)));
      vdTarget = Math.max(1, Math.round(totalQuestions * ((cognition.vd || 40) / 100)));
      vdcTarget = totalQuestions - thTarget - vdTarget;
      if (vdcTarget < 0) {
        vdTarget += vdcTarget;
        vdcTarget = 0;
      }
      if (vdcTarget === 0 && cognition.vdc > 0 && totalQuestions >= 3) {
        vdcTarget = 1;
        if (thTarget > vdTarget) thTarget--;
        else vdTarget--;
      }
    } else {
      nbTarget = Math.max(1, Math.round(totalQuestions * ((cognition.nb || 40) / 100)));
      thTarget = Math.max(1, Math.round(totalQuestions * ((cognition.th || 30) / 100)));
      vdTarget = Math.max(1, Math.round(totalQuestions * ((cognition.vd || 20) / 100)));
      vdcTarget = totalQuestions - nbTarget - thTarget - vdTarget;
      if (vdcTarget < 0) {
        vdTarget += vdcTarget;
        vdcTarget = 0;
      }
    }

    // Phân bổ vào các topics
    let remainingNb = nbTarget;
    let remainingTh = thTarget;
    let remainingVd = vdTarget;
    let remainingVdc = vdcTarget;

    const rows = topics.map((top, idx) => {
      const isLast = idx === topics.length - 1;
      let nbRow = 0;
      let thRow = 0;
      let vdRow = 0;
      let vdcRow = 0;

      if (isLast) {
        nbRow = remainingNb;
        thRow = remainingTh;
        vdRow = remainingVd;
        vdcRow = remainingVdc;
      } else {
        if (remainingNb > 0) {
          nbRow = 1;
          remainingNb--;
        }
        if (remainingTh > 0) {
          thRow = 1;
          remainingTh--;
        }
        if (remainingVd > 0 && idx >= 1) {
          vdRow = 1;
          remainingVd--;
        }
      }

      const qInRow = nbRow + thRow + vdRow + vdcRow;
      const ptsRow = Number((qInRow * ptsPerQ).toFixed(1));

      return {
        stt: idx + 1,
        topic: top,
        knowledgeUnit: `Bài toán tự luận và bài tập trọng tâm thuộc ${top}`,
        questionType: "Tự luận",
        nb: nbRow,
        th: thRow,
        vd: vdRow,
        vdc: vdcRow,
        totalQuestions: qInRow,
        totalPoints: ptsRow,
        percent: Math.round((ptsRow / 10) * 100),
      };
    });

    // Cân bằng tổng điểm đúng 10.0đ và 100%
    const currentPts = rows.reduce((s, r) => s + r.totalPoints, 0);
    const diff = Number((10.0 - currentPts).toFixed(1));
    if (diff !== 0 && rows.length > 0) {
      rows[0].totalPoints = Number((rows[0].totalPoints + diff).toFixed(1));
      rows[0].percent = Math.round((rows[0].totalPoints / 10) * 100);
    }

    return {
      title: `KHUNG MA TRẬN ĐỀ KIỂM TRA TỰ LUẬN ${general.examType.toUpperCase()}\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
      rows,
      summary: {
        totalNb: rows.reduce((acc, r) => acc + r.nb, 0),
        totalTh: rows.reduce((acc, r) => acc + r.th, 0),
        totalVd: rows.reduce((acc, r) => acc + r.vd, 0),
        totalVdc: rows.reduce((acc, r) => acc + r.vdc, 0),
        totalQuestions: rows.reduce((acc, r) => acc + r.totalQuestions, 0),
        totalPoints: 10.0,
        totalPercent: 100,
      },
    };
  }

  // TRƯỜNG HỢP C.2: ĐỀ TIÊU CHUẨN HOẶC KẾT HỢP
  // Xác định questionType label theo các dạng thực sự có count > 0
  const activeTypes: string[] = [];
  if (std.multipleChoice.count > 0) activeTypes.push("Trắc nghiệm nhiều lựa chọn");
  if (std.trueFalse.count > 0) activeTypes.push("Đúng/Sai");
  if (std.shortAnswer.count > 0) activeTypes.push("Trả lời ngắn");
  if (std.essay.count > 0) activeTypes.push("Tự luận");
  const questionTypeLabel = activeTypes.length > 0 ? activeTypes.join(" & ") : "Trắc nghiệm & Tự luận";

  const totalQuestions =
    std.multipleChoice.count +
    std.trueFalse.count +
    std.shortAnswer.count +
    std.essay.count || 20;

  // Tính số câu mỗi mức độ
  let nbTarget = 0;
  let thTarget = 0;
  let vdTarget = 0;
  let vdcTarget = 0;

  if (analysis.zeroNb) {
    nbTarget = 0;
    thTarget = Math.max(1, Math.round(totalQuestions * ((cognition.th || 40) / 100)));
    vdTarget = Math.max(1, Math.round(totalQuestions * ((cognition.vd || 40) / 100)));
    vdcTarget = totalQuestions - thTarget - vdTarget;
    if (vdcTarget < 0) {
      vdTarget += vdcTarget;
      vdcTarget = 0;
    }
  } else {
    nbTarget = Math.max(1, Math.round(totalQuestions * ((cognition.nb || 40) / 100)));
    thTarget = Math.max(1, Math.round(totalQuestions * ((cognition.th || 30) / 100)));
    vdTarget = Math.max(1, Math.round(totalQuestions * ((cognition.vd || 20) / 100)));
    vdcTarget = totalQuestions - nbTarget - thTarget - vdTarget;
    if (vdcTarget < 0) {
      vdTarget += vdcTarget;
      vdcTarget = 0;
    }
  }

  let remNb = nbTarget;
  let remTh = thTarget;
  let remVd = vdTarget;
  let remVdc = vdcTarget;

  const rows = topics.map((top, idx) => {
    const isLast = idx === topics.length - 1;
    let nbRow = 0;
    let thRow = 0;
    let vdRow = 0;
    let vdcRow = 0;

    if (isLast) {
      nbRow = remNb;
      thRow = remTh;
      vdRow = remVd;
      vdcRow = remVdc;
    } else {
      const share = 1 / topics.length;
      nbRow = analysis.zeroNb ? 0 : Math.min(remNb, Math.round(nbTarget * share));
      remNb -= nbRow;

      thRow = Math.min(remTh, Math.round(thTarget * share));
      remTh -= thRow;

      vdRow = Math.min(remVd, Math.round(vdTarget * share));
      remVd -= vdRow;

      vdcRow = Math.min(remVdc, Math.round(vdcTarget * share));
      remVdc -= vdcRow;
    }

    const qCount = nbRow + thRow + vdRow + vdcRow;
    const pts = Number(((qCount / totalQuestions) * 10).toFixed(1));

    return {
      stt: idx + 1,
      topic: top,
      knowledgeUnit: `Đơn vị kiến thức chi tiết thuộc ${top}`,
      questionType: questionTypeLabel,
      nb: nbRow,
      th: thRow,
      vd: vdRow,
      vdc: vdcRow,
      totalQuestions: qCount,
      totalPoints: pts,
      percent: Math.round((pts / 10) * 100),
    };
  });

  return {
    title: `KHUNG MA TRẬN ĐỀ KIỂM TRA ${general.examType.toUpperCase()}\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
    rows,
    summary: {
      totalNb: rows.reduce((acc, r) => acc + r.nb, 0),
      totalTh: rows.reduce((acc, r) => acc + r.th, 0),
      totalVd: rows.reduce((acc, r) => acc + r.vd, 0),
      totalVdc: rows.reduce((acc, r) => acc + r.vdc, 0),
      totalQuestions: rows.reduce((acc, r) => acc + r.totalQuestions, 0),
      totalPoints: 10.0,
      totalPercent: 100,
    },
  };
}

// ─── STEP 2: SMART SPECIFICATION GENERATOR ────────────────────────────────────
export function generateSmartSpecification(
  config: FullExamState,
  matrix: MatrixData
): SpecificationData {
  const analysis = analyzeExamStructure(config);
  const { general } = config;
  const rows: SpecificationData["rows"] = [];

  let qIdx = 1;
  const totalQuestions = matrix.summary.totalQuestions || (analysis.isPureEssay ? 5 : 20);
  const ptsPerQ = Number((10.0 / totalQuestions).toFixed(2));

  matrix.rows.forEach((mrow) => {
    // NB questions: CHỈ CHẠY NẾU mrow.nb > 0 VÀ KHÔNG PHẢI zeroNb
    if (!analysis.zeroNb && mrow.nb > 0) {
      for (let i = 0; i < mrow.nb; i++) {
        rows.push({
          questionNumber: `Câu ${qIdx++}`,
          topic: mrow.topic,
          knowledgeUnit: mrow.knowledgeUnit,
          level: "Nhận biết",
          objective: `Nhận biết và ghi nhớ chính xác các định nghĩa, quy tắc và tính chất cơ bản thuộc ${mrow.knowledgeUnit}.`,
          estimatedTime: analysis.isPureEssay ? 10 : 1.5,
          points: ptsPerQ,
        });
      }
    }

    // TH questions
    for (let i = 0; i < mrow.th; i++) {
      rows.push({
        questionNumber: `Câu ${qIdx++}`,
        topic: mrow.topic,
        knowledgeUnit: mrow.knowledgeUnit,
        level: "Thông hiểu",
        objective: `Hiểu rõ bản chất, giải thích được mối quan hệ, các bước biến đổi và tính toán cơ bản trong ${mrow.knowledgeUnit}.`,
        estimatedTime: analysis.isPureEssay ? 15 : 2.5,
        points: ptsPerQ,
      });
    }

    // VD questions
    for (let i = 0; i < mrow.vd; i++) {
      rows.push({
        questionNumber: `Câu ${qIdx++}`,
        topic: mrow.topic,
        knowledgeUnit: mrow.knowledgeUnit,
        level: "Vận dụng",
        objective: `Vận dụng các công thức và định lý thuộc ${mrow.knowledgeUnit} để giải quyết bài toán tính toán, tổng hợp và phân tích dữ liệu.`,
        estimatedTime: analysis.isPureEssay ? 20 : 4.0,
        points: ptsPerQ,
      });
    }

    // VDC questions
    for (let i = 0; i < mrow.vdc; i++) {
      rows.push({
        questionNumber: `Câu ${qIdx++}`,
        topic: mrow.topic,
        knowledgeUnit: mrow.knowledgeUnit,
        level: "Vận dụng cao",
        objective: `Vận dụng sáng tạo, liên môn hoặc mô hình hóa bài toán thực tiễn phức tạp thuộc ${mrow.knowledgeUnit}.`,
        estimatedTime: analysis.isPureEssay ? 25 : 6.0,
        points: ptsPerQ,
      });
    }
  });

  return {
    title: `BẢN ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA ${general.examType.toUpperCase()}\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
    rows,
    totalTime: general.duration,
    totalPoints: 10.0,
  };
}

// ─── STEP 3: SMART EXAM GENERATOR ─────────────────────────────────────────────
export function generateSmartExam(
  config: FullExamState,
  spec: SpecificationData
): ExamData {
  const analysis = analyzeExamStructure(config);
  const { general, structure } = config;

  // A. MÔN NGỮ VĂN
  if (analysis.isLiterature) {
    const is64 = structure.literature.preset === "6/4";
    const readPts = is64 ? 6.0 : 5.0;
    const writePts = is64 ? 4.0 : 5.0;

    // Nếu zeroNb: không hỏi câu nhận biết đơn thuần, mà hỏi phân tích / thông hiểu
    const q1 = analysis.zeroNb
      ? "Phân tích tác dụng của việc tác giả mở đầu đoạn trích bằng lời khẳng định về sứ mệnh của mỗi cá nhân."
      : "Xác định phương thức biểu đạt chính được sử dụng trong đoạn trích trên.";

    return {
      header: {
        department: general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
        schoolName: general.schoolName || "TRƯỜNG THPT CHU VĂN AN",
        examTitle: `ĐỀ KIỂM TRA ${general.examType.toUpperCase()}`,
        subject: general.subject,
        grade: general.grade,
        duration: general.duration,
        schoolYear: "2025 - 2026",
      },
      totalPoints: 10.0,
      parts: [
        {
          partTitle: `PHẦN I. ĐỌC HIỂU (${readPts.toFixed(1).replace(".", ",")} điểm)`,
          description: "Đọc văn bản sau và thực hiện các yêu cầu từ Câu 1 đến Câu 5:",
          passage: `"...Mỗi con người sinh ra đều mang trong mình một sứ mệnh và một giá trị riêng biệt. Đừng để bản thân bị hòa tan vào sự ồn ào của đám đông hay sự phán xét nhất thời của người khác. Khi bạn dám ước mơ và nỗ lực hết mình cho những điều tử tế, từng bước đi của bạn dù nhỏ bé nhưng đều đang góp phần tạo nên một tương lai vững vàng và ý nghĩa. Hạnh phúc không nằm ở đích đến xa xôi, mà hiện hữu ngay trên hành trình bạn kiên định dấn thân..."\n(Trích "Khát vọng tuổi trẻ và hành trình sống đẹp", NXB Giáo dục)`,
          totalPoints: readPts,
          questions: [
            {
              id: "van-c1",
              questionNumber: 1,
              type: "essay",
              content: q1,
              points: 1.0,
            },
            {
              id: "van-c2",
              questionNumber: 2,
              type: "essay",
              content: "Theo tác giả đoạn trích, 'hạnh phúc' hiện hữu ở đâu?",
              points: 1.0,
            },
            {
              id: "van-c3",
              questionNumber: 3,
              type: "essay",
              content:
                "Nêu tác dụng của phép điệp từ/cấu trúc được sử dụng trong câu văn: 'Khi bạn dám ước mơ và nỗ lực hết mình cho những điều tử tế, từng bước đi của bạn dù nhỏ bé nhưng đều đang góp phần tạo nên một tương lai vững vàng và ý nghĩa.'",
              points: 1.5,
            },
            {
              id: "van-c4",
              questionNumber: 4,
              type: "essay",
              content:
                "Anh/Chị hiểu như thế nào về nhận định: 'Đừng để bản thân bị hòa tan vào sự ồn ào của đám đông'?",
              points: 1.5,
            },
            {
              id: "van-c5",
              questionNumber: 5,
              type: "essay",
              content:
                "Thông điệp nào trong đoạn trích có ý nghĩa nhất đối với anh/chị? Vì sao? (Trình bày trong khoảng 3 - 5 dòng).",
              points: 1.0,
            },
          ],
        },
        {
          partTitle: `PHẦN II. LÀM VĂN (${writePts.toFixed(1).replace(".", ",")} điểm)`,
          description: "Thực hiện các yêu cầu nghị luận sau:",
          totalPoints: writePts,
          questions: [
            {
              id: "van-c6",
              questionNumber: "Câu 1 (Nghị luận xã hội)",
              type: "essay",
              content:
                "Từ nội dung đoạn trích ở phần Đọc hiểu, anh/chị hãy viết một đoạn văn (khoảng 200 chữ) trình bày suy nghĩ về ý nghĩa của việc kiên định theo đuổi ước mơ của người trẻ trong thời đại số.",
              points: 2.0,
            },
            {
              id: "van-c7",
              questionNumber: "Câu 2 (Nghị luận văn học)",
              type: "essay",
              content:
                "Anh/Chị hãy phân tích vẻ đẹp tâm hồn hoặc tư tưởng nghệ thuật được gửi gắm qua một tác phẩm văn học đã học trong chương trình, từ đó liên hệ với trách nhiệm của thế hệ trẻ hôm nay.",
              points: writePts - 2.0,
            },
          ],
        },
      ],
    };
  }

  // B. MÔN NGOẠI NGỮ
  if (analysis.isLanguage) {
    const lang = structure.language;
    return {
      header: {
        department: general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
        schoolName: general.schoolName || "TRƯỜNG THPT CHU VĂN AN",
        examTitle: `ĐỀ KIỂM TRA ĐỊNH KỲ ${general.examType.toUpperCase()}`,
        subject: "TIẾNG ANH",
        grade: general.grade,
        duration: general.duration,
        schoolYear: "2025 - 2026",
      },
      totalPoints: 10.0,
      parts: [
        {
          partTitle: "SECTION I: LISTENING (2.0 points)",
          description: "Listen to the recording and choose the best answer A, B, C or D for each question.",
          totalPoints: lang.listening.points || 2.0,
          questions: [
            {
              id: "eng-l1",
              questionNumber: 1,
              type: "multipleChoice",
              content: "What is the main topic of the conversation?",
              options: [
                { key: "A", text: "Healthy eating habits for teenagers" },
                { key: "B", text: "Environmental protection in smart cities" },
                { key: "C", text: "Career choices after graduation" },
                { key: "D", text: "Technology trends in modern schools" },
              ],
              points: 0.5,
            },
            {
              id: "eng-l2",
              questionNumber: 2,
              type: "multipleChoice",
              content: "According to the speaker, what should students do first in the morning?",
              options: [
                { key: "A", text: "Drink a glass of warm water" },
                { key: "B", text: "Check their smart devices" },
                { key: "C", text: "Do high-intensity workouts" },
                { key: "D", text: "Skip breakfast if not hungry" },
              ],
              points: 0.5,
            },
            {
              id: "eng-l3",
              questionNumber: 3,
              type: "multipleChoice",
              content: "How long should a daily physical exercise last at least?",
              options: [
                { key: "A", text: "15 minutes" },
                { key: "B", text: "30 minutes" },
                { key: "C", text: "45 minutes" },
                { key: "D", text: "60 minutes" },
              ],
              points: 0.5,
            },
            {
              id: "eng-l4",
              questionNumber: 4,
              type: "multipleChoice",
              content: "What is mentioned as a major benefit of enough sleep?",
              options: [
                { key: "A", text: "Better memory and concentration" },
                { key: "B", text: "Immediate weight reduction" },
                { key: "C", text: "Higher social media followers" },
                { key: "D", text: "Faster typing speed" },
              ],
              points: 0.5,
            },
          ],
        },
        {
          partTitle: "SECTION II: LANGUAGE FOCUS (2.5 points)",
          description: "Mark the letter A, B, C or D to indicate the correct answer to each question.",
          totalPoints: lang.languageFocus.points || 2.5,
          questions: [
            {
              id: "eng-lf1",
              questionNumber: 5,
              type: "multipleChoice",
              content: "Mark the letter A, B, C or D to indicate the word whose underlined part differs from the other three in pronunciation.",
              options: [
                { key: "A", text: "generat<u>ed</u>" },
                { key: "B", text: "protect<u>ed</u>" },
                { key: "C", text: "reduc<u>ed</u>" },
                { key: "D", text: "connect<u>ed</u>" },
              ],
              points: 0.5,
            },
            {
              id: "eng-lf2",
              questionNumber: 6,
              type: "multipleChoice",
              content: "If you want to maintain a balanced lifestyle, you ______ cut down on sugary drinks and fast food.",
              options: [
                { key: "A", text: "mustn't" },
                { key: "B", text: "should" },
                { key: "C", text: "might not" },
                { key: "D", text: "had to" },
              ],
              points: 0.5,
            },
            {
              id: "eng-lf3",
              questionNumber: 7,
              type: "multipleChoice",
              content: "Many renewable energy projects ______ in our province since last year.",
              options: [
                { key: "A", text: "have been developed" },
                { key: "B", text: "were developing" },
                { key: "C", text: "develop" },
                { key: "D", text: "are developing" },
              ],
              points: 0.5,
            },
            {
              id: "eng-lf4",
              questionNumber: 8,
              type: "multipleChoice",
              content: "The government is investing heavily in AI technology to build ______ smart cities.",
              options: [
                { key: "A", text: "sustainable" },
                { key: "B", text: "sustainably" },
                { key: "C", text: "sustainability" },
                { key: "D", text: "unsustain" },
              ],
              points: 0.5,
            },
            {
              id: "eng-lf5",
              questionNumber: 9,
              type: "multipleChoice",
              content: "Teenagers should learn how to ______ their time effectively between study and leisure.",
              options: [
                { key: "A", text: "manage" },
                { key: "B", text: "waste" },
                { key: "C", text: "ignore" },
                { key: "D", text: "delay" },
              ],
              points: 0.5,
            },
          ],
        },
        {
          partTitle: "SECTION III: READING COMPREHENSION (3.0 points)",
          description: "Read the passage and choose the correct answer A, B, C or D.",
          passage:
            "Urbanization has been accelerating worldwide at an unprecedented pace. Modern eco-cities are designed with integrated green spaces, efficient public transport, and zero-emission buildings to minimize carbon footprints...",
          totalPoints: lang.reading.points || 3.0,
          questions: [
            {
              id: "eng-r1",
              questionNumber: 10,
              type: "multipleChoice",
              content: "What is the best title for the passage?",
              options: [
                { key: "A", text: "The Rise of Sustainable Eco-Cities" },
                { key: "B", text: "Traffic Congestion in Big Metropolises" },
                { key: "C", text: "Traditional Architecture in Rural Areas" },
                { key: "D", text: "Historical Developments of Public Parks" },
              ],
              points: 1.5,
            },
            {
              id: "eng-r2",
              questionNumber: 11,
              type: "multipleChoice",
              content: "The word 'accelerating' in paragraph 1 is closest in meaning to ______.",
              options: [
                { key: "A", text: "speeding up" },
                { key: "B", text: "slowing down" },
                { key: "C", text: "disappearing" },
                { key: "D", text: "stabilizing" },
              ],
              points: 1.5,
            },
          ],
        },
        {
          partTitle: "SECTION IV: WRITING (2.5 points)",
          description: "Rewrite sentences or complete paragraphs as instructed.",
          totalPoints: lang.writing.points || 2.5,
          questions: [
            {
              id: "eng-w1",
              questionNumber: 12,
              type: "writing",
              content:
                "Rewrite the following sentence using the word in brackets: 'It is essential for teenagers to get at least 8 hours of sleep.' (MUST)",
              points: 1.0,
            },
            {
              id: "eng-w2",
              questionNumber: 13,
              type: "writing",
              content:
                "In about 100 - 120 words, write a paragraph describing one effective way teenagers can protect their local environment.",
              points: 1.5,
            },
          ],
        },
      ],
    };
  }

  // C. MÔN THÔNG THƯỜNG (TOÁN, LÍ, HÓA, SINH, KHTN, SỬ, ĐỊA, TIN,...)
  const std = structure.standard;

  // ═══════════════════════════════════════════════════════════════════════════
  // C.1: TRƯỜNG HỢP 100% TỰ LUẬN (KHÔNG CÓ BẤT KỲ CÂU TRẮC NGHIỆM NÀO)
  // ═══════════════════════════════════════════════════════════════════════════
  if (analysis.isPureEssay) {
    const totalQCount = std.essay.count || 5;

    // Sinh danh sách câu hỏi tự luận theo môn học
    const questions: ExamQuestion[] = [];
    const isMath = general.subject.includes("Toán");
    const isPhysics = general.subject.includes("Lí") || general.subject.includes("Vật lí");
    const isChem = general.subject.includes("Hóa");
    const isBio = general.subject.includes("Sinh");
    const isHistory = general.subject.includes("Sử");
    const isGeo = general.subject.includes("Địa");
    const isIT = general.subject.includes("Tin");

    // Điểm số phân bổ cho các câu (tổng = 10.0đ)
    let pointDist: number[] = [];
    if (totalQCount === 4) pointDist = [2.5, 2.5, 2.5, 2.5];
    else if (totalQCount === 5) pointDist = [2.0, 2.0, 2.0, 2.5, 1.5];
    else if (totalQCount === 3) pointDist = [3.0, 3.5, 3.5];
    else {
      const base = Number((10.0 / totalQCount).toFixed(1));
      pointDist = Array(totalQCount).fill(base);
      const sum = pointDist.reduce((a, b) => a + b, 0);
      pointDist[0] = Number((pointDist[0] + (10.0 - sum)).toFixed(1));
    }

    for (let i = 0; i < totalQCount; i++) {
      const qNum = i + 1;
      const pts = pointDist[i] || 2.0;
      let content = "";

      if (isMath) {
        if (i === 0) {
          content = analysis.zeroNb
            ? "Cho hai tập hợp A = {x ∈ ℝ | x² - 5x + 6 = 0} và B = {x ∈ ℝ | |x - 1| ≤ 2}. Hãy tìm các tập hợp A ∩ B, A ∪ B và A \\ B. Biểu diễn tập nghiệm của B trên trục số."
            : "Cho tập hợp A = {x ∈ ℝ | -3 ≤ x < 5} và B = (0; +∞). Xác định các tập hợp A ∩ B và A ∪ B.";
        } else if (i === 1) {
          content =
            "Giải hệ bất phương trình bậc nhất hai ẩn sau trên mặt phẳng tọa độ Oxy: { 2x + y ≤ 4; x - y ≥ -1; x ≥ 0; y ≥ 0 }. Xác định các đỉnh của miền nghiệm đa giác.";
        } else if (i === 2) {
          content =
            "Cho tam giác ABC có AB = 6 cm, AC = 8 cm và góc A = 120°. Tính độ dài cạnh BC, diện tích tam giác ABC và bán kính đường tròn ngoại tiếp R của tam giác.";
        } else if (i === 3) {
          content =
            "Một phân xưởng sản xuất hai loại sản phẩm A và B. Mỗi tấn sản phẩm A cần 2 giờ làm việc của máy M1 và 3 giờ của máy M2, đem lại lợi nhuận 4 triệu đồng. Mỗi tấn sản phẩm B cần 3 giờ làm việc của máy M1 và 1 giờ của máy M2, đem lại lợi nhuận 3 triệu đồng. Biết máy M1 hoạt động tối đa 12 giờ/ngày và máy M2 tối đa 9 giờ/ngày. Hãy lập mô hình toán học và tính số tấn mỗi loại cần sản xuất để đạt lợi nhuận lớn nhất trong một ngày.";
        } else {
          content =
            "Cho các số thực dương a, b, c thỏa mãn a + b + c = 3. Chứng minh rằng: a/(1 + b²) + b/(1 + c²) + c/(1 + a²) ≥ 3/2. Dấu bằng xảy ra khi nào?";
        }
      } else if (isPhysics) {
        if (i === 0) {
          content =
            "Một ô tô đang chuyển động thẳng đều với vận tốc 72 km/h thì người lái xe hãm phanh, xe chuyển động chậm dần đều và dừng lại sau khi đi được quãng đường 50 m. Tính gia tốc của xe và thời gian kể từ lúc hãm phanh đến khi xe dừng lại hoàn toàn.";
        } else if (i === 1) {
          content =
            "Một vật có khối lượng m = 2 kg được kéo trượt trên mặt sàn nằm ngang bởi một lực kéo F = 10 N hợp với phương ngang một góc α = 30°. Biết hệ số ma sát trượt giữa vật và sàn là μ = 0,2; lấy g = 9,8 m/s². Hãy vẽ hình biểu diễn các lực tác dụng lên vật và tính gia tốc chuyển động của vật.";
        } else if (i === 2) {
          content =
            "Từ độ cao h = 20 m so với mặt đất, một vật khối lượng m = 500 g được ném thẳng đứng lên cao với vận tốc ban đầu v₀ = 15 m/s. Bỏ qua sức cản không khí, lấy g = 10 m/s², chọn gốc thế năng tại mặt đất. Tính: a) Cơ năng của vật; b) Độ cao cực đại mà vật đạt được; c) Vận tốc của vật ngay trước khi chạm đất.";
        } else {
          content =
            "Một lò xo có độ cứng k = 100 N/m được treo thẳng đứng. Đầu dưới gắn vật m = 250 g. Kéo vật xuống dưới vị trí cân bằng 4 cm rồi thả nhẹ không vận tốc đầu. Tính cơ năng dao động và tốc độ cực đại của vật trong quá trình chuyển động.";
        }
      } else if (isChem) {
        if (i === 0) {
          content =
            "Hòa tan hoàn toàn 8,4 gam sắt (Fe) vào dung dịch axit clohiđric (HCl) dư thu được muối sắt(II) clorua và khí hiđro (H₂). a) Viết phương trình hóa học của phản ứng; b) Tính thể tích khí H₂ thu được ở điều kiện chuẩn (25°C, 1 bar); c) Tính khối lượng muối sắt(II) clorua tạo thành.";
        } else if (i === 1) {
          content =
            "Cho 100 ml dung dịch NaOH 1M tác dụng vừa đủ với 100 ml dung dịch H₂SO₄ nồng độ a (M). Xác định giá trị của a và tính nồng độ mol của muối tạo thành trong dung dịch sau phản ứng (coi thể tích dung dịch thay đổi không đáng kể).";
        } else {
          content =
            "Đốt cháy hoàn toàn 4,4 gam một hợp chất hữu cơ X (gồm C, H, O) thu được 8,8 gam CO₂ và 3,6 gam H₂O. Biết tỉ khối hơi của X so với khí hiđro bằng 44. Xác định công thức phân tử và viết công thức cấu tạo của X.";
        }
      } else if (isBio) {
        if (i === 0) {
          content =
            "Trình bày cấu trúc và chức năng của phân tử ADN. Tại sao nói ADN có tính đặc thù và đa dạng?";
        } else if (i === 1) {
          content =
            "So sánh quá trình nguyên phân và giảm phân về: vị trí xảy ra, số lần nhân đôi NST, số lần phân chia và kết quả tạo tế bào con.";
        } else {
          content =
            "Một gen có chiều dài 4080 Å và có số liên kết hiđro là 3120. Hãy tính: a) Tổng số nuclêôtit của gen; b) Số lượng từng loại nuclêôtit của gen; c) Khối lượng phân tử của gen.";
        }
      } else if (isHistory || isGeo) {
        if (i === 0) {
          content =
            "Phân tích nguyên nhân thắng lợi và ý nghĩa lịch sử của Cách mạng Tháng Tám năm 1945 đối với dân tộc Việt Nam và phong trào giải phóng dân tộc trên thế giới.";
        } else if (i === 1) {
          content =
            "Nêu đặc điểm vị trí địa lí và phạm vi lãnh thổ nước ta. Phân tích ảnh hưởng của vị trí địa lí đối với sự phát triển kinh tế - xã hội và quốc phòng an ninh.";
        } else {
          content =
            "Từ bài học lịch sử, hãy rút ra bài học kinh nghiệm về việc phát huy sức mạnh khối đại đoàn kết toàn dân trong công cuộc xây dựng và bảo vệ Tổ quốc hiện nay.";
        }
      } else if (isIT) {
        if (i === 0) {
          content =
            "Viết thuật toán (bằng sơ đồ khối hoặc mã giả) nhập vào một số nguyên dương N và kiểm tra xem N có phải là số nguyên tố hay không.";
        } else if (i === 1) {
          content =
            "Cho mảng A gồm N số nguyên. Hãy viết chương trình bằng ngôn ngữ Python để: a) Tính tổng các phần tử chẵn trong mảng; b) Tìm giá trị lớn nhất trong mảng và chỉ số của nó.";
        } else {
          content =
            "Trình bày khái niệm cơ sở dữ liệu quan hệ và khóa chính (Primary Key). Cho một ví dụ về bảng thông tin học sinh và chỉ rõ thuộc tính nào nên chọn làm khóa chính, giải thích vì sao.";
        }
      } else {
        // Môn chung
        content = `Câu hỏi tự luận ${qNum}: Dựa trên kiến thức bài học môn ${general.subject} (${spec.rows[i]?.knowledgeUnit || "nội dung trọng tâm"}), hãy phân tích, chứng minh và trình bày chi tiết lời giải cho vấn đề được nêu.`;
      }

      questions.push({
        id: `essay-q${qNum}`,
        questionNumber: qNum,
        type: "essay",
        content,
        points: pts,
      });
    }

    return {
      header: {
        department: general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
        schoolName: general.schoolName || "TRƯỜNG THPT CHU VĂN AN",
        examTitle: `ĐỀ KIỂM TRA TỰ LUẬN ${general.examType.toUpperCase()}`,
        subject: general.subject,
        grade: general.grade,
        duration: general.duration,
        schoolYear: "2025 - 2026",
      },
      totalPoints: 10.0,
      parts: [
        {
          partTitle: "PHẦN BÀI TẬP TỰ LUẬN (10,0 ĐIỂM)",
          description: "Thí sinh trình bày chi tiết lời giải, các bước lập luận và kết quả vào giấy làm bài.",
          totalPoints: 10.0,
          questions,
        },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // C.2: TRƯỜNG HỢP CÓ TRẮC NGHIỆM (CHỈ SINH CÁC PHẦN CÓ COUNT > 0)
  // ═══════════════════════════════════════════════════════════════════════════
  const parts: ExamPart[] = [];
  let currentQNum = 1;

  // PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (Chỉ sinh nếu multipleChoice.count > 0)
  if (std.multipleChoice.count > 0) {
    const mcQuestions: ExamQuestion[] = [];
    const mcCount = Math.min(std.multipleChoice.count, 12);
    const ptsPerMC = Number(((std.multipleChoice.points || 3.0) / mcCount).toFixed(2));

    const sampleMC = [
      {
        content: "Trong các câu sau, câu nào là một mệnh đề toán học?",
        options: [
          { key: "A", text: "15 là số nguyên tố." },
          { key: "B", text: "Trời hôm nay đẹp quá!" },
          { key: "C", text: "Bạn đã làm bài tập chưa?" },
          { key: "D", text: "x + 2 > 5." },
        ],
      },
      {
        content: "Cho tập hợp A = {x ∈ ℝ | x² - 4 = 0}. Số phần tử của tập hợp A là:",
        options: [
          { key: "A", text: "0" },
          { key: "B", text: "1" },
          { key: "C", text: "2" },
          { key: "D", text: "4" },
        ],
      },
      {
        content: "Cặp số nào sau đây là một nghiệm của bất phương trình 2x - 3y + 6 > 0?",
        options: [
          { key: "A", text: "(0; 0)" },
          { key: "B", text: "(-4; 0)" },
          { key: "C", text: "(1; 5)" },
          { key: "D", text: "(-5; -2)" },
        ],
      },
      {
        content: "Cho tam giác ABC có góc A = 60°, b = 5, c = 8. Độ dài cạnh a bằng:",
        options: [
          { key: "A", text: "7" },
          { key: "B", text: "√129" },
          { key: "C", text: "√49" },
          { key: "D", text: "6" },
        ],
      },
    ];

    for (let i = 0; i < mcCount; i++) {
      const sample = sampleMC[i % sampleMC.length];
      mcQuestions.push({
        id: `mc-q${currentQNum}`,
        questionNumber: currentQNum++,
        type: "multipleChoice",
        content: sample.content,
        options: sample.options,
        points: ptsPerMC,
      });
    }

    parts.push({
      partTitle: `PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (${(std.multipleChoice.points || 3.0).toFixed(1).replace(".", ",")} điểm)`,
      description: `Thí sinh trả lời từ Câu 1 đến Câu ${mcCount}. Mỗi câu hỏi chỉ chọn một phương án đúng duy nhất.`,
      totalPoints: std.multipleChoice.points || 3.0,
      questions: mcQuestions,
    });
  }

  // PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (Chỉ sinh nếu trueFalse.count > 0)
  if (std.trueFalse.count > 0) {
    const tfQuestions: ExamQuestion[] = [];
    const tfCount = Math.min(std.trueFalse.count, 4);
    const ptsPerTF = Number(((std.trueFalse.points || 4.0) / tfCount).toFixed(1));

    const sampleTF = [
      {
        content: "Cho tam giác ABC có AB = 6, AC = 8, góc A = 120°. Xét tính Đúng/Sai của các khẳng định sau:",
        subQuestions: [
          { label: "a)", text: "Độ dài cạnh BC = 2√37." },
          { label: "b)", text: "Diện tích tam giác ABC bằng 12√3." },
          { label: "c)", text: "Bán kính đường tròn ngoại tiếp R = (2√37)/3." },
          { label: "d)", text: "Độ dài đường cao kẻ từ đỉnh A là ha = (12√3)/√37." },
        ],
      },
      {
        content: "Cho hệ bất phương trình { x + y ≤ 4; 2x - y ≥ -1; x ≥ 0; y ≥ 0 }. Xét tính Đúng/Sai:",
        subQuestions: [
          { label: "a)", text: "Miền nghiệm của hệ là một miền đa giác lồi." },
          { label: "b)", text: "Điểm M(1; 2) thuộc miền nghiệm của hệ." },
          { label: "c)", text: "Giá trị lớn nhất của biểu thức F(x; y) = 3x + 2y trên miền nghiệm là 12." },
          { label: "d)", text: "Điểm (4; 0) là một đỉnh của miền nghiệm đa giác." },
        ],
      },
    ];

    for (let i = 0; i < tfCount; i++) {
      const sample = sampleTF[i % sampleTF.length];
      tfQuestions.push({
        id: `tf-q${currentQNum}`,
        questionNumber: currentQNum++,
        type: "trueFalse",
        content: sample.content,
        subQuestions: sample.subQuestions,
        points: ptsPerTF,
      });
    }

    parts.push({
      partTitle: `PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI (${(std.trueFalse.points || 4.0).toFixed(1).replace(".", ",")} điểm)`,
      description: "Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng (Đ) hoặc Sai (S).",
      totalPoints: std.trueFalse.points || 4.0,
      questions: tfQuestions,
    });
  }

  // PHẦN III: TRẢ LỜI NGẮN (Chỉ sinh nếu shortAnswer.count > 0)
  if (std.shortAnswer.count > 0) {
    const saQuestions: ExamQuestion[] = [];
    const saCount = Math.min(std.shortAnswer.count, 6);
    const ptsPerSA = Number(((std.shortAnswer.points || 2.0) / saCount).toFixed(2));

    const sampleSA = [
      {
        content:
          "Một xưởng sản xuất 2 loại sản phẩm I và II. Sản xuất 1 tấn loại I cần máy A chạy 3 giờ, máy B chạy 1 giờ, lãi 4 triệu đồng. Sản xuất 1 tấn loại II cần máy A chạy 1 giờ, máy B chạy 1 giờ, lãi 3 triệu đồng. Biết máy A chạy tối đa 9 giờ/ngày, máy B tối đa 5 giờ/ngày. Hãy tính lợi nhuận lớn nhất xưởng đạt được trong 1 ngày (triệu đồng).",
      },
      {
        content:
          "Từ hai vị trí A và B cách nhau 800m trên bờ biển, hai người quan sát một con tàu C ngoài khơi dưới các góc 70° và 65° so với đoạn AB. Khoảng cách từ tàu C đến vị trí A bằng bao nhiêu mét (làm tròn đến hàng đơn vị)?",
      },
    ];

    for (let i = 0; i < saCount; i++) {
      const sample = sampleSA[i % sampleSA.length];
      saQuestions.push({
        id: `sa-q${currentQNum}`,
        questionNumber: currentQNum++,
        type: "shortAnswer",
        content: sample.content,
        points: ptsPerSA,
      });
    }

    parts.push({
      partTitle: `PHẦN III. CÂU TRẢ LỜI NGẮN (${(std.shortAnswer.points || 2.0).toFixed(1).replace(".", ",")} điểm)`,
      description: "Thí sinh điền kết quả hoặc đáp số vào phiếu trả lời.",
      totalPoints: std.shortAnswer.points || 2.0,
      questions: saQuestions,
    });
  }

  // PHẦN IV: TỰ LUẬN (Chỉ sinh nếu essay.count > 0)
  if (std.essay.count > 0) {
    const essayQuestions: ExamQuestion[] = [];
    const essayCount = std.essay.count;
    const ptsPerEssay = Number(((std.essay.points || 1.0) / essayCount).toFixed(1));

    for (let i = 0; i < essayCount; i++) {
      essayQuestions.push({
        id: `essay-part-q${currentQNum}`,
        questionNumber: currentQNum++,
        type: "essay",
        content: `Bài toán tự luận ${i + 1}: Cho hàm số hoặc mô hình thực tế thuộc chủ đề môn ${general.subject}. Hãy lập luận, biến đổi toán học và giải quyết trọn vẹn yêu cầu bài toán.`,
        points: ptsPerEssay,
      });
    }

    parts.push({
      partTitle: `PHẦN IV. CÂU HỎI TỰ LUẬN (${(std.essay.points || 1.0).toFixed(1).replace(".", ",")} điểm)`,
      description: "Thí sinh trình bày chi tiết lời giải vào giấy làm bài.",
      totalPoints: std.essay.points || 1.0,
      questions: essayQuestions,
    });
  }

  return {
    header: {
      department: general.department || "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
      schoolName: general.schoolName || "TRƯỜNG THPT CHU VĂN AN",
      examTitle: `ĐỀ KIỂM TRA ĐỊNH KỲ ${general.examType.toUpperCase()}`,
      subject: general.subject,
      grade: general.grade,
      duration: general.duration,
      schoolYear: "2025 - 2026",
    },
    totalPoints: 10.0,
    parts,
  };
}

// ─── STEP 4: SMART ANSWERS GENERATOR ──────────────────────────────────────────
export function generateSmartAnswers(
  config: FullExamState,
  exam: ExamData
): AnswerData {
  return {
    title: `ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT - ${exam.header.examTitle}`,
    totalPoints: 10.0,
    parts: exam.parts.map((part) => ({
      partTitle: part.partTitle,
      items: part.questions.map((q) => {
        if (q.type === "multipleChoice") {
          return {
            questionNumber: `Câu ${q.questionNumber}`,
            solutionSummary: "Đáp án đúng: A",
            points: q.points,
            note: "Mỗi đáp án đúng được trọn điểm.",
          };
        }
        if (q.type === "trueFalse") {
          return {
            questionNumber: `Câu ${q.questionNumber}`,
            solutionSummary: "a) Đúng | b) Đúng | c) Sai | d) Đúng",
            points: q.points,
            note: "Đúng 1 ý: 0.1đ | Đúng 2 ý: 0.25đ | Đúng 3 ý: 0.5đ | Đúng 4 ý: 1.0đ",
          };
        }
        if (q.type === "shortAnswer") {
          return {
            questionNumber: `Câu ${q.questionNumber}`,
            solutionSummary: "Đáp số: 16 (triệu đồng) / 1024 (mét)",
            points: q.points,
            note: "Học sinh điền đúng số nguyên hoặc làm tròn theo yêu cầu.",
          };
        }
        // Essay
        return {
          questionNumber: `Câu ${q.questionNumber}`,
          solutionSummary:
            "Lời giải tự luận đạt chuẩn: Nêu đúng giả thiết, công thức áp dụng; trình bày các bước lập luận logic, tính toán chính xác và kết luận đầy đủ đơn vị.",
          points: q.points,
          note: "Chấm điểm từng bước theo barem: Đặt điều kiện & công thức (40%), Tính toán biến đổi (40%), Kết luận & biện luận (20%).",
        };
      }),
    })),
  };
}

// ─── STEP 5: SMART DETAIL GUIDE GENERATOR ─────────────────────────────────────
export function generateSmartDetailGuide(
  config: FullExamState,
  exam: ExamData,
  answers: AnswerData
): DetailGuideData {
  const items: DetailGuideData["items"] = [];

  exam.parts.forEach((part) => {
    part.questions.forEach((q) => {
      const isEssay = q.type === "essay";
      items.push({
        questionNumber: `Câu ${q.questionNumber} (${part.partTitle.split(".")[0]})`,
        questionExcerpt: q.content.length > 120 ? q.content.slice(0, 120) + "..." : q.content,
        answer:
          q.type === "multipleChoice"
            ? "Phương án A"
            : q.type === "trueFalse"
            ? "a) Đ, b) Đ, c) S, d) Đ"
            : isEssay
            ? "Lời giải tự luận chi tiết theo các bước sư phạm"
            : "Đáp số chính xác theo yêu cầu",
        detailedSolution: isEssay
          ? `• Bước 1: Nêu điều kiện xác định và phân tích giả thiết bài toán.\n• Bước 2: Thiết lập hệ thức toán học / áp dụng định lý chuyên môn để biến đổi và giải quyết từng yêu cầu.\n• Bước 3: Đối chiếu điều kiện, biện luận kết quả và kết luận nghiệm/đáp số đầy đủ.`
          : `1. Bước 1: Phân tích giả thiết và xác định công thức/nguyên lý áp dụng.\n2. Bước 2: Biến đổi toán học / lập luận ngữ nghĩa: áp dụng trực tiếp định lý, thay số tính toán cẩn thận.\n3. Bước 3: Đối chiếu điều kiện xác định và kết luận chính xác.`,
        knowledgeUsed: `Đơn vị kiến thức chuẩn SGK thuộc môn ${config.general.subject} lớp ${config.general.grade} (${config.general.textbook}).`,
        commonMistakes: isEssay
          ? `Học sinh thường quên đặt điều kiện xác định, lập luận thiếu chặt chẽ ở các bước biến đổi trung gian hoặc quên kết luận kèm đơn vị.`
          : `Học sinh thường nhầm lẫn giữa điều kiện cần và đủ, quên đổi đơn vị hoặc tính toán nhầm dấu khi biến đổi biểu thức.`,
        rubric: [
          {
            criterion: "Nêu đúng công thức / nhận diện đúng kiến thức",
            points: Number((q.points * 0.4).toFixed(2)),
          },
          {
            criterion: "Biến đổi / tính toán hoặc lập luận chính xác",
            points: Number((q.points * 0.4).toFixed(2)),
          },
          {
            criterion: "Kết luận đúng và đầy đủ đơn vị",
            points: Number((q.points * 0.2).toFixed(2)),
          },
        ],
      });
    });
  });

  return {
    title: `HƯỚNG DẪN GIẢI CHI TIẾT & PHÒNG TRÁNH LỖI SAI DÀNH CHO GIÁO VIÊN`,
    items,
  };
}
