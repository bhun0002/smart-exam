// src/tutor/viewsubmission/hooks/useSubmissions.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig"; // adjust if needed

const looksLikeEmail = (s) => typeof s === "string" && s.includes("@");

const useSubmissions = ({ onError } = {}) => {
  const [loading, setLoading] = useState(true);
  const [examsMap, setExamsMap] = useState({});
  const [intakesMap, setIntakesMap] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // intakes
      const intakesSnap = await getDocs(query(collection(db, "intakes")));
      const _intakes = {};
      intakesSnap.forEach((d) => { _intakes[d.id] = d.data().name; });
      setIntakesMap(_intakes);

      // exams (skip deleted)
      const examsSnap = await getDocs(
        query(collection(db, "exams"), where("isDeleted", "==", 0), orderBy("createdAt", "desc"))
      );
      const _exams = {};
      examsSnap.forEach((d) => { _exams[d.id] = { id: d.id, ...d.data() }; });
      setExamsMap(_exams);

      // students (to read 6-digit studentId)
      const studentsSnap = await getDocs(
        query(collection(db, "students"), where("isDeleted", "==", false))
      );
      const _students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(_students);

      // submissions
      const subsSnap = await getDocs(
        query(collection(db, "examSubmissions"), orderBy("startTime", "desc"))
      );
      const _subs = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSubmissions(_subs);
    } catch (e) {
      console.error("[useSubmissions] fetchAll error", e);
      onError?.("Failed to fetch submissions.");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build student indexes (no auth ids)
  const studentIndex = useMemo(() => {
    const byDocId = new Map();       // students doc id
    const byEmail = new Map();       // students.email
    const byNameIntake = new Map();  // `${name}|${intakeId}` lowercased

    for (const s of students) {
      byDocId.set(String(s.id), s);
      if (s.email) byEmail.set(String(s.email).toLowerCase(), s);
      if (s.name && s.intakeId) {
        byNameIntake.set(`${s.name.toLowerCase()}|${s.intakeId}`, s);
      }
    }
    return { byDocId, byEmail, byNameIntake };
  }, [students]);

  // Enrich submissions with humanStudentId (the 6-digit code from students.studentId)
  const submissionsEnriched = useMemo(() => {
    return submissions.map((sub) => {
      let humanStudentId = null;

      const docIdKey = sub.studentId ? String(sub.studentId) : null; // StudentTakeExam saved user.id here
      const emailLower =
        sub.studentEmail
          ? String(sub.studentEmail).toLowerCase()
          : (looksLikeEmail(sub.studentName) ? String(sub.studentName).toLowerCase() : null);
      const nameLower = sub.studentName ? String(sub.studentName).toLowerCase() : null;
      // intakeId might be on submission or derive from exam
      const examIntakeId = (sub.examId && sub.examId in examsMap) ? examsMap[sub.examId].intakeId : null;

      // Try joins: by doc id → by email → by name+intake
      let found =
        (docIdKey && studentIndex.byDocId.get(docIdKey)) ||
        (emailLower && studentIndex.byEmail.get(emailLower)) ||
        (nameLower && examIntakeId && studentIndex.byNameIntake.get(`${nameLower}|${examIntakeId}`));

      if (found?.studentId) humanStudentId = found.studentId;

      return { ...sub, humanStudentId };
    });
  }, [submissions, studentIndex, examsMap]);

  const refresh = useCallback(() => fetchAll(), [fetchAll]);

  const softDeleteSubmission = useCallback(async (submissionId) => {
    try {
      const ref = doc(db, "examSubmissions", submissionId);
      await updateDoc(ref, { isDeleted: 1 });
      return { ok: true };
    } catch (e) {
      console.error("[useSubmissions] softDeleteSubmission", e);
      return { ok: false, error: "DB error" };
    }
  }, []);

  return {
    loading,
    examsMap,
    intakesMap,
    submissions: submissionsEnriched, // << enriched with humanStudentId
    refresh,
    softDeleteSubmission,
  };
};

export default useSubmissions;
