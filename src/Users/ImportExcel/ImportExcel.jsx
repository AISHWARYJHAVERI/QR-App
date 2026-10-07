import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './ImportExcel.css';

const EXPECTED_COLUMNS = ['name', 'full name', 'phone', 'mobile', 'contact', 'city', 'location', 'address'];

const isYes = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v > 0;
  const s = String(v || '').trim().toLowerCase();
  return ['y', 'yes', 'true', '1', 'x', '✓', 'v'].includes(s);
};

const downloadTemplate = (eventDates = [17, 18, 19, 20]) => {
  const wb = XLSX.utils.book_new();
  const row = { Name: 'John Doe', Phone: '9876543210', City: 'Mumbai' };
  eventDates.forEach((d, i) => {
    row[`Day ${i + 1} (${d})`] = i < 2 ? 'yes' : 'no';
  });
  const ws = XLSX.utils.json_to_sheet([row]);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'user_import_template.xlsx');
};

function ImportExcel({ onImported, showError, showSuccess, onImport, onRouteImport, eventDates = [17, 18, 19, 20] }) {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columnMap, setColumnMap] = useState({ name: '', phone: '', city: '', days: ['', '', '', ''] });
  const [availableColumns, setAvailableColumns] = useState([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const detectColumn = (headers) => {
    const map = { name: '', phone: '', city: '', days: ['', '', '', ''] };
    headers.forEach((h) => {
      const lower = h.toLowerCase().trim();
      if (EXPECTED_COLUMNS.includes(lower)) {
        if (['name', 'full name'].includes(lower)) map.name = h;
        else if (['phone', 'mobile', 'contact'].includes(lower)) map.phone = h;
        else if (['city', 'location', 'address'].includes(lower)) map.city = h;
      }
    });
    headers.forEach((h) => {
      const lower = h.toLowerCase().trim().replace(/\s+/g, ' ');
      for (let i = 0; i < 4; i++) {
        if (map.days[i]) continue;
        const dayNum = i + 1;
        const re = new RegExp(`^day\\s*0?${dayNum}\\b`);
        if (re.test(lower) || lower === String(eventDates[i])) {
          map.days[i] = h;
        }
      }
    });
    return map;
  };

  const parseFile = (rawFile) => {
    setFile(rawFile);
    setImporting(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!json || json.length === 0) {
          showError('The file contains no data.');
          setParsedData([]);
          setAvailableColumns([]);
          return;
        }

        const headers = Object.keys(json[0]);
        setAvailableColumns(headers);
        setParsedData(json);

        const detected = detectColumn(headers);
        setColumnMap(detected);
      } catch (err) {
        showError('Failed to parse file. Make sure it is a valid .csv or .xlsx file.');
        setParsedData([]);
        setAvailableColumns([]);
      }
    };
    reader.readAsArrayBuffer(rawFile);
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleImport = async () => {
    const nameCol = columnMap.name;
    const phoneCol = columnMap.phone;
    const cityCol = columnMap.city;

    if (!nameCol) {
      showError('Please map a column for "Name".');
      return;
    }

    const dayCols = Array.isArray(columnMap.days) ? columnMap.days : ['', '', '', ''];
    const mappedDayCols = dayCols.filter(Boolean).length;

    if (onRouteImport && mappedDayCols > 0) {
      const groups = {};
      const skipped = [];
      for (const row of parsedData) {
        const name = String(row[nameCol] || '').trim();
        const phone = String(row[phoneCol] || '').trim();
        const city = String(row[cityCol] || '').trim();
        if (!name) { skipped.push({ name: '', reason: 'missing name' }); continue; }
        const days = [];
        dayCols.forEach((col, i) => {
          if (col && isYes(row[col])) days.push(eventDates[i]);
        });
        if (days.length === 0) { skipped.push({ name, reason: 'no day marked yes' }); continue; }
        const payload = { name, days };
        if (phone) payload.phone = phone;
        if (city) payload.city = city;
        const key = days.length;
        if (!groups[key]) groups[key] = [];
        groups[key].push(payload);
      }
      const groupArr = Object.keys(groups).map(k => ({ count: Number(k), entries: groups[k] }))
        .sort((a, b) => b.count - a.count);
      onRouteImport(groupArr, skipped);
      closeModal();
      return;
    }

    if (onImport) {
      setImporting(false);
      const imported = [];
      let failed = 0;
      for (const row of parsedData) {
        const name = String(row[nameCol] || '').trim();
        const phone = String(row[phoneCol] || '').trim();
        const city = String(row[cityCol] || '').trim();
        if (!name) { failed++; continue; }
        const payload = { name };
        if (phone) payload.phone = phone;
        if (city) payload.city = city;
        imported.push(payload);
      }
      onImport(imported, failed);
      closeModal();
      return;
    }

    setImporting(true);
    let imported = 0;
    let failed = 0;

    for (const row of parsedData) {
      const name = String(row[nameCol] || '').trim();
      const phone = String(row[phoneCol] || '').trim();
      const city = String(row[cityCol] || '').trim();

      if (!name) { failed++; continue; }

      try {
        const payload = { name };
        if (phone) payload.phone = phone;
        if (city) payload.city = city;
        await axios.post('/users', payload);
        imported++;
      } catch {
        failed++;
      }
    }

    setImporting(false);
    if (onImported) onImported();

    if (imported > 0) {
      showSuccess('Imported ' + imported + ' user' + (imported > 1 ? 's' : '') + ' successfully.' + (failed > 0 ? ' ' + failed + ' row' + (failed > 1 ? 's' : '') + ' skipped.' : ''));
    } else {
      showError('No records could be imported. Check your data and column mapping.');
    }

    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setFile(null);
    setParsedData([]);
    setAvailableColumns([]);
    setColumnMap({ name: '', phone: '', city: '', days: ['', '', '', ''] });
    setDragOver(false);
  };

  const handleColumnChange = (field, value) => {
    if (field.startsWith('day')) {
      const idx = parseInt(field.slice(3), 10);
      setColumnMap((prev) => {
        const days = [...(prev.days || ['', '', '', ''])];
        days[idx] = value;
        return { ...prev, days };
      });
      return;
    }
    setColumnMap((prev) => ({ ...prev, [field]: value }));
  };

  const dayColsMapped = (columnMap.days || []).filter(Boolean).length;
  const routingMode = !!onRouteImport && dayColsMapped > 0;

  const buildImportLabel = () => {
    if (routingMode) {
      const dayRows = parsedData.filter(row => {
        const name = String(row[columnMap.name] || '').trim();
        if (!name) return false;
        return         (columnMap.days || []).some((col) => col && isYes(row[col]));
      }).length;
      return `Route ${dayRows} Record${dayRows !== 1 ? 's' : ''} to Folders`;
    }
    return `Import ${parsedData.length} Record${parsedData.length !== 1 ? 's' : ''}`;
  };

  const previewRows = parsedData.slice(0, 3);

  return (
    <>
      <button className="import-btn template-btn" onClick={() => downloadTemplate(eventDates)} title="Download Excel template">
        <i className="pi pi-download mr-2"></i> Download Template
      </button>
      <button className="import-btn" onClick={() => setShowModal(true)} title="Import users from Excel or CSV">
        <i className="pi pi-file-excel mr-2"></i> Import Excel
      </button>

      {showModal && createPortal(
        <div className="import-overlay" onClick={closeModal}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <button className="import-close-btn" onClick={closeModal}>
              <i className="pi pi-times"></i>
            </button>

            <h2 className="import-title animated-gradient">Import Users</h2>
            <p className="import-subtitle">
              Upload a .csv or .xlsx file. Download the template for the correct format.
            </p>

            {!file ? (
              <div
                className={'import-dropzone' + (dragOver ? ' drag-over' : '')}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="pi pi-cloud-upload import-dropzone-icon"></i>
                <p className="import-dropzone-text">
                  Drag & drop your file here, or click to browse
                </p>
                <p className="import-dropzone-hint">Supports .csv and .xlsx files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="import-preview">
                <div className="import-file-info">
                  <i className="pi pi-file"></i>
                  <span className="import-file-name">{file.name}</span>
                  <button className="import-remove-btn" onClick={() => { setFile(null); setParsedData([]); setAvailableColumns([]); }}>
                    <i className="pi pi-times"></i>
                  </button>
                </div>

                <div className="import-column-mapping">
                  <h4>Column Mapping</h4>
                  <p className="import-mapping-hint">
                    Map your file columns to user fields. Rows without a Name will be skipped.
                  </p>
                  <div className="import-mapping-row">
                    <div className="import-mapping-field">
                      <label>Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={columnMap.name} onChange={(e) => handleColumnChange('name', e.target.value)}>
                        <option value="">-- Select column --</option>
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div className="import-mapping-field">
                      <label>Phone</label>
                      <select value={columnMap.phone} onChange={(e) => handleColumnChange('phone', e.target.value)}>
                        <option value="">-- Skip --</option>
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div className="import-mapping-field">
                      <label>City</label>
                      <select value={columnMap.city} onChange={(e) => handleColumnChange('city', e.target.value)}>
                        <option value="">-- Skip --</option>
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="import-mapping-row import-mapping-days">
                    {[0, 1, 2, 3].map(i => (
                      <div className="import-mapping-field" key={i}>
                        <label>Day {i + 1} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({eventDates[i]})</span></label>
                        <select value={(columnMap.days || [])[i] || ''} onChange={(e) => handleColumnChange(`day${i}`, e.target.value)}>
                          <option value="">-- Skip --</option>
                          {availableColumns.map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <p className="import-mapping-hint" style={{ margin: '4px 0 0' }}>
                      {routingMode
                        ? `Yes/no day columns found — import will route rows into matching day-count folders.`
                        : 'Map the 4 yes/no day columns to enable automatic folder routing.'}
                    </p>
                  </div>
                </div>

                {previewRows.length > 0 && (
                  <div className="import-preview-table-wrapper">
                    <h4>Preview (first {previewRows.length} row{previewRows.length > 1 ? 's' : ''})</h4>
                    <div className="import-preview-table-scroll">
                      <table className="import-preview-table">
                        <thead>
                          <tr>
                            {availableColumns.map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, i) => (
                            <tr key={i}>
                              {availableColumns.map((col) => (
                                <td key={col}>{String(row[col] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="import-actions">
                  <button className="import-cancel-btn" onClick={closeModal} disabled={importing}>
                    Cancel
                  </button>
                  <button
                    className="import-submit-btn"
                    onClick={handleImport}
                    disabled={importing || !columnMap.name || parsedData.length === 0}
                  >
                    {importing ? (
                      <span><i className="pi pi-spin pi-spinner mr-2"></i> Importing...</span>
                    ) : (
                      <span><i className={`pi ${routingMode ? 'pi-sitemap' : 'pi-upload'} mr-2`}></i> {buildImportLabel()}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ImportExcel;
