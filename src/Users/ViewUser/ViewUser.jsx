import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

const DataField = ({ label, value }) => (
    <div className="field">
        <label className="font-bold">{label}</label>
        <div className="p-inputtext p-disabled bg-slate-100 text-slate-700">{value || 'N/A'}</div>
    </div>
);

const ViewUser = ({ rowData }) => {
    const [viewDialog, setViewDialog] = useState(false);
    const [user, setUser] = useState({ name: '', phone: '', city: '', ...rowData });

    useEffect(() => {
        setUser({ name: '', phone: '', city: '', ...rowData });
    }, [rowData]);

    const openView = () => {
        setUser({ name: '', phone: '', city: '', ...rowData });
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

    const displayCity = user.city || user.address?.city || '';

    return (
        <>
            <Button label="View" icon="pi pi-eye" outlined severity="info" onClick={openView} title="View User" />

            <Dialog visible={viewDialog} style={{ width: '450px' }} header={<div className="p-dialog-title gradient-text">User Profile</div>} modal className="p-fluid" footer={viewDialogFooter} onHide={hideViewDialog} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
                    <div className="view-profile-card">
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-slate-900 font-bold text-2xl gradient-text">{user.name}</h3>
                        </div>
                    </div>

                    <div className="form-section">
                        <DataField label="Full Name" value={user.name} />
                        <DataField label="Mobile Number" value={user.phone} />
                        <DataField label="City" value={displayCity} />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default ViewUser;
