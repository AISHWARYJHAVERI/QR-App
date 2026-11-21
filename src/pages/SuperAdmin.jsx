import { useEffect, useState } from 'react';
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
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState('aishwary');

  const [loginUser, setLoginUser] = useState('aishwary');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

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

  const [qrData, setQrData] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const makeSuperQr = (currentTimes = times) => {
    const data = buildQRData({
      name: 'Aishwary',
      role: 'Super Admin',
      phone: '',
      times: currentTimes,
    }, 'S');
    setQrData(data);
    setQrUrl(buildQRImageUrl(data, 260));
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
      if (!token) { setChecking(false); return; }
      try {
        const me = await axios.get('/api/super-admin/me', { headers: authHeaders() });
        setUsername(me.data.username);
        setAuthed(true);
        await loadSettings(token);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setAuthed(false);
      } finally {
        setChecking(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const response = await axios.post('/api/super-admin/login', {
        username: loginUser,
        password: loginPassword,
      });
      const nextToken = response.data.token;
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUsername(response.data.username);
      setAuthed(true);
      setLoginPassword('');
      await loadSettings(nextToken);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try { await axios.post('/api/super-admin/logout', {}, { headers: authHeaders() }); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setAuthed(false);
    setQrData('');
    setQrUrl('');
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

  if (checking) {
    return <div className="super-admin-loading">Checking access…</div>;
  }

  if (!authed) {
    return (
      <div className="super-admin-login-page">
        <div className="super-admin-login-card">
          <div className="super-admin-badge"><i className="pi pi-shield"></i></div>
          <h1>Super Admin</h1>
          <p>Private access for Aishwary only.</p>
          {loginError && <div className="sa-error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <label>Username</label>
            <div className="sa-input-wrap">
              <i className="pi pi-user"></i>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="aishwary" autoComplete="username" required />
            </div>
            <label>Password</label>
            <div className="sa-input-wrap">
              <i className="pi pi-lock"></i>
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="sa-eye" onClick={() => setShowLoginPassword(v => !v)} tabIndex={-1}>
                <i className={`pi ${showLoginPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i>
              </button>
            </div>
            <button type="submit" className="sa-primary" disabled={loggingIn}>
              {loggingIn ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-page">
      <div className="sa-topbar">
        <div>
          <h1>Super Admin Control</h1>
          <p>Signed in as <strong>{username}</strong></p>
        </div>
        <button className="sa-secondary" onClick={handleLogout}><i className="pi pi-sign-out"></i> Log Out</button>
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

        <section className="sa-card super-qr-card">
          <h2><i className="pi pi-qrcode"></i> Super Admin QR</h2>
          <p>Scans anytime, anywhere, with no warning.</p>
          {qrUrl && <img src={qrUrl} alt="Super Admin QR" className="super-qr-img" />}
          {qrData && <code className="sa-qr-data">{qrData}</code>}
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
        </section>
      </div>
    </div>
  );
};

export default SuperAdmin;
