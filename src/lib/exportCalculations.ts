const sum = (values: number[]) =>
  Number(values.reduce((total, value) => total + Number(value || 0), 0).toFixed(2));

export function summarizeMatrixRows(
  rows: Array<{
    nb: number;
    th: number;
    vd: number;
    vdc: number;
    totalQuestions: number;
    totalPoints: number;
    percent: number;
  }>,
) {
  return {
    nb: sum(rows.map((row) => row.nb)),
    th: sum(rows.map((row) => row.th)),
    vd: sum(rows.map((row) => row.vd)),
    vdc: sum(rows.map((row) => row.vdc)),
    questions: sum(rows.map((row) => row.totalQuestions)),
    points: sum(rows.map((row) => row.totalPoints)),
    percent: sum(rows.map((row) => row.percent)),
  };
}

export function summarizeSpecificationRows(rows: Array<{ points: number }>) {
  return { questions: rows.length, points: sum(rows.map((row) => row.points)) };
}

export function summarizeAnswerData(parts: Array<{ items: Array<{ points: number }> }>) {
  const items = parts.flatMap((part) => part.items);
  return { answers: items.length, points: sum(items.map((item) => item.points)) };
}
