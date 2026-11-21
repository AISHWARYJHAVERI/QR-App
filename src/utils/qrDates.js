// Single source of truth for the date embedded in every QR code.
// Day numbers come from the Event Dates setting; month/year come from the live clock.
const TIMEZONE = 'Asia/Kolkata';

const pad = (n) => String(n).padStart(2, '0');

const todayParts = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = {};
  for (const part of formatter.formatToParts(new Date())) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  return parts;
};

// "dd mm yyyy" for a chosen day-of-month, using the real current month/year.
export const dateForDay = (day) => {
  const n = Number(day);
  if (Number.isNaN(n)) return '';
  const { month, year } = todayParts();
  return `${pad(n)} ${month} ${year}`;
};

// Today's date in the exact QR format, e.g. "21 11 2026".
export const currentQRDate = () => {
  const { day, month, year } = todayParts();
  return `${day} ${month} ${year}`;
};

// Turns [17, 18, 19] into ["17 11 2026", "18 11 2026", "19 11 2026"].
export const buildQRDates = (days) => {
  if (!Array.isArray(days) || days.length === 0) return [];
  const { month, year } = todayParts();
  const seen = new Set();
  const result = [];
  for (const raw of days) {
    const n = Number(raw);
    if (Number.isNaN(n)) continue;
    const value = `${pad(n)} ${month} ${year}`;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
};

// Builds the JSON stored inside the QR. `days` is replaced by `dates`.
export const buildQRData = (item = {}, type = 'U') => {
  if (type === 'A' || item.type === 'A') {
    return JSON.stringify({
      app: 'QRAPP',
      type: 'A',
      name: String(item.name || ''),
      role: String(item.role || ''),
      phone: String(item.phone || ''),
      dates: [currentQRDate()],
    });
  }

  const dates = buildQRDates(item.days);
  const payload = {
    app: 'QRAPP',
    type: 'U',
    name: String(item.name || ''),
    phone: String(item.phone || ''),
  };
  if (item.city) payload.city = String(item.city);
  if (dates.length > 0) payload.dates = dates;
  if (item.group) payload.group = String(item.group);
  return JSON.stringify(payload);
};

export const buildQRImageUrl = (qrData, size = 300) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;
