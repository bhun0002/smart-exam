// src/admin/AdminPaymentManager/LinkPaymentDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  MenuItem,
  Alert,
} from "@mui/material";
import { useAuth } from "../../../AuthContext";
import {
  searchStudents,
  listEnrollmentsForStudent,
  getPaymentLinkStatus,
  linkPaymentWithAutoClaim,
} from "../lib/firestore";

export default function LinkPaymentDrawer({ open, onClose, payment, onDone }) {
  const { user } = useAuth(); // { email, role }
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState("");

  const [remaining, setRemaining] = useState(0);
  const [loadingRemaining, setLoadingRemaining] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // When opening, compute remaining (and re-compute if payment changes)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !payment?.id) return;
      try {
        setLoadingRemaining(true);
        const s = await getPaymentLinkStatus(payment.id);
        if (!alive) return;
        setRemaining(Number(s?.remaining || 0));
      } catch (e) {
        if (!alive) return;
        setRemaining(0);
      } finally {
        if (alive) setLoadingRemaining(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, payment?.id]);

  // Search students with debounce on query
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        setSearching(true);
        const rows = await searchStudents(query.trim());
        setResults(rows);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Load enrollments when a student is picked
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!student?.id) {
        setEnrollments([]);
        setEnrollmentId("");
        return;
      }
      const rows = await listEnrollmentsForStudent(student.id);
      if (!alive) return;
      setEnrollments(rows);
      if (rows.length === 1) setEnrollmentId(rows[0].id);
    })();
    return () => { alive = false; };
  }, [student?.id]);

  const disabled =
    submitting ||
    loadingRemaining ||
    remaining <= 0 ||
    !student?.id ||
    (enrollments.length > 0 && !enrollmentId);

  const helperText =
    remaining > 0
      ? `Auto-applying full remaining: ${remaining.toFixed(2)} ${payment?.amount?.currency || "CAD"}`
      : "This payment has no remaining amount.";

  async function handleConfirm() {
    try {
      setError("");
      setSubmitting(true);
      await linkPaymentWithAutoClaim({
        student: {
          id: student.id,
          name: student.name || "",
          email: student.email || "",
          studentId: student.studentId || "",
        },
        payment,
        enrollmentId: enrollmentId || null,
        adminUser: { email: user?.email || "", role: user?.role || "" },
      });
      onDone?.();
    } catch (e) {
      setError(e.message || "Failed to link payment.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = useMemo(
    () => `Link payment to student`,
    []
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A237E", mb: 1 }}>
          {title}
        </Typography>

        <Stack spacing={2}>
          {/* Context (read-only) */}
          <Box sx={{ bgcolor: "#fafafa", p: 1.5, borderRadius: 1, border: "1px solid #eee" }}>
            <Typography variant="body2">
              Amount:{" "}
              <b>
                {typeof payment?.amount?.value === "number"
                  ? `${payment.amount.value.toFixed(2)} ${payment?.amount?.currency || "CAD"}`
                  : "-"}
              </b>
            </Typography>
            <Typography variant="body2">Txn: {payment?.transaction_id || "-"}</Typography>
          </Box>

          {/* Student lookup */}
          <Autocomplete
            options={results}
            getOptionLabel={(opt) =>
              `${opt.name || "Unnamed"} — ${opt.email || "no email"} — ${opt.studentId || "no mint id"}`
            }
            loading={searching}
            onChange={(_, v) => setStudent(v || null)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Find student (name / email / minted id)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searching ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Enrollment select (if any) */}
          {enrollments.length > 0 && (
            <TextField
              select
              label="Enrollment"
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              helperText="Course / Intake"
            >
              {enrollments.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.courseName || e.courseId} — {e.intakeName || e.intakeId || "n/a"}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Auto-amount (read-only) */}
          <TextField
            label="Amount to apply"
            value={loadingRemaining ? "" : remaining.toFixed(2)}
            InputProps={{ readOnly: true }}
            helperText={helperText}
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={disabled}
              sx={{ borderRadius: "10px" }}
            >
              {submitting ? "Linking..." : "Confirm & Link"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
