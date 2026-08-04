import { useState, useEffect } from 'react'
import axios from 'axios'
import PropertyList from './PropertyList'
import PropertyDetails from './PropertyDetails'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  // Navigation tabs state: 'overview' | 'properties'
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // Stats State
  const [stats, setStats] = useState({
    properties: [],
    dueSummary: { count: 0, totalAmount: 0, items: [] },
    recentPayments: [],
    maintenanceRequests: [],
    notifications: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state (For tenant's quick action)
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintForm, setMaintForm] = useState({
    title: '',
    description: '',
    propertyId: '',
    priority: 'medium'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/dashboard/stats?userId=${user.id}&role=${user.role}`);
      if (response.data && response.data.status === 'success') {
        setStats({
          properties: response.data.properties || [],
          dueSummary: response.data.dueSummary || { count: 0, totalAmount: 0, items: [] },
          recentPayments: response.data.recentPayments || [],
          maintenanceRequests: response.data.maintenanceRequests || [],
          notifications: response.data.notifications || []
        });
      } else {
        setError('Failed to fetch dashboard data.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not reach backend server. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  // Handle Pay Rent (Tenant Action on Overview screen)
  const handlePayRent = async (paymentId) => {
    if (!window.confirm('Confirm rent payment? (This is a simulation)')) return;
    try {
      const response = await axios.post(`/api/dashboard/payments/${paymentId}/pay`);
      if (response.data.status === 'success') {
        alert('Rent payment processed successfully!');
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      alert('Error processing payment.');
    }
  };

  // Request Maintenance (Tenant Action from Overview screen)
  const handleMaintSubmit = async (e) => {
    e.preventDefault();
    if (!maintForm.title || !maintForm.description || !maintForm.propertyId) {
      setFormError('Please fill in all fields.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.post('/api/dashboard/maintenance', {
        ...maintForm,
        tenantId: user.id
      });
      if (response.data.status === 'success') {
        setShowMaintModal(false);
        setMaintForm({ title: '', description: '', propertyId: '', priority: 'medium' });
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error submitting request.');
    } finally {
      setFormLoading(false);
    }
  };

  // Nav Switch helpers
  const handleSelectProperty = (id) => {
    setSelectedPropertyId(id);
    setActiveSubTab('properties');
  };

  return (
    <div className="dashboard-container">
      <div className="glow-orb main-orb"></div>
      <div className="glow-orb sub-orb"></div>
      
      {/* Header Panel */}
      <header className="dashboard-header">
        <div className="header-top">
          <div className="logo-section">
            <span className="logo-icon" role="img" aria-label="keys">🔑</span>
            <h1>Rentify</h1>
          </div>

          {/* Navigation Links inside header */}
          <div className="dashboard-nav-tabs">
            <button 
              className={`nav-tab-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveSubTab('overview'); setSelectedPropertyId(null); }}
            >
              📊 Overview
            </button>
            <button 
              className={`nav-tab-btn ${activeSubTab === 'properties' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('properties')}
            >
              🏠 Manage Properties
            </button>
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
        <p className="subtitle">Rent Management Workspace</p>
      </header>

      {error && <div className="error-alert max-width-1000">{error}</div>}

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your workspace...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW PANELS */}
          {activeSubTab === 'overview' && (
            <main className="dashboard-layout-grid">
              
              {/* 1. Property Overview */}
              <section className="dashboard-card widget-properties">
                <h2>🏠 Property Overview</h2>
                <div className="card-content">
                  {stats.properties.length === 0 ? (
                    <p className="empty-text">No registered properties found.</p>
                  ) : (
                    <div className="properties-list">
                      {stats.properties.map(p => (
                        <div 
                          className="property-item interactive" 
                          key={p._id}
                          onClick={() => handleSelectProperty(p._id)}
                        >
                          <div className="prop-icon">🏢</div>
                          <div className="prop-details">
                            <span className="prop-name">{p.name}</span>
                            <span className="prop-addr">{p.address}</span>
                          </div>
                          <span className="prop-rent">${p.rentAmount}/mo</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 2. Rent Due Summary */}
              <section className="dashboard-card widget-rent-due">
                <h2>💳 Rent Due Summary</h2>
                <div className="card-content">
                  <div className="dues-summary-box">
                    <span className="summary-amount">${stats.dueSummary.totalAmount}</span>
                    <span className="summary-label">Total Outstanding Dues</span>
                  </div>
                  
                  {stats.dueSummary.items.length === 0 ? (
                    <p className="empty-text success-message">✓ All payments are currently up to date.</p>
                  ) : (
                    <div className="dues-list">
                      {stats.dueSummary.items.map(d => (
                        <div className="due-item" key={d._id}>
                          <div className="due-info">
                            <span className="due-desc">
                              {user.role === 'landlord' 
                                ? `Due from ${d.tenant?.name || 'Tenant'}` 
                                : 'Rent Payment Due'}
                            </span>
                            <span className="due-date">Due Date: {new Date(d.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="due-action-row">
                            <span className="due-amt">${d.amount}</span>
                            {user.role === 'tenant' && (
                              <button 
                                className="pay-now-btn"
                                onClick={() => handlePayRent(d._id)}
                              >
                                Pay Rent
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 3. Recent Payments */}
              <section className="dashboard-card widget-payments">
                <h2>📜 Recent Payments</h2>
                <div className="card-content">
                  {stats.recentPayments.length === 0 ? (
                    <p className="empty-text">No transaction history found.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="payments-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Property</th>
                            {user.role === 'landlord' && <th>Tenant</th>}
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentPayments.map(p => (
                            <tr key={p._id}>
                              <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}</td>
                              <td>{p.property?.name?.substring(0, 18)}...</td>
                              {user.role === 'landlord' && <td>{p.tenant?.name}</td>}
                              <td>${p.amount}</td>
                              <td><span className="badge-paid">Paid</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Maintenance Requests */}
              <section className="dashboard-card widget-maintenance">
                <h2>🛠️ Maintenance Requests</h2>
                <div className="card-content">
                  {stats.maintenanceRequests.length === 0 ? (
                    <p className="empty-text">No active maintenance requests.</p>
                  ) : (
                    <div className="maintenance-list">
                      {stats.maintenanceRequests.map(r => (
                        <div className="maintenance-item" key={r._id}>
                          <div className="maint-header">
                            <span className="maint-title">{r.title}</span>
                            <span className={`priority-tag ${r.priority.toLowerCase()}`}>
                              {r.priority}
                            </span>
                          </div>
                          <p className="maint-desc">{r.description}</p>
                          <div className="maint-footer">
                            <span className="maint-prop">📍 {r.property?.name}</span>
                            <span className={`status-tag ${r.status.replace('-', '')}`}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 5. Notifications */}
              <section className="dashboard-card widget-notifications">
                <h2>🔔 Recent Notifications</h2>
                <div className="card-content">
                  <div className="notifications-list">
                    {stats.notifications.map(n => (
                      <div className={`notification-item ${n.type}`} key={n.id}>
                        <p className="notif-text">{n.text}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 6. Quick Actions */}
              <section className="dashboard-card widget-actions">
                <h2>⚡ Quick Actions</h2>
                <div className="card-content actions-grid">
                  {user.role === 'landlord' ? (
                    <>
                      <button className="action-btn animate-btn" onClick={() => setActiveSubTab('properties')}>
                        🏢 Manage Properties list
                      </button>
                      <button className="action-btn animate-btn" onClick={fetchStats}>
                        🔄 Refresh Statistics
                      </button>
                      <div className="action-info-box">
                        <p className="action-tip">Tip: Double click any property card to view rooms and assigned leases.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <button className="action-btn animate-btn" onClick={() => setShowMaintModal(true)}>
                        🛠️ Submit Maintenance Ticket
                      </button>
                      <button className="action-btn animate-btn" onClick={fetchStats}>
                        🔄 Refresh Statistics
                      </button>
                      <div className="action-info-box">
                        <p className="action-tip">Tip: Confirm rent invoices under the Billing section.</p>
                      </div>
                    </>
                  )}
                </div>
              </section>

            </main>
          )}

          {/* TAB 2: PROPERTIES FLOW PANELS */}
          {activeSubTab === 'properties' && (
            <main className="dashboard-flow-content">
              {selectedPropertyId ? (
                <PropertyDetails 
                  propertyId={selectedPropertyId}
                  user={user}
                  onBackToList={() => setSelectedPropertyId(null)}
                />
              ) : (
                <PropertyList 
                  properties={stats.properties}
                  user={user}
                  onSelectProperty={setSelectedPropertyId}
                  onRefresh={fetchStats}
                />
              )}
            </main>
          )}
        </>
      )}

      {/* Maintenance Request Modal (Quick Action) */}
      {showMaintModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Submit Maintenance Ticket</h3>
              <button className="close-modal-btn" onClick={() => setShowMaintModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}
            
            <form onSubmit={handleMaintSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Property</label>
                <select
                  value={maintForm.propertyId}
                  onChange={(e) => setMaintForm({ ...maintForm, propertyId: e.target.value })}
                  disabled={formLoading}
                  required
                >
                  <option value="">-- Choose Rented Unit --</option>
                  {stats.properties.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ticket Title</label>
                <input
                  type="text"
                  placeholder="Sink clog / Light fixture broken"
                  value={maintForm.title}
                  onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Detail the issue..."
                  value={maintForm.description}
                  onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                  disabled={formLoading}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={maintForm.priority}
                  onChange={(e) => setMaintForm({ ...maintForm, priority: e.target.value })}
                  disabled={formLoading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <button type="submit" className="auth-btn" disabled={formLoading}>
                {formLoading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard;
