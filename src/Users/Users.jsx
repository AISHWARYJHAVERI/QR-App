import { useState, useEffect, useRef, useMemo } from 'react';
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
import ViewUser from './ViewUser/ViewUser';
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
    const toast = useRef(null);
    const tableContainerRef = useRef(null);
    const showSelectionRef = useRef(showSelection);
    const dropdownRef = useRef(null);
    const folderTriggerRef = useRef(null);
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
    const [saveFolderName, setSaveFolderName] = useState('');
    const [saving, setSaving] = useState(false);

    const [unsavedAction, setUnsavedAction] = useState(null);
    const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

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
        if (!showFolderDropdown) { setDdStyle({}); return; }
        requestAnimationFrame(() => {
            const t = folderTriggerRef.current?.getBoundingClientRect();
            const d = dropdownRef.current;
            if (!t || !d) return;
            const dh = d.offsetHeight;
            const dw = Math.min(d.offsetWidth, 560);
            const spaceBelow = window.innerHeight - t.bottom - 16;
            const spaceAbove = t.top - 16;
            let top = spaceBelow >= dh || spaceBelow >= spaceAbove
                ? t.bottom + 8 : t.top - dh - 8;
            let left = t.left + t.width / 2 - dw / 2;
            if (left < 16) left = 16;
            if (left + dw > window.innerWidth - 16) left = window.innerWidth - dw - 16;
            setDdStyle({ position: 'fixed', top: top + 'px', left: left + 'px' });
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
                if (parsed.mode === 'folder' && parsed.activeFolderId) {
                    axios.get(`/committeesessions/${parsed.activeFolderId}`).then(res => {
                        const folder = res.data;
                        if (folder) {
                            setActiveFolder(folder);
                            setMode('folder');
                        }
                    }).catch(() => {
                        localStorage.removeItem('committee_active_session');
                    });
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
            const entry = { ...newUser, id };
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
            id: `fl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
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

    const selectFolder = (folder) => {
        if (unsaved) {
            setUnsavedAction({ type: 'select', folder });
            setShowUnsavedPrompt(true);
            return;
        }
        setActiveFolder(folder);
        setMode('folder');
        setUnsaved(false);
        persistSession('folder', folder);
        setShowFolderDropdown(false);
    };

    const startNewFolder = () => {
        if (unsaved) {
            setUnsavedAction({ type: 'new' });
            setShowUnsavedPrompt(true);
            return;
        }
        setActiveFolder(null);
        setMode('folder');
        setUnsaved(false);
        persistSession('folder', null);
        setShowFolderDropdown(false);
    };

    const switchToApiMode = () => {
        if (unsaved) {
            setUnsavedAction({ type: 'api' });
            setShowUnsavedPrompt(true);
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
        await saveCurrentFolderAction();
        executeUnsavedAction();
    };

    const handleUnsavedDiscard = () => {
        setShowUnsavedPrompt(false);
        setUnsaved(false);
        executeUnsavedAction();
    };

    const handleUnsavedCancel = () => {
        setShowUnsavedPrompt(false);
        setUnsavedAction(null);
    };

    const executeUnsavedAction = () => {
        const action = unsavedAction;
        setUnsavedAction(null);
        if (!action) return;
        if (action.type === 'select') {
            selectFolder(action.folder);
        } else if (action.type === 'new') {
            setActiveFolder(null);
            setMode('folder');
            setUnsaved(false);
            persistSession('folder', null);
            setShowFolderDropdown(false);
        } else if (action.type === 'api') {
            setMode('api');
            setActiveFolder(null);
            setUnsaved(false);
            persistSession('api', null);
        }
    };

    const openSaveDialog = () => {
        setSaveFolderName(activeFolder?.name || '');
        setShowSaveDialog(true);
    };

    const saveCurrentFolderAction = async () => {
        const name = saveFolderName.trim() || activeFolder?.name;
        const entries = activeFolder?.entries || [];
        if (!name) return;
        setSaving(true);
        try {
            if (activeFolder?.id) {
                const updated = { ...activeFolder, name, entries };
                await axios.put(`/committeesessions/${activeFolder.id}`, updated);
                showSuccess('Folder "' + name + '" updated successfully');
            } else {
                const payload = { name, entries };
                const res = await axios.post('/committeesessions', payload);
                setActiveFolder(res.data);
                persistSession('folder', res.data);
                showSuccess('Folder "' + name + '" saved successfully');
            }
            setUnsaved(false);
            setMode('api');
            setActiveFolder(null);
            persistSession('api', null);
            await loadFolders();
        } catch {
            showError('Error saving folder');
        } finally {
            setSaving(false);
            setShowSaveDialog(false);
        }
    };

    const confirmSaveFolder = () => {
        if (!saveFolderName.trim()) return;
        saveCurrentFolderAction();
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

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="action-buttons">
                <ViewUser rowData={rowData} />
                <EditUser rowData={rowData} onUserUpdated={handleUserUpdated} showError={showError} showSuccess={showSuccess} localMode={mode === 'folder'} />
                <GenerateQR rowData={rowData} onPrintClick={(item) => { setPrintCurrentItem(item); setPrintDialogVisible(true); }} />
                <DeleteUser rowData={rowData} onUserDeleted={handleUserDeleted} showError={showError} showSuccess={showSuccess} localMode={mode === 'folder'} />
                <Button icon="pi pi-print" className="p-button-rounded p-button-text p-button-sm print-icon-btn" onClick={() => { setPrintCurrentItem(rowData); setPrintDialogVisible(true); }} title="Print QR" />
            </div>
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
                <div className="folder-trigger-wrapper" ref={folderTriggerRef} onClick={() => setShowFolderDropdown(prev => !prev)}>
                    <Folder color="#6366f1" size={0.72} items={[<i key="1" className="pi pi-users" style={{ fontSize: 11, color: '#333' }}></i>]} />
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
                        {mode === 'folder' && (
                            <div className="mode-banner">
                                <div className="mode-banner-left">
                                    <i className="pi pi-folder-open"></i>
                                    <span>Editing: {activeFolder?.name || 'New Folder'}</span>
                                    <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                        — {displayData.length} entr{displayData.length === 1 ? 'y' : 'ies'}
                                    </span>
                                    {unsaved && <span className="mode-banner-unsaved">⚠ Unsaved</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button className="back-to-db-btn" onClick={switchToApiMode}>
                                        <i className="pi pi-database"></i> Database
                                    </button>
                                </div>
                            </div>
                        )}

                        <AddUser inline={true} onUserAdded={handleUserAdded} showError={showError} showSuccess={showSuccess} localMode={mode === 'folder'} />

                        <div ref={tableContainerRef} style={{ position: 'relative' }}>
                            {showFolderDropdown && (
                                <>
                                    <div className="folder-dropdown-overlay" onClick={() => setShowFolderDropdown(false)}></div>
                                    <div className="folder-dropdown" ref={dropdownRef} style={ddStyle}>
                                        <div className="folder-dropdown-header">
                                            <h4>Committee Folders</h4>
                                            <button className="folder-dropdown-close" onClick={() => setShowFolderDropdown(false)}>
                                                <i className="pi pi-times"></i>
                                            </button>
                                        </div>
                                        {folders.length === 0 ? (
                                            <div className="folder-dropdown-empty">
                                                <i className="pi pi-folder-open"></i>
                                                No folders yet. Add entries and save as a folder.
                                            </div>
                                        ) : (
                                            <div className="paper-cards-row">
                                                {folders.map((f) => (
                                                    <div
                                                        key={f.id}
                                                        className={`paper-card${activeFolder?.id === f.id ? ' paper-card-active' : ''}`}
                                                        onClick={() => selectFolder(f)}
                                                    >
                                                        <span className="paper-card-name">{f.name}</span>
                                                        <span className="paper-card-count">{f.entries?.length || 0} entr{(f.entries?.length || 0) === 1 ? 'y' : 'ies'}</span>
                                                        <span className="paper-card-delete" onClick={(e) => handleFolderDelete(e, f)}>
                                                            <i className="pi pi-times" style={{ fontSize: 8 }}></i>
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="paper-card paper-card-new" onClick={startNewFolder} title="New Folder">
                                                    +
                                                </div>
                                            </div>
                                        )}
                                        <div className="folder-dropdown-footer">
                                            <div></div>
                                            <button
                                                className="folder-save-btn"
                                                onClick={openSaveDialog}
                                                disabled={mode !== 'folder' || displayData.length === 0}
                                            >
                                                <i className="pi pi-save"></i> Save as Folder
                                            </button>
                                        </div>
                                    </div>
                                </>
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
                                <Column header="ID" body={(rowData, options) => options.rowIndex + 1} align="center" style={{ width: '6%' }}></Column>
                                <Column field="name" header="Name" align="left" style={{ width: '22%' }} className="pl-6"></Column>
                                <Column field="phone" header="Mobile Number" align="left" style={{ width: '18%' }} className="pl-6"></Column>
                                <Column field="city" header="City" align="left" style={{ width: '16%' }} className="pl-6" body={(rowData) => rowData.city || rowData.address?.city || 'N/A'}></Column>
                                <Column body={actionBodyTemplate} exportable={false} align="right" alignHeader="center" style={{ width: '38%' }} header="Actions"></Column>
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
                    setPrintDialogVisible(false);
                    if (action === 'all' && mode === 'folder') {
                        setMode('api');
                        setActiveFolder(null);
                        setUnsaved(false);
                        persistSession('api', null);
                    }
                    if (action === true || action === 'selected' || action === 'all') {
                        setShowSelection(false);
                        setSelectedUsers([]);
                    }
                }}
                currentItem={printCurrentItem}
                selectedItems={showSelection ? selectedUsers : []}
                type="U"
                fetchAllUrl="/users"
                allItems={mode === 'folder' ? displayData : undefined}
            />

            {showSaveDialog && (
                <div className="folder-save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
                    <div className="folder-save-dialog" onClick={e => e.stopPropagation()}>
                        <h4>{activeFolder?.id ? 'Update Folder' : 'Save as New Folder'}</h4>
                        <input
                            type="text"
                            placeholder="Enter folder name..."
                            value={saveFolderName}
                            onChange={e => setSaveFolderName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') confirmSaveFolder(); }}
                            autoFocus
                        />
                        <div className="folder-save-dialog-actions">
                            <button className="folder-save-cancel" onClick={() => setShowSaveDialog(false)}>Cancel</button>
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
        </div>
    );
}

export default Users;
