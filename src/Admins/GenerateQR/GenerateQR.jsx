import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

const GenerateQR = ({ rowData, onPrintClick }) => {
    const [qrDialog, setQrDialog] = useState(false);

    const openQR = () => {
        setQrDialog(true);
    };

    const hideQRDialog = () => {
        setQrDialog(false);
    };

    const qrData = `{"app":"QRAPP","type":"A","name":"${rowData.name}","role":"${rowData.role}","phone":"${rowData.phone}"}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;

    const qrDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Close" icon="pi pi-times" onClick={hideQRDialog} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
            {onPrintClick && (
                <Button label="Print QR" icon="pi pi-print" onClick={() => { hideQRDialog(); onPrintClick(rowData); }} style={{ backgroundColor: '#6366f1', color: '#ffffff', border: 'none' }} />
            )}
        </div>
    );

    return (
        <>
            <Button label="QR Code" icon="pi pi-qrcode" outlined severity="help" onClick={openQR} title="Generate QR Code" />

            <Dialog visible={qrDialog} style={{ width: '400px' }} header={<div className="p-dialog-title gradient-text">Generate QR Code</div>} modal className="p-fluid" footer={qrDialogFooter} onHide={hideQRDialog} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                <div className="d-flex flex-column align-items-center text-center" style={{ gap: '1.5rem', padding: '1rem 0' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <img src={qrImageUrl} alt={`QR Code for ${rowData.name}`} style={{ width: '220px', height: '220px', display: 'block' }} />
                    </div>
                    
                    <div style={{ marginTop: '0.5rem' }}>
                        <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{rowData.name}</h4>
                        <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', margin: '0.15rem 0' }}>{rowData.role}</p>
                        <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', margin: 0 }}>{rowData.phone}</p>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default GenerateQR;
