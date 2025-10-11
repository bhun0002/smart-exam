import React from "react";
import { Box } from "@mui/material";
import { List, arrayMove } from "react-movable";

/** Thin wrapper around react-movable + your QuestionRenderer */
const QuestionsList = ({
  questions,
  setQuestions,
  readonly,
  fieldErrors,
  setFieldErrors,
  onDelete,
  onMoveUp,
  onMoveDown,
  QuestionRenderer,
}) => {
  return (
    <List
      values={questions}
      onChange={({ oldIndex, newIndex }) =>
        setQuestions(arrayMove(questions, oldIndex, newIndex))
      }
      renderList={({ children, props }) => <Box {...props}>{children}</Box>}
      renderItem={({ value, props, index }) => {
        const { key, ...restProps } = props;
        return (
          <QuestionRenderer
            key={value.id || key}
            question={value}
            index={index}
            {...restProps}
            questionTypeColors={{
              "multiple-choice": "#e3f2fd",
              "true-false": "#e8f5e9",
              match: "#fffde7",
              "fill-blanks": "#f3e5f5",
              "short-answer": "#fbe9e7",
              reasoning: "#ede7f6",
            }}
            onDelete={readonly ? undefined : () => onDelete(index)}
            onMoveUp={readonly ? undefined : () => onMoveUp(index)}
            onMoveDown={readonly ? undefined : () => onMoveDown(index)}
            isFirst={index === 0}
            isLast={index === questions.length - 1}
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
            onChange={
              readonly
                ? undefined
                : (newQ) => {
                    const copy = [...questions];
                    copy[index] = newQ;
                    setQuestions(copy);
                  }
            }
            readonly={readonly}
            id={`question-${index}`}
          />
        );
      }}
    />
  );
};

export default QuestionsList;
