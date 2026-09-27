import { ExamData, AnswerData, ExamPart, ExamQuestion, AnswerPart, AnswerItem } from "../types";

export interface ShuffledVariant {
  code: string;
  exam: ExamData;
  answers: AnswerData;
}

export interface AnswerComparisonRow {
  stt: number;
  questionExcerpt: string;
  keysByCode: Record<string, string>; // { "101": "A", "102": "C", ... }
}

export interface ExamShufflerResult {
  variants: ShuffledVariant[];
  comparisonMatrix: AnswerComparisonRow[];
  codes: string[];
}

// Deterministic or pseudo-random shuffle with seed
function shuffleArray<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let m = result.length;
  let s = seed;

  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const i = Math.floor(rnd * m--);
    const t = result[m];
    result[m] = result[i];
    result[i] = t;
  }
  return result;
}

export function generateExamVariants(
  baseExam: ExamData,
  baseAnswers: AnswerData,
  codes = ["101", "102", "103", "104"]
): ExamShufflerResult {
  const variants: ShuffledVariant[] = [];

  // Map original questions to their original answer items
  const baseAnswerMap = new Map<string, AnswerItem>();
  for (const part of baseAnswers.parts) {
    for (const item of part.items) {
      baseAnswerMap.set(String(item.questionNumber), item);
    }
  }

  codes.forEach((code, codeIdx) => {
    // If it's the first code (101), we can keep original or lightly format
    if (codeIdx === 0) {
      const exam101: ExamData = {
        ...baseExam,
        header: {
          ...baseExam.header,
          examTitle: `${baseExam.header.examTitle} (MÃ ĐỀ ${code})`,
        },
      };
      variants.push({
        code,
        exam: exam101,
        answers: baseAnswers,
      });
      return;
    }

    const seed = parseInt(code, 10) || (codeIdx + 1) * 12345;

    // Shuffle parts
    const newParts: ExamPart[] = [];
    const newAnswerParts: AnswerPart[] = [];

    baseExam.parts.forEach((part, partIdx) => {
      const isMultipleChoice = part.partTitle.toLowerCase().includes("trắc nghiệm") ||
        part.partTitle.toLowerCase().includes("phần i");
      const isTrueFalse = part.partTitle.toLowerCase().includes("đúng sai") ||
        part.partTitle.toLowerCase().includes("phần ii");
      const isShortAnswer = part.partTitle.toLowerCase().includes("ngắn") ||
        part.partTitle.toLowerCase().includes("phần iii");

      let shuffledQuestions = [...part.questions];
      // Shuffle question order inside this part (except if reading passage requires fixed order)
      if (!part.passage) {
        shuffledQuestions = shuffleArray(shuffledQuestions, seed + partIdx * 31);
      }

      const reindexedQuestions: ExamQuestion[] = [];
      const newAnswerItems: AnswerItem[] = [];

      shuffledQuestions.forEach((q, qIndexInPart) => {
        // Calculate new sequential question number
        let priorCount = 0;
        for (let p = 0; p < partIdx; p++) {
          priorCount += newParts[p].questions.length;
        }
        const newQNum = priorCount + qIndexInPart + 1;
        const originalQNum = String(q.questionNumber);
        const originalAns = baseAnswerMap.get(originalQNum);

        if (isMultipleChoice && q.options && q.options.length > 1) {
          // Check if any option is "Cả A, B..." or "Tất cả...", which shouldn't be shuffled
          const hasPositionDependent = q.options.some((o) =>
            o.text.toLowerCase().includes("cả a và b") ||
            o.text.toLowerCase().includes("cả 3 phương án") ||
            o.text.toLowerCase().includes("tất cả các đáp án trên")
          );

          let newOptions = [...q.options];
          if (!hasPositionDependent) {
            newOptions = shuffleArray(newOptions, seed + newQNum * 17);
          }

          // Determine which option was correct originally
          const originalSolution = (originalAns?.solutionSummary || "").trim().toUpperCase();
          const originalCorrectKey = originalSolution.match(/^([A-D])/)?.[1] || "";
          const originalCorrectOption = q.options.find((o) => o.key.toUpperCase() === originalCorrectKey);

          // Assign new keys A, B, C, D to shuffled options
          const keys = ["A", "B", "C", "D", "E", "F"];
          let newCorrectKey = originalCorrectKey;

          const finalOptions = newOptions.map((opt, optIdx) => {
            const assignedKey = keys[optIdx] || opt.key;
            if (originalCorrectOption && opt.text === originalCorrectOption.text) {
              newCorrectKey = assignedKey;
            }
            return {
              key: assignedKey,
              text: opt.text,
            };
          });

          reindexedQuestions.push({
            ...q,
            questionNumber: newQNum,
            options: finalOptions,
          });

          newAnswerItems.push({
            questionNumber: newQNum,
            solutionSummary: `${newCorrectKey}. ${originalAns?.solutionSummary?.replace(/^[A-D][.\s:)]*/, "") || ""}`,
            points: q.points,
            note: `Gốc câu ${originalQNum}`,
          });
        } else if (isTrueFalse && q.subQuestions && q.subQuestions.length > 1) {
          // For True/False, shuffle subquestions
          const shuffledSub = shuffleArray(q.subQuestions, seed + newQNum * 13);
          const labels = ["a)", "b)", "c)", "d)"];

          const finalSub = shuffledSub.map((sub, sIdx) => ({
            label: labels[sIdx] || sub.label,
            text: sub.text,
          }));

          reindexedQuestions.push({
            ...q,
            questionNumber: newQNum,
            subQuestions: finalSub,
          });

          newAnswerItems.push({
            questionNumber: newQNum,
            solutionSummary: originalAns?.solutionSummary || "",
            points: q.points,
            note: `Gốc câu ${originalQNum}`,
          });
        } else {
          // Short answer or essay: keep contents, update question number
          reindexedQuestions.push({
            ...q,
            questionNumber: newQNum,
          });

          newAnswerItems.push({
            questionNumber: newQNum,
            solutionSummary: originalAns?.solutionSummary || "",
            points: q.points,
            note: `Gốc câu ${originalQNum}`,
          });
        }
      });

      newParts.push({
        ...part,
        questions: reindexedQuestions,
      });

      newAnswerParts.push({
        partTitle: part.partTitle,
        items: newAnswerItems,
      });
    });

    const newExam: ExamData = {
      ...baseExam,
      header: {
        ...baseExam.header,
        examTitle: `${baseExam.header.examTitle} (MÃ ĐỀ ${code})`,
      },
      parts: newParts,
    };

    const newAnswers: AnswerData = {
      ...baseAnswers,
      title: `${baseAnswers.title} - MÃ ĐỀ ${code}`,
      parts: newAnswerParts,
    };

    variants.push({
      code,
      exam: newExam,
      answers: newAnswers,
    });
  });

  // Build Answer Comparison Matrix Table for quick grading
  // Row = Question STT (1, 2, 3...) of Base Exam (Code 101)
  const comparisonMatrix: AnswerComparisonRow[] = [];
  const totalBaseQuestions = baseExam.parts.reduce((s, p) => s + p.questions.length, 0);

  for (let qIdx = 1; qIdx <= totalBaseQuestions; qIdx++) {
    const keysByCode: Record<string, string> = {};
    let excerpt = "";

    variants.forEach((v) => {
      // Find item with questionNumber === qIdx in variant v
      let foundKey = "";
      for (const p of v.answers.parts) {
        const item = p.items.find((it) => Number(it.questionNumber) === qIdx);
        if (item) {
          const m = item.solutionSummary.match(/^([A-D])/i);
          foundKey = m ? m[1].toUpperCase() : item.solutionSummary.slice(0, 10);
          break;
        }
      }
      keysByCode[v.code] = foundKey || "-";
    });

    // Extract excerpt from base exam
    for (const p of baseExam.parts) {
      const q = p.questions.find((it) => Number(it.questionNumber) === qIdx);
      if (q) {
        excerpt = q.content.length > 50 ? q.content.slice(0, 50) + "..." : q.content;
        break;
      }
    }

    comparisonMatrix.push({
      stt: qIdx,
      questionExcerpt: excerpt,
      keysByCode,
    });
  }

  return {
    variants,
    comparisonMatrix,
    codes,
  };
}
