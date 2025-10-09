// src/tutor/scheduleexam/hooks/useActiveSchedules.js
// Prefetch "today's" schedules once and compute a map examId -> active schedule.
// Auto-refreshes every 30s so tutors don't need to reload.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listSchedulesToday, isNowInWindow } from "./useSchedules";
import { startOfDay, endOfDay } from "../helpers/time";

export default function useActiveSchedulesTicker() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = await listSchedulesToday(startOfDay(now), endOfDay(now));
      setSchedules(today);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 30 * 1000); // refresh every 30s
    return () => clearInterval(timerRef.current);
  }, [load]);

  // Compute active map (examId -> schedule) on each tick
  const activeMap = useMemo(() => {
    const now = new Date();
    const map = new Map();
    for (const s of schedules) {
      if (isNowInWindow(s, now)) {
        map.set(s.examId, s);
      }
    }
    return map;
  }, [schedules]);

  return { loading, activeMap, schedules, reload: load };
}
