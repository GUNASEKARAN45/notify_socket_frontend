import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Notification, User } from '../types';
import api from '../api';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'send' | 'sent'>('send');
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'direct' | 'toast'>('direct');
  const [recipientId, setRecipientId] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchSent();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/notifications/users');
      setUsers(res.data.users);
    } catch { }
  };

  const fetchSent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/sent');
      setSentNotifications(res.data.notifications);
    } catch {
      toast.error('Failed to load sent notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      await api.post('/notifications/send', {
        title, message, type,
        recipientId: recipientId || null
      });
      toast.success(`Notification sent ${recipientId ? 'to user' : 'to all users'}!`);
      setTitle('');
      setMessage('');
      setRecipientId('');
      fetchSent();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard admin">
      <nav className="navbar admin-nav">
        <div className="nav-brand">
          <span className="logo-text">Switch Mobility</span>
        </div>
        <div className="nav-right">
          <span className="nav-username">{user?.username}</span>
          <button onClick={logout} className="btn-logout">Sign out</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="page-header">
          <div className="tab-bar">
          <button className={`tab ${activeTab === 'send' ? 'active' : ''}`} onClick={() => setActiveTab('send')}>
            Send Notification
          </button>
          <button className={`tab ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
            Sent <span className="tab-count">{sentNotifications.length}</span>
          </button>
        </div>
          
        </div>

        

        {activeTab === 'send' && (
          <div className="send-panel">
            <form onSubmit={handleSend} className="send-form">
              <div className="type-selector">
                <div
                  className={`type-card ${type === 'direct' ? 'selected' : ''}`}
                  onClick={() => setType('direct')}
                >
                  <h4>Direct Notification</h4>
                </div>
                <div
                  className={`type-card ${type === 'toast' ? 'selected' : ''}`}
                  onClick={() => setType('toast')}
                >
                  <h4>Broadcast Toast</h4>
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label>Title <span className="required">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Notification title"
                    className="auth-input"
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Recipient</label>
                  <select
                    value={recipientId}
                    onChange={e => setRecipientId(e.target.value)}
                    className="auth-input"
                  >
                    <option value="">Broadcast to all users</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.username} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label>Message <span className="required">*</span></label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your notification message..."
                  className="auth-input textarea"
                  rows={4}
                  required
                />
              </div>

              <button type="submit" className="auth-btn send-btn" disabled={sending}>
                {sending ? <span className="spinner" /> : `Send ${type === "direct" ? "Direct" : "Broadcast"} Notification`}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'sent' && (
          <div>
            {loading ? (
              <div className="loading-state">
                <div className="spinner large" />
                <p>Loading sent notifications...</p>
              </div>
            ) : sentNotifications.length === 0 ? (
              <div className="empty-state">
                <h3>No notifications sent yet</h3>
                <p>Go to "Send Notification" to send your first message</p>
              </div>
            ) : (
              <div className="notif-list">
                {sentNotifications.map(n => (
                  <div key={n._id} className={`notif-card type-${n.type}`}>
                    <div className="notif-body">
                      <div className="notif-header-row">
                        <h3 className="notif-title">{n.title}</h3>
                        <div className="notif-meta">
                          <span className={`badge badge-${n.type}`}>
                            {n.type === 'direct' ? 'Direct' : 'Broadcast'}
                          </span>
                        </div>
                      </div>
                      <p className="notif-msg">{n.message}</p>
                      <div className="notif-footer">
                        <span className="notif-from">
                          To: {(n.recipient as any)?.username || "All users"}
                        </span>
                        <span className="notif-time">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;


