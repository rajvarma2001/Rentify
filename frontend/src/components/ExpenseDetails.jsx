import { useState, useEffect } from 'react'
import axios from 'axios'
import './ExpenseDetails.css'

function ExpenseDetails({ expenseId, onBackToList }) {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExpenseDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/expenses/${expenseId}`);
      if (response.data.status === 'success') {
        setExpense(response.data.expense);
      } else {
        setError('Error fetching expense details.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve expense record details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, [expenseId]);

  if (loading) {
    return (
      <div className="details-loading-box">
        <div className="loading-spinner"></div>
        <p>Fetching expense details...</p>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="details-error-box">
        <p>{error || 'Expense statement not found.'}</p>
        <button className="back-list-btn" onClick={onBackToList}>← Back to Ledger</button>
      </div>
    );
  }

  return (
    <div className="expense-details-wrapper">
      
      {/* Back navigation */}
      <div className="details-header-row">
        <button className="back-list-btn" onClick={onBackToList}>
          ← Back to Expense Ledger
        </button>
      </div>

      <div className="expense-slip-card animate-fade">
        {/* Top Header details */}
        <div className="slip-top-banner">
          <div className="slip-logo">
            <span className="logo-icon">📊</span>
            <h3>EXPENSE REPORT</h3>
          </div>
          <span className={`category-tag ${expense.category.toLowerCase()}`}>
            {expense.category}
          </span>
        </div>

        <div className="slip-meta-box">
          <div className="meta-row">
            <span className="lbl">Record Number</span>
            <span className="val">#{expense._id.substring(12).toUpperCase()}</span>
          </div>
          <div className="meta-row">
            <span className="lbl">Date Incurred</span>
            <span className="val">{new Date(expense.date).toLocaleDateString()}</span>
          </div>
          <div className="meta-row">
            <span className="lbl">Date Filed</span>
            <span className="val">{new Date(expense.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="slip-divider"></div>

        {/* Property details */}
        <div className="slip-section">
          <h4>Property Association</h4>
          <div className="property-compact-card">
            <span className="name">{expense.property?.name}</span>
            <span className="addr">📍 {expense.property?.address}</span>
            <span className="type">Building Type: {expense.property?.type || 'Apartment'}</span>
          </div>
        </div>

        {/* Description notes */}
        <div className="slip-section">
          <h4>Description Note</h4>
          <div className="description-quote">
            <p>{expense.description || 'No additional notes provided for this operational expense.'}</p>
          </div>
        </div>

        <div className="slip-divider"></div>

        {/* Pricing breakdown */}
        <div className="slip-pricing-section">
          <div className="pricing-row header">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="pricing-row item">
            <span>Operational Outflow ({expense.category})</span>
            <span>${expense.amount}.00</span>
          </div>
          <div className="pricing-row total">
            <span>Total Outflow</span>
            <span>-${expense.amount}.00</span>
          </div>
        </div>

        <div className="slip-divider"></div>

        <div className="slip-footer">
          <p>Filed by property manager reference: {expense.property?.landlord || 'Registered Landlord'}</p>
          <p className="thank-you">Rentify Accounting vault</p>
        </div>

      </div>

    </div>
  )
}

export default ExpenseDetails;
