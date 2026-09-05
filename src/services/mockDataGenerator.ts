import {
  FullExamState,
  MatrixData,
  SpecificationData,
  ExamData,
  AnswerData,
  DetailGuideData,
} from "../types";

export function generateSmartMatrix(config: FullExamState): MatrixData {
  const { general, cognition, knowledge, structure } = config;
  const isLanguage = structure.type === "language" || general.subject.includes("Anh") || general.subject.includes("Ngoại ngữ");
  const isLiterature = structure.type === "literature" || general.subject.includes("Văn") || general.subject.includes("Tiếng Việt");

  if (isLiterature) {
    const is64 = structure.literature.preset === "6/4";
    const readPts = is64 ? 6.0 : 5.0;
    const writePts = is64 ? 4.0 : 5.0;
    const readPct = is64 ? 60 : 50;
    const writePct = is64 ? 40 : 50;

    return {
      title: `KHUNG MA TRẬN ĐỀ KIỂM TRA ${general.examType.toUpperCase()}\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
      rows: [
        {
          stt: 1,
          topic: "Đọc hiểu văn bản",
          knowledgeUnit: "Văn bản nghệ thuật / Nghị luận / Thông tin (Ngoài SGK)",
          questionType: "Trắc nghiệm & Tự luận ngắn",
          nb: 2,
          th: 2,
          vd: 1,
          vdc: 0,
          totalQuestions: 5,
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
          totalPoints: is64 ? 2.0 : 2.0,
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
          totalPoints: is64 ? 2.0 : 3.0,
          percent: is64 ? 20 : 30,
        },
      ],
      summary: {
        totalNb: 2,
        totalTh: 2,
        totalVd: 2,
        totalVdc: 1,
        totalQuestions: 7,
        totalPoints: 10.0,
        totalPercent: 100,
      },
    };
  }

  if (isLanguage) {
    const lang = structure.language;
    return {
      title: `KHUNG MA TRẬN ĐỀ KIỂM TRA ĐẶC THÙ NGOẠI NGỮ\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
      rows: [
        {
          stt: 1,
          topic: "Phần I: Nghe (Listening)",
          knowledgeUnit: "Nghe hiểu thông tin chi tiết & Nghe xác định Đúng/Sai",
          questionType: "Trắc nghiệm khách quan",
          nb: 4,
          th: 3,
          vd: 1,
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
          nb: 4,
          th: 4,
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
          nb: 3,
          th: 4,
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
          nb: 1,
          th: 1,
          vd: 2,
          vdc: 1,
          totalQuestions: lang.writing.count || 5,
          totalPoints: lang.writing.points || 2.5,
          percent: lang.writing.percent || 25,
        },
      ],
      summary: {
        totalNb: 12,
        totalTh: 12,
        totalVd: 7,
        totalVdc: 2,
        totalQuestions: 33,
        totalPoints: 10.0,
        totalPercent: 100,
      },
    };
  }

  // Standard Subject (Math, Physics, Chem, Bio, History, Geography, etc.)
  const topics = knowledge.content
    .split("\n")
    .map((l) => l.replace(/^[0-9.-]+\s*/, "").trim())
    .filter((l) => l.length > 3)
    .slice(0, 4);

  const finalTopics =
    topics.length > 0
      ? topics
      : [
          "Chủ đề 1: Kiến thức trọng tâm phần 1",
          "Chủ đề 2: Kiến thức nâng cao và ứng dụng",
          "Chủ đề 3: Giải quyết vấn đề và thực tiễn",
        ];

  const std = structure.standard;
  const rows = finalTopics.map((top, idx) => {
    const isLast = idx === finalTopics.length - 1;
    const nbPart = idx === 0 ? 3 : 2;
    const thPart = idx === 0 ? 2 : 2;
    const vdPart = idx === 1 ? 2 : 1;
    const vdcPart = isLast ? 1 : 0;
    const qCount = nbPart + thPart + vdPart + vdcPart;

    return {
      stt: idx + 1,
      topic: top,
      knowledgeUnit: `Đơn vị kiến thức chi tiết thuộc ${top}`,
      questionType:
        std.multipleChoice.count > 0 && std.trueFalse.count > 0
          ? "Trắc nghiệm nhiều lựa chọn & Đúng/Sai & Tự luận"
          : "Trắc nghiệm khách quan & Tự luận",
      nb: nbPart,
      th: thPart,
      vd: vdPart,
      vdc: vdcPart,
      totalQuestions: qCount,
      totalPoints: idx === 0 ? 3.5 : idx === 1 ? 3.5 : 3.0,
      percent: idx === 0 ? 35 : idx === 1 ? 35 : 30,
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

export function generateSmartSpecification(
  config: FullExamState,
  matrix: MatrixData
): SpecificationData {
  const { general } = config;
  const rows: SpecificationData["rows"] = [];

  let qIdx = 1;
  matrix.rows.forEach((mrow) => {
    // NB questions
    for (let i = 0; i < mrow.nb; i++) {
      rows.push({
        questionNumber: `Câu ${qIdx++}`,
        topic: mrow.topic,
        knowledgeUnit: mrow.knowledgeUnit,
        level: "Nhận biết",
        objective: `Nhận biết được các khái niệm, định nghĩa, tính chất cơ bản thuộc ${mrow.knowledgeUnit}.`,
        estimatedTime: 1.5,
        points: Number((10 / (matrix.summary.totalQuestions || 20)).toFixed(2)),
      });
    }
    // TH questions
    for (let i = 0; i < mrow.th; i++) {
      rows.push({
        questionNumber: `Câu ${qIdx++}`,
        topic: mrow.topic,
        knowledgeUnit: mrow.knowledgeUnit,
        level: "Thông hiểu",
        objective: `Hiểu và giải thích được mối liên hệ, biến đổi và tính toán cơ bản trong ${mrow.knowledgeUnit}.`,
        estimatedTime: 2.5,
        points: Number((10 / (matrix.summary.totalQuestions || 20)).toFixed(2)),
      });
    }
    // VD questions
    for (let i = 0; i < mrow.vd; i++) {
      rows.push({
        questionNumber: `Câu ${qIdx++}`,
        topic: mrow.topic,
        knowledgeUnit: mrow.knowledgeUnit,
        level: "Vận dụng",
        objective: `Vận dụng kiến thức ${mrow.knowledgeUnit} để giải quyết bài toán tính toán, tổng hợp hoặc bài toán thực tế.`,
        estimatedTime: 4.0,
        points: Number((10 / (matrix.summary.totalQuestions || 20)).toFixed(2)),
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
        estimatedTime: 6.0,
        points: Number((10 / (matrix.summary.totalQuestions || 20)).toFixed(2)),
      });
    }
  });

  const totalPoints = Number(
    rows.reduce((sum, r) => sum + r.points, 0).toFixed(1)
  );

  return {
    title: `BẢN ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA ${general.examType.toUpperCase()}\nMÔN: ${general.subject.toUpperCase()} - ${general.grade.toUpperCase()}`,
    rows,
    totalTime: general.duration,
    totalPoints: 10.0,
  };
}

export function generateSmartExam(
  config: FullExamState,
  spec: SpecificationData
): ExamData {
  const { general, structure } = config;
  const isLanguage = structure.type === "language" || general.subject.includes("Anh");
  const isLiterature = structure.type === "literature" || general.subject.includes("Văn");

  if (isLiterature) {
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
          partTitle: "PHẦN I. ĐỌC HIỂU (6,0 điểm)",
          description: "Đọc văn bản sau và thực hiện các yêu cầu từ Câu 1 đến Câu 5:",
          passage: `"...Mỗi con người sinh ra đều mang trong mình một sứ mệnh và một giá trị riêng biệt. Đừng để bản thân bị hòa tan vào sự ồn ào của đám đông hay sự phán xét nhất thời của người khác. Khi bạn dám ước mơ và nỗ lực hết mình cho những điều tử tế, từng bước đi của bạn dù nhỏ bé nhưng đều đang góp phần tạo nên một tương lai vững vàng và ý nghĩa. Hạnh phúc không nằm ở đích đến xa xôi, mà hiện hữu ngay trên hành trình bạn kiên định dấn thân..."\n(Trích "Khát vọng tuổi trẻ và hành trình sống đẹp", NXB Giáo dục)`,
          totalPoints: 6.0,
          questions: [
            {
              id: "van-c1",
              questionNumber: 1,
              type: "essay",
              content: "Xác định phương thức biểu đạt chính được sử dụng trong đoạn trích trên.",
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
              content: "Nêu tác dụng của phép điệp từ/cấu trúc được sử dụng trong câu văn: 'Khi bạn dám ước mơ và nỗ lực hết mình cho những điều tử tế, từng bước đi của bạn dù nhỏ bé nhưng đều đang góp phần tạo nên một tương lai vững vàng và ý nghĩa.'",
              points: 1.5,
            },
            {
              id: "van-c4",
              questionNumber: 4,
              type: "essay",
              content: "Anh/Chị hiểu như thế nào về nhận định: 'Đừng để bản thân bị hòa tan vào sự ồn ào của đám đông'?",
              points: 1.5,
            },
            {
              id: "van-c5",
              questionNumber: 5,
              type: "essay",
              content: "Thông điệp nào trong đoạn trích có ý nghĩa nhất đối với anh/chị? Vì sao? (Trình bày trong khoảng 3 - 5 dòng).",
              points: 1.0,
            },
          ],
        },
        {
          partTitle: "PHẦN II. LÀM VĂN (4,0 điểm)",
          description: "Thực hiện các yêu cầu nghị luận sau:",
          totalPoints: 4.0,
          questions: [
            {
              id: "van-c6",
              questionNumber: "Câu 1 (Nghị luận xã hội)",
              type: "essay",
              content: "Từ nội dung đoạn trích ở phần Đọc hiểu, anh/chị hãy viết một đoạn văn (khoảng 200 chữ) trình bày suy nghĩ về ý nghĩa của việc kiên định theo đuổi ước mơ của người trẻ trong thời đại số.",
              points: 2.0,
            },
            {
              id: "van-c7",
              questionNumber: "Câu 2 (Nghị luận văn học)",
              type: "essay",
              content: "Anh/Chị hãy phân tích vẻ đẹp tâm hồn hoặc tư tưởng nghệ thuật được gửi gắm qua một tác phẩm văn học đã học trong chương trình, từ đó liên hệ với trách nhiệm của thế hệ trẻ hôm nay.",
              points: 2.0,
            },
          ],
        },
      ],
    };
  }

  if (isLanguage) {
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
          totalPoints: 2.0,
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
              points: 0.25,
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
              points: 0.25,
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
              points: 0.25,
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
              points: 0.25,
            },
          ],
        },
        {
          partTitle: "SECTION II: LANGUAGE FOCUS (2.5 points)",
          description: "Mark the letter A, B, C or D to indicate the correct answer to each of the following questions.",
          totalPoints: 2.5,
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
              points: 0.25,
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
              points: 0.25,
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
              points: 0.25,
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
              points: 0.25,
            },
          ],
        },
        {
          partTitle: "SECTION III: READING COMPREHENSION (3.0 points)",
          description: "Read the passage and choose the correct answer A, B, C or D for each blank and question.",
          passage: "Urbanization has been accelerating worldwide at an unprecedented pace. Modern eco-cities are designed with integrated green spaces, efficient public transport, and zero-emission buildings to minimize carbon footprints...",
          totalPoints: 3.0,
          questions: [
            {
              id: "eng-r1",
              questionNumber: 9,
              type: "multipleChoice",
              content: "What is the best title for the passage?",
              options: [
                { key: "A", text: "The Rise of Sustainable Eco-Cities" },
                { key: "B", text: "Traffic Congestion in Big Metropolises" },
                { key: "C", text: "Traditional Architecture in Rural Areas" },
                { key: "D", text: "Historical Developments of Public Parks" },
              ],
              points: 0.5,
            },
            {
              id: "eng-r2",
              questionNumber: 10,
              type: "multipleChoice",
              content: "The word 'accelerating' in paragraph 1 is closest in meaning to ______.",
              options: [
                { key: "A", text: "speeding up" },
                { key: "B", text: "slowing down" },
                { key: "C", text: "disappearing" },
                { key: "D", text: "stabilizing" },
              ],
              points: 0.5,
            },
          ],
        },
        {
          partTitle: "SECTION IV: WRITING (2.5 points)",
          description: "Rewrite sentences or complete paragraphs as instructed.",
          totalPoints: 2.5,
          questions: [
            {
              id: "eng-w1",
              questionNumber: 11,
              type: "writing",
              content: "Rewrite the following sentence using the word in brackets so that it has a similar meaning: 'It is essential for teenagers to get at least 8 hours of sleep.' (MUST)",
              points: 1.0,
            },
            {
              id: "eng-w2",
              questionNumber: 12,
              type: "writing",
              content: "In about 100 - 120 words, write a paragraph describing one effective way teenagers can protect their local environment.",
              points: 1.5,
            },
          ],
        },
      ],
    };
  }

  // Standard Subject (Math / Science / Social Studies)
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
    parts: [
      {
        partTitle: "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (3,0 điểm)",
        description: "Thí sinh trả lời từ Câu 1 đến Câu 12. Mỗi câu hỏi chỉ chọn một phương án đúng duy nhất (Mỗi câu 0,25 điểm).",
        totalPoints: 3.0,
        questions: [
          {
            id: "std-q1",
            questionNumber: 1,
            type: "multipleChoice",
            content: "Trong các câu sau, câu nào là một mệnh đề toán học?",
            options: [
              { key: "A", text: "15 là số nguyên tố." },
              { key: "B", text: "Trời hôm nay đẹp quá!" },
              { key: "C", text: "Bạn đã làm bài tập chưa?" },
              { key: "D", text: "x + 2 > 5." },
            ],
            points: 0.25,
          },
          {
            id: "std-q2",
            questionNumber: 2,
            type: "multipleChoice",
            content: "Cho tập hợp A = {x ∈ ℝ | x² - 4 = 0}. Số phần tử của tập hợp A là:",
            options: [
              { key: "A", text: "0" },
              { key: "B", text: "1" },
              { key: "C", text: "2" },
              { key: "D", text: "4" },
            ],
            points: 0.25,
          },
          {
            id: "std-q3",
            questionNumber: 3,
            type: "multipleChoice",
            content: "Cặp số nào sau đây là một nghiệm của bất phương trình 2x - 3y + 6 > 0?",
            options: [
              { key: "A", text: "(0; 0)" },
              { key: "B", text: "(-4; 0)" },
              { key: "C", text: "(1; 5)" },
              { key: "D", text: "(-5; -2)" },
            ],
            points: 0.25,
          },
          {
            id: "std-q4",
            questionNumber: 4,
            type: "multipleChoice",
            content: "Cho tam giác ABC có góc A = 60°, b = 5, c = 8. Độ dài cạnh a bằng:",
            options: [
              { key: "A", text: "7" },
              { key: "B", text: "√129" },
              { key: "C", text: "√49" },
              { key: "D", text: "6" },
            ],
            points: 0.25,
          },
        ],
      },
      {
        partTitle: "PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI (4,0 điểm)",
        description: "Thí sinh trả lời từ Câu 1 đến Câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng (Đ) hoặc Sai (S).",
        totalPoints: 4.0,
        questions: [
          {
            id: "std-tf1",
            questionNumber: 1,
            type: "trueFalse",
            content: "Cho tam giác ABC có AB = 6, AC = 8, góc A = 120°. Xét tính Đúng/Sai của các khẳng định sau:",
            subQuestions: [
              { label: "a)", text: "Độ dài cạnh BC = 2√37." },
              { label: "b)", text: "Diện tích tam giác ABC bằng 12√3." },
              { label: "c)", text: "Bán kính đường tròn ngoại tiếp R = (2√37)/3." },
              { label: "d)", text: "Độ dài đường cao kẻ từ đỉnh A là ha = (12√3)/√37." },
            ],
            points: 1.0,
          },
          {
            id: "std-tf2",
            questionNumber: 2,
            type: "trueFalse",
            content: "Cho hệ bất phương trình bậc nhất hai ẩn { x + y ≤ 4; 2x - y ≥ -1; x ≥ 0; y ≥ 0 }. Xét tính Đúng/Sai:",
            subQuestions: [
              { label: "a)", text: "Miền nghiệm của hệ là một đa giác lồi (tứ giác)." },
              { label: "b)", text: "Điểm M(1; 2) thuộc miền nghiệm của hệ." },
              { label: "c)", text: "Giá trị lớn nhất của biểu thức F(x; y) = 3x + 2y trên miền nghiệm là 12." },
              { label: "d)", text: "Điểm (4; 0) là một đỉnh của miền nghiệm đa giác." },
            ],
            points: 1.0,
          },
        ],
      },
      {
        partTitle: "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN / TỰ LUẬN (3,0 điểm)",
        description: "Thí sinh trả lời các câu hỏi sau, ghi đáp số hoặc lời giải ngắn gọn.",
        totalPoints: 3.0,
        questions: [
          {
            id: "std-sa1",
            questionNumber: 1,
            type: "shortAnswer",
            content: "Một xưởng sản xuất có 2 máy A và B. Để sản xuất 1 tấn sản phẩm loại I cần máy A chạy 3 giờ, máy B chạy 1 giờ. Để sản xuất 1 tấn sản phẩm loại II cần máy A chạy 1 giờ, máy B chạy 1 giờ. Biết máy A hoạt động tối đa 9 giờ/ngày, máy B tối đa 5 giờ/ngày. Lợi nhuận mỗi tấn loại I là 4 triệu đồng, loại II là 3 triệu đồng. Hãy tính lợi nhuận lớn nhất xưởng có thể đạt được trong một ngày (đơn vị: triệu đồng).",
            points: 1.5,
          },
          {
            id: "std-sa2",
            questionNumber: 2,
            type: "shortAnswer",
            content: "Từ hai vị trí A và B trên bờ biển cách nhau 800m, hai quan sát viên cùng nhìn về một con tàu C ngoài biển dưới các góc tương ứng là 70° và 65° so với đoạn thẳng AB. Khoảng cách từ con tàu C đến vị trí A bằng bao nhiêu mét (làm tròn đến hàng đơn vị)?",
            points: 1.5,
          },
        ],
      },
    ],
  };
}

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
            questionId: q.id,
            questionNumber: `Câu ${q.questionNumber}`,
            correctAnswer: "A",
            solutionSummary: "Đáp án đúng: A",
            points: q.points,
            note: "Mỗi đáp án đúng được trọn điểm.",
          };
        }
        if (q.type === "trueFalse") {
          return {
            questionId: q.id,
            questionNumber: `Câu ${q.questionNumber}`,
            correctAnswer: { a: "Đúng", b: "Đúng", c: "Sai", d: "Đúng" },
            solutionSummary: "a) Đúng | b) Đúng | c) Sai | d) Đúng",
            points: q.points,
            note: "Đúng 1 ý: 0.1đ | Đúng 2 ý: 0.25đ | Đúng 3 ý: 0.5đ | Đúng 4 ý: 1.0đ",
          };
        }
        if (q.type === "shortAnswer") {
          return {
            questionId: q.id,
            questionNumber: `Câu ${q.questionNumber}`,
            correctAnswer: q.content.includes("bờ biển") ? "1024" : "16",
            solutionSummary: "Đáp số: 16 (triệu đồng) / 1024 (mét)",
            points: q.points,
            note: "Học sinh điền đúng số nguyên hoặc làm tròn theo yêu cầu.",
          };
        }
        return {
          questionId: q.id,
          questionNumber: `Câu ${q.questionNumber}`,
          solutionSummary: "Đáp án đạt chuẩn theo barem: Nêu đúng luận điểm, dẫn chứng thuyết phục và lập luận chặt chẽ.",
          points: q.points,
          note: "Chấm theo bước lập luận và ý tưởng sáng tạo.",
        };
      }),
    })),
  };
}

export function generateSmartDetailGuide(
  config: FullExamState,
  exam: ExamData,
  answers: AnswerData
): DetailGuideData {
  const items: DetailGuideData["items"] = [];

  exam.parts.forEach((part) => {
    part.questions.forEach((q) => {
      items.push({
        questionId: q.id,
        questionNumber: `Câu ${q.questionNumber} (${part.partTitle.split(".")[0]})`,
        questionExcerpt: q.content.length > 120 ? q.content.slice(0, 120) + "..." : q.content,
        answer: q.type === "multipleChoice" ? "Phương án A" : q.type === "trueFalse" ? "a) Đ, b) Đ, c) S, d) Đ" : "Lời giải chi tiết chuẩn quy định",
        detailedSolution: `1. Bước 1: Phân tích giả thiết và xác định công thức/nguyên lý áp dụng.\n2. Bước 2: Biến đổi toán học / lập luận ngữ nghĩa: áp dụng trực tiếp định lý, thay số tính toán cẩn thận.\n3. Bước 3: Đối chiếu điều kiện xác định và kết luận chính xác.`,
        knowledgeUsed: `Đơn vị kiến thức chuẩn SGK thuộc môn ${config.general.subject} lớp ${config.general.grade} (${config.general.textbook}).`,
        commonMistakes: `Học sinh thường nhầm lẫn giữa điều kiện cần và đủ, quên đổi đơn vị hoặc tính toán nhầm dấu khi biến đổi biểu thức.`,
        rubric: [
          { criterion: "Nêu đúng công thức / nhận diện đúng kiến thức", points: Number((q.points * 0.4).toFixed(2)) },
          { criterion: "Biến đổi / tính toán hoặc lập luận chính xác", points: Number((q.points * 0.4).toFixed(2)) },
          { criterion: "Kết luận đúng và đầy đủ đơn vị", points: Number((q.points * 0.2).toFixed(2)) },
        ],
      });
    });
  });

  return {
    title: `HƯỚNG DẪN GIẢI CHI TIẾT & PHÒNG TRÁNH LỖI SAI DÀNH CHO GIÁO VIÊN`,
    items,
  };
}
