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

import PaginationBar from "../../shared/PaginationBar"; // shared pager

import { db } from "../../firebaseConfig";
import validateEmail from "./helpers/validateEmail";

const PAGE_SIZE = 10;

// robust deleted check (handles true / "true" / 1)
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

const ManageAdmins = () => {
    const navigate = useNavigate();

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

    // filters
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("all");     // 'all' | 'master' | 'tutor'
    const [status, setStatus] = useState("all"); // 'all' | 'approved' | 'pending'
    const [showDeleted, setShowDeleted] = useState(false); // NEW

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
            // fetch ALL, then filter client-side (lets us toggle Active/Deleted instantly)
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
        setShowDeleted(false);     // NEW
        setPage(1);
    };

    // filter first (search + role + status + showDeleted)
    const filtered = useMemo(() => {
        const t = search.trim().toLowerCase();
        return admins.filter((a) => {
            const del = isDeletedTrue(a.isDeleted);
            if (!showDeleted && del) return false; // Active view hides deleted
            if (showDeleted && !del) return false; // Deleted view shows only deleted

            const matchSearch = (a.name || "").toLowerCase().includes(t) || (a.email || "").toLowerCase().includes(t);
            const matchRole =
                role === "all" ||
                (role === "master" && a.isMasterAdmin) ||
                (role === "tutor" && a.isTutorAdmin);
            const matchStatus = status === "all" || (status === "approved" ? a.isApproved : !a.isApproved);

            return matchSearch && matchRole && matchStatus;
        });
    }, [admins, search, role, status, showDeleted]);

    // then page it
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageItems = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page]
    );

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
                isDeleted: false,                 // NEW
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

    // SOFT DELETE (move to trash)
    const softDeleteAdmin = async (id) => {
        if (!window.confirm("Move this admin to trash?")) return;
        try {
            await updateDoc(doc(db, "admins", id), { isDeleted: true, deletedAt: serverTimestamp() });
            setSnack({ open: true, msg: "Admin moved to trash.", severity: "success" });
            await fetchData(); // refresh so it disappears from Active & shows in Deleted
        } catch (e) {
            console.error(e);
            setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
        }
    };

    // RESTORE from trash
    const restoreAdmin = async (id) => {
        try {
            await updateDoc(doc(db, "admins", id), { isDeleted: false, restoredAt: serverTimestamp() });
            setSnack({ open: true, msg: "Admin restored.", severity: "success" });
            await fetchData(); // refresh so it leaves Deleted & appears in Active
        } catch (e) {
            console.error(e);
            setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
        }
    };

    return (
        <Box sx={{ background: "linear-gradient(135deg, #FFDDC1, #C1FFD7)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
            <Paper elevation={12} sx={{ bgcolor: "#fff", borderRadius: 0, width: "100%", px: 0, py: 0 }}>
                <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 5 }, py: { xs: 2, md: 4 } }}>
                    <TopBar
                        onBack={() => navigate("/admin-dashboard")}
                        onCreate={() => { setEditing(null); setDrawerOpen(true); }}
                    />

                    <FiltersBar
                        loading={loading}
                        search={search}
                        setSearch={(v) => { setSearch(v); setPage(1); }}
                        role={role}
                        setRole={(v) => { setRole(v); setPage(1); }}
                        status={status}
                        setStatus={(v) => { setStatus(v); setPage(1); }}
                        showDeleted={showDeleted}                               // NEW
                        setShowDeleted={(v) => { setShowDeleted(v); setPage(1); }} // NEW
                        onReset={resetFilters}
                    />

                    {/* Table shows ONLY current page rows */}
                    <AdminsTable
                        rows={pageItems}
                        onApprove={approveAdmin}
                        onEdit={(a) => { if (!isDeletedTrue(a.isDeleted)) { setEditing(a); setDrawerOpen(true); } }}
                        onSoftDelete={softDeleteAdmin}           // NEW
                        onRestore={restoreAdmin}                 // NEW
                        showingDeleted={showDeleted}             // NEW
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
                </Box>
            </Paper>

            <AdminDrawerForm
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setEditing(null); }}
                editing={editing}
                onSubmit={(payload) => (editing ? updateAdmin(editing.id, payload) : addAdmin(payload))}
            />

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <MuiAlert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
                    {snack.msg}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default ManageAdmins;
