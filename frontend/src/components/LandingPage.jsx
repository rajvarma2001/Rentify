import React from 'react'

function LandingPage({ onNavigate }) {
  return (
    <div className="landing-container">
      {/* Glow Effects */}
      <div className="glow-orb landing-orb-1"></div>
      <div className="glow-orb landing-orb-2"></div>

      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="logo-icon">🔑</span>
          <span className="logo-text">Rentify</span>
        </div>
        <button 
          className="nav-login-btn" 
          onClick={() => onNavigate('login')}
        >
          Sign In
        </button>
      </nav>

      <header className="landing-hero">
        <h1 className="hero-title">
          Smart Renting <br />
          <span className="gradient-text">Redefined for Everyone</span>
        </h1>
        <p className="hero-desc">
          Automate payments, manage documents, track maintenance, and organize leases all in one modern, glassmorphic workspace. Created for landlords and tenants alike.
        </p>
        <div className="hero-ctas">
          <button 
            className="cta-primary" 
            onClick={() => onNavigate('register')}
          >
            Get Started Free
          </button>
          <button 
            className="cta-secondary" 
            onClick={() => onNavigate('login')}
          >
            Access Dashboard
          </button>
        </div>
      </header>

      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">📁</div>
          <h3>Tenant Portals</h3>
          <p>Sign leases digitally, request maintenance, and pay rent online from a unified account.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💳</div>
          <h3>Rent Auto-Collection</h3>
          <p>Automate payments, manage invoices, track dues, and view complete transaction histories.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏠</div>
          <h3>Landlord Hub</h3>
          <p>Manage multiple properties, screen prospective tenants, and monitor incoming yields in real-time.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Rentify. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage;
