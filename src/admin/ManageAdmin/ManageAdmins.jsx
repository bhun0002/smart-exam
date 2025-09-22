// src/admin/ManageAdmins.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Snackbar, Alert as MuiAlert, Typography } from "@mui/material";
import {
  collection, addDoc, getDocs, updateDoc, doc, serverTimestamp,
  query, orderBy, where
} from "firebase/firestore";

import TopBar from "./components/TopBar";
import FiltersBar from "./components/FiltersBar";
import AdminDrawerForm from "./components/AdminDrawerForm";
import AdminsTable from "./components/AdminsTable";
import PaginationBar from "../../shared/PaginationBar";

import { db } from "../../firebaseConfig";
import validateEmail from "./helpers/validateEmail";

const PAGE_SIZE = 10;
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

const ManageAdmins = () => {
  const navigate = useNavigate();

  // data
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");     // 'all' | 'master' | 'tutor'
  const [status, setStatus] = useState("all"); // 'all' | 'approved' | 'pending'
  const [showDeleted, setShowDeleted] = useState(false);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // pagination
  const [page, setPage] = useState(1);

  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const adminsRef = collection(db, "admins");

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(adminsRef, orderBy("createdAt", "desc")));
      setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPage(1);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load admins.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetFilters = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setShowDeleted(false);
    setPage(1);
  };

  // filter + search
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return admins.filter((a) => {
      const del = isDeletedTrue(a.isDeleted);
      if (!showDeleted && del) return false;
      if (showDeleted && !del) return false;

      const matchSearch =
        (a.name || "").toLowerCase().includes(t) ||
        (a.email || "").toLowerCase().includes(t);

      const matchRole =
        role === "all" ||
        (role === "master" && a.isMasterAdmin) ||
        (role === "tutor" && a.isTutorAdmin);

      const matchStatus =
        status === "all" || (status === "approved" ? a.isApproved : !a.isApproved);

      return matchSearch && matchRole && matchStatus;
    });
  }, [admins, search, role, status, showDeleted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // counts (for the Active | Deleted badge)
  const activeCount = filtered.filter((a) => !isDeletedTrue(a.isDeleted)).length;
  const deletedCount = filtered.filter((a) => isDeletedTrue(a.isDeleted)).length;

  // actions
  const addAdmin = async ({ name, email, password, isMasterAdmin, isTutorAdmin }) => {
    if (!name || !email || !password) {
      setSnack({ open: true, msg: "Please fill in all required fields.", severity: "error" });
      return;
    }
    if (!validateEmail(email)) {
      setSnack({ open: true, msg: "Please enter a valid email.", severity: "error" });
      return;
    }
    if (password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    try {
      const dup = await getDocs(query(adminsRef, where("email", "==", email)));
      if (!dup.empty) {
        setSnack({ open: true, msg: "An admin with this email already exists.", severity: "error" });
        return;
      }
      await addDoc(adminsRef, {
        name, email, password,
        isMasterAdmin: !!isMasterAdmin,
        isTutorAdmin: !!isTutorAdmin,
        isApproved: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Admin added. Approval pending.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add admin.", severity: "error" });
    }
  };

  const updateAdmin = async (id, payload) => {
    if (payload.email && !validateEmail(payload.email)) {
      setSnack({ open: true, msg: "Please enter a valid email.", severity: "error" });
      return;
    }
    if (payload.password && payload.password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    try {
      if (payload.email) {
        const dup = await getDocs(query(adminsRef, where("email", "==", payload.email)));
        const hasDup = dup.docs.some((d) => d.id !== id);
        if (hasDup) {
          setSnack({ open: true, msg: "Another admin with this email already exists.", severity: "error" });
          return;
        }
      }
      await updateDoc(doc(db, "admins", id), payload);
      setSnack({ open: true, msg: "Admin updated.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update admin.", severity: "error" });
    }
  };

  const approveAdmin = async (id, isApproved) => {
    try {
      await updateDoc(doc(db, "admins", id), { isApproved });
      setSnack({ open: true, msg: `Admin ${isApproved ? "approved" : "unapproved"}.`, severity: "success" });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update status.", severity: "error" });
    }
  };

  const softDeleteAdmin = async (id) => {
    if (!window.confirm("Move this admin to trash?")) return;
    try {
      await updateDoc(doc(db, "admins", id), { isDeleted: true, deletedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Admin moved to trash.", severity: "success" });
      await fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  const restoreAdmin = async (id) => {
    try {
      await updateDoc(doc(db, "admins", id), { isDeleted: false, restoredAt: serverTimestamp() });
      setSnack({ open: true, msg: "Admin restored.", severity: "success" });
      await fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/admin-dashboard")} />

      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          loading={loading}
          search={search}
          setSearch={(v) => { setSearch(v); setPage(1); }}
          role={role}
          setRole={(v) => { setRole(v); setPage(1); }}
          status={status}
          setStatus={(v) => { setStatus(v); setPage(1); }}
          showDeleted={showDeleted}
          setShowDeleted={(v) => { setShowDeleted(v); setPage(1); }}
          activeCount={activeCount}
          deletedCount={deletedCount}
          onReset={resetFilters}
          onAddClick={() => { setEditing(null); setDrawerOpen(true); }}
        />
      </Paper>

      <AdminsTable
        rows={pageItems}
        onApprove={approveAdmin}
        onEdit={(a) => { if (!isDeletedTrue(a.isDeleted)) { setEditing(a); setDrawerOpen(true); } }}
        onSoftDelete={softDeleteAdmin}
        onRestore={restoreAdmin}
        showingDeleted={showDeleted}
        loading={loading}
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

      <AdminDrawerForm
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        editing={editing}
        onSubmit={(payload) => (editing ? updateAdmin(editing.id, payload) : addAdmin(payload))}
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
};

export default ManageAdmins;
