import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import axios from 'axios';
import './Admins.css';
import EditAdmin from './EditAdmin/EditAdmin';
import DeleteAdmin from './DeleteAdmin/DeleteAdmin';
import GenerateQR from './GenerateQR/GenerateQR';

const ROLES = [
  'President', 'Vice President', 'Secretary', 'Joint Secretary',
  'Treasurer', 'Joint Treasurer', 'Committee Member',
  'Project Convener', 'Project Co-convener'
];

function Admins({ showError, showSuccess }) {
    const [admins, setAdmins] = useState([]);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('President');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [qrDialog, setQrDialog] = useState(false);
    const [qrAdmin, setQrAdmin] = useState(null);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setFetching(true);
        try {
            const response = await axios.get('/admins');
            setAdmins(response.data);
        } catch (error) {
            console.error("Error fetching admins: ", error);
            showError("Could not load admins. Server is starting up — please wait a moment and refresh.");
        } finally {
            setFetching(false);
        }
    };

    const handleSaveAdmin = async (e) => {
        e.preventDefault();
        
        if (!name || !username || !password || !phone || !city) {
            showError("Please fill out all fields");
            return;
        }

        const exists = admins.some(a => a.username.toLowerCase() === username.toLowerCase());
        if (exists) {
            showError("Username already exists");
            return;
        }

        setSaving(true);
        try {
            const newAdmin = { name, username, password, role, phone, city };
            const response = await axios.post('/admins', newAdmin);
            showSuccess("New Administrator registered successfully!");
            
            const saved = response.data;
            
            setName('');
            setUsername('');
            setPassword('');
            setRole('President');
            setPhone('');
            setCity('');
            
            setAdmins([...admins, saved]);
            
            setQrAdmin(saved);
            setQrDialog(true);
        } catch (error) {
            console.error("Error creating admin: ", error);
            showError("Failed to register new administrator");
        } finally {
            setSaving(false);
        }
    };

    const handleAdminUpdated = (updatedAdmin) => {
        const index = admins.findIndex(a => a.id === updatedAdmin.id);
        if (index !== -1) {
            const _admins = [...admins];
            _admins[index] = updatedAdmin;
            setAdmins(_admins);
        }
    };

    const handleAdminDeleted = (deletedAdminId) => {
        setAdmins(admins.filter(a => a.id !== deletedAdminId));
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="action-buttons">
                <EditAdmin rowData={rowData} onAdminUpdated={handleAdminUpdated} showError={showError} showSuccess={showSuccess} />
                <GenerateQR rowData={rowData} />
                <DeleteAdmin rowData={rowData} onAdminDeleted={handleAdminDeleted} showError={showError} showSuccess={showSuccess} />
            </div>
        );
    };

    const qrData = qrAdmin ? `Name: ${qrAdmin.name}\nRole: ${qrAdmin.role}\nPhone: ${qrAdmin.phone}` : '';
    const qrImageUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=050816&bgcolor=ffffff` : '';

    const qrDialogFooter = (
        <div className="dialog-footer mt-4">
            <Button label="Close" icon="pi pi-times" onClick={() => setQrDialog(false)} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} />
        </div>
    );

    return (
        <div className="admins-section mt-4">
            {/* Create Admin Form */}
            <div className="add-user-card p-4 mb-4 shadow-sm">
                <h3 className="section-title mb-4">Create Admin Panel</h3>
                <form onSubmit={handleSaveAdmin}>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label text-slate-300">Full Name</label>
                            <InputText 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Enter full name" 
                                className="w-full p-inputtext-sm"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label text-slate-300">Username</label>
                            <InputText 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                placeholder="Enter login username" 
                                className="w-full p-inputtext-sm"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label text-slate-300">Password</label>
                            <InputText 
                                type="password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Enter secret password" 
                                className="w-full p-inputtext-sm"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label text-slate-300">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="admin-role-select w-full"
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label text-slate-300">Mobile Number</label>
                            <InputText 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                placeholder="Enter phone number" 
                                className="w-full p-inputtext-sm"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label text-slate-300">City</label>
                            <InputText 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)} 
                                placeholder="Enter city name" 
                                className="w-full p-inputtext-sm"
                            />
                        </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button 
                            type="submit" 
                            className="btn-action-add"
                            disabled={saving || !name || !username || !password || !phone || !city}
                        >
                            {saving ? 'Saving...' : 'Save Admin'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Admins Table */}
            <DataTable value={admins} className="p-datatable-users shadow-sm" responsiveLayout="stack" breakpoint="768px" emptyMessage="No admins registered yet." loading={fetching}>
                <Column field="id" header="ID" align="center" style={{ width: '6%' }}></Column>
                <Column field="name" header="Name" align="left" style={{ width: '16%' }} className="pl-6"></Column>
                <Column field="username" header="Username" align="left" style={{ width: '14%' }} className="pl-6"></Column>
                <Column field="role" header="Role" align="left" style={{ width: '14%' }} className="pl-6"></Column>
                <Column field="phone" header="Mobile Number" align="left" style={{ width: '14%' }} className="pl-6"></Column>
                <Column field="city" header="City" align="left" style={{ width: '12%' }} className="pl-6"></Column>
                <Column body={actionBodyTemplate} header="Actions" align="center" style={{ width: '30%' }}></Column>
            </DataTable>

            {/* Auto QR Dialog after create */}
            <Dialog visible={qrDialog} style={{ width: '400px' }} header={<div className="p-dialog-title gradient-text">Generated QR Code</div>} modal className="p-fluid" footer={qrDialogFooter} onHide={() => setQrDialog(false)} closeIcon={<span className="pi pi-times"></span>} draggable={false} resizable={false}>
                {qrAdmin && (
                    <div className="d-flex flex-column align-items-center text-center" style={{ gap: '1.5rem', padding: '1rem 0' }}>
                        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <img src={qrImageUrl} alt={`QR Code for ${qrAdmin.name}`} style={{ width: '220px', height: '220px', display: 'block' }} />
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{qrAdmin.name}</h4>
                            <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', margin: '0.15rem 0' }}>{qrAdmin.role}</p>
                            <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500', margin: 0 }}>{qrAdmin.phone}</p>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}

export default Admins;
