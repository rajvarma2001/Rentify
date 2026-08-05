import { useState, useEffect } from 'react'
import axios from 'axios'
import './ExpenseList.css'

function ExpenseList({ user, properties, onSelectExpense }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeExpense, setActiveExpense] = useState(null);

  // Form states
  const [form, setForm] = useState({
    propertyId: '',
    amount: '',
    category: 'Maintenance',
    description: '',
    date: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/expenses?landlordId=${user.id}`);
      if (response.data.status === 'success') {
        setExpenses(response.data.expenses);
      } else {
        setError('Error fetching expenses.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend to retrieve expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user.id]);

  // Open Add modal
  const handleOpenAdd = () => {
    setForm({
      propertyId: properties[0]?._id || '',
      amount: '',
      category: 'Maintenance',
      description: '',
      date: new Date().toISOString().substring(0, 10)
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (exp) => {
    setActiveExpense(exp);
    setForm({
      propertyId: exp.property?._id || exp.property || '',
      amount: exp.amount.toString(),
      category: exp.category,
      description: exp.description || '',
      date: new Date(exp.date).toISOString().substring(0, 10)
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Submit Add Expense
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.propertyId || !form.amount || !form.category || !form.date) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.post('/api/dashboard/expenses', {
        ...form,
        landlordId: user.id
      });
      if (response.data.status === 'success') {
        setShowAddModal(false);
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error recording expense.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Edit Expense
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!form.propertyId || !form.amount || !form.category || !form.date) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const response = await axios.put(`/api/dashboard/expenses/${activeExpense._id}`, form);
      if (response.data.status === 'success') {
        setShowEditModal(false);
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Error updating expense.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Expense
  const handleDelete = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const response = await axios.delete(`/api/dashboard/expenses/${expId}`);
      if (response.data.status === 'success') {
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting expense record.');
    }
  };

  // Total Expenses calculation
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="expense-list-wrapper">
      
      {/* Header section */}
      <div className="list-header-row">
        <h2>🛠️ Expense ledger</h2>
        <button className="add-expense-btn" onClick={handleOpenAdd}>
          ➕ Add Expense
        </button>
      </div>

      {/* Stats summary board */}
      <div className="expense-stats-grid">
        <div className="expense-summary-card">
          <span className="card-icon">📉</span>
          <div className="card-info">
            <span className="amount-val">${totalExpenses}</span>
            <span className="title-lbl">Total Outflow Expenses</span>
          </div>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading expense statements...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-expenses-box">
          <span className="empty-emoji">📝</span>
          <p>No operational expenses recorded for your properties yet.</p>
          <button className="add-expense-btn" onClick={handleOpenAdd}>Add Your First Expense</button>
        </div>
      ) : (
        <div className="expenses-table-card">
          <div className="table-responsive">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Property</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp._id} className="expense-row">
                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`category-tag ${exp.category.toLowerCase()}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="prop-column-name" title={exp.property?.name}>
                      {exp.property?.name || 'Unassigned Property'}
                    </td>
                    <td className="desc-column" title={exp.description}>
                      {exp.description || '—'}
                    </td>
                    <td className="amount-column font-bold">${exp.amount}</td>
                    <td>
                      <div className="expense-action-buttons">
                        <button className="act-details-btn" onClick={() => onSelectExpense(exp._id)}>
                          Details
                        </button>
                        <button className="act-edit-btn" onClick={() => handleOpenEdit(exp)}>
                          Edit
                        </button>
                        <button className="act-delete-btn" onClick={() => handleDelete(exp._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         MODAL: ADD EXPENSE
      ---------------------------------------------------- */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Record Operational Expense</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {formError && <div className="error-alert">{formError}</div>}

            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Associated Property *</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  disabled={formLoading}
                  required
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Expense Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={formLoading}
                  required
                >
                  <option value="Maintenance">Maintenance</option>
                  <option value="Taxes">Taxes</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Management">Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Billing Amount ($) *</label>
                <input
                  type="number"
                  placeholder="250"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date Incurred *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description Note</label>
                <textarea
                  rows="3"
                  placeholder="Describe the invoice/receipt..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={formLoading}
                ></textarea>
              </div>

              <button type="submit" className="auth-btn" disabled={formLoading}>
                {formLoading ? 'Recording...' : 'File Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         MODAL: EDIT EXPENSE
      ---------------------------------------------------- */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Expense Record</h3>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            {formError && <div className="error-alert">{formError}</div>}

            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Associated Property *</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  disabled={formLoading}
                  required
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Expense Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={formLoading}
                  required
                >
                  <option value="Maintenance">Maintenance</option>
                  <option value="Taxes">Taxes</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Management">Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Billing Amount ($) *</label>
                <input
                  type="number"
                  placeholder="250"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date Incurred *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description Note</label>
                <textarea
                  rows="3"
                  placeholder="Describe the invoice/receipt..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={formLoading}
                ></textarea>
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

export default ExpenseList;
