import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import './Pages.css';

const contactColors = [
  { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
];

const CONTACT_INFO = {
  phone: '+91 8160682897',
  email: 'aishwaryzaveri@gmail.com',
  location: 'India'
};

function Contact() {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccess('');
    setError('');

    const { name, email, subject, message } = formData;
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      setSending(false);
      return;
    }

    try {
      await emailjs.sendForm(
        'service_mu32qtl',
        'template_616bs8f',
        formRef.current,
        'su4VuV8lWNFUBq3Jb'
      );
      setSuccess('Your message has been sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="page-section">
      <div className="page-header">
        <p className="eyebrow">Get in Touch</p>
        <h2 className="animated-gradient">Contact Us</h2>
        <p className="page-subtitle">
          Have a question, suggestion, or need support? Reach out and we will respond promptly.
        </p>
      </div>

      <div className="contact-grid">
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Contact Information
          </h3>
          <div className="contact-info-list">
            {[
              { icon: 'pi pi-phone', title: 'Phone', value: CONTACT_INFO.phone },
              { icon: 'pi pi-envelope', title: 'Email', value: CONTACT_INFO.email },
              { icon: 'pi pi-map-marker', title: 'Location', value: CONTACT_INFO.location },
            ].map((item, i) => {
              const c = contactColors[i];
              return (
                <div key={i} className="contact-info-item">
                  <div className="contact-info-icon" style={{ background: c.bg, color: c.color }}>
                    <i className={item.icon}></i>
                  </div>
                  <div className="contact-info-text">
                    <h4>{item.title}</h4>
                    <p>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Send a Message
          </h3>

          <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
            {success && (
              <div className="contact-success">
                <i className="pi pi-check-circle"></i>
                {success}
              </div>
            )}
            {error && (
              <div className="contact-error">
                <i className="pi pi-exclamation-triangle"></i>
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contact-name">Your Name</label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  disabled={sending}
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Your Email</label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={sending}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter subject"
                required
                disabled={sending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                required
                disabled={sending}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={sending}>
              {sending ? (
                <span><i className="pi pi-spin pi-spinner mr-2"></i> Sending...</span>
              ) : (
                <span><i className="pi pi-send mr-2"></i> Send Message</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Contact;
