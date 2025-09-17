// src/admin/AdminDocManager/AdminDocManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Paper, Snackbar, Alert as MuiAlert, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp, orderBy, query,
} from "firebase/firestore";

import TopBar from "./components/TopBar";
import FiltersBar from "./components/FiltersBar";
import RequirementDrawerForm from "./components/RequirementDrawerForm";
import RequirementsTable from "./components/RequirementsTable";
import PaginationBar from "../../shared/PaginationBar";

import { db } from "../../firebaseConfig";
import { uploadRefFile, getSignedDocUrlLikeWorking } from "./helpers/cloudinary";

const PAGE_SIZE = 10;
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

export default function AdminDocManager() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // filters
  const [search, setSearch] = useState("");
  const [onlyMandatory, setOnlyMandatory] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // toasts
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  // subscribe data
  useEffect(() => {
    const qy = query(collection(db, "requiredDocs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setRows(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // Search + mandatory (counts are based on this step)
  const t = search.trim().toLowerCase();
  const searchMandatoryFiltered = useMemo(() => {
    return rows.filter((r) => {
      if (onlyMandatory && !r.isMandatory) return false;
      return (
        (r.title || "").toLowerCase().includes(t) ||
        (r.description || "").toLowerCase().includes(t)
      );
    });
  }, [rows, t, onlyMandatory]);

  // counts for Active | Deleted chip
  const activeCount = useMemo(
    () => searchMandatoryFiltered.filter((r) => !isDeletedTrue(r.isDeleted)).length,
    [searchMandatoryFiltered]
  );
  const deletedCount = useMemo(
    () => searchMandatoryFiltered.filter((r) => isDeletedTrue(r.isDeleted)).length,
    [searchMandatoryFiltered]
  );

  // Final list based on showDeleted toggle
  const filtered = useMemo(() => {
    return searchMandatoryFiltered.filter((r) =>
      showDeleted ? isDeletedTrue(r.isDeleted) : !isDeletedTrue(r.isDeleted)
    );
  }, [searchMandatoryFiltered, showDeleted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const resetFilters = () => {
    setSearch("");
    setOnlyMandatory(false);
    setShowDeleted(false);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (row) => {
    if (isDeletedTrue(row.isDeleted)) {
      setSnack({ open: true, msg: "Cannot edit a deleted requirement. Restore first.", severity: "warning" });
      return;
    }
    setEditing(row);
    setDrawerOpen(true);
  };

  // SOFT DELETE
  const softDelete = async (id) => {
    if (!window.confirm("Move this requirement to trash?")) return;
    try {
      await updateDoc(doc(db, "requiredDocs", id), {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Moved to trash.", severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  // RESTORE
  const restore = async (id) => {
    try {
      await updateDoc(doc(db, "requiredDocs", id), {
        isDeleted: false,
        updatedAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Restored.", severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  const openRef = async (row) => {
    try {
      if (isDeletedTrue(row.isDeleted)) {
        setSnack({ open: true, msg: "Cannot open reference for deleted requirement.", severity: "warning" });
        return;
      }
      const url = await getSignedDocUrlLikeWorking(row.refMedia);
      if (!url) return setSnack({ open: true, msg: "No reference file uploaded.", severity: "warning" });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to open reference.", severity: "error" });
    }
  };

  // create/update (unchanged logic)
  const upsertRequirement = async ({ title, description, isMandatory, refMedia, refFile }) => {
    try {
      let finalRefMedia = refMedia || null;
      if (refFile instanceof File) {
        finalRefMedia = await uploadRefFile(refFile, {
          folder: "student-docs/refs",
          access_mode: "authenticated",
        });
      }

      const refForDb = finalRefMedia
        ? {
            public_id: finalRefMedia.public_id ?? null,
            resource_type: finalRefMedia.resource_type ?? null,
            format: finalRefMedia.format ?? null,
            version:
              typeof finalRefMedia.version === "number" || typeof finalRefMedia.version === "string"
                ? finalRefMedia.version
                : null,
          }
        : null;

      const sanitize = (obj) =>
        obj == null ? null : Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v]));

      const refMediaClean = sanitize(refForDb);

      const basePayload = {
        title,
        description,
        isMandatory: !!isMandatory,
        isDeleted: false,
        ...(refMediaClean ? { refMedia: refMediaClean } : { refMedia: null }),
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, "requiredDocs", editing.id), basePayload);
        setSnack({ open: true, msg: "Requirement updated.", severity: "success" });
      } else {
        await addDoc(collection(db, "requiredDocs"), {
          ...basePayload,
          createdAt: serverTimestamp(),
        });
        setSnack({ open: true, msg: "Requirement created.", severity: "success" });
      }

      setDrawerOpen(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: e.message || "Failed to save requirement.", severity: "error" });
    }
  };

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/admin-dashboard")} />

      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          search={search}
          setSearch={(v) => { setSearch(v); setPage(1); }}
          onlyMandatory={onlyMandatory}
          setOnlyMandatory={(v) => { setOnlyMandatory(v); setPage(1); }}
          showDeleted={showDeleted}
          setShowDeleted={(v) => { setShowDeleted(v); setPage(1); }}
          activeCount={activeCount}
          deletedCount={deletedCount}
          loading={loading}
          onReset={resetFilters}
          onAddClick={openCreate}
        />
      </Paper>

      <RequirementsTable
        rows={pageItems}
        onEdit={openEdit}
        onSoftDelete={softDelete}
        onRestore={restore}
        onOpenRef={openRef}
        loading={loading}
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

      <RequirementDrawerForm
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        editing={editing}
        onSubmit={upsertRequirement}
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
