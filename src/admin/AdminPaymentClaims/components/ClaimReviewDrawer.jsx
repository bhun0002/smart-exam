// src/admin/AdminPaymentClaims/components/ClaimReviewDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../../AuthContext";
import { getSignedDocUrlLikeWorking } from "../../AdminDocManager/helpers/cloudinary";
import {
  confirmLinkForClaim,
  rejectClaim,
  listEnrollmentsForStudent,
  searchInteracPayments,
  suggestMatchesForClaim,
} from "../lib/firestore";

export default function ClaimReviewDrawer({
  open,
  claim,
  onClose,
  onDone,
}) {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState("");
  const [amountApplied, setAmountApplied] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pickedPayment, setPickedPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openingProof, setOpeningProof] = useState(false);

  // Safe numeric claimAmount for strict amount matching in search
  const claimAmount = useMemo(() => {
    const n = Number(claim?.amountClaimed);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [claim]);

  const studentLabel = useMemo(() => {
    if (!claim) return "";
    const name = claim.studentName || "";
    const minted = claim.studentId || "";
    if (name && minted) return `${name} — ${minted}`;
    return name || minted || claim.studentId || "";
  }, [claim]);

  useEffect(() => {
    if (!open || !claim?.studentId) return;
    (async () => {
      setLoading(true);
      try {
        const enrs = await listEnrollmentsForStudent(claim.studentId);
        setEnrollments(enrs || []);
        setSelectedEnrollment((enrs && enrs[0]?.id) || "");
        // suggestions already exclude linked-to-other-claims and (in data layer) require equal amount
        const sugg = await suggestMatchesForClaim(claim, { days: 7, excludeLinked: true });
        setSuggestions(sugg || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, claim?.studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      const ca = Number(claim?.amountClaimed || 0);
      setAmountApplied(ca > 0 ? String(ca) : "");
      setPickedPayment(null);
      setSearchText("");
      setSearchResults([]);
    }
  }, [open, claim]);

  async function onSearch() {
    setLoading(true);
    try {
      // Strict by-amount search (only equal to claimAmount if available)
      const rows = await searchInteracPayments({
        text: searchText,
        days: 30,
        excludeLinked: true,
        excludeClaimId: claim?.id || null,
        requireAmountEqual: typeof claimAmount === "number",
        claimAmount,
      });
      setSearchResults(rows || []);
    } finally {
      setLoading(false);
    }
  }

  // Open proof via Cloudinary signed URL (no secure_url stored on claim)
  const handleOpenProof = async () => {
    if (!claim?.proofMedia?.public_id) return;
    try {
      setOpeningProof(true);
      const signedUrl = await getSignedDocUrlLikeWorking({
        public_id: claim.proofMedia.public_id,
        resource_type: claim.proofMedia.resource_type || "image",
        format: claim.proofMedia.format || undefined,
        version:
          typeof claim.proofMedia.version === "number" ||
          typeof claim.proofMedia.version === "string"
            ? claim.proofMedia.version
            : undefined,
      });
      if (signedUrl) {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      console.error("Failed to open proof:", e);
      alert("Could not open proof. Please try again.");
    } finally {
      setOpeningProof(false);
    }
  };

  async function handleConfirm() {
    if (!pickedPayment) return;
    setLoading(true);
    try {
      await confirmLinkForClaim({
        claim,
        payment: pickedPayment,
        enrollmentId: selectedEnrollment || null,
        amountApplied: Number(amountApplied || 0),
        adminUser: { email: user?.email || "", role: user?.role || "" },
      });
      onDone?.();
    } catch (e) {
      alert(e.message || "Failed to confirm & link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!claim?.id) return;
    const baseMsg = "Reject this claim?";
    const linkedNote =
      claim?.status === "linked"
        ? "\nThis will also revoke any approved payment link created from this claim."
        : "";
    const note = window.prompt(`${baseMsg}${linkedNote}\n\nAdd a note (optional):`, "") || "";

    setLoading(true);
    try {
      await rejectClaim({
        claimId: claim.id,
        note,
        adminUser: { email: user?.email || "", role: user?.role || "" },
      });
      onDone?.();
    } catch (e) {
      alert(e.message || "Failed to reject claim.");
    } finally {
      setLoading(false);
    }
  }

  const canConfirm =
    !!pickedPayment &&
    amountApplied !== "" &&
    Number.isFinite(Number(amountApplied)) &&
    Number(amountApplied) > 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          Review Claim
        </Typography>

        {/* Claim summary */}
        <Box sx={{ p: 2, border: "1px solid #eee", borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Claim
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              <strong>Student:</strong> {studentLabel || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {claim?.studentEmail || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Claimed At:</strong>{" "}
              {claim?.claimedAt?.toDate?.().toLocaleString?.() ||
                (claim?.claimedAt ? new Date(claim.claimedAt).toLocaleString() : "—")}
            </Typography>
            <Typography variant="body2">
              <strong>Reference:</strong> {claim?.reference || "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Amount:</strong>{" "}
              {typeof claim?.amountClaimed === "number"
                ? claim.amountClaimed.toFixed(2)
                : "—"}
            </Typography>
            <Typography variant="body2">
              <strong>Proof:</strong>{" "}
              <Button size="small" variant="outlined" onClick={handleOpenProof} disabled={!claim?.proofMedia?.public_id || openingProof}>
                OPEN PROOF
              </Button>
            </Typography>
          </Stack>
        </Box>

        {/* Suggestions */}
        <Box sx={{ p: 2, border: "1px solid #eee", borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Suggested Payments
          </Typography>
          {!suggestions?.length ? (
            <Typography variant="body2" color="text.secondary">
              No suggestions.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {suggestions.map((s) => {
                const p = s.payment;
                const amt = Number(p?.amount?.value || 0).toFixed(2);
                const when =
                  p?.transfer_date?.raw ||
                  p?.transfer_date?.iso ||
                  p?.stored_at?.toDate?.()?.toLocaleString?.() ||
                  "—";
                const label = `${amt} — ${when} — ${p?.transaction_id || "no txn id"}`;
                const chosen = pickedPayment?.id === p.id;
                return (
                  <Button
                    key={p.id}
                    size="small"
                    variant={chosen ? "contained" : "outlined"}
                    onClick={() => setPickedPayment(p)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {label} (score {s.score.toFixed(2)})
                  </Button>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, border: "1px solid #eee", borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Search Payments
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search in interac_payments (email / subject / txn / amount…)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button onClick={onSearch} variant="outlined">
              SEARCH
            </Button>
          </Stack>

          {!!searchResults?.length && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Results
              </Typography>
              <Stack spacing={1} sx={{ mt: 1, maxHeight: 160, overflow: "auto" }}>
                {searchResults.map((p) => {
                  const amt = Number(p?.amount?.value || 0).toFixed(2);
                  const when =
                    p?.transfer_date?.raw ||
                    p?.transfer_date?.iso ||
                    p?.stored_at?.toDate?.()?.toLocaleString?.() ||
                    "—";
                  const label = `${amt} — ${when} — ${p?.transaction_id || "no txn id"}`;
                  const chosen = pickedPayment?.id === p.id;
                  return (
                    <Button
                      key={p.id}
                      size="small"
                      variant={chosen ? "contained" : "outlined"}
                      onClick={() => setPickedPayment(p)}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      {label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>

        {/* Enrollment + amount */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="enr-lbl">Enrollment</InputLabel>
            <Select
              labelId="enr-lbl"
              input={<OutlinedInput label="Enrollment" />}
              value={selectedEnrollment}
              onChange={(e) => setSelectedEnrollment(e.target.value)}
            >
              {!enrollments?.length && <MenuItem value="">(none)</MenuItem>}
              {enrollments.map((e) => {
                const course = e.courseName || e.courseId || "Course";
                const intake = e.intakeName || e.intakeId || "";
                return (
                  <MenuItem key={e.id} value={e.id}>
                    {course} {intake ? `— ${intake}` : ""}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Amount to apply"
            value={amountApplied}
            onChange={(e) => setAmountApplied(e.target.value)}
            sx={{ width: 180 }}
            inputProps={{ inputMode: "decimal" }}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Optional if student has multiple enrollments.
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={!canConfirm || loading}
            onClick={handleConfirm}
          >
            CONFIRM & LINK
          </Button>
          <Button
            color="error"
            variant="outlined"
            disabled={loading}
            onClick={handleReject}
          >
            REJECT
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose}>CLOSE</Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
