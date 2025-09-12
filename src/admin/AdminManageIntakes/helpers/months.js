export const MONTHS = [
    { idx: 0, full: "January", short: "Jan" },
    { idx: 1, full: "February", short: "Feb" },
    { idx: 2, full: "March", short: "Mar" },
    { idx: 3, full: "April", short: "Apr" },
    { idx: 4, full: "May", short: "May" },
    { idx: 5, full: "June", short: "Jun" },
    { idx: 6, full: "July", short: "Jul" },
    { idx: 7, full: "August", short: "Aug" },
    { idx: 8, full: "September", short: "Sep" },
    { idx: 9, full: "October", short: "Oct" },
    { idx: 10, full: "November", short: "Nov" },
    { idx: 11, full: "December", short: "Dec" },
  ];
  
  export const monthNameToIndex = (name) => {
    if (!name) return -1;
    const n = String(name).trim().toLowerCase();
    const hit = MONTHS.find(
      (m) => m.full.toLowerCase() === n || m.short.toLowerCase() === n
    );
    return hit ? hit.idx : -1;
  };
  
  // "Apr 2025" or "April 2025"
  export const parseIntakeName = (name) => {
    if (!name || typeof name !== "string") return { ok: false };
    const parts = name.trim().split(/\s+/);
    if (parts.length !== 2) return { ok: false };
    const m = monthNameToIndex(parts[0]);
    const y = Number(parts[1]);
    if (m < 0 || !Number.isInteger(y) || y < 1900 || y > 3000) return { ok: false };
    return { ok: true, monthIndex: m, year: y };
  };
  
  export const buildIntakeName = (monthIndex, year) => {
    const m = MONTHS.find((x) => x.idx === Number(monthIndex));
    const y = Number(year);
    if (!m || !Number.isInteger(y)) return "";
    return `${m.short} ${y}`;
  };
  
  export const normalize = (s) => (s || "").trim().replace(/\s+/g, " ");
  