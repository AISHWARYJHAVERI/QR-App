import './Pages.css';

const cardColors = [
  { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
];

const techStack = [
  'React 19', 'Vite 7', 'JavaScript (ES6+)', 'HTML5', 'CSS3',
  'Tailwind CSS 3', 'Bootstrap 5', 'PrimeReact 10', 'PrimeIcons 7',
  'Axios', 'JSON Server', 'goQR.me API', 'PostCSS', 'ESLint',
  'EmailJS', 'SheetJS (xlsx)', 'React Router 7'
];

const highlights = [
  {
    icon: 'pi pi-bolt',
    title: 'Built for Speed',
    desc: 'Powered by Vite 7 for instant hot module replacement and optimized production builds. The app loads fast and responds instantly to user interactions.'
  },
  {
    icon: 'pi pi-moon',
    title: 'Dark Futuristic UI',
    desc: 'A cohesive dark theme with radial gradient backgrounds, glassmorphic cards with backdrop blur, and animated hue-rotating text gradients throughout the interface.'
  },
  {
    icon: 'pi pi-database',
    title: 'Mock REST Backend',
    desc: 'Uses json-server to provide a full REST API for users and admins, enabling complete CRUD operations without setting up a real database server.'
  },
  {
    icon: 'pi pi-qrcode',
    title: 'QR Integration',
    desc: 'Generates QR codes on-the-fly using the goQR.me API, encoding user information for physical badge printing and quick digital identification.'
  },
  {
    icon: 'pi pi-lock',
    title: 'Admin Security',
    desc: 'Role-based authentication with persistent sessions via localStorage. Only authorized admins can access the user management dashboard.'
  },
  {
    icon: 'pi pi-th-large',
    title: 'Component Architecture',
    desc: 'Modular React component structure with reusable UI patterns, separate CSS files per section, and clean separation of concerns for maintainability.'
  }
];

function About() {
  return (
    <section id="about" className="page-section">
      <div className="page-header">
        <p className="eyebrow">About</p>
        <h2 className="animated-gradient">About Us</h2>
        <p className="page-subtitle">
          Discover the story, purpose, and technology behind the QR User Management System
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Our Mission
        </h3>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.68)' }}>
          The QR User Management System was created to simplify how administrators manage user data
          in small to medium-scale applications. By combining a powerful data management dashboard
          with QR code generation capabilities, the platform bridges the gap between digital records
          and physical identification — making it easy to create printable badges, track user
          information, and maintain a centralized user database.
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Technology Stack
        </h3>
        <div className="tech-stack">
          {techStack.map((tech, i) => (
            <span key={i} className="tech-badge">{tech}</span>
          ))}
        </div>
      </div>

      <div className="about-grid">
        {highlights.map((h, i) => {
          const c = cardColors[i % cardColors.length];
          return (
            <div key={i} className="about-card">
              <div className="feature-icon" style={{ background: c.bg, color: c.color }}>
                <i className={h.icon}></i>
              </div>
              <h3>{h.title}</h3>
              <p>{h.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default About;
