import { useState, useEffect } from 'react'
import axios from 'axios'
import './RentDashboard.css'

function RentDashboard({ properties, dueSummary, recentPayments, user, onSelectPayment, onRefresh }) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [form, setForm] = useState({
    propertyId: '',
    tenantId: '',
    amount: '',
    dueDate: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Handle Property Select inside Invoice Modal
  // Auto-detects leased tenant to prevent billing vacant suites
  const handlePropertyChange = (propertyId) => {
    const selectedProp = properties.find(p => p._id === propertyId);
    setForm(prev => ({
      ...prev,
      propertyId,
      tenantId: selectedProp?.assignedTenant?._id || selectedProp?.assignedTenant || '' // checks populated or ref
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

  // Mark invoice as Paid (Pay Rent / Collect Rent)
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

  return (
    <div className="rent-dashboard-wrapper">
      
      {/* Header Panel */}
      <div className="list-header-row">
        <h2>💳 Rent & Payments Workspace</h2>
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

      <div className="rent-details-layout">
        
        {/* Outstanding Dues Section */}
        <section className="outstanding-bills-section">
          <h3>📂 Outstanding Invoices ({dueSummary.items.length})</h3>
          <p className="section-desc">Unpaid statements awaiting collection or settlement.</p>
          
          {dueSummary.items.length === 0 ? (
            <div className="empty-bills-box">
              <span className="empty-icon">✓</span>
              <p>All statements are fully settled!</p>
            </div>
          ) : (
            <div className="bills-vertical-list">
              {dueSummary.items.map(b => (
                <div className="bill-list-item" key={b._id}>
                  <div className="bill-main-info" onClick={() => onSelectPayment(b._id)}>
                    <div className="suite-details">
                      <span className="suite-name">{b.property?.name}</span>
                      <span className="due-date">Due: {new Date(b.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="bill-amounts">
                      <span className="amt">${b.amount}</span>
                      <span className={`status-badge-lbl ${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>

                  <div className="bill-actions">
                    <button 
                      className="bill-receipt-btn"
                      onClick={() => onSelectPayment(b._id)}
                    >
                      Receipt
                    </button>
                    <button 
                      className="bill-collect-btn"
                      onClick={() => handleProcessPayment(b._id)}
                    >
                      {user.role === 'landlord' ? 'Collect Rent' : 'Pay Rent'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Transactions / Payment History */}
        <section className="payment-history-section">
          <h3>📜 Transaction History ({recentPayments.length})</h3>
          <p className="section-desc">Receipts ledger showing paid statements.</p>

          {recentPayments.length === 0 ? (
            <p className="empty-tab-text">No payment records found.</p>
          ) : (
            <div className="table-responsive">
              <table className="payments-history-table">
                <thead>
                  <tr>
                    <th>Date Paid</th>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(p => (
                    <tr key={p._id}>
                      <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="table-prop-name" title={p.property?.name}>
                        {p.property?.name?.substring(0, 24)}...
                      </td>
                      <td className="table-amt font-bold">${p.amount}</td>
                      <td>
                        <button 
                          className="table-receipt-btn"
                          onClick={() => onSelectPayment(p._id)}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
