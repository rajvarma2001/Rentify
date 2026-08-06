import { useState, useEffect } from 'react'
import axios from 'axios'
const axiosInstance = axios;
import './TenantDetails.css'

function TenantDetails({ tenantId, user, onBackToList }) {
  const [data, setData] = useState({
    tenant: null,
    property: null,
    payments: [],
    maintenance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab states: 'overview' | 'info' | 'property' | 'rent' | 'documents' | 'maintenance'
  const [activeTab, setActiveTab] = useState('overview');

  // Landlord Actions State
  const [propertiesList, setPropertiesList] = useState([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({
    amount: '',
    dueDate: ''
  });

  const [documentInput, setDocumentInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Details
  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/api/dashboard/tenants/${tenantId}`);
      if (response.data.status === 'success') {
        setData({
          tenant: response.data.tenant,
          property: response.data.property || null,
          payments: response.data.payments || [],
          maintenance: response.data.maintenance || []
        });
      } else {
        setError('Error fetching tenant details.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to database.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch landlord's properties (for assigning to tenant)
  const fetchProperties = async () => {
    try {
      const response = await axiosInstance.get(`/api/dashboard/stats?userId=${user.id}&role=landlord`);
      if (response.data.status === 'success') {
        setPropertiesList(response.data.properties || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchProperties();
  }, [tenantId]);

  // Toggle Tenant Status (Landlord Only)
  const handleToggleStatus = async () => {
    setActionLoading(true);
    const newStatus = data.tenant.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const response = await axiosInstance.put(`/api/dashboard/tenants/${tenantId}`, {
        status: newStatus
      });
      if (response.data.status === 'success') {
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Property Lease (Landlord Only)
  const handleAssignProperty = async (propertyId) => {
    if (!propertyId) return;
    setActionLoading(true);
    try {
      const payload = {
        assignedTenant: tenantId,
        leaseStart: new Date(),
        leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year lease
      };
      
      const response = await axiosInstance.put(`/api/dashboard/properties/${propertyId}`, payload);
      if (response.data.status === 'success') {
        alert('Tenant successfully leased to property!');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error leasing property.');
    } finally {
      setActionLoading(false);
    }
  };

  // Release Lease (Landlord Only)
  const handleReleaseProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to terminate this lease assignment?')) return;
    setActionLoading(true);
    try {
      const payload = {
        assignedTenant: '', // clears assigned tenant
        leaseStart: null,
        leaseEnd: null
      };
      
      const response = await axiosInstance.put(`/api/dashboard/properties/${propertyId}`, payload);
      if (response.data.status === 'success') {
        alert('Lease terminated.');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error terminating lease.');
    } finally {
      setActionLoading(false);
    }
  };

  // Process Issue Rent Invoice (Landlord Only)
  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!billForm.amount || !billForm.dueDate) {
      alert('Please enter amount and due date.');
      return;
    }
    if (!data.property) {
      alert('Must assign a property to tenant before billing.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axiosInstance.post('/api/dashboard/payments', {
        tenantId,
        propertyId: data.property._id,
        amount: Number(billForm.amount),
        dueDate: billForm.dueDate
      });
      if (response.data.status === 'success') {
        setShowBillModal(false);
        setBillForm({ amount: '', dueDate: '' });
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error creating invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  // Document attachments (Simulated document database changes)
  // Documents are stored under the assigned Property document for unified lease vaults
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!documentInput.trim() || !data.property) return;
    setActionLoading(true);
    try {
      const updatedDocs = [...(data.property.documents || []), documentInput.trim()];
      const response = await axiosInstance.put(`/api/dashboard/properties/${data.property._id}`, {
        documents: updatedDocs
      });
      if (response.data.status === 'success') {
        setDocumentInput('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading document.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="details-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching tenant records...</p>
      </div>
    );
  }

  if (error || !data.tenant) {
    return (
      <div className="details-error-box">
        <p>{error || 'Tenant not found.'}</p>
        <button className="back-list-btn" onClick={onBackToList}>← Back to List</button>
      </div>
    );
  }

  const { tenant, property, payments, maintenance } = data;

  return (
    <div className="tenant-details-wrapper">
      
      {/* Navigation Header */}
      <div className="details-header-row">
        <button className="back-list-btn" onClick={onBackToList}>
          ← Back to Tenants
        </button>
        <div className="tenant-badge-header">
          <span className={`badge-status ${tenant.status.toLowerCase()}`}>{tenant.status}</span>
          <h2>{tenant.name}</h2>
          <p className="email-label">📧 {tenant.email}</p>
        </div>
      </div>

      <div className="details-layout-grid">
        
        {/* Main Details Body */}
        <div className="details-main-content">
          
          {/* Tab Navigation */}
          <div className="details-tabs-nav">
            <button 
              className={`tab-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              🏠 Overview
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              👤 Personal Info
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'property' ? 'active' : ''}`}
              onClick={() => setActiveTab('property')}
            >
              🏠 Assigned Property
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'rent' ? 'active' : ''}`}
              onClick={() => setActiveTab('rent')}
            >
              💳 Rent History ({payments.length})
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              📁 Documents
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              🛠️ Requests ({maintenance.length})
            </button>
          </div>

          {/* TAB 0: Overview Summary */}
          {activeTab === 'overview' && (
            <div className="tab-pane-card overview-tab-pane animate-fade">
              <h3>Tenant Overview Summary</h3>
              <p className="tab-pane-desc">Core parameters, financial status, and lease coverage at a glance.</p>
              
              <div className="overview-cards-container">
                
                {/* Card 1: Profile Summary */}
                <div className="overview-sub-card profile-summary">
                  <div className="avatar-large">👤</div>
                  <h4>{tenant.name}</h4>
                  <span className={`status-badge-lbl ${tenant.status.toLowerCase()}`}>
                    {tenant.status}
                  </span>
                  <p className="joined-meta">Member since {new Date(tenant.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Card 2: Financial Summary */}
                <div className="overview-sub-card financial-card">
                  <h4>💳 Financial Status</h4>
                  <div className="sidebar-info-row">
                    <span className="label">Total Rent Paid</span>
                    <span className="val green-val">${payments.filter(p => p.status === 'paid').reduce((a, c) => a + c.amount, 0)}</span>
                  </div>
                  <div className="sidebar-info-row">
                    <span className="label">Outstanding Dues</span>
                    <span className={`val ${payments.filter(p => p.status !== 'paid').reduce((a, c) => a + c.amount, 0) > 0 ? 'red-val' : 'green-val'}`}>
                      ${payments.filter(p => p.status !== 'paid').reduce((a, c) => a + c.amount, 0)}
                    </span>
                  </div>
                  {payments.filter(p => p.status !== 'paid').length > 0 ? (
                    <div className="unpaid-alert-badge">
                      ⚠️ {payments.filter(p => p.status !== 'paid').length} Outstanding Invoices
                    </div>
                  ) : (
                    <div className="unpaid-alert-badge success">
                      ✓ Account is in good standing
                    </div>
                  )}
                </div>

                {/* Card 3: Active Lease Coverage */}
                <div className="overview-sub-card lease-timeline-card">
                  <h4>📜 Lease Coverage</h4>
                  <div className="sidebar-info-row">
                    <span className="label">Assigned Suite</span>
                    <span className="val">{property ? property.name : 'No Active Lease'}</span>
                  </div>
                  {property ? (
                    <>
                      <div className="sidebar-info-row">
                        <span className="label">Monthly Rent</span>
                        <span className="val">${property.rentAmount}/mo</span>
                      </div>
                      <div className="lease-progress-section">
                        <div className="progress-labels">
                          <span className="progress-label-lbl">Term Progress</span>
                          <span className="progress-percent-lbl">
                            {(() => {
                              const start = new Date(property.leaseStart).getTime();
                              const end = new Date(property.leaseEnd).getTime();
                              const now = Date.now();
                              if (now < start) return '0%';
                              if (now > end) return '100%';
                              return `${Math.round(((now - start) / (end - start)) * 100)}%`;
                            })()}
                          </span>
                        </div>
                        <div className="lease-progress-bar-container">
                          <div 
                            className="lease-progress-bar-fill" 
                            style={{ 
                              width: (() => {
                                const start = new Date(property.leaseStart).getTime();
                                const end = new Date(property.leaseEnd).getTime();
                                const now = Date.now();
                                if (now < start) return '0%';
                                if (now > end) return '100%';
                                return `${Math.round(((now - start) / (end - start)) * 100)}%`;
                              })()
                            }}
                          ></div>
                        </div>
                        <div className="date-labels">
                          <span>{new Date(property.leaseStart).toLocaleDateString()}</span>
                          <span>{new Date(property.leaseEnd).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="unlease-prompt">
                      <p>No active rental agreement is currently linked to this tenant account.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 1: Personal Info */}
          {activeTab === 'info' && (
            <div className="tab-pane-card animate-fade">
              <h3>Personal Profile Information</h3>
              <p className="tab-pane-desc">Core registry parameters and account statuses.</p>
              
              <div className="info-sheet">
                <div className="info-sheet-row">
                  <span className="label">Registered Name</span>
                  <span className="value">{tenant.name}</span>
                </div>
                <div className="info-sheet-row">
                  <span className="label">Email Address</span>
                  <span className="value">{tenant.email}</span>
                </div>
                <div className="info-sheet-row">
                  <span className="label">Phone Number</span>
                  <span className="value">{tenant.phone || 'No phone number on record'}</span>
                </div>
                <div className="info-sheet-row">
                  <span className="label">Account Status</span>
                  <span className={`value status-lbl ${tenant.status.toLowerCase()}`}>{tenant.status}</span>
                </div>
                <div className="info-sheet-row">
                  <span className="label">Joined Date</span>
                  <span className="value">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="account-controls">
                <h4>Registry Actions</h4>
                <button 
                  className={`status-toggle-btn ${tenant.status === 'Active' ? 'suspend' : 'activate'}`}
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                >
                  {tenant.status === 'Active' ? '⛔ Suspend Tenant Account' : '✓ Activate Tenant Account'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Assigned Property */}
          {activeTab === 'property' && (
            <div className="tab-pane-card animate-fade">
              <h3>Leased Property Assignment</h3>
              
              {!property ? (
                <div className="vacant-assign-container">
                  <div className="empty-lease-box">
                    <span className="empty-icon">🏠</span>
                    <p>This tenant does not currently hold a lease on any property.</p>
                  </div>

                  <div className="property-assign-card">
                    <h4>Lease a Property to {tenant.name}</h4>
                    <p className="tab-pane-desc">Select one of your vacant properties to establish a lease agreement.</p>
                    
                    <div className="assign-controls">
                      <select
                        onChange={(e) => handleAssignProperty(e.target.value)}
                        defaultValue=""
                        disabled={actionLoading}
                      >
                        <option value="" disabled>-- Select Vacant Property --</option>
                        {propertiesList
                          .filter(p => !p.assignedTenant)
                          .map(p => (
                            <option key={p._id} value={p._id}>{p.name} (${p.rentAmount}/mo)</option>
                          ))
                        }
                      </select>
                      {propertiesList.filter(p => !p.assignedTenant).length === 0 && (
                        <p className="warning-text">⚠️ All your properties are currently occupied.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="leased-property-box">
                  <div className="leased-details-card">
                    <div className="leased-header">
                      <span className="building-icon">🏢</span>
                      <div>
                        <h4>{property.name}</h4>
                        <p>📍 {property.address}</p>
                      </div>
                    </div>

                    <div className="leased-meta-grid">
                      <div className="meta-cell">
                        <span className="lbl">Monthly Rent</span>
                        <span className="val">${property.rentAmount}/mo</span>
                      </div>
                      <div className="meta-cell">
                        <span className="lbl">Lease Start</span>
                        <span className="val">
                          {property.leaseStart ? new Date(property.leaseStart).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="meta-cell">
                        <span className="lbl">Lease End</span>
                        <span className="val">
                          {property.leaseEnd ? new Date(property.leaseEnd).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <button 
                      className="release-lease-btn"
                      onClick={() => handleReleaseProperty(property._id)}
                      disabled={actionLoading}
                    >
                      Terminated Leased Agreement
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Rent History */}
          {activeTab === 'rent' && (
            <div className="tab-pane-card animate-fade">
              <div className="pane-header-action">
                <h3>Rent Invoices & Bills</h3>
                {property && (
                  <button className="issue-bill-btn" onClick={() => setShowBillModal(true)}>
                    ➕ Issue Rent Bill
                  </button>
                )}
              </div>

              {!property && (
                <p className="warning-note">⚠️ You must assign a property lease before you can issue invoices.</p>
              )}

              {payments.length === 0 ? (
                <p className="empty-tab-text">No invoices issued for this tenant.</p>
              ) : (
                <div className="table-responsive">
                  <table className="details-payments-table">
                    <thead>
                      <tr>
                        <th>Due Date</th>
                        <th>Property</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Paid Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p._id}>
                          <td>{new Date(p.dueDate).toLocaleDateString()}</td>
                          <td>{p.property?.name?.substring(0, 20)}...</td>
                          <td className="table-amt">${p.amount}</td>
                          <td>
                            <span className={`table-badge-status ${p.status.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Documents */}
          {activeTab === 'documents' && (
            <div className="tab-pane-card animate-fade">
              <h3>Shared Tenant Documents</h3>
              <p className="tab-pane-desc">Rental background clearances, ID cards, and signed contracts.</p>

              {!property ? (
                <p className="warning-note">⚠️ Tenant must be assigned to a property to activate the documents folder.</p>
              ) : (
                <>
                  <form onSubmit={handleAddDocument} className="document-upload-form">
                    <input
                      type="text"
                      placeholder="Add document entry (e.g. John_Insurance_Policy.pdf)"
                      value={documentInput}
                      onChange={(e) => setDocumentInput(e.target.value)}
                      disabled={actionLoading}
                      required
                    />
                    <button type="submit" disabled={actionLoading}>
                      📁 Upload File
                    </button>
                  </form>

                  {(!property.documents || property.documents.length === 0) ? (
                    <p className="empty-tab-text">No documents stored in tenant vault.</p>
                  ) : (
                    <div className="documents-list-box">
                      {property.documents.map((doc, idx) => (
                        <div className="document-item-line" key={idx}>
                          <div className="doc-meta">
                            <span className="doc-icon">📄</span>
                            <span className="doc-name">{doc}</span>
                          </div>
                          <div className="doc-actions">
                            <a 
                              href="#"
                              className="doc-download-mock" 
                              onClick={(e) => { e.preventDefault(); alert(`Simulating file download: ${doc}`); }}
                            >
                              Download
                            </a>
                            <button 
                              className="doc-delete-btn"
                              onClick={() => handleDeleteDocument(idx)}
                              disabled={actionLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 5: Maintenance Requests */}
          {activeTab === 'maintenance' && (
            <div className="tab-pane-card animate-fade">
              <h3>Maintenance Ticket Logs</h3>
              <p className="tab-pane-desc">Repairs and structural complaints raised by {tenant.name}.</p>

              {maintenance.length === 0 ? (
                <p className="empty-tab-text">✓ Tenant has filed zero maintenance tickets.</p>
              ) : (
                <div className="maintenance-details-list">
                  {maintenance.map(r => (
                    <div className="maintenance-item-row" key={r._id}>
                      <div className="item-header">
                        <span className="item-title">{r.title}</span>
                        <span className={`priority-tag ${r.priority.toLowerCase()}`}>
                          {r.priority}
                        </span>
                      </div>
                      <p className="item-desc">{r.description}</p>
                      <div className="item-footer">
                        <span className="item-user">Suite: {r.property?.name || 'Assigned Suite'}</span>
                        <span className={`status-badge-tag ${r.status.replace('-', '')}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>


      {/* ----------------------------------------------------
         MODAL: ISSUE RENT BILL
      ---------------------------------------------------- */}
      {showBillModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Issue Rent Invoice</h3>
              <button className="close-modal-btn" onClick={() => setShowBillModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateInvoiceSubmit} className="modal-form">
              <div className="form-group">
                <label>Rental Bill Amount ($)</label>
                <input
                  type="number"
                  placeholder={property?.rentAmount || '1200'}
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  disabled={actionLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Invoice Due Date</label>
                <input
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                  disabled={actionLoading}
                  required
                />
              </div>

              <button type="submit" className="auth-btn" disabled={actionLoading}>
                {actionLoading ? 'Issuing...' : 'Issue Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default TenantDetails;
