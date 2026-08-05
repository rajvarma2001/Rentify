import { useState, useEffect } from 'react'
import axios from 'axios'
import './MaintenanceDetails.css'

function MaintenanceDetails({ requestId, onBackToList }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/maintenance/${requestId}`);
      if (response.data.status === 'success') {
        setRequest(response.data.request);
      } else {
        setError('Error fetching maintenance details.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve maintenance ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  if (loading) {
    return (
      <div className="details-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching maintenance request details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="details-error-box">
        <p>{error || 'Maintenance ticket not found.'}</p>
        <button className="back-list-btn" onClick={onBackToList}>← Back to Ledger</button>
      </div>
    );
  }

  return (
    <div className="maintenance-details-wrapper">
      
      {/* Back navigation */}
      <div className="details-header-row">
        <button className="back-list-btn" onClick={onBackToList}>
          ← Back to Maintenance Ledger
        </button>
      </div>

      <div className="maintenance-slip-card animate-fade">
        {/* Top Header details */}
        <div className="slip-top-banner">
          <div className="slip-logo">
            <span className="logo-icon">🛠️</span>
            <h3>MAINTENANCE TICKET</h3>
          </div>
          <span className={`status-badge-lbl ${request.status}`}>
            {request.status === 'in-progress' ? 'In Progress' : request.status}
          </span>
        </div>

        <div className="slip-meta-box">
          <div className="meta-row">
            <span className="lbl">Ticket Reference</span>
            <span className="val">#{request._id.substring(12).toUpperCase()}</span>
          </div>
          <div className="meta-row">
            <span className="lbl">Priority Rank</span>
            <span className={`val priority ${request.priority}`}>{request.priority.toUpperCase()}</span>
          </div>
          <div className="meta-row">
            <span className="lbl">Date Logged</span>
            <span className="val">{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="slip-divider"></div>

        {/* Property association */}
        <div className="slip-section">
          <h4>Property Association</h4>
          <div className="property-compact-card">
            <span className="name">{request.property?.name}</span>
            <span className="addr">📍 {request.property?.address}</span>
            <span className="type">Building Type: {request.property?.type || 'Apartment'}</span>
          </div>
        </div>

        {/* Tenant contact */}
        <div className="slip-section">
          <h4>Filed By Tenant</h4>
          <div className="tenant-compact-card">
            <span className="avatar-icon">👤</span>
            <div className="tenant-info">
              <span className="name">{request.tenant?.name || 'N/A'}</span>
              <span className="contact">📧 {request.tenant?.email || 'N/A'}</span>
              <span className="contact">📞 {request.tenant?.phone || 'No phone registered'}</span>
            </div>
          </div>
        </div>

        <div className="slip-divider"></div>

        {/* Issue Description notes */}
        <div className="slip-section">
          <h4>Problem Description</h4>
          <h3 className="ticket-title">{request.title}</h3>
          <div className="description-quote">
            <p>{request.description}</p>
          </div>
        </div>

        <div className="slip-divider"></div>

        {/* Assigned worker info */}
        <div className="slip-section">
          <h4>Assignment Status</h4>
          <div className="assignment-status-box">
            <div className="status-item">
              <span className="lbl">Assigned Worker</span>
              <span className="val worker-name">{request.assignedWorker || 'Unassigned / Awaiting Scheduling'}</span>
            </div>
            <div className="status-item">
              <span className="lbl">Current Status</span>
              <span className={`val status-state ${request.status}`}>
                {request.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="slip-divider"></div>

        <div className="slip-footer">
          <p>Rentify Maintenance Division Vault</p>
          <p className="thank-you">Safe operations protocol</p>
        </div>

      </div>

    </div>
  )
}

export default MaintenanceDetails;
