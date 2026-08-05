import { useState, useEffect } from 'react'
import axios from 'axios'
import './Profile.css'

function Profile({ user, onLogout }) {
  // Sub-tabs: 'details' | 'password' | 'settings' | 'logout'
  const [activeProfileTab, setActiveProfileTab] = useState('details');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    notificationSettings: {
      rentDue: true,
      paymentReceived: true,
      leaseExpiry: true,
      maintenanceUpdate: true,
      systemNotif: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password fields state
  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch Profile details
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/profile?userId=${user.id}`);
      if (response.data.status === 'success') {
        setProfile(response.data.profile);
      } else {
        setError('Error retrieving profile details.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  // Handle Edit Details Submit
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const response = await axios.put('/api/dashboard/profile', {
        userId: user.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone
      });
      if (response.data.status === 'success') {
        setSuccessMsg(response.data.message);
        setProfile(response.data.profile);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating details.');
    }
  };

  // Handle Password Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      const response = await axios.post('/api/dashboard/profile/password', {
        userId: user.id,
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      });
      if (response.data.status === 'success') {
        setSuccessMsg(response.data.message);
        setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating password.');
    }
  };

  // Handle Notification Settings Save
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const response = await axios.post('/api/dashboard/profile/notifications', {
        userId: user.id,
        settings: profile.notificationSettings
      });
      if (response.data.status === 'success') {
        setSuccessMsg(response.data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Error saving notification preferences.');
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-box">
        <div className="loading-spinner"></div>
        <p>Loading personal workspace profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-dashboard-wrapper">
      
      {/* Header Row */}
      <div className="list-header-row">
        <h2>👤 Account Settings</h2>
        <span className="user-role-pill">{profile.role.toUpperCase()} PORTAL</span>
      </div>

      {successMsg && <div className="success-alert max-width-800">{successMsg}</div>}
      {error && <div className="error-alert max-width-800">{error}</div>}

      {/* Sub-tabs Navigation */}
      <div className="profile-tabs-bar">
        <button 
          className={`profile-tab-btn ${activeProfileTab === 'details' ? 'active' : ''}`}
          onClick={() => { setActiveProfileTab('details'); setError(''); setSuccessMsg(''); }}
        >
          👤 Personal Details
        </button>
        <button 
          className={`profile-tab-btn ${activeProfileTab === 'password' ? 'active' : ''}`}
          onClick={() => { setActiveProfileTab('password'); setError(''); setSuccessMsg(''); }}
        >
          🔑 Change Password
        </button>
        <button 
          className={`profile-tab-btn ${activeProfileTab === 'settings' ? 'active' : ''}`}
          onClick={() => { setActiveProfileTab('settings'); setError(''); setSuccessMsg(''); }}
        >
          ⚙️ Notification Settings
        </button>
        <button 
          className={`profile-tab-btn logout-tab ${activeProfileTab === 'logout' ? 'active' : ''}`}
          onClick={() => { setActiveProfileTab('logout'); setError(''); setSuccessMsg(''); }}
        >
          🚪 Session Logout
        </button>
      </div>

      {/* ----------------------------------------------------
         SUB-TAB 1: PERSONAL DETAILS
      ---------------------------------------------------- */}
      {activeProfileTab === 'details' && (
        <div className="profile-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Personal Information</h3>
            <p>Update your details to ensure landlords/tenants can reach you with status updates.</p>
          </div>

          <form onSubmit={handleDetailsSubmit} className="profile-form-layout">
            <div className="form-group">
              <label>Full Name *</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input 
                type="email" 
                value={profile.email}
                onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                placeholder="e.g. +1 555-0199"
                value={profile.phone}
                onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <button className="cta-primary width-fit" type="submit">
              Save Account Details
            </button>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 2: CHANGE PASSWORD
      ---------------------------------------------------- */}
      {activeProfileTab === 'password' && (
        <div className="profile-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Change Password</h3>
            <p>Maintain your account security by updating your password credentials.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="profile-form-layout">
            <div className="form-group">
              <label>Current Password *</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={pwdForm.oldPassword}
                onChange={e => setPwdForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password *</label>
              <input 
                type="password" 
                placeholder="Min 6 characters"
                value={pwdForm.newPassword}
                onChange={e => setPwdForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password *</label>
              <input 
                type="password" 
                placeholder="Re-enter password"
                value={pwdForm.confirmPassword}
                onChange={e => setPwdForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <button className="cta-primary width-fit" type="submit">
              Update Password Security
            </button>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 3: NOTIFICATION SETTINGS
      ---------------------------------------------------- */}
      {activeProfileTab === 'settings' && (
        <div className="profile-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Notification Preferences</h3>
            <p>Select which email and system alerts you would like to receive.</p>
          </div>

          <form onSubmit={handleSettingsSubmit} className="profile-form-layout">
            <div className="preferences-checkbox-list">
              <label className="checkbox-label-item">
                <input 
                  type="checkbox" 
                  checked={profile.notificationSettings.rentDue}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, rentDue: e.target.checked }
                  }))}
                />
                <div className="check-text">
                  <span className="title">Rent Due Alerts</span>
                  <span className="desc">Notify me when rent invoices are issued or outstanding.</span>
                </div>
              </label>

              <label className="checkbox-label-item">
                <input 
                  type="checkbox" 
                  checked={profile.notificationSettings.paymentReceived}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, paymentReceived: e.target.checked }
                  }))}
                />
                <div className="check-text">
                  <span className="title">Payment Received Alerts</span>
                  <span className="desc">Notify me immediately upon successful billing settlements.</span>
                </div>
              </label>

              <label className="checkbox-label-item">
                <input 
                  type="checkbox" 
                  checked={profile.notificationSettings.leaseExpiry}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, leaseExpiry: e.target.checked }
                  }))}
                />
                <div className="check-text">
                  <span className="title">Lease Agreement Expiry</span>
                  <span className="desc">Alert me when lease agreement periods are close to expiration.</span>
                </div>
              </label>

              <label className="checkbox-label-item">
                <input 
                  type="checkbox" 
                  checked={profile.notificationSettings.maintenanceUpdate}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, maintenanceUpdate: e.target.checked }
                  }))}
                />
                <div className="check-text">
                  <span className="title">Maintenance Tickets Progress</span>
                  <span className="desc">Alert me of contractor scheduling and ticket resolutions.</span>
                </div>
              </label>

              <label className="checkbox-label-item">
                <input 
                  type="checkbox" 
                  checked={profile.notificationSettings.systemNotif}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, systemNotif: e.target.checked }
                  }))}
                />
                <div className="check-text">
                  <span className="title">Rentify System Broadcasts</span>
                  <span className="desc">General platform maintenance and onboarding newsletters.</span>
                </div>
              </label>
            </div>

            <button className="cta-primary width-fit" type="submit">
              Save Preferences
            </button>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 4: LOGOUT SESSION
      ---------------------------------------------------- */}
      {activeProfileTab === 'logout' && (
        <div className="profile-panel-container animate-fade text-center padding-3">
          <span className="logout-warning-icon">🚪</span>
          <h3>Log Out of Session?</h3>
          <p className="max-width-400 margin-auto text-secondary font-size-09 margin-bottom-2">
            Are you sure you want to end your active workspace session? You will need to re-verify your credentials to sign in again.
          </p>

          <div className="logout-actions-row">
            <button className="cancel-notif-btn" onClick={() => setActiveProfileTab('details')}>
              Cancel
            </button>
            <button className="confirm-logout-btn" onClick={onLogout}>
              Confirm Log Out
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Profile;
