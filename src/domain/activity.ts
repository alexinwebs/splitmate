import { relativeDateLabel, toIsoDate } from './date';
import type { ActivityEvent } from './models';

export type ActivityDay = {
  /** Local calendar day, YYYY-MM-DD. */
  dayIso: string;
  /** "Today", "Yesterday" or "10 May". */
  label: string;
  events: ActivityEvent[];
};

/** The local calendar day an event happened on. */
export function activityDayIso(at: string): string {
  return toIsoDate(new Date(at));
}

/** "3:05 pm" in the viewer's local time. */
export function formatActivityTime(at: string): string {
  const date = new Date(at);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'pm' : 'am';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

/** All events, or only those of one group when a group id is given. */
export function filterActivity(
  events: readonly ActivityEvent[],
  groupId: string | null,
): ActivityEvent[] {
  return groupId ? events.filter((e) => e.groupId === groupId) : [...events];
}

/** Groups events by local day. Expects events already sorted newest first. */
export function groupActivityByDay(
  events: readonly ActivityEvent[],
  now: Date = new Date(),
): ActivityDay[] {
  const days: ActivityDay[] = [];
  for (const event of events) {
    const dayIso = activityDayIso(event.at);
    const last = days[days.length - 1];
    if (last && last.dayIso === dayIso) {
      last.events.push(event);
    } else {
      days.push({ dayIso, label: relativeDateLabel(dayIso, now), events: [event] });
    }
  }
  return days;
}
