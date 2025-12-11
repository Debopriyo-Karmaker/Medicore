import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Real-time insights and comprehensive health analytics at your fingertips.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Bank-level encryption ensures your medical records are always protected.'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Access patient records instantly with our optimized infrastructure.'
    },
    {
      icon: '👥',
      title: 'Multi-Role Support',
      description: 'Designed for doctors, patients, lab assistants, and administrators.'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Records Managed' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Physician',
      text: 'Medicore has transformed how we manage patient records. The interface is intuitive and saves us hours every day.',
      avatar: '👩‍⚕️'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Cardiologist',
      text: 'The analytics features are outstanding. We can now track patient health trends with unprecedented accuracy.',
      avatar: '👨‍⚕️'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Hospital Administrator',
      text: 'Implementation was seamless, and the support team is exceptional. Highly recommended for any healthcare facility.',
      avatar: '👩‍💼'
    }
  ];

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
        </div>

        <div className="hero-content">
          <div className="medical-logo">
            <div className="logo-circle-main">
              <span className="logo-symbol">M+</span>
            </div>
          </div>

          <h1 className="hero-title">
            <span className="gradient-text">Medicore</span>
          </h1>
          <p className="hero-motto">Where Every Record Meets Precision</p>
          
          <p className="hero-description">
            Experience the future of healthcare management with our comprehensive, 
            secure, and intelligent medical record system designed for modern healthcare providers.
          </p>

          <div className="hero-cta">
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              <span>Get Started</span>
              <span className="btn-arrow">→</span>
            </button>
            <button onClick={() => navigate('/register')} className="btn-secondary">
              <span>Learn More</span>
            </button>
          </div>

          <div className="hero-badges">
            <span className="badge">🔒 HIPAA Compliant</span>
            <span className="badge">✓ ISO Certified</span>
            <span className="badge">⚡ Cloud-Based</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features for Modern Healthcare</h2>
          <p className="section-subtitle">
            Everything you need to manage patient records efficiently and securely
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in three simple steps</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Create Account</h3>
              <p>Sign up with your credentials and choose your role in the system.</p>
            </div>
          </div>

          <div className="step-divider">→</div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Set Up Profile</h3>
              <p>Complete your profile with necessary information and preferences.</p>
            </div>
          </div>

          <div className="step-divider">→</div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Start Managing</h3>
              <p>Access your dashboard and begin managing records efficiently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">Trusted by Healthcare Professionals</h2>
          <p className="section-subtitle">See what our users have to say</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-avatar">{testimonial.avatar}</div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <h4>{testimonial.name}</h4>
                <p>{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Healthcare Management?</h2>
          <p className="cta-description">
            Join thousands of healthcare professionals using Medicore to deliver better patient care.
          </p>
          <div className="cta-buttons">
            <button onClick={() => navigate('/register')} className="btn-primary-large">
              Get Started Free
            </button>
            <button onClick={() => navigate('/login')} className="btn-outline-large">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="footer-main">
          <div className="footer-grid">
            <div className="footer-section">
              <h3 className="footer-logo">Medicore</h3>
              <p className="footer-tagline">Where Every Record Meets Precision</p>
              <p className="footer-description">
                The most trusted medical record management system for healthcare providers worldwide.
              </p>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#integrations">Integrations</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#compliance">HIPAA Compliance</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Medicore. All rights reserved.</p>
          <div className="footer-social">
            <a href="#" className="social-link">Twitter</a>
            <a href="#" className="social-link">LinkedIn</a>
            <a href="#" className="social-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
