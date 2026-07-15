import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import './Users.css';

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
    useEffect(() => { showSelectionRef.current = showSelection; }, [showSelection]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setActiveTab('users');
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!showSelectionRef.current) return;
            if (tableContainerRef.current && !tableContainerRef.current.contains(e.target)) {
                setShowSelection(false);
                setSelectedUsers([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            const _users = [...users];
            _users[index] = updatedUser;
            setUsers(_users);
            localStorage.setItem('users_cache', JSON.stringify(_users));
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

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="action-buttons">
                <ViewUser rowData={rowData} />
                <EditUser rowData={rowData} onUserUpdated={handleUserUpdated} showError={showError} showSuccess={showSuccess} />
                <GenerateQR rowData={rowData} onPrintClick={(item) => { setPrintCurrentItem(item); setPrintDialogVisible(true); }} />
                <DeleteUser rowData={rowData} onUserDeleted={handleUserDeleted} showError={showError} showSuccess={showSuccess} />
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
                <Button icon="pi pi-print" className="p-button-rounded p-button-text p-button-sm" onClick={() => { setPrintCurrentItem(null); setPrintDialogVisible(true); }} title="Print QR" />
                <ImportExcel onImported={handleImported} showError={showError} showSuccess={showSuccess} />
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
                    <div className="tabs-container d-flex gap-3 mb-4 justify-content-center">
                        <button 
                            type="button" 
                            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <i className="pi pi-users me-2"></i> User Database
                        </button>
                        <button 
                            type="button" 
                            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            <i className="pi pi-chart-bar me-2"></i> Scan Analytics
                        </button>
                        <button 
                            type="button" 
                            className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
                            onClick={() => setActiveTab('admins')}
                        >
                            <i className="pi pi-shield me-2"></i> Admin Panel
                        </button>
                    </div>
                )}

                {activeTab === 'users' ? (
                    <>
                        <AddUser inline={true} onUserAdded={handleUserAdded} showError={showError} showSuccess={showSuccess} />

                        <div ref={tableContainerRef}><DataTable value={users} header={header} globalFilter={globalFilter} paginator rows={10}
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
                        </DataTable></div>
                    </>
                ) : activeTab === 'analytics' ? (
                    <ScanAnalytics />
                ) : (
                    <Admins showError={showError} showSuccess={showSuccess} />
                )}
            </div>

            <PrintQROptions
                visible={printDialogVisible}
                onHide={(clearSelection) => {
                    setPrintDialogVisible(false);
                    if (clearSelection) { setShowSelection(false); setSelectedUsers([]); }
                }}
                currentItem={printCurrentItem}
                selectedItems={showSelection ? selectedUsers : []}
                type="U"
                fetchAllUrl="/users"
            />
        </div>
    );
}

export default Users;
