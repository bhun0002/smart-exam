// src/admin/AdminPaymentClaims/lib/firestore.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";

/** ─────────────────────────────────────────────────────────────
 * Read: Payment Claims (enriched with student details)
 * ──────────────────────────────────────────────────────────── */
export async function listClaims({ status = "pending", from = null, to = null }) {
  const col = collection(db, "payment_claims");
  let q;

  if (status && status !== "all") {
    q = query(col, where("status", "==", status), orderBy("createdAt", "desc"), limit(200));
  } else {
    q = query(col, orderBy("createdAt", "desc"), limit(200));
  }

  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Optional date window (client-side to tolerate string/timestamp variance)
  if (from || to) {
    const fromMs = from ? new Date(from).getTime() : -Infinity;
    const toMs = to ? new Date(to).getTime() : Infinity;
    rows = rows.filter((r) => {
      const t =
        r.claimedAt?.toDate?.()?.getTime?.() ??
        (r.claimedAt ? new Date(r.claimedAt).getTime() : 0);
      return t >= fromMs && t <= toMs;
    });
  }

  // Enrich with student name + minted id + email
  const uniqStudentIds = [...new Set(rows.map((r) => r.studentId).filter(Boolean))];
  const studentMap = new Map();

  await Promise.all(
    uniqStudentIds.map(async (sid) => {
      try {
        const sSnap = await getDoc(doc(db, "students", sid));
        if (sSnap.exists()) {
          const s = sSnap.data();
          studentMap.set(sid, {
            name: s?.name || "",
            mintedId: s?.studentId || "",
            email: s?.email || "",
          });
        }
      } catch {
        // ignore
      }
    })
  );

  rows = rows.map((c) => {
    const s = studentMap.get(c.studentId) || {};
    return {
      ...c,
      studentName: s.name || c.studentName || "",
      studentMintId: s.mintedId || c.studentMintId || "",
      studentEmail: c.studentEmail || s.email || "",
    };
  });

  return rows;
}

/** ─────────────────────────────────────────────────────────────
 * Read: Enrollments for a Student
 * ──────────────────────────────────────────────────────────── */
export async function listEnrollmentsForStudent(studentId) {
  if (!studentId) return [];
  const snap = await getDocs(
    query(collection(db, "enrollments"), where("studentId", "==", studentId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** ─────────────────────────────────────────────────────────────
 * Helper: active linked payment ids (approved & not voided)
 *  - exclude any links that belong to a provided claimId (so the
 *    same-claim drawer can still see its own link)
 * ──────────────────────────────────────────────────────────── */
async function getActiveLinkedPaymentIds({ excludeClaimId = null } = {}) {
  const snap = await getDocs(
    query(collection(db, "payment_links"), where("status", "==", "approved"), limit(1000))
  );

  const ids = new Set();
  snap.forEach((d) => {
    const link = d.data();
    const isVoided = link?.voided === true;
    const isExcludedClaim = excludeClaimId && link?.claimId === excludeClaimId;
    if (!isVoided && !isExcludedClaim && link?.paymentId) {
      ids.add(link.paymentId);
    }
  });
  return ids;
}

/** ─────────────────────────────────────────────────────────────
 * Search interac_payments (client-side text filter on recent window)
 *  - excludeLinked=true hides payments already linked elsewhere
 *  - excludeClaimId allows the same-claim link to still appear
 *  - requireAmountEqual + claimAmount can restrict by amount (UI must pass)
 * ──────────────────────────────────────────────────────────── */
export async function searchInteracPayments({
  text = "",
  days = 7,
  excludeLinked = false,
  excludeClaimId = null,
  requireAmountEqual = false,
  claimAmount = undefined,
} = {}) {
  const snap = await getDocs(
    query(collection(db, "interac_payments"), orderBy("stored_at", "desc"), limit(200))
  );
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  rows = rows.filter((p) => {
    const ts =
      p.stored_at?.toDate?.()?.getTime?.() ??
      (p.stored_at ? new Date(p.stored_at).getTime() : 0);
    return ts >= cutoff;
  });

  // Exclude actively linked payments (to *other* claims)
  if (excludeLinked) {
    const activeIds = await getActiveLinkedPaymentIds({ excludeClaimId });
    rows = rows.filter((p) => !activeIds.has(p.id));
  }

  // Strict amount filter (only if caller asks)
  if (requireAmountEqual && typeof claimAmount === "number" && !Number.isNaN(claimAmount)) {
    rows = rows.filter((p) => Number(p?.amount?.value || 0) === Number(claimAmount));
  }

  const t = (text || "").trim().toLowerCase();
  if (!t) return rows;

  return rows.filter((p) => {
    const s = JSON.stringify(p).toLowerCase();
    return s.includes(t);
  });
}

/** ─────────────────────────────────────────────────────────────
 * Suggest matches for a claim (heuristic)
 *  - exclude payments already linked elsewhere
 *  - if claim has amountClaimed, only consider exact amount matches
 * ──────────────────────────────────────────────────────────── */
export async function suggestMatchesForClaim(
  claim,
  opts = { days: 7, excludeLinked: true }
) {
  const tx = (claim?.reference || "").trim().toLowerCase();

  const byRef = await searchInteracPayments({
    text: tx,
    days: opts.days,
    excludeLinked: !!opts.excludeLinked,
    excludeClaimId: claim?.id || null,
  });
  const recents = await searchInteracPayments({
    text: "",
    days: opts.days,
    excludeLinked: !!opts.excludeLinked,
    excludeClaimId: claim?.id || null,
  });

  const pool = [...byRef, ...recents].reduce((m, p) => {
    m.set(p.id, p);
    return m;
  }, new Map());
  let payments = [...pool.values()];

  const cAmt = Number(claim?.amountClaimed);
  if (Number.isFinite(cAmt) && cAmt > 0) {
    payments = payments.filter((p) => Number(p?.amount?.value || 0) === cAmt);
  }

  const claimedAt =
    claim?.claimedAt?.toDate?.()?.getTime?.() ??
    (claim?.claimedAt ? new Date(claim.claimedAt).getTime() : 0);

  function score(p) {
    let s = 0;
    const pid = (p.transaction_id || "").toLowerCase();
    if (tx && pid && tx === pid) s += 1.0;

    const iso = p?.transfer_date?.iso || "";
    const pMs = iso
      ? new Date(iso).getTime()
      : p.stored_at?.toDate?.()?.getTime?.() ?? 0;
    if (claimedAt && pMs) {
      const diffH = Math.abs(claimedAt - pMs) / 36e5;
      if (diffH <= 24) s += 0.30;
      else if (diffH <= 48) s += 0.20;
      else if (diffH <= 24 * 7) s += 0.10;
    }

    const pa = Number(p?.amount?.value || 0);
    const ca = Number(claim?.amountClaimed || 0);
    if (pa && ca && pa === ca) s += 0.2;

    const email = ((claim?.studentEmail || "") + " " + (claim?.studentId || "")).toLowerCase();
    const from = ((p?.meta?.from || "") + " " + (p?.sender_alias?.value || "")).toLowerCase();
    if (email && from && (from.includes(email.split("@")[0]) || email.includes(from.split("@")[0]))) {
      s += 0.1;
    }

    return s;
  }

  const scored = payments.map((p) => ({ payment: p, score: score(p) }));
  let top = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (top.length === 0) {
    top = payments.slice(0, 3).map((p) => ({ payment: p, score: 0 }));
  }
  return top;
}

/** ─────────────────────────────────────────────────────────────
 * INTERNAL: sum of approved, non-voided allocations on a payment
 * Returns { totalAllocated, remaining }
 * ──────────────────────────────────────────────────────────── */
async function getPaymentAllocationInfo(paymentId) {
  const linksSnap = await getDocs(
    query(collection(db, "payment_links"), where("paymentId", "==", paymentId), where("status", "==", "approved"))
  );
  let totalAllocated = 0;
  linksSnap.forEach((d) => {
    const lk = d.data();
    if (lk?.voided === true) return;
    totalAllocated += Number(lk?.amountApplied || 0);
  });
  return { totalAllocated };
}

/** ─────────────────────────────────────────────────────────────
 * Writes: confirm link (creates payment_links + updates claim)
 * + VALIDATIONS:
 *   - amountApplied > 0 (number)
 *   - amountApplied <= paymentRemaining
 *   - if claim.amountClaimed exists: amountApplied <= claim.amountClaimed
 * ──────────────────────────────────────────────────────────── */
export async function confirmLinkForClaim({
  claim,
  payment,
  enrollmentId,
  amountApplied,
  adminUser,
}) {
  if (!adminUser || adminUser.role !== "masterAdmin") {
    throw new Error("Only master admin can link payments.");
  }
  if (!claim?.id || !payment?.id) throw new Error("Missing claim or payment.");

  // Load the latest payment (to get authoritative amount)
  const paySnap = await getDoc(doc(db, "interac_payments", payment.id));
  if (!paySnap.exists()) throw new Error("Payment not found.");
  const pay = { id: paySnap.id, ...paySnap.data() };
  const payAmount = Number(pay?.amount?.value || 0);
  const currency = pay?.amount?.currency || "CAD";

  // Compute remaining on this payment (approved & not voided)
  const { totalAllocated } = await getPaymentAllocationInfo(pay.id);
  const remaining = Math.max(0, payAmount - totalAllocated);

  // Normalize/validate amountApplied
  const amt = Number(amountApplied);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new Error("Amount to apply must be a positive number.");
  }
  if (amt > remaining) {
    throw new Error(`Amount exceeds remaining on payment (${remaining.toFixed(2)}).`);
  }

  // Enforce claim cap if claim has amountClaimed
  const claimAmt = Number(claim?.amountClaimed);
  if (Number.isFinite(claimAmt) && claimAmt > 0 && amt > claimAmt) {
    throw new Error(`Amount exceeds the claimed amount (${claimAmt.toFixed(2)}).`);
  }

  // Fetch student profile to enrich with name & mintedId
  let studentName = "";
  let studentMintId = "";
  try {
    const sSnap = await getDoc(doc(db, "students", claim.studentId));
    if (sSnap.exists()) {
      const s = sSnap.data();
      studentName = s?.name || "";
      studentMintId = s?.studentId || "";
    }
  } catch (err) {
    console.warn("Could not fetch student profile:", err);
  }

  // Write link
  const linkId = `${claim.studentId}__${pay.id}__${enrollmentId || "na"}`;
  await setDoc(
    doc(db, "payment_links", linkId),
    {
      studentId: claim.studentId,
      studentName: studentName || "",
      studentEmail: claim.studentEmail || "",
      studentMintId: studentMintId || "",
      paymentId: pay.id, 
      enrollmentId: enrollmentId || null,
      amountApplied: amt,
      currency,
      status: "approved",
      voided: false,
      claimId: claim.id,
      linkedBy: adminUser.email || adminUser.id || "admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Update claim → linked
  await updateDoc(doc(db, "payment_claims", claim.id), {
    status: "linked",
    updatedAt: serverTimestamp(),
  });
}

/** ─────────────────────────────────────────────────────────────
 * Writes: reject claim  (also revoke any approved links)
 * ──────────────────────────────────────────────────────────── */
export async function rejectClaim({ claimId, note, adminUser }) {
  if (!adminUser || adminUser.role !== "masterAdmin") {
    throw new Error("Only master admin can reject claims.");
  }
  if (!claimId) throw new Error("Missing claimId.");

  await updateDoc(doc(db, "payment_claims", claimId), {
    status: "rejected",
    reviewNote: note,
    updatedAt: serverTimestamp(),
  });

  const linksSnap = await getDocs(
    query(
      collection(db, "payment_links"),
      where("claimId", "==", claimId),
      where("status", "==", "approved")
    )
  );

  const now = serverTimestamp();
  await Promise.all(
    linksSnap.docs.map(async (d) => {
      await updateDoc(doc(db, "payment_links", d.id), {
        status: "revoked",
        voided: true,
        revokedAt: now,
        revokedBy: adminUser.email || adminUser.id || "admin",
        updatedAt: now,
      });
    })
  );

  return { revokedCount: linksSnap.size };
}

/** ─────────────────────────────────────────────────────────────
 * Manual link (Admin › Payments drawer)
 * (No change here; keep as-is)
 * ──────────────────────────────────────────────────────────── */
export async function createPaymentLinkManual({
  student,
  payment,
  enrollmentId,
  amountApplied,
}) {
  if (!student?.id || !payment?.id) throw new Error("Missing student or payment.");
  const currency = payment?.amount?.currency || "CAD";
  const linkId = `${student.id}__${payment.id}__${enrollmentId || "na"}`;

  await setDoc(
    doc(db, "payment_links", linkId),
    {
      studentId: student.id,
      studentEmail: student.email || "",
      paymentId: payment.id,
      claimId: null,
      enrollmentId: enrollmentId || null,
      amountApplied: Number(amountApplied || payment?.amount?.value || 0),
      currency,
      status: "approved",
      voided: false,
      linkedBy: student.linkedBy || "admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { id: linkId };
}
