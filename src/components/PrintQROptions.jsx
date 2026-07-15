import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { printQRCard, buildQRData, buildQRImageUrl } from '../utils/printQR';
import axios from 'axios';

const PrintQROptions = ({ visible, onHide, currentItem, selectedItems, type, fetchAllUrl }) => {
  const [printing, setPrinting] = useState(false);

  const doPrint = async (items) => {
    setPrinting(true);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const qrData = buildQRData(item, type);
      const qrImageUrl = buildQRImageUrl(qrData);
      await printQRCard({
        qrImageUrl, name: item.name, phone: item.phone,
        city: item.city, role: item.role, type,
        index: i + 1, total: items.length
      });
    }
    setPrinting(false);
    onHide(true);
  };

  const handlePrintSelected = () => {
    const items = (selectedItems && selectedItems.length > 0) ? selectedItems : (currentItem ? [currentItem] : []);
    if (items.length === 0) return;
    doPrint(items);
  };

  const handlePrintAll = async () => {
    setPrinting(true);
    onHide(true);
    try {
      const response = await axios.get(fetchAllUrl);
      const items = response.data;
      if (items.length === 0) return;
      setPrinting(false);
      await doPrint(items);
    } catch (error) {
      console.error('Print All failed:', error);
      setPrinting(false);
    }
  };

  const handleCancel = () => {
    if (!printing) onHide(false);
  };

  return (
    <Dialog visible={visible} style={{ width: '400px' }}
      header={<div className="p-dialog-title gradient-text">Print QR Options</div>}
      modal className="p-fluid"
      onHide={handleCancel}
      closeIcon={<span className="pi pi-times"></span>}
      draggable={false} resizable={false}>
      <div className="d-flex flex-column align-items-center text-center" style={{ gap: '1.5rem', padding: '1rem 0' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Choose print option:</p>
        <div className="d-flex flex-wrap justify-content-center" style={{ gap: '0.75rem' }}>
          <Button label="Print All" icon="pi pi-print" onClick={handlePrintAll} disabled={printing}
            style={{ backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.7rem 1.5rem', fontWeight: 600 }} />
          <Button label="Print Selected" icon="pi pi-file" onClick={handlePrintSelected} disabled={printing}
            style={{ backgroundColor: '#14b8a6', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.7rem 1.5rem', fontWeight: 600 }} />
        </div>
        <Button label="Cancel" icon="pi pi-times" onClick={handleCancel} disabled={printing}
          style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.7rem 2rem', fontWeight: 600, minWidth: '120px' }} />
      </div>
    </Dialog>
  );
};

export default PrintQROptions;
