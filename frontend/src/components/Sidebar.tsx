import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Search, 
  TrendingUp, 
  Users, 
  Network, 
  Zap, 
  PackageCheck, 
  CreditCard, 
  FileText, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Building,
  UserPlus,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'pharmacy' | 'distributor' | 'branch_manager' | 'pharmacist' | 'delivery_executive';
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const pharmacyLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/pharmacy/dashboard' },
    { name: 'Prescription Queue', icon: ClipboardList, path: '/pharmacy/prescriptions' },
    { name: 'Online Mobile Orders', icon: PackageCheck, path: '/pharmacy/orders' },
    { name: 'Billing / POS', icon: CreditCard, path: '/pharmacy/billing' },
    { name: 'Inventory & Stock', icon: Package, path: '/pharmacy/inventory' },
    { name: 'Hospital Sync', icon: Building, path: '/pharmacy/hospital-sync' },
    { name: 'Delivery Management', icon: Zap, path: '/pharmacy/delivery' },
    { name: 'Khata Book', icon: FileText, path: '/pharmacy/khata' },
    { name: 'Supplier Orders', icon: Search, path: '/pharmacy/suppliers' },
    { name: 'Multi-Branch Manager', icon: Settings, path: '/pharmacy/branches' },
    { name: 'Sales & Analytics', icon: TrendingUp, path: '/pharmacy/analytics' },
    { name: 'Profile & Settings', icon: Users, path: '/pharmacy/profile' },
  ];

  const distributorLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/distributor/dashboard' },
    { name: 'Inventory Catalog', icon: Package, path: '/distributor/inventory' },
    { name: 'Pharmacy B2B Orders', icon: PackageCheck, path: '/distributor/orders' },
    { name: 'Pharmacy Network', icon: Network, path: '/distributor/connections' },
    { name: 'Smart Stock Ingestion', icon: Zap, path: '/distributor/automation' },
    { name: 'Network Analytics', icon: TrendingUp, path: '/distributor/analytics' },
  ];

  const adminLinks = [
    { name: 'System Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Active Pharmacies', icon: Building, path: '/admin/pharmacies' },
    { name: 'Hospital Network', icon: Network, path: '/admin/hospitals' },
    { name: 'Distributor Master', icon: ShieldCheck, path: '/admin/distributors' },
    { name: 'Pending Approvals', icon: UserPlus, path: '/admin/approvals' },
    { name: 'System Settings', icon: Settings, path: '/admin/settings' },
  ];

  const links = (role === 'pharmacy' || role === 'branch_manager' || role === 'pharmacist') 
    ? pharmacyLinks 
    : role === 'distributor' 
    ? distributorLinks 
    : adminLinks;

  const handleLogout = () => {
    localStorage.removeItem('pharma_token');
    localStorage.removeItem('pharma_user');
    navigate('/auth');
  };

  return (
    <div
      className="w-64 h-screen flex flex-col fixed left-0 top-0 z-40 text-slate-300 overflow-hidden"
      style={{ backgroundColor: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Logo */}
      <div className="px-6 py-7 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          PHARMA<span style={{ color: 'var(--primary)' }}>SYNC</span>
          <div className="ml-2 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary)' }} />
        </h1>
        <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: '#64748B' }}>Smart Pharmacy Platform</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.name}
              onClick={() => navigate(link.path)}
              className="w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all group"
              style={{
                backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#CBD5E1',
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--sidebar-hover)'; if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1'; }}
            >
              <link.icon
                className="w-4 h-4 mr-3 flex-shrink-0 transition-colors"
                style={{ color: isActive ? '#FFFFFF' : '#64748B' }}
              />
              <span style={{ fontFamily: 'Poppins, sans-serif' }}>{link.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all group"
          style={{ color: '#F87171' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
        >
          <LogOut className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />
          <span style={{ fontFamily: 'Poppins, sans-serif' }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
