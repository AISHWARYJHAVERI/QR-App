import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import axios from 'axios';

const ROLES = [
  'President', 'Vice President', 'Secretary', 'Joint Secretary',
  'Treasurer', 'Joint Treasurer', 'Committee Member',
  'Project Convener', 'Project Co-convener'
];

const EditAdmin = ({ rowData, onAdminUpdated, showError, showSuccess }) => {
    const [adminDialog, setAdminDialog] = useState(false);
    const [admin, setAdmin] = useState({ name: '', username: '', password: '', role: 'President', phone: '', city: '', ...rowData });
    const [showEditPwd, setShowEditPwd] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setAdmin({ name: '', username: '', password: '', role: 'President', phone: '', city: '', ...rowData });
    }, [rowData]);

    const openEdit = () => {
        setAdmin({ name: '', username: '', password: '', role: 'President', phone: '', city: '', ...rowData });
        setSubmitted(false);
        setAdminDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setAdminDialog(false);
    };

    const saveAdmin = async () => {
        setSubmitted(true);

        if (admin.name.trim() && admin.username.trim() && admin.phone.trim() && admin.city.trim()) {
            let _admin = { ...admin };
            try {
                await axios.put(`/admins/${admin.id}`, _admin);
                showSuccess("Admin Updated Successfully");
                onAdminUpdated(_admin);
                setAdminDialog(false);
            } catch (error) {
                showError("Error updating admin");
            }
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _admin = { ...admin };
        _admin[name] = val;
        setAdmin(_admin);
    };

    const adminDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Cancel" icon="pi pi-times" onClick={hideDialog} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
            <Button label="Save Changes" icon="pi pi-check" onClick={saveAdmin} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }} />
        </div>
    );

    return (
        <>
            <Button label="Edit" icon="pi pi-pencil" outlined severity="success" onClick={openEdit} title="Edit Admin" />

            <Dialog visible={adminDialog} style={{ width: '450px' }} header={<div className="p-dialog-title gradient-text">Edit Admin Details</div>} modal className="p-fluid" footer={adminDialogFooter} onHide={hideDialog} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
                    <div className="form-section">
                        <div className="field">
                            <label htmlFor={`admin-name-${admin.id}`} className="font-bold">Full Name</label>
                            <InputText id={`admin-name-${admin.id}`} value={admin.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !admin.name })} />
                            {submitted && !admin.name && <small className="p-error">Name is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor={`admin-username-${admin.id}`} className="font-bold">Username</label>
                            <InputText id={`admin-username-${admin.id}`} value={admin.username} onChange={(e) => onInputChange(e, 'username')} required className={classNames({ 'p-invalid': submitted && !admin.username })} />
                            {submitted && !admin.username && <small className="p-error">Username is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor={`admin-password-${admin.id}`} className="font-bold">Password</label>
                            <div className="pwd-input-wrap">
                                <InputText id={`admin-password-${admin.id}`} type={showEditPwd ? "text" : "password"} value={admin.password} onChange={(e) => onInputChange(e, 'password')} required className={classNames({ 'p-invalid': submitted && !admin.password })} />
                                <button type="button" className="pwd-toggle-btn" onClick={() => setShowEditPwd(!showEditPwd)} tabIndex={-1}>
                                    <i className={`pi ${showEditPwd ? "pi-eye-slash" : "pi-eye"}`}></i>
                                </button>
                            </div>
                            {submitted && !admin.password && <small className="p-error">Password is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor={`admin-role-${admin.id}`} className="font-bold">Role</label>
                            <select id={`admin-role-${admin.id}`} value={admin.role} onChange={(e) => onInputChange(e, 'role')} className="admin-edit-role-select" style={{ width: '100%' }}>
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor={`admin-phone-${admin.id}`} className="font-bold">Mobile Number</label>
                            <InputText id={`admin-phone-${admin.id}`} value={admin.phone} onChange={(e) => onInputChange(e, 'phone')} required className={classNames({ 'p-invalid': submitted && !admin.phone })} />
                            {submitted && !admin.phone && <small className="p-error">Mobile number is required.</small>}
                        </div>
                        <div className="field mb-0">
                            <label htmlFor={`admin-city-${admin.id}`} className="font-bold">City</label>
                            <InputText id={`admin-city-${admin.id}`} value={admin.city} onChange={(e) => onInputChange(e, 'city')} required className={classNames({ 'p-invalid': submitted && !admin.city })} />
                            {submitted && !admin.city && <small className="p-error">City is required.</small>}
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default EditAdmin;
