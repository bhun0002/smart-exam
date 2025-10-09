// src/student/ScheduleView/hooks/useStudentSchedules.js
// Student-side schedule queries. Mirrors tutor hooks but adds cohort filters.
// Reuses tutor's isNowInWindow for identical status logic.
import {
    collection,
    getDocs,
    getFirestore,
    orderBy,
    query,
    where,
  } from "firebase/firestore";
  
  import { COLLECTIONS, isNowInWindow } from "../../../tutor/scheduleexam/hooks/useSchedules"; // reuse logic :contentReference[oaicite:4]{index=4}
  
  /** Month list filtered by soft-delete + cohort (courseId & intakeId) */
  export async function listStudentSchedulesByMonth(monthStart, monthEnd, cohort = {}) {
    const db = getFirestore();
    const { courseId, intakeId } = cohort || {};
  
    // Build a query stack that matches tutor style but scoped to the student's cohort
    const base = [
      where("isDeleted", "in", [false, null]),
      where("startAtUTC", ">=", monthStart),
      where("startAtUTC", "<=", monthEnd),
      orderBy("startAtUTC", "asc"),
    ];
  
    // If cohort known, apply exact-match filters (both must match)
    const filters = [...base];
    if (courseId) filters.unshift(where("courseId", "==", courseId));
    if (intakeId) filters.unshift(where("intakeId", "==", intakeId));
  
    const q = query(collection(db, COLLECTIONS.SCHEDULES), ...filters);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  /** Day list filtered by soft-delete + cohort */
  export async function listStudentSchedulesOnDay(dayStart, dayEnd, cohort = {}) {
    const db = getFirestore();
    const { courseId, intakeId } = cohort || {};
  
    const base = [
      where("isDeleted", "in", [false, null]),
      where("startAtUTC", ">=", dayStart),
      where("startAtUTC", "<=", dayEnd),
      orderBy("startAtUTC", "asc"),
    ];
  
    const filters = [...base];
    if (courseId) filters.unshift(where("courseId", "==", courseId));
    if (intakeId) filters.unshift(where("intakeId", "==", intakeId));
  
    const q = query(collection(db, COLLECTIONS.SCHEDULES), ...filters);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  export { isNowInWindow }; // exact same check as tutor side
  