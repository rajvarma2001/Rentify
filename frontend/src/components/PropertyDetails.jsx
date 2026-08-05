import { useState, useEffect } from 'react'
import axios from 'axios'
import './PropertyDetails.css'

function PropertyDetails({ propertyId, user, onBackToList }) {
  const [data, setData] = useState({
    property: null,
    payments: [],
    maintenance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab states: 'rooms' | 'tenant' | 'rent' | 'maintenance' | 'documents'
  const [activeTab, setActiveTab] = useState('rooms');

  // Interactive actions state
  const [tenantsList, setTenantsList] = useState([]);
  const [assignForm, setAssignForm] = useState({
    tenantId: '',
    leaseStart: '',
    leaseEnd: ''
  });
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [documentInput, setDocumentInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Details
  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/properties/${propertyId}`);
      if (response.data.status === 'success') {
        setData({
          property: response.data.property,
          payments: response.data.payments || [],
          maintenance: response.data.maintenance || []
        });
        
        // Setup initial assign form state if tenant already assigned
        if (response.data.property.assignedTenant) {
          setAssignForm({
            tenantId: response.data.property.assignedTenant._id || '',
            leaseStart: response.data.property.leaseStart ? response.data.property.leaseStart.split('T')[0] : '',
            leaseEnd: response.data.property.leaseEnd ? response.data.property.leaseEnd.split('T')[0] : ''
          });
        }
      } else {
        setError('Error fetching property details.');
      }
    } catch (err) {
      console.error(err);
      setError(`Could not connect to database. Details: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tenants dropdown list (for landlords)
  const fetchTenants = async () => {
    try {
      const response = await axios.get('/api/auth/tenants');
      if (response.data.status === 'success') {
        setTenantsList(response.data.tenants || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetails();
    if (user.role === 'landlord') {
      fetchTenants();
    }
  }, [propertyId]);

  // Room Form Modal states
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoomIdx, setEditingRoomIdx] = useState(null); // null if adding, number if editing
  const [roomForm, setRoomForm] = useState({ roomNumber: '', size: '' });

  // Open Room Modal
  const openRoomModal = (roomIdx = null) => {
    if (roomIdx !== null) {
      setEditingRoomIdx(roomIdx);
      const targetRoom = data.property.rooms[roomIdx];
      setRoomForm({
        roomNumber: targetRoom.roomNumber,
        size: targetRoom.size
      });
    } else {
      setEditingRoomIdx(null);
      setRoomForm({ roomNumber: '', size: '' });
    }
    setShowRoomModal(true);
  };

  // Submit Room (Add or Edit)
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (user.role !== 'landlord') return;
    setActionLoading(true);
    try {
      const updatedRooms = [...data.property.rooms];
      if (editingRoomIdx !== null) {
        updatedRooms[editingRoomIdx] = {
          ...updatedRooms[editingRoomIdx],
          roomNumber: roomForm.roomNumber,
          size: roomForm.size
        };
      } else {
        updatedRooms.push({
          roomNumber: roomForm.roomNumber,
          size: roomForm.size,
          status: 'Vacant'
        });
      }

      const response = await axios.put(`/api/dashboard/properties/${propertyId}`, {
        rooms: updatedRooms
      });
      if (response.data.status === 'success') {
        setShowRoomModal(false);
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error saving room details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Room Unit
  const handleDeleteRoom = async (roomIdx) => {
    if (user.role !== 'landlord') return;
    if (!window.confirm('Are you sure you want to delete this room unit?')) return;
    setActionLoading(true);
    try {
      const updatedRooms = [...data.property.rooms];
      updatedRooms.splice(roomIdx, 1);
      
      const response = await axios.put(`/api/dashboard/properties/${propertyId}`, {
        rooms: updatedRooms
      });
      if (response.data.status === 'success') {
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting room.');
    } finally {
      setActionLoading(false);
    }
  };

  // Set explicit status for a room unit
  const handleSetRoomStatus = async (roomIdx, targetStatus) => {
    if (user.role !== 'landlord') return;
    setActionLoading(true);
    try {
      const updatedRooms = [...data.property.rooms];
      updatedRooms[roomIdx] = {
        ...updatedRooms[roomIdx],
        status: targetStatus
      };
      
      const response = await axios.put(`/api/dashboard/properties/${propertyId}`, {
        rooms: updatedRooms
      });
      if (response.data.status === 'success') {
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error updating room status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Lease Assignment (Landlord Only)
  const handleAssignTenantSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        assignedTenant: assignForm.tenantId || '', // empty resets it
        leaseStart: assignForm.leaseStart || null,
        leaseEnd: assignForm.leaseEnd || null
      };
      
      const response = await axios.put(`/api/dashboard/properties/${propertyId}`, payload);
      if (response.data.status === 'success') {
        alert('Lease assignment updated successfully!');
        setShowAssignForm(false);
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error updating lease details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Pay rent bill (Tenant Only)
  const handlePayRent = async (paymentId) => {
    if (!window.confirm('Process simulated payment?')) return;
    try {
      const response = await axios.post(`/api/dashboard/payments/${paymentId}/pay`);
      if (response.data.status === 'success') {
        alert('Payment registered successfully!');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error making payment.');
    }
  };

  // Add Document (Mock upload)
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!documentInput.trim()) return;
    setActionLoading(true);
    try {
      const updatedDocs = [...(data.property.documents || []), documentInput.trim()];
      const response = await axios.put(`/api/dashboard/properties/${propertyId}`, {
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

  // Delete Document
  const handleDeleteDocument = async (docIndex) => {
    if (!window.confirm('Delete document?')) return;
    setActionLoading(true);
    try {
      const updatedDocs = data.property.documents.filter((_, idx) => idx !== docIndex);
      const response = await axios.put(`/api/dashboard/properties/${propertyId}`, {
        documents: updatedDocs
      });
      if (response.data.status === 'success') {
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting document.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="details-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching property records...</p>
      </div>
    );
  }

  if (error || !data.property) {
    return (
      <div className="details-error-box">
        <p>{error || 'Property not found.'}</p>
        <button className="back-list-btn" onClick={onBackToList}>← Back to List</button>
      </div>
    );
  }

  const { property, payments, maintenance } = data;

  return (
    <div className="property-details-wrapper">
      
      {/* Navigation Header */}
      <div className="details-header-row">
        <button className="back-list-btn" onClick={onBackToList}>
          ← Back to Properties
        </button>
        <div className="property-badge-header">
          <span className="badge-type">{property.type}</span>
          <h2>{property.name}</h2>
          <p className="address-label">📍 {property.address}</p>
        </div>
      </div>

      <div className="details-layout-grid">
        
        {/* Main Details Body */}
        <div className="details-main-content">
          
          {/* Tab Navigation */}
          <div className="details-tabs-nav">
            <button 
              className={`tab-nav-btn ${activeTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              🔑 Rooms/Units
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'tenant' ? 'active' : ''}`}
              onClick={() => setActiveTab('tenant')}
            >
              👤 Assigned Tenant
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'rent' ? 'active' : ''}`}
              onClick={() => setActiveTab('rent')}
            >
              💳 Rent & Invoices
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              🛠️ Maintenance ({maintenance.length})
            </button>
            <button 
              className={`tab-nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              📁 Documents
            </button>
          </div>

          {/* TAB 1: Rooms / Units */}
          {activeTab === 'rooms' && (
            <div className="tab-pane-card animate-fade">
              <div className="pane-header-action">
                <h3>Rooms & Units Summary</h3>
                {user.role === 'landlord' && (
                  <button className="add-room-btn" onClick={() => openRoomModal()}>
                    ➕ Add Room Unit
                  </button>
                )}
              </div>
              <p className="tab-pane-desc">Manage occupancy, vacant rooms, and dimensions within this property.</p>
              
              {(!property.rooms || property.rooms.length === 0) ? (
                <p className="empty-tab-text">No sub-units registered for this property.</p>
              ) : (
                <div className="rooms-grid">
                  {property.rooms.map((room, idx) => (
                    <div className={`room-card-item ${room.status.toLowerCase()}`} key={idx}>
                      <div className="room-icon">🔑</div>
                      <div className="room-info">
                        <span className="room-num">Unit {room.roomNumber}</span>
                        <span className="room-size">Size: {room.size}</span>
                      </div>
                      <div className="room-status-row">
                        <span className={`status-badge-lbl ${room.status.toLowerCase()}`}>
                          {room.status}
                        </span>
                      </div>
                      
                      {user.role === 'landlord' && (
                        <div className="room-actions-bar">
                          {room.status === 'Vacant' ? (
                            <button 
                              className="room-action-btn occupy-btn"
                              onClick={() => handleSetRoomStatus(idx, 'Occupied')}
                              disabled={actionLoading}
                            >
                              Mark Occupied
                            </button>
                          ) : (
                            <button 
                              className="room-action-btn vacant-btn"
                              onClick={() => handleSetRoomStatus(idx, 'Vacant')}
                              disabled={actionLoading}
                            >
                              Mark Vacant
                            </button>
                          )}
                          <button 
                            className="room-action-btn edit-btn"
                            onClick={() => openRoomModal(idx)}
                            disabled={actionLoading}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="room-action-btn delete-btn"
                            onClick={() => handleDeleteRoom(idx)}
                            disabled={actionLoading}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Assigned Tenant */}
          {activeTab === 'tenant' && (
            <div className="tab-pane-card animate-fade">
              <div className="pane-header-action">
                <h3>Lease & Tenant Details</h3>
                {user.role === 'landlord' && (
                  <button 
                    className="edit-lease-btn"
                    onClick={() => setShowAssignForm(!showAssignForm)}
                  >
                    {showAssignForm ? 'Close Edit' : '✏️ Modify Lease'}
                  </button>
                )}
              </div>

              {showAssignForm && user.role === 'landlord' && (
                <form onSubmit={handleAssignTenantSubmit} className="assign-tenant-form">
                  <h4>Assign Leaseholder</h4>
                  <div className="form-group">
                    <label>Select Tenant</label>
                    <select
                      value={assignForm.tenantId}
                      onChange={(e) => setAssignForm({ ...assignForm, tenantId: e.target.value })}
                      disabled={actionLoading}
                    >
                      <option value="">-- No Tenant Assigned --</option>
                      {tenantsList.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row-double">
                    <div className="form-group">
                      <label>Lease Start Date</label>
                      <input
                        type="date"
                        value={assignForm.leaseStart}
                        onChange={(e) => setFormDates('leaseStart', e.target.value)}
                        disabled={actionLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lease End Date</label>
                      <input
                        type="date"
                        value={assignForm.leaseEnd}
                        onChange={(e) => setFormDates('leaseEnd', e.target.value)}
                        disabled={actionLoading}
                      />
                    </div>
                  </div>
                  <button type="submit" className="save-lease-btn" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Lease Assignment'}
                  </button>
                </form>
              )}

              {!property.assignedTenant ? (
                <div className="empty-lease-box">
                  <span className="empty-icon">👤</span>
                  <p>This property is not currently leased to any active tenant.</p>
                  {user.role === 'landlord' && !showAssignForm && (
                    <button className="cta-primary" onClick={() => setShowAssignForm(true)}>Assign Tenant Now</button>
                  )}
                </div>
              ) : (
                <div className="tenant-info-card">
                  <div className="tenant-header">
                    <span className="avatar">👤</span>
                    <div>
                      <h4>{property.assignedTenant.name}</h4>
                      <p>{property.assignedTenant.email}</p>
                    </div>
                  </div>
                  <div className="lease-dates-grid">
                    <div className="date-box">
                      <span className="label">Lease Begins</span>
                      <span className="value">
                        {property.leaseStart ? new Date(property.leaseStart).toLocaleDateString() : 'Not Set'}
                      </span>
                    </div>
                    <div className="date-box">
                      <span className="label">Lease Expires</span>
                      <span className="value">
                        {property.leaseEnd ? new Date(property.leaseEnd).toLocaleDateString() : 'Not Set'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Rent & Invoices */}
          {activeTab === 'rent' && (
            <div className="tab-pane-card animate-fade">
              <h3>Rent Pricing & Payments</h3>
              <div className="pricing-meta-row">
                <div className="meta-box">
                  <span className="box-val">${property.rentAmount}</span>
                  <span className="box-lbl">Monthly Rent Due</span>
                </div>
                <div className="meta-box">
                  <span className="box-val">Monthly</span>
                  <span className="box-lbl">Frequency Cycle</span>
                </div>
              </div>

              <h4>Rent Invoices ({payments.length})</h4>
              {payments.length === 0 ? (
                <p className="empty-tab-text">No rent statements issued for this property.</p>
              ) : (
                <div className="table-responsive">
                  <table className="details-payments-table">
                    <thead>
                      <tr>
                        <th>Due Date</th>
                        <th>Tenant</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p._id}>
                          <td>{new Date(p.dueDate).toLocaleDateString()}</td>
                          <td>{p.tenant?.name || 'Leaseholder'}</td>
                          <td className="table-amt">${p.amount}</td>
                          <td>
                            <span className={`table-badge-status ${p.status.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            {p.status !== 'paid' && user.role === 'tenant' ? (
                              <button 
                                className="inline-pay-btn"
                                onClick={() => handlePayRent(p._id)}
                              >
                                Pay Now
                              </button>
                            ) : p.status === 'paid' ? (
                              <span className="paid-date-label">
                                Paid: {new Date(p.paidAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="overdue-warning">Pending Payment</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Maintenance History */}
          {activeTab === 'maintenance' && (
            <div className="tab-pane-card animate-fade">
              <h3>Property Repairs History</h3>
              <p className="tab-pane-desc">Logs of maintenance tickets filed by tenants.</p>

              {maintenance.length === 0 ? (
                <p className="empty-tab-text">✓ No repair logs filed for this property.</p>
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
                        <span className="item-user">Filed by: {r.tenant?.name || 'Tenant'}</span>
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

          {/* TAB 5: Documents */}
          {activeTab === 'documents' && (
            <div className="tab-pane-card animate-fade">
              <h3>Documents Folder</h3>
              <p className="tab-pane-desc">Store copies of lease agreements, certificates, and renters insurance policies.</p>

              {user.role === 'landlord' && (
                <form onSubmit={handleAddDocument} className="document-upload-form">
                  <input
                    type="text"
                    placeholder="Enter document name (e.g. Lease_Sunset_104.pdf)"
                    value={documentInput}
                    onChange={(e) => setDocumentInput(e.target.value)}
                    disabled={actionLoading}
                    required
                  />
                  <button type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Uploading...' : '📁 Upload Doc'}
                  </button>
                </form>
              )}

              {(!property.documents || property.documents.length === 0) ? (
                <p className="empty-tab-text">No documents stored in this property vault.</p>
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
                        {user.role === 'landlord' && (
                          <button 
                            className="doc-delete-btn"
                            onClick={() => handleDeleteDocument(idx)}
                            disabled={actionLoading}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Summary Card */}
        <aside className="details-sidebar-content">
          <div className="sidebar-overview-card">
            <h3>Overview</h3>
            <div className="sidebar-info-row">
              <span className="label">Monthly Rate</span>
              <span className="val">${property.rentAmount}/mo</span>
            </div>
            <div className="sidebar-info-row">
              <span className="label">Property Type</span>
              <span className="val">{property.type}</span>
            </div>
            <div className="sidebar-info-row">
              <span className="label">Total Rooms</span>
              <span className="val">{property.rooms ? property.rooms.length : 0} Unit(s)</span>
            </div>
            <div className="sidebar-info-row">
              <span className="label">Tenant Status</span>
              <span className={`val ${property.assignedTenant ? 'leased' : 'vacant'}`}>
                {property.assignedTenant ? 'Active Lease' : 'Vacant'}
              </span>
            </div>
            <p className="sidebar-description">
              {property.description || 'No detailed specifications entered.'}
            </p>
          </div>
        </aside>

        {/* Rooms Add/Edit Modal */}
        {showRoomModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h3 className="modal-title">
                {editingRoomIdx !== null ? '✏️ Edit Room Unit' : '➕ Add Room Unit'}
              </h3>
              <form onSubmit={handleRoomSubmit} className="modal-form">
                <div className="form-group">
                  <label>Unit / Room Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 104-A, Suite 12"
                    value={roomForm.roomNumber}
                    onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unit Size (Dimensions) *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 12x15, 450 sqft"
                    value={roomForm.size}
                    onChange={e => setRoomForm({ ...roomForm, size: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setShowRoomModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="save-btn"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Save Unit Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )

  // Helper date setter
  function setFormDates(field, value) {
    setAssignForm(prev => ({
      ...prev,
      [field]: value
    }));
  }
}

export default PropertyDetails;
