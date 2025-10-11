// src/admin/AdminPaymentClaims/lib/csv.js
export function claimsToCsv(claims = []) {
    const header = [
      "Claim ID",
      "Student Name",
      "Student Mint ID",
      "Student Email",
      "Claimed At",
      "Reference",
      "Amount",
      "Status",
      "Has Proof",
    ];
  
    const rows = claims.map((c) => [
      c.id,
      c.studentName || "",
      c.studentMintId || "",
      c.studentEmail || "",
      c.claimedAt?.toDate?.()?.toISOString?.() || c.claimedAt || "",
      c.reference || "",
      typeof c.amountClaimed === "number" ? c.amountClaimed.toFixed(2) : "",
      c.status || "",
      c.proofMedia ? "Yes" : "No",
    ]);
  
    const lines = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  
    return lines;
  }
  
  export function downloadCsv(name, csv) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name.endsWith(".csv") ? name : `${name}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  