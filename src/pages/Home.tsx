import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const features = [
  {
    icon: "⚡",
    title: "Instant Setup",
    desc: "Create your entire portfolio in minutes. No coding required — just fill in the fields.",
  },
  {
    icon: "🎨",
    title: "3D Animated Design",
    desc: "Stunning 3D character, physics-based tech stack, smooth GSAP scroll animations built in.",
  },
  {
    icon: "📋",
    title: "Full Content Control",
    desc: "Edit your name, bio, career history, projects, skills and social links from one place.",
  },
  {
    icon: "📱",
    title: "Responsive & Fast",
    desc: "Pixel-perfect on all devices. Vite-powered for lightning fast load times.",
  },
  {
    icon: "🔒",
    title: "Secure Admin Panel",
    desc: "JWT-protected admin dashboard. Only you can edit your portfolio content.",
  },
  {
    icon: "🚀",
    title: "Production Ready",
    desc: "Deploy on any Linux server with Django + Gunicorn + Nginx in minutes.",
  },
];

const steps = [
  {
    number: "01",
    title: "Login to Admin Panel",
    desc: "Access your secure admin dashboard with your credentials.",
  },
  {
    number: "02",
    title: "Fill In Your Details",
    desc: "Add your name, bio, career entries, projects, skills and social links.",
  },
  {
    number: "03",
    title: "Your Portfolio Goes Live",
    desc: "Changes reflect instantly. Share your portfolio URL with the world.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  // Portfolio page sets body overflow:hidden for GSAP; restore it here
  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "hidden"; };
  }, []);

  return (
    <div className="home-page">
      {/* Nav */}
      <nav className="home-nav">
        <div className="home-nav-logo">PortfolioCraft</div>
        <div className="home-nav-actions">
          <button className="home-btn-outline" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="home-btn-primary home-btn-sm" onClick={() => navigate("/register")}>
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-badge">Developer Portfolio Builder</div>
        <h1 className="home-hero-title">
          Your portfolio.
          <br />
          <span className="home-hero-accent">Built in minutes.</span>
        </h1>
        <p className="home-hero-sub">
          A stunning 3D animated developer portfolio with a full admin panel.
          Log in, fill in your details, and your personalised portfolio is live — no code needed.
        </p>
        <div className="home-hero-cta">
          <button className="home-btn-primary" onClick={() => navigate("/register")}>
            Get Started Free →
          </button>
          <button className="home-btn-ghost" onClick={() => navigate("/portfolio")}>
            See Demo Portfolio
          </button>
        </div>

        {/* Portfolio preview mockup */}
        <div className="home-hero-preview">
          <div className="home-browser-mock">
            <div className="home-browser-bar">
              <div className="home-browser-dots">
                <span className="hb-dot red"></span>
                <span className="hb-dot yellow"></span>
                <span className="hb-dot green"></span>
              </div>
              <div className="home-browser-url">localhost:5173/portfolio</div>
            </div>
            <div className="home-browser-screen">
              <div className="hbs-topnav">
                <span className="hbs-initials">JD</span>
                <div className="hbs-nav-links">
                  <span>ABOUT</span>
                  <span>CAREER</span>
                  <span>WORK</span>
                </div>
              </div>
              <div className="hbs-hero-content">
                <p className="hbs-hi">&#47;&#47; hi, i am</p>
                <h3 className="hbs-name">JOHN DOE</h3>
                <p className="hbs-role">
                  A Full Stack <span className="hbs-accent">Developer</span>
                </p>
              </div>
              <div className="hbs-chips">
                <span className="hbs-chip">React</span>
                <span className="hbs-chip active">Node.js</span>
                <span className="hbs-chip">TypeScript</span>
                <span className="hbs-chip">MongoDB</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-section" id="features">
        <div className="home-section-inner">
          <p className="home-section-label">Why PortfolioCraft</p>
          <h2 className="home-section-title">Everything you need to impress</h2>
          <div className="home-features-grid">
            {features.map((f) => (
              <div className="home-feature-card" key={f.title}>
                <span className="home-feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="home-section home-section-dark" id="how">
        <div className="home-section-inner">
          <p className="home-section-label">Simple Process</p>
          <h2 className="home-section-title">How it works</h2>
          <div className="home-steps">
            {steps.map((s, i) => (
              <div className="home-step" key={s.number}>
                <div className="home-step-number">{s.number}</div>
                <div className="home-step-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < steps.length - 1 && <div className="home-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Panel Preview */}
      <section className="home-section">
        <div className="home-section-inner home-admin-preview">
          <div className="home-admin-text">
            <p className="home-section-label">Admin Panel</p>
            <h2 className="home-section-title">All your content in one place</h2>
            <ul className="home-admin-list">
              <li>✓ Edit name, title, bio &amp; initials</li>
              <li>✓ Manage career timeline entries</li>
              <li>✓ Add / remove / reorder projects</li>
              <li>✓ Customise skills &amp; services sections</li>
              <li>✓ Control tech stack display images</li>
              <li>✓ Update all social links &amp; resume</li>
            </ul>
            <button className="home-btn-primary" onClick={() => navigate("/admin")}>
              Open Admin Panel →
            </button>
          </div>
          <div className="home-admin-mock">
            <div className="home-mock-sidebar">
              {["Profile", "Career", "Projects", "Skills", "Tech Stack", "Social"].map((item) => (
                <div className="home-mock-item" key={item}>{item}</div>
              ))}
            </div>
            <div className="home-mock-form">
              <div className="home-mock-field">
                <div className="home-mock-label"></div>
                <div className="home-mock-input"></div>
              </div>
              <div className="home-mock-field">
                <div className="home-mock-label"></div>
                <div className="home-mock-input tall"></div>
              </div>
              <div className="home-mock-save"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta-section">
        <div className="home-section-inner">
          <h2 className="home-cta-title">Ready to build your portfolio?</h2>
          <p className="home-cta-sub">
            Set up once. Update anytime. Impress always.
          </p>
          <button className="home-btn-primary home-btn-lg" onClick={() => navigate("/register")}>
            Start Building Now →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>PortfolioCraft — Open source portfolio builder</p>
        <div className="home-footer-links">
          <button onClick={() => navigate("/portfolio")}>Demo</button>
          <button onClick={() => navigate("/login")}>Login</button>
        </div>
      </footer>
    </div>
  );
}
