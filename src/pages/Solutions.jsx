import './Pages.css';

const stepColors = [
  { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  { color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.3)' },
  { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
  { color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)' },
  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)' },
  { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  { color: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)' },
  { color: '#14b8a6', bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.3)' },
  { color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)' },
];

const steps = [
  {
    title: 'Start the Application',
    detail: 'Launch the development server with npm run dev (frontend on port 5175) and the mock database with npm run server (JSON server on port 5001). The app loads with a hero landing page and navigation bar at the top.',
    workflow: 'The Vite dev server serves the React application. Meanwhile, json-server watches src/db.json and provides REST API endpoints at localhost:5001 for users and admins collections.'
  },
  {
    title: 'Admin Authentication - Login',
    detail: 'Click the "Log In" button in the top-right corner of the header. A glassmorphic modal overlay appears with two tabs: "Sign In" and "Register". Enter your admin username and password, then click "Sign In". The system queries json-server at GET /admins?username={value} to find matching credentials.',
    workflow: 'On successful authentication, the admin name appears in the header, session data is stored in localStorage, and a toast notification confirms "Welcome back, {name}!". The dashboard becomes fully accessible with all CRUD features enabled.'
  },
  {
    title: 'Admin Authentication - Register',
    detail: 'If you do not have an account, click the "Register" tab in the login modal. Fill in Full Name, Username, Password, Mobile Number, and City fields. The system first checks if the username already exists via a GET query, then POSTs the new admin to the server.',
    workflow: 'After successful registration, you are automatically logged in and redirected to the dashboard. The new admin record is saved to the admins collection in db.json for future logins.'
  },
  {
    title: 'Dashboard Overview',
    detail: 'Once logged in, the dashboard section displays two tabs: "User Database" and "Admin Panel". The User Database tab shows a PrimeReact DataTable with all user records, a search bar at the top, and pagination controls at the bottom.',
    workflow: 'User data is fetched via GET /users from json-server. The table displays name, phone, city, and action buttons for each row. The search bar filters records in real-time as you type.'
  },
  {
    title: 'Adding a New User',
    detail: 'Click the "Add User" button above the table. An inline form appears with fields for Name, Phone, and City. Fill in the details and click "Add User". The system validates the inputs and sends a POST request to json-server.',
    workflow: 'The new user appears instantly in the table without requiring a page refresh. The form also includes a "Generate QR Code" button that becomes active when all fields are valid.'
  },
  {
    title: 'Searching for Users',
    detail: 'Type any keyword into the search bar at the top of the table. The system filters user records in real-time, matching against name, phone, and city fields. The table updates dynamically with each keystroke.',
    workflow: 'The search uses a case-insensitive comparison across multiple fields. Pagination resets to show results from the filtered dataset.'
  },
  {
    title: 'Viewing User Details',
    detail: 'Click the eye icon (View) on any user row. A modal dialog opens showing a glassmorphic profile card with the user\'s avatar (first letter of their name), full name, phone number, and city.',
    workflow: 'The profile card uses the existing row data without making an additional API call, providing instant feedback. Close the modal by clicking the close button or tapping outside the card.'
  },
  {
    title: 'Editing User Records',
    detail: 'Click the pencil icon (Edit) on any user row. A pre-populated modal form appears with the current Name, Phone, and City values. Modify the desired fields and click "Save". The system sends a PUT request to update the record.',
    workflow: 'The code handles both flat city fields (new users) and nested address.city fields (legacy seed data) using a fallback pattern: user.city || user.address?.city. The table refreshes to show the updated information.'
  },
  {
    title: 'Deleting User Records',
    detail: 'Click the trash icon (Delete) on any user row. A browser confirmation dialog asks "Are you sure you want to delete this user?". Confirm to proceed with the DELETE request.',
    workflow: 'Upon confirmation, a DELETE request is sent to json-server. The record is permanently removed, and the table updates automatically. This action cannot be undone.'
  },
  {
    title: 'Generating QR Codes',
    detail: 'Click the QR code icon on any user row. A dialog opens displaying a QR code generated via the goQR.me API. The QR encodes the user\'s Name and Phone. From the Add User form, you can also generate and print QR codes.',
    workflow: 'The QR API URL encodes data as URL parameter: https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={encodedData}. The print feature opens a new window with a styled printable page and auto-triggers the print dialog.'
  },
  {
    title: 'Admin Panel Management',
    detail: 'Click the "Admin Panel" tab next to "User Database". This section shows a DataTable of all registered admins and an inline form to create new admin accounts with Name, Username, Password, Role, Phone, and City fields.',
    workflow: 'New admin accounts are saved to the admins collection via POST. The admin list updates immediately. Note: Edit, View, and Delete operations for admins are available in the user management section.'
  },
  {
    title: 'Session & Logout',
    detail: 'The login session persists across page reloads using localStorage. When you click "Log Out", the session data is cleared from localStorage, the dashboard resets to the User Database tab, and the header returns to showing the "Log In" button.',
    workflow: 'Logout triggers a toast notification confirming the action. The isLoggedIn state propagates to child components, restricting access to admin features until the next login.'
  }
];

function Solutions() {
  return (
    <section id="solutions" className="page-section">
      <div className="page-header">
        <p className="eyebrow">Step by Step</p>
        <h2 className="animated-gradient">Solutions & Workflow</h2>
        <p className="page-subtitle">
          A complete walkthrough of how the QR User Management System operates,
          from startup to everyday administrative tasks.
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          System Architecture Overview
        </h3>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.68)' }}>
          The application follows a client-server architecture. The React frontend (port 5175) communicates
          with a json-server mock backend (port 5001) via REST API calls using Axios. Data is stored in a
          local db.json file containing two collections: <strong>users</strong> (with CRUD endpoints)
          and <strong>admins</strong> (with authentication and listing endpoints). The UI uses
          PrimeReact components, Bootstrap 5 grid, and Tailwind CSS utilities styled with a dark
          glassmorphic design system.
        </p>
      </div>

      <div className="steps-list">
        {steps.map((step, i) => {
          const c = stepColors[i % stepColors.length];
          return (
            <div key={i} className="step-item">
              <div className="step-number" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                {i + 1}
              </div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.detail}</p>
                <div className="step-detail" style={{ borderLeftColor: c.color }}>
                  <i className="pi pi-sync mr-2" style={{ color: c.color }}></i>
                  {step.workflow}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Solutions;
