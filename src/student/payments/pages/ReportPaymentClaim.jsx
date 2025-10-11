import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  InputAdornment,
  Snackbar,
  Alert,
  LinearProgress,
  FormHelperText,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, CloudUpload as UploadIcon } from "@mui/icons-material";
import { useAuth } from "../../../AuthContext";

import {
  fetchPaymentsByWindow,
  uploadClaimProofToCloudinary,
  createPaymentClaim,
} from "../lib/firestore";
import { scoreSuggestion } from "../lib/matching";

export default function ReportPaymentClaim() {
  const { user } = useAuth(); // { id, email, name, ... }
  const navigate = useNavigate();

  const [claimedDate, setClaimedDate] = useState(""); // yyyy-mm-dd
  const [claimedTime, setClaimedTime] = useState(""); // HH:MM
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [touched, setTouched] = useState({ date: false, refOrFile: false });

  const claimedAt = useMemo(() => {
    if (!claimedDate) return null;
    const [h, m] = (claimedTime || "00:00").split(":").map(Number);
    const [y, mo, d] = claimedDate.split("-").map(Number);
    return new Date(y, mo - 1, d, h || 0, m || 0, 0, 0);
  }, [claimedDate, claimedTime]);

  const hasDate = !!claimedAt;
  const hasRefOrFile = (reference?.trim()?.length > 0) || !!file;
  const canSubmit = hasDate && hasRefOrFile && !loading;

  const handleFindSuggestions = async () => {
    if (!hasDate) {
      setTouched((t) => ({ ...t, date: true }));
      setSnack({ open: true, msg: "Select the payment date first.", severity: "warning" });
      return;
    }
    try {
      setLoading(true);
      const base = claimedAt || new Date();
      const from = new Date(base.getTime() - 48 * 3600 * 1000);
      const to = new Date(base.getTime() + 48 * 3600 * 1000);

      const payments = await fetchPaymentsByWindow({
        from,
        to,
        transactionId: reference?.trim() || null,
      });

      const claimObj = {
        claimedAt: base,
        reference: reference?.trim() || "",
        amountClaimed: amount ? Number(amount) : null,
      };

      const scored = payments
        .map((p) => ({
          payment: p,
          ...scoreSuggestion({ claim: claimObj, payment: p, studentEmail: user?.email }),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setSuggestions(scored);
      setSnack({ open: true, msg: `Found ${scored.length} suggestion(s).`, severity: "info" });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to query suggestions.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!hasDate) {
      setTouched((t) => ({ ...t, date: true }));
      setSnack({ open: true, msg: "Payment date is required.", severity: "warning" });
      return;
    }
    if (!hasRefOrFile) {
      setTouched((t) => ({ ...t, refOrFile: true }));
      setSnack({
        open: true,
        msg: "Provide either a Reference number or upload a Screenshot.",
        severity: "warning",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload file if present and convert to compact refMedia for Firestore
      const refMedia = await uploadClaimProofToCloudinary(file);

      const best = suggestions[0];
      const hints = {
        paymentIds: suggestions.map((s) => s.payment.id),
        confidence: best?.score || 0,
      };

      await createPaymentClaim({
        studentId: user?.id, // REAL student doc id from AuthContext
        claimedAt,
        reference: reference?.trim(),
        amountClaimed: amount ? Number(amount) : null,
        proofMedia: refMedia, // store compact refMedia (no URLs)
        suggestions: hints,
      });

      setSnack({ open: true, msg: "Payment claim submitted.", severity: "success" });
      navigate("/student-payments");
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to submit claim.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A237E", mb: 2 }}>
        Report a Payment
      </Typography>

      <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              type="date"
              label="Payment Date"
              size="small"
              value={claimedDate}
              onChange={(e) => setClaimedDate(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, date: true })) }
              error={touched.date && !hasDate}
              helperText={touched.date && !hasDate ? "Payment date is required." : " "}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="time"
              label="Time (optional)"
              size="small"
              value={claimedTime}
              onChange={(e) => setClaimedTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="number"
              label="Amount (optional)"
              size="small"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{ inputProps: { step: "0.01" } }}
            />
          </Stack>

          <TextField
            label="Reference (Txn / Interac confirmation)"
            size="small"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, refOrFile: true })) }
            placeholder="e.g., C1AwnyPY6V9v"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            helperText="Enter a reference OR upload a screenshot."
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ borderRadius: 2 }}
            >
              {file ? "Change Screenshot" : "Upload Screenshot (optional)"}
              <input
                hidden
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setTouched((t) => ({ ...t, refOrFile: true }));
                }}
              />
            </Button>
            {file && (
              <Typography
                variant="caption"
                sx={{
                  maxWidth: 360,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {file.name}
              </Typography>
            )}
          </Stack>

          {touched.refOrFile && !hasRefOrFile && (
            <FormHelperText error sx={{ mt: -1 }}>
              Provide either a Reference number or upload a Screenshot.
            </FormHelperText>
          )}

          <Stack direction="row" spacing={1}>
            <Button variant="text" onClick={handleFindSuggestions}>
              Find Suggestions
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ borderRadius: 2 }}
              disabled={!canSubmit}
            >
              Submit Claim
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/student-payments")}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false })) }
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false })) }
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
