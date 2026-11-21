// Single source of truth for the date/time embedded in every QR code.
// Day numbers and time ranges come from the Event Dates dialog; month/year come from the live clock.
const TIMEZONE = 'Asia/Kolkata';
const TIMES_KEY = 'qr_event_times';
export const DEFAULT_QR_TIMES = ['09:00-12:00', '13:00-16:00', '17:00-20:00', '21:00-23:00'];

const pad = (n) => String(n).padStart(2, '0');

export const normalizeQRTimes = (times) => {
  if (!Array.isArray(times)) return [];
  const result = [];
  for (const raw of times) {
    const value = String(raw || '').replace(/\s+/g, '');
    if (/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(value) && !result.includes(value)) result.push(value);
  }
  return result;
};

export const loadQRTimes = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = normalizeQRTimes(JSON.parse(localStorage.getItem(TIMES_KEY)));
      if (saved.length === 4) return saved;
    }
  } catch { /* bad saved value — use defaults */ }
  return [...DEFAULT_QR_TIMES];
};

export const saveQRTimes = (times) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(TIMES_KEY, JSON.stringify(times));
};

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
  if (type === 'S' || item.type === 'S') {
    const times = normalizeQRTimes(item.times);
    return JSON.stringify({
      app: 'QRAPP',
      type: 'S',
      name: String(item.name || ''),
      role: String(item.role || ''),
      phone: String(item.phone || ''),
      dates: [currentQRDate()],
      times: times.length ? times : loadQRTimes(),
      override: true,
    });
  }
  if (type === 'A' || item.type === 'A') {
    const payload = {
      app: 'QRAPP',
      type: 'A',
      name: String(item.name || ''),
      role: String(item.role || ''),
      phone: String(item.phone || ''),
      dates: [currentQRDate()],
    };
    if (item.scanOverride) payload.override = true;
    return JSON.stringify(payload);
  }

  const dates = buildQRDates(item.days);
  const times = normalizeQRTimes(item.times);
  const payloadTimes = times.length ? times : loadQRTimes();
  const payload = {
    app: 'QRAPP',
    type: 'U',
    name: String(item.name || ''),
    phone: String(item.phone || ''),
  };
  if (item.city) payload.city = String(item.city);
  if (dates.length > 0) payload.dates = dates;
  if (payloadTimes.length) payload.times = payloadTimes;
  if (item.group) payload.group = String(item.group);
  return JSON.stringify(payload);
};

export const buildQRImageUrl = (qrData, size = 300) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;
