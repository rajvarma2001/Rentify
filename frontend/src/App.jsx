import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
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
        <div className="logo-section">
          <span className="logo-icon" role="img" aria-label="keys">🔑</span>
          <h1>Rentify</h1>
        </div>
        <p className="subtitle">Rent Management System</p>
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

        {/* Demo Overview section */}
        <section className="dashboard-card stats-card">
          <h2>Overview Preview</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-val">15</span>
              <span className="stat-lbl">Properties</span>
            </div>
            <div className="stat-box">
              <span className="stat-val">8</span>
              <span className="stat-lbl">Active Tenants</span>
            </div>
            <div className="stat-box">
              <span className="stat-val">$8,450</span>
              <span className="stat-lbl">Expected Rent</span>
            </div>
          </div>
        </section>

        {/* Architectural Guide section */}
        <section className="dashboard-card guide-card">
          <h2>Architecture Details</h2>
          <p className="guide-text">
            React issues requests to local paths (e.g. <code>/api/status</code>). The Vite dev server proxies these calls directly to the Express backend. The backend queries MongoDB using Mongoose.
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
        <p>Rent Management System • Ready for development</p>
      </footer>
    </div>
  )
}

export default App
