import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import './Users.css';

import Folder from '../components/Folder';
import AddUser from './AddUser/AddUser';
import EditUser from './EditUser/EditUser';
import DeleteUser from './DeleteUser/DeleteUser';
import GenerateQR from './GenerateQR/GenerateQR';
import ImportExcel from './ImportExcel/ImportExcel';
import Admins from '../Admins/Admins';
import ScanAnalytics from './ScanAnalytics/ScanAnalytics';
import PrintQROptions from '../components/PrintQROptions';

const paginatorTemplate = {
    layout: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport',
    'FirstPageLink': (options) => {
        return (
            <button type="button" className={options.className} onClick={options.onClick} disabled={options.disabled}>
                <span className="p-paginator-icon-text">&lt;&lt;</span>
            </button>
        );
    },
    'PrevPageLink': (options) => {
        return (
            <button type="button" className={options.className} onClick={options.onClick} disabled={options.disabled}>
                <span className="p-paginator-icon-text">&lt;</span>
            </button>
        );
    },

    'NextPageLink': (options) => {
        return (
            <button type="button" className={options.className} onClick={options.onClick} disabled={options.disabled}>
                <span className="p-paginator-icon-text">&gt;</span>
            </button>
        );
    },
    'LastPageLink': (options) => {
        return (
            <button type="button" className={options.className} onClick={options.onClick} disabled={options.disabled}>
                <span className="p-paginator-icon-text">&gt;&gt;</span>
            </button>
        );
    }
};

function Users({ isLoggedIn }) {
    const [users, setUsers] = useState([]);
    const [globalFilter, setGlobalFilter] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [showSelection, setShowSelection] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [printDialogVisible, setPrintDialogVisible] = useState(false);
    const [printCurrentItem, setPrintCurrentItem] = useState(null);
    const [printFolder, setPrintFolder] = useState(null);
    const toast = useRef(null);
    const tableContainerRef = useRef(null);
    const showSelectionRef = useRef(showSelection);
    const dropdownRef = useRef(null);
    const folderTriggerRef = useRef(null);
    const [ddStyle, setDdStyle] = useState({});

    useEffect(() => { showSelectionRef.current = showSelection; }, [showSelection]);

    const [activeFolder, setActiveFolder] = useState(null);
    const [folders, setFolders] = useState([]);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);

    const [eventDates, setEventDates] = useState(() => {
        try {
            const s = JSON.parse(localStorage.getItem('qr_event_dates'));
            if (Array.isArray(s) && s.length === 4 && s.every(n => Number(n) > 0)) return s.map(Number);
        } catch { /* bad saved value — use default */ }
        return [17, 18, 19, 20];
    });
    const [showDatesDialog, setShowDatesDialog] = useState(false);
    const [datesDraft, setDatesDraft] = useState(['17', '18', '19', '20']);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [pickerCount, setPickerCount] = useState(0);
    const [pickerDays, setPickerDays] = useState([]);
    const [pickerCustom, setPickerCustom] = useState(false);
    const [pickerName, setPickerName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);

    const [showChangeDays, setShowChangeDays] = useState(false);
    const [changeDaysDraft, setChangeDaysDraft] = useState([]);
    const [reprintItems, setReprintItems] = useState([]);
    const [folderMissing, setFolderMissing] = useState(null);
    const folderMissingResolve = useRef(null);

    const folderTypeCount = (f) => {
        if (Array.isArray(f?.days) && f.days.length > 0) return f.days.length;
        return parseInt(f?.name, 10) || 0;
    };
    const typeLabel = (n) => (n === 1 ? '1 day' : `${n} days`);
    const usedTypes = useMemo(() => new Set(folders.map(folderTypeCount).filter(n => n >= 1 && n <= 4)), [folders]);
    const sortedFolders = useMemo(() => [...folders].sort((a, b) => folderTypeCount(b) - folderTypeCount(a)), [folders]);
    const dayIndexOf = (d) => eventDates.indexOf(d);
    const orderedDays = (days) => [...days].sort((a, b) => dayIndexOf(a) - dayIndexOf(b));

    const isFolderView = !!activeFolder;

    const folderMembers = (f) => {
        if (!f) return users;
        const n = folderTypeCount(f);
        return users.filter(u => (Array.isArray(u.days) ? u.days.length : 0) === n);
    };

    const displayData = useMemo(() => {
        if (!activeFolder) return users;
        const n = folderTypeCount(activeFolder);
        return users.filter(u => (Array.isArray(u.days) ? u.days.length : 0) === n);
    }, [users, activeFolder]);

    useEffect(() => {
        fetchUsers();
        loadFolders();
        restoreSession();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setActiveTab('users');
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!showSelectionRef.current) return;
            if (e.target.closest('.p-dialog')) return;
            if (tableContainerRef.current && !tableContainerRef.current.contains(e.target)) {
                setShowSelection(false);
                setSelectedUsers([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!showFolderDropdown) return;
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                !folderTriggerRef.current?.contains(e.target)) {
                setShowFolderDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showFolderDropdown]);

    useEffect(() => {
        if (showFolderDropdown) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [showFolderDropdown]);

    useEffect(() => {
        if (!showFolderDropdown) { setDdStyle({}); return; }
        requestAnimationFrame(() => {
            const t = folderTriggerRef.current?.getBoundingClientRect();
            const d = dropdownRef.current;
            if (!t || !d) {
                setDdStyle({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', visibility: 'visible' });
                return;
            }
            const dh = d.offsetHeight;
            const dw = Math.min(d.offsetWidth, window.innerWidth - 32);
            let top = t.top - dh - 8;
            if (top < 16) top = 16;
            if (top + dh > window.innerHeight - 16) top = Math.max(16, window.innerHeight - dh - 16);
            let left = t.left + t.width / 2 - dw / 2;
            if (left < 16) left = 16;
            if (left + dw > window.innerWidth - 16) left = window.innerWidth - dw - 16;
            const originX = t.left + t.width / 2 - left;
            const originY = t.top + t.height / 2 - top;
            setDdStyle({ position: 'fixed', top: top + 'px', left: left + 'px', visibility: 'visible', '--origin-x': `${originX}px`, '--origin-y': `${originY}px` });
        });
    }, [showFolderDropdown]);

    const fetchUsers = async () => {
        const cached = localStorage.getItem('users_cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    setUsers(parsed);
                    setLoading(false);
                }
            } catch { }
        }

        try {
            const response = await axios.get('/users');
            setUsers(response.data);
            localStorage.setItem('users_cache', JSON.stringify(response.data));
        } catch (error) {
            console.error("Error fetching data: ", error);
            if (!localStorage.getItem('users_cache')) {
                showError("Could not load users. Server is starting up — please wait a moment and refresh.");
            }
        } finally {
            setLoading(false);
        }
    };

    const loadFolders = async () => {
        try {
            const response = await axios.get('/committeesessions');
            setFolders(response.data || []);
        } catch { }
    };

    const restoreSession = () => {
        try {
            const saved = localStorage.getItem('committee_active_session');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.mode === 'folder') {
                    if (parsed.activeFolderId) {
                        axios.get(`/committeesessions/${parsed.activeFolderId}`).then(res => {
                            const folder = res.data;
                            if (folder) {
                                setActiveFolder(folder);
                            }
                        }).catch(() => {
                            localStorage.removeItem('committee_active_session');
                        });
                    } else {
                        setActiveFolder(null);
                    }
                }
            }
        } catch { }
    };

    const persistSession = (m, f) => {
        localStorage.setItem('committee_active_session', JSON.stringify({
            mode: m,
            activeFolderId: f?.id || null,
            activeFolderName: f?.name || null,
        }));
    };

    const showError = (detail) => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 3000 });
    };

    const showSuccess = (detail) => {
        toast.current?.show({ severity: 'success', summary: 'Successful', detail, life: 3000 });
    };

    const handleUserAdded = (newUser) => {
        const updated = [...users, newUser];
        setUsers(updated);
        localStorage.setItem('users_cache', JSON.stringify(updated));
    };

    const handleUserUpdated = (updatedUser) => {
        const prev = users.find(u => u.id === updatedUser.id);
        const prevDays = orderedDays(Array.isArray(prev?.days) ? prev.days : []).join(',');
        const newDays = orderedDays(Array.isArray(updatedUser.days) ? updatedUser.days : []).join(',');
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            const _users = [...users];
            _users[index] = updatedUser;
            setUsers(_users);
            localStorage.setItem('users_cache', JSON.stringify(_users));
        }
        if (prev && prevDays !== newDays) {
            setReprintItems([{ ...updatedUser }]);
        }
    };

    const handleUserDeleted = (deletedUserId) => {
        const updated = users.filter(u => u.id !== deletedUserId);
        setUsers(updated);
        localStorage.setItem('users_cache', JSON.stringify(updated));
    };

    const handleImported = () => {
        fetchUsers();
    };

    const handleRouteImport = async (groups, skipped) => {
        if (!groups || groups.length === 0) {
            const reasons = (skipped || []).slice(0, 5).map(s => `${s.name || 'Unnamed'}: ${s.reason}`).join('; ');
            showError('No rows could be imported.' + (reasons ? ` Skipped — ${reasons}` : '') + ((skipped || []).length > 5 ? ` (+${skipped.length - 5} more)` : ''));
            return;
        }
        let imported = 0;
        let createdFolders = 0;
        try {
            for (const g of groups) {
                let folder = folders.find(f => folderTypeCount(f) === g.count);
                if (!folder) {
                    const comboCounts = {};
                    g.entries.forEach(e => {
                        const key = (e.days || []).join(',');
                        comboCounts[key] = (comboCounts[key] || 0) + 1;
                    });
                    const topKey = Object.keys(comboCounts).sort((a, b) => comboCounts[b] - comboCounts[a])[0];
                    const defaultDays = topKey ? topKey.split(',').map(Number) : eventDates.slice(0, g.count);
                    const res = await axios.post('/committeesessions', { name: typeLabel(g.count), days: orderedDays(defaultDays) });
                    folder = res.data;
                    createdFolders++;
                }
                for (const e of g.entries) {
                    await axios.post('/users', { name: e.name, phone: e.phone || '', city: e.city || '', days: e.days });
                    imported++;
                }
            }
            await loadFolders();
            await fetchUsers();
            const skippedCount = (skipped || []).length;
            showSuccess(`Imported ${imported} user${imported === 1 ? '' : 's'} into Global` + (createdFolders > 0 ? ` and created ${createdFolders} folder${createdFolders === 1 ? '' : 's'}` : '') + '.' + (skippedCount > 0 ? ` ${skippedCount} row${skippedCount > 1 ? 's' : ''} skipped.` : ''));
            if (skippedCount > 0) {
                const reasons = skipped.slice(0, 5).map(s => `${s.name || 'Unnamed'}: ${s.reason}`).join('; ');
                showError(`Skipped ${skippedCount} row${skippedCount > 1 ? 's' : ''} — ${reasons}${skippedCount > 5 ? ` (+${skippedCount - 5} more)` : ''}`);
            }
        } catch {
            showError('Error importing users.');
        }
    };

    const selectFolder = (folder) => {
        setActiveFolder(folder);
        persistSession('folder', folder);
        setShowFolderDropdown(false);
    };

    const startNewFolder = () => {
        openTypePicker();
    };

    const openTypePicker = () => {
        setShowFolderDropdown(false);
        setPickerCount(0);
        setPickerDays([]);
        setPickerCustom(false);
        setPickerName('');
        setShowTypePicker(true);
    };

    const closeTypePicker = () => {
        setShowTypePicker(false);
        setPickerCount(0);
        setPickerDays([]);
        setPickerCustom(false);
        setPickerName('');
    };

    const selectPickerType = (n) => {
        setPickerCustom(false);
        setPickerName(typeLabel(n));
        setPickerCount(n);
        setPickerDays(n === 4 ? [...eventDates] : []);
    };

    const selectPickerCustom = () => {
        setPickerCustom(true);
        setPickerCount(0);
        setPickerName('');
        setPickerDays([]);
    };

    const togglePickerDay = (d) => {
        setPickerDays(prev => {
            if (prev.includes(d)) return prev.filter(x => x !== d);
            if (pickerCustom) {
                if (prev.length >= 4) return prev;
                return [...prev, d];
            }
            if (prev.length >= pickerCount) {
                showError(`Select exactly ${pickerCount} date${pickerCount > 1 ? 's' : ''}.`);
                return prev;
            }
            return [...prev, d];
        });
    };

    const pickerInvalid = pickerCustom
        ? (!pickerName.trim() || pickerDays.length < 1 || usedTypes.has(pickerDays.length))
        : (!pickerCount || pickerDays.length !== pickerCount);

    const handlePickerCreate = async () => {
        if (pickerInvalid || creatingFolder) return;
        const days = orderedDays(pickerDays);
        const count = days.length;
        const dup = folders.find(f => folderTypeCount(f) === count);
        if (dup) {
            showError(`A "${typeLabel(count)}" folder already exists ("${dup.name}"). Delete it first.`);
            return;
        }
        const name = pickerCustom ? pickerName.trim() : typeLabel(pickerCount);
        setCreatingFolder(true);
        try {
            const res = await axios.post('/committeesessions', { name, days });
            await loadFolders();
            closeTypePicker();
            selectFolder(res.data);
            showSuccess(`Folder "${name}" created.`);
        } catch {
            showError('Error creating folder');
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleDatesSave = () => {
        const nums = datesDraft.map(n => parseInt(n, 10));
        if (nums.some(n => !n || n < 1 || n > 31)) { showError('Dates must be numbers between 1 and 31.'); return; }
        if (new Set(nums).size !== 4) { showError('The 4 event dates must be different.'); return; }
        setEventDates(nums);
        localStorage.setItem('qr_event_dates', JSON.stringify(nums));
        setShowDatesDialog(false);
        showSuccess('Event dates updated.');
    };

    const switchToApiMode = () => {
        setActiveFolder(null);
        persistSession('api', null);
        setShowFolderDropdown(false);
    };

    const ensureFolder = (days) => {
        const count = days.length;
        if (count >= 1 && folders.some(f => folderTypeCount(f) === count)) return Promise.resolve(true);
        return new Promise(resolve => {
            folderMissingResolve.current = resolve;
            setFolderMissing(orderedDays(days));
        });
    };

    const confirmFolderMissing = async () => {
        if (!folderMissing) return;
        const count = folderMissing.length;
        setCreatingFolder(true);
        try {
            const res = await axios.post('/committeesessions', { name: typeLabel(count), days: folderMissing });
            await loadFolders();
            showSuccess(`Folder "${res.data.name}" created.`);
            setFolderMissing(null);
            folderMissingResolve.current?.(true);
            folderMissingResolve.current = null;
        } catch {
            showError('Error creating folder');
            folderMissingResolve.current?.(false);
            folderMissingResolve.current = null;
        } finally {
            setCreatingFolder(false);
        }
    };

    const cancelFolderMissing = () => {
        setFolderMissing(null);
        folderMissingResolve.current?.(false);
        folderMissingResolve.current = null;
    };

    const openChangeDays = () => {
        setChangeDaysDraft([]);
        setShowChangeDays(true);
    };

    const applyChangeDays = async () => {
        if (changeDaysDraft.length === 0) {
            showError('Select at least 1 day.');
            return;
        }
        const ok = await ensureFolder(changeDaysDraft);
        if (!ok) return;
        const newDaysKey = orderedDays(changeDaysDraft).join(',');
        const affected = selectedUsers.filter(u => orderedDays(Array.isArray(u.days) ? u.days : []).join(',') !== newDaysKey);
        try {
            for (const u of affected) {
                await axios.put(`/users/${u.id}`, { ...u, days: [...changeDaysDraft] });
            }
        } catch {
            showError('Error updating days for selected users.');
            return;
        }
        setShowChangeDays(false);
        setShowSelection(false);
        setSelectedUsers([]);
        await fetchUsers();
        if (affected.length > 0) {
            showSuccess(`Updated days for ${affected.length} user${affected.length === 1 ? '' : 's'}.`);
            setReprintItems(affected.map(u => ({ ...u, days: [...changeDaysDraft] })));
        } else {
            showSuccess('Selected users already have these days.');
        }
    };

    const handleFolderDelete = async (e, folder) => {
        e.stopPropagation();
        if (!window.confirm(`Delete folder "${folder.name}"? People in it stay in the Global database.`)) return;
        try {
            await axios.delete(`/committeesessions/${folder.id}`);
            showSuccess('Folder "' + folder.name + '" deleted');
            if (activeFolder?.id === folder.id) {
                setActiveFolder(null);
                persistSession('api', null);
            }
            await loadFolders();
        } catch {
            showError('Error deleting folder');
        }
    };

    const handleFolderPrint = (e, f) => {
        e.stopPropagation();
        setPrintFolder(f);
        setPrintCurrentItem(null);
        setPrintDialogVisible(true);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="action-buttons">
                <EditUser rowData={rowData} onUserUpdated={handleUserUpdated} showError={showError} showSuccess={showSuccess} eventDates={eventDates} dayCount={isFolderView ? (activeFolder?.days?.length || 0) : 0} ensureFolder={ensureFolder} />
                <GenerateQR rowData={rowData} eventDates={eventDates} onPrintClick={(item) => { setPrintCurrentItem(item); setPrintDialogVisible(true); }} />
                <DeleteUser rowData={rowData} onUserDeleted={handleUserDeleted} showError={showError} showSuccess={showSuccess} />
                <Button icon="pi pi-print" className="p-button-rounded p-button-text p-button-sm print-icon-btn" onClick={() => { setPrintCurrentItem(rowData); setPrintDialogVisible(true); }} title="Print QR" />
            </div>
        );
    };

    const daysBodyTemplate = (rowData) => {
        const days = Array.isArray(rowData.days) ? rowData.days : [];
        if (days.length === 0) return <span className="days-none">—</span>;
        return (
            <span className="days-cell">
                {orderedDays(days).map(d => {
                    const idx = dayIndexOf(d);
                    return (
                        <span key={d} className="days-chip">
                            {idx >= 0 && <b>D{idx + 1}</b>}{d}
                        </span>
                    );
                })}
            </span>
        );
    };

    const header = (
        <div className="table-header">
            <div className="d-flex align-items-center gap-3">
                <h4 className="m-0 text-primary gradient-heading gradient-text">Manage Users</h4>
                {showSelection && (
                    <button type="button" className="selection-done-btn" onClick={() => { setShowSelection(false); setSelectedUsers([]); }}>
                        <i className="pi pi-times me-1"></i> Done Selection
                    </button>
                )}
                {showSelection && selectedUsers.length > 0 && !isFolderView && (
                    <button type="button" className="change-days-btn" onClick={openChangeDays}>
                        <i className="pi pi-calendar me-1"></i> Change Days ({selectedUsers.length})
                    </button>
                )}
            </div>
            <div className="header-actions">
                <div className="folder-trigger-wrapper" ref={folderTriggerRef} onClick={() => setShowFolderDropdown(prev => !prev)}>
                    <Folder color="#6366f1" size={0.72} open={showFolderDropdown} hidePapers items={[]} />
                    {folders.length > 0 && (
                        <span className="folder-trigger-badge">{folders.length}</span>
                    )}
                </div>
                <Button
                    type="button"
                    label="Print QR"
                    icon="pi pi-print"
                    onClick={() => { setPrintCurrentItem(null); setPrintDialogVisible(true); }}
                    title="Print QR"
                    style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', backgroundColor: '#6366f1', color: '#ffffff', border: '1px solid transparent', minWidth: '200px' }}
                />
                <ImportExcel
                    onImported={handleImported}
                    onRouteImport={handleRouteImport}
                    eventDates={eventDates}
                    showError={showError}
                    showSuccess={showSuccess}
                />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="p-inputtext-sm" />
                </span>
            </div>
        </div>
    );

    return (
        <div className="users-container">
            <Toast ref={toast} />

            <div className="users-card shadow-sm">
                <h2 className="dashboard-title animated-gradient">User Management Dashboard</h2>

                {isLoggedIn && (
                    <div className="tabs-container">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <i className="pi pi-users"></i><span>User Database</span>
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            <i className="pi pi-chart-bar"></i><span>Scan Analytics</span>
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
                            onClick={() => setActiveTab('admins')}
                        >
                            <i className="pi pi-shield"></i><span>Admin Panel</span>
                        </button>
                    </div>
                )}

                {activeTab === 'users' ? (
                    <>
                        <AddUser inline={true} onUserAdded={handleUserAdded} showError={showError} showSuccess={showSuccess} eventDates={eventDates} defaultDays={activeFolder?.days} ensureFolder={ensureFolder} />

                        <div className="mode-banner" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                            {isFolderView ? (
                                <>
                                    <div className="mode-banner-left">
                                        <i className="pi pi-folder-open" style={{ color: '#10b981' }}></i>
                                        <span>Folder View — <b style={{ color: '#ffffff' }}>{activeFolder?.name}</b></span>
                                        <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                            — {displayData.length} member{displayData.length === 1 ? '' : 's'} with {typeLabel(folderTypeCount(activeFolder))}
                                        </span>
                                        {Array.isArray(activeFolder?.days) && activeFolder.days.length > 0 && (
                                            <span className="banner-days">
                                                {orderedDays(activeFolder.days).map(d => {
                                                    const idx = dayIndexOf(d);
                                                    return <span key={d} className="days-chip">{idx >= 0 && <b>D{idx + 1}</b>}{d}</span>;
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <button
                                            className="back-to-db-btn"
                                            onClick={switchToApiMode}
                                            title="Switch to Global Database"
                                            style={{
                                                color: '#ffffff',
                                                background: 'rgba(99, 102, 241, 0.2)',
                                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                                padding: '6px 16px',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                fontSize: '0.82rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <i className="pi pi-globe" style={{ color: '#a5b4fc' }}></i> Back to Global Database
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mode-banner-left">
                                        <i className="pi pi-globe" style={{ color: '#6366f1' }}></i>
                                        <span>Universal Database — Viewing <b style={{ color: '#ffffff' }}>Global Data</b></span>
                                        <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                            — {users.length} total user{users.length === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div ref={tableContainerRef} style={{ position: 'relative' }}>
                            {showFolderDropdown && createPortal(
                                <>
                                    <div className="folder-dropdown-overlay" onClick={() => setShowFolderDropdown(false)}></div>
                                    <div className="folder-dropdown" ref={dropdownRef} style={ddStyle}>
                                        <div className="folder-dropdown-head">
                                            <span className="folder-dropdown-title">Event Folders</span>
                                            <button
                                                type="button"
                                                className="event-dates-btn"
                                                onClick={(e) => { e.stopPropagation(); setDatesDraft(eventDates.map(String)); setShowDatesDialog(true); }}
                                                title="Edit event dates"
                                            >
                                                <i className="pi pi-calendar"></i> Dates
                                            </button>
                                        </div>
                                        <div className="paper-cards-row">
                                            <div className="paper-card paper-card-new" onClick={startNewFolder} title="New Folder">
                                                <div className="paper-card-inner" style={{ animationDelay: '0.08s' }}>
                                                    <span className="paper-card-new-plus">+</span>
                                                    <span className="paper-card-new-label">New</span>
                                                </div>
                                            </div>
                                            {sortedFolders.map((f, index) => (
                                                <div
                                                    key={f.id}
                                                    className={`paper-card${activeFolder?.id === f.id ? ' paper-card-active' : ''}`}
                                                    onClick={() => selectFolder(f)}
                                                >
                                                    <div className="paper-card-inner" style={{ animationDelay: `${0.16 + index * 0.08}s` }}>
                                                        <span className="paper-card-num">{index + 1}</span>
                                                        <span className="paper-card-name">{f.name}</span>
                                                        {Array.isArray(f.days) && f.days.length > 0 && (
                                                            <span className="paper-card-days">
                                                                {orderedDays(f.days).join(' · ')}
                                                            </span>
                                                        )}
                                                        <span className="paper-card-print" onClick={(e) => handleFolderPrint(e, f)} title={`Print ${f.name} QRs`}>
                                                            <i className="pi pi-print" style={{ fontSize: 9 }}></i>
                                                        </span>
                                                        <span className="paper-card-delete" onClick={(e) => handleFolderDelete(e, f)}>
                                                            <i className="pi pi-times" style={{ fontSize: 9 }}></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {folders.length === 0 && (
                                            <div className="folder-dropdown-empty">
                                                No folders yet. Press <b>+</b> to start a new folder.
                                            </div>
                                        )}
                                    </div>
                                </>,
                                document.body
                            )}
                            <DataTable value={displayData} header={header} globalFilter={globalFilter} paginator rows={10}
                                paginatorTemplate={paginatorTemplate}
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
                                className="p-datatable-users"
                                emptyMessage="No users found."
                                loading={loading}
                                selection={selectedUsers}
                                onSelectionChange={(e) => {
                                    setSelectedUsers(e.value);
                                    if (e.value.length === 0) {
                                        setShowSelection(false);
                                    }
                                }}
                                selectionMode={showSelection ? "multiple" : null}
                                onRowClick={(e) => {
                                    if (!showSelection) {
                                        setShowSelection(true);
                                        setSelectedUsers([e.data]);
                                    }
                                }}
                                dataKey="id">
                                {showSelection ? (
                                    <Column key="col-select" columnKey="col-select" selectionMode="multiple" headerStyle={{ width: '3.5rem' }} style={{ width: '3.5rem' }} />
                                ) : null}
                                <Column key="col-id" columnKey="col-id" header="ID" body={(rowData, options) => options.rowIndex + 1} align="center" style={{ width: showSelection ? '4%' : '5%' }}></Column>
                                <Column key="col-name" columnKey="col-name" field="name" header="Name" align="left" style={{ width: showSelection ? '18%' : '20%' }} className="pl-6"></Column>
                                <Column key="col-phone" columnKey="col-phone" field="phone" header="Mobile Number" align="left" style={{ width: showSelection ? '14%' : '15%' }} className="pl-6"></Column>
                                <Column key="col-city" columnKey="col-city" field="city" header="City" align="left" style={{ width: showSelection ? '12%' : '13%' }} className="pl-6" body={(rowData) => rowData.city || rowData.address?.city || 'N/A'}></Column>
                                <Column key="col-days" columnKey="col-days" field="days" header="Days" body={daysBodyTemplate} align="center" style={{ width: showSelection ? '14%' : '15%' }}></Column>
                                <Column key="col-actions" columnKey="col-actions" header="Actions" body={actionBodyTemplate} exportable={false} align="right" alignHeader="center" style={{ width: showSelection ? '32%' : '32%' }}></Column>
                            </DataTable>
                        </div>
                    </>
                ) : activeTab === 'analytics' ? (
                    <ScanAnalytics />
                ) : (
                    <Admins showError={showError} showSuccess={showSuccess} />
                )}
            </div>

            <PrintQROptions
                visible={printDialogVisible}
                onHide={(action) => {
                    setPrintFolder(null);
                    setPrintDialogVisible(false);
                    setReprintItems([]);
                    if (action === true || action === 'selected' || action === 'all' || action === 'committee') {
                        setShowSelection(false);
                        setSelectedUsers([]);
                    }
                }}
                currentItem={printCurrentItem}
                selectedItems={reprintItems.length > 0 ? reprintItems : (showSelection ? selectedUsers : [])}
                type="U"
                fetchAllUrl="/users"
                allItems={printFolder ? folderMembers(printFolder) : (isFolderView ? displayData : undefined)}
                committeeItems={isFolderView && activeFolder ? displayData : []}
                committeeDisabled={!isFolderView}
                eventDates={eventDates}
            />

            {folderMissing && (
                <div className="type-picker-overlay" onClick={cancelFolderMissing}>
                    <div className="type-picker-dialog" onClick={e => e.stopPropagation()}>
                        <div className="type-picker-icon">
                            <i className="pi pi-folder-plus"></i>
                        </div>
                        <h4>Create "{typeLabel(folderMissing.length)}" Folder?</h4>
                        <p className="type-picker-sub">No folder exists for {typeLabel(folderMissing.length)} yet. Create it now so this person appears in it?</p>
                        <div className="type-picker-actions">
                            <button className="type-picker-cancel" onClick={cancelFolderMissing}>No, Cancel</button>
                            <button className="type-picker-create" disabled={creatingFolder} onClick={confirmFolderMissing}>
                                {creatingFolder ? 'Creating...' : 'Yes, Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showChangeDays && (
                <div className="type-picker-overlay" onClick={() => setShowChangeDays(false)}>
                    <div className="type-picker-dialog" onClick={e => e.stopPropagation()}>
                        <div className="type-picker-icon">
                            <i className="pi pi-calendar"></i>
                        </div>
                        <h4>Change Days</h4>
                        <p className="type-picker-sub">Apply new days to {selectedUsers.length} selected user{selectedUsers.length === 1 ? '' : 's'}. They will move to the matching folder automatically.</p>
                        <div className="type-picker-chip-row">
                            {eventDates.map((d, i) => (
                                <button
                                    key={`${d}-${i}`}
                                    type="button"
                                    className={`user-day-chip${changeDaysDraft.includes(d) ? ' user-day-chip-active' : ''}`}
                                    onClick={() => setChangeDaysDraft(prev => prev.includes(d) ? prev.filter(x => x !== d) : (prev.length >= 4 ? prev : [...prev, d]))}
                                >
                                    <b>D{i + 1}</b>{d}
                                </button>
                            ))}
                        </div>
                        <div className="type-picker-actions">
                            <button className="type-picker-cancel" onClick={() => setShowChangeDays(false)}>Cancel</button>
                            <button className="type-picker-create" disabled={changeDaysDraft.length === 0} onClick={applyChangeDays}>
                                Apply to {selectedUsers.length} User{selectedUsers.length === 1 ? '' : 's'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reprintItems.length > 0 && !printDialogVisible && (
                <div className="type-picker-overlay" onClick={() => setReprintItems([])}>
                    <div className="type-picker-dialog" onClick={e => e.stopPropagation()}>
                        <div className="type-picker-icon">
                            <i className="pi pi-print"></i>
                        </div>
                        <h4>QR Codes Changed</h4>
                        <p className="type-picker-sub">Day changes updated {reprintItems.length} user{reprintItems.length === 1 ? '' : 's'}. Their old QR codes no longer match — print new ones?</p>
                        <div className="type-picker-actions">
                            <button className="type-picker-cancel" onClick={() => setReprintItems([])}>Later</button>
                            <button className="type-picker-create" onClick={() => { setPrintCurrentItem(null); setPrintFolder(null); setPrintDialogVisible(true); }}>
                                Print New QR{reprintItems.length === 1 ? '' : 's'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTypePicker && (
                <div className="type-picker-overlay" onClick={closeTypePicker}>
                    <div className="type-picker-dialog" onClick={e => e.stopPropagation()}>
                        <div className="type-picker-icon">
                            <i className="pi pi-folder-plus"></i>
                        </div>
                        <h4>New Folder</h4>
                        <p className="type-picker-sub">Pick a day-count preset, or choose Custom to set your own dates and name.</p>
                        <div className="type-picker-grid">
                            {[4, 3, 2, 1].map(n => {
                                const used = usedTypes.has(n);
                                return (
                                    <button
                                        key={n}
                                        type="button"
                                        className={`type-card${!pickerCustom && pickerCount === n ? ' type-card-active' : ''}${used ? ' type-card-used' : ''}`}
                                        disabled={used}
                                        onClick={() => selectPickerType(n)}
                                    >
                                        <span className="type-card-count">{n}</span>
                                        <span className="type-card-label">{typeLabel(n)}</span>
                                        {used && <span className="type-card-used-tag">In use</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            className={`type-card type-card-custom${pickerCustom ? ' type-card-active' : ''}`}
                            disabled={usedTypes.size >= 4}
                            onClick={selectPickerCustom}
                        >
                            <span className="type-card-label">Custom</span>
                            <span className="type-card-custom-hint">Your own dates + name</span>
                        </button>
                        {(pickerCustom || pickerCount > 0) && (
                            <div className="type-picker-chips">
                                {pickerCustom && (
                                    <input
                                        type="text"
                                        className="type-picker-name"
                                        placeholder="Folder name..."
                                        value={pickerName}
                                        onChange={e => setPickerName(e.target.value)}
                                    />
                                )}
                                <div className="type-picker-chips-label">
                                    {pickerCustom
                                        ? `Tick the dates for this folder — ${pickerDays.length} selected${usedTypes.has(pickerDays.length) ? ' (that day-count already has a folder)' : ''}`
                                        : (pickerCount === 4
                                            ? 'All dates selected'
                                            : `Select exactly ${pickerCount} date${pickerCount > 1 ? 's' : ''} — ${pickerDays.length}/${pickerCount}`)}
                                </div>
                                <div className="type-picker-chip-row">
                                    {eventDates.map((d, i) => {
                                        const selected = pickerDays.includes(d);
                                        const locked = !pickerCustom && pickerCount === 4;
                                        return (
                                            <button
                                                key={`${d}-${i}`}
                                                type="button"
                                                className={`date-chip${selected ? ' date-chip-active' : ''}${locked ? ' date-chip-locked' : ''}`}
                                                disabled={locked}
                                                onClick={() => togglePickerDay(d)}
                                            >
                                                <b>D{i + 1}</b>{d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="type-picker-actions">
                            <button className="type-picker-cancel" onClick={closeTypePicker}>Cancel</button>
                            <button
                                className="type-picker-create"
                                disabled={pickerInvalid || creatingFolder}
                                onClick={handlePickerCreate}
                            >
                                {creatingFolder ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDatesDialog && (
                <div className="type-picker-overlay" onClick={() => setShowDatesDialog(false)}>
                    <div className="type-picker-dialog" onClick={e => e.stopPropagation()}>
                        <div className="type-picker-icon">
                            <i className="pi pi-calendar"></i>
                        </div>
                        <h4>Event Dates</h4>
                        <p className="type-picker-sub">Set the 4 event days (day of month). Day 1–4 labels follow this order.</p>
                        <div className="dates-input-row">
                            {datesDraft.map((v, i) => (
                                <label key={i} className="dates-input-item">
                                    <span>Day {i + 1}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={v}
                                        onChange={e => setDatesDraft(prev => prev.map((x, j) => (j === i ? e.target.value : x)))}
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="type-picker-actions">
                            <button className="type-picker-cancel" onClick={() => setShowDatesDialog(false)}>Cancel</button>
                            <button className="type-picker-create" onClick={handleDatesSave}>Save Dates</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
