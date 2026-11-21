import { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import axios from 'axios';
import PrintQROptions from '../../components/PrintQROptions';
import { nameKey, parseName, sameName, isDuplicateName, findDuplicateName, nextFamilyNumber, findPhoneOwner, phoneKey, DUP_NAME_MSG } from '../../utils/nameKey';
import { buildQRData } from '../../utils/qrDates';

const AddUser = ({ users = [], onUserAdded, showError, showSuccess, inline = false, eventDates = [], defaultDays = [], group = '', groupPlanned = 0, groupSaved = 0, ensureFolder }) => {
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

    const dayCountRequired = !group && Array.isArray(defaultDays) ? defaultDays.length : 0;

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

    const maxCount = group ? 100 : 15;
    const remainingSlots = group && groupPlanned > 0
        ? Math.min(100, Math.max(groupPlanned - groupSaved, 1))
        : 1;
    const syncKey = `${group}|${groupPlanned}|${users.length > 0}`;
    const [lastKey, setLastKey] = useState(syncKey);
    const [collapsedAll, setCollapsedAll] = useState(false);
    const [openOne, setOpenOne] = useState([]);
    if (!sameDays || lastKey !== syncKey) {
        setLastKey(syncKey);
        setLastDefault(defaultDays);
        setUserDays(defaultDays || []);
        setExtras([]);
        setFamilyCount(remainingSlots);
        setOpenOne([]);
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

    const groupStart = group ? Math.max(nextFamilyNumber(group, users), 1) : 0;
    const baseName = group || user.name.trim();
    const familyStart = !group && familyCount > 1 && baseName && parseName(baseName).num === null
        ? nextFamilyNumber(baseName, users)
        : 0;
    const firstName = group
        ? (user.name.trim() || `${group} ${groupStart}`)
        : (familyStart ? `${baseName} ${familyStart}` : user.name);

    const autoName = (i) => {
        if (group) return `${group} ${groupStart + i}`;
        return baseName ? `${baseName} ${familyStart ? familyStart + i : i}` : '';
    };

    const memberAt = (i) => {
        const o = extras[i - 1] || {};
        return {
            name: o.name ?? autoName(i),
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

    const changeFamilyCount = (value) => {
        const n = Math.min(maxCount, Math.max(1, parseInt(value, 10) || 1));
        setFamilyCount(n);
        setExtras(prev => prev.slice(0, n - 1));
    };

    const allMembers = () => {
        const list = [{ ...user, name: firstName, days: userDays, _i: 0 }];
        for (let i = 1; i < familyCount; i++) list.push({ ...memberAt(i), _i: i });
        return list;
    };

    const activeMembers = (list) => (group ? list.filter(m => m._i === 0 || m.name.trim()) : list);

    const isCardCollapsed = (i) => collapsedAll && !openOne.includes(i);
    const toggleCard = (i) => setOpenOne(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));

    const nameDupAt = (i, members) => {
        if (!nameKey(members[i].name)) return false;
        if (isDuplicateName(members[i].name, users)) return true;
        return members.some((o, j) => j !== i && sameName(o.name, members[i].name));
    };

    const [phoneWarn, setPhoneWarn] = useState(null);

    const confirmPhones = (members) => {
        const lines = [];
        const seen = new Set();
        members.forEach(m => {
            const owner = findPhoneOwner(m.phone, users);
            const key = phoneKey(m.phone);
            if (owner && !seen.has(key)) {
                seen.add(key);
                lines.push(`Mobile ${m.phone.trim()} is already used by "${owner.name}".`);
            }
        });
        if (!lines.length) return Promise.resolve(true);
        return new Promise(resolve => setPhoneWarn({ lines, resolve }));
    };

    const closePhoneWarn = (ok) => {
        if (phoneWarn) phoneWarn.resolve(ok);
        setPhoneWarn(null);
    };

    const memberValid = (m) => m.name.trim() && m.phone.trim() && m.city.trim() && isDaysValid(m.days);

    const serverError = (error, fallback) => {
        const msg = error?.response?.data?.error;
        return error?.response?.status === 409 && msg ? msg : fallback;
    };

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
            const dupUser = findDuplicateName(user.name, users);
            if (dupUser) {
                showError(`"${user.name.trim()}" matches "${dupUser.name}". ${DUP_NAME_MSG}`);
                return;
            }
            if (!(await confirmPhones([user]))) return;
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
                showError(serverError(error, "Error creating user"));
            }
        }
    };

    const saveFamily = async () => {
        setSubmitted(true);
        const members = activeMembers(allMembers());
        const bad = members.findIndex(m => !memberValid(m));
        if (bad >= 0) {
            showError(`Please complete member ${members[bad]._i + 1} (name, mobile, city and days).`);
            return;
        }
        const dup = members.findIndex((_, i) => nameDupAt(i, members));
        if (dup >= 0) {
            const match = findDuplicateName(members[dup].name, users);
            showError(`Member ${members[dup]._i + 1} "${members[dup].name.trim()}"${match ? ` matches "${match.name}".` : ' is repeated.'} ${DUP_NAME_MSG}`);
            return;
        }
        if (!(await confirmPhones(members))) return;
        if (ensureFolder && !group) {
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
                    name: m.name.trim(), phone: m.phone.trim(), city: m.city.trim(), days: [...m.days], group
                });
                onUserAdded(response.data);
                saved++;
            } catch (error) {
                showError(serverError(error, `Error creating ${m.name}`));
            }
        }
        if (saved > 0) showSuccess(`${saved} member${saved > 1 ? 's' : ''} saved`);
        if (saved === members.length) {
            setUser(emptyUser);
            setUserDays(defaultDays || []);
            setExtras([]);
            setOpenOne([]);
            setFamilyCount(group && groupPlanned > 0 ? Math.min(100, Math.max(groupPlanned - groupSaved - saved, 1)) : 1);
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

    const isFormValid = firstName.trim() && user.phone.trim() && user.city.trim();
    const orderedUserDays = [...userDays].sort((a, b) => eventDates.indexOf(a) - eventDates.indexOf(b));
    const qrData = buildQRData({ name: firstName, phone: user.phone, city: user.city, days: orderedUserDays, group }, 'U');
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff`;
    const itemForPrint = { ...user, name: firstName, days: orderedUserDays, group };

    const daysBadges = orderedUserDays.length > 0 && (
        <div className="qr-days-row">
            {orderedUserDays.map(d => {
                const idx = eventDates.indexOf(d);
                return <span key={d} className="days-chip">{idx >= 0 && <b>D{idx + 1}</b>}{d}</span>;
            })}
        </div>
    );

    const familyMembers = allMembers();

    const phoneWarnDialog = (
        <Dialog
            visible={!!phoneWarn}
            style={{ width: '440px' }}
            header={<div className="p-dialog-title gradient-text">Mobile Already Used</div>}
            modal
            onHide={() => closePhoneWarn(false)}
            closeIcon={<span className="pi pi-times"></span>}
            draggable={false}
            resizable={false}
            footer={
                <div className="dialog-footer mt-4">
                    <Button label="Cancel" icon="pi pi-times" onClick={() => closePhoneWarn(false)} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
                    <Button label="Save Anyway" icon="pi pi-check" onClick={() => closePhoneWarn(true)} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }} />
                </div>
            }
        >
            {(phoneWarn?.lines || []).map((l, i) => <p key={i} style={{ color: '#e2e8f0', margin: '0 0 6px' }}>{l}</p>)}
            <p style={{ color: '#94a3b8', margin: '10px 0 0' }}>Save anyway if this is the same family sharing a number.</p>
        </Dialog>
    );

    if (inline) {
        return (
            <div className="add-user-card mb-8 p-6 rounded-3xl" style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', boxShadow: 'inset 0 4px 30px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)' }}>
                <div className="family-header mb-5">
                    <h3 className="text-xl font-bold gradient-text text-left m-0">Add New User Entry</h3>
                    <div className="family-count-field" ref={familyDropdownRef}>
                        <span className="family-count-label">{group ? `How many ${group}s?` : 'Family Members'}</span>
                        {group && (
                            <div className="group-count-control">
                                <button type="button" className="group-count-step" onClick={() => changeFamilyCount(familyCount - 1)} aria-label="Fewer">−</button>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    className="group-count-input"
                                    value={familyCount}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => changeFamilyCount(e.target.value)}
                                />
                                <button type="button" className="group-count-step" onClick={() => changeFamilyCount(familyCount + 1)} aria-label="More">+</button>
                                {groupPlanned > 0 && (
                                    <button type="button" className="group-count-remaining" onClick={() => changeFamilyCount(remainingSlots)} title="Reset to remaining slots">
                                        {groupSaved} of {groupPlanned} added
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="custom-count-select" hidden={!!group}>
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
                {(familyCount > 1 || group) && (
                    <div className="family-notes">
                        <div>
                            <i className="pi pi-info-circle"></i> Mobile and City are copied from <b>Member 1</b> into every card — fill Member 1 carefully (you can still edit any card).
                        </div>
                        {group && (
                            <div>
                                <i className="pi pi-info-circle"></i> Clear a card's name to <b>skip</b> it — empty cards are not saved, so you can finish the rest later.
                            </div>
                        )}
                        {familyCount > 1 && (
                            <button type="button" className="family-collapse-btn" onClick={() => { setCollapsedAll(prev => !prev); setOpenOne([]); }}>
                                <i className={`pi ${collapsedAll ? 'pi-angle-double-down' : 'pi-angle-double-up'}`}></i> {collapsedAll ? 'Expand cards' : 'Collapse cards'}
                            </button>
                        )}
                    </div>
                )}
                {familyCount > 1 && <div className="family-member-title">Member 1</div>}
                <div className="row">
                    <div className="col-md-4 col-12 field">
                        <label htmlFor="name-inline" className="font-bold">Full Name</label>
                        <InputText id="name-inline" value={group ? firstName : user.name} onChange={(e) => onInputChange(e, 'name')} placeholder="Enter full name" required className={classNames({ 'p-invalid': (submitted && !firstName.trim()) || nameDupAt(0, familyMembers) })} />
                        {submitted && !firstName.trim() && <small className="p-error">Name is required.</small>}
                        {nameDupAt(0, familyMembers) && <small className="p-error">{DUP_NAME_MSG}</small>}
                        {familyStart > 0 && !nameDupAt(0, familyMembers) && (
                            <small className="family-continue-hint">"{baseName}" family exists — continuing from "{firstName}".</small>
                        )}
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
                    const skipped = !!group && !m.name.trim();
                    if (isCardCollapsed(i)) {
                        return (
                            <div key={i} className={`family-member-block family-member-collapsed${skipped ? ' family-member-skipped' : ''}`} onClick={() => toggleCard(i)}>
                                <span className="family-member-title" style={{ margin: 0 }}>Member {i + 1}</span>
                                <span className="family-collapsed-summary">
                                    {skipped ? 'Skipped (no name)' : `${m.name} · ${m.phone || 'no mobile'} · ${m.city || 'no city'} · ${m.days.length} day${m.days.length === 1 ? '' : 's'}`}
                                </span>
                                <i className="pi pi-chevron-down"></i>
                            </div>
                        );
                    }
                    return (
                        <div key={i} className={`family-member-block${skipped ? ' family-member-skipped' : ''}`}>
                            <div className="family-member-title">
                                Member {i + 1}
                                {skipped && <span className="family-skip-badge">Skipped — will not be saved</span>}
                                {collapsedAll && <button type="button" className="family-card-fold" onClick={() => toggleCard(i)}>Fold</button>}
                            </div>
                            <div className="row">
                                <div className="col-md-4 col-12 field">
                                    <label className="font-bold">Full Name</label>
                                    <InputText value={m.name} onChange={(e) => setExtra(i, 'name', e.target.value)} placeholder="Enter full name" className={classNames({ 'p-invalid': (submitted && !m.name.trim() && !group) || nameDupAt(i, familyMembers) })} />
                                    {submitted && !m.name.trim() && !group && <small className="p-error">Name is required.</small>}
                                    {nameDupAt(i, familyMembers) && <small className="p-error">{DUP_NAME_MSG}</small>}
                                </div>
                                <div className="col-md-4 col-12 field">
                                    <label className="font-bold">Mobile Number</label>
                                    <InputText value={m.phone} onChange={(e) => setExtra(i, 'phone', e.target.value)} placeholder="Enter mobile number" className={classNames({ 'p-invalid': submitted && !m.phone.trim() })} />
                                    {submitted && !skipped && !m.phone.trim() && <small className="p-error">Mobile number is required.</small>}
                                </div>
                                <div className="col-md-4 col-12 field">
                                    <label className="font-bold">City</label>
                                    <InputText value={m.city} onChange={(e) => setExtra(i, 'city', e.target.value)} placeholder="Enter city" className={classNames({ 'p-invalid': submitted && !m.city.trim() })} />
                                    {submitted && !skipped && !m.city.trim() && <small className="p-error">City is required.</small>}
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
                                        {!mDaysValid && submitted && !skipped && (
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
                        label={familyCount > 1 ? `Save ${activeMembers(familyMembers).length} ${group ? `${group}${activeMembers(familyMembers).length === 1 ? '' : 's'}` : 'Members'}` : 'Save User Details'}
                        icon="pi pi-check"
                        onClick={familyCount > 1 || group ? saveFamily : saveUser}
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
                {phoneWarnDialog}
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
                            {isDuplicateName(user.name, users) && <small className="p-error">{DUP_NAME_MSG}</small>}
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
            {phoneWarnDialog}
        </>
    );
};

export default AddUser;
