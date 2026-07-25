import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout: React.FC = () => {
  const token = localStorage.getItem('pharma_token');
  const user = JSON.parse(localStorage.getItem('pharma_user') || 'null');

  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === 'delivery_executive') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)', fontFamily: 'Poppins, Inter, sans-serif' }}>
        <main className="flex-1 p-4 pb-20 overflow-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background)', fontFamily: 'Poppins, Inter, sans-serif' }}>
      {/* Sidebar - Fixed Width */}
      <Sidebar role={user.role} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <TopBar title="PharmaSync Platform" user={user} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-5 pb-20 overflow-auto" style={{ backgroundColor: 'var(--background)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
