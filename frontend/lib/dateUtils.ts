/**
 * Date and Time utilities for formatting and parsing timestamps across the application.
 * Ensures consistent UTC <-> Client Local Time conversion across all browsers.
 */

/**
 * Safely parses any date/timestamp format into a JavaScript Date object.
 * If the input is an ISO string without a timezone indicator (e.g. "2026-08-18T05:20:00"),
 * it assumes the backend stored it in UTC (standard for SQL Server/Postgres) and correctly
 * interprets it as UTC so the browser converts it to the user's local timezone.
 */
export function parseDate(timestamp: string | number | Date | null | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? new Date() : timestamp;
  
  if (typeof timestamp === "number") {
    // Handle milliseconds vs seconds timestamp
    return new Date(timestamp > 1e11 ? timestamp : timestamp * 1000);
  }

  let str = String(timestamp).trim();
  if (!str) return new Date();

  // If already in ISO with Z or has timezone offset (+/-HH:MM or +/-HHMM)
  if (str.endsWith("Z") || /[+-]\d{2}(:?\d{2})?$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // Handle SQL Server space format e.g. "2026-08-18 05:20:00.123456" -> convert to ISO
  str = str.replace(" ", "T");
  
  // Append Z to indicate UTC since backend stores naive UTC
  if (!str.endsWith("Z")) {
    str += "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Formats time for chat message bubbles in the user's local timezone (e.g., "10:50 AM").
 */
export function formatMessageTime(timestamp: string | number | Date | null | undefined): string {
  if (!timestamp) return "";
  const date = parseDate(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Checks if two date inputs fall on the same calendar day in the user's local timezone.
 */
export function isSameDay(
  d1: string | number | Date | null | undefined,
  d2: string | number | Date | null | undefined
): boolean {
  if (!d1 || !d2) return false;
  const date1 = parseDate(d1);
  const date2 = parseDate(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Formats date header / divider for chat message feeds (e.g. "Today", "Yesterday", "Tue, Aug 18, 2026").
 */
export function formatMessageDateDivider(timestamp: string | number | Date | null | undefined): string {
  if (!timestamp) return "";
  const date = parseDate(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
