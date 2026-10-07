import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import axios from 'axios';

const EditUser = ({ rowData, onUserUpdated, showError, showSuccess, localMode = false, eventDates = [], dayCount = 0 }) => {
    const [userDialog, setUserDialog] = useState(false);
    const [user, setUser] = useState({ name: '', phone: '', city: '', ...rowData });
    const [submitted, setSubmitted] = useState(false);
    const [editDays, setEditDays] = useState(Array.isArray(rowData.days) ? rowData.days : []);

    useEffect(() => {
        setUser({ name: '', phone: '', city: '', ...rowData });
        setEditDays(Array.isArray(rowData.days) ? rowData.days : []);
    }, [rowData]);

    const toggleEditDay = (d) => {
        setEditDays(prev => {
            if (prev.includes(d)) return prev.filter(x => x !== d);
            if (dayCount > 0 && prev.length >= dayCount) {
                showError(`This folder allows exactly ${dayCount} day${dayCount > 1 ? 's' : ''}.`);
                return prev;
            }
            return [...prev, d];
        });
    };

    const daysValid = dayCount === 0 || editDays.length === dayCount;

    const openEdit = () => {
        setUser({ name: '', phone: '', city: '', ...rowData });
        setEditDays(Array.isArray(rowData.days) ? rowData.days : []);
        setSubmitted(false);
        setUserDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setUserDialog(false);
    };

    const saveUser = async () => {
        setSubmitted(true);

        if (user.name.trim() && user.phone.trim() && (user.city || '').trim()) {
            if (!daysValid) {
                showError(`Select exactly ${dayCount} day${dayCount > 1 ? 's' : ''} (${editDays.length}/${dayCount}).`);
                return;
            }
            let _user = { ...user, days: [...editDays] };
            if (localMode) {
                showSuccess("User Updated Successfully");
                onUserUpdated(_user);
                setUserDialog(false);
                setSubmitted(false);
                return;
            }
            try {
                await axios.put(`/users/${user.id}`, _user);
                showSuccess("User Updated Successfully");
                onUserUpdated(_user);
                setUserDialog(false);
            } catch (error) {
                showError("Error updating user");
            }
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _user = { ...user };
        _user[name] = val;
        setUser(_user);
    };

    const userDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Cancel" icon="pi pi-times" onClick={hideDialog} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
            <Button label="Save Changes" icon="pi pi-check" onClick={saveUser} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }} />
        </div>
    );

    // Safe retrieval of city for new/existing schema
    const displayCity = user.city || user.address?.city || '';

    return (
        <>
            <Button label="Edit" icon="pi pi-pencil" outlined severity="success" onClick={openEdit} title="Edit User" />

            <Dialog visible={userDialog} style={{ width: '450px' }} header={<div className="p-dialog-title gradient-text">Edit User Details</div>} modal className="p-fluid" footer={userDialogFooter} onHide={hideDialog} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
                    <div className="form-section">
                        <div className="field">
                            <label htmlFor={`name-${user.id}`} className="font-bold">Full Name</label>
                            <InputText id={`name-${user.id}`} value={user.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !user.name })} />
                            {submitted && !user.name && <small className="p-error">Name is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor={`phone-${user.id}`} className="font-bold">Mobile Number</label>
                            <InputText id={`phone-${user.id}`} value={user.phone} onChange={(e) => onInputChange(e, 'phone')} required className={classNames({ 'p-invalid': submitted && !user.phone })} />
                            {submitted && !user.phone && <small className="p-error">Mobile number is required.</small>}
                        </div>
                        <div className="field mb-0">
                            <label htmlFor={`city-${user.id}`} className="font-bold">City</label>
                            <InputText id={`city-${user.id}`} value={displayCity} onChange={(e) => onInputChange(e, 'city')} required className={classNames({ 'p-invalid': submitted && !user.city && !user.address?.city })} />
                            {submitted && !user.city && !user.address?.city && <small className="p-error">City is required.</small>}
                        </div>
                        <div className="field mb-0">
                            <label className="font-bold">Allowed Days</label>
                            <div className="user-days-chips">
                                {eventDates.map((d, i) => (
                                    <button
                                        key={`${d}-${i}`}
                                        type="button"
                                        className={`user-day-chip${editDays.includes(d) ? ' user-day-chip-active' : ''}`}
                                        onClick={() => toggleEditDay(d)}
                                    >
                                        <b>D{i + 1}</b>{d}
                                    </button>
                                ))}
                            </div>
                            {!daysValid && editDays.length > 0 && (
                                <small className="p-error">Select exactly {dayCount} day{dayCount > 1 ? 's' : ''} ({editDays.length}/{dayCount}).</small>
                            )}
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default EditUser;
