import { useState, useEffect, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import './ScanAnalytics.css';

const CACHE_TTL = 5 * 60 * 1000;
const slotIcons = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };

function displayName(qrValue) {
    try {
        const d = JSON.parse(qrValue);
        return d.name || qrValue;
    } catch {
        return qrValue;
    }
}

function displayMobile(qrValue) {
    try {
        const d = JSON.parse(qrValue);
        return d.phone || d.mobile || '';
    } catch {
        return '';
    }
}

function slotBodyTemplate(rowData) {
    return <span>{slotIcons[rowData.timeSlot] || ''} {rowData.timeSlot}</span>;
}

function nameBodyTemplate(rowData) {
    return displayName(rowData.qrValue);
}

function mobileBodyTemplate(rowData) {
    return displayMobile(rowData.qrValue);
}

function scannedAtBodyTemplate(rowData) {
    return new Date(rowData.scannedAt).toLocaleString();
}

function indexBodyTemplate(_, options) {
    return options.rowIndex + 1;
}

function ScanAnalytics() {
    const [scans, setScans] = useState([]);
    const [stats, setStats] = useState({ total: 0, bySlot: {}, uniqueQRs: 0 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    useEffect(() => {
        const cachedStats = localStorage.getItem('scan_stats_cache');
        const cachedScans = localStorage.getItem('scan_scans_cache');
        if (cachedStats && cachedScans) {
            try {
                const s = JSON.parse(cachedStats);
                const sc = JSON.parse(cachedScans);
                if (Date.now() - s.timestamp < CACHE_TTL && Date.now() - sc.timestamp < CACHE_TTL) {
                    setStats(s.data);
                    setScans(sc.data);
                    setLoading(false);
                }
            } catch {}
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [analyticsRes, scansRes] = await Promise.all([
                axios.get('/api/scans/analytics?days=90'),
                axios.get('/api/scans?limit=100'),
            ]);
            setStats(analyticsRes.data);
            setScans(scansRes.data.scans || []);
            localStorage.setItem('scan_stats_cache', JSON.stringify({ data: analyticsRes.data, timestamp: Date.now() }));
            localStorage.setItem('scan_scans_cache', JSON.stringify({ data: scansRes.data.scans, timestamp: Date.now() }));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load scan analytics', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const header = useMemo(() => (
        <div className="table-header">
            <h4 className="m-0 text-primary gradient-heading gradient-text">Scan Analytics</h4>
            <div className="header-actions">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="p-inputtext-sm" />
                </span>
            </div>
        </div>
    ), []);

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
                <Column header="#" body={indexBodyTemplate} align="center" style={{ width: '5%' }}></Column>
                <Column header="Name" body={nameBodyTemplate} align="left" style={{ width: '20%' }}></Column>
                <Column header="Mobile" body={mobileBodyTemplate} align="left" style={{ width: '18%' }}></Column>
                <Column field="timeSlot" header="Time Slot" body={slotBodyTemplate} align="center" style={{ width: '15%' }}></Column>
                <Column field="scannedAt" header="Scanned At" align="center" style={{ width: '20%' }} body={scannedAtBodyTemplate}></Column>
                <Column field="scannedBy" header="Scanned By" align="center" style={{ width: '22%' }}></Column>
            </DataTable>
        </div>
    );
}

export default ScanAnalytics;
