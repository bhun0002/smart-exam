// src/admin/components/StudentDrawerForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export default function StudentDrawerForm({
  open,
  onClose,

  editingStudent,
  editing,                

  onSaved,
  onSubmit,

  intakesMap = {},
  coursesMap = {},
  intakes,
  courses,
}) {
  const editSrc = editingStudent || editing;
  const isEdit = !!editSrc;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [intakeId, setIntakeId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isApproved, setIsApproved] = useState(false);

  const [saving, setSaving] = useState(false);

  // snackbar error state
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    contactNumber: false,
    password: false,
    intakeId: false,
    courseId: false,
  });

  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));

  const intakeOptions = useMemo(() => {
    const fromMap = Object.entries(intakesMap);
    if (fromMap.length) return fromMap;
    if (Array.isArray(intakes) && intakes.length) return intakes.map((i) => [i.id, i.name]);
    return [];
  }, [intakesMap, intakes]);

  const courseOptions = useMemo(() => {
    const fromMap = Object.entries(coursesMap);
    if (fromMap.length) return fromMap;
    if (Array.isArray(courses) && courses.length) return courses.map((c) => [c.id, c.name]);
    return [];
  }, [coursesMap, courses]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSnackbarOpen(false);
    setTouched({ name: false, email: false, contactNumber: false, password: false, intakeId: false, courseId: false });
    if (editSrc) {
      setName(editSrc.name || "");
      setEmail(editSrc.email || "");
      setContactNumber(editSrc.contactNumber || "");
      setPassword("");
      setIntakeId(editSrc.intakeId || "");
      setCourseId(editSrc.courseId || "");
      setIsApproved(!!editSrc.isApproved);
    } else {
      setName("");
      setEmail("");
      setContactNumber("");
      setPassword("");
      setIntakeId("");
      setCourseId("");
      setIsApproved(false);
    }
  }, [open, editSrc]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const contactDigits = contactNumber.replace(/\D/g, "");
  const contactRequiredError = contactDigits.length === 0;
  const contactMaxError = contactDigits.length > 10;
  const contactOk = !contactRequiredError && !contactMaxError;

  const nameOk = name.trim().length > 0;
  const intakeOk = !!intakeId;
  const courseOk = !!courseId;
  const passwordOk = isEdit ? true : password.trim().length >= 6;

  const canSubmit =
    nameOk && emailOk && contactOk && intakeOk && courseOk && passwordOk && !saving;

  const onContactChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setContactNumber(digits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      setError("Please complete all required fields before submitting.");
      setSnackbarOpen(true);
      return;
    }

    if (typeof onSubmit === "function") {
      try {
        setSaving(true);
        await onSubmit({
          name: name.trim(),
          email: email.trim(),
          contactNumber: contactDigits,
          password: password.trim(),
          intakeId,
          courseId,
          isApproved,
        });
      } catch (err) {
        console.error(err);
        setError(err?.message || "Failed to save student. Please try again.");
        setSnackbarOpen(true);
        setSaving(false);
        return;
      }
      setSaving(false);
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        const patch = {
          name: name.trim(),
          email: email.trim(),
          contactNumber: contactDigits,
          intakeId,
          courseId,
          isApproved,
          updatedAt: serverTimestamp(),
        };
        if (password.trim()) patch.password = password.trim();
        await updateDoc(doc(db, "students", editSrc.id), patch);
      } else {
        await addDoc(collection(db, "students"), {
          name: name.trim(),
          email: email.trim(),
          contactNumber: contactDigits,
          password: password.trim(),
          intakeId,
          courseId,
          isApproved,
          isDeleted: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      setError("Failed to save student. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={!!open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, borderLeft: "1px solid #eee" } }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2, bgcolor: "#fff" }}
        >
          <Typography variant="h6" sx={{ color: "#1A237E", fontWeight: "bold" }}>
            {isEdit ? "Edit Student" : "Add Student"}
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => markTouched("name")}
              required
              InputProps={{ sx: { borderRadius: "12px" } }}
              error={touched.name && !nameOk}
              helperText={touched.name && !nameOk ? "Name is required" : " "}
            />

            <TextField
              label="Email"
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => markTouched("email")}
              required
              InputProps={{ sx: { borderRadius: "12px" } }}
              error={touched.email && !emailOk}
              helperText={touched.email && !emailOk ? "Enter a valid email" : " "}
            />

            <TextField
              label="Contact Number"
              value={contactNumber}
              onChange={onContactChange}
              onBlur={() => markTouched("contactNumber")}
              placeholder="digits only, max 10"
              required
              InputProps={{ sx: { borderRadius: "12px" } }}
              error={touched.contactNumber && (!contactOk)}
              helperText={
                touched.contactNumber
                  ? contactDigits.length === 0
                    ? "Contact number is required"
                    : contactDigits.length > 10
                    ? "Must be at most 10 digits"
                    : " "
                  : " "
              }
            />

            {!isEdit && (
              <TextField
                label="Password"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                required
                InputProps={{ sx: { borderRadius: "12px" } }}
                error={touched.password && !passwordOk}
                helperText={touched.password && !passwordOk ? "At least 6 characters" : " "}
              />
            )}

            {isEdit && (
              <TextField
                label="Password (leave blank to keep unchanged)"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{ sx: { borderRadius: "12px" } }}
                helperText=" "
              />
            )}

            <TextField
              select
              label="Intake"
              value={intakeId}
              onChange={(e) => setIntakeId(e.target.value)}
              onBlur={() => markTouched("intakeId")}
              required
              InputProps={{ sx: { borderRadius: "12px" } }}
              error={touched.intakeId && !intakeOk}
              helperText={touched.intakeId && !intakeOk ? "Please select an Intake" : " "}
            >
              {intakeOptions.length === 0 ? (
                <MenuItem value="" disabled>No intakes found</MenuItem>
              ) : (
                intakeOptions.map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))
              )}
            </TextField>

            <TextField
              select
              label="Course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              onBlur={() => markTouched("courseId")}
              required
              InputProps={{ sx: { borderRadius: "12px" } }}
              error={touched.courseId && !courseOk}
              helperText={touched.courseId && !courseOk ? "Please select a Course" : " "}
            >
              {courseOptions.length === 0 ? (
                <MenuItem value="" disabled>No courses found</MenuItem>
              ) : (
                courseOptions.map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))
              )}
            </TextField>

            <FormControlLabel
              control={<Switch checked={!!isApproved} onChange={(e) => setIsApproved(e.target.checked)} />}
              label="Approved"
            />
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: "auto" }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit}
              sx={{ borderRadius: "12px", fontWeight: "bold" }}
            >
              {isEdit ? "Save Changes" : "Create Student"}
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Snackbar for errors */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
