import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  TrendingUp, 
  ShoppingCart, 
  Clock,
  Package,
  Users,
  ClipboardList,
  PackageCheck,
  Bike
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const PharmacyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalSales: 84500,
    customersCount: 128,
    ordersCount: 45,
    activeCashiersCount: 5,
    lowStockCount: 0
  });
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(false);
  const [prescSummary, setPrescSummary] = useState({
    received: 0,
    verified: 0,
    packed: 0,
    delivery: 0
  });

  const stats = [
    { label: "Current Sales", value: `₹${summary.totalSales.toLocaleString()}`, change: "Live Updated", icon: TrendingUp, iconColor: '#2563EB', iconBg: '#EFF6FF', tab: 'profit' },
    { label: "Customers", value: `${summary.customersCount} Members`, change: "Active", icon: Users, iconColor: '#059669', iconBg: '#D1FAE5', tab: 'khata' },
    { label: "Orders", value: `${summary.ordersCount} Placed`, change: "Real-time", icon: ShoppingCart, iconColor: '#F59E0B', iconBg: '#FFFBEB', tab: 'order' },
    { label: "Active Cashiers", value: `${summary.activeCashiersCount} Cashiers`, change: "Live", icon: Clock, iconColor: '#8B5CF6', iconBg: '#F5F3FF', tab: 'profit' },
  ];

  const handleTabSwitch = (tab: string) => {
    if (tab === 'profit') {
      navigate('/pharmacy/analytics');
    } else if (tab === 'khata') {
      navigate('/pharmacy/khata');
    } else if (tab === 'inventory') {
      navigate('/pharmacy/inventory');
    } else if (tab === 'order') {
      navigate('/pharmacy/order');
    }
  };

  useEffect(() => {
    const baseUrl = getBaseUrl();
    const socket = io(baseUrl);

    socket.on('dashboardUpdate', (stats: any) => {
      console.log("[Socket] Live dashboard update:", stats);
      setSummary((prev: any) => ({
        ...prev,
        totalSales: stats.totalSales,
        customersCount: stats.customers,
        ordersCount: stats.orders,
        activeCashiersCount: stats.activeCashiers
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem('pharma_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return;
        
        const pharmacyId = user._id || user.id;

        const { data: ordersData } = await axios.get(`${getBaseUrl()}/api/orders/pharmacy/${pharmacyId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        setOrders(ordersData);

        const { data: inventory } = await axios.get(`${getBaseUrl()}/api/products`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        const lowStockCount = inventory.filter((p: any) => p.stock <= (p.lowStockThreshold || 10)).length;
        setSummary((prev: any) => ({ ...prev, lowStockCount }));

        try {
          const { data: prescData } = await axios.get(`${getBaseUrl()}/api/prescriptions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
          });
          const received = prescData.filter((p: any) => p.status === 'received').length;
          const verified = prescData.filter((p: any) => p.status === 'verified').length;
          const packed = prescData.filter((p: any) => p.status === 'packed').length;
          const delivery = prescData.filter((p: any) => p.status === 'out_for_delivery').length;
          setPrescSummary({ received, verified, packed, delivery });
        } catch (err) {
          console.error("Prescriptions fetch error", err);
        }

        setLoadingSupplies(true);
        const { data: supplierData } = await axios.get(`${getBaseUrl()}/api/products`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        setSupplierProducts(supplierData.slice(0, 10));
        setLoadingSupplies(false);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const user = JSON.parse(localStorage.getItem('pharma_user') || '{}');

  return (
    <div className="space-y-5 p-6 max-w-7xl mx-auto" style={{ backgroundColor: 'var(--background)', fontFamily: 'Poppins, Inter, sans-serif' }}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>
            Good Morning, {user?.name?.split(' ')[0] || 'Pharmacist'} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Here's what's happening with your pharmacy today.</p>
        </div>
        <div className="pharma-card flex items-center space-x-3 px-4 py-3">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Store Status</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Online</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            onClick={() => handleTabSwitch(stat.tab)}
            className="pharma-card p-5 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: stat.iconBg }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.iconColor }} />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F1F5F9', color: 'var(--text-secondary)' }}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Consultation Queue Alerts */}
      <div className="rounded-[18px] p-6 relative overflow-hidden" style={{ backgroundColor: 'var(--sidebar)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 blur-3xl rounded-full opacity-20" style={{ backgroundColor: 'var(--primary)' }} />
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <ClipboardList className="w-4 h-4 mr-2" style={{ color: 'var(--primary)' }} />
          Consultation Queue Alerts
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Received', count: prescSummary.received, sub: 'Pending verification', color: '#2563EB' },
            { label: 'Verification', count: prescSummary.verified, sub: 'Ready for packing', color: '#F59E0B' },
            { label: 'Packed', count: prescSummary.packed, sub: 'Awaiting dispatch', color: '#7C3AED' },
            { label: 'Out for Delivery', count: prescSummary.delivery, sub: 'On the way', color: '#EC4899' },
          ].map((item) => (
            <div
              key={item.label}
              onClick={() => navigate('/pharmacy/prescriptions')}
              className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: item.color }}>{item.label}</span>
              <p className="text-3xl font-bold text-white mt-1.5" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.count}</p>
              <p className="text-[10px] font-medium mt-1" style={{ color: '#64748B' }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Recent Orders */}
        <div className="lg:col-span-2 pharma-card p-6">
           <div className="flex justify-between items-center mb-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
             <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>Recent Orders</h2>
             <button onClick={() => navigate('/pharmacy/orders')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
               View All
             </button>
           </div>
           
           <div className="space-y-3">
              {orders.length > 0 ? orders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group" style={{ borderColor: 'var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-[10px] transition-all" style={{ backgroundColor: '#F1F5F9', color: 'var(--text-secondary)' }}>
                      #{order._id.slice(-4).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{order.items?.[0]?.product?.name || 'Order'}</h4>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {order.items?.length || 0} Items • {order.distributor?.shopName || 'Wholesaler'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                      order.status === 'accepted' ? 'badge-delivered' : 
                      order.status === 'rejected' ? 'badge-cancelled' :
                      'badge-received'
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-light)' }}>
                      {order.deliveryDate ? `Delivery: ${new Date(order.deliveryDate).toLocaleDateString()}` : `Placed ${new Date(order.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center">
                   <Package className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-light)' }} />
                   <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>No orders found yet.</p>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-5">
           {/* Supplier Marketplace */}
           <div className="pharma-card p-5">
              <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                 <h3 className="text-sm font-semibold flex items-center" style={{ color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>
                    <Package className="w-4 h-4 mr-2" style={{ color: 'var(--primary)' }} />
                    Supplier Marketplace
                 </h3>
                 <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>New Stock</span>
              </div>
              
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                 {loadingSupplies ? (
                    <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} /></div>
                 ) : supplierProducts.length > 0 ? supplierProducts.map((p) => (
                    <div key={p._id} className="p-3 rounded-xl border transition-all" style={{ backgroundColor: '#F8FAFC', borderColor: 'var(--border)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--primary-light)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F8FAFC'; }}
                    >
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</h4>
                             <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{p.distributor?.shopName || 'Supplier'}</p>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>₹{p.price}</span>
                       </div>
                       <button
                         onClick={() => handleTabSwitch('order')}
                         className="btn-primary w-full mt-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                       >
                          Order Pack
                       </button>
                    </div>
                 )) : (
                    <p className="text-[11px] text-center py-4 italic" style={{ color: 'var(--text-secondary)' }}>Connect to distributors to see their catalogs.</p>
                 )}
              </div>
           </div>

           {/* Quick Order */}
           <div className="rounded-[18px] p-5 text-white relative overflow-hidden" style={{ backgroundColor: 'var(--sidebar)' }}>
             <div className="absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full opacity-30" style={{ backgroundColor: 'var(--primary)' }} />
             <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Quick Order</h3>
             <p className="text-xs mb-5 relative z-10" style={{ color: '#94A3B8' }}>Instantly place orders for low stock items.</p>
             <button
               onClick={() => handleTabSwitch('order')}
               className="w-full py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center space-x-2 relative z-10"
               style={{ backgroundColor: 'var(--primary)', color: 'white' }}
             >
               <ShoppingCart className="w-4 h-4" />
               <span>Create Order</span>
             </button>
           </div>

           {/* Stock Alert */}
           <div className="pharma-card p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>Stock Alerts</h3>
              <div className="p-4 rounded-xl border-l-4" style={{ backgroundColor: '#FFFBEB', borderLeftColor: 'var(--warning)' }}>
                 <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                   Your <span className="font-semibold" style={{ color: 'var(--warning)' }}>Azithromycin</span> stock is moving fast! Suggest ordering 20 units.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
