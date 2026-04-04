import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { Notification } from '../types';
import api from '../api';
import toast from 'react-hot-toast';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const addNotification = useCallback((n: Notification) => {
    setNotifications(prev => {
      if (prev.find(p => p._id === n._id)) return prev;
      return [n, ...prev];
    });
  }, []);

  useSocket(addNotification);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // On login, show pending toast-type notifications that haven't been shown yet
  useEffect(() => {
    if (!loading) {
      const pending = notifications.filter(n => n.type === 'toast' && !n.isToastShown);
      pending.forEach(n => {
        toast.custom((t) => (
          <div className={`toast-broadcast ${t.visible ? 'animate-in' : 'animate-out'}`}>
            <div>
              <strong>{n.title}</strong>
              <p>{n.message}</p>
            </div>
          </div>
        ), { duration: 6000 });
        api.patch(`/notifications/${n._id}/toast-shown`).catch(() => {});
      });
    }
  }, [loading]); // eslint-disable-line

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/mine');
      setNotifications(res.data.notifications);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed');
    }
  };

  const filtered = activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="dashboard">
      <nav className="navbar">
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
          <div>
            <h1>Notifications</h1>
            <p className="sub">Your notification inbox</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary">
              Mark all read ({unreadCount})
            </button>
          )}
        </div>

        <div className="tab-bar">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All <span className="tab-count">{notifications.length}</span>
          </button>
          <button
            className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner large" />
            <p>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No notifications yet</h3>
            <p>You'll see messages from the admin here</p>
          </div>
        ) : (
          <div className="notif-list">
            {filtered.map(n => (
              <div key={n._id} className={`notif-card ${!n.isRead ? 'unread' : ''} type-${n.type}`}>
                <div className="notif-body">
                  <div className="notif-header-row">
                    <h3 className="notif-title">{n.title}</h3>
                    <div className="notif-meta">
                      <span className={`badge badge-${n.type}`}>
                        {n.type === 'direct' ? 'Direct' : 'Broadcast'}
                      </span>
                      {!n.isRead && <span className="dot-unread" />}
                    </div>
                  </div>
                  <p className="notif-msg">{n.message}</p>
                  <div className="notif-footer">
                    <span className="notif-from">From: {n.sender.username}</span>
                    <span className="notif-time">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {!n.isRead && (
                      <button onClick={() => markRead(n._id)} className="btn-read">
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

