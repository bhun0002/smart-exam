// src/admin/AdminManageCourse.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  collection, addDoc, getDocs, updateDoc, doc,
  serverTimestamp, query, orderBy, where, runTransaction
} from "firebase/firestore";
import { Box, Paper, Snackbar, Alert as MuiAlert, Typography } from "@mui/material";

import TopBar from "./components/TopBar";
import FiltersBar from "./components/FiltersBar";
import CoursesTable from "./components/CoursesTable";
import AddCourseDrawer from "./components/AddCourseDrawer";
import EditCourseDrawer from "./components/EditCourseDrawer";
import PaginationBar from "../../shared/PaginationBar";

const PAGE_SIZE = 10;
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

export default function AdminManageCourse() {
  const navigate = useNavigate();

  // data
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // drawers
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  // pagination
  const [page, setPage] = useState(1);

  // toast
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const coursesRef = collection(db, "courses");

  const getCourses = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(coursesRef, orderBy("createdAt", "desc")));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCourses(list);
      setPage(1);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load courses.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { getCourses(); }, []);

  const existingNames = useMemo(() => {
    const s = new Set();
    courses.forEach((c) => s.add((c.name_lc || String(c.name || "")).toLowerCase()));
    return s;
  }, [courses]);

  const activeCount = useMemo(() => courses.filter((c) => !isDeletedTrue(c.isDeleted)).length, [courses]);
  const deletedCount = useMemo(() => courses.filter((c) => isDeletedTrue(c.isDeleted)).length, [courses]);

  // Mint next two-digit Course ID ("01".."99") via transaction
  const mintCourseId = async () => {
    const ctrRef = doc(db, "counters", "COURSE");
    let id2 = null;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ctrRef);
      const last = snap.exists() ? (snap.data().lastSeq || 0) : 0;
      const next = last + 1;
      if (next > 99) throw new Error("Course ID capacity exceeded (00–99).");
      tx.set(ctrRef, { lastSeq: next, updatedAt: serverTimestamp() }, { merge: true });
      id2 = String(next).padStart(2, "0");
    });
    return id2;
  };

  // ADD
  const handleAddSubmit = async (name) => {
    const nameLc = String(name || "").trim().toLowerCase();
    if (!nameLc) return setSnack({ open: true, msg: "Please provide a valid course name.", severity: "error" });
    if (existingNames.has(nameLc)) return setSnack({ open: true, msg: `Course "${name}" already exists.`, severity: "error" });

    try {
      const dup = await getDocs(query(coursesRef, where("name_lc", "==", nameLc)));
      if (!dup.empty) return setSnack({ open: true, msg: `Course "${name}" already exists.`, severity: "error" });

      const courseId = await mintCourseId();

      await addDoc(coursesRef, {
        courseId,
        name: name.trim(),
        name_lc: nameLc,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: `Course "${name}" added.`, severity: "success" });
      setAddOpen(false);
      await getCourses();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: e.message || "Failed to add course.", severity: "error" });
    }
  };

  // EDIT open
  const openEdit = (row) => {
    if (isDeletedTrue(row.isDeleted)) {
      setSnack({ open: true, msg: "Cannot edit a deleted course. Restore first.", severity: "warning" });
      return;
    }
    setEditingId(row.id);
    setEditingName(row.name || "");
    setEditOpen(true);
  };

  // UPDATE (courseId does not change)
  const handleEditSubmit = async (newName) => {
    if (!editingId) return;

    const newLc = String(newName || "").trim().toLowerCase();
    if (!newLc) return setSnack({ open: true, msg: "Please provide a valid course name.", severity: "error" });

    if (courses.some((c) => c.id !== editingId && (c.name_lc || String(c.name || "").toLowerCase()) === newLc)) {
      return setSnack({ open: true, msg: `Course "${newName}" already exists.`, severity: "error" });
    }

    try {
      const dupSnap = await getDocs(query(coursesRef, where("name_lc", "==", newLc)));
      const dupExists = dupSnap.docs.some((d) => d.id !== editingId);
      if (dupExists) return setSnack({ open: true, msg: `Course "${newName}" already exists.`, severity: "error" });

      await updateDoc(doc(db, "courses", editingId), {
        name: newName.trim(),
        name_lc: newLc,
        updatedAt: serverTimestamp(),
      });

      setSnack({ open: true, msg: "Course updated.", severity: "success" });
      setEditOpen(false);
      setEditingId(null);
      setEditingName("");
      await getCourses();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update course.", severity: "error" });
    }
  };

  // SOFT DELETE / RESTORE
  const softDelete = async (id) => {
    if (!window.confirm("Move this course to trash?")) return;
    try {
      await updateDoc(doc(db, "courses", id), { isDeleted: true, updatedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Moved to trash.", severity: "success" });
      await getCourses();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  const restore = async (id) => {
    try {
      await updateDoc(doc(db, "courses", id), { isDeleted: false, updatedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Restored.", severity: "success" });
      await getCourses();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  // FILTERS & PAGE (search by name or courseId)
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return courses.filter((c) => {
      const del = isDeletedTrue(c.isDeleted);
      if (!showDeleted && del) return false;
      if (showDeleted && !del) return false;
      const hay = `${c.name || ""} ${c.courseId || ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [courses, search, showDeleted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const resetFilters = () => {
    setSearch("");
    setShowDeleted(false);
    setPage(1);
  };

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/admin-dashboard")} />

      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          search={search}
          setSearch={(v) => { setSearch(v); setPage(1); }}
          showDeleted={showDeleted}
          setShowDeleted={(v) => { setShowDeleted(v); setPage(1); }}
          loading={loading}
          onReset={resetFilters}
          activeCount={activeCount}
          deletedCount={deletedCount}
          onAddClick={() => setAddOpen(true)}
        />
      </Paper>

      <CoursesTable
        rows={pageItems}
        loading={loading}
        onEdit={openEdit}
        onSoftDelete={softDelete}
        onRestore={restore}
        showingDeleted={showDeleted}
      />

      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
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

      <AddCourseDrawer open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddSubmit} />

      <EditCourseDrawer
        open={editOpen}
        initialName={editingName}
        onClose={() => { setEditOpen(false); setEditingId(null); setEditingName(""); }}
        onSubmit={handleEditSubmit}
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
