export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function scenarioDateTimeToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): string {
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const calendarCheck = new Date(wallClockUtc);
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day ||
    calendarCheck.getUTCHours() !== hour ||
    calendarCheck.getUTCMinutes() !== minute
  ) {
    throw new Error('تاریخ یا ساعت واردشده معتبر نیست.');
  }
  if (!isValidTimeZone(timeZone)) {
    throw new Error('منطقه زمانی واردشده معتبر نیست.');
  }
  if (timeZone === 'UTC') {
    return new Date(wallClockUtc).toISOString();
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const offsetAt = (timestamp: number) => {
    const values = Object.fromEntries(
      formatter
        .formatToParts(new Date(timestamp))
        .filter(part => part.type !== 'literal')
        .map(part => [part.type, Number(part.value)])
    );
    const representedAsUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );
    return representedAsUtc - timestamp;
  };

  let timestamp = wallClockUtc - offsetAt(wallClockUtc);
  timestamp = wallClockUtc - offsetAt(timestamp);
  return new Date(timestamp).toISOString();
}
