import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import {
  fetchStudentEnrollments,
  fetchStudentLinks,
  getSignedClaimProofUrl,
} from "../lib/firestore";

// Replace with your actual auth hook / context
const useAuth = () => {
  const uid = window.__MOCK_STUDENT_UID__ || "STUDENT_USER_ID";
  const email = window.__MOCK_STUDENT_EMAIL__ || "student@example.com";
  const displayName = "Student";
  return { user: { uid, email, displayName } };
};

export default function StudentPaymentsHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [links, setLinks] = useState([]);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [enrs, lks, cls] = await Promise.all([
          fetchStudentEnrollments(user.uid),
          fetchStudentLinks(user.uid),
          getStudentClaims(user.uid),
        ]);
        if (!alive) return;
        setEnrollments(enrs);
        setLinks(lks);
        setClaims(cls);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user.uid]);

  const totalsByEnrollment = useMemo(() => {
    const map = new Map();
    enrollments.forEach((e) => {
      map.set(e.id, {
        fee: Number(e.assignedFeeAmount || 0),
        currency: e.currency || "CAD",
        paid: 0,
      });
    });
    links.forEach((lk) => {
      const key = lk.enrollmentId || enrollments[0]?.id; // naive fallback
      if (!map.has(key)) return;
      const cur = map.get(key);
      cur.paid += Number(lk.amountApplied || 0);
      map.set(key, cur);
    });
    return map;
  }, [enrollments, links]);

  async function openProof(c) {
    try {
      const url = await getSignedClaimProofUrl(c.proofMedia);
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const currency = enrollments[0]?.currency || "CAD";

  return (
    <Box sx={{ p: 3, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#1A237E" }}
        >
          My Payments & Dues
        </Typography>
        <Button
          component={RouterLink}
          to="/student/payments/report"
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          Report a Payment
        </Button>
      </Stack>

      {/* Fees & Remaining */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={3}>
        <Typography
          variant="subtitle1"
          sx={{ mb: 1, fontWeight: 600 }}
        >
          Fee Summary
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#FFF3E0" }}>
              <TableRow>
                <TableCell>Course / Intake</TableCell>
                <TableCell align="right">
                  Total Fee ({currency})
                </TableCell>
                <TableCell align="right">
                  Paid ({currency})
                </TableCell>
                <TableCell align="right">
                  Remaining ({currency})
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    No active enrollments.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((e) => {
                  const agg =
                    totalsByEnrollment.get(e.id) || {
                      fee: 0,
                      paid: 0,
                      currency,
                    };
                  const remaining = Math.max(
                    0,
                    Number(agg.fee) - Number(agg.paid)
                  );
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {e.courseName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {e.intakeName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        {agg.fee.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {agg.paid.toFixed(2)}
                      </TableCell>
                      <TableCell
                        align="right"
                        style={{ fontWeight: 700 }}
                      >
                        {remaining.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Confirmed Payments */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={3}>
        <Typography
          variant="subtitle1"
          sx={{ mb: 1, fontWeight: 600 }}
        >
          Confirmed Payments
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#E8F5E9" }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount ({currency})</TableCell>
                <TableCell>Txn ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    No confirmed payments yet.
                  </TableCell>
                </TableRow>
              ) : (
                links.map((lk) => (
                  <TableRow key={lk.id}>
                    <TableCell>
                      {lk.createdAt?.toDate?.().toLocaleString?.() ||
                        "-"}
                    </TableCell>
                    <TableCell align="right">
                      {Number(lk.amountApplied || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{lk.paymentId || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Claims */}
      <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
        <Typography
          variant="subtitle1"
          sx={{ mb: 1, fontWeight: 600 }}
        >
          My Claims
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#E3F2FD" }}>
              <TableRow>
                <TableCell>Claimed At</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Proof</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No claims.</TableCell>
                </TableRow>
              ) : (
                claims.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.claimedAt?.toDate?.().toLocaleString?.() ||
                        new Date(c.claimedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{c.reference || "-"}</TableCell>
                    <TableCell align="right">
                      {typeof c.amountClaimed === "number"
                        ? c.amountClaimed.toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          c.status === "linked"
                            ? "success"
                            : c.status === "rejected"
                            ? "error"
                            : "default"
                        }
                        label={c.status}
                      />
                    </TableCell>
                    <TableCell>
                      {c.proofMedia ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openProof(c)}
                          sx={{ borderRadius: "10px" }}
                        >
                          Open proof
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

async function getStudentClaims(studentId) {
  const q = query(
    collection(db, "payment_claims"),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
