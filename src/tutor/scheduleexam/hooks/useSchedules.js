// src/tutor/scheduleexam/hooks/useSchedules.js
// Core CRUD + utilities for schedules (single source of truth for availability + password)

import { useCallback, useEffect, useState } from "react";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    Timestamp,
} from "firebase/firestore";
import { addMinutes } from "../helpers/time";

export const COLLECTIONS = {
    SCHEDULES: "scheduled_exams",
    EXAMS: "exams",
    INTAKES: "intakes",
    COURSES: "courses",
};

export function localInputToDate(localValue) {
    // localValue like "2025-10-04T14:30" — interpret in local tz
    if (!localValue) return null;
    return new Date(localValue);
}

export function toTimestamp(d) {
    return Timestamp.fromDate(new Date(d.getTime()));
}

export function isNowInWindow(s, now = new Date()) {
    if (!s?.startAtUTC || !s?.endAtUTC || s.status !== "published") return false;
    const start = s.startAtUTC.toDate();
    const end = s.endAtUTC.toDate();
    return now >= start && now < end;
}

export function createSchedulePayload({ exam, course, intake, startLocal, durationMin, password }) {
    const start = localInputToDate(startLocal);
    const end = addMinutes(start, Number(durationMin || 0));
    return {
        examId: exam?.id,
        courseId: course?.id || null,
        intakeId: intake?.id || null,
        status: "published", // keep simple; you can add draft/canceled later
        startAtUTC: toTimestamp(start),
        endAtUTC: toTimestamp(end),
        // Single source of truth for password
        password: password?.trim() || "",
        // Denormalized display for calendar chips
        examTitle: exam?.title || exam?.name || "Untitled Exam",
        courseName: course?.name || null,
        intakeName: intake?.name || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // 🔹 soft-delete marker
        isDeleted: false,        // <-- add this
        deletedAt: null          // optional, useful for restore
    };
}

export function useLoadBase() {
    const db = getFirestore();
    const [loading, setLoading] = useState(false);
    const [intakes, setIntakes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [exams, setExams] = useState([]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [iSnap, cSnap, eSnap] = await Promise.all([
                getDocs(query(collection(db, COLLECTIONS.INTAKES))),
                getDocs(query(collection(db, COLLECTIONS.COURSES))),
                getDocs(query(collection(db, COLLECTIONS.EXAMS), orderBy("createdAt", "desc"))),
            ]);
            setIntakes(iSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setCourses(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setExams(eSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } finally {
            setLoading(false);
        }
    }, [db]);

    useEffect(() => {
        refresh();
    }, [refresh]);
    return { loading, intakes, courses, exams, refresh };
}

export async function createSchedule(payload) {
    const db = getFirestore();
    const ref = await addDoc(collection(db, COLLECTIONS.SCHEDULES), payload);
    return ref.id;
}

export async function updateSchedule(scheduleId, patch) {
    const db = getFirestore();
    await updateDoc(doc(db, COLLECTIONS.SCHEDULES, scheduleId), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteSchedule(scheduleId) {
    const db = getFirestore();
    await updateDoc(doc(db, COLLECTIONS.SCHEDULES, scheduleId), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
    });
}

export async function listSchedulesByMonth(monthStart, monthEnd) {
    const db = getFirestore();
    const q = query(
        collection(db, COLLECTIONS.SCHEDULES),
        where("isDeleted", "in", [false, null]),
        where("startAtUTC", ">=", monthStart),
        where("startAtUTC", "<=", monthEnd),
        orderBy("startAtUTC", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listSchedulesToday(dayStart, dayEnd) {
    const db = getFirestore();
    const q = query(
        collection(db, COLLECTIONS.SCHEDULES),
        where("isDeleted", "in", [false, null]),
        where("startAtUTC", ">=", dayStart),
        where("startAtUTC", "<=", dayEnd),
        orderBy("startAtUTC", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getScheduleById(id) {
    const db = getFirestore();
    const snap = await getDocs(doc(db, COLLECTIONS.SCHEDULES, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}