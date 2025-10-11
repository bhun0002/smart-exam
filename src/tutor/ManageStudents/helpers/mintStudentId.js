// src/helpers/mintStudentId.js
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

/**
 * Returns 2-digit year + 2-digit month, e.g. "2509"
 */
function getYYMM() {
  const d = new Date();
  const yy = String(d.getFullYear() % 100).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return yy + mm;
}

/**
 * Mint a student ID in the format:
 *   YY(2) + MM(2) + CourseID(2) + SEQ(2)  => "25090103"
 *
 * - SEQ is a 2-digit monthly counter per (YYMM + courseId), 00–99.
 * - Uses a Firestore transaction on counters/SID-YYMM-CC.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|number} courseIdTwoDigit - the 2-digit courseId stored on the Course doc (e.g., "01")
 * @returns {Promise<string>}
 */
export async function mintStudentId(db, courseIdTwoDigit) {
  if (courseIdTwoDigit == null || courseIdTwoDigit === "") {
    throw new Error("Course ID is required to mint a student ID.");
  }

  const yymm = getYYMM();
  const cc = String(courseIdTwoDigit).padStart(2, "0"); // ensure 2 digits

  const counterKey = `SID-${yymm}-${cc}`; // monthly + course-scoped counter
  const ctrRef = doc(db, "counters", counterKey);

  let seq = null;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ctrRef);
    const last = snap.exists() ? (snap.data().lastSeq || 0) : 0;
    const next = last + 1;
    if (next > 99) throw new Error("Monthly per-course student ID capacity exceeded (00–99).");
    tx.set(ctrRef, { lastSeq: next, updatedAt: serverTimestamp() }, { merge: true });
    seq = next;
  });

  return `${yymm}${cc}${String(seq).padStart(2, "0")}`;
}
