import type {
  FullExamState,
  QuestionRow,
  SubjectStructureType,
} from "../types.ts";

export type ConfigValidationErrorCode =
  | "COGNITION_PERCENT"
  | "STRUCTURE_PERCENT"
  | "STRUCTURE_POINTS"
  | "QUESTION_COUNT"
  | "QUESTION_WEIGHT";

export interface ConfigValidationError {
  code: ConfigValidationErrorCode;
  field: "cognition" | "structure";
  message: string;
}

export interface ExamConfigValidation {
  isValid: boolean;
  cognition: {
    totalPercent: number;
    isValid: boolean;
  };
  structure: {
    type: SubjectStructureType;
    totalCount: number;
    totalPercent: number;
    totalPoints: number;
    isValid: boolean;
  };
  errors: ConfigValidationError[];
}

function activeRows(config: FullExamState): QuestionRow[] {
  const { structure } = config;

  if (structure.type === "language") {
    return Object.values(structure.language);
  }

  if (structure.type === "literature") {
    return [
      structure.literature.readingComprehension,
      structure.literature.writingComposition,
    ];
  }

  return Object.values(structure.standard);
}

const add = (values: number[]) =>
  Number(values.reduce((total, value) => total + Number(value || 0), 0).toFixed(2));

const equals = (left: number, right: number) => Math.abs(left - right) < 0.001;

export function validateExamConfig(config: FullExamState): ExamConfigValidation {
  const errors: ConfigValidationError[] = [];
  const cognitionTotal = add([
    config.cognition.nb,
    config.cognition.th,
    config.cognition.vd,
    config.cognition.vdc,
  ]);
  const rows = activeRows(config);
  const totalCount = add(rows.map((row) => row.count));
  const totalPercent = add(rows.map((row) => row.percent));
  const totalPoints = add(rows.map((row) => row.points));

  if (!equals(cognitionTotal, 100)) {
    errors.push({
      code: "COGNITION_PERCENT",
      field: "cognition",
      message: `Tổng mức độ nhận thức phải bằng 100% (hiện tại ${cognitionTotal}%).`,
    });
  }

  if (!equals(totalPercent, 100)) {
    errors.push({
      code: "STRUCTURE_PERCENT",
      field: "structure",
      message: `Tổng tỷ lệ câu hỏi phải bằng 100% (hiện tại ${totalPercent}%).`,
    });
  }

  if (!equals(totalPoints, 10)) {
    errors.push({
      code: "STRUCTURE_POINTS",
      field: "structure",
      message: `Tổng điểm phải bằng 10 (hiện tại ${totalPoints} điểm).`,
    });
  }

  const hasInvalidCount = rows.some(
    (row) =>
      !Number.isInteger(Number(row.count)) ||
      Number(row.count) < 0 ||
      (Number(row.percent) > 0 && Number(row.count) === 0),
  );
  if (hasInvalidCount) {
    errors.push({
      code: "QUESTION_COUNT",
      field: "structure",
      message: "Số câu phải là số nguyên không âm và phải lớn hơn 0 khi có tỷ lệ điểm.",
    });
  }

  const hasInvalidWeight = rows.some(
    (row) =>
      Number(row.percent) < 0 ||
      Number(row.points) < 0 ||
      (Number(row.count) > 0 && Number(row.percent) === 0),
  );
  if (hasInvalidWeight) {
    errors.push({
      code: "QUESTION_WEIGHT",
      field: "structure",
      message: "Dạng câu hỏi có số câu phải được phân bổ tỷ lệ và điểm hợp lệ.",
    });
  }

  const cognitionValid = !errors.some((error) => error.field === "cognition");
  const structureValid = !errors.some((error) => error.field === "structure");

  return {
    isValid: cognitionValid && structureValid,
    cognition: {
      totalPercent: cognitionTotal,
      isValid: cognitionValid,
    },
    structure: {
      type: config.structure.type,
      totalCount,
      totalPercent,
      totalPoints,
      isValid: structureValid,
    },
    errors,
  };
}

