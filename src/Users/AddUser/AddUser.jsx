import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import axios from 'axios';

const AddUser = ({ onUserAdded, showError, showSuccess, inline = false }) => {
    let emptyUser = {
        name: '',
        phone: '',
        city: ''
    };

    const [userDialog, setUserDialog] = useState(false);
    const [qrDialog, setQrDialog] = useState(false);
    const [user, setUser] = useState(emptyUser);
    const [submitted, setSubmitted] = useState(false);

    const openNew = () => {
        setUser(emptyUser);
        setSubmitted(false);
        setUserDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setUserDialog(false);
    };

    const saveUser = async () => {
        setSubmitted(true);

        if (user.name.trim() && user.phone.trim() && user.city.trim()) {
            let _user = { ...user };
            try {
                const response = await axios.post('/users', _user);
                showSuccess("User Created Successfully");
                onUserAdded(response.data);
                setUserDialog(false);
                setUser(emptyUser);
                setSubmitted(false);
            } catch (error) {
                showError("Error creating user");
            }
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _user = { ...user };
        _user[name] = val;
        setUser(_user);
    };

    const printQrCode = () => {
        const printWindow = window.open('', '_blank');
        const qrData = `Name: ${user.name}\nMobile: ${user.phone}\nCity: ${user.city}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - ${user.name}</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background: white;
                            color: #0f172a;
                            text-align: center;
                        }
                        .print-container {
                            border: 2px dashed #cbd5e1;
                            padding: 2.5rem;
                            border-radius: 1.5rem;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                            background: #ffffff;
                            max-width: 350px;
                        }
                        img {
                            width: 250px;
                            height: 250px;
                            margin-bottom: 1.5rem;
                            display: block;
                        }
                        h2 {
                            margin: 0 0 0.5rem 0;
                            font-size: 1.5rem;
                            font-weight: 700;
                        }
                        p {
                            margin: 0.25rem 0;
                            color: #64748b;
                            font-size: 1.1rem;
                        }
                        @media print {
                            body {
                                height: auto;
                            }
                            .print-container {
                                border: none;
                                box-shadow: none;
                                padding: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <img src="${qrImageUrl}" alt="QR Code" />
                        <h2>${user.name}</h2>
                        <p>Mobile: ${user.phone}</p>
                        <p>City: ${user.city}</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const userDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Cancel" icon="pi pi-times" onClick={hideDialog} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
            <Button label="Save User Details" icon="pi pi-check" onClick={saveUser} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }} />
        </div>
    );

    const qrDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Close" icon="pi pi-times" onClick={() => setQrDialog(false)} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
            <Button label="Print QR" icon="pi pi-print" onClick={printQrCode} style={{ backgroundColor: '#6366f1', color: '#ffffff', border: 'none' }} />
        </div>
    );

    const isFormValid = user.name.trim() && user.phone.trim() && user.city.trim();
    const qrData = `Name: ${user.name}\nMobile: ${user.phone}\nCity: ${user.city}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;

    if (inline) {
        return (
            <div className="add-user-card mb-8 p-6 rounded-3xl" style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', boxShadow: 'inset 0 4px 30px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)' }}>
                <h3 className="text-xl font-bold mb-5 gradient-text text-left">Add New User Entry</h3>
                <div className="row">
                    <div className="col-md-4 col-12 field">
                        <label htmlFor="name-inline" className="font-bold">Full Name</label>
                        <InputText id="name-inline" value={user.name} onChange={(e) => onInputChange(e, 'name')} placeholder="Enter full name" required className={classNames({ 'p-invalid': submitted && !user.name })} />
                        {submitted && !user.name && <small className="p-error">Name is required.</small>}
                    </div>
                    <div className="col-md-4 col-12 field">
                        <label htmlFor="phone-inline" className="font-bold">Mobile Number</label>
                        <InputText id="phone-inline" value={user.phone} onChange={(e) => onInputChange(e, 'phone')} placeholder="Enter mobile number" required className={classNames({ 'p-invalid': submitted && !user.phone })} />
                        {submitted && !user.phone && <small className="p-error">Mobile number is required.</small>}
                    </div>
                    <div className="col-md-4 col-12 field">
                        <label htmlFor="city-inline" className="font-bold">City</label>
                        <InputText id="city-inline" value={user.city} onChange={(e) => onInputChange(e, 'city')} placeholder="Enter city" required className={classNames({ 'p-invalid': submitted && !user.city })} />
                        {submitted && !user.city && <small className="p-error">City is required.</small>}
                    </div>
                </div>
                
                <div className="d-flex flex-wrap gap-3 mt-4 justify-content-end">
                    <Button 
                        type="button"
                        label="Generate QR Code" 
                        icon="pi pi-qrcode" 
                        severity="help" 
                        outlined
                        onClick={() => setQrDialog(true)} 
                        disabled={!isFormValid}
                        style={{ width: 'auto', borderRadius: '12px', padding: '0.6rem 1.5rem' }} 
                    />
                    <Button 
                        type="button"
                        label="Save User Details" 
                        icon="pi pi-check" 
                        onClick={saveUser} 
                        style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', width: 'auto', borderRadius: '12px', padding: '0.6rem 1.5rem' }} 
                    />
                </div>

                {/* QR Code Dialog (Popup is still modal as requested) */}
                <Dialog visible={qrDialog} style={{ width: '400px' }} header={<div className="p-dialog-title gradient-text">Generated QR Code</div>} modal className="p-fluid" footer={qrDialogFooter} onHide={() => setQrDialog(false)} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                    <div className="d-flex flex-column align-items-center text-center" style={{ gap: '1.5rem', padding: '1rem 0' }}>
                        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <img src={qrImageUrl} alt="Generated QR" style={{ width: '220px', height: '220px', display: 'block' }} />
                        </div>
                        
                        <div style={{ marginTop: '0.5rem' }}>
                            <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user.name}</h4>
                            <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: '500', margin: '0.25rem 0' }}>{user.phone}</p>
                            <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: '500', margin: 0 }}>{user.city}</p>
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    }

    return (
        <>
            <Button label="Add New User" icon="pi pi-plus" className="p-button-primary p-button-sm btn-action-add" onClick={openNew} />

            {/* Main Add User Dialog (Modal fallback) */}
            <Dialog visible={userDialog} style={{ width: '450px' }} header={<div className="p-dialog-title gradient-text">Add New User</div>} modal className="p-fluid" footer={userDialogFooter} onHide={hideDialog} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
                    <div className="form-section">
                        <div className="field">
                            <label htmlFor="name" className="font-bold">Full Name</label>
                            <InputText id="name" value={user.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !user.name })} />
                            {submitted && !user.name && <small className="p-error">Name is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="phone" className="font-bold">Mobile Number</label>
                            <InputText id="phone" value={user.phone} onChange={(e) => onInputChange(e, 'phone')} required className={classNames({ 'p-invalid': submitted && !user.phone })} />
                            {submitted && !user.phone && <small className="p-error">Mobile number is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="city" className="font-bold">City</label>
                            <InputText id="city" value={user.city} onChange={(e) => onInputChange(e, 'city')} required className={classNames({ 'p-invalid': submitted && !user.city })} />
                            {submitted && !user.city && <small className="p-error">City is required.</small>}
                        </div>
                        
                        <div className="mt-4 text-center">
                            <Button 
                                type="button"
                                label="Generate QR Code" 
                                icon="pi pi-qrcode" 
                                severity="help" 
                                outlined
                                onClick={() => setQrDialog(true)} 
                                disabled={!isFormValid}
                                style={{ width: '100%', borderRadius: '12px', padding: '0.6rem' }} 
                            />
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* QR Code Dialog (Modal fallback) */}
            <Dialog visible={qrDialog} style={{ width: '400px' }} header={<div className="p-dialog-title gradient-text">Generated QR Code</div>} modal className="p-fluid" footer={qrDialogFooter} onHide={() => setQrDialog(false)} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                <div className="d-flex flex-column align-items-center text-center" style={{ gap: '1.5rem', padding: '1rem 0' }}>
                    <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <img src={qrImageUrl} alt="Generated QR" style={{ width: '220px', height: '220px', display: 'block' }} />
                    </div>
                    
                    <div style={{ marginTop: '0.5rem' }}>
                        <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user.name}</h4>
                        <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: '500', margin: '0.25rem 0' }}>{user.phone}</p>
                        <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: '500', margin: 0 }}>{user.city}</p>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default AddUser;
