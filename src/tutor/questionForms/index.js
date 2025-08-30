// src/tutor/QuestionRenderer.jsx

import React, { forwardRef } from 'react';
import { Card, Box, Typography, IconButton } from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";

// Import all the question form components
import MultipleChoiceForm from './MultipleChoiceForm';
import MatchQuestionForm from './MatchQuestionForm';
import TrueFalseForm from './TrueFalseForm';
import FillBlanksForm from './FillBlanksForm';
import ShortAnswerForm from './ShortAnswerForm';
import ReasoningForm from './ReasoningForm';

const QuestionRenderer = forwardRef(({
  question,
  index,
  questionTypeColors,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onChange,
  readonly,
  // ADDED: Accept the new props
  fieldErrors,
  setFieldErrors,
  ...props 
}, ref) => {
  const getQuestionComponent = () => {
    // ADDED: Pass the new props to each form component
    const commonProps = {
      question,
      onChange,
      readonly,
      fieldErrors,
      setFieldErrors,
      index // Passing down the index is crucial for creating unique IDs
    };

    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceForm {...commonProps} />;
      case 'match':
        return <MatchQuestionForm {...commonProps} />;
      case 'true-false':
        return <TrueFalseForm {...commonProps} />;
      case 'fill-blanks':
        return <FillBlanksForm {...commonProps} />;
      case 'short-answer':
        return <ShortAnswerForm {...commonProps} />;
      case 'reasoning':
        return <ReasoningForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <Card ref={ref} {...props} sx={{ mb: 2, p: 2, backgroundColor: questionTypeColors[question.type] }} id={`question-${index}`}> {/* ADDED: ID to the Card for scrolling */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Question {index + 1} ({question.type.replace("-", " ")})
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onMoveUp} disabled={isFirst || readonly}><ArrowUpwardIcon /></IconButton>
        <IconButton onClick={onMoveDown} disabled={isLast || readonly}><ArrowDownwardIcon /></IconButton>
        <IconButton onClick={onDelete} color="error" disabled={readonly}><DeleteIcon /></IconButton>
      </Box>
      {getQuestionComponent()}
    </Card>
  );
});

export default QuestionRenderer;