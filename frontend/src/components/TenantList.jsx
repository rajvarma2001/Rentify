import { useState, useEffect } from 'react'
import axios from 'axios'
import './TenantList.css'

function TenantList({ onSelectTenant }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Forms state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'Active'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Tenants List
  const fetchTenants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/dashboard/tenants');
      if (response.data.status === 'success') {
        setTenants(response.data.tenants || []);
      } else {
        setError('Error fetching tenants list.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Open Add modal
  const handleOpenAdd = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      status: 'Active'
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (tenant) => {
    setSelectedTenant(tenant);
    setForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      password: '', // reset password field
      status: tenant.status || 'Active'
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Submit Add Tenant
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setFormError('Name and Email are required.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.post('/api/dashboard/tenants', form);
      if (response.data.status === 'success') {
        setShowAddModal(false);
        fetchTenants();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error registering tenant.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Edit Tenant
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setFormError('Name and Email are required.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.put(`/api/dashboard/tenants/${selectedTenant._id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        status: form.status
      });
      if (response.data.status === 'success') {
        setShowEditModal(false);
        fetchTenants();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error updating tenant info.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Tenant
  const handleDelete = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant user account? This will unassign them from any properties leased.')) return;
    try {
      const response = await axios.delete(`/api/dashboard/tenants/${tenantId}`);
      if (response.data.status === 'success') {
        alert('Tenant account deleted.');
        fetchTenants();
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting tenant account.');
    }
  };

  if (loading) {
    return (
      <div className="tenants-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching tenants records...</p>
      </div>
    );
  }

  return (
    <div className="tenant-list-wrapper">
      <div className="list-header-row">
        <h2>👥 Leased Tenants ({tenants.length})</h2>
        <button className="add-tenant-header-btn" onClick={handleOpenAdd}>
          ➕ Add Tenant
        </button>
      </div>

      {error && <div className="error-alert max-width-1000">{error}</div>}

      {tenants.length === 0 ? (
        <div className="empty-tenants-box">
          <span className="empty-icon">👥</span>
          <p>No tenant accounts registered in your workspace.</p>
          <button className="cta-primary" onClick={handleOpenAdd}>Register Your First Tenant</button>
        </div>
      ) : (
        <div className="tenants-grid-layout">
          {tenants.map(t => (
            <div className="tenant-grid-card" key={t._id}>
              <div className="tenant-card-header">
                <span className="avatar">👤</span>
                <span className={`status-badge-lbl ${t.status.toLowerCase()}`}>
                  {t.status}
                </span>
              </div>

              <div className="tenant-card-body">
                <div className="tenant-details-info">
                  <h3 className="tenant-name-lbl">{t.name}</h3>
                  <span className="joined-label">Joined: {new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="tenant-details-contact">
                  <p className="tenant-meta-text">📧 {t.email}</p>
                  <p className="tenant-meta-text">📞 {t.phone || 'No phone registered'}</p>
                </div>
              </div>

              <div className="tenant-card-actions">
                <button 
                  className="action-view-btn" 
                  onClick={() => onSelectTenant(t._id)}
                >
                  View Details
                </button>
                <button className="action-edit-btn" onClick={() => handleOpenEdit(t)}>
                  Edit
                </button>
                <button className="action-delete-btn" onClick={() => handleDelete(t._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* ----------------------------------------------------
         MODAL: ADD TENANT
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register New Tenant</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}
            
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+1-555-0100"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label>Password (Default: password123)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  disabled={formLoading}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <button type="submit" className="auth-btn" disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Tenant'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ----------------------------------------------------
         MODAL: EDIT TENANT
      ---------------------------------------------------- */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Tenant Profile</h3>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}
            
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  disabled={formLoading}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <button type="submit" className="auth-btn" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default TenantList;
