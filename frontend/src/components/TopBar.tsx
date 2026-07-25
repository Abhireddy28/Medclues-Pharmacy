import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Bell, ChevronDown } from 'lucide-react';

interface TopBarProps {
  title: string;
  user: any;
}

const TopBar: React.FC<TopBarProps> = ({ title, user }) => {
  const navigate = useNavigate();

  const handleNotificationsClick = () => navigate('/pharmacy/notifications');
  const handleProfileClick = () => {
    if (user?.role === 'admin') navigate('/admin/settings');
    else if (user?.role === 'distributor') navigate('/distributor/dashboard');
    else navigate('/pharmacy/profile');
  };

  return (
    <div
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-[90]"
      style={{
        backgroundColor: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        fontFamily: 'Poppins, Inter, sans-serif',
      }}
    >
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button
          onClick={handleNotificationsClick}
          className="relative p-2 rounded-xl transition-all"
          title="Alerts & Notifications"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary-light)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white animate-pulse"
            style={{ backgroundColor: 'var(--danger)' }}
          />
        </button>

        {/* Profile */}
        <div
          onClick={handleProfileClick}
          className="flex items-center space-x-3 pl-4 cursor-pointer"
          style={{ borderLeft: '1px solid var(--border)' }}
          title="View Profile & Settings"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest mt-1" style={{ color: 'var(--text-secondary)' }}>
              {user?.role || 'Admin'}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all"
            style={{ backgroundColor: 'var(--primary-light)', borderColor: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
          >
            <UserCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
