import { useState } from 'react'
import axios from 'axios'
import './PropertyList.css'

function PropertyList({ properties, user, onSelectProperty, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    address: '',
    rentAmount: '',
    type: 'Apartment',
    description: '',
    roomsInput: '' // parsed as comma-separated rooms
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Add Click
  const handleOpenAdd = () => {
    setForm({
      name: '',
      address: '',
      rentAmount: '',
      type: 'Apartment',
      description: '',
      roomsInput: ''
    });
    setError('');
    setShowAddModal(true);
  };

  // Handle Edit Click
  const handleOpenEdit = (property) => {
    setSelectedProperty(property);
    const roomsStr = property.rooms ? property.rooms.map(r => r.roomNumber).join(', ') : '';
    setForm({
      name: property.name,
      address: property.address,
      rentAmount: property.rentAmount,
      type: property.type || 'Apartment',
      description: property.description || '',
      roomsInput: roomsStr
    });
    setError('');
    setShowEditModal(true);
  };

  // Process Add Property
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.rentAmount) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Parse rooms input (e.g. "101, 102" -> [{ roomNumber: "101", status: "Vacant", size: "12x14" }])
      const roomsArray = form.roomsInput
        .split(',')
        .map(r => r.trim())
        .filter(r => r !== '')
        .map(roomNum => ({
          roomNumber: roomNum,
          status: 'Vacant',
          size: '12x12'
        }));

      const payload = {
        name: form.name,
        address: form.address,
        rentAmount: Number(form.rentAmount),
        type: form.type,
        description: form.description,
        rooms: roomsArray,
        landlordId: user.id
      };

      const response = await axios.post('/api/dashboard/properties', payload);
      if (response.data.status === 'success') {
        setShowAddModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating property.');
    } finally {
      setLoading(false);
    }
  };

  // Process Edit Property
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.rentAmount) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const roomsArray = form.roomsInput
        .split(',')
        .map(r => r.trim())
        .filter(r => r !== '')
        .map(roomNum => {
          // Keep existing occupancy details if room matches, otherwise new Vacant
          const existing = selectedProperty.rooms?.find(ex => ex.roomNumber === roomNum);
          return {
            roomNumber: roomNum,
            status: existing ? existing.status : 'Vacant',
            size: existing ? existing.size : '12x12'
          };
        });

      const payload = {
        name: form.name,
        address: form.address,
        rentAmount: Number(form.rentAmount),
        type: form.type,
        description: form.description,
        rooms: roomsArray
      };

      const response = await axios.put(`/api/dashboard/properties/${selectedProperty._id}`, payload);
      if (response.data.status === 'success') {
        setShowEditModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating property.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this property? This will delete all rent invoices and maintenance histories.')) return;
    try {
      const response = await axios.delete(`/api/dashboard/properties/${propertyId}`);
      if (response.data.status === 'success') {
        alert('Property successfully deleted.');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting property.');
    }
  };

  return (
    <div className="property-list-wrapper">
      <div className="list-header-row">
        <h2>📂 Registered Properties ({properties.length})</h2>
        {user.role === 'landlord' && (
          <button className="add-property-header-btn" onClick={handleOpenAdd}>
            ➕ Add Property
          </button>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="empty-properties-box">
          <span className="empty-icon">🏢</span>
          <p>No properties found in your workspace.</p>
          {user.role === 'landlord' && (
            <button className="cta-primary" onClick={handleOpenAdd}>Register Your First Property</button>
          )}
        </div>
      ) : (
        <div className="properties-grid-layout">
          {properties.map(p => (
            <div className="property-grid-card" key={p._id}>
              <div className="property-card-icon">🏢</div>
              
              <div className="property-card-body">
                <span className="card-badge-type">{p.type}</span>
                <h3 className="card-property-name">{p.name}</h3>
                <p className="card-property-address">📍 {p.address}</p>
                <p className="card-property-desc">
                  {p.description ? `${p.description.substring(0, 75)}...` : 'No additional description provided.'}
                </p>
                
                <div className="card-property-meta">
                  <span className="meta-rent">${p.rentAmount}/mo</span>
                  <span className="meta-rooms">🔑 {p.rooms ? p.rooms.length : 0} Unit(s)</span>
                </div>
              </div>

              <div className="property-card-actions">
                <button 
                  className="action-view-btn" 
                  onClick={() => onSelectProperty(p._id)}
                >
                  View Details
                </button>
                {user.role === 'landlord' && (
                  <>
                    <button className="action-edit-btn" onClick={() => handleOpenEdit(p)}>
                      Edit
                    </button>
                    <button className="action-delete-btn" onClick={() => handleDelete(p._id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* ----------------------------------------------------
         MODAL: ADD PROPERTY
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register New Property</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            {error && <div className="error-alert">{error}</div>}
            
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Property Name *</label>
                <input
                  type="text"
                  placeholder="Sunset Apartments - Suite 104"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  placeholder="742 Evergreen Terrace, Springfield"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Rent ($) *</label>
                <input
                  type="number"
                  placeholder="1200"
                  value={form.rentAmount}
                  onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Property Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  disabled={loading}
                >
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                  <option value="Office">Office</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Provide property highlights..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={loading}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Rooms/Units (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 104-A, 104-B, 104-C"
                  value={form.roomsInput}
                  onChange={(e) => setForm({ ...form, roomsInput: e.target.value })}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Add Property'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ----------------------------------------------------
         MODAL: EDIT PROPERTY
      ---------------------------------------------------- */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Property Details</h3>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            {error && <div className="error-alert">{error}</div>}
            
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Property Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Rent ($) *</label>
                <input
                  type="number"
                  value={form.rentAmount}
                  onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Property Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  disabled={loading}
                >
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                  <option value="Office">Office</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={loading}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Rooms/Units (Comma separated)</label>
                <input
                  type="text"
                  value={form.roomsInput}
                  onChange={(e) => setForm({ ...form, roomsInput: e.target.value })}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default PropertyList;
