import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildQRData, buildQRImageUrl, DEFAULT_QR_TIMES } from '../utils/qrDates';
import { printQRCards } from '../utils/printQR';
import './SuperAdmin.css';

const TOKEN_KEY = 'qr_superadmin_token';
const DEFAULT_DAYS = ['17', '18', '19', '20'];

const readLocal = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(value) && value.length) return value.map(String);
  } catch { /* use fallback */ }
  return [...fallback];
};

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState('aishwary');

  const [days, setDays] = useState(() => readLocal('qr_event_dates', DEFAULT_DAYS));
  const [times, setTimes] = useState(() => readLocal('qr_event_times', DEFAULT_QR_TIMES));
  const [admins, setAdmins] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const [qrUrl, setQrUrl] = useState('');

  const [qrAdminForm, setQrAdminForm] = useState({ name: '', username: '', role: 'President', phone: '', city: '' });
  const [promotePasswords, setPromotePasswords] = useState({});
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const makeSuperQr = (currentTimes = times) => {
    const data = buildQRData({
      name: 'Aishwary',
      role: 'Super Admin',
      phone: '',
      times: currentTimes,
    }, 'S');
    setQrUrl(buildQRImageUrl(data, 300));
  };

  const loadSettings = async (activeToken) => {
    const response = await axios.get('/api/super-admin/settings', {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const { days: savedDays, times: savedTimes, permissions: savedPermissions, admins: savedAdmins } = response.data;
    const nextDays = Array.isArray(savedDays) && savedDays.length === 4 ? savedDays.map(String) : readLocal('qr_event_dates', DEFAULT_DAYS);
    const nextTimes = Array.isArray(savedTimes) && savedTimes.length === 4 ? savedTimes.map(String) : readLocal('qr_event_times', DEFAULT_QR_TIMES);
    setDays(nextDays);
    setTimes(nextTimes);
    setPermissions(savedPermissions || {});
    setAdmins(savedAdmins || []);
    localStorage.setItem('qr_event_dates', JSON.stringify(nextDays.map(Number)));
    localStorage.setItem('qr_event_times', JSON.stringify(nextTimes));
    makeSuperQr(nextTimes);
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        navigate('/?login=1', { replace: true });
        return;
      }
      try {
        const me = await axios.get('/api/super-admin/me', { headers: authHeaders() });
        setUsername(me.data.username);
        setAuthed(true);
        await loadSettings(token);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setAuthed(false);
        navigate('/?login=1', { replace: true });
      } finally {
        setChecking(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      if (token) {
        await axios.post('/api/super-admin/logout', {}, { headers: authHeaders() });
      }
    } catch {
      /* ignore server error */
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
      setAuthed(false);
      setQrUrl('');
      window.location.replace('/');
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword.length < 6) { setPasswordMessage('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage('Passwords do not match.'); return; }
    setChangingPassword(true);
    try {
      const response = await axios.put('/api/super-admin/password', {
        newPassword,
        confirmPassword,
      }, { headers: authHeaders() });
      setPasswordMessage(response.data.message || 'Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage(err.response?.data?.error || 'Could not update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePermission = (id, field, value) => {
    setPermissions(prev => ({
      ...prev,
      [id]: {
        username: prev[id]?.username || '',
        scanOverride: field === 'scanOverride' ? value : !!(prev[id]?.scanOverride),
        pageAccess: field === 'pageAccess' ? value : !!(prev[id]?.pageAccess),
      },
    }));
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsMessage('');
    const nums = days.map(Number);
    if (nums.some(n => !n || n < 1 || n > 31)) { setSettingsMessage('Days must be between 1 and 31.'); return; }
    if (new Set(nums).size !== 4) { setSettingsMessage('The 4 days must be different.'); return; }
    const cleanTimes = times.map(t => String(t || '').replace(/\s+/g, ''));
    if (cleanTimes.some(t => !/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(t))) {
      setSettingsMessage('Use time ranges like 09:00-12:00.');
      return;
    }
    if (new Set(cleanTimes).size !== 4) { setSettingsMessage('The 4 time ranges must be different.'); return; }

    setSavingSettings(true);
    const payloadPermissions = admins.map(a => ({
      id: a.id,
      username: a.username,
      name: a.name,
      phone: a.phone || '',
      ...(permissions[a.id] || {}),
    }));
    try {
      const response = await axios.put('/api/super-admin/settings', {
        days: nums,
        times: cleanTimes,
        permissions: payloadPermissions,
      }, { headers: authHeaders() });
      localStorage.setItem('qr_event_dates', JSON.stringify(nums));
      localStorage.setItem('qr_event_times', JSON.stringify(cleanTimes));
      setDays(nums.map(String));
      setTimes(cleanTimes);
      makeSuperQr(cleanTimes);
      setSettingsMessage('Saved and synced to the scanner.');
      if (response.data?.permissions) setPermissions(response.data.permissions);
    } catch (err) {
      setSettingsMessage(err.response?.data?.error || 'Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleQrAdminField = (field, value) => {
    setQrAdminForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateQrAdmin = async (e) => {
    e.preventDefault();
    setAdminMessage('');
    const { name, username, phone, city } = qrAdminForm;
    if (!name.trim() || !username.trim() || !phone.trim() || !city.trim()) {
      setAdminMessage('Fill in name, username, mobile number and city.');
      return;
    }
    setAdminBusy(true);
    try {
      await axios.post('/admins', { ...qrAdminForm, qrOnly: true, password: '' }, { headers: authHeaders() });
      setQrAdminForm({ name: '', username: '', role: 'President', phone: '', city: '' });
      setAdminMessage('QR-only admin added.');
      await loadSettings(token);
    } catch (err) {
      setAdminMessage(err.response?.data?.error || 'Could not add QR-only admin.');
    } finally {
      setAdminBusy(false);
    }
  };

  const handlePromoteAdmin = async (id) => {
    const password = String(promotePasswords[id] || '');
    if (password.length < 6) {
      setAdminMessage('Promotion password must be at least 6 characters.');
      return;
    }
    setAdminBusy(true);
    setAdminMessage('');
    try {
      await axios.put(`/admins/${id}`, { promote: true, password }, { headers: authHeaders() });
      setPromotePasswords(prev => ({ ...prev, [id]: '' }));
      setAdminMessage('Admin promoted. They can now sign in with the new password.');
      await loadSettings(token);
    } catch (err) {
      setAdminMessage(err.response?.data?.error || 'Could not promote admin.');
    } finally {
      setAdminBusy(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Delete ${admin.name || admin.username}?`)) return;
    setAdminBusy(true);
    setAdminMessage('');
    try {
      await axios.delete(`/admins/${admin.id}`, { headers: authHeaders() });
      setAdminMessage('Admin deleted.');
      await loadSettings(token);
    } catch (err) {
      setAdminMessage(err.response?.data?.error || 'Could not delete admin.');
    } finally {
      setAdminBusy(false);
    }
  };

  if (checking) {
    return <div className="super-admin-loading">Checking access…</div>;
  }

  // Access is granted only through the app's login modal; unauthenticated
  // visitors are redirected there by the effect above.
  if (!authed) return null;

  return (
    <div className="super-admin-page">
      <div className="sa-topbar">
        <div>
          <h1>Super Admin Control</h1>
          <p>Signed in as <strong>{username}</strong></p>
        </div>
        <button
          type="button"
          className="sa-secondary"
          onClick={handleLogout}
          title="Sign out of Super Admin"
        >
          <i className="pi pi-sign-out"></i> Log Out
        </button>
      </div>

      <div className="sa-grid">
        <section className="sa-card">
          <h2><i className="pi pi-user"></i> Credentials</h2>
          <div className="sa-id-row">
            <span>Username</span>
            <strong>{username}</strong>
          </div>
          <div className="sa-id-row">
            <span>Password</span>
            <strong>••••••••</strong>
          </div>
          <form onSubmit={handlePassword} className="sa-form">
            <label>New password</label>
            <div className="sa-input-wrap">
              <i className="pi pi-lock"></i>
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" required />
              <button type="button" className="sa-eye" onClick={() => setShowNewPassword(v => !v)} tabIndex={-1}><i className={`pi ${showNewPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i></button>
            </div>
            <label>Confirm password</label>
            <div className="sa-input-wrap">
              <i className="pi pi-lock"></i>
              <input type={showNewPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
            </div>
            <button type="submit" className="sa-primary" disabled={changingPassword}>{changingPassword ? 'Saving…' : 'Change Password'}</button>
            {passwordMessage && <div className="sa-note">{passwordMessage}</div>}
          </form>
        </section>

        <section className="sa-card">
          <h2><i className="pi pi-calendar"></i> Days &amp; Time Slots</h2>
          <form onSubmit={handleSettingsSave} className="sa-form">
            <div className="sa-section-label">Event days (day of month)</div>
            <div className="sa-fields-four">
              {days.map((day, i) => (
                <label key={i}>
                  <span>Day {i + 1}</span>
                  <input type="number" min="1" max="31" value={day} onChange={e => setDays(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                </label>
              ))}
            </div>
            <div className="sa-section-label">Time slots (IST, HH:mm-HH:mm)</div>
            <div className="sa-fields-four">
              {times.map((time, i) => (
                <label key={i}>
                  <span>{['Morning', 'Afternoon', 'Evening', 'Night'][i]}</span>
                  <input type="text" value={time} onChange={e => setTimes(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                </label>
              ))}
            </div>
            <button type="submit" className="sa-primary" disabled={savingSettings}>{savingSettings ? 'Saving…' : 'Save & Sync'}</button>
            {settingsMessage && <div className="sa-note">{settingsMessage}</div>}
          </form>
        </section>

        <section className="sa-card sa-wide">
          <h2><i className="pi pi-users"></i> Allow Admin Permission</h2>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr><th>Admin</th><th>Scan anytime</th><th>Page access</th></tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr><td colSpan="3" className="sa-muted">No normal admins found.</td></tr>
                ) : admins.map(admin => (
                  <tr key={admin.id}>
                    <td><strong>{admin.username}</strong><small>{admin.name || admin.role || ''}</small></td>
                    <td><input type="checkbox" checked={!!permissions[admin.id]?.scanOverride} onChange={e => handlePermission(admin.id, 'scanOverride', e.target.checked)} /></td>
                    <td><input type="checkbox" checked={!!permissions[admin.id]?.pageAccess} onChange={e => handlePermission(admin.id, 'pageAccess', e.target.checked)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sa-hint">“Scan anytime” lets that admin’s QR scan outside the saved days/times. “Page access” is off for everyone except you unless you turn it on.</div>
        </section>

        <section className="sa-card sa-wide">
          <h2><i className="pi pi-user-plus"></i> Add &amp; Manage QR-only Admins</h2>
          <form onSubmit={handleCreateQrAdmin} className="sa-form">
            <div className="sa-fields-four">
              <label><span>Name</span><input type="text" value={qrAdminForm.name} onChange={e => handleQrAdminField('name', e.target.value)} placeholder="Full name" /></label>
              <label><span>Username</span><input type="text" value={qrAdminForm.username} onChange={e => handleQrAdminField('username', e.target.value)} placeholder="Username" /></label>
              <label><span>Role</span>
                <select value={qrAdminForm.role} onChange={e => handleQrAdminField('role', e.target.value)}>
                  {['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Joint Treasurer', 'Committee Member', 'Project Convener', 'Project Co-convener'].map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label><span>Mobile</span><input type="text" value={qrAdminForm.phone} onChange={e => handleQrAdminField('phone', e.target.value)} placeholder="Mobile number" /></label>
              <label><span>City</span><input type="text" value={qrAdminForm.city} onChange={e => handleQrAdminField('city', e.target.value)} placeholder="City" /></label>
            </div>
            <button type="submit" className="sa-primary" disabled={adminBusy}>{adminBusy ? 'Saving…' : 'Add QR-only Admin'}</button>
          </form>

          <div className="sa-table-wrap" style={{ marginTop: '1.2rem' }}>
            <table className="sa-table">
              <thead>
                <tr><th>Admin</th><th>Account</th><th>Promote with password</th><th>Delete</th></tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr><td colSpan="4" className="sa-muted">No admins found.</td></tr>
                ) : admins.map(admin => (
                  <tr key={admin.id}>
                    <td><strong>{admin.username}</strong><small>{admin.name || admin.role || ''}</small></td>
                    <td><span className={`sa-badge ${admin.qrOnly ? 'qr' : 'full'}`}>{admin.qrOnly ? 'QR only' : 'Full admin'}</span></td>
                    <td>
                      {admin.qrOnly ? (
                        <div className="sa-promote-cell">
                          <input type="password" placeholder="New password" value={promotePasswords[admin.id] || ''} onChange={e => setPromotePasswords(prev => ({ ...prev, [admin.id]: e.target.value }))} />
                          <button type="button" className="sa-mini-btn" disabled={adminBusy} onClick={() => handlePromoteAdmin(admin.id)}>Promote</button>
                        </div>
                      ) : <span className="sa-muted">Already full admin</span>}
                    </td>
                    <td><button type="button" className="sa-mini-btn danger" disabled={adminBusy} onClick={() => handleDeleteAdmin(admin)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {adminMessage && <div className="sa-note">{adminMessage}</div>}
          <div className="sa-hint">QR-only admins have no password and cannot open the admin page. Promote one by setting a password here.</div>
        </section>

        <section className="sa-card sa-wide super-qr-card">
          <div className="super-qr-preview">
            {qrUrl && <img src={qrUrl} alt="Super Admin QR" className="super-qr-img" />}
          </div>
          <div className="super-qr-details">
            <h2><i className="pi pi-qrcode"></i> Super Admin QR</h2>
            <p className="super-qr-subtitle">Scans anytime, anywhere, with no warning.</p>
            <div className="super-qr-identity">
              <strong>Aishwary</strong>
              <span>Super Admin · Full access</span>
            </div>
            <div className="sa-qr-actions">
              <button className="sa-primary" onClick={makeSuperQr}><i className="pi pi-refresh"></i> Regenerate</button>
              <button
                className="sa-secondary"
                onClick={() => printQRCards({
                  items: [{ name: 'Aishwary', role: 'Super Admin', phone: '', times, days: [], group: 'Super Admin' }],
                  type: 'S',
                  eventDates: days.map(Number),
                })}
              >
                <i className="pi pi-print"></i> Print QR
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdmin;
