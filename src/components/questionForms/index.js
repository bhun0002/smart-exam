import React from 'react';
import { Card, Box, Typography, IconButton } from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";

import MultipleChoiceForm from './MultipleChoiceForm';
import MatchQuestionForm from './MatchQuestionForm';
import TrueFalseForm from './TrueFalseForm';
import FillBlanksForm from './FillBlanksForm';
import ShortAnswerForm from './ShortAnswerForm';
import ReasoningForm from './ReasoningForm';

const QuestionRenderer = ({
  question,
  index,
  questionTypeColors,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onChange,
  ...props
}) => {
  const getQuestionComponent = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceForm question={question} onChange={onChange} />;
      case 'match':
        return <MatchQuestionForm question={question} onChange={onChange} />;
      case 'true-false':
        return <TrueFalseForm question={question} onChange={onChange} />;
      case 'fill-blanks':
        return <FillBlanksForm question={question} onChange={onChange} />;
      case 'short-answer':
        return <ShortAnswerForm question={question} onChange={onChange} />;
      case 'reasoning':
        return <ReasoningForm question={question} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <Card {...props} sx={{ mb: 2, p: 2, backgroundColor: questionTypeColors[question.type] }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Question {index + 1} ({question.type.replace("-", " ")})
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onMoveUp} disabled={isFirst}><ArrowUpwardIcon /></IconButton>
        <IconButton onClick={onMoveDown} disabled={isLast}><ArrowDownwardIcon /></IconButton>
        <IconButton onClick={onDelete} color="error"><DeleteIcon /></IconButton>
      </Box>
      {getQuestionComponent()}
    </Card>
  );
};

export default QuestionRenderer;