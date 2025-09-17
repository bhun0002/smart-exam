// src/admin/AdminManageFee.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  collection, addDoc, getDocs, updateDoc, doc,
  serverTimestamp, query, orderBy, where,
} from "firebase/firestore";
import { Box, Paper, Snackbar, Alert as MuiAlert, Typography } from "@mui/material";

import TopBar from "./components/TopBar";
import FiltersBar from "./components/FiltersBar";
import FeesTable from "./components/FeesTable";
import AddFeeDrawer from "./components/AddFeeDrawer";
import EditFeeDrawer from "./components/EditFeeDrawer";
import PaginationBar from "../../shared/PaginationBar";

const PAGE_SIZE = 10;
const isTrue = (v) => v === true || v === "true" || v === 1;

export default function AdminManageFee() {
  const navigate = useNavigate();

  // Data
  const [fees, setFees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawers
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null); // full fee row

  // Filters
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterIntakeId, setFilterIntakeId] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  // Toast
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const feesRef = collection(db, "fees");
  const coursesRef = collection(db, "courses");
  const intakesRef = collection(db, "intakes");

  // Load master data and fees
  const loadAll = async () => {
    setLoading(true);
    try {
      const [feeSnap, courseSnap, intakeSnap] = await Promise.all([
        getDocs(query(feesRef, orderBy("createdAt", "desc"))),
        getDocs(query(coursesRef, orderBy("name_lc", "asc"))),
        getDocs(query(intakesRef, orderBy("createdAt", "desc"))),
      ]);

      setFees(feeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCourses(courseSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIntakes(intakeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPage(1);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load fee data.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  // Counts for badge
  const activeCount = useMemo(() => fees.filter((f) => !isTrue(f.isDeleted)).length, [fees]);
  const deletedCount = useMemo(() => fees.filter((f) => isTrue(f.isDeleted)).length, [fees]);

  // Helpers for display
  const byId = (arr) => {
    const m = new Map();
    arr.forEach((x) => m.set(x.id, x));
    return m;
  };
  const courseMap = useMemo(() => byId(courses), [courses]);
  const intakeMap = useMemo(() => byId(intakes), [intakes]);

  // ADD
  const handleAddSubmit = async ({ courseId, intakeId, amount, currency, notes }) => {
    try {
      const course = courseMap.get(courseId);
      const intake = intakeMap.get(intakeId);

      if (!course || isTrue(course.isDeleted)) {
        setSnack({ open: true, msg: "Select a valid (active) course.", severity: "error" });
        return;
      }
      if (!intake || isTrue(intake.isDeleted)) {
        setSnack({ open: true, msg: "Select a valid (active) intake.", severity: "error" });
        return;
      }
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < 0) {
        setSnack({ open: true, msg: "Enter a valid non-negative amount.", severity: "error" });
        return;
      }
      const curr = (currency || "CAD").trim().toUpperCase();

      // Duplicate guard for active fees (same course + intake)
      const dupSnap = await getDocs(query(
        feesRef,
        where("courseId", "==", courseId),
        where("intakeId", "==", intakeId),
        where("isDeleted", "==", false)
      ));
      if (!dupSnap.empty) {
        setSnack({ open: true, msg: "Fee for this Course & Intake already exists.", severity: "error" });
        return;
      }

      await addDoc(feesRef, {
        courseId,
        courseName: course.name || "",
        intakeId,
        intakeName: intake.name || "",
        amount: amt,
        currency: curr,
        notes: (notes || "").trim(),
        isDeleted: false,
        createdAt: serverTimestamp(),
      });

      setSnack({ open: true, msg: "Fee added.", severity: "success" });
      setAddOpen(false);
      await loadAll();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add fee.", severity: "error" });
    }
  };

  // EDIT open
  const openEdit = (row) => {
    if (isTrue(row.isDeleted)) {
      setSnack({ open: true, msg: "Cannot edit a deleted fee. Restore first.", severity: "warning" });
      return;
    }
    setEditing(row);
    setEditOpen(true);
  };

  // UPDATE
  const handleEditSubmit = async (payload) => {
    if (!editing?.id) return;
    try {
      const { courseId, intakeId, amount, currency, notes } = payload;

      const course = courseMap.get(courseId);
      const intake = intakeMap.get(intakeId);
      if (!course || isTrue(course.isDeleted) || !intake || isTrue(intake.isDeleted)) {
        setSnack({ open: true, msg: "Select valid (active) course & intake.", severity: "error" });
        return;
      }
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < 0) {
        setSnack({ open: true, msg: "Enter a valid non-negative amount.", severity: "error" });
        return;
      }
      const curr = (currency || "CAD").trim().toUpperCase();

      // Duplicate guard excluding current
      const dupSnap = await getDocs(query(
        feesRef,
        where("courseId", "==", courseId),
        where("intakeId", "==", intakeId),
        where("isDeleted", "==", false)
      ));
      const dupExists = dupSnap.docs.some((d) => d.id !== editing.id);
      if (dupExists) {
        setSnack({ open: true, msg: "Another fee for this Course & Intake exists.", severity: "error" });
        return;
      }

      await updateDoc(doc(db, "fees", editing.id), {
        courseId,
        courseName: course.name || "",
        intakeId,
        intakeName: intake.name || "",
        amount: amt,
        currency: curr,
        notes: (notes || "").trim(),
        updatedAt: serverTimestamp(),
      });

      setSnack({ open: true, msg: "Fee updated.", severity: "success" });
      setEditOpen(false);
      setEditing(null);
      await loadAll();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update fee.", severity: "error" });
    }
  };

  // SOFT DELETE / RESTORE
  const softDelete = async (id) => {
    if (!window.confirm("Move this fee to trash?")) return;
    try {
      await updateDoc(doc(db, "fees", id), { isDeleted: true, updatedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Moved to trash.", severity: "success" });
      await loadAll();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  const restore = async (id) => {
    try {
      await updateDoc(doc(db, "fees", id), { isDeleted: false, updatedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Restored.", severity: "success" });
      await loadAll();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  // FILTERS & PAGE
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return fees.filter((f) => {
      const del = isTrue(f.isDeleted);
      if (!showDeleted && del) return false;
      if (showDeleted && !del) return false;
      if (filterCourseId && f.courseId !== filterCourseId) return false;
      if (filterIntakeId && f.intakeId !== filterIntakeId) return false;

      const hay = `${f.courseName || ""} ${f.intakeName || ""} ${f.amount ?? ""} ${f.currency || ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [fees, search, showDeleted, filterCourseId, filterIntakeId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const resetFilters = () => {
    setSearch("");
    setShowDeleted(false);
    setFilterCourseId("");
    setFilterIntakeId("");
    setPage(1);
  };

  // Active options for pickers
  const activeCourses = useMemo(() => courses.filter((c) => !isTrue(c.isDeleted)), [courses]);
  const activeIntakes = useMemo(() => intakes.filter((i) => !isTrue(i.isDeleted)), [intakes]);

  return (
    <Box sx={{ bgcolor: "#f7f5f2", minHeight: "100vh", py: { xs: 3, md: 4 }, px: { xs: 3, md: 4 } }}>
      <TopBar onBack={() => navigate("/admin-dashboard")} />

      <Paper elevation={3} sx={{ p: { xs: 1.5, md: 2 }, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          search={search}
          setSearch={(v) => { setSearch(v); setPage(1); }}
          showDeleted={showDeleted}
          setShowDeleted={(v) => { setShowDeleted(v); setPage(1); }}
          loading={loading}
          onReset={resetFilters}
          activeCount={activeCount}
          deletedCount={deletedCount}
          courses={activeCourses}
          intakes={activeIntakes}
          filterCourseId={filterCourseId}
          setFilterCourseId={(id) => { setFilterCourseId(id); setPage(1); }}
          filterIntakeId={filterIntakeId}
          setFilterIntakeId={(id) => { setFilterIntakeId(id); setPage(1); }}
          onAddClick={() => setAddOpen(true)}
        />
      </Paper>

      <FeesTable
        rows={pageItems}
        loading={loading}
        onEdit={openEdit}
        onSoftDelete={softDelete}
        onRestore={restore}
        showingDeleted={showDeleted}
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

      <AddFeeDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddSubmit}
        courses={activeCourses}
        intakes={activeIntakes}
      />

      <EditFeeDrawer
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null); }}
        onSubmit={handleEditSubmit}
        courses={activeCourses}
        intakes={activeIntakes}
        initial={editing}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
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
