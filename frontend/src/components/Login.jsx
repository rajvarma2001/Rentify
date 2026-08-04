import { useState } from 'react'
import axios from 'axios'
import './Auth.css'

function Login({ onNavigate, onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data && response.data.status === 'success') {
        onLogin(response.data.user);
      } else {
        setError('Login failed. Please try again.');
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
          <h2>Welcome Back</h2>
          <p>Login to manage your rentals</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
            <div className="label-wrapper">
              <label htmlFor="password">Password</label>
              <span 
                className="forgot-link" 
                onClick={() => onNavigate('forgot-password')}
              >
                Forgot Password?
              </span>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <span className="swap-link" onClick={() => onNavigate('register')}>
              Create one
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

export default Login;
