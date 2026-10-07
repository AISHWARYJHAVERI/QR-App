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
    const newFolderToastRef = useRef(null);
    const newFolderInfoRef = useRef(null);
    const [ddStyle, setDdStyle] = useState({});

    useEffect(() => { showSelectionRef.current = showSelection; }, [showSelection]);

    const [mode, setMode] = useState('api');
    const [activeFolder, setActiveFolder] = useState(null);
    const [folders, setFolders] = useState([]);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const [unsaved, setUnsaved] = useState(false);

    const displayData = useMemo(() => {
        if (mode === 'api') return users;
        if (activeFolder) return activeFolder.entries;
        return [];
    }, [mode, users, activeFolder]);

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [saveSource, setSaveSource] = useState('folder');
    const [saveFolderName, setSaveFolderName] = useState('');
    const [saving, setSaving] = useState(false);

    const [unsavedAction, setUnsavedAction] = useState(null);
    const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [showNewFolderConfirm, setShowNewFolderConfirm] = useState(false);
    const [showNewFolderInfo, setShowNewFolderInfo] = useState(false);

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

    const folderTypeCount = (f) => {
        if (Array.isArray(f?.days) && f.days.length > 0) return f.days.length;
        return parseInt(f?.name, 10) || 0;
    };
    const typeLabel = (n) => (n === 1 ? '1 day' : `${n} days`);
    const usedTypes = useMemo(() => new Set(folders.map(folderTypeCount).filter(n => n >= 1 && n <= 4)), [folders]);
    const sortedFolders = useMemo(() => [...folders].sort((a, b) => folderTypeCount(b) - folderTypeCount(a)), [folders]);
    const dayIndexOf = (d) => eventDates.indexOf(d);
    const orderedDays = (days) => [...days].sort((a, b) => dayIndexOf(a) - dayIndexOf(b));

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
                !folderTriggerRef.current?.contains(e.target) &&
                !newFolderToastRef.current?.contains(e.target) &&
                !newFolderInfoRef.current?.contains(e.target)) {
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
        requestAnimationFrame(() => {            const t = folderTriggerRef.current?.getBoundingClientRect();
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
                                setMode('folder');
                            }
                        }).catch(() => {
                            localStorage.removeItem('committee_active_session');
                        });
                    } else {
                        setActiveFolder(null);
                        setMode('folder');
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
        if (mode === 'folder') {
            const id = `fl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            const days = Array.isArray(newUser.days) && newUser.days.length > 0
                ? newUser.days
                : (activeFolder?.days || []);
            const entry = { ...newUser, id, days };
            const newEntries = [...(activeFolder?.entries || []), entry];
            setActiveFolder(prev => ({ ...prev, entries: newEntries }));
            setUnsaved(true);
        } else {
            const updated = [...users, newUser];
            setUsers(updated);
            localStorage.setItem('users_cache', JSON.stringify(updated));
        }
    };

    const handleUserUpdated = (updatedUser) => {
        if (mode === 'folder') {
            const newEntries = (activeFolder?.entries || []).map(u =>
                u.id === updatedUser.id ? { ...updatedUser } : u
            );
            setActiveFolder(prev => ({ ...prev, entries: newEntries }));
            setUnsaved(true);
        } else {
            const index = users.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
                const _users = [...users];
                _users[index] = updatedUser;
                setUsers(_users);
                localStorage.setItem('users_cache', JSON.stringify(_users));
            }
        }
    };

    const handleUserDeleted = (deletedUserId) => {
        if (mode === 'folder') {
            const newEntries = (activeFolder?.entries || []).filter(u => u.id !== deletedUserId);
            setActiveFolder(prev => ({ ...prev, entries: newEntries }));
            setUnsaved(true);
        } else {
            const updated = users.filter(u => u.id !== deletedUserId);
            setUsers(updated);
            localStorage.setItem('users_cache', JSON.stringify(updated));
        }
    };

    const handleImported = () => {
        fetchUsers();
    };

    const handleFolderImport = (importedData, failedCount) => {
        const newEntries = importedData.map(item => ({
            ...item,
            id: `fl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
            days: Array.isArray(item.days) && item.days.length ? item.days : (activeFolder?.days || [])
        }));
        const allEntries = [...(activeFolder?.entries || []), ...newEntries];
        setActiveFolder(prev => ({ ...prev, entries: allEntries }));
        setUnsaved(true);
        if (newEntries.length > 0) {
            showSuccess('Imported ' + newEntries.length + ' user' + (newEntries.length > 1 ? 's' : '') + ' successfully.' + (failedCount > 0 ? ' ' + failedCount + ' row' + (failedCount > 1 ? 's' : '') + ' skipped.' : ''));
        } else {
            showError('No records could be imported.');
        }
    };

    const handleRouteImport = async (groups, skipped) => {
        if (!groups || groups.length === 0) {
            const reasons = (skipped || []).slice(0, 5).map(s => `${s.name || 'Unnamed'}: ${s.reason}`).join('; ');
            showError('No rows could be routed.' + (reasons ? ` Skipped — ${reasons}` : '') + ((skipped || []).length > 5 ? ` (+${skipped.length - 5} more)` : ''));
            return;
        }
        let routed = 0;
        const newId = () => `fl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        try {
            for (const g of groups) {
                const entries = g.entries.map(e => ({ ...e, id: newId() }));
                if (activeFolder && folderTypeCount(activeFolder) === g.count) {
                    if (activeFolder.id) {
                        const merged = [...(activeFolder.entries || []), ...entries];
                        const updated = { ...activeFolder, entries: merged };
                        await axios.put(`/committeesessions/${activeFolder.id}`, updated);
                        setActiveFolder(updated);
                    } else {
                        setActiveFolder(prev => ({ ...prev, entries: [...(prev?.entries || []), ...entries] }));
                        setUnsaved(true);
                    }
                    routed += entries.length;
                    continue;
                }
                const existing = folders.find(f => f.id !== activeFolder?.id && folderTypeCount(f) === g.count);
                if (existing) {
                    const merged = [...(existing.entries || []), ...entries];
                    await axios.put(`/committeesessions/${existing.id}`, { ...existing, entries: merged });
                    routed += entries.length;
                    continue;
                }
                const comboCounts = {};
                entries.forEach(e => {
                    const key = (e.days || []).join(',');
                    comboCounts[key] = (comboCounts[key] || 0) + 1;
                });
                const topKey = Object.keys(comboCounts).sort((a, b) => comboCounts[b] - comboCounts[a])[0];
                const defaultDays = topKey ? topKey.split(',').map(Number) : eventDates.slice(0, g.count);
                const folderName = typeLabel(g.count);
                await axios.post('/committeesessions', { name: folderName, days: defaultDays, entries });
                routed += entries.length;
            }
            await loadFolders();
            const skippedCount = (skipped || []).length;
            showSuccess(`Routed ${routed} user${routed === 1 ? '' : 's'} into ${groups.length} folder${groups.length === 1 ? '' : 's'}.` + (skippedCount > 0 ? ` ${skippedCount} row${skippedCount > 1 ? 's' : ''} skipped.` : ''));
            if (skippedCount > 0) {
                const reasons = skipped.slice(0, 5).map(s => `${s.name || 'Unnamed'}: ${s.reason}`).join('; ');
                showError(`Skipped ${skippedCount} row${skippedCount > 1 ? 's' : ''} — ${reasons}${skippedCount > 5 ? ` (+${skippedCount - 5} more)` : ''}`);
            }
        } catch {
            showError('Error routing imported users to folders.');
        }
    };

    const selectFolder = (folder) => {
        if (unsaved) {
            setUnsavedAction({ type: 'select', folder });
            setShowUnsavedPrompt(true);
            setShowFolderDropdown(false);
            return;
        }
        setActiveFolder(folder);
        setMode('folder');
        setUnsaved(false);
        persistSession('folder', folder);
        setShowFolderDropdown(false);
    };

    const startNewFolder = () => {
        if (mode === 'folder' && activeFolder && !activeFolder.id) {
            setShowNewFolderInfo(true);
            return;
        }
        if (unsaved) {
            setUnsavedAction({ type: 'new' });
            setShowUnsavedPrompt(true);
            setShowFolderDropdown(false);
            return;
        }
        if (displayData.length > 0) {
            setShowNewFolderConfirm(true);
            return;
        }
        openTypePicker();
    };

    const openTypePicker = () => {
        setShowFolderDropdown(false);
        setPickerCount(0);
        setPickerDays([]);
        setShowTypePicker(true);
    };

    const closeTypePicker = () => {
        setShowTypePicker(false);
        setPickerCount(0);
        setPickerDays([]);
    };

    const selectPickerType = (n) => {
        setPickerCount(n);
        setPickerDays(n === 4 ? [...eventDates] : []);
    };

    const togglePickerDay = (d) => {
        setPickerDays(prev => {
            if (prev.includes(d)) return prev.filter(x => x !== d);
            if (prev.length >= pickerCount) {
                showError(`Select exactly ${pickerCount} date${pickerCount > 1 ? 's' : ''}.`);
                return prev;
            }
            return [...prev, d];
        });
    };

    const doStartNewFolder = (preset = null) => {
        setActiveFolder(preset ? { name: preset.name, days: preset.days, entries: [] } : null);
        setMode('folder');
        setUnsaved(false);
        persistSession('folder', null);
        setShowFolderDropdown(false);
        closeTypePicker();
    };

    const handlePickerCreate = () => {
        if (!pickerCount || pickerDays.length !== pickerCount) return;
        doStartNewFolder({
            name: typeLabel(pickerCount),
            days: orderedDays(pickerDays)
        });
    };

    const handleNewFolderConfirm = () => {
        setShowNewFolderConfirm(false);
        openTypePicker();
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

    const handleNewFolderCancel = () => {
        setShowNewFolderConfirm(false);
    };

    const handleNewFolderDismissAll = () => {
        setShowNewFolderConfirm(false);
        setShowFolderDropdown(false);
    };

    const handleNewFolderInfoDismiss = () => {
        setShowNewFolderInfo(false);
    };

    const switchToApiMode = () => {
        if (unsaved) {
            setUnsavedAction({ type: 'api' });
            setShowUnsavedPrompt(true);
            setShowFolderDropdown(false);
            return;
        }
        setMode('api');
        setActiveFolder(null);
        setUnsaved(false);
        persistSession('api', null);
        setShowFolderDropdown(false);
    };

    const handleUnsavedSave = async () => {
        setShowUnsavedPrompt(false);
        const action = unsavedAction;
        setUnsavedAction(null);
        if (!activeFolder?.id) {
            setPendingNavigation(action);
            setSaveFolderName('');
            setShowSaveDialog(true);
            return;
        }
        await saveCurrentFolderAction(activeFolder.name);
        navigateAfter(action);
    };

    const handleUnsavedDiscard = () => {
        setShowUnsavedPrompt(false);
        setUnsaved(false);
        const action = unsavedAction;
        setUnsavedAction(null);
        navigateAfter(action);
    };

    const handleUnsavedCancel = () => {
        setShowUnsavedPrompt(false);
        setUnsavedAction(null);
    };

    const navigateAfter = (action) => {
        if (!action) return;
        if (action.type === 'select') {
            setActiveFolder(action.folder);
            setMode('folder');
            setUnsaved(false);
            persistSession('folder', action.folder);
            setShowFolderDropdown(false);
        } else if (action.type === 'new') {
            setActiveFolder(null);
            setMode('folder');
            setUnsaved(false);
            persistSession('folder', null);
            openTypePicker();
        } else if (action.type === 'api') {
            setMode('api');
            setActiveFolder(null);
            setUnsaved(false);
            persistSession('api', null);
        }
    };

    const handleSaveClick = (source = 'folder') => {
        setSaveSource(source);
        setShowSaveConfirm(true);
    };

    const handleSaveConfirmYes = () => {
        setShowSaveConfirm(false);
        setSaveFolderName(saveSource === 'folder' ? (activeFolder?.name || '') : '');
        setShowSaveDialog(true);
    };

    const handleSaveConfirmNo = () => {
        setShowSaveConfirm(false);
    };

    const saveCurrentFolderAction = async (overrideName) => {
        const name = (overrideName ?? saveFolderName).trim() || activeFolder?.name;
        const entries = activeFolder?.entries || [];
        const days = Array.isArray(activeFolder?.days) ? activeFolder.days : [];
        if (!name) return;
        const typeN = days.length;
        if (typeN >= 1) {
            const dup = folders.find(f => f.id !== activeFolder?.id && folderTypeCount(f) === typeN);
            if (dup) {
                showError(`A "${typeLabel(typeN)}" folder already exists ("${dup.name}"). Delete it first, then save this one.`);
                return;
            }
        }
        setSaving(true);
        try {
            if (activeFolder?.id) {
                const updated = { ...activeFolder, name, days, entries };
                await axios.put(`/committeesessions/${activeFolder.id}`, updated);
                showSuccess('Folder "' + name + '" updated successfully');
            } else {
                const payload = { name, days, entries };
                const res = await axios.post('/committeesessions', payload);
                setActiveFolder(res.data);
                persistSession('folder', res.data);
                showSuccess('Folder "' + name + '" saved successfully');
            }
            setUnsaved(false);
            setActiveFolder(null);
            persistSession('folder', null);
            await loadFolders();
            if (pendingNavigation) {
                const action = pendingNavigation;
                setPendingNavigation(null);
                navigateAfter(action);
            }
        } catch {
            showError('Error saving folder');
        } finally {
            setSaving(false);
            setShowSaveDialog(false);
        }
    };

    const confirmSaveFolder = () => {
        if (!saveFolderName.trim()) return;
        if (saveSource === 'db') {
            saveDatabaseFolder();
        } else {
            saveCurrentFolderAction();
        }
    };

    const saveDatabaseFolder = async () => {
        const name = saveFolderName.trim();
        if (!name) return;
        setSaving(true);
        try {
            await axios.post('/committeesessions', { name, entries: users });
            showSuccess('Folder "' + name + '" saved successfully');
            setShowSaveDialog(false);
            await loadFolders();
        } catch {
            showError('Error saving folder');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDialogCancel = () => {
        setPendingNavigation(null);
        setShowSaveDialog(false);
    };

    const handleFolderDelete = async (e, folder) => {
        e.stopPropagation();
        if (!window.confirm(`Delete folder "${folder.name}" and all its entries?`)) return;
        try {
            await axios.delete(`/committeesessions/${folder.id}`);
            showSuccess('Folder "' + folder.name + '" deleted');
            if (activeFolder?.id === folder.id) {
                setMode('api');
                setActiveFolder(null);
                setUnsaved(false);
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
                <EditUser rowData={rowData} onUserUpdated={handleUserUpdated} showError={showError} showSuccess={showSuccess} localMode={mode === 'folder'} eventDates={eventDates} dayCount={mode === 'folder' ? (activeFolder?.days?.length || 0) : 0} />
                <GenerateQR rowData={rowData} eventDates={eventDates} onPrintClick={(item) => { setPrintCurrentItem(item); setPrintDialogVisible(true); }} />
                <DeleteUser rowData={rowData} onUserDeleted={handleUserDeleted} showError={showError} showSuccess={showSuccess} localMode={mode === 'folder'} />
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
            </div>
            <div className="header-actions">
                <button
                    type="button"
                    className="db-save-btn"
                    onClick={() => handleSaveClick(mode === 'folder' ? 'folder' : 'db')}
                    title={mode === 'folder' ? "Save current folder" : "Save database as folder"}
                    disabled={mode === 'folder' ? (displayData.length === 0 && !unsaved) : (users.length === 0)}
                >
                    <i className="pi pi-save"></i><span className="db-save-label">Save</span>
                </button>
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
                    onImport={mode === 'folder' ? handleFolderImport : undefined}
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
                        <AddUser inline={true} onUserAdded={handleUserAdded} showError={showError} showSuccess={showSuccess} localMode={mode === 'folder'} eventDates={eventDates} defaultDays={activeFolder?.days} />

                        <div className="mode-banner" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                            {mode === 'folder' ? (
                                <>
                                    <div className="mode-banner-left">
                                        <i className="pi pi-folder-open" style={{ color: '#10b981' }}></i>
                                        <span>Local Folder Session — Editing: <b style={{ color: '#ffffff' }}>{activeFolder?.name || 'New Folder'}</b></span>
                                        <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                            — {displayData.length} entr{displayData.length === 1 ? 'y' : 'ies'}
                                        </span>
                                        {Array.isArray(activeFolder?.days) && activeFolder.days.length > 0 && (
                                            <span className="banner-days">
                                                {orderedDays(activeFolder.days).map(d => {
                                                    const idx = dayIndexOf(d);
                                                    return <span key={d} className="days-chip">{idx >= 0 && <b>D{idx + 1}</b>}{d}</span>;
                                                })}
                                            </span>
                                        )}
                                        {unsaved && <span className="mode-banner-unsaved">⚠ Unsaved Changes</span>}
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
                                            <i className="pi pi-globe" style={{ color: '#a5b4fc' }}></i> Go to Global Database
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
                                {showSelection && (
                                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                                )}
                                <Column header="ID" body={(rowData, options) => options.rowIndex + 1} align="center" style={{ width: '5%' }}></Column>
                                <Column field="name" header="Name" align="left" style={{ width: '20%' }} className="pl-6"></Column>
                                <Column field="phone" header="Mobile Number" align="left" style={{ width: '15%' }} className="pl-6"></Column>
                                <Column field="city" header="City" align="left" style={{ width: '13%' }} className="pl-6" body={(rowData) => rowData.city || rowData.address?.city || 'N/A'}></Column>
                                <Column header="Days" body={daysBodyTemplate} align="center" style={{ width: '15%' }}></Column>
                                <Column body={actionBodyTemplate} exportable={false} align="right" alignHeader="center" style={{ width: '32%' }} header="Actions"></Column>
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
                    const wasFolderPrint = !!printFolder;
                    setPrintFolder(null);
                    setPrintDialogVisible(false);
                    if (action === 'all' && mode === 'folder' && !wasFolderPrint) {
                        setActiveFolder(null);
                        setUnsaved(false);
                        persistSession('folder', null);
                    }
                    if (action === true || action === 'selected' || action === 'all' || action === 'committee') {
                        setShowSelection(false);
                        setSelectedUsers([]);
                    }
                }}
                currentItem={printCurrentItem}
                selectedItems={showSelection ? selectedUsers : []}
                type="U"
                fetchAllUrl="/users"
                allItems={printFolder ? printFolder.entries : (mode === 'folder' ? displayData : undefined)}
                committeeItems={mode === 'folder' && activeFolder ? activeFolder.entries : []}
                committeeDisabled={mode !== 'folder' || !activeFolder}
                eventDates={eventDates}
            />

            {showSaveConfirm && (
                <div className="save-confirm-overlay" onClick={handleSaveConfirmNo}>
                    <div className="save-confirm-dialog" onClick={e => e.stopPropagation()}>
                        <div className="save-confirm-icon">
                            <i className="pi pi-save"></i>
                        </div>
                        <h4>Save as a Folder?</h4>
                        <p>{saveSource === 'db' ? 'Save all database users as a new folder?' : 'Save the current entries as a committee folder?'}</p>
                        <div className="save-confirm-actions">
                            <button className="save-confirm-no" onClick={handleSaveConfirmNo}>No</button>
                            <button className="save-confirm-yes" onClick={handleSaveConfirmYes}>Yes</button>
                        </div>
                    </div>
                </div>
            )}

            {showSaveDialog && (
                <div className="folder-save-dialog-overlay" onClick={handleSaveDialogCancel}>
                    <div className="folder-save-dialog" onClick={e => e.stopPropagation()}>
                        <h4>{saveSource === 'db' ? 'Save Database as New Folder' : (activeFolder?.id ? 'Update Folder' : 'Save as New Folder')}</h4>
                        <input
                            type="text"
                            placeholder="Enter folder name..."
                            value={saveFolderName}
                            onChange={e => setSaveFolderName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmSaveFolder(); }}
                            autoFocus
                        />
                        <div className="folder-save-dialog-actions">
                            <button className="folder-save-cancel" onClick={handleSaveDialogCancel}>Cancel</button>
                            <button className="folder-save-confirm" onClick={confirmSaveFolder} disabled={saving || !saveFolderName.trim()}>
                                {saving ? 'Saving...' : activeFolder?.id ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUnsavedPrompt && (
                <div className="unsaved-overlay">
                    <div className="unsaved-dialog">
                        <h4>Unsaved Changes</h4>
                        <p>You have unsaved changes in the current folder. What would you like to do?</p>
                        <div className="unsaved-dialog-actions">
                            <button className="unsaved-cancel" onClick={handleUnsavedCancel}>Cancel</button>
                            <button className="unsaved-discard" onClick={handleUnsavedDiscard}>Discard</button>
                            <button className="unsaved-save" onClick={handleUnsavedSave}>Save First</button>
                        </div>
                    </div>
                </div>
            )}

            {showNewFolderConfirm && (
                <div className="new-folder-toast-wrap" ref={newFolderToastRef} onClick={handleNewFolderDismissAll}>
                    <div className="new-folder-toast" role="alertdialog" aria-label="Confirm new folder" onClick={e => e.stopPropagation()}>
                        <div className="new-folder-toast-icon">
                            <i className="pi pi-exclamation-triangle"></i>
                        </div>
                        <div className="new-folder-toast-body">
                            <strong>Start a new folder?</strong>
                            <p>There is still data in the table. Starting a new folder will clear the current list from view. Are you sure you want to continue?</p>
                            <div className="new-folder-toast-actions">
                                <button className="new-folder-toast-cancel" onClick={handleNewFolderCancel}>Cancel</button>
                                <button className="new-folder-toast-confirm" onClick={handleNewFolderConfirm}>Yes, New Folder</button>
                            </div>
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
                        <p className="type-picker-sub">Pick how many days this folder covers, then tick its dates.</p>
                        <div className="type-picker-grid">
                            {[4, 3, 2, 1].map(n => {
                                const used = usedTypes.has(n);
                                return (
                                    <button
                                        key={n}
                                        type="button"
                                        className={`type-card${pickerCount === n ? ' type-card-active' : ''}${used ? ' type-card-used' : ''}`}
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
                        {pickerCount > 0 ? (
                            <div className="type-picker-chips">
                                <div className="type-picker-chips-label">
                                    {pickerCount === 4
                                        ? 'All dates selected'
                                        : `Select exactly ${pickerCount} date${pickerCount > 1 ? 's' : ''} — ${pickerDays.length}/${pickerCount}`}
                                </div>
                                <div className="type-picker-chip-row">
                                    {eventDates.map((d, i) => {
                                        const selected = pickerDays.includes(d);
                                        const locked = pickerCount === 4;
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
                        ) : (
                            usedTypes.size >= 4 && (
                                <p className="type-picker-all-used">
                                    All 4 day-counts are in use. Delete a folder first to recreate one.
                                </p>
                            )
                        )}
                        <div className="type-picker-actions">
                            <button className="type-picker-cancel" onClick={closeTypePicker}>Cancel</button>
                            <button
                                className="type-picker-create"
                                disabled={!pickerCount || pickerDays.length !== pickerCount}
                                onClick={handlePickerCreate}
                            >
                                Create Folder
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

            {showNewFolderInfo && (
                <div className="new-folder-toast-wrap" ref={newFolderInfoRef} onClick={handleNewFolderInfoDismiss}>
                    <div className="new-folder-toast" role="status" aria-label="Already on new folder" onClick={e => e.stopPropagation()}>
                        <div className="new-folder-toast-icon new-folder-toast-icon-info">
                            <i className="pi pi-info-circle"></i>
                        </div>
                        <div className="new-folder-toast-body">
                            <strong>Already on a new folder</strong>
                            <p>You are already on a new folder. There's nothing new to create — just add your data and save it when you're ready.</p>
                            <div className="new-folder-toast-actions">
                                <button className="new-folder-toast-confirm" onClick={handleNewFolderInfoDismiss}>OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
