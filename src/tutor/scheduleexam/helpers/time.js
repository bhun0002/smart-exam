// src/tutor/scheduleexam/helpers/time.js

export function toLocalInputValue(date = new Date()) {
    // Returns YYYY-MM-DDTHH:mm in local time
    const pad = (n) => String(n).padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  }
  
  export function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }
  
  export function startOfDay(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  
  export function endOfDay(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  
  export function startOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }
  
  export function endOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  