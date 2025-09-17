// src/admin/ManageStudents.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { Box, Paper, Snackbar, Alert as MuiAlert, Typography } from "@mui/material";

import TopBar from "./components/TopBar";
import FiltersBar from "./components/FiltersBar";
import StudentDrawerForm from "./components/StudentDrawerForm";
import StudentsTable from "./components/StudentsTable";

import { db } from "../../firebaseConfig";
import { mintStudentId } from "./helpers/mintStudentId"; // ✅ uses helper (YYMM + CC + SEQ)

const PAGE_SIZE = 10;
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

const ManageStudents = () => {
  const navigate = useNavigate();

  // data
  const [students, setStudents] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [courses, setCourses] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // filters
  const [search, setSearch] = useState("");
  const [intakeId, setIntakeId] = useState("all");
  const [courseId, setCourseId] = useState("all"); // course filter (DOC id)
  const [status, setStatus] = useState("all"); // all | approved | pending
  const [showDeleted, setShowDeleted] = useState(false);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // pagination
  const [page, setPage] = useState(1);

  const closeSnack = (_, r) => {
    if (r === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  const studentsRef = collection(db, "students");
  const intakesRef = collection(db, "intakes");
  const coursesRef = collection(db, "courses");

  // ------- Load data -------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [iSnap, cSnap, sSnap] = await Promise.all([
        getDocs(query(intakesRef, orderBy("name", "asc"))),
        getDocs(query(coursesRef, orderBy("name", "asc"))),
        getDocs(query(studentsRef, orderBy("createdAt", "desc"))),
      ]);

      const iList = iSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const cList = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setIntakes(iList);
      setCourses(cList);

      const sList = sSnap.docs.map((d) => {
        const s = d.data();
        const intake = iList.find((i) => i.id === s.intakeId);
        const course = cList.find((c) => c.id === s.courseId);
        return {
          id: d.id,
          ...s,
          intakeName: intake?.name || "",
          courseName: course?.name || "",
        };
      });

      setStudents(sList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ------- Filtering / paging -------
  const filtered = useMemo(() => {
    const t = (search || "").trim().toLowerCase();
    return students.filter((s) => {
      if (showDeleted && !isDeletedTrue(s.isDeleted)) return false;
      if (!showDeleted && isDeletedTrue(s.isDeleted)) return false;

      const statusOk =
        status === "all" ||
        (status === "approved" ? s.isApproved === true : s.isApproved !== true);

      const intakeOk = intakeId === "all" || s.intakeId === intakeId;
      const courseOk = courseId === "all" || s.courseId === courseId;

      const searchOk =
        !t ||
        (s.name || "").toLowerCase().includes(t) ||
        (s.email || "").toLowerCase().includes(t) ||
        (s.contactNumber || "").toLowerCase().includes(t) || // ✅ search by contact
        (s.intakeName || "").toLowerCase().includes(t) ||
        (s.courseName || "").toLowerCase().includes(t) ||
        (s.studentId && String(s.studentId).toLowerCase().includes(t));

      return statusOk && intakeOk && courseOk && searchOk;
    });
  }, [students, search, status, intakeId, courseId, showDeleted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleReset = () => {
    setSearch("");
    setIntakeId("all");
    setCourseId("all");
    setStatus("all");
    setShowDeleted(false);
    setPage(1);
  };

  // ------- Actions -------
  const addStudent = async ({ name, email, password, intakeId, courseId, contactNumber }) => {
    if (!name || !email || !password || !intakeId || !courseId) {
      setSnack({ open: true, msg: "All fields (including Course) are required.", severity: "error" });
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      setSnack({ open: true, msg: "Invalid email.", severity: "error" });
      return;
    }
    if (password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }

    try {
      // unique email check
      const dup = await getDocs(query(studentsRef, where("email", "==", email)));
      if (!dup.empty) {
        setSnack({ open: true, msg: "Email already exists.", severity: "error" });
        return;
      }

      // find selected course's 2-digit courseId (e.g. "01")
      const courseDoc = courses.find((c) => c.id === courseId);
      const courseTwoDigit = courseDoc?.courseId;
      if (!courseTwoDigit) {
        setSnack({
          open: true,
          msg: "Selected course is missing its 2-digit courseId.",
          severity: "error",
        });
        return;
      }

      // ✅ Mint studentId: YY(2)+MM(2)+CourseID(2)+SEQ(2)
      const mintedId = await mintStudentId(db, courseTwoDigit);

      await addDoc(studentsRef, {
        studentId: mintedId,
        name: name.trim(),
        email: email.trim(),
        contactNumber: (contactNumber || "").trim(), // ✅ save contact
        password: password.trim(),
        intakeId,
        courseId, // keep DOC id for joins
        isApproved: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });

      setSnack({ open: true, msg: "Student added.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: e.message || "Failed to add student.", severity: "error" });
    }
  };

  const updateStudent = async (id, payload) => {
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setSnack({ open: true, msg: "Invalid email.", severity: "error" });
      return;
    }
    if (payload.password && payload.password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    if (!payload.intakeId) {
      setSnack({ open: true, msg: "Intake cannot be empty.", severity: "error" });
      return;
    }
    if (!payload.courseId) {
      setSnack({ open: true, msg: "Course cannot be empty.", severity: "error" });
      return;
    }

    try {
      if (payload.email) {
        const dup = await getDocs(query(studentsRef, where("email", "==", payload.email)));
        const hasDup = dup.docs.some((d) => d.id !== id);
        if (hasDup) {
          setSnack({
            open: true,
            msg: "Another student with this email already exists.",
            severity: "error",
          });
          return;
        }
      }

      await updateDoc(doc(db, "students", id), payload);
      setSnack({ open: true, msg: "Student updated.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update student.", severity: "error" });
    }
  };

  const onApprove = async (id, next) => {
    try {
      await updateDoc(doc(db, "students", id), { isApproved: next, updatedAt: serverTimestamp() });
      setSnack({
        open: true,
        msg: next ? "Student approved." : "Set to pending.",
        severity: "success",
      });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update.", severity: "error" });
    }
  };

  const onSoftDelete = async (id) => {
    const ok = window.confirm("Move this student to trash?");
    if (!ok) return;
    try {
      await updateDoc(doc(db, "students", id), { isDeleted: 1, updatedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Student moved to trash.", severity: "success" });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  const onRestore = async (id) => {
    try {
      await updateDoc(doc(db, "students", id), { isDeleted: 0, updatedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Student restored.", severity: "success" });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar
              title="Manage Students"
              onBack={() => navigate("/tutor-dashboard")}  
            />

      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          loading={loading}
          intakesMap={Object.fromEntries(intakes.map((i) => [i.id, i.name]))}
          coursesMap={Object.fromEntries(courses.map((c) => [c.id, c.name]))}
          search={search}
          setSearch={setSearch}
          intakeId={intakeId}
          setIntakeId={(v) => {
            setIntakeId(v);
            setPage(1);
          }}
          courseId={courseId}
          setCourseId={(v) => {
            setCourseId(v);
            setPage(1);
          }}
          status={status}
          setStatus={(v) => {
            setStatus(v);
            setPage(1);
          }}
          showDeleted={showDeleted}
          setShowDeleted={(v) => {
            setShowDeleted(v);
            setPage(1);
          }}
          activeCount={filtered.filter((s) => !isDeletedTrue(s.isDeleted)).length}
          deletedCount={filtered.filter((s) => isDeletedTrue(s.isDeleted)).length}
          onReset={handleReset}
          onAddClick={() => {
            setEditing(null);
            setDrawerOpen(true);
          }}
        />
      </Paper>

      <StudentsTable
        rows={pageItems}
        loading={loading}
        onEdit={(row) => {
          setEditing(row);
          setDrawerOpen(true);
        }}
        onSoftDelete={onSoftDelete}
        onRestore={onRestore}
        onApprove={onApprove}
        showingDeleted={showDeleted}
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        onAddClick={() => {
          setEditing(null);
          setDrawerOpen(true);
        }}
      />

      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
      </Typography>

      {/* Drawer form */}
      <StudentDrawerForm
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editing={editing}
        intakes={intakes}
        courses={courses}
        onSubmit={async (payload) => {
          if (editing?.id) {
            await updateStudent(editing.id, payload);
          } else {
            await addStudent(payload);
          }
        }}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={closeSnack}
          severity={snack.severity}
          elevation={6}
          variant="filled"
          sx={{
            backgroundColor:
              snack.severity === "error"
                ? "#ef5350"
                : snack.severity === "info"
                ? "#2196f3"
                : "#81c784",
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        >
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ManageStudents;
