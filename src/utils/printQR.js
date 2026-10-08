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
      background: #ffffff;
      border: 1.5px solid #1e293b;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .card-header {
      width: 100%;
      background: #0f172a;
      color: #f8fafc;
      padding: 3.2mm 2mm 2.8mm 2mm;
      text-align: center;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .header-title {
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.03em;
      line-height: 1.25;
      text-transform: uppercase;
      color: #ffffff;
    }
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 2mm 2mm;
    }
    .qr-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 1.5mm;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-bottom: 2mm;
    }
    .qr-wrap img {
      width: 38mm;
      height: 38mm;
      display: block;
    }
    .person-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1.2;
      margin-bottom: 1mm;
      max-width: 95%;
      word-break: break-word;
    }
    .person-city {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .person-days {
      width: 100%;
      text-align: center;
      margin-top: 1.5mm;
    }
    .days-label {
      display: block;
      font-size: 7px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 0.8mm;
    }
    .days-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1mm;
    }
    .day-chip {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 8px;
      font-weight: 700;
      padding: 0.6mm 1.6mm;
      border-radius: 3px;
      letter-spacing: 0.03em;
    }
    .day-chip b {
      font-size: 6.5px;
      color: #93c5fd;
      margin-right: 0.8mm;
    }
    .card-footer {
      width: 100%;
      background: #f1f5f9;
      border-top: 1px solid #cbd5e1;
      padding: 2mm 2mm;
      text-align: center;
    }
    .footer-author {
      font-size: 8px;
      font-weight: 600;
      color: #334155;
      letter-spacing: 0.04em;
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
    <div class="card-header">
      <div class="header-title">Shri Patan Visha Shrimali Soni Vishnuyag Yagn</div>
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
      <div class="footer-author">Aishwary Jhaveri</div>
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
