import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import './App.css';
import './pages/Pages.css';
import Users from "./Users/Users";
import Features from './pages/Features';
import Solutions from './pages/Solutions';
import Developer from './pages/Developer';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  });
  
  const [loggedInAdmin, setLoggedInAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('loggedInAdmin');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });

  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState('login'); // 'login' or 'register'
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('President');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const appToast = useRef(null);

  useEffect(() => {
    if (showLogin) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showLogin]);

  useEffect(() => {
    const keepAlive = setInterval(() => {
      axios.get('/').catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }

    setSubmitting(true);
    setLoginError('');

    try {
      // Query json-server for matching admin username
      const response = await axios.get(`/admins?username=${encodeURIComponent(username)}`);
      
      if (response.data.length > 0) {
        const adminUser = response.data[0];
        
        // Match password (plaintext for mock server authentication)
        if (adminUser.password === password) {
          setIsLoggedIn(true);
          setLoggedInAdmin(adminUser);
          localStorage.setItem('isAdminLoggedIn', 'true');
          localStorage.setItem('loggedInAdmin', JSON.stringify(adminUser));
          
          appToast.current?.show({ 
            severity: 'success', 
            summary: 'Login Successful', 
            detail: `Welcome back, ${adminUser.name}!`, 
            life: 3000 
          });

          // Reset modal state
          setShowLogin(false);
          setUsername('');
          setPassword('');
        } else {
          setLoginError("Incorrect password. Please try again.");
        }
      } else {
        setLoginError("Admin username not found.");
      }
    } catch (error) {
      console.error("Login request failed:", error);
      setLoginError("Authentication server error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword.trim() || !regRole.trim() || !regPhone.trim() || !regCity.trim()) {
      setLoginError("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    setLoginError('');

    try {
      // Check if username already exists
      const checkResponse = await axios.get(`/admins?username=${encodeURIComponent(regUsername.trim())}`);
      if (checkResponse.data.length > 0) {
        setLoginError("Username already exists. Please choose another one.");
        setSubmitting(false);
        return;
      }

      // Create new admin object
      const newAdmin = {
        name: regName.trim(),
        username: regUsername.trim(),
        password: regPassword.trim(),
        role: regRole.trim() || 'President',
        phone: regPhone.trim(),
        city: regCity.trim()
      };

      // Post to mock server
      const response = await axios.post('/admins', newAdmin);
      const registeredAdmin = response.data;

      // Automatically log the new admin in
      setIsLoggedIn(true);
      setLoggedInAdmin(registeredAdmin);
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('loggedInAdmin', JSON.stringify(registeredAdmin));

      appToast.current?.show({
        severity: 'success',
        summary: 'Account Created',
        detail: `Welcome, ${registeredAdmin.name}! You are now signed in.`,
        life: 3000
      });

      // Clear state and close modal
      setShowLogin(false);
      setLoginMode('login');
      setRegName('');
      setRegUsername('');
      setRegPassword('');
      setRegRole('President');
      setRegPhone('');
      setRegCity('');
    } catch (error) {
      console.error("Registration failed:", error);
      setLoginError("Registration server error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInAdmin(null);
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('loggedInAdmin');
    
    window.location.reload();
  };

  return (
    <div className="App">
      <Toast ref={appToast} />
      
      <header className="hero-nav">
        <Link className="brand" to="/">AJ</Link>
        
        <nav className="capsule-nav">
          <button
            className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span></span><span></span><span></span>
          </button>
          <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/features" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <Link to="/solutions" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Solutions</Link>
          <Link to="/developer" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Developer</Link>
          <Link to="/about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
          <Link to="/contact" className="nav-btn-solid" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
        </nav>

        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
            <nav className="mobile-panel" onClick={e => e.stopPropagation()}>
              <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
              <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/features" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link to="/solutions" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Solutions</Link>
              <Link to="/developer" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Developer</Link>
              <Link to="/about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
              <Link to="/contact" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
            </nav>
          </div>
        )}

        <div className="header-right">
          {isLoggedIn ? (
            <div className="admin-status">
              <span className="admin-name">Hi, {loggedInAdmin.name}</span>
              <button className="nav-login-btn logout" onClick={handleLogout}>
                <i className="pi pi-sign-out mr-2"></i> Log Out
              </button>
            </div>
          ) : (
            <button className="nav-login-btn login" onClick={() => { setLoginMode('login'); setLoginError(''); setShowLogin(true); }}>
              <i className="pi pi-user mr-2"></i> Log In
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={
          <>
            <main className="hero">
              <div className="hero-copy">
                <p className="eyebrow">Aishwary Jhaveri's Web App</p>
                <h1 className="hero-title">
                  Aishwary Jhaveri's
                  <span>Web App</span>
                </h1>
                <p className="hero-description">
                  Aishwary Jhaveri's Web App
                </p>
              </div>
            </main>

            <section id="dashboard" className="dashboard-section">
              <Users isLoggedIn={isLoggedIn} />
            </section>
          </>
        } />
        <Route path="/features" element={<Features />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/developer" element={<Developer />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <footer className="footer-brand-section">
        <div className="footer-brand-text">aishwary jhaveri</div>
      </footer>

      {/* Glassmorphic Login Overlay Modal */}
      {showLogin && (
        <div className="login-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="login-close-btn" onClick={() => setShowLogin(false)}>
              <i className="pi pi-times"></i>
            </button>
            
            <div className="login-modal-body">
              <div className="login-tabs-container">
                <button 
                  type="button" 
                  className={`login-tab-btn ${loginMode === 'login' ? 'active' : ''}`}
                  onClick={() => { setLoginMode('login'); setLoginError(''); }}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  className={`login-tab-btn ${loginMode === 'register' ? 'active' : ''}`}
                  onClick={() => { setLoginMode('register'); setLoginError(''); }}
                >
                  Register
                </button>
              </div>

              <h2 className="login-title animated-gradient">
                {loginMode === 'login' ? 'Admin Sign In' : 'Create Admin Account'}
              </h2>
              <p className="login-subtitle">
                {loginMode === 'login' ? 'Access your administrator dashboard panel' : 'Register a new administrator profile'}
              </p>

              {loginMode === 'login' ? (
                <form onSubmit={handleLogin}>
                  {loginError && (
                    <div className="login-error-alert animate-shake">
                      <i className="pi pi-exclamation-triangle mr-2"></i>
                      {loginError}
                    </div>
                  )}

                  <div className="login-field">
                    <label>Admin Username</label>
                    <div className="login-input-wrapper">
                      <i className="pi pi-user login-input-icon"></i>
                      <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Enter admin username"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="login-field">
                    <label>Admin Password</label>
                    <div className="login-input-wrapper">
                      <i className="pi pi-lock login-input-icon"></i>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter secret password"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={submitting || !username || !password}>
                    {submitting ? (
                      <span><i className="pi pi-spin pi-spinner mr-2"></i> Signing In...</span>
                    ) : (
                      <span>Sign In <i className="pi pi-arrow-right ml-2"></i></span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  {loginError && (
                    <div className="login-error-alert animate-shake">
                      <i className="pi pi-exclamation-triangle mr-2"></i>
                      {loginError}
                    </div>
                  )}

                  <div className="login-field">
                    <label>Full Name</label>
                    <div className="login-input-wrapper">
                      <i className="pi pi-id-card login-input-icon"></i>
                      <input 
                        type="text" 
                        value={regName} 
                        onChange={(e) => setRegName(e.target.value)} 
                        placeholder="Enter full name"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="login-row">
                    <div className="login-field">
                      <label>Username</label>
                      <div className="login-input-wrapper">
                        <i className="pi pi-user login-input-icon"></i>
                        <input 
                          type="text" 
                          value={regUsername} 
                          onChange={(e) => setRegUsername(e.target.value)} 
                          placeholder="Username"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="login-field">
                      <label>Password</label>
                      <div className="login-input-wrapper">
                        <i className="pi pi-lock login-input-icon"></i>
                        <input 
                          type="password" 
                          value={regPassword} 
                          onChange={(e) => setRegPassword(e.target.value)} 
                          placeholder="Password"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="login-row">
                    <div className="login-field">
                      <label>Mobile Number</label>
                      <div className="login-input-wrapper">
                        <i className="pi pi-phone login-input-icon"></i>
                        <input 
                          type="text" 
                          value={regPhone} 
                          onChange={(e) => setRegPhone(e.target.value)} 
                          placeholder="Mobile No."
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="login-field">
                      <label>City</label>
                      <div className="login-input-wrapper">
                        <i className="pi pi-map-marker login-input-icon"></i>
                        <input 
                          type="text" 
                          value={regCity} 
                          onChange={(e) => setRegCity(e.target.value)} 
                          placeholder="City"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="login-field">
                    <label>Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="login-role-select"
                      required
                      disabled={submitting}
                    >
                      <option value="President">President</option>
                      <option value="Vice President">Vice President</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Joint Secretary">Joint Secretary</option>
                      <option value="Treasurer">Treasurer</option>
                      <option value="Joint Treasurer">Joint Treasurer</option>
                      <option value="Committee Member">Committee Member</option>
                      <option value="Project Convener">Project Convener</option>
                      <option value="Project Co-convener">Project Co-convener</option>
                    </select>
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={submitting || !regName || !regUsername || !regPassword || !regRole || !regPhone || !regCity}>
                    {submitting ? (
                      <span><i className="pi pi-spin pi-spinner mr-2"></i> Registering...</span>
                    ) : (
                      <span>Register Account <i className="pi pi-arrow-right ml-2"></i></span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;