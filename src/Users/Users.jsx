import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
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

function Users({ isLoggedIn }) {
    const [users, setUsers] = useState([]);
    const [globalFilter, setGlobalFilter] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setActiveTab('users');
        }
    }, [isLoggedIn]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching data: ", error);
            showError("Could not load users. Server is starting up — please wait a moment and refresh.");
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
        setUsers([...users, newUser]);
    };

    const handleUserUpdated = (updatedUser) => {
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            const _users = [...users];
            _users[index] = updatedUser;
            setUsers(_users);
        }
    };

    const handleUserDeleted = (deletedUserId) => {
        setUsers(users.filter(u => u.id !== deletedUserId));
    };

    const handleImported = () => {
        fetchUsers();
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="action-buttons">
                <ViewUser rowData={rowData} />
                <EditUser rowData={rowData} onUserUpdated={handleUserUpdated} showError={showError} showSuccess={showSuccess} />
                <GenerateQR rowData={rowData} />
                <DeleteUser rowData={rowData} onUserDeleted={handleUserDeleted} showError={showError} showSuccess={showSuccess} />
            </div>
        );
    };

    const header = (
        <div className="table-header">
            <h4 className="m-0 text-primary gradient-heading gradient-text">Manage Users</h4>
            <div className="header-actions">
                <ImportExcel onImported={handleImported} showError={showError} showSuccess={showSuccess} />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="p-inputtext-sm" />
                </span>
            </div>
        </div>
    );

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

                        <DataTable value={users} header={header} globalFilter={globalFilter} paginator rows={10}
                            paginatorTemplate={paginatorTemplate}
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
                            className="p-datatable-users"
                            emptyMessage="No users found."
                            loading={loading}
                            responsiveLayout="stack"
                            breakpoint="768px">
                            <Column field="id" header="ID" align="center" style={{ width: '6%' }}></Column>
                            <Column field="name" header="Name" align="left" style={{ width: '22%' }} className="pl-6"></Column>
                            <Column field="phone" header="Mobile Number" align="left" style={{ width: '18%' }} className="pl-6"></Column>
                            <Column field="city" header="City" align="left" style={{ width: '16%' }} className="pl-6" body={(rowData) => rowData.city || rowData.address?.city || 'N/A'}></Column>
                            <Column body={actionBodyTemplate} exportable={false} align="right" alignHeader="center" style={{ width: '38%' }} header="Actions"></Column>
                        </DataTable>
                    </>
                ) : (
                    <Admins showError={showError} showSuccess={showSuccess} />
                )}
            </div>
        </div>
    );
}

export default Users;
