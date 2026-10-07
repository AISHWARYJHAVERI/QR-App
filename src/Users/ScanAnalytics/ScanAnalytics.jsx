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

function dayCheckBodyTemplate(rowData) {
    const s = rowData.dayStatus || 'none';
    if (s === 'allowed') return <span className="day-check-ok">✅ Allowed</span>;
    if (s === 'wrong') return <span className="day-check-bad">❌ Wrong Day</span>;
    return <span className="day-check-none">—</span>;
}

function indexBodyTemplate(_, options) {
    return options.rowIndex + 1;
}

function scanKey(s) {
    return s._id || `${s.qrValue}|${s.scannedAt}`;
}

function ScanAnalytics() {
    const [scans, setScans] = useState([]);
    const [stats, setStats] = useState({ total: 0, bySlot: {}, uniqueQRs: 0 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [wrongPopup, setWrongPopup] = useState([]);
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
            const loadedScans = scansRes.data.scans || [];
            setScans(loadedScans);
            localStorage.setItem('scan_stats_cache', JSON.stringify({ data: analyticsRes.data, timestamp: Date.now() }));
            localStorage.setItem('scan_scans_cache', JSON.stringify({ data: scansRes.data.scans, timestamp: Date.now() }));

            const wrong = loadedScans.filter(s => (s.dayStatus || 'none') === 'wrong');
            if (wrong.length > 0) {
                let seen = [];
                try { seen = JSON.parse(localStorage.getItem('scan_seen_wrong') || '[]'); } catch { seen = []; }
                const fresh = wrong.filter(s => !seen.includes(scanKey(s)));
                if (fresh.length > 0) {
                    localStorage.setItem('scan_seen_wrong', JSON.stringify([...seen, ...fresh.map(scanKey)].slice(-500)));
                    setWrongPopup(fresh.slice(0, 10));
                    fresh.slice(0, 3).forEach(s => {
                        toast.current?.show({ severity: 'warn', summary: 'Wrong-Day Scan', detail: `${displayName(s.qrValue)} scanned on a day not allowed for their QR`, life: 5000 });
                    });
                }
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load scan analytics', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const wrongCount = useMemo(() => scans.filter(s => (s.dayStatus || 'none') === 'wrong').length, [scans]);

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
                <div className="stat-card">
                    <div className="stat-value" style={{ color: '#ef4444' }}>{wrongCount}</div>
                    <div className="stat-label">❌ Wrong Day</div>
                </div>
            </div>

            <DataTable value={scans} header={header} globalFilter={globalFilter} paginator rows={10}
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} scans"
                className="p-datatable-scans"
                emptyMessage="No scans found."
                loading={loading}>
                <Column header="#" body={indexBodyTemplate} align="center" style={{ width: '4%' }}></Column>
                <Column header="Name" body={nameBodyTemplate} align="left" style={{ width: '17%' }}></Column>
                <Column header="Mobile" body={mobileBodyTemplate} align="left" style={{ width: '15%' }}></Column>
                <Column header="Day Check" body={dayCheckBodyTemplate} align="center" style={{ width: '13%' }}></Column>
                <Column field="timeSlot" header="Time Slot" body={slotBodyTemplate} align="center" style={{ width: '12%' }}></Column>
                <Column field="scannedAt" header="Scanned At" align="center" style={{ width: '18%' }} body={scannedAtBodyTemplate}></Column>
                <Column field="scannedBy" header="Scanned By" align="center" style={{ width: '21%' }}></Column>
            </DataTable>

            {wrongPopup.length > 0 && (
                <div className="wrong-day-overlay" onClick={() => setWrongPopup([])}>
                    <div className="wrong-day-dialog" onClick={e => e.stopPropagation()}>
                        <div className="wrong-day-icon">
                            <i className="pi pi-exclamation-triangle"></i>
                        </div>
                        <h4>Wrong-Day Scan Detected</h4>
                        <p>
                            {wrongPopup.length} new scan{wrongPopup.length > 1 ? 's' : ''} outside the allowed day{wrongPopup.length > 1 ? 's' : ''}:
                        </p>
                        <ul className="wrong-day-list">
                            {wrongPopup.map((s, i) => (
                                <li key={scanKey(s) || i}>
                                    <strong>{displayName(s.qrValue)}</strong>
                                    <span>{new Date(s.scannedAt).toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="wrong-day-dismiss" onClick={() => setWrongPopup([])}>Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScanAnalytics;
