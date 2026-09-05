import assert from "node:assert/strict";
import test from "node:test";

import { gradeExamSubmission } from "../supabase/functions/_shared/grading.ts";

const objectiveExam = {
  totalPoints: 10,
  parts: [
    {
      partTitle: "Phần I",
      totalPoints: 5,
      questions: [
        {
          id: "part-1-q1",
          questionNumber: 1,
          type: "multipleChoice",
          content: "Câu thứ nhất",
          points: 5,
        },
      ],
    },
    {
      partTitle: "Phần II",
      totalPoints: 5,
      questions: [
        {
          id: "part-2-q1",
          questionNumber: 1,
          type: "shortAnswer",
          content: "Câu thứ hai cũng mang số 1",
          points: 5,
        },
      ],
    },
  ],
};

const objectiveKey = {
  totalPoints: 10,
  parts: [
    {
      partTitle: "Phần I",
      items: [
        {
          questionId: "part-1-q1",
          questionNumber: 1,
          correctAnswer: "C",
          solutionSummary: "C",
          points: 5,
        },
      ],
    },
    {
      partTitle: "Phần II",
      items: [
        {
          questionId: "part-2-q1",
          questionNumber: 1,
          correctAnswer: "16",
          solutionSummary: "16",
          points: 5,
        },
      ],
    },
  ],
};

test("chấm theo questionId dù số câu lặp lại giữa các phần", () => {
  const result = gradeExamSubmission(objectiveExam, objectiveKey, {
    "part-1-q1": "c",
    "part-2-q1": " 16 ",
  });

  assert.equal(result.earnedPoints, 10);
  assert.equal(result.scorePercent, 100);
  assert.equal(result.manualReviewRequired, false);
  assert.equal(result.partResults[0].questions[0].isCorrect, true);
  assert.equal(result.partResults[1].questions[0].isCorrect, true);
});

test("không gộp hai câu có cùng questionNumber", () => {
  const result = gradeExamSubmission(objectiveExam, objectiveKey, {
    "part-1-q1": "A",
    "part-2-q1": "16",
  });

  assert.equal(result.earnedPoints, 5);
  assert.equal(result.scorePercent, 50);
  assert.equal(result.partResults[0].questions[0].isCorrect, false);
  assert.equal(result.partResults[1].questions[0].isCorrect, true);
});

test("chấm từng ý đúng sai và cộng điểm thành phần", () => {
  const exam = {
    totalPoints: 2,
    parts: [
      {
        partTitle: "Đúng sai",
        totalPoints: 2,
        questions: [
          {
            id: "tf-1",
            questionNumber: 1,
            type: "trueFalse",
            content: "Xét các phát biểu",
            points: 2,
            subQuestions: [
              { label: "a", text: "Ý a" },
              { label: "b", text: "Ý b" },
            ],
          },
        ],
      },
    ],
  };
  const key = {
    totalPoints: 2,
    parts: [
      {
        partTitle: "Đúng sai",
        items: [
          {
            questionId: "tf-1",
            questionNumber: 1,
            correctAnswer: { a: "Đúng", b: "Sai" },
            solutionSummary: "a Đúng; b Sai",
            points: 2,
          },
        ],
      },
    ],
  };

  const result = gradeExamSubmission(exam, key, {
    "tf-1:a": "Đúng",
    "tf-1:b": "Đúng",
  });

  assert.equal(result.earnedPoints, 1);
  assert.equal(result.scorePercent, 50);
});

test("không tự suy đoán điểm câu tự luận", () => {
  const exam = {
    totalPoints: 10,
    parts: [
      {
        partTitle: "Tự luận",
        totalPoints: 10,
        questions: [
          {
            id: "essay-1",
            questionNumber: 1,
            type: "essay",
            content: "Trình bày lời giải",
            points: 10,
          },
        ],
      },
    ],
  };
  const key = {
    totalPoints: 10,
    parts: [
      {
        partTitle: "Tự luận",
        items: [
          {
            questionId: "essay-1",
            questionNumber: 1,
            solutionSummary: "Lời giải tham khảo",
            points: 10,
          },
        ],
      },
    ],
  };

  const result = gradeExamSubmission(exam, key, {
    "essay-1": "Bài làm của học sinh",
  });

  assert.equal(result.earnedPoints, 0);
  assert.equal(result.scorePercent, null);
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.manualReviewPoints, 10);
});

