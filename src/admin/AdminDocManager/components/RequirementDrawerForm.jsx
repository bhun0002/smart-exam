import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Drawer, Box, Typography, Divider, TextField, FormControlLabel, Checkbox, Button, Stack, Snackbar, Alert
} from "@mui/material";
import useMediaPreview, { isVideoFromMedia } from "../../../shared/useMediaPreview"; // parent is /src/admin/AdminDocManager/

export default function RequirementDrawerForm({ open, onClose, onSubmit, editing }) {
  const isEdit = !!editing;
  const [title, setTitle] = useState(editing?.title || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [isMandatory, setIsMandatory] = useState(!!editing?.isMandatory);
  const [refMedia, setRefMedia] = useState(editing?.refMedia || null);
  const [refFile, setRefFile] = useState(null);
  const [err, setErr] = useState("");

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "error" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const fileInputRef = useRef(null);
  const preview = useMediaPreview(refFile || refMedia);

  useEffect(() => {
    setTitle(editing?.title || "");
    setDescription(editing?.description || "");
    setIsMandatory(!!editing?.isMandatory);
    setRefMedia(editing?.refMedia || null);
    setRefFile(null);
    setErr("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [editing, open]);

  const clearRef = () => {
    setRefFile(null);
    setRefMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!title.trim()) {
      setErr("Title is required.");
      setSnack({ open: true, msg: "Title is required.", severity: "error" });
      return;
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      isMandatory: !!isMandatory,
      refMedia, // may be replaced after upload inside parent
      refFile,  // raw file to upload
    });
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 480 } } }}>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {isEdit ? "Edit Requirement" : "Add New Requirement"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isEdit ? "Update the document requirement and save changes." : "Create a new document requirement students must follow."}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
            {!!err && <Alert severity="error">{err}</Alert>}

            <TextField
              label="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
            <TextField
              label="Description (optional)"
              value={description}
              multiline
              minRows={3}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />

            <FormControlLabel
              control={<Checkbox checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} />}
              label="Mandatory for all students"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Reference file (PDF/DOC/Image/Archive) <small>(optional)</small>
              </Typography>
              <TextField
                fullWidth
                type="file"
                inputRef={fileInputRef}
                inputProps={{
                  accept:
                    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.tar,.gz,image/*,video/*",
                }}
                onChange={(e) => setRefFile(e.target.files?.[0] || null)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />

              {useMemo(() => preview, [preview]) && (
                <Box sx={{ mt: 2, textAlign: "center", border: "1px dashed #bdbdbd", p: 2, borderRadius: "12px" }}>
                  {isVideoFromMedia(refFile || refMedia) ? (
                    <video src={preview} controls style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8 }} />
                  ) : typeof (refFile || refMedia) === "object" &&
                    (refFile?.type?.startsWith("image") || refMedia?.resource_type === "image") ? (
                    <img src={preview} alt="Reference" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8 }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {refFile ? refFile.name : refMedia?.public_id || "Reference file selected"}
                    </Typography>
                  )}
                </Box>
              )}

              {(refFile || refMedia) && (
                <Box sx={{ mt: 1 }}>
                  <Button size="small" color="error" onClick={clearRef}>
                    Remove reference
                  </Button>
                </Box>
              )}
            </Box>

            <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
                {isEdit ? "Save Changes" : "Create"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}

// Helper re-export for type guard used above
export { isVideoFromMedia } from "../../../shared/useMediaPreview";
