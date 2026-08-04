import { useState, useEffect } from 'react'
import axios from 'axios'
import './LeaseDetails.css'

function LeaseDetails({ leaseId, onBackToList }) {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [documentInput, setDocumentInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaseDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/leases/${leaseId}`);
      if (response.data.status === 'success') {
        setLease(response.data.lease);
      } else {
        setError('Error fetching lease details.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaseDetails();
  }, [leaseId]);

  // Upload lease document
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!documentInput.trim()) return;
    setActionLoading(true);
    try {
      const updatedDocs = [...(lease.documents || []), documentInput.trim()];
      const response = await axios.put(`/api/dashboard/leases/${leaseId}`, {
        documents: updatedDocs
      });
      if (response.data.status === 'success') {
        setDocumentInput('');
        fetchLeaseDetails();
      }
    } catch (err) {
      console.error(err);
      alert('Error adding document to lease.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete lease document
  const handleDeleteDocument = async (docIndex) => {
    if (!window.confirm('Delete this document?')) return;
    setActionLoading(true);
    try {
      const updatedDocs = lease.documents.filter((_, idx) => idx !== docIndex);
      const response = await axios.put(`/api/dashboard/leases/${leaseId}`, {
        documents: updatedDocs
      });
      if (response.data.status === 'success') {
        fetchLeaseDetails();
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
        <p>Fetching lease contract...</p>
      </div>
    );
  }

  if (error || !lease) {
    return (
      <div className="details-error-box">
        <p>{error || 'Lease agreement not found.'}</p>
        <button className="back-list-btn" onClick={onBackToList}>← Back to List</button>
      </div>
    );
  }

  // Calculate lease progress percentage
  const start = new Date(lease.startDate).getTime();
  const end = new Date(lease.endDate).getTime();
  const now = Date.now();
  const totalDuration = end - start;
  const elapsed = now - start;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  const daysLeft = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="lease-details-wrapper">
      
      {/* Header Menu */}
      <div className="details-header-row">
        <button className="back-list-btn" onClick={onBackToList}>
          ← Back to Leases
        </button>
        <div className="lease-badge-header">
          <span className={`status-badge-tag ${lease.status.toLowerCase()}`}>{lease.status}</span>
          <h2>Lease #{lease._id.substring(18)}</h2>
          <p className="property-label">🏢 {lease.property?.name}</p>
        </div>
      </div>

      <div className="details-layout-grid">
        
        {/* Main Contract details */}
        <div className="details-main-content">
          
          {/* Progress overview */}
          <div className="tab-pane-card lease-progress-card animate-fade">
            <h3>Lease Contract Timeline</h3>
            <div className="timeline-dates-row">
              <div>
                <span className="lbl">Commencement Date</span>
                <span className="val">{new Date(lease.startDate).toLocaleDateString()}</span>
              </div>
              <div className="text-right">
                <span className="lbl">Expiration Date</span>
                <span className="val">{new Date(lease.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="progress-bar-container">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="progress-footer-row">
              <span>{progressPercent}% Elapsed</span>
              <span>⌛ {daysLeft} Days Remaining</span>
            </div>
          </div>

          {/* Parties involved */}
          <div className="tab-pane-card animate-fade">
            <h3>Parties & Properties Details</h3>
            
            <div className="parties-grid">
              
              <div className="party-box">
                <div className="party-header">
                  <span className="icon">🏢</span>
                  <h4>Leased Property</h4>
                </div>
                <div className="party-body">
                  <span className="title">{lease.property?.name}</span>
                  <span className="meta">📍 {lease.property?.address}</span>
                  <span className="meta">Type: {lease.property?.type}</span>
                </div>
              </div>

              <div className="party-box">
                <div className="party-header">
                  <span className="icon">👤</span>
                  <h4>Tenant Leaseholder</h4>
                </div>
                <div className="party-body">
                  <span className="title">{lease.tenant?.name}</span>
                  <span className="meta">📧 {lease.tenant?.email}</span>
                  <span className="meta">📞 {lease.tenant?.phone || 'No phone'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="tab-pane-card animate-fade">
            <h3>Terms & Conditions</h3>
            {lease.terms ? (
              <blockquote className="lease-terms-quote">
                {lease.terms}
              </blockquote>
            ) : (
              <p className="empty-tab-text">No additional lease terms specified.</p>
            )}
          </div>

        </div>

        {/* Sidebar Summary */}
        <aside className="details-sidebar-content">
          
          <div className="sidebar-overview-card">
            <h3>Financial Summary</h3>
            <div className="sidebar-info-row">
              <span className="label">Monthly Rate</span>
              <span className="val">${lease.monthlyRent}/mo</span>
            </div>
            <div className="sidebar-info-row">
              <span className="label">Total Rooms</span>
              <span className="val">{lease.property?.rooms ? lease.property.rooms.length : 0} Unit(s)</span>
            </div>
            <div className="sidebar-info-row">
              <span className="label">Contract Status</span>
              <span className={`val status-tag ${lease.status.toLowerCase()}`}>{lease.status}</span>
            </div>
          </div>

          {/* Lease Documents */}
          <div className="sidebar-overview-card">
            <h3>Lease Documents</h3>
            
            <form onSubmit={handleAddDocument} className="document-upload-sidebar">
              <input
                type="text"
                placeholder="Contract_Signed.pdf"
                value={documentInput}
                onChange={(e) => setDocumentInput(e.target.value)}
                disabled={actionLoading}
                required
              />
              <button type="submit" disabled={actionLoading}>
                Upload
              </button>
            </form>

            {(!lease.documents || lease.documents.length === 0) ? (
              <p className="empty-sidebar-docs">No lease copies attached.</p>
            ) : (
              <div className="sidebar-docs-list">
                {lease.documents.map((doc, idx) => (
                  <div className="sidebar-doc-row" key={idx}>
                    <span className="doc-name-trunc" title={doc}>📄 {doc}</span>
                    <div className="doc-side-actions">
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); alert(`Simulated download: ${doc}`); }}
                      >
                        ↓
                      </a>
                      <button 
                        onClick={() => handleDeleteDocument(idx)}
                        disabled={actionLoading}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

      </div>

    </div>
  )
}

export default LeaseDetails;
