// src/admin/ManageIntakes.jsx
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
import IntakesTable from "./components/IntakesTable";
import AddIntakeDrawer from "./components/AddIntakeDrawer";
import EditIntakeDrawer from "./components/EditIntakeDrawer";
import PaginationBar from "../../shared/PaginationBar";

const PAGE_SIZE = 10;

// treat true/"true"/1 as deleted for robustness
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

const ManageIntakes = () => {
  const navigate = useNavigate();

  // data
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);

  // add drawer
  const [addOpen, setAddOpen] = useState(false);

  // edit drawer
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

  const intakesRef = collection(db, "intakes");

  // load
  const getIntakes = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(intakesRef, orderBy("createdAt", "desc")));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIntakes(list);
      setPage(1);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load intakes.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { getIntakes(); }, []);

  // local dup cache
  const existingNames = useMemo(() => {
    const s = new Set();
    intakes.forEach((i) => {
      if (i?.name_lc) s.add(String(i.name_lc));
      else if (i?.name) s.add(String(i.name).toLowerCase());
    });
    return s;
  }, [intakes]);

  // --- ADD ---
  const handleAddSubmit = async (name) => {
    const nameLc = String(name || "").toLowerCase();
    if (!nameLc) {
      setSnack({ open: true, msg: "Please provide a valid intake name.", severity: "error" });
      return;
    }

    if (existingNames.has(nameLc)) {
      setSnack({ open: true, msg: `An intake named "${name}" already exists.`, severity: "error" });
      return;
    }

    try {
      const dup = await getDocs(query(intakesRef, where("name_lc", "==", nameLc)));
      if (!dup.empty) {
        setSnack({ open: true, msg: `An intake named "${name}" already exists.`, severity: "error" });
        return;
      }

      await addDoc(intakesRef, {
        name,
        name_lc: nameLc,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: `Intake "${name}" added.`, severity: "success" });
      setAddOpen(false);
      await getIntakes();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add intake.", severity: "error" });
    }
  };

  // --- EDIT open ---
  const openEdit = (row) => {
    if (isDeletedTrue(row.isDeleted)) {
      setSnack({ open: true, msg: "Cannot edit a deleted intake. Restore first.", severity: "warning" });
      return;
    }
    setEditingId(row.id);
    setEditingName(row.name || "");
    setEditOpen(true);
  };

  // --- UPDATE ---
  const handleEditSubmit = async (newName) => {
    if (!editingId) return;

    const newLc = String(newName || "").toLowerCase();
    if (!newLc) {
      setSnack({ open: true, msg: "Please choose a valid month and year.", severity: "error" });
      return;
    }

    // local dup (ignore current)
    if (
      intakes.some(
        (i) => i.id !== editingId &&
          (i.name_lc ? i.name_lc === newLc : String(i.name || "").toLowerCase() === newLc)
      )
    ) {
      setSnack({ open: true, msg: `An intake named "${newName}" already exists.`, severity: "error" });
      return;
    }

    try {
      // server dup (ignore current)
      const dupSnap = await getDocs(query(intakesRef, where("name_lc", "==", newLc)));
      const dupExists = dupSnap.docs.some((d) => d.id !== editingId);
      if (dupExists) {
        setSnack({ open: true, msg: `An intake named "${newName}" already exists.`, severity: "error" });
        return;
      }

      await updateDoc(doc(db, "intakes", editingId), {
        name: newName,
        name_lc: newLc,
        updatedAt: serverTimestamp(),
      });

      setSnack({ open: true, msg: "Intake updated.", severity: "success" });
      setEditOpen(false);
      setEditingId(null);
      setEditingName("");
      await getIntakes();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update intake.", severity: "error" });
    }
  };

  // --- SOFT DELETE ---
  const softDelete = async (id) => {
    if (!window.confirm("Move this intake to trash?")) return;
    try {
      await updateDoc(doc(db, "intakes", id), {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Moved to trash.", severity: "success" });
      await getIntakes();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  // --- RESTORE ---
  const restore = async (id) => {
    try {
      await updateDoc(doc(db, "intakes", id), {
        isDeleted: false,
        updatedAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Restored.", severity: "success" });
      await getIntakes();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  // SEARCH FILTER (used for counts + list)
  const t = search.trim().toLowerCase();
  const searchFiltered = useMemo(
    () => intakes.filter((i) => (i.name || "").toLowerCase().includes(t)),
    [intakes, t]
  );
  const activeCount = searchFiltered.filter((i) => !isDeletedTrue(i.isDeleted)).length;
  const deletedCount = searchFiltered.filter((i) => isDeletedTrue(i.isDeleted)).length;

  // FINAL FILTER (active vs deleted toggle)
  const filtered = useMemo(() => {
    return searchFiltered.filter((i) => {
      const del = isDeletedTrue(i.isDeleted);
      return showDeleted ? del : !del;
    });
  }, [searchFiltered, showDeleted]);

  // PAGINATION
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
          activeCount={activeCount}
          deletedCount={deletedCount}
          loading={loading}
          onReset={resetFilters}
          onAddClick={() => setAddOpen(true)}
        />
      </Paper>

      <IntakesTable
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

      <AddIntakeDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddSubmit}
      />

      <EditIntakeDrawer
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
};

export default ManageIntakes;
