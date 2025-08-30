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

// Use React.forwardRef to allow this component to receive a ref from its parent.
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
  ...props // This will capture props passed by react-movable, including 'style' and 'ref'
}, ref) => { // The ref is passed as the second argument here
  const getQuestionComponent = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceForm question={question} onChange={onChange} readonly={readonly} />;
      case 'match':
        return <MatchQuestionForm question={question} onChange={onChange} readonly={readonly} />;
      case 'true-false':
        return <TrueFalseForm question={question} onChange={onChange} readonly={readonly} />;
      case 'fill-blanks':
        return <FillBlanksForm question={question} onChange={onChange} readonly={readonly} />;
      case 'short-answer':
        return <ShortAnswerForm question={question} onChange={onChange} readonly={readonly} />;
      case 'reasoning':
        return <ReasoningForm question={question} onChange={onChange} readonly={readonly} />;
      default:
        return null;
    }
  };

  return (
    // Attach the ref to the top-level DOM element.
    // Spread the other props from react-movable to ensure it works correctly.
    <Card ref={ref} {...props} sx={{ mb: 2, p: 2, backgroundColor: questionTypeColors[question.type] }}>
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