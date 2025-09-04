// src/tutor/viewsubmission/hooks/useProctoringLogs.js
import { useCallback, useEffect, useRef } from "react";
import { db } from "../../../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const now = () => new Date().toISOString();

export default function useProctoringLogs({ submissionId, enabled = true }) {
  const enabledRef = useRef(enabled);
  const submissionRef = useRef(submissionId);
  const lastLogRef = useRef(0);

  const log = useCallback(async (type, detail = {}) => {
    if (!enabledRef.current || !submissionRef.current) return;

    // simple throttle (1 log / 250ms to avoid floods)
    const t = Date.now();
    if (t - lastLogRef.current < 250) return;
    lastLogRef.current = t;

    try {
      await addDoc(
        collection(db, "examSubmissions", submissionRef.current, "logs"),
        {
          type,                      // e.g., "visibility", "copy", "fullscreen"
          detail,                    // arbitrary JSON (keys below)
          at: serverTimestamp(),     // Firestore server time
          atISO: now(),              // client iso for quick debug
        }
      );
    } catch (e) {
      // fail silently (don’t break exam UX)
      // console.warn("log failed", e);
    }
  }, []);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { submissionRef.current = submissionId; }, [submissionId]);

  useEffect(() => {
    if (!enabled) return;

    const onVis = () =>
      log("visibility", { hidden: document.hidden });

    const onFocus = () =>
      log("focus", { focused: true });

    const onBlur = () =>
      log("focus", { focused: false });

    const onCopy = (e) =>
      log("copy", {
        selectionLength: String(window.getSelection?.()?.toString()?.length || 0),
        ctrlOrMeta: !!(e.ctrlKey || e.metaKey),
      });

    const onCut = (e) =>
      log("cut", {
        selectionLength: String(window.getSelection?.()?.toString()?.length || 0),
        ctrlOrMeta: !!(e.ctrlKey || e.metaKey),
      });

    const onPaste = (e) => log("paste", { ctrlOrMeta: !!(e.ctrlKey || e.metaKey) });

    const onContextMenu = () => log("contextmenu");

    const onSelectStart = () =>
      log("select", { selectedLen: String(window.getSelection?.()?.toString()?.length || 0) });

    const onKeyDown = (e) => {
      const combo = [
        e.metaKey ? "Meta" : null,
        e.ctrlKey ? "Ctrl" : null,
        e.shiftKey ? "Shift" : null,
        e.altKey ? "Alt" : null,
        e.key,
      ].filter(Boolean).join("+");
      // Common “copy/share” combos to flag
      const interesting = ["PrintScreen", "Ctrl+c", "Meta+c", "Ctrl+Shift+s", "Meta+Shift+s"];
      if (interesting.some(s => combo.toLowerCase().includes(s.toLowerCase()))) {
        log("key", { combo });
      }
    };

    const onFsChange = () =>
      log("fullscreen", { isFullscreen: !!document.fullscreenElement });

    const onBeforeUnload = () => log("unload", { reason: "beforeunload" });

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    // first marks
    log("session-start", { ua: navigator.userAgent });

    return () => {
      log("session-end", {});
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled, log]);

  return { logCustom: log };
}
