import type { ActivityEvent } from './models';
import {
  activityDayIso,
  filterActivity,
  formatActivityTime,
  groupActivityByDay,
} from './activity';

function event(id: string, at: string, groupId = 'g1'): ActivityEvent {
  return { id, groupId, type: 'expense_created', summary: `Event ${id}`, at };
}

const today = new Date(2025, 4, 10, 15, 0, 0);

describe('activity helpers', () => {
  it('finds the local day of an event', () => {
    const local = new Date(2025, 4, 10, 15, 0, 0);
    expect(activityDayIso(local.toISOString())).toBe('2025-05-10');
  });

  it('formats times as 12-hour clock', () => {
    expect(formatActivityTime(new Date(2025, 4, 10, 15, 5).toISOString())).toBe('3:05 pm');
    expect(formatActivityTime(new Date(2025, 4, 10, 0, 30).toISOString())).toBe('12:30 am');
    expect(formatActivityTime(new Date(2025, 4, 10, 12, 0).toISOString())).toBe('12:00 pm');
    expect(formatActivityTime(new Date(2025, 4, 10, 9, 9).toISOString())).toBe('9:09 am');
  });

  it('filters by group', () => {
    const list = [event('a', '2025-05-10T10:00:00.000Z', 'g1'), event('b', '2025-05-10T11:00:00.000Z', 'g2')];
    expect(filterActivity(list, null)).toHaveLength(2);
    expect(filterActivity(list, 'g2').map((e) => e.id)).toEqual(['b']);
    expect(filterActivity(list, 'none')).toEqual([]);
  });

  it('groups newest-first events by day with friendly labels', () => {
    const list = [
      event('1', new Date(2025, 4, 10, 15, 0).toISOString()),
      event('2', new Date(2025, 4, 10, 9, 0).toISOString()),
      event('3', new Date(2025, 4, 9, 20, 0).toISOString()),
      event('4', new Date(2025, 4, 1, 12, 0).toISOString()),
    ];
    const days = groupActivityByDay(list, today);
    expect(days.map((d) => d.label)).toEqual(['Today', 'Yesterday', '1 May']);
    expect(days.map((d) => d.events.map((e) => e.id))).toEqual([['1', '2'], ['3'], ['4']]);
  });

  it('returns nothing for no events', () => {
    expect(groupActivityByDay([], today)).toEqual([]);
  });
});
