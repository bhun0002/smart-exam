import React, { useEffect, useMemo, useState } from "react";
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
  Button,
} from "@mui/material";
import axios from "axios";

const IMAGE_EXTS = new Set([
  "jpg","jpeg","png","gif","bmp","tiff","tif","webp","avif","heic","svg","pdf"
]);
const VIDEO_EXTS = new Set(["mp4","webm","ogg","ogv","mov","mkv","m4v","avi"]);

// Build a signed URL from Cloudinary identifiers using your backend
async function getSignedUrlFromIds(media) {
  if (!media?.public_id) return null;

  const base = (process.env.REACT_APP_API_BASE || "").replace(/\/+$/, "");
  if (!base) throw new Error("Missing REACT_APP_API_BASE in your .env");

  const ext = (media.format || "").toLowerCase();

  // Decide URL path resource_type
  let pathResourceType = "raw";
  if (ext && IMAGE_EXTS.has(ext)) pathResourceType = "image";
  else if (ext && VIDEO_EXTS.has(ext)) pathResourceType = "video";

  const qp = new URLSearchParams({
    public_id: media.public_id,
    delivery_type: "upload",
    path_resource_type: pathResourceType,
  });

  // Avoid duplicate .ext
  if (ext && !media.public_id.toLowerCase().endsWith(`.${ext}`)) {
    qp.set("format", ext);
  }
  if (media.version != null) qp.set("version", String(media.version));

  const { data } = await axios.get(`${base}/secure-link?${qp.toString()}`);
  return data?.signedUrl || null;
}

// Quick helper for legacy string URLs
function extFromUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname.toLowerCase();
    const last = pathname.split("/").pop() || "";
    const parts = last.split(".");
    return parts.length > 1 ? parts.pop() : "";
  } catch {
    const lower = (url || "").toLowerCase();
    const q = lower.split("?")[0];
    const last = q.split("/").pop() || "";
    const parts = last.split(".");
    return parts.length > 1 ? parts.pop() : "";
  }
}

const StudentQuestionDisplay = ({
  question,
  index,
  studentAnswer,
  onAnswerChange,
  readonly = false,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [kind, setKind] = useState(null); // "image" | "video" | "file" | null

  // Normalize question.media which could be:
  //  - string URL (legacy)
  //  - identifiers object { public_id, format, version, resource_type }
  const media = question?.media;

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // Legacy direct URL
      if (typeof media === "string" && media) {
        const ext = extFromUrl(media);
        if (IMAGE_EXTS.has(ext)) {
          if (!cancelled) { setResolvedUrl(media); setKind("image"); }
        } else if (VIDEO_EXTS.has(ext)) {
          if (!cancelled) { setResolvedUrl(media); setKind("video"); }
        } else {
          if (!cancelled) { setResolvedUrl(media); setKind("file"); }
        }
        return;
      }

      // Identifiers object → ask backend for a signed URL
      if (media && typeof media === "object" && media.public_id) {
        try {
          const url = await getSignedUrlFromIds(media);
          if (cancelled) return;

          const ext = (media.format || "").toLowerCase();
          if (url) {
            if (IMAGE_EXTS.has(ext)) {
              setResolvedUrl(url);
              setKind("image");
            } else if (VIDEO_EXTS.has(ext)) {
              setResolvedUrl(url);
              setKind("video");
            } else {
              setResolvedUrl(url);
              setKind("file");
            }
          } else {
            setResolvedUrl(null);
            setKind(null);
          }
        } catch (e) {
          console.error("[StudentQuestionDisplay] failed to build signed URL:", e);
          if (!cancelled) { setResolvedUrl(null); setKind(null); }
        }
        return;
      }

      // Nothing to render
      setResolvedUrl(null);
      setKind(null);
    }

    resolve();
    return () => { cancelled = true; };
  }, [media]);

  const handleMcqChange = (event) => onAnswerChange(event.target.value);
  const handleTextChange = (event) => onAnswerChange(event.target.value);

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
              {(question.options || []).map((option, optIndex) => (
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
              <FormControlLabel value="True" control={<Radio disabled={readonly} />} label="True" />
              <FormControlLabel value="False" control={<Radio disabled={readonly} />} label="False" />
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
            {(question.matchPairs || []).map((pair, i) => (
              <Box key={pair.id || i} sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1 }}>
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
                <Typography variant="h6" sx={{ mx: 1 }}>↔</Typography>
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
        return <Typography color="error">Unsupported question type: {question.type}</Typography>;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: "16px", bgcolor: "#ffffff" }}>
      <Typography variant="h6" gutterBottom fontWeight="bold" color="#3f51b5">
        Question {index + 1}
      </Typography>

      {resolvedUrl && (
        <Box sx={{ mb: 2, textAlign: "center" }}>
          {kind === "video" ? (
            <video
              src={resolvedUrl}
              controls
              style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
            />
          ) : kind === "image" ? (
            <img
              src={resolvedUrl}
              alt="Question media"
              style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
            />
          ) : (
            <Button
              variant="outlined"
              onClick={() => window.open(resolvedUrl, "_blank", "noopener,noreferrer")}
            >
              Open Attachment
            </Button>
          )}
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
