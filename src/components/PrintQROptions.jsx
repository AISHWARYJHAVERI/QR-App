import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { printQRCards } from '../utils/printQR';
import axios from 'axios';

const PrintQROptions = ({ visible, onHide, currentItem, selectedItems, type, fetchAllUrl, allItems, committeeItems, committeeDisabled, eventDates = [] }) => {
  const [printing, setPrinting] = useState(false);

  const printItems = async (items) => {
    await printQRCards({ items, type, eventDates });
  };

  const handlePrintSpecific = async () => {
    if (!currentItem) return;
    setPrinting(true);
    try {
      await printItems([currentItem]);
    } catch (e) {
      console.error('Print failed', e);
    }
    setPrinting(false);
    onHide('specific');
  };

  const handlePrintSelected = async () => {
    const items = selectedItems || [];
    if (items.length === 0) return;
    setPrinting(true);
    try {
      await printItems(items);
    } catch (e) {
      console.error('Print failed', e);
    }
    setPrinting(false);
    onHide('selected');
  };

  const handlePrintAll = async () => {
    setPrinting(true);
    onHide(true);
    try {
      const items = allItems || (await axios.get(fetchAllUrl)).data;
      if (items.length === 0) { setPrinting(false); return; }
      setPrinting(false);
      await printItems(items);
      onHide('all');
    } catch (error) {
      console.error('Print All failed:', error);
      setPrinting(false);
    }
  };

  const handlePrintCommittee = async () => {
    const items = committeeItems || [];
    if (items.length === 0 || committeeDisabled) return;
    setPrinting(true);
    try {
      await printItems(items);
    } catch (e) {
      console.error('Print committee failed', e);
    }
    setPrinting(false);
    onHide('committee');
  };

  const handleCancel = () => {
    if (!printing) onHide(false);
  };

  return (
    <Dialog visible={visible} style={{ width: '480px', maxWidth: '92vw' }}
      header={<div className="p-dialog-title gradient-text">Print QR Options</div>}
      modal className="p-fluid print-qr-dialog"
      onHide={handleCancel}
      closeIcon={<span className="pi pi-times"></span>}
      draggable={false} resizable={false}>
      <div className="d-flex flex-column align-items-center text-center" style={{ gap: '1.25rem', padding: '0.75rem 1rem 1.25rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Choose print option:</p>
        <div className="d-flex flex-column w-100" style={{ gap: '0.85rem' }}>
          {currentItem && (
            <Button label="Print This QR" icon="pi pi-user" onClick={handlePrintSpecific} disabled={printing}
              style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 600, width: '100%' }} />
          )}
          {selectedItems && selectedItems.length > 0 && (
            <Button label={`Print Selected (${selectedItems.length})`} icon="pi pi-check-square" onClick={handlePrintSelected} disabled={printing}
              style={{ backgroundColor: '#14b8a6', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 600, width: '100%' }} />
          )}
          <Button label="Print All" icon="pi pi-print" onClick={handlePrintAll} disabled={printing}
            style={{ backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 600, width: '100%' }} />
          <Button label="Print Committee" icon="pi pi-folder-open" onClick={handlePrintCommittee} disabled={printing || committeeDisabled || !committeeItems || committeeItems.length === 0}
            title={committeeDisabled ? 'Open a committee to print its QR codes' : 'Print the current committee QR codes'}
            style={{ backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 600, width: '100%' }} />
          <Button label="Cancel" icon="pi pi-times" onClick={handleCancel} disabled={printing}
            style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: 600, width: '100%', marginTop: '0.25rem' }} />
        </div>
      </div>
    </Dialog>
  );
};

export default PrintQROptions;
