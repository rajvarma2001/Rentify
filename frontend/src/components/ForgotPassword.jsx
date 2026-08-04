import { useState } from 'react'
import axios from 'axios'
import './Auth.css'

function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      if (response.data && response.data.status === 'success') {
        setMessage(response.data.message);
      } else {
        setError('Failed to process request. Please try again.');
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
          <h2>Reset Password</h2>
          <p>We'll email you instructions to reset your password</p>
        </div>

        {error && <div className="error-alert">{error}</div>}
        {message && <div className="success-alert">{message}</div>}

        {!message ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="success-wrapper">
            <p className="success-note">
              Please check your inbox. If you don't receive an email within a few minutes, check your spam folder.
            </p>
            <button 
              type="button" 
              className="auth-btn" 
              onClick={() => onNavigate('login')}
            >
              Return to Login
            </button>
          </div>
        )}

        <div className="auth-footer">
          <span className="back-link" onClick={() => onNavigate('login')}>
            ← Back to Login
          </span>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword;
