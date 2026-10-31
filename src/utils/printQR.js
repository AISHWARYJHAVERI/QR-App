import { HEADER_BANNER_BASE64 } from './qrHeaderBanner';

export const printQRCards = ({ items, type, eventDates = [] }) => {
  return new Promise((resolve) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { resolve(); return; }

    const CARDS_PER_PAGE = 9; // 3 columns x 3 rows on A4 portrait
    const pages = [];
    for (let i = 0; i < items.length; i += CARDS_PER_PAGE) {
      pages.push(items.slice(i, i + CARDS_PER_PAGE));
    }

    const pagesHtml = pages.map((pageItems) => {
      const cardsHtml = pageItems.map((item) => buildCardHtml({
        qrImageUrl: buildQRImageUrl(buildQRData(item, type)),
        name: item.name,
        city: item.city,
        days: item.days,
        eventDates
      })).join('');

      return `<div class="a4-sheet"><div class="grid-container">${cardsHtml}</div></div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Print QR - A4</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
    }
    .a4-sheet {
      width: 210mm;
      height: 297mm;
      padding: 8mm 6mm;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin: 0 auto;
      position: relative;
    }
    .a4-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 58mm);
      grid-gap: 5mm 5mm;
      justify-content: center;
      align-content: start;
      width: 100%;
    }
    .card {
      width: 58mm;
      height: 87mm;
      background: #FFFDF9; /* Light elegant cream background */
      border: 1.5px solid #800020; /* Dark maroon border */
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .card-header-banner {
      width: 100%;
      background: #ffffff;
      border-bottom: 1.2px solid #800020;
      line-height: 0;
    }
    .card-header-banner img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: contain;
    }
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 1.5mm 2mm;
    }
    .qr-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 1mm;
      border-radius: 5px;
      border: 1px solid #e7dfd5;
      margin-bottom: 1.5mm;
      box-shadow: 0 1px 2px rgba(128, 0, 32, 0.08);
    }
    .qr-wrap img {
      width: 32mm;
      height: 32mm;
      display: block;
    }
    .person-name {
      font-size: 13px;
      font-weight: 800;
      color: #800020; /* Dark maroon tone */
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1.2;
      margin-bottom: 0.8mm;
      max-width: 95%;
      word-break: break-word;
    }
    .person-city {
      font-size: 10px;
      font-weight: 700;
      color: #1e3a8a; /* Rich deep royal navy blue complementing cream and maroon */
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .person-days {
      width: 100%;
      text-align: center;
      margin-top: 1.2mm;
    }
    .days-label {
      display: block;
      font-size: 6.5px;
      font-weight: 700;
      color: #065f46; /* Deep forest green */
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 0.6mm;
    }
    .days-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.8mm;
    }
    .day-chip {
      display: inline-block;
      background: #047857; /* Rich emerald green */
      border: 0.6px solid #065f46;
      color: #ffffff;
      font-size: 7.5px;
      font-weight: 700;
      padding: 0.5mm 1.5mm;
      border-radius: 3px;
      letter-spacing: 0.02em;
      box-shadow: 0 0.5px 1.5px rgba(4, 120, 87, 0.2);
    }
    .day-chip b {
      font-size: 6px;
      color: #a7f3d0; /* Soft mint highlight */
      margin-right: 0.6mm;
    }
    .card-footer {
      width: 100%;
      background: #FAF3E0; /* Warm matching cream tone */
      border-top: 1px solid #d97706;
      padding: 1.6mm 2mm;
      text-align: center;
    }
    .footer-author {
      font-size: 7.5px;
      font-weight: 600;
      color: #78350f; /* Refined contrasting warm tone */
      letter-spacing: 0.03em;
    }
  </style>
</head>
<body>
  ${pagesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
    window.onafterprint = function() {
      window.close();
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();

    const timer = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(timer);
        resolve();
      }
    }, 500);
  });
};

const buildDaysHtml = (days, eventDates) => {
  if (!Array.isArray(days) || days.length === 0) return '';
  const chips = days.map((d) => {
    const idx = eventDates.indexOf(d);
    const label = idx >= 0 ? `D${idx + 1}` : '';
    return `<span class="day-chip">${label ? `<b>${label}</b>` : ''}${d}</span>`;
  }).join('');
  return `<div class="person-days"><span class="days-label">Allowed Days</span><div class="days-chips">${chips}</div></div>`;
};

const buildCardHtml = ({ qrImageUrl, name, city, days, eventDates = [] }) => {
  return `
  <div class="card">
    <div class="card-header-banner">
      <img src="${HEADER_BANNER_BASE64}" alt="Header Banner" />
    </div>
    <div class="card-body">
      <div class="qr-wrap">
        <img src="${qrImageUrl}" alt="QR Code"/>
      </div>
      <div class="person-name">${name || ''}</div>
      ${city ? `<div class="person-city">${city}</div>` : ''}
      ${buildDaysHtml(days, eventDates)}
    </div>
    <div class="card-footer">
      <div class="footer-author">Developed by Aishwary Jhaveri</div>
    </div>
  </div>`;
};

export const buildQRData = (item, type) => {
  if (type === 'U') {
    const city = item.city ? `,"city":"${item.city}"` : '';
    const days = Array.isArray(item.days) && item.days.length > 0
      ? `,"days":[${[...new Set(item.days.map(Number))].filter(n => !Number.isNaN(n)).join(',')}]`
      : '';
    return `{"app":"QRAPP","type":"U","name":"${item.name}","phone":"${item.phone}"${city}${days}}`;
  }
  return `{"app":"QRAPP","type":"A","name":"${item.name}","role":"${item.role}","phone":"${item.phone}"}`;
};

export const buildQRImageUrl = (qrData) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;
};
