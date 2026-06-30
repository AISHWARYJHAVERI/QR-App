import './Pages.css';

const features = [
  {
    icon: 'pi pi-users',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'User Management Dashboard',
    desc: 'A full-featured data table with search, pagination, and sort capabilities. View all registered users in one place with real-time filtering.',
    process: 'Admin logs in → Dashboard loads user data from json-server → Table renders with search & pagination controls.',
    output: 'Interactive table displaying user records with search bar, page navigation, and row actions.',
    result: 'Quick access to all user data with ability to locate specific records instantly.'
  },
  {
    icon: 'pi pi-user-plus',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    title: 'Add Users',
    desc: 'Inline or modal form to register new users with name, phone, and city fields. Form validation ensures data integrity.',
    process: 'Click "Add User" → Fill form fields → Submit → POST request to json-server → Table refreshes automatically.',
    output: 'New user record created and immediately visible in the data table.',
    result: 'Seamless user onboarding with instant visual feedback.'
  },
  {
    icon: 'pi pi-eye',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    title: 'View User Profiles',
    desc: 'Click the eye icon to see a detailed profile card showing user avatar, name, phone, and city information.',
    process: 'Click eye icon on any row → Modal opens with user data → Profile card displays formatted details.',
    output: 'Elegant glassmorphic profile card with user information.',
    result: 'Quick glance at complete user information without navigating away.'
  },
  {
    icon: 'pi pi-pencil',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Edit Users',
    desc: 'Update existing user records through a pre-populated modal form. Supports both flat city and nested address.city schemas.',
    process: 'Click pencil icon → Edit modal opens with current data → Modify fields → PUT request updates record → Table refreshes.',
    output: 'Updated user record reflected in the database and table.',
    result: 'Flexible data modification handling different data structure variants.'
  },
  {
    icon: 'pi pi-trash',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    title: 'Delete Users',
    desc: 'Remove user records with a confirmation prompt to prevent accidental deletions.',
    process: 'Click trash icon → Confirmation dialog → Confirm → DELETE request → Record removed → Table updates.',
    output: 'User permanently removed from the database.',
    result: 'Safe data removal with accidental-delete protection.'
  },
  {
    icon: 'pi pi-qrcode',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    title: 'QR Code Generation',
    desc: 'Generate QR codes encoding user name and phone. Display in a dialog or print directly from the add form.',
    process: 'Click QR icon on a row → QR code generated via goQR.me API → Dialog displays QR with user info → Optional print.',
    output: 'Printable QR code image containing encoded user data.',
    result: 'Physical or digital QR badges for quick user identification.'
  },
  {
    icon: 'pi pi-shield',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    title: 'Admin Authentication',
    desc: 'Secure login and registration system with session persistence via localStorage. Role-based access controls the dashboard.',
    process: 'Click "Log In" → Enter credentials → Server validates → Session stored → Dashboard unlocks with admin name displayed.',
    output: 'Authenticated admin session with personalized welcome message.',
    result: 'Controlled access ensuring only authorized admins manage user data.'
  },
  {
    icon: 'pi pi-cog',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    title: 'Admin Panel',
    desc: 'Switchable tab between user database and admin management. Create new admin accounts and view all registered admins.',
    process: 'Click "Admin Panel" tab → View admin list → Fill inline form with details → POST new admin → List updates.',
    output: 'New admin account created and immediately listed in the admin table.',
    result: 'Multi-admin support for team-based user management.'
  },
  {
    icon: 'pi pi-search',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Search & Filter',
    desc: 'Real-time search across user records. The table filters dynamically as you type, making it easy to find specific users.',
    process: 'Type in search bar → Filter function runs on each keystroke → Table updates to show matching records only.',
    output: 'Filtered subset of user records matching the search query.',
    result: 'Instant access to specific users without manual scrolling.'
  }
];

function Features() {
  return (
    <section id="features" className="page-section">
      <div className="page-header">
        <p className="eyebrow">Capabilities</p>
        <h2 className="animated-gradient">Features</h2>
        <p className="page-subtitle">
          The QR User Management System streamlines administrator workflows with
          a complete set of tools for managing user data and generating QR codes.
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            What is the QR User Management System?
          </h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.68)', maxWidth: '800px', margin: '0 auto' }}>
            A modern, full-stack web application built with React 19 and Vite that empowers administrators
            to manage user records through a beautiful dark-themed interface. The system supports complete
            CRUD operations, secure admin authentication, QR code generation for physical badges, and
            multi-admin account management — all served through a glassmorphic, animated UI.
          </p>
        </div>
      </div>

      <div className="feature-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-item">
            <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
              <i className={f.icon}></i>
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: `3px solid ${f.color}` }}>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>
                <strong style={{ color: f.color }}>Process:</strong> {f.process}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>
                <strong style={{ color: f.color }}>Output:</strong> {f.output}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                <strong style={{ color: f.color }}>Result:</strong> {f.result}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
