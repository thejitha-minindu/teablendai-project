export const parseBackendDateTime = (dateString?: string | null): Date | null => {
  if (!dateString) return null;

  // Accept well-formed ISO strings including timezone offsets
  if (/.*T.*([+-]\d{2}:\d{2}|Z)$/.test(dateString)) {
    const date = new Date(dateString);
    if (!Number.isNaN(date.getTime())) return date;
  }

  // Fall back for strings like "YYYY-MM-DD HH:mm:ss"
  const normalized = dateString.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // Parse manually as last resort
  const [datePart, timePartRaw = '00:00:00'] = normalized.split('T');
  const timePart = timePartRaw.split('.')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = '0', minute = '0', second = '0'] = timePart.split(':');

  const manual = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    Number(hour),
    Number(minute),
    Number(second)
  );
  return Number.isNaN(manual.getTime()) ? null : manual;
};

export const durationToMinutes = (durationValue?: number | null) => {
  const numericValue = Number(durationValue);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  return Math.round(numericValue);
};

export const durationMinutesToHours = (durationValue?: number | null) => {
  const totalMinutes = durationToMinutes(durationValue);
  return totalMinutes > 0 ? totalMinutes / 60 : 0;
};

export const formatDurationFromMinutes = (durationValue?: number | null) => {
  const totalMinutes = durationToMinutes(Number(durationValue ?? 0));
  if (!totalMinutes) return "N/A";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) return `${hours} hour${hours === 1 ? '' : 's'}`;
  if (!hours) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

export const calculateLiveCountdown = (startTime: string, durationValue: number) => {
  const startDate = parseBackendDateTime(startTime);
  if (!startDate || Number.isNaN(startDate.getTime())) return "Closing...";

  const start = startDate.getTime();
  const durationMinutes = durationToMinutes(durationValue);
  const end = start + (durationMinutes * 60 * 1000);
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return "Closing...";

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const calculateTimeUntilStart = (startTime: string) => {
  const startDate = parseBackendDateTime(startTime);
  if (!startDate || Number.isNaN(startDate.getTime())) return "Starting...";

  const start = startDate.getTime();
  const now = new Date().getTime();
  const diff = start - now;

  if (diff <= 0) return "Starting...";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
};
