import { formatDateTime } from './format-date-time';

describe('formatDateTime', () => {
  it('shows a UTC instant in the local time of Bolivia with the day, the month and the year', () => {
    expect(formatDateTime('2026-11-08T15:00:00Z', 'America/La_Paz')).toBe('8 nov 2026, 11:00');
  });

  it('uses the 24 hour clock', () => {
    expect(formatDateTime('2026-11-08T23:05:00Z', 'America/La_Paz')).toBe('8 nov 2026, 19:05');
  });

  it('moves to the previous day when the time zone is still behind', () => {
    expect(formatDateTime('2026-11-09T02:30:00Z', 'America/La_Paz')).toBe('8 nov 2026, 22:30');
  });
});
