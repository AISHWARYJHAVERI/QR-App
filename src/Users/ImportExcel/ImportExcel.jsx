import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './ImportExcel.css';

const EXPECTED_COLUMNS = ['name', 'full name', 'phone', 'mobile', 'contact', 'city', 'location', 'address'];

const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  const data = [
    { Name: 'John Doe', Phone: '9876543210', City: 'Mumbai' }
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'user_import_template.xlsx');
};

function ImportExcel({ onImported, showError, showSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columnMap, setColumnMap] = useState({ name: '', phone: '', city: '' });
  const [availableColumns, setAvailableColumns] = useState([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const detectColumn = (headers) => {
    const map = { name: '', phone: '', city: '' };
    headers.forEach((h) => {
      const lower = h.toLowerCase().trim();
      if (EXPECTED_COLUMNS.includes(lower)) {
        if (['name', 'full name'].includes(lower)) map.name = h;
        else if (['phone', 'mobile', 'contact'].includes(lower)) map.phone = h;
        else if (['city', 'location', 'address'].includes(lower)) map.city = h;
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
    setColumnMap({ name: '', phone: '', city: '' });
    setDragOver(false);
  };

  const handleColumnChange = (field, value) => {
    setColumnMap((prev) => ({ ...prev, [field]: value }));
  };

  const previewRows = parsedData.slice(0, 3);

  return (
    <>
      <button className="import-btn template-btn" onClick={downloadTemplate} title="Download Excel template">
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
                      <span><i className="pi pi-upload mr-2"></i> Import {parsedData.length} Record{parsedData.length !== 1 ? 's' : ''}</span>
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
