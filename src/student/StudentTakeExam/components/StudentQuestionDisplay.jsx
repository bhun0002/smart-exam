import React from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from "@mui/material";

const StudentQuestionDisplay = ({
  question,
  index,
  studentAnswer,
  onAnswerChange,
  readonly = false,
}) => {
  const mediaUrl = question.media;
  const isVideo =
    mediaUrl &&
    (mediaUrl.endsWith(".mp4") ||
      mediaUrl.endsWith(".webm") ||
      mediaUrl.endsWith(".ogg"));
  const isImage =
    mediaUrl &&
    (mediaUrl.endsWith(".jpg") ||
      mediaUrl.endsWith(".jpeg") ||
      mediaUrl.endsWith(".png") ||
      mediaUrl.endsWith(".gif"));

  const handleMcqChange = (event) => {
    onAnswerChange(event.target.value);
  };

  const handleTextChange = (event) => {
    onAnswerChange(event.target.value);
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <FormControl component="fieldset" fullWidth margin="normal">
            <FormLabel
              component="legend"
              sx={{ mb: 1, color: "#3f51b5", fontWeight: "bold" }}
            >
              Select your answer:
            </FormLabel>
            <RadioGroup
              value={studentAnswer || ""}
              onChange={handleMcqChange}
              name={`question-${index}`}
            >
              {question.options.map((option, optIndex) => (
                <FormControlLabel
                  key={option.id || optIndex}
                  value={option.text}
                  control={<Radio disabled={readonly} />}
                  label={<Typography variant="body1">{option.text}</Typography>}
                  sx={{
                    p: 1,
                    mb: 0.5,
                    borderRadius: "8px",
                    backgroundColor:
                      studentAnswer === option.text && !readonly
                        ? "#e8eaf6"
                        : "transparent",
                    "&:hover": { backgroundColor: "#e8eaf6" },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      case "true-false":
        return (
          <FormControl component="fieldset" fullWidth margin="normal">
            <FormLabel
              component="legend"
              sx={{ mb: 1, color: "#3f51b5", fontWeight: "bold" }}
            >
              Select True or False:
            </FormLabel>
            <RadioGroup
              value={studentAnswer || ""}
              onChange={handleMcqChange}
              name={`question-${index}`}
            >
              <FormControlLabel
                value="True"
                control={<Radio disabled={readonly} />}
                label="True"
              />
              <FormControlLabel
                value="False"
                control={<Radio disabled={readonly} />}
                label="False"
              />
            </RadioGroup>
          </FormControl>
        );
      case "fill-blanks":
      case "short-answer":
      case "reasoning":
        return (
          <TextField
            fullWidth
            label="Your Answer"
            multiline
            minRows={3}
            value={studentAnswer || ""}
            onChange={handleTextChange}
            margin="normal"
            variant="outlined"
            disabled={readonly}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: readonly ? "rgba(0,0,0,0.04)" : "#ffffff",
              },
            }}
          />
        );
      case "match":
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#3f51b5">
              Match the pairs:
            </Typography>
            {question.matchPairs.map((pair, i) => (
              <Box
                key={pair.id || i}
                sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1 }}
              >
                <TextField
                  label={`Left ${i + 1}`}
                  value={pair.left}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#e0e0e0",
                    },
                  }}
                />
                <Typography variant="h6" sx={{ mx: 1 }}>
                  ↔
                </Typography>
                <TextField
                  label={`Your Match for ${pair.left}`}
                  value={(studentAnswer && studentAnswer[pair.left]) || ""}
                  onChange={(e) =>
                    onAnswerChange({ ...studentAnswer, [pair.left]: e.target.value })
                  }
                  variant="outlined"
                  size="small"
                  disabled={readonly}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: readonly ? "rgba(0,0,0,0.04)" : "#ffffff",
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        );
      default:
        return (
          <Typography color="error">
            Unsupported question type: {question.type}
          </Typography>
        );
    }
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: "16px", bgcolor: "#ffffff" }}>
      <Typography variant="h6" gutterBottom fontWeight="bold" color="#3f51b5">
        Question {index + 1}
      </Typography>
      {mediaUrl && (
        <Box sx={{ mb: 2, textAlign: "center" }}>
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
            />
          ) : isImage ? (
            <img
              src={mediaUrl}
              alt="Question media"
              style={{ maxWidth: "100%", maxHeight: 300, borderRadius: "8px" }}
            />
          ) : null}
        </Box>
      )}
      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {question.question}
      </Typography>
      {renderQuestionInput()}
    </Paper>
  );
};

export default StudentQuestionDisplay;
