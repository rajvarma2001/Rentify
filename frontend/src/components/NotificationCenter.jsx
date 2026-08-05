import { useState, useEffect } from 'react'
import axios from 'axios'
import './NotificationCenter.css'

function NotificationCenter({ user }) {
  // Tabs: 'all' | 'rent-due' | 'payment-received' | 'lease-expiry' | 'maintenance-update' | 'system-notifications'
  const [activeNotifTab, setActiveNotifTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/notifications?userId=${user.id}&role=${user.role}`);
      if (response.data.status === 'success') {
        setNotifications(response.data.notifications || []);
      } else {
        setError('Error compiling notifications.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve notifications from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user.id]);

  // Filter notifications based on tab
  const filteredNotifs = notifications.filter(n => {
    if (activeNotifTab === 'all') return true;
    return n.category === activeNotifTab;
  });

  const getCategoryCount = (category) => {
    return notifications.filter(n => n.category === category).length;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'rent-due': return '💳';
      case 'payment-received': return '✓';
      case 'lease-expiry': return '📝';
      case 'maintenance-update': return '🛠️';
      case 'system-notifications': return '🔔';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="notif-loading-box">
        <div className="loading-spinner"></div>
        <p>Loading notification center...</p>
      </div>
    );
  }

  return (
    <div className="notif-center-wrapper">
      
      {/* Header Row */}
      <div className="list-header-row">
        <h2>🔔 Activity & Notification Center</h2>
        <button className="refresh-notif-btn" onClick={fetchNotifications}>
          🔄 Refresh Logs
        </button>
      </div>

      {error && <div className="error-alert max-width-1000">{error}</div>}

      {/* Categories Filter Tabs */}
      <div className="notif-tabs-bar">
        <button 
          className={`notif-tab-btn ${activeNotifTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveNotifTab('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`notif-tab-btn ${activeNotifTab === 'rent-due' ? 'active' : ''}`}
          onClick={() => setActiveNotifTab('rent-due')}
        >
          Rent Due ({getCategoryCount('rent-due')})
        </button>
        <button 
          className={`notif-tab-btn ${activeNotifTab === 'payment-received' ? 'active' : ''}`}
          onClick={() => setActiveNotifTab('payment-received')}
        >
          Payments Received ({getCategoryCount('payment-received')})
        </button>
        <button 
          className={`notif-tab-btn ${activeNotifTab === 'lease-expiry' ? 'active' : ''}`}
          onClick={() => setActiveNotifTab('lease-expiry')}
        >
          Lease Expiry ({getCategoryCount('lease-expiry')})
        </button>
        <button 
          className={`notif-tab-btn ${activeNotifTab === 'maintenance-update' ? 'active' : ''}`}
          onClick={() => setActiveNotifTab('maintenance-update')}
        >
          Maintenance ({getCategoryCount('maintenance-update')})
        </button>
        <button 
          className={`notif-tab-btn ${activeNotifTab === 'system-notifications' ? 'active' : ''}`}
          onClick={() => setActiveNotifTab('system-notifications')}
        >
          System ({getCategoryCount('system-notifications')})
        </button>
      </div>

      {/* Notifications Vertical Stack */}
      <div className="notif-vertical-layout">
        {filteredNotifs.length === 0 ? (
          <div className="empty-notif-box">
            <span className="empty-icon">🔔</span>
            <p>No notifications in this category.</p>
          </div>
        ) : (
          filteredNotifs.map(n => (
            <div className={`notif-row-card ${n.type}`} key={n.id}>
              {/* Left icon badge */}
              <div className="notif-icon-badge">
                <span className="badge-icon">{getCategoryIcon(n.category)}</span>
              </div>

              {/* Center body text */}
              <div className="notif-card-body">
                <p className="notif-message-text">{n.text}</p>
                <div className="notif-meta-row">
                  <span className="notif-tag">{n.category.replace('-', ' ').toUpperCase()}</span>
                  <span className="notif-timeline">⏱️ {n.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}

export default NotificationCenter;
