import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from './pages/auth/AuthPage';
import Layout from './components/Layout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Pharmacy Pages
import PharmacyDashboard from './pages/pharmacy/Dashboard';
import Billing from './pages/pharmacy/Billing';
import DiscoverDistributors from './pages/pharmacy/DiscoverDistributors';
import Connections from './pages/pharmacy/Connections';
import Inventory from './pages/pharmacy/Inventory';
import Khata from './pages/pharmacy/Khata';
import CustomerHistory from './pages/pharmacy/CustomerHistory';
import ProfitToday from './pages/pharmacy/ProfitToday';
import Order from './pages/pharmacy/Order';
import Profile from './pages/pharmacy/Profile';
import Notifications from './pages/pharmacy/Notifications';
import HospitalIntegrations from './pages/pharmacy/HospitalIntegrations';
import PrescriptionQueue from './pages/pharmacy/PrescriptionQueue';
import Branches from './pages/pharmacy/Branches';
import DeliveryModule from './pages/pharmacy/DeliveryModule';

// Distributor Pages
import DistributorDashboard from './pages/distributor/Dashboard';
import InventoryAutomation from './pages/distributor/InventoryAutomation';
import Orders from './pages/distributor/Orders';
import DistributorInventory from './pages/distributor/DistributorInventory';
import Collaborations from './pages/distributor/Collaborations';

// Wrapper to handle navigation inside Router
const AppContent: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('pharma_token', userData.token);
    localStorage.setItem('pharma_user', JSON.stringify(userData));
    
    // Role-based redirection
    if (userData.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (userData.role === 'pharmacy' || userData.role === 'branch_manager' || userData.role === 'pharmacist') {
      navigate('/pharmacy/dashboard');
    } else if (userData.role === 'delivery_executive') {
      navigate('/delivery/dashboard');
    } else if (userData.role === 'distributor') {
      navigate('/distributor/dashboard');
    }
  };

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage onLogin={handleLoginSuccess} />} />
      
      <Route element={<Layout />}>
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard activeTab="dashboard" />} />
        <Route path="/admin/approvals" element={<AdminDashboard activeTab="approvals" />} />
        <Route path="/admin/pharmacies" element={<AdminDashboard activeTab="pharmacies" />} />
        <Route path="/admin/hospitals" element={<AdminDashboard activeTab="hospitals" />} />
        <Route path="/admin/distributors" element={<AdminDashboard activeTab="distributors" />} />
        <Route path="/admin/settings" element={<AdminDashboard activeTab="system" />} />

        {/* Pharmacy Routes */}
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
        <Route path="/pharmacy/billing" element={<Billing />} />
        <Route path="/pharmacy/discover" element={<DiscoverDistributors />} />
        <Route path="/pharmacy/suppliers" element={<DiscoverDistributors />} />
        <Route path="/pharmacy/connections" element={<Connections />} />
        <Route path="/pharmacy/inventory" element={<Inventory />} />
        <Route path="/pharmacy/khata" element={<Khata />} />
        <Route path="/pharmacy/customer-history" element={<CustomerHistory />} />
        <Route path="/pharmacy/analytics" element={<ProfitToday />} />
        <Route path="/pharmacy/order" element={<Order />} />
        <Route path="/pharmacy/orders" element={<Order />} />
        <Route path="/pharmacy/profile" element={<Profile />} />
        <Route path="/pharmacy/notifications" element={<Notifications />} />
        <Route path="/pharmacy/hospital-integrations" element={<HospitalIntegrations />} />
        <Route path="/pharmacy/hospital-sync" element={<HospitalIntegrations />} />
        <Route path="/pharmacy/prescriptions" element={<PrescriptionQueue />} />
        <Route path="/pharmacy/branches" element={<Branches />} />
        <Route path="/pharmacy/delivery" element={<DeliveryModule />} />
        <Route path="/delivery/dashboard" element={<DeliveryModule />} />

        {/* Distributor Routes */}
        <Route path="/distributor/dashboard" element={<DistributorDashboard />} />
        <Route path="/distributor/automation" element={<InventoryAutomation />} />
        <Route path="/distributor/connections" element={<Connections />} />
        <Route path="/distributor/orders" element={<Orders />} />
        <Route path="/distributor/inventory" element={<DistributorInventory />} />
        <Route path="/distributor/collaborations" element={<Collaborations />} />
        <Route path="/distributor/analytics" element={<Collaborations />} />
        
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
