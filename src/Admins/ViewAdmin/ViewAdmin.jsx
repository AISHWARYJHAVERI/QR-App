import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

const DataField = ({ label, value }) => (
    <div className="field">
        <label className="font-bold">{label}</label>
        <div className="p-inputtext p-disabled bg-slate-100 text-slate-700">{value || 'N/A'}</div>
    </div>
);

const ViewAdmin = ({ rowData }) => {
    const [viewDialog, setViewDialog] = useState(false);
    const [admin, setAdmin] = useState({ name: '', username: '', role: '', phone: '', city: '', ...rowData });

    useEffect(() => {
        setAdmin({ name: '', username: '', role: '', phone: '', city: '', ...rowData });
    }, [rowData]);

    const openView = () => {
        setAdmin({ name: '', username: '', role: '', phone: '', city: '', ...rowData });
        setViewDialog(true);
    };

    const hideViewDialog = () => {
        setViewDialog(false);
    };

    const viewDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Close" icon="pi pi-times" onClick={hideViewDialog} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
        </div>
    );

    return (
        <>
            <Button label="View" icon="pi pi-eye" outlined severity="info" onClick={openView} title="View Admin" />

            <Dialog visible={viewDialog} style={{ width: '450px' }} header={<div className="p-dialog-title gradient-text">Admin Profile</div>} modal className="p-fluid" footer={viewDialogFooter} onHide={hideViewDialog} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
                    <div className="view-profile-card">
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {admin?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-slate-900 font-bold text-2xl gradient-text">{admin.name}</h3>
                        </div>
                    </div>

                    <div className="form-section">
                        <DataField label="Full Name" value={admin.name} />
                        <DataField label="Username" value={admin.username} />
                        <DataField label="Role" value={admin.role} />
                        <DataField label="Mobile Number" value={admin.phone} />
                        <DataField label="City" value={admin.city} />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default ViewAdmin;
