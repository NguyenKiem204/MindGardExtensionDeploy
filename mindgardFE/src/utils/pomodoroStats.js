import { getLocal, setLocal } from "./chromeStorage";

const SESSIONS_KEY = "focusSessions";

export async function recordSession(session) {
  const { dateISO, durationMin, taskTitle } = session;
  const store = await getLocal([SESSIONS_KEY]);
  const arr = Array.isArray(store[SESSIONS_KEY]) ? store[SESSIONS_KEY] : [];
  arr.push({ dateISO, durationMin, taskTitle });
  if (arr.length > 1000) arr.splice(0, arr.length - 1000);
  await setLocal({ [SESSIONS_KEY]: arr });
}

export async function readSessions() {
  const store = await getLocal([SESSIONS_KEY]);
  return Array.isArray(store[SESSIONS_KEY]) ? store[SESSIONS_KEY] : [];
}

export function computeStreak(sessions) {
  const days = new Set(
    sessions
      .map((s) => new Date(s.dateISO))
      .map((d) => d.toISOString().slice(0, 10))
  );
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak++;
    else break;
  }
  return streak;
}

export function aggregateByWeekday(sessions) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) {
    const d = new Date(s.dateISO);
    const weekday = d.getDay(); // 0..6
    totals[weekday] += Number(s.durationMin) || 0;
  }
  return totals;
}
