import { useState, useEffect } from 'react'
import axios from 'axios'
import './LeaseList.css'

function LeaseList({ user, onSelectLease }) {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);

  // Dropdown lists
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);

  // Form states
  const [form, setForm] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    terms: ''
  });

  const [renewalDate, setRenewalDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch all Leases
  const fetchLeases = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/dashboard/leases');
      if (response.data.status === 'success') {
        setLeases(response.data.leases || []);
      } else {
        setError('Error retrieving leases.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown helper data
  const fetchDropdowns = async () => {
    try {
      // Fetch tenants
      const tenantsRes = await axios.get('/api/auth/tenants');
      if (tenantsRes.data.status === 'success') {
        setTenants(tenantsRes.data.tenants || []);
      }
      // Fetch landlord's properties
      const propsRes = await axios.get(`/api/dashboard/stats?userId=${user.id}&role=landlord`);
      if (propsRes.data.status === 'success') {
        setProperties(propsRes.data.properties || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeases();
    fetchDropdowns();
  }, [user]);

  // Open Add modal
  const handleOpenAdd = () => {
    setForm({
      propertyId: '',
      tenantId: '',
      startDate: '',
      endDate: '',
      monthlyRent: '',
      terms: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (lease) => {
    setSelectedLease(lease);
    setForm({
      propertyId: lease.property?._id || '',
      tenantId: lease.tenant?._id || '',
      startDate: lease.startDate ? lease.startDate.split('T')[0] : '',
      endDate: lease.endDate ? lease.endDate.split('T')[0] : '',
      monthlyRent: lease.monthlyRent || '',
      terms: lease.terms || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Open Renew modal
  const handleOpenRenew = (lease) => {
    setSelectedLease(lease);
    setRenewalDate('');
    setFormError('');
    setShowRenewModal(true);
  };

  // Submit Create Lease
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.propertyId || !form.tenantId || !form.startDate || !form.endDate || !form.monthlyRent) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.post('/api/dashboard/leases', form);
      if (response.data.status === 'success') {
        setShowAddModal(false);
        fetchLeases();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error creating lease.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Edit Lease
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!form.monthlyRent || !form.startDate || !form.endDate) {
      setFormError('Missing required dates or rent amount.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.put(`/api/dashboard/leases/${selectedLease._id}`, {
        monthlyRent: form.monthlyRent,
        terms: form.terms,
        startDate: form.startDate,
        endDate: form.endDate
      });
      if (response.data.status === 'success') {
        setShowEditModal(false);
        fetchLeases();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error updating lease.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Renew Lease
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewalDate) {
      setFormError('Please select new expiration date.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.post(`/api/dashboard/leases/${selectedLease._id}/renew`, {
        newEndDate: renewalDate
      });
      if (response.data.status === 'success') {
        setShowRenewModal(false);
        fetchLeases();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error renewing lease.');
    } finally {
      setFormLoading(false);
    }
  };

  // Terminate Lease
  const handleTerminate = async (leaseId) => {
    if (!window.confirm('Are you sure you want to terminate this lease early? This sets the property status back to Vacant.')) return;
    try {
      const response = await axios.post(`/api/dashboard/leases/${leaseId}/terminate`);
      if (response.data.status === 'success') {
        alert('Lease terminated successfully.');
        fetchLeases();
      }
    } catch (err) {
      console.error(err);
      alert('Error terminating lease.');
    }
  };

  if (loading) {
    return (
      <div className="leases-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching lease registers...</p>
      </div>
    );
  }

  // Filter vacant properties to show in Create Lease dropdown
  const vacantProperties = properties.filter(p => !p.assignedTenant);

  return (
    <div className="lease-list-wrapper">
      <div className="list-header-row">
        <h2>📝 Rental Leases ({leases.length})</h2>
        <button className="add-lease-header-btn" onClick={handleOpenAdd}>
          ➕ Create Lease
        </button>
      </div>

      {error && <div className="error-alert max-width-1000">{error}</div>}

      {leases.length === 0 ? (
        <div className="empty-leases-box">
          <span className="empty-icon">📝</span>
          <p>No active rental lease agreements on record.</p>
          <button className="cta-primary" onClick={handleOpenAdd}>Draft Your First Lease</button>
        </div>
      ) : (
        <div className="leases-grid-layout">
          {leases.map(l => (
            <div className={`lease-grid-card ${l.status.toLowerCase()}`} key={l._id}>
              <div className="lease-card-header">
                <span className="badge-type">{l.property?.type || 'Property'}</span>
                <span className={`status-badge-lbl ${l.status.toLowerCase()}`}>
                  {l.status}
                </span>
              </div>

              <div className="lease-card-body">
                <h3 className="property-name-lbl">{l.property?.name || 'Deleted Property'}</h3>
                <p className="lease-meta-text">👤 Tenant: {l.tenant?.name || 'N/A'}</p>
                <p className="lease-meta-text">💵 Monthly Rent: ${l.monthlyRent}/mo</p>
                <p className="lease-meta-text">📅 Starts: {new Date(l.startDate).toLocaleDateString()}</p>
                <p className="lease-meta-text font-bold">⌛ Expires: {new Date(l.endDate).toLocaleDateString()}</p>
              </div>

              <div className="lease-card-actions">
                <button 
                  className="action-view-btn" 
                  onClick={() => onSelectLease(l._id)}
                >
                  View Details
                </button>
                {l.status !== 'Terminated' && l.status !== 'Expired' && (
                  <>
                    <button className="action-edit-btn" onClick={() => handleOpenEdit(l)}>
                      Edit
                    </button>
                    <button className="action-renew-btn" onClick={() => handleOpenRenew(l)}>
                      Renew
                    </button>
                    <button className="action-terminate-btn" onClick={() => handleTerminate(l._id)}>
                      Terminate
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* ----------------------------------------------------
         MODAL: CREATE LEASE
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create Lease Agreement</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}
            
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Property *</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  disabled={formLoading}
                  required
                >
                  <option value="">-- Choose Vacant Unit --</option>
                  {vacantProperties.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (${p.rentAmount}/mo)</option>
                  ))}
                </select>
                {vacantProperties.length === 0 && (
                  <p className="field-tip warning">⚠️ Register a vacant property first.</p>
                )}
              </div>

              <div className="form-group">
                <label>Select Tenant *</label>
                <select
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                  disabled={formLoading}
                  required
                >
                  <option value="">-- Choose Leased Tenant --</option>
                  {tenants.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-row-double">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    disabled={formLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Monthly Rent Rate ($) *</label>
                <input
                  type="number"
                  placeholder="1200"
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Lease Terms & Conditions</label>
                <textarea
                  rows="2"
                  placeholder="Terms (e.g. utilities paid by tenant, no pets allowed...)"
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  disabled={formLoading}
                ></textarea>
              </div>

              <button type="submit" className="auth-btn" disabled={formLoading}>
                {formLoading ? 'Creating Lease...' : 'Establish Lease'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ----------------------------------------------------
         MODAL: EDIT LEASE
      ---------------------------------------------------- */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Lease Agreement</h3>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}
            
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Monthly Rent ($) *</label>
                <input
                  type="number"
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-row-double">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    disabled={formLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Terms & Conditions</label>
                <textarea
                  rows="3"
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  disabled={formLoading}
                ></textarea>
              </div>

              <button type="submit" className="auth-btn" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ----------------------------------------------------
         MODAL: RENEW LEASE
      ---------------------------------------------------- */}
      {showRenewModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Renew Lease Contract</h3>
              <button className="close-modal-btn" onClick={() => setShowRenewModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}
            
            <form onSubmit={handleRenewSubmit} className="modal-form">
              <div className="form-group">
                <label>Current Lease Expiration Date</label>
                <input
                  type="text"
                  value={selectedLease ? new Date(selectedLease.endDate).toLocaleDateString() : ''}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Select New Expiration Date *</label>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>

              <button type="submit" className="auth-btn" disabled={formLoading}>
                {formLoading ? 'Renewing...' : 'Extend Lease'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default LeaseList;
