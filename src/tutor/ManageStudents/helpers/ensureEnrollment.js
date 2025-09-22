// src/admin/ManageStudents/helpers/ensureEnrollment.js
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    setDoc,
    serverTimestamp,
  } from "firebase/firestore";
  
  /** Deterministic enrollment doc id to prevent duplicates */
  const enrDocId = (studentId, courseId, intakeId) =>
    `${studentId}__${courseId}__${intakeId || "na"}`;
  
  /**
   * Ensure an enrollment exists when a student is approved.
   * - Reads student (courseId/intakeId, name)
   * - Finds matching fee (prefer same-intake, else any fee for the course)
   * - Upserts enrollments/{studentId__courseId__intakeId||na}
   *
   * Idempotent. Also backfills studentName if the doc already exists.
   */
  export async function ensureEnrollmentOnApprove(db, studentId) {
    // read student
    const sRef = doc(db, "students", studentId);
    const sSnap = await getDoc(sRef);
    if (!sSnap.exists()) return null;
  
    const s = { id: sSnap.id, ...sSnap.data() };
    if (!s.courseId) return null;
  
    // find fee (prefer intake match)
    const feesCol = collection(db, "fees");
    let feeSnap = await getDocs(
      query(
        feesCol,
        where("courseId", "==", s.courseId),
        ...(s.intakeId ? [where("intakeId", "==", s.intakeId)] : [])
      )
    );
    if (feeSnap.empty) {
      // fallback: any fee for the course
      feeSnap = await getDocs(query(feesCol, where("courseId", "==", s.courseId)));
    }
    if (feeSnap.empty) return null;
  
    const feeDoc = feeSnap.docs[0];
    const fee = { id: feeDoc.id, ...feeDoc.data() };
  
    const docId = enrDocId(studentId, s.courseId, s.intakeId);
    const enrRef = doc(db, "enrollments", docId);
    const existing = await getDoc(enrRef);
  
    // Payload for new docs
    const basePayload = {
      studentId,
      studentName: s.name || "", // ✅ ensure name at creation
      courseId: s.courseId,
      courseName: fee.courseName ?? s.courseName ?? "",
      intakeId: s.intakeId || null,
      intakeName: fee.intakeName ?? s.intakeName ?? "",
      assignedFeeAmount: Number(fee.amount || 0),
      currency: fee.currency || "CAD",
      status: "active",
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "system",
    };
  
    if (!existing.exists()) {
      await setDoc(enrRef, basePayload, { merge: true });
      return { id: docId, ...basePayload };
    }
  
    // Backfill studentName (and only that) if missing or stale
    const cur = existing.data() || {};
    const desiredName = s.name || "";
    const needsNameUpdate = !cur.studentName || cur.studentName !== desiredName;
  
    if (needsNameUpdate) {
      await setDoc(
        enrRef,
        { studentName: desiredName, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
  
    return {
      id: existing.id,
      ...cur,
      studentName: needsNameUpdate ? desiredName : cur.studentName,
    };
  }
  