import { useState, useEffect } from 'react'
import axios from 'axios'
import './RentDashboard.css'

function RentDashboard({ properties, dueSummary, recentPayments, user, onSelectPayment, onRefresh }) {
  // Sub-tabs state: 'all' | 'pending' | 'completed'
  const [activeSubSubTab, setActiveSubSubTab] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [form, setForm] = useState({
    propertyId: '',
    tenantId: '',
    amount: '',
    dueDate: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Handle Property Change in Modal
  const handlePropertyChange = (propertyId) => {
    const selectedProp = properties.find(p => p._id === propertyId);
    setForm(prev => ({
      ...prev,
      propertyId,
      tenantId: selectedProp?.assignedTenant?._id || selectedProp?.assignedTenant || ''
    }));
  };

  // Open Invoice Modal
  const handleOpenInvoice = () => {
    setForm({
      propertyId: '',
      tenantId: '',
      amount: '',
      dueDate: ''
    });
    setFormError('');
    setShowInvoiceModal(true);
  };

  // Submit Invoice Generation
  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!form.propertyId || !form.tenantId || !form.amount || !form.dueDate) {
      setFormError('Please complete all required fields.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.post('/api/dashboard/payments', {
        tenantId: form.tenantId,
        propertyId: form.propertyId,
        amount: Number(form.amount),
        dueDate: form.dueDate
      });
      if (response.data.status === 'success') {
        setShowInvoiceModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error generating invoice.');
    } finally {
      setFormLoading(false);
    }
  };

  // Process/Mark Payment status as paid
  const handleProcessPayment = async (paymentId) => {
    const confirmMsg = user.role === 'landlord'
      ? 'Mark this outstanding invoice as Collected/Paid?'
      : 'Process payment simulation for this rent bill?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await axios.post(`/api/dashboard/payments/${paymentId}/pay`);
      if (response.data.status === 'success') {
        alert('Transaction successful!');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('Error updating payment status.');
    }
  };

  // Calculate totals
  const totalOutstanding = dueSummary.totalAmount || 0;
  const totalCollected = recentPayments.reduce((acc, curr) => acc + curr.amount, 0);

  // Find tenant name for property
  const getSelectedPropertyTenantName = () => {
    if (!form.propertyId) return '';
    const selectedProp = properties.find(p => p._id === form.propertyId);
    if (!selectedProp) return '';
    return selectedProp.assignedTenant?.name || 'Vacant Suite';
  };

  const isPropertyVacant = () => {
    if (!form.propertyId) return false;
    const selectedProp = properties.find(p => p._id === form.propertyId);
    return !selectedProp?.assignedTenant;
  };

  // Combine Outstanding Invoices and Paid invoices (no overlap due to status)
  const combinedPayments = [...dueSummary.items, ...recentPayments].sort((a, b) => {
    // Sort by due date (descending)
    return new Date(b.dueDate) - new Date(a.dueDate);
  });

  // Filter combined list depending on sub-tab
  const filteredPayments = combinedPayments.filter(p => {
    if (activeSubSubTab === 'pending') {
      return p.status === 'due' || p.status === 'overdue';
    } else if (activeSubSubTab === 'completed') {
      return p.status === 'paid';
    }
    return true; // 'all'
  });

  return (
    <div className="rent-dashboard-wrapper">
      
      {/* Header Panel */}
      <div className="list-header-row">
        <h2>💳 Rent & Payments</h2>
        {user.role === 'landlord' && (
          <button className="add-invoice-header-btn" onClick={handleOpenInvoice}>
            ➕ Generate Invoice
          </button>
        )}
      </div>

      {/* Financial Overview Stats Cards */}
      <div className="rent-overview-grid">
        <div className="rent-stat-card outstanding">
          <span className="icon">💳</span>
          <div className="stat-body">
            <span className="val">${totalOutstanding}</span>
            <span className="lbl">Outstanding Dues</span>
          </div>
        </div>

        <div className="rent-stat-card collected">
          <span className="icon">✓</span>
          <div className="stat-body">
            <span className="val">${totalCollected}</span>
            <span className="lbl">Collected Payments</span>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="rent-tabs-bar">
        <button 
          className={`rent-tab-btn ${activeSubSubTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSubSubTab('all')}
        >
          All Payments ({combinedPayments.length})
        </button>
        <button 
          className={`rent-tab-btn ${activeSubSubTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveSubSubTab('pending')}
        >
          Pending ({dueSummary.items.length})
        </button>
        <button 
          className={`rent-tab-btn ${activeSubSubTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveSubSubTab('completed')}
        >
          Completed ({recentPayments.length})
        </button>
      </div>

      {/* List Layout of Invoices */}
      <div className="payments-vertical-layout">
        {filteredPayments.length === 0 ? (
          <div className="empty-payments-box">
            <span className="empty-icon">💳</span>
            <p>No transactions found for this selection.</p>
          </div>
        ) : (
          filteredPayments.map(p => (
            <div className={`payment-row-card ${p.status}`} key={p._id}>
              {/* Left Column: Status Badge */}
              <div className="payment-card-header">
                <span className={`status-badge-lbl ${p.status.toLowerCase()}`}>
                  {p.status === 'paid' ? 'Settled ✓' : p.status}
                </span>
                <span className="payment-amount-val">${p.amount}</span>
              </div>

              {/* Center Column: Detailed descriptor info */}
              <div className="payment-card-body">
                <div className="payment-details-info">
                  <h3 className="payment-property-lbl">🏢 {p.property?.name || 'Unknown Property'}</h3>
                  <p className="payment-tenant-lbl">👤 Tenant: {p.tenant?.name || 'Unassigned tenant'}</p>
                </div>
                <div className="payment-details-meta">
                  <p className="meta-text">📅 Due: {new Date(p.dueDate).toLocaleDateString()}</p>
                  {p.paidAt && (
                    <p className="meta-text paid-at-text">✓ Paid: {new Date(p.paidAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {/* Right Column: Standardized vertical action buttons */}
              <div className="payment-card-actions">
                <button 
                  className="action-view-btn" 
                  onClick={() => onSelectPayment(p._id)}
                >
                  View Receipt
                </button>
                {p.status !== 'paid' && (
                  <button 
                    className="action-collect-btn" 
                    onClick={() => handleProcessPayment(p._id)}
                  >
                    {user.role === 'landlord' ? 'Collect Rent' : 'Pay Rent'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ----------------------------------------------------
         MODAL: GENERATE INVOICE
      ---------------------------------------------------- */}
      {showInvoiceModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Generate Rent Invoice</h3>
              <button className="close-modal-btn" onClick={() => setShowInvoiceModal(false)}>×</button>
            </div>
            
            {formError && <div className="error-alert">{formError}</div>}
            
            <form onSubmit={handleInvoiceSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Leased Property *</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  disabled={formLoading}
                  required
                >
                  <option value="">-- Choose Occupied Property --</option>
                  {properties.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.assignedTenant ? `Leased: ${p.assignedTenant.name}` : 'Vacant'})
                    </option>
                  ))}
                </select>
              </div>

              {form.propertyId && (
                <div className="form-group">
                  <label>Assigned Tenant</label>
                  <input
                    type="text"
                    value={getSelectedPropertyTenantName()}
                    disabled
                  />
                  {isPropertyVacant() && (
                    <p className="field-tip warning">
                      ⚠️ Cannot bill a vacant suite. Please assign a lease contract first.
                    </p>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Billing Amount ($) *</label>
                <input
                  type="number"
                  placeholder="1200"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  disabled={formLoading || isPropertyVacant()}
                  required
                />
              </div>

              <div className="form-group">
                <label>Invoice Due Date *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  disabled={formLoading || isPropertyVacant()}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn" 
                disabled={formLoading || isPropertyVacant() || !form.propertyId}
              >
                {formLoading ? 'Generating Invoices...' : 'Issue Rent Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default RentDashboard;
