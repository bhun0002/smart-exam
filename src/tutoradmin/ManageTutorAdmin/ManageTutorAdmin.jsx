// src/tutoradmin/ManageTutorAdmin/ManageTutorAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  collection, addDoc, getDocs, updateDoc, doc, serverTimestamp,
  query, orderBy, where
} from "firebase/firestore";
import { Box, Paper, Snackbar, Alert as MuiAlert, Typography } from "@mui/material";

import TopBar from "./components/TopBar";
import FiltersBar from "./components/FiltersBar";
import TutorDrawerForm from "./components/TutorDrawerForm";
import TutorsTable from "./components/TutorsTable";
import PaginationBar from "../../shared/PaginationBar";
import validateEmail from "./helpers/validateEmail";

const PAGE_SIZE = 10;
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

export default function ManageTutorAdmin() {
  const navigate = useNavigate();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // 'all' | 'approved' | 'pending'
  const [showDeleted, setShowDeleted] = useState(false);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // pagination
  const [page, setPage] = useState(1);

  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const tutorsRef = collection(db, "tutors");

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(tutorsRef, orderBy("createdAt", "desc")));
      setTutors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPage(1);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load tutors.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTutors(); }, []);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setShowDeleted(false);
    setPage(1);
  };

  // filter first (by showDeleted + search + status)
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return tutors.filter((u) => {
      const del = isDeletedTrue(u.isDeleted);
      if (!showDeleted && del) return false;
      if (showDeleted && !del) return false;

      const matchSearch =
        (u.name || "").toLowerCase().includes(t) ||
        (u.email || "").toLowerCase().includes(t);

      const matchStatus =
        status === "all" || (status === "approved" ? u.isApproved : !u.isApproved);

      return matchSearch && matchStatus;
    });
  }, [tutors, search, status, showDeleted]);

  // counts (Active | Deleted)
  const activeCount = useMemo(() => tutors.filter((t) => !isDeletedTrue(t.isDeleted)).length, [tutors]);
  const deletedCount = useMemo(() => tutors.filter((t) => isDeletedTrue(t.isDeleted)).length, [tutors]);

  // paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // actions
  const addTutor = async ({ name, email, password }) => {
    if (!name || !email || !password) {
      setSnack({ open: true, msg: "All fields are required.", severity: "error" });
      return;
    }
    if (!validateEmail(email)) {
      setSnack({ open: true, msg: "Invalid email.", severity: "error" });
      return;
    }
    if (password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }

    try {
      const exists = await getDocs(query(tutorsRef, where("email", "==", email)));
      if (!exists.empty) {
        setSnack({ open: true, msg: "Email already exists.", severity: "error" });
        return;
      }

      await addDoc(tutorsRef, {
        name, email, password,
        isApproved: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Tutor added.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add tutor.", severity: "error" });
    }
  };

  const updateTutor = async (id, payload) => {
    if (payload.email && !validateEmail(payload.email)) {
      setSnack({ open: true, msg: "Invalid email.", severity: "error" });
      return;
    }
    if (payload.password && payload.password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    try {
      if (payload.email) {
        const dupSnap = await getDocs(query(tutorsRef, where("email", "==", payload.email)));
        const hasDup = dupSnap.docs.some((d) => d.id !== id);
        if (hasDup) {
          setSnack({ open: true, msg: "Another tutor with this email already exists.", severity: "error" });
          return;
        }
      }

      await updateDoc(doc(db, "tutors", id), payload);
      setSnack({ open: true, msg: "Tutor updated.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update tutor.", severity: "error" });
    }
  };

  const approveTutor = async (id, isApproved) => {
    try {
      await updateDoc(doc(db, "tutors", id), { isApproved });
      setSnack({ open: true, msg: `Tutor ${isApproved ? "approved" : "unapproved"}.`, severity: "success" });
      fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update status.", severity: "error" });
    }
  };

  const softDeleteTutor = async (id) => {
    if (!window.confirm("Move this tutor to trash?")) return;
    try {
      await updateDoc(doc(db, "tutors", id), { isDeleted: true, deletedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Tutor moved to trash.", severity: "success" });
      await fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  const restoreTutor = async (id) => {
    try {
      await updateDoc(doc(db, "tutors", id), { isDeleted: false, restoredAt: serverTimestamp() });
      setSnack({ open: true, msg: "Tutor restored.", severity: "success" });
      await fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/tutor-admin-dashboard")} />

      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          search={search}
          setSearch={(v) => { setSearch(v); setPage(1); }}
          status={status}
          setStatus={(v) => { setStatus(v); setPage(1); }}
          showDeleted={showDeleted}
          setShowDeleted={(v) => { setShowDeleted(v); setPage(1); }}
          loading={loading}
          onReset={resetFilters}
          activeCount={activeCount}
          deletedCount={deletedCount}
          onAddClick={() => { setEditing(null); setDrawerOpen(true); }}
        />
      </Paper>

      <TutorsTable
        rows={pageItems}
        onApprove={approveTutor}
        onEdit={(t) => { if (!isDeletedTrue(t.isDeleted)) { setEditing(t); setDrawerOpen(true); } }}
        onSoftDelete={softDeleteTutor}
        onRestore={restoreTutor}
        showingDeleted={showDeleted}
        loading={loading}
      />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
          –
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </Typography>
        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </Box>

      <TutorDrawerForm
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        editing={editing}
        onSubmit={(payload) => (editing ? updateTutor(editing.id, payload) : addTutor(payload))}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
