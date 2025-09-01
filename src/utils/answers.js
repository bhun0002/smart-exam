export const isQuestionAnswered = (question, answers) => {
  const answer = answers[question.id];
  if (!answer) return false;
  switch (question.type) {
    case "multiple-choice":
    case "true-false":
      return !!answer;
    case "fill-blanks":
    case "short-answer":
    case "reasoning":
      return typeof answer === "string" && answer.trim().length > 0;
    case "match":
      if (typeof answer === "object" && answer !== null) {
        const questionPairs = question.matchPairs || [];
        return questionPairs.every(
          (pair) =>
            pair.left &&
            typeof answer[pair.left] === "string" &&
            answer[pair.left].trim().length > 0
        );
      }
      return false;
    default:
      return false;
  }
};
