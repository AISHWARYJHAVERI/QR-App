import { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import axios from 'axios';
import PrintQROptions from '../../components/PrintQROptions';

const AddUser = ({ onUserAdded, showError, showSuccess, inline = false, eventDates = [], defaultDays = [], ensureFolder }) => {
    let emptyUser = {
        name: '',
        phone: '',
        city: ''
    };

    const [userDialog, setUserDialog] = useState(false);
    const [qrDialog, setQrDialog] = useState(false);
    const [printDialogVisible, setPrintDialogVisible] = useState(false);
    const [user, setUser] = useState(emptyUser);
    const [submitted, setSubmitted] = useState(false);
    const [userDays, setUserDays] = useState(defaultDays || []);

    const dayCountRequired = Array.isArray(defaultDays) ? defaultDays.length : 0;

    const [lastDefault, setLastDefault] = useState(defaultDays);
    const sameDays = Array.isArray(defaultDays) && Array.isArray(lastDefault)
        && defaultDays.length === lastDefault.length
        && defaultDays.every((v, i) => v === lastDefault[i]);
    const [familyCount, setFamilyCount] = useState(1);
    const [extras, setExtras] = useState([]);
    const [familyDropdownOpen, setFamilyDropdownOpen] = useState(false);
    const familyDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (familyDropdownRef.current && !familyDropdownRef.current.contains(e.target)) {
                setFamilyDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!sameDays) {
        setLastDefault(defaultDays);
        setUserDays(defaultDays || []);
        setExtras([]);
    }

    const nextDays = (prev, d) => {
        if (prev.includes(d)) return prev.filter(x => x !== d);
        if (dayCountRequired > 0) {
            if (prev.length >= dayCountRequired) {
                showError(`This folder allows exactly ${dayCountRequired} day${dayCountRequired > 1 ? 's' : ''}.`);
                return prev;
            }
            return [...prev, d];
        }
        if (prev.length >= 4) return prev;
        return [...prev, d];
    };

    const toggleUserDay = (d) => setUserDays(prev => nextDays(prev, d));

    const isDaysValid = (days) => dayCountRequired > 0 ? days.length === dayCountRequired : days.length >= 1;
    const daysValid = isDaysValid(userDays);

    const memberAt = (i) => {
        const o = extras[i - 1] || {};
        const base = user.name.trim();
        return {
            name: o.name ?? (base ? `${base} ${i}` : ''),
            phone: o.phone ?? user.phone,
            city: o.city ?? user.city,
            days: o.days ?? userDays
        };
    };

    const setExtra = (i, field, val) => {
        setExtras(prev => {
            const next = [...prev];
            next[i - 1] = { ...(next[i - 1] || {}), [field]: val };
            return next;
        });
    };

    const toggleExtraDay = (i, d) => setExtra(i, 'days', nextDays(memberAt(i).days, d));

    const changeFamilyCount = (n) => {
        setFamilyCount(n);
        setExtras(prev => prev.slice(0, n - 1));
    };

    const allMembers = () => {
        const list = [{ ...user, days: userDays }];
        for (let i = 1; i < familyCount; i++) list.push(memberAt(i));
        return list;
    };

    const memberValid = (m) => m.name.trim() && m.phone.trim() && m.city.trim() && isDaysValid(m.days);

    const daysField = (
        <div className="user-days-field">
            <label className="font-bold">Allowed Days</label>
            <div className="user-days-chips">
                {eventDates.map((d, i) => (
                    <button
                        key={`${d}-${i}`}
                        type="button"
                        className={`user-day-chip${userDays.includes(d) ? ' user-day-chip-active' : ''}`}
                        onClick={() => toggleUserDay(d)}
                    >
                        <b>D{i + 1}</b>{d}
                    </button>
                ))}
            </div>
            {!daysValid && (submitted || userDays.length > 0) && (
                <small className="p-error">
                    {dayCountRequired > 0
                        ? `Select exactly ${dayCountRequired} day${dayCountRequired > 1 ? 's' : ''} (${userDays.length}/${dayCountRequired}).`
                        : 'Select at least 1 day.'}
                </small>
            )}
        </div>
    );

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
            if (!daysValid) {
                showError(dayCountRequired > 0
                    ? `Select exactly ${dayCountRequired} day${dayCountRequired > 1 ? 's' : ''}.`
                    : 'Select at least 1 day.');
                return;
            }
            if (ensureFolder) {
                const ok = await ensureFolder([...userDays]);
                if (!ok) return;
            }
            let _user = { ...user, days: [...userDays] };
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

    const saveFamily = async () => {
        setSubmitted(true);
        const members = allMembers();
        const bad = members.findIndex(m => !memberValid(m));
        if (bad >= 0) {
            showError(`Please complete member ${bad + 1} (name, mobile, city and days).`);
            return;
        }
        if (ensureFolder) {
            const seen = new Set();
            for (const m of members) {
                if (seen.has(m.days.length)) continue;
                seen.add(m.days.length);
                const ok = await ensureFolder([...m.days]);
                if (!ok) return;
            }
        }
        let saved = 0;
        for (const m of members) {
            try {
                const response = await axios.post('/users', {
                    name: m.name.trim(), phone: m.phone.trim(), city: m.city.trim(), days: [...m.days]
                });
                onUserAdded(response.data);
                saved++;
            } catch {
                showError(`Error creating ${m.name}`);
            }
        }
        if (saved > 0) showSuccess(`${saved} member${saved > 1 ? 's' : ''} saved`);
        if (saved === members.length) {
            setUser(emptyUser);
            setUserDays(defaultDays || []);
            setExtras([]);
            setFamilyCount(1);
            setSubmitted(false);
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _user = { ...user };
        _user[name] = val;
        setUser(_user);
    };

    const handlePrintClick = () => {
        setQrDialog(false);
        setPrintDialogVisible(true);
    };

    const userDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Cancel" icon="pi pi-times" onClick={hideDialog} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
            <Button label="Save User Details" icon="pi pi-check" onClick={saveUser} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }} />
        </div>
    );

    const qrDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Close" icon="pi pi-times" onClick={() => setQrDialog(false)} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: '1px solid transparent' }} />
            <Button label="Print QR" icon="pi pi-print" onClick={handlePrintClick} style={{ backgroundColor: '#6366f1', color: '#ffffff', border: '1px solid transparent', minWidth: '200px' }} />
        </div>
    );

    const isFormValid = user.name.trim() && user.phone.trim() && user.city.trim();
    const orderedUserDays = [...userDays].sort((a, b) => eventDates.indexOf(a) - eventDates.indexOf(b));
    const qrData = `{"app":"QRAPP","type":"U","name":"${user.name}","phone":"${user.phone}","city":"${user.city}"${orderedUserDays.length > 0 ? `,"days":[${orderedUserDays.join(',')}]` : ''}}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;
    const itemForPrint = { ...user, days: orderedUserDays };

    const daysBadges = orderedUserDays.length > 0 && (
        <div className="qr-days-row">
            {orderedUserDays.map(d => {
                const idx = eventDates.indexOf(d);
                return <span key={d} className="days-chip">{idx >= 0 && <b>D{idx + 1}</b>}{d}</span>;
            })}
        </div>
    );

    if (inline) {
        return (
            <div className="add-user-card mb-8 p-6 rounded-3xl" style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', boxShadow: 'inset 0 4px 30px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)' }}>
                <div className="family-header mb-5">
                    <h3 className="text-xl font-bold gradient-text text-left m-0">Add New User Entry</h3>
                    <div className="family-count-field" ref={familyDropdownRef}>
                        <span className="family-count-label">Family Members</span>
                        <div className="custom-count-select">
                            <button
                                type="button"
                                className={`custom-count-trigger ${familyDropdownOpen ? 'active' : ''}`}
                                onClick={() => setFamilyDropdownOpen(prev => !prev)}
                                aria-label="Select family members count"
                            >
                                <span className="custom-count-val">{familyCount}</span>
                                <i className={`pi pi-chevron-${familyDropdownOpen ? 'up' : 'down'} custom-count-arrow`}></i>
                            </button>
                            {familyDropdownOpen && (
                                <div className="custom-count-dropdown">
                                    <div className="custom-count-grid">
                                        {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                className={`custom-count-option ${n === familyCount ? 'selected' : ''}`}
                                                onClick={() => {
                                                    changeFamilyCount(n);
                                                    setFamilyDropdownOpen(false);
                                                }}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {familyCount > 1 && <div className="family-member-title">Member 1</div>}
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
                <div className="row">
                    <div className="col-12 field">{daysField}</div>
                </div>

                {Array.from({ length: familyCount - 1 }, (_, k) => k + 1).map(i => {
                    const m = memberAt(i);
                    const mDaysValid = isDaysValid(m.days);
                    return (
                        <div key={i} className="family-member-block">
                            <div className="family-member-title">Member {i + 1}</div>
                            <div className="row">
                                <div className="col-md-4 col-12 field">
                                    <label className="font-bold">Full Name</label>
                                    <InputText value={m.name} onChange={(e) => setExtra(i, 'name', e.target.value)} placeholder="Enter full name" className={classNames({ 'p-invalid': submitted && !m.name.trim() })} />
                                    {submitted && !m.name.trim() && <small className="p-error">Name is required.</small>}
                                </div>
                                <div className="col-md-4 col-12 field">
                                    <label className="font-bold">Mobile Number</label>
                                    <InputText value={m.phone} onChange={(e) => setExtra(i, 'phone', e.target.value)} placeholder="Enter mobile number" className={classNames({ 'p-invalid': submitted && !m.phone.trim() })} />
                                    {submitted && !m.phone.trim() && <small className="p-error">Mobile number is required.</small>}
                                </div>
                                <div className="col-md-4 col-12 field">
                                    <label className="font-bold">City</label>
                                    <InputText value={m.city} onChange={(e) => setExtra(i, 'city', e.target.value)} placeholder="Enter city" className={classNames({ 'p-invalid': submitted && !m.city.trim() })} />
                                    {submitted && !m.city.trim() && <small className="p-error">City is required.</small>}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12 field">
                                    <div className="user-days-field">
                                        <label className="font-bold">Allowed Days</label>
                                        <div className="user-days-chips">
                                            {eventDates.map((d, di) => (
                                                <button
                                                    key={`${d}-${di}`}
                                                    type="button"
                                                    className={`user-day-chip${m.days.includes(d) ? ' user-day-chip-active' : ''}`}
                                                    onClick={() => toggleExtraDay(i, d)}
                                                >
                                                    <b>D{di + 1}</b>{d}
                                                </button>
                                            ))}
                                        </div>
                                        {!mDaysValid && submitted && (
                                            <small className="p-error">
                                                {dayCountRequired > 0
                                                    ? `Select exactly ${dayCountRequired} day${dayCountRequired > 1 ? 's' : ''} (${m.days.length}/${dayCountRequired}).`
                                                    : 'Select at least 1 day.'}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="d-flex flex-wrap gap-3 mt-4 justify-content-end">
                    <Button
                        type="button"
                        label="Print QR"
                        icon="pi pi-print"
                        onClick={() => setPrintDialogVisible(true)}
                        disabled={!isFormValid || !daysValid}
                        style={{ width: '240px', borderRadius: '12px', padding: '0.6rem 1.5rem', backgroundColor: '#6366f1', color: '#ffffff', border: '1px solid transparent' }}
                    />
                    <Button
                        type="button"
                        label="Generate QR Code"
                        icon="pi pi-qrcode"
                        severity="help"
                        outlined
                        onClick={() => setQrDialog(true)}
                        disabled={!isFormValid || !daysValid}
                        style={{ width: '240px', borderRadius: '12px', padding: '0.6rem 1.5rem' }}
                    />
                    <Button
                        type="button"
                        label={familyCount > 1 ? `Save ${familyCount} Members` : 'Save User Details'}
                        icon="pi pi-check"
                        onClick={familyCount > 1 ? saveFamily : saveUser}
                        style={{ backgroundColor: '#10b981', color: '#ffffff', border: '1px solid transparent', width: '240px', borderRadius: '12px', padding: '0.6rem 1.5rem' }}
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
                            {daysBadges}
                        </div>
                    </div>
                </Dialog>
                <PrintQROptions
                    visible={printDialogVisible}
                    onHide={(clearSelection) => { setPrintDialogVisible(false); }}
                    currentItem={itemForPrint}
                    selectedItems={[]}
                    type="U"
                    fetchAllUrl="/users"
                 eventDates={eventDates}
                />
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
                            <InputText id="city" value={user.city} onChange={(e) => onInputChange(e, 'city')} placeholder="Enter city" required className={classNames({ 'p-invalid': submitted && !user.city })} />
                            {submitted && !user.city && <small className="p-error">City is required.</small>}
                        </div>

                        {daysField}

                        <div className="mt-4 d-flex flex-wrap gap-2 justify-content-center">
                            <Button
                                type="button"
                                label="Print QR"
                                icon="pi pi-print"
                                onClick={() => setPrintDialogVisible(true)}
                                disabled={!isFormValid || !daysValid}
                                style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', backgroundColor: '#6366f1', color: '#ffffff', border: '1px solid transparent', width: '240px' }}
                            />
                            <Button
                                type="button"
                                label="Generate QR Code"
                                icon="pi pi-qrcode"
                                severity="help"
                                outlined
                                onClick={() => setQrDialog(true)}
                                disabled={!isFormValid || !daysValid}
                                style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', width: '240px' }}
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
            <PrintQROptions
                visible={printDialogVisible}
                onHide={(clearSelection) => { setPrintDialogVisible(false); }}
                currentItem={user}
                selectedItems={[]}
                type="U"
                fetchAllUrl="/users"
             eventDates={eventDates}
            />
        </>
    );
};

export default AddUser;
