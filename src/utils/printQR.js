export const printQRCard = ({ qrImageUrl, name, phone, city, role, type, index, total }) => {
  return new Promise((resolve) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { resolve(); return; }

    let infoHtml = '';
    infoHtml += `<div class="info-row"><span class="info-label">Name</span><span class="info-value">${name}</span></div>`;
    infoHtml += `<div class="info-row"><span class="info-label">Mobile</span><span class="info-value">${phone}</span></div>`;
    if (city) infoHtml += `<div class="info-row"><span class="info-label">City</span><span class="info-value">${city}</span></div>`;
    if (role) infoHtml += `<div class="info-row"><span class="info-label">Role</span><span class="info-value">${role}</span></div>`;

    const counterHtml = total ? `<div class="counter">${index} / ${total}</div>` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Print QR - ${name}</title>
  <style>
    @page { size: 125mm 88mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 125mm; height: 88mm;
      display: flex; align-items: center; justify-content: center;
      font-family: Georgia, 'Times New Roman', serif;
      background: #faf5eb;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .card {
      width: 119mm; height: 82mm;
      background: #faf5eb;
      border: 2.5px solid #c8a96e;
      border-radius: 4px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 3mm 4mm; text-align: center;
      position: relative;
    }
    .counter {
      position: absolute; top: 2mm; right: 3mm;
      font-size: 7px; color: #a0896a; font-family: Arial, sans-serif;
    }
    .main-header {
      font-size: 13.5px; font-weight: 700; color: #6b1a1a;
      letter-spacing: 0.02em; line-height: 1.3; margin-bottom: 1mm;
    }
    .divider {
      width: 70%; height: 1px; background: #c8a96e; margin: 1.5mm auto;
      opacity: 0.6;
    }
    .sub-header {
      font-size: 10px; color: #8b6914; font-style: italic;
      letter-spacing: 0.04em; line-height: 1.4; margin-bottom: 2mm;
    }
    .info-section {
      margin: 0.5mm 0; text-align: left; width: 85%;
    }
    .info-row {
      display: flex; justify-content: space-between;
      padding: 0.5mm 0; font-size: 8.5px;
      font-family: 'Segoe UI', Arial, sans-serif;
      border-bottom: 1px dotted #e0d5c0;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #8b6914; font-weight: 600; }
    .info-value { color: #2d2d2d; font-weight: 500; }
    .qr-wrap {
      margin: 1mm 0;
      background: #ffffff; padding: 2mm; border-radius: 3px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .qr-wrap img { width: 22mm; height: 22mm; display: block; }
    .footer-divider {
      width: 80%; height: 1px; background: #c8a96e; margin: 1mm auto;
      opacity: 0.4;
    }
    .footer-text {
      font-size: 7px; color: #666;
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.4; margin-top: 0.5mm;
    }
    .footer-text .name { font-weight: 600; color: #444; }
  </style>
</head>
<body>
  <div class="card">
    ${counterHtml}
    <div class="main-header">
      Shri Patan Visa Shrimali<br/>Soni Gnyati Patan
    </div>
    <div class="divider"></div>
    <div class="sub-header">
      Shri Dashavtar Mahavishnu Yagna
    </div>
    <div class="info-section">${infoHtml}</div>
    <div class="qr-wrap"><img src="${qrImageUrl}" alt="QR"/></div>
    <div class="footer-divider"></div>
    <div class="footer-text">
      <div class="name">Aishwary Jhaveri</div>
      <div>www.qr-app.vercel.app</div>
    </div>
  </div>
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

export const buildQRData = (item, type) => {
  if (type === 'U') {
    const city = item.city ? `,"city":"${item.city}"` : '';
    return `{"app":"QRAPP","type":"U","name":"${item.name}","phone":"${item.phone}"${city}}`;
  }
  return `{"app":"QRAPP","type":"A","name":"${item.name}","role":"${item.role}","phone":"${item.phone}"}`;
};

export const buildQRImageUrl = (qrData) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;
};
