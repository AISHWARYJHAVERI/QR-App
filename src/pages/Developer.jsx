import './Pages.css';

const techStack = [
  'React 19', 'Vite 7', 'JavaScript (ES6+)', 'HTML5', 'CSS3',
  'Tailwind CSS 3', 'Bootstrap 5', 'PrimeReact 10', 'PrimeIcons 7',
  'Axios', 'JSON Server', 'REST API', 'goQR.me API',
  'PostCSS', 'ESLint', 'EmailJS', 'SheetJS (xlsx)', 'React Router 7'
];

function Developer() {
  return (
    <section id="developer" className="page-section">
      <div className="page-header">
        <p className="eyebrow">Creator</p>
        <h2 className="animated-gradient">Developer</h2>
        <p className="page-subtitle">
          Meet the mind behind the QR User Management System
        </p>
      </div>

      <div className="glass-card">
        <div className="dev-card">
          <div className="dev-avatar">AJ</div>
          <div className="dev-info">
            <h3>Aishwary Jhaveri</h3>
            <div className="dev-role">Full-Stack Developer</div>

            <div className="dev-details">
              <div className="dev-detail-item">
                <i className="pi pi-phone"></i>
                <span>+91 8160682897</span>
              </div>
              <div className="dev-detail-item">
                <i className="pi pi-envelope"></i>
                <span>aishwaryzaveri@gmail.com</span>
              </div>
              <div className="dev-detail-item">
                <i className="pi pi-map-marker"></i>
                <span>India</span>
              </div>
              <div className="dev-detail-item">
                <i className="pi pi-globe"></i>
                <span>Web Development & Design</span>
              </div>
            </div>

            <div className="dev-bio">
              A passionate full-stack developer with expertise in building modern web applications
              using React and the JavaScript ecosystem. This QR User Management System showcases
              proficiency in crafting beautiful, functional UIs with glassmorphic design principles,
              integrating REST APIs, implementing authentication flows, and generating dynamic
              QR code content for real-world business applications.
            </div>

            <div className="skills-section">
              <h4>Tech Stack & Skills</h4>
              <div className="skills-tags">
                {techStack.map((skill, i) => (
                  <span key={i} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Developer;
