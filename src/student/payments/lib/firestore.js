import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "../../../firebaseConfig";
  
  // Reuse Cloudinary helpers from Admin Doc Manager (same signer & uploader)
  import {
    uploadRefFile,
    getSignedDocUrlLikeWorking,
  } from "../../../admin/AdminDocManager/helpers/cloudinary";
  
  /** --------------------------
   *  ENROLLMENTS & LINKS
   * -------------------------- */
  
  // Fetch a student's enrollments (adjust collection name if yours differs)
  export async function fetchStudentEnrollments(studentId) {
    const qy = query(
      collection(db, "enrollments"),
      where("studentId", "==", studentId)
    );
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  // Fetch confirmed payment links
  export async function fetchStudentLinks(studentId) {
    if (!studentId) return [];
    const col = collection(db, "payment_links");
  
    // We push the voided filter server-side so we don't pull extra rows.
    // NOTE: This requires 'voided' to be written on creation (true/false).
    // (We set voided:false on creation in the admin writer.)
    const snap = await getDocs(
      query(
        col,
        where("studentId", "==", studentId),
        where("status", "==", "approved"),
        where("voided", "==", false),
        orderBy("createdAt", "desc")
      )
    );
  
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  /** --------------------------
   *  INTERAC PAYMENTS (SUGGESTIONS)
   * -------------------------- */
  
  export async function fetchPaymentsByWindow({ from, to, transactionId }) {
    // Try to query most-recent items, then client-filter; adjust to your indexed fields if needed.
    let qy;
    try {
      qy = query(collection(db, "interac_payments"), orderBy("stored_at", "desc"), limit(300));
    } catch {
      // fallback if index missing
      qy = query(collection(db, "interac_payments"), limit(300));
    }
    const snap = await getDocs(qy);
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  
    if (from) items = items.filter((p) => toDate(p.stored_at)?.getTime() >= from.getTime());
    if (to) items = items.filter((p) => toDate(p.stored_at)?.getTime() <= to.getTime());
  
    if (transactionId) {
      const tid = transactionId.toLowerCase();
      items = items.filter((p) => (p.transaction_id || "").toLowerCase().includes(tid));
    }
    return items;
  
    function toDate(tsOrIso) {
      if (!tsOrIso) return null;
      if (typeof tsOrIso?.toDate === "function") return tsOrIso.toDate();
      if (typeof tsOrIso === "string") return new Date(tsOrIso);
      return null;
    }
  }
  
  /** --------------------------
   *  CLAIMS (create + read + proof)
   * -------------------------- */
  
  // Upload proof to Cloudinary (optional). Returns compact refMedia (no URLs).
  export async function uploadClaimProofToCloudinary(file) {
    if (!file) return null;
  
    // Use same signed uploader you use in Admin Doc Manager
    const uploaded = await uploadRefFile(file, {
      folder: "student-claims",
      access_mode: "authenticated",
    });
  
    // Store ONLY compact refMedia shape in Firestore (no secure_url)
    const refForDb = uploaded
      ? {
          public_id: uploaded.public_id ?? null,
          resource_type: uploaded.resource_type ?? null,
          format: uploaded.format ?? null,
          version:
            typeof uploaded.version === "number" || typeof uploaded.version === "string"
              ? uploaded.version
              : null,
        }
      : null;
  
    // sanitize: replace undefined with null for Firestore
    return refForDb == null
      ? null
      : Object.fromEntries(
          Object.entries(refForDb).map(([k, v]) => [k, v === undefined ? null : v])
        );
  }
  
  // Create a new claim
  export async function createPaymentClaim({
    studentId,
    claimedAt,
    reference,
    amountClaimed,
    proofMedia,   // <- compact refMedia or null
    suggestions,
  }) {
    const payload = {
      studentId,
      claimedAt: claimedAt || new Date(),
      reference: reference || "",
      amountClaimed: typeof amountClaimed === "number" ? amountClaimed : null,
      status: "pending",
      proofMedia: proofMedia || null, // <- we store refMedia here
      suggestedPaymentIds: suggestions?.paymentIds || [],
      confidence: suggestions?.confidence || 0,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "payment_claims"), payload);
  }
  
  // Signed URL for a proof file (from refMedia object)
  export async function getSignedClaimProofUrl(proofMedia) {
    if (!proofMedia) return null;
    // Build time-bound signed URL when you need to open it
    return await getSignedDocUrlLikeWorking(proofMedia);
  }
  
  // Read claims for a student (real id first; legacy fallback to "STUDENT_USER_ID")
  export async function getStudentClaims(studentId) {
    // Primary query (real id)
    const q1 = query(
      collection(db, "payment_claims"),
      where("studentId", "==", studentId),
      orderBy("createdAt", "desc")
    );
    let snap = await getDocs(q1);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  
    // Legacy fallback (older test docs created under a mock id)
    const q2 = query(
      collection(db, "payment_claims"),
      where("studentId", "==", "STUDENT_USER_ID"),
      orderBy("createdAt", "desc")
    );
    snap = await getDocs(q2);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  