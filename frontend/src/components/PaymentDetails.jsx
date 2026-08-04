import { useState, useEffect } from 'react'
import axios from 'axios'
import './PaymentDetails.css'

function PaymentDetails({ paymentId, onBackToDashboard }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/payments/${paymentId}`);
      if (response.data.status === 'success') {
        setPayment(response.data.payment);
      } else {
        setError('Error fetching payment details.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve payment record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="details-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching transaction receipt...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="details-error-box">
        <p>{error || 'Transaction not found.'}</p>
        <button className="back-list-btn" onClick={onBackToDashboard}>← Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="payment-details-wrapper">
      
      {/* Navigation Header */}
      <div className="details-header-row">
        <button className="back-list-btn" onClick={onBackToDashboard}>
          ← Back to Rent Panel
        </button>
      </div>

      <div className="receipt-paper-container animate-fade">
        <div className="receipt-top-banner">
          <div className="receipt-logo">
            <span className="logo-icon">🔑</span>
            <h3>RENTIFY RECEIPT</h3>
          </div>
          <span className={`receipt-status-badge ${payment.status.toLowerCase()}`}>
            {payment.status === 'paid' ? 'Settled ✓' : 'Payment Due'}
          </span>
        </div>

        <div className="receipt-meta-box">
          <div className="meta-row">
            <span className="lbl">Receipt Number</span>
            <span className="val">#{payment._id.substring(12).toUpperCase()}</span>
          </div>
          <div className="meta-row">
            <span className="lbl">Issue Date</span>
            <span className="val">{new Date(payment.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          {payment.paidAt && (
            <div className="meta-row">
              <span className="lbl">Settled On</span>
              <span className="val">{new Date(payment.paidAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className="meta-row">
            <span className="lbl">Due Date</span>
            <span className="val">{new Date(payment.dueDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Leased suite details */}
        <div className="receipt-section">
          <h4>Leased Unit details</h4>
          <div className="suite-card">
            <span className="suite-name">{payment.property?.name}</span>
            <span className="suite-addr">📍 {payment.property?.address}</span>
            <span className="suite-type">Type: {payment.property?.type || 'Apartment'}</span>
          </div>
        </div>

        {/* Tenant card */}
        <div className="receipt-section">
          <h4>Tenant Information</h4>
          <div className="tenant-card-compact">
            <div className="avatar">👤</div>
            <div className="details">
              <span className="name">{payment.tenant?.name}</span>
              <span className="email">{payment.tenant?.email}</span>
              <span className="phone">{payment.tenant?.phone || 'No phone registered'}</span>
            </div>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Pricing breakdown */}
        <div className="receipt-pricing-section">
          <div className="pricing-row header">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="pricing-row item">
            <span>Monthly Base Rent</span>
            <span>${payment.amount}.00</span>
          </div>
          <div className="pricing-row item">
            <span>Utilities & Services</span>
            <span>$0.00</span>
          </div>
          <div className="pricing-row total">
            <span>Total Charge</span>
            <span>${payment.amount}.00</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-footer">
          <p>Payment Mode: Simulated Electronic Bank Transfer</p>
          <p className="thank-you">Thank you for choosing Rentify workspaces!</p>
        </div>
      </div>

    </div>
  )
}

export default PaymentDetails;
