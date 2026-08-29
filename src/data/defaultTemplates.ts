import { FullExamState } from "../types";

export const initialFullExamState: FullExamState = {
  general: {
    department: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
    schoolName: "TRƯỜNG THPT CHU VĂN AN",
    examType: "Giữa kì 1",
    educationLevel: "Cấp 3 (THPT)",
    grade: "Lớp 10",
    subject: "Toán",
    textbook: "Kết nối tri thức với cuộc sống",
    duration: 90,
  },
  cognition: {
    nb: 40,
    th: 30,
    vd: 20,
    vdc: 10,
    difficulty: "Trung bình",
  },
  knowledge: {
    content: "Chương 1: Mệnh đề và tập hợp (Mệnh đề, tập hợp, các phép toán trên tập hợp).\nChương 2: Bất phương trình và hệ bất phương trình bậc nhất hai ẩn.\nChương 3: Hệ thức lượng trong tam giác (Định lí sin, định lí côsin, công thức tính diện tích tam giác).",
    attachmentName: null,
    attachmentSize: null,
    attachmentContent: null,
    additionalRequirements: "Đề thi bám sát cấu trúc mới định dạng của Bộ Giáo dục và Đào tạo: Phần 1 trắc nghiệm 4 lựa chọn (12 câu), Phần 2 Đúng/Sai (4 câu, mỗi câu 4 ý a,b,c,d), Phần 3 Trả lời ngắn (6 câu). Có 1 câu vận dụng liên hệ thực tế đo đạc khoảng cách tam giác.",
  },
  structure: {
    type: "standard",
    standard: {
      multipleChoice: { count: 12, percent: 30, points: 3.0 },
      trueFalse: { count: 4, percent: 40, points: 4.0 },
      shortAnswer: { count: 6, percent: 30, points: 3.0 },
      essay: { count: 0, percent: 0, points: 0 },
    },
    language: {
      listening: { count: 8, percent: 20, points: 2.0 },
      languageFocus: { count: 10, percent: 25, points: 2.5 },
      reading: { count: 10, percent: 30, points: 3.0 },
      writing: { count: 5, percent: 25, points: 2.5 },
    },
    literature: {
      preset: "6/4",
      readingComprehension: { count: 5, percent: 60, points: 6.0 },
      writingComposition: { count: 2, percent: 40, points: 4.0 },
    },
  },
};

export interface DefaultPresetItem {
  id: string;
  name: string;
  state: FullExamState;
}

export const defaultPresets: DefaultPresetItem[] = [
  {
    id: "preset-toan-10",
    name: "Toán 10 - Giữa kì 1 (Chuẩn GDPT 2018)",
    state: initialFullExamState,
  },
  {
    id: "preset-lit-10",
    name: "Ngữ văn 10 - Giữa kì 1 (Tỉ lệ 6/4 Đọc hiểu - Viết)",
    state: {
      ...initialFullExamState,
      general: {
        department: "SỞ GD&ĐT TP. HỒ CHÍ MINH",
        schoolName: "TRƯỜNG THPT NGUYỄN THỊ MINH KHAI",
        examType: "Giữa kì 1",
        educationLevel: "Cấp 3 (THPT)",
        grade: "Lớp 10",
        subject: "Ngữ văn",
        textbook: "Chân trời sáng tạo",
        duration: 90,
      },
      knowledge: {
        content: "Phần Đọc hiểu: Ngữ liệu ngoài SGK thuộc thể loại Thần thoại hoặc Sử thi.\nPhần Viết: Viết bài văn nghị luận xã hội về một vấn đề đời sống hoặc phân tích một đoạn trích truyện kể.",
        attachmentName: null,
        attachmentSize: null,
        attachmentContent: null,
        additionalRequirements: "Ngữ liệu đọc hiểu 300 - 450 từ, giàu giá trị nhân văn. Câu hỏi đọc hiểu gồm 4 câu (2 NB, 1 TH, 1 VD) và phần Viết gồm 1 đoạn văn (2.0đ) + 1 bài văn (4.0đ).",
      },
      structure: {
        type: "literature",
        standard: initialFullExamState.structure.standard,
        language: initialFullExamState.structure.language,
        literature: {
          preset: "6/4",
          readingComprehension: { count: 5, percent: 60, points: 6.0 },
          writingComposition: { count: 2, percent: 40, points: 4.0 },
        },
      },
    },
  },
  {
    id: "preset-english-10",
    name: "Tiếng Anh 11 - Giữa kì 1 (4 Phần chuẩn)",
    state: {
      ...initialFullExamState,
      general: {
        department: "SỞ GD&ĐT ĐÀ NẴNG",
        schoolName: "TRƯỜNG THPT PHAN CHÂU TRINH",
        examType: "Giữa kì 1",
        educationLevel: "Cấp 3 (THPT)",
        grade: "Lớp 11",
        subject: "Tiếng Anh",
        textbook: "Kết nối tri thức với cuộc sống",
        duration: 60,
      },
      knowledge: {
        content: "Unit 1: A long and healthy life (Past simple vs Present perfect, vocabulary about health and fitness).\nUnit 2: The generation gap (Modal verbs: must, have to, should, ought to).\nUnit 3: Cities of the future (Stative verbs in continuous form, linking words).",
        attachmentName: null,
        attachmentSize: null,
        attachmentContent: null,
        additionalRequirements: "Đề thi gồm 4 phần: Listening (2.0đ), Language Focus (2.5đ), Reading Comprehension (3.0đ), Writing (2.5đ - Sentence transformation & writing a paragraph).",
      },
      structure: {
        type: "language",
        standard: initialFullExamState.structure.standard,
        language: {
          listening: { count: 8, percent: 20, points: 2.0 },
          languageFocus: { count: 10, percent: 25, points: 2.5 },
          reading: { count: 10, percent: 30, points: 3.0 },
          writing: { count: 5, percent: 25, points: 2.5 },
        },
        literature: initialFullExamState.structure.literature,
      },
    },
  },
  {
    id: "preset-khtn-8",
    name: "KHTN 8 - Cuối kì 1 (Vật lí & Hóa học)",
    state: {
      ...initialFullExamState,
      general: {
        department: "PHÒNG GD&ĐT CẦU GIẤY",
        schoolName: "TRƯỜNG THCS CẦU GIẤY",
        examType: "Cuối kì 1",
        educationLevel: "Cấp 2 (THCS)",
        grade: "Lớp 8",
        subject: "Khoa học tự nhiên",
        textbook: "Cánh Diều",
        duration: 60,
      },
      knowledge: {
        content: "Phần Hóa học: Phản ứng hóa học, Mol và tỉ khối của chất khí, Dung dịch và nồng độ.\nPhần Vật lí: Khối lượng riêng và áp suất, Tác dụng làm quay của lực (Đòn bẩy).",
        attachmentName: null,
        attachmentSize: null,
        attachmentContent: null,
        additionalRequirements: "Gồm trắc nghiệm 4 lựa chọn (16 câu, 4.0đ) và tự luận (4 câu, 6.0đ) kết hợp cả bài tập tính toán và câu hỏi thực tế.",
      },
      structure: {
        type: "standard",
        standard: {
          multipleChoice: { count: 16, percent: 40, points: 4.0 },
          trueFalse: { count: 0, percent: 0, points: 0 },
          shortAnswer: { count: 0, percent: 0, points: 0 },
          essay: { count: 4, percent: 60, points: 6.0 },
        },
        language: initialFullExamState.structure.language,
        literature: initialFullExamState.structure.literature,
      },
    },
  },
];
