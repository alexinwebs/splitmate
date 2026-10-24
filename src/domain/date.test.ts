import { addDaysIso, formatDate, isValidIsoDate, relativeDateLabel, toIsoDate } from './date';

describe('isValidIsoDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidIsoDate('2025-05-10')).toBe(true);
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2025-12-31')).toBe(true);
  });

  it('rejects impossible or malformed dates', () => {
    expect(isValidIsoDate('2023-02-29')).toBe(false);
    expect(isValidIsoDate('2025-13-01')).toBe(false);
    expect(isValidIsoDate('2025-00-10')).toBe(false);
    expect(isValidIsoDate('2025-04-31')).toBe(false);
    expect(isValidIsoDate('2025-5-1')).toBe(false);
    expect(isValidIsoDate('10/05/2025')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate('1800-01-01')).toBe(false);
  });
});

describe('date helpers', () => {
  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDaysIso('2025-03-01', -1)).toBe('2025-02-28');
    expect(addDaysIso('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDaysIso('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDaysIso('2025-05-10', 0)).toBe('2025-05-10');
  });

  it('formats dates', () => {
    expect(formatDate('2025-05-10')).toBe('10 May 2025');
  });

  it('labels today and yesterday', () => {
    const now = new Date(2025, 4, 10);
    expect(relativeDateLabel('2025-05-10', now)).toBe('Today');
    expect(relativeDateLabel('2025-05-09', now)).toBe('Yesterday');
    expect(relativeDateLabel('2025-05-01', now)).toBe('1 May');
    expect(toIsoDate(now)).toBe('2025-05-10');
  });
});
