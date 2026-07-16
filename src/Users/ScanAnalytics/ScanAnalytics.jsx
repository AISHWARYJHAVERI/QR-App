import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import './ScanAnalytics.css';

function ScanAnalytics() {
    const [scans, setScans] = useState([]);
    const [stats, setStats] = useState({ total: 0, bySlot: {}, uniqueQRs: 0 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [analyticsRes, scansRes] = await Promise.all([
                axios.get('/api/scans/analytics'),
                axios.get('/api/scans?limit=100'),
            ]);
            console.log('Analytics API:', analyticsRes.data);
            console.log('Scans API:', scansRes.data);
            setStats(analyticsRes.data);
            setScans(scansRes.data.scans || []);
        } catch (err) {
            console.error('Scan analytics fetch error:', err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load scan analytics', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const displayName = (qrValue) => {
        try {
            const d = JSON.parse(qrValue);
            return d.name || qrValue;
        } catch {
            return qrValue;
        }
    };

    const displayMobile = (qrValue) => {
        try {
            const d = JSON.parse(qrValue);
            return d.phone || d.mobile || '';
        } catch {
            return '';
        }
    };

    const slotIcons = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };

    const slotBodyTemplate = (rowData) => (
        <span>{slotIcons[rowData.timeSlot] || ''} {rowData.timeSlot}</span>
    );

    const qrValueBodyTemplate = (rowData) => displayName(rowData.qrValue);

    const mobileBodyTemplate = (rowData) => displayMobile(rowData.qrValue);

    const header = (
        <div className="table-header">
            <h4 className="m-0 text-primary gradient-heading gradient-text">Scan Analytics</h4>
            <div className="header-actions">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="p-inputtext-sm" />
                </span>
            </div>
        </div>
    );

    return (
        <div className="scan-analytics-container">
            <Toast ref={toast} />
            <div className="stats-grid mb-4">
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.total}</div>
                    <div className="stat-label">Total Scans</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.uniqueQRs}</div>
                    <div className="stat-label">Unique QRs</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--orange)' }}>{(stats.bySlot && stats.bySlot.morning) || 0}</div>
                    <div className="stat-label">🌅 Morning</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--yellow)' }}>{(stats.bySlot && stats.bySlot.afternoon) || 0}</div>
                    <div className="stat-label">☀️ Afternoon</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--purple)' }}>{(stats.bySlot && stats.bySlot.evening) || 0}</div>
                    <div className="stat-label">🌆 Evening</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--cyan)' }}>{(stats.bySlot && stats.bySlot.night) || 0}</div>
                    <div className="stat-label">🌙 Night</div>
                </div>
            </div>

            <DataTable value={scans} header={header} globalFilter={globalFilter} paginator rows={10}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} scans"
                className="p-datatable-scans"
                emptyMessage="No scans found."
                loading={loading}>
                <Column header="#" body={(_, options) => options.rowIndex + 1} align="center" style={{ width: '5%' }}></Column>
                <Column field="qrValue" header="Name" body={qrValueBodyTemplate} align="left" style={{ width: '20%' }}></Column>
                <Column header="Mobile" body={mobileBodyTemplate} align="left" style={{ width: '18%' }}></Column>
                <Column field="timeSlot" header="Time Slot" body={slotBodyTemplate} align="center" style={{ width: '15%' }}></Column>
                <Column field="scannedAt" header="Scanned At" align="center" style={{ width: '20%' }} body={(rowData) => new Date(rowData.scannedAt).toLocaleString()}></Column>
                <Column field="scannedBy" header="Scanned By" align="center" style={{ width: '22%' }}></Column>
            </DataTable>
        </div>
    );
}

export default ScanAnalytics;
