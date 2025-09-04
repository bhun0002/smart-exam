import { useEffect, useMemo } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// tiny throttle to avoid log spam
const throttle = (fn, ms) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
};

// a light, unique session-id so tutor can see which tab/window created logs
const makeSessionId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export default function useProctoringLogs({
  db,
  submissionId,         // REQUIRED – unique submission doc id
  examId,               // optional but recommended
  studentId,            // optional but recommended
  studentName,          // optional
  intakeId,             // optional
  examTitle,            // optional
  enabled = true,       // allow toggling
}) {
  const sessionId = useMemo(makeSessionId, []);

  useEffect(() => {
    if (!db || !submissionId || !enabled) return;

    const col = collection(db, "proctorLogs");
    const write = async (type, severity = "info", meta = {}) => {
      try {
        await addDoc(col, {
          type, severity, meta,
          submissionId, examId: examId ?? null,
          studentId: studentId ?? null,
          studentName: studentName ?? null,
          intakeId: intakeId ?? null,
          examTitle: examTitle ?? null,
          sessionId,
          ts: serverTimestamp(),
        });
      } catch {
        // swallow — logging should never block the student
      }
    };

    // classify some events
    const warn = (t, m) => write(t, "warn", m);
    const info = (t, m) => write(t, "info", m);

    // throttled writers
    const tFocus     = throttle(() => info("window_focus"), 1500);
    const tBlur      = throttle(() => warn("window_blur"), 1500);
    const tHidden    = throttle(() => warn("tab_hidden"), 1500);
    const tVisible   = throttle(() => info("tab_visible"), 1500);
    const tCopy      = throttle((len) => warn("copy", { len }), 1200);
    const tPaste     = throttle(() => warn("paste"), 1200);
    const tCtx       = throttle(() => warn("contextmenu"), 1200);
    const tKey       = throttle((meta) => info("key", meta), 500);
    const tOrient    = throttle((o) => info("orientation_change", { type: o?.type, angle: screen?.orientation?.angle }), 1500);

    // listeners
    const onVisibility = () => (document.hidden ? tHidden() : tVisible());
    const onFocus = () => tFocus();
    const onBlur  = () => tBlur();

    const onCopy = (e) => {
      let len = 0;
      try { len = (e.clipboardData || window.clipboardData)?.getData?.("text")?.length || 0; } catch {}
      tCopy(len);
    };
    const onPaste = () => tPaste();
    const onContext = () => tCtx();

    const onKeyDown = (e) => {
      // Not reliable for screenshots, but we can log PrintScreen if it fires
      const meta = { key: e.key, code: e.code, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, metaKey: e.metaKey };
      if (e.key?.toLowerCase?.() === "printscreen") {
        warn("screenshot_key", meta);
      } else {
        tKey(meta);
      }
    };

    const onOrientation = (e) => tOrient(e);

    // attach
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);
    window.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKeyDown);
    screen?.orientation?.addEventListener?.("change", onOrientation);

    // initial snapshot
    document.hidden ? info("tab_hidden_initial") : info("tab_visible_initial");
    if (document.hasFocus()) info("window_focus_initial");
    info("session_start");

    const onBeforeUnload = () => info("session_end");
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("contextmenu", onContext);
      window.removeEventListener("keydown", onKeyDown);
      screen?.orientation?.removeEventListener?.("change", onOrientation);
      window.removeEventListener("beforeunload", onBeforeUnload);
      info("session_dispose");
    };
  }, [db, submissionId, examId, studentId, studentName, intakeId, examTitle, enabled, sessionId]);
}
