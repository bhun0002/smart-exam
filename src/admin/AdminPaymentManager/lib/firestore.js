// src/admin/AdminPaymentManager/lib/firestore.js
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    runTransaction,
  } from "firebase/firestore";
  import { db } from "../../../firebaseConfig";
  
  /** Load all approved, non-voided links for a payment */
  async function getApprovedNonVoidedLinks(paymentId) {
    const ql = query(
      collection(db, "payment_links"),
      where("paymentId", "==", paymentId),
      where("status", "==", "approved")
    );
    const snap = await getDocs(ql);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return rows.filter((r) => r.voided !== true);
  }
  
  /** Compute payment remaining and flags + details for tooltip */
  export async function getPaymentLinkStatus(paymentId) {
    const links = await getApprovedNonVoidedLinks(paymentId);
  
    // Fetch payment (for currency/amount)
    const pSnap = await getDoc(doc(db, "interac_payments", paymentId));
    const payment = pSnap.exists() ? { id: pSnap.id, ...pSnap.data() } : null;
  
    const total = Number(payment?.amount?.value ?? 0);
    const used = links.reduce((s, l) => s + Number(l.amountApplied || 0), 0);
    const remaining = Math.max(0, total - used);
  
    // Optional enrichment: get enrollment titles for nicer tooltip
    const enrollmentIds = Array.from(
      new Set(links.map((l) => l.enrollmentId).filter(Boolean))
    );
    const enrollmentMap = {};
    if (enrollmentIds.length > 0) {
      const reads = await Promise.all(
        enrollmentIds.map((eid) => getDoc(doc(db, "enrollments", eid)))
      );
      reads.forEach((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const title = [d?.courseName, d?.intakeName].filter(Boolean).join(" — ");
          enrollmentMap[snap.id] = title || "";
        }
      });
    }
  
    const linksDetails = links.map((l) => ({
      studentName: l.studentName || "",
      studentMintId: l.studentMintId || "",
      amountApplied: Number(l.amountApplied || 0),
      currency: l.currency || payment?.amount?.currency || "CAD",
      enrollmentId: l.enrollmentId || null,
      enrollmentTitle: l.enrollmentId ? (enrollmentMap[l.enrollmentId] || "") : "",
      linkedBy: l.linkedBy || "",
      createdAt: l.createdAt?.toDate?.() || null,
    }));
  
    return {
      hasApprovedFromClaim: links.some((l) => !!l.claimId && l.voided !== true),
      hasApprovedAny: links.length > 0,
      remaining,
      payment,
      linksDetails, // NEW: for tooltip
    };
  }
  
  /**
   * Student search (restricted):
   * - Only students with isApproved === true AND isDeleted === false
   * - email exact, studentId exact, name contains (client-side over filtered set)
   */
  export async function searchStudents(text) {
    const t = (text || "").trim().toLowerCase();
    if (!t) return [];
    const out = new Map();
  
    // email exact (approved & not deleted)
    const qEmail = query(
      collection(db, "students"),
      where("email", "==", text),
      where("isApproved", "==", true),
      where("isDeleted", "==", false)
    );
    (await getDocs(qEmail)).docs.forEach((d) => out.set(d.id, { id: d.id, ...d.data() }));
  
    // minted studentId exact (approved & not deleted)
    const qMint = query(
      collection(db, "students"),
      where("studentId", "==", text),
      where("isApproved", "==", true),
      where("isDeleted", "==", false)
    );
    (await getDocs(qMint)).docs.forEach((d) => out.set(d.id, { id: d.id, ...d.data() }));
  
    // name contains — pull only approved & not deleted, then filter client-side
    const qApproved = query(
      collection(db, "students"),
      where("isApproved", "==", true),
      where("isDeleted", "==", false)
    );
    const approvedSnap = await getDocs(qApproved);
    approvedSnap.docs.forEach((d) => {
      const row = { id: d.id, ...d.data() };
      const hay = `${row.name || ""}`.toLowerCase();
      if (hay.includes(t)) out.set(d.id, row);
    });
  
    return Array.from(out.values());
  }
  
  /** List enrollments for a student */
  export async function listEnrollmentsForStudent(studentId) {
    const ql = query(collection(db, "enrollments"), where("studentId", "==", studentId));
    const snap = await getDocs(ql);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  /**
   * Transactional link with auto-claim (unchanged from your current workflow)
   */
  export async function linkPaymentWithAutoClaim({
    student,        // { id, name, email, studentId }
    payment,        // interac_payments row { id, amount: {value,currency}, transfer_date, stored_at, transaction_id }
    enrollmentId,   // optional
    adminUser,      // { email, role } with role === "masterAdmin"
  }) {
    if (!adminUser || adminUser.role !== "masterAdmin") {
      throw new Error("Only master admin can link payments.");
    }
    if (!student?.id) throw new Error("Select a student.");
    if (!payment?.id) throw new Error("Missing payment.");
  
    // Preload the current approved, non-voided links so we know which docs to re-read inside the transaction
    const preLinks = await getApprovedNonVoidedLinks(payment.id);
    const linkDocIds = preLinks.map((l) => l.id);
  
    // Prepare refs
    const payRef = doc(db, "interac_payments", payment.id);
    const claimRef = doc(collection(db, "payment_claims")); // pre-generated claim id
    const linkId = `${student.id}__${payment.id}__${enrollmentId || "na"}`;
    const linkRef = doc(db, "payment_links", linkId);
  
    // Run transactional write
    await runTransaction(db, async (tx) => {
      // Re-read payment
      const pSnap = await tx.get(payRef);
      if (!pSnap.exists()) throw new Error("Payment not found.");
      const p = { id: pSnap.id, ...pSnap.data() };
      const total = Number(p?.amount?.value ?? 0);
      const cur = p?.amount?.currency || "CAD";
  
      // Re-read each link doc we saw in the pre-flight query
      let used = 0;
      for (const id of linkDocIds) {
        const r = doc(db, "payment_links", id);
        const s = await tx.get(r);
        if (s.exists()) {
          const row = s.data();
          if (row.status === "approved" && row.voided !== true) {
            used += Number(row.amountApplied || 0);
          }
        }
      }
      const remaining = Math.max(0, total - used);
      if (remaining <= 0) throw new Error("This payment has no remaining amount.");
      // We enforce full remaining auto-apply — nothing else allowed
      const amountApplied = remaining;
  
      // Build claim payload (audit)
      const claimedAt =
        p?.transfer_date?.iso ||
        (p?.stored_at?.toDate && p.stored_at.toDate()?.toISOString()) ||
        new Date().toISOString();
  
      const claimPayload = {
        studentId: student.id,
        studentName: student.name || "",
        studentEmail: student.email || "",
        studentMintId: student.studentId || "",
        amountClaimed: amountApplied,
        reference: p?.transaction_id || "",
        claimedAt,
        status: "linked",
        reviewNote: "Created by admin from Payments",
        proofMedia: null,
        suggestedPaymentIds: [],
        confidence: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
  
      // Build link payload
      const linkPayload = {
        studentId: student.id,
        studentName: student.name || "",
        studentEmail: student.email || "",
        studentMintId: student.studentId || "",
        paymentId: p.id,
        enrollmentId: enrollmentId || null,
        amountApplied,
        currency: cur,
        status: "approved",
        voided: false,
        claimId: claimRef.id,          // <-- tie link to the audit claim
        linkedBy: adminUser.email || adminUser.id || "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
  
      // Write both
      tx.set(claimRef, claimPayload, { merge: true });
      tx.set(linkRef, linkPayload, { merge: true });
    });
  
    // Return IDs if needed by UI
    return { ok: true, claimId: claimRef.id, linkId };
  }
  