import { useState } from 'react'
import axios from 'axios'

function Register({ onNavigate, onLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (response.data && response.data.status === 'success') {
        onLogin(response.data.user);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Could not reach server. Please check if backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glow-orb auth-orb"></div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => onNavigate('landing')}>🔑</div>
          <h2>Create Account</h2>
          <p>Join Rentify Rent Management System</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Select Role</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${formData.role === 'tenant' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('tenant')}
                disabled={loading}
              >
                <span className="role-icon">👤</span>
                <span className="role-label">Tenant</span>
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'landlord' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('landlord')}
                disabled={loading}
              >
                <span className="role-icon">🏢</span>
                <span className="role-label">Landlord</span>
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <span className="swap-link" onClick={() => onNavigate('login')}>
              Sign In
            </span>
          </p>
          <span className="back-link" onClick={() => onNavigate('landing')}>
            ← Back to Home
          </span>
        </div>
      </div>
    </div>
  )
}

export default Register;
