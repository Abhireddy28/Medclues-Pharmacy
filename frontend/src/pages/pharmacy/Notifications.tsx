import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Bell, CheckCircle2, AlertCircle, 
  Info, AlertTriangle, Package, BookOpen, ShoppingCart,
  Check, ArrowRight
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  actionLink: string;
  createdAt: string;
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${getBaseUrl()}/api/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
MARK_READ:
    try {
      await axios.put(`${getBaseUrl()}/api/notifications/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      // update sidebar count event if needed, but sidebar fetches on its own interval
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${getBaseUrl()}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || n.type === filter);
  
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const priorityMap: any = { critical: 3, warning: 2, info: 1 };
    if (priorityMap[a.priority] !== priorityMap[b.priority]) {
      return priorityMap[b.priority] - priorityMap[a.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const lowStockCount = notifications.filter(n => n.type === 'inventory' && n.title.toLowerCase().includes('stock')).length;
  const expiringCount = notifications.filter(n => n.type === 'inventory' && n.title.toLowerCase().includes('expir')).length;
  const khataPendingCount = notifications.filter(n => n.type === 'khata').length;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    if (type === 'inventory') return <Package className="w-5 h-5" />;
    if (type === 'khata') return <BookOpen className="w-5 h-5" />;
    if (type === 'order') return <ShoppingCart className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'info': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'info': return <Info className="w-4 h-4 text-emerald-600" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            Notifications 
            {unreadCount > 0 && (
              <span className="ml-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Stay updated with your pharmacy operations.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center space-x-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Low Stock Items</p>
              <h3 className="text-2xl font-bold text-slate-800">{lowStockCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Expiring Soon</p>
              <h3 className="text-2xl font-bold text-slate-800">{expiringCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Khata Alerts</p>
              <h3 className="text-2xl font-bold text-slate-800">{khataPendingCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {['all', 'inventory', 'khata', 'order'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-bold capitalize rounded-lg transition-colors ${
              filter === f 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
            <p className="text-slate-500">You have no matching notifications.</p>
          </div>
        ) : (
          sortedNotifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`p-4 rounded-2xl border transition-all ${
                !notification.isRead 
                  ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50' 
                  : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl border ${getPriorityColor(notification.priority)}`}>
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(notification.priority)}
                      <h4 className={`text-base tracking-tight ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notification.title}
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                      {getRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${!notification.isRead ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                    {notification.message}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {notification.actionLink && (
                      <button 
                        onClick={() => {
                          if (notification.actionLink === 'inventory') {
                            navigate('/pharmacy/inventory');
                          } else if (notification.actionLink === 'khata') {
                            navigate('/pharmacy/khata');
                          } else if (notification.actionLink === 'order') {
                            navigate('/pharmacy/order');
                          } else {
                            navigate('/pharmacy/dashboard');
                          }
                        }}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        <span>
                          {notification.type === 'inventory' ? 'View Inventory' : 
                           notification.type === 'khata' ? 'View Khata' : 
                           notification.type === 'order' ? 'View Order' : 'Take Action'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    
                    {!notification.isRead && (
                      <button 
                        onClick={() => markAsRead(notification._id)}
                        className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 text-slate-600 bg-white text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark Read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
