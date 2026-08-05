import { useState, useEffect } from 'react'
import axios from 'axios'
import './MaintenanceList.css'

function MaintenanceList({ user, onSelectRequest }) {
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);

  // Forms state
  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyId: '',
    priority: 'medium',
    status: 'pending',
    assignedWorker: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Requests
  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const url = user.role === 'landlord' 
        ? `/api/dashboard/maintenance?landlordId=${user.id}`
        : `/api/dashboard/maintenance?tenantId=${user.id}`;
      const response = await axios.get(url);
      if (response.data.status === 'success') {
        setRequests(response.data.requests || []);
      } else {
        setError('Error fetching maintenance requests.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch properties for adding requests (Tenant needs their assigned property)
  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats?userId=' + user.id + '&role=' + user.role);
      if (response.data.status === 'success') {
        setProperties(response.data.properties || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProperties();
  }, [user.id]);

  // Open Create request modal
  const handleOpenAdd = () => {
    setForm({
      title: '',
      description: '',
      propertyId: properties[0]?._id || '',
      priority: 'medium',
      status: 'pending',
      assignedWorker: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit status/worker modal (Landlord action)
  const handleOpenEdit = (req) => {
    setActiveRequest(req);
    setForm({
      title: req.title,
      description: req.description,
      propertyId: req.property?._id || req.property || '',
      priority: req.priority || 'medium',
      status: req.status || 'pending',
      assignedWorker: req.assignedWorker || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Submit Create request (Tenant action)
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.propertyId) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.post('/api/dashboard/maintenance', {
        title: form.title,
        description: form.description,
        propertyId: form.propertyId,
        tenantId: user.id,
        priority: form.priority
      });
      if (response.data.status === 'success') {
        setShowAddModal(false);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error submitting request.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Update request status/worker (Landlord action)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.put(`/api/dashboard/maintenance/${activeRequest._id}`, {
        status: form.status,
        priority: form.priority,
        assignedWorker: form.assignedWorker,
        description: form.description
      });
      if (response.data.status === 'success') {
        setShowEditModal(false);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error updating request details.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="maintenance-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching maintenance requests logs...</p>
      </div>
    );
  }

  return (
    <div className="maintenance-list-wrapper">
      <div className="list-header-row">
        <h2>🛠️ Maintenance Requests ({requests.length})</h2>
        {user.role === 'tenant' && (
          <button className="add-request-header-btn" onClick={handleOpenAdd}>
            ➕ New Request
          </button>
        )}
      </div>

      {error && <div className="error-alert max-width-1000">{error}</div>}

      {requests.length === 0 ? (
        <div className="empty-requests-box">
          <span className="empty-icon">🛠️</span>
          <p>No active maintenance tickets on record.</p>
          {user.role === 'tenant' && (
            <button className="cta-primary" onClick={handleOpenAdd}>File Your First Ticket</button>
          )}
        </div>
      ) : (
        <div className="requests-vertical-layout">
          {requests.map(r => (
            <div className={`request-row-card ${r.status}`} key={r._id}>
              {/* Far Left: Status & Priority badges */}
              <div className="request-card-header">
                <span className={`status-badge-lbl ${r.status}`}>
                  {r.status === 'in-progress' ? 'In Progress' : r.status}
                </span>
                <span className={`priority-badge-lbl ${r.priority}`}>
                  {r.priority} Priority
                </span>
              </div>

              {/* Center left: Details */}
              <div className="request-card-body">
                <div className="request-details-info">
                  <h3 className="request-title-lbl">{r.title}</h3>
                  <p className="request-desc-lbl">{r.description.substring(0, 100)}{r.description.length > 100 ? '...' : ''}</p>
                </div>
                <div className="request-details-meta">
                  <p className="meta-text">🏢 Property: {r.property?.name || 'N/A'}</p>
                  <p className="meta-text">👤 Tenant: {r.tenant?.name || 'N/A'}</p>
                  <p className="meta-text">📅 Filed: {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="request-details-assignment">
                  <p className="worker-info-text">
                    👷 Worker Assigned: <span className="worker-val">{r.assignedWorker || 'Unassigned'}</span>
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="request-card-actions">
                <button 
                  className="action-view-btn" 
                  onClick={() => onSelectRequest(r._id)}
                >
                  View Details
                </button>
                {user.role === 'landlord' && (
                  <button className="action-edit-btn" onClick={() => handleOpenEdit(r)}>
                    Assign & Update
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------
         MODAL: CREATE MAINTENANCE REQUEST
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Submit Maintenance Request</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}

            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Issue Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kitchen sink leakage"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description details *</label>
                <textarea 
                  rows="4"
                  placeholder="Describe the issue in detail..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Property Association *</label>
                <select 
                  value={form.propertyId}
                  onChange={e => setForm(prev => ({ ...prev, propertyId: e.target.value }))}
                  required
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map(p => (
                    <option value={p._id} key={p._id}>{p.name} - {p.address}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select 
                  value={form.priority}
                  onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <button className="auth-btn" type="submit" disabled={formLoading}>
                {formLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         MODAL: ASSIGN WORKER & UPDATE STATUS
      ---------------------------------------------------- */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Manage Request Ticket</h3>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}

            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Request Title</label>
                <input type="text" value={form.title} disabled />
              </div>

              <div className="form-group">
                <label>Assign Maintenance Worker</label>
                <input 
                  type="text" 
                  placeholder="Enter worker's full name"
                  value={form.assignedWorker}
                  onChange={e => setForm(prev => ({ ...prev, assignedWorker: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Update Request Status</label>
                <select 
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="form-group">
                <label>Update Priority</label>
                <select 
                  value={form.priority}
                  onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <button className="auth-btn" type="submit" disabled={formLoading}>
                {formLoading ? 'Updating ticket...' : 'Save Ticket Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenanceList;
