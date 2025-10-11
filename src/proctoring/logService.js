// src/proctoring/logService.js
import { db } from "../firebaseConfig";
import { doc, setDoc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";

/**
 * Firestore shape:
 * proctorLogs/{submissionId} {
 *   examId, studentId, studentName, createdAt, updatedAt,
 *   events: [{ ts, type, severity, meta }]
 * }
 */

const nowISO = () => new Date().toISOString();

async function ensureLogDoc(submissionId, extra = {}) {
  const ref = doc(db, "proctorLogs", submissionId);
  await setDoc(ref, {
    ...extra,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    events: arrayUnion({
      ts: nowISO(),
      type: "log-start",
      severity: "low",
      meta: { note: "Proctoring started" }
    }),
  }, { merge: true });
  return ref;
}

async function appendEvent(ref, event) {
  try {
    await updateDoc(ref, {
      updatedAt: serverTimestamp(),
      events: arrayUnion(event),
    });
  } catch (e) {
    console.error("[proctor] appendEvent error", e);
  }
}

function mkEvent(type, severity, meta = {}) {
  return { ts: nowISO(), type, severity, meta };
}

/* --------------------- watermark --------------------- */
function createWatermark({ studentName, studentId }) {
  const el = document.createElement("div");
  el.id = "proctor-watermark";
  el.style.position = "fixed";
  el.style.zIndex = "2147483647";
  el.style.pointerEvents = "none";
  el.style.opacity = "0.12";
  el.style.userSelect = "none";
  el.style.fontSize = "18px";
  el.style.fontWeight = "700";
  el.style.color = "#000";
  el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  el.style.padding = "8px 12px";
  el.style.borderRadius = "8px";
  el.style.backdropFilter = "blur(0.5px)";
  el.style.background = "transparent";
  el.style.transform = "rotate(-8deg)";
  el.style.whiteSpace = "nowrap";

  const text = `${studentName || "Student"} (${studentId || "-"})`;
  const stamp = () => new Date().toLocaleString();

  el.textContent = `${text} • ${stamp()}`;
  document.body.appendChild(el);

  // randomize corner every 10s to make cropping annoying
  const corners = [
    ["8px", "auto", "auto", "8px"],   // top-left
    ["8px", "8px", "auto", "auto"],   // top-right
    ["auto", "auto", "8px", "8px"],   // bottom-left
    ["auto", "8px", "8px", "auto"],   // bottom-right
  ];
  let i = 0;
  const move = () => {
    const c = corners[i % corners.length];
    el.style.top = c[0];
    el.style.right = c[1];
    el.style.bottom = c[2];
    el.style.left = c[3];
    el.textContent = `${text} • ${stamp()}`;
    i++;
  };
  move();
  const timer = setInterval(move, 10000);

  return () => {
    clearInterval(timer);
    el.remove();
  };
}

/* ------------------ fullscreen helpers ------------------ */
async function requestFullscreenIfNeeded(requireFullscreen) {
  if (!requireFullscreen) return;
  try {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      await el.requestFullscreen();
    }
  } catch (e) {
    console.warn("[proctor] fullscreen request failed:", e);
  }
}

function onFullscreenChange(cb) {
  const handler = () => cb(!!document.fullscreenElement);
  document.addEventListener("fullscreenchange", handler);
  return () => document.removeEventListener("fullscreenchange", handler);
}

/* ------------------ listeners bundle ------------------ */
export function startProctoring({
  submissionId,
  examId,
  studentId,
  studentName,
  severityMap = {},
  requireFullscreen = false,
} = {}) {
  if (!submissionId || !examId || !studentId) {
    console.warn("[proctor] Missing ids for startProctoring");
    return { stop: () => {} };
  }

  // default severities
  const sev = {
    visibilityHidden: "high",
    windowBlur: "high",
    copy: "high",
    contextMenu: "medium",
    keyPrintScreen: "high",
    keyMacScreenshot: "high",
    beforePrint: "high",
    fullscreenExit: "high",
    paste: "high",
    ...severityMap,
  };

  let unsub = () => {};
  let removeWatermark = () => {};

  (async () => {
    const ref = await ensureLogDoc(submissionId, {
      examId, studentId, studentName: studentName || null,
    });

    // 1) Watermark
    removeWatermark = createWatermark({ studentName, studentId });

    // 2) Visibility
    const visHandler = () => {
      if (document.hidden) {
        appendEvent(ref, mkEvent("tab-hidden", sev.visibilityHidden, { reason: "Tab not visible (switch/minimize)" }));
      } else {
        appendEvent(ref, mkEvent("tab-visible", "low"));
      }
    };
    document.addEventListener("visibilitychange", visHandler);

    // 3) Window focus/blur
    const blurHandler = () => appendEvent(ref, mkEvent("window-blur", sev.windowBlur, { note: "Window lost focus (likely another app)" }));
    const focusHandler = () => appendEvent(ref, mkEvent("window-focus", "low"));
    window.addEventListener("blur", blurHandler);
    window.addEventListener("focus", focusHandler);

    // 4) Copy / Context menu / Paste
    const copyHandler = (e) => {
      appendEvent(ref, mkEvent("copy", sev.copy, { selection: String(window.getSelection?.() || "") }));
    };
    const ctxHandler = (e) => {
      appendEvent(ref, mkEvent("context-menu", sev.contextMenu));
    };
    const pasteHandler = (e) => {
      appendEvent(ref, mkEvent("paste", sev.paste, { hasFiles: !!(e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) }));
    };
    document.addEventListener("copy", copyHandler);
    document.addEventListener("contextmenu", ctxHandler);
    document.addEventListener("paste", pasteHandler);

    // 5) Detectable screenshot keys (best effort)
    // Some browsers expose "PrintScreen". macOS shortcuts are detectable.
    const keyHandler = (e) => {
      // macOS: Cmd+Shift+3/4/5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        appendEvent(ref, mkEvent("mac-screenshot", sev.keyMacScreenshot, { key: e.key }));
      }
      // Windows/Linux: PrintScreen (not always delivered)
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        appendEvent(ref, mkEvent("print-screen", sev.keyPrintScreen));
      }
    };
    window.addEventListener("keydown", keyHandler, { capture: true });

    // 6) Print dialog (Ctrl/Cmd+P or menu)
    const beforePrint = () => appendEvent(ref, mkEvent("before-print", sev.beforePrint));
    const afterPrint = () => appendEvent(ref, mkEvent("after-print", "low"));
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    // 7) Fullscreen enforcement + exit detection (optional)
    await requestFullscreenIfNeeded(requireFullscreen);
    const rmFs = onFullscreenChange((isFs) => {
      if (!isFs && requireFullscreen) {
        appendEvent(ref, mkEvent("fullscreen-exit", sev.fullscreenExit));
      } else {
        appendEvent(ref, mkEvent("fullscreen-change", "low", { isFullscreen: isFs }));
      }
    });

    // keep a single stop function
    unsub = () => {
      document.removeEventListener("visibilitychange", visHandler);
      window.removeEventListener("blur", blurHandler);
      window.removeEventListener("focus", focusHandler);
      document.removeEventListener("copy", copyHandler);
      document.removeEventListener("contextmenu", ctxHandler);
      document.removeEventListener("paste", pasteHandler);
      window.removeEventListener("keydown", keyHandler, { capture: true });
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      rmFs && rmFs();
      removeWatermark && removeWatermark();

      appendEvent(ref, mkEvent("log-stop", "low", { note: "Proctoring stopped" }));
    };
  })();

  return { stop: () => unsub() };
}

export function stopProctoring(controller) {
  try {
    controller?.stop?.();
  } catch (e) {
    console.warn("[proctor] stop error", e);
  }
}
