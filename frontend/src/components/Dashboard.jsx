import { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard({ user, onLogout }) {
  const [status, setStatus] = useState({
    loading: true,
    backend: 'checking',
    database: 'checking',
    error: null
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.get('/api/status');
      if (response.data && response.data.status === 'success') {
        setStatus({
          loading: false,
          backend: 'Online',
          database: response.data.database,
          error: null
        });
      } else {
        setStatus({
          loading: false,
          backend: 'Online',
          database: 'Unknown',
          error: 'Received unexpected response structure from API.'
        });
      }
    } catch (err) {
      setStatus({
        loading: false,
        backend: 'Offline',
        database: 'Disconnected',
        error: err.message || 'Could not reach Express backend. Check if the server is running.'
      });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Decorative Glow Orbs */}
      <div className="glow-orb main-orb"></div>
      <div className="glow-orb sub-orb"></div>
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-top">
          <div className="logo-section">
            <span className="logo-icon" role="img" aria-label="keys">🔑</span>
            <h1>Rentify</h1>
          </div>
          <div className="user-profile-section">
            <div className="user-details">
              <span className="user-welcome">Welcome back,</span>
              <span className="user-name">{user?.name}</span>
              <span className="user-role-badge">{user?.role}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
        <p className="subtitle">Rent Management System Dashboard</p>
      </header>

      {/* Main Dashboard Cards */}
      <main className="dashboard-grid">
        
        {/* Connection status section */}
        <section className="dashboard-card status-card">
          <h2>MERN Connection Status</h2>
          
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Backend (Express + Node.js)</span>
              <div className={`status-badge ${status.backend.toLowerCase()}`}>
                <span className="pulse-dot"></span>
                {status.backend}
              </div>
            </div>
            
            <div className="status-item">
              <span className="status-label">Database (MongoDB + Mongoose)</span>
              <div className={`status-badge ${status.database.toLowerCase()}`}>
                <span className="pulse-dot"></span>
                {status.database}
              </div>
            </div>
          </div>

          {status.error && (
            <div className="error-alert">
              <strong>Error:</strong> {status.error}
            </div>
          )}

          <button 
            type="button" 
            className="refresh-btn" 
            onClick={checkStatus} 
            disabled={status.loading}
          >
            {status.loading ? 'Checking Status...' : 'Check Server Connection'}
          </button>
        </section>

        {/* Demo Overview section based on role */}
        {user?.role === 'landlord' ? (
          <section className="dashboard-card stats-card">
            <h2>Landlord Overview</h2>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-val">15</span>
                <span className="stat-lbl">Total Properties</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">8</span>
                <span className="stat-lbl">Active Tenants</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">$8,450</span>
                <span className="stat-lbl">Expected Revenue</span>
              </div>
            </div>
          </section>
        ) : (
          <section className="dashboard-card stats-card">
            <h2>Tenant Overview</h2>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-val">Active</span>
                <span className="stat-lbl">Lease Status</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">$1,200</span>
                <span className="stat-lbl">Monthly Rent Due</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">Aug 10</span>
                <span className="stat-lbl">Next Payment Date</span>
              </div>
            </div>
          </section>
        )}

        {/* Architectural Guide section */}
        <section className="dashboard-card guide-card">
          <h2>Architecture Details</h2>
          <p className="guide-text">
            Logged in as <code>{user?.email}</code>. Authentication state is stored securely in your browser's session memory. API calls to MongoDB are checked dynamically using Mongoose.
          </p>
          <div className="tech-stack-row">
            <span className="tech-tag mongodb">MongoDB</span>
            <span className="tech-tag express">Express</span>
            <span className="tech-tag react">React</span>
            <span className="tech-tag node">Node</span>
            <span className="tech-tag mongoose">Mongoose</span>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Rentify Rent Management System • Ready for development</p>
      </footer>
    </div>
  )
}

export default Dashboard;
