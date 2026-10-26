/**
 * Event times are stored as UTC instants. Always render them in Cincinnati
 * local time (America/New_York) so server rendering on UTC hosts and visitors
 * in other time zones see the venue's wall-clock time. The IANA zone handles
 * the EDT/EST daylight-saving switch automatically.
 */
export const EVENT_TIME_ZONE = "America/New_York";

const eventDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const eventDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function toDate(value: Date | number | string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** e.g. "Mon, Oct 26 · 7:00 PM ET" */
export function formatEventDateTime(value: Date | number | string): string {
  const date = toDate(value);
  if (!date) return "";
  const parts = eventDateTimeFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("month")} ${part("day")} · ${part("hour")}:${part("minute")} ${part("dayPeriod")} ET`;
}

/** e.g. "Mon, Oct 26, 2026" */
export function formatEventDate(value: Date | number | string): string {
  const date = toDate(value);
  return date ? eventDateFormatter.format(date) : "";
}
