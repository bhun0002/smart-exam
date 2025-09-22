// Heuristic suggestion scorer for a student payment claim vs interac_payments rows

const norm = (s) => (s ?? "").toString().trim().toLowerCase();
const cleanTxn = (s) => norm(s).replace(/[^a-z0-9]/gi, "");

const sameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export function scoreSuggestion({ claim, payment, studentEmail }) {
  const claimedAt = claim.claimedAt instanceof Date ? claim.claimedAt : new Date(claim.claimedAt);
  const pDate =
    payment?.stored_at?.toDate?.() ??
    (payment?.transfer_date?.iso ? new Date(payment.transfer_date.iso) : null);

  const claimRef = cleanTxn(claim.reference || "");
  const payTxn = cleanTxn(payment?.transaction_id || "");
  const refMatch = claimRef && payTxn && claimRef === payTxn;

  const amountMatch =
    typeof claim.amountClaimed === "number" &&
    typeof payment?.amount?.value === "number" &&
    Math.abs(claim.amountClaimed - payment.amount.value) < 0.005;

  const email = norm(studentEmail);
  const metaFrom = norm(payment?.meta?.from || "");
  const emailInMeta = email && metaFrom.includes(email);

  let dateBucket = 0; // 0 none, 1 same day, 2 within 24h, 3 within 48h
  if (pDate && claimedAt) {
    const diff = Math.abs(pDate.getTime() - claimedAt.getTime());
    if (sameDay(pDate, claimedAt)) dateBucket = 1;
    else if (diff <= 24 * 3600 * 1000) dateBucket = 2;
    else if (diff <= 48 * 3600 * 1000) dateBucket = 3;
  }

  // Base scoring
  let score = 0;
  if (refMatch) score += 1.0;
  if (dateBucket === 1) score += 0.35;
  if (dateBucket === 2) score += 0.2;
  if (dateBucket === 3) score += 0.1;
  if (amountMatch) score += 0.3;
  if (emailInMeta) score += 0.25;

  // Cap at 1
  score = Math.min(1, score);

  return {
    score,
    reasons: {
      refMatch,
      dateBucket,
      amountMatch,
      emailInMeta,
    },
  };
}
