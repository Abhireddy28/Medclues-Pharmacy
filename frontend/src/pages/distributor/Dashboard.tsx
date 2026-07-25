import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  Truck, 
  Wallet, 
  AlertCircle,
  TrendingUp,
  History,
  Camera,
  Signature,
  XCircle
} from 'lucide-react';

const getBaseUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const DistributorDashboard: React.FC<{ onSwitchTab?: (tab: string) => void }> = ({ onSwitchTab }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: "Total Orders", value: "0", change: "0 New", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Shipments", value: "0", change: "0 Urgent", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Payments Due", value: "₹0", change: "₹0 Today", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Low Inventory", value: "0 SKUs", change: "Check Stock", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userStr = localStorage.getItem('pharma_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return;

        const distributorId = user._id || user.id;
        const { data } = await axios.get(`${getBaseUrl()}/api/orders/distributor/${distributorId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        setOrders(data);
        
        // Update stats based on real data
        const pendingCount = data.filter((o: any) => o.status === 'pending').length;
        setStats(prev => [
          { ...prev[0], value: data.length.toString(), change: `${pendingCount} New` },
          { ...prev[1], value: pendingCount.toString(), change: `${pendingCount} Urgent` },
          ...prev.slice(2)
        ]);
      } catch (error) {
        console.error('Error fetching distributor orders:', error);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, status: string, dDate?: string) => {
    try {
      const payload: any = { status };
      if (dDate) payload.deliveryDate = dDate;
      if (status === 'accepted' && !dDate) {
         setSelectedOrderId(orderId);
         return;
      }
      
      const { data } = await axios.put(`${getBaseUrl()}/api/orders/${orderId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setOrders(orders.map(o => o._id === orderId ? data : o));
      setSelectedOrderId(null);
      setDeliveryDate('');
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto relative">
      {/* Acceptance Modal Tooltip/Overlay */}
      {selectedOrderId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-sm w-full animate-in fade-in zoom-in duration-300">
              <div className="flex bg-blue-50 w-12 h-12 rounded-xl items-center justify-center mb-6">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Accept Order</h3>
              <p className="text-slate-500 font-medium text-xs mb-6">Please specify an expected delivery date for this order.</p>
              
              <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Delivery Date</label>
                   <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                   />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={() => setSelectedOrderId(null)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedOrderId, 'accepted', deliveryDate)}
                    disabled={!deliveryDate}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Distributor Control Center</h1>
          <p className="text-slate-500 font-medium text-xs mt-1">Manage incoming pharmacy orders and track logistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-50 hover:border-blue-100 transition-colors group">
            <div className="flex justify-between items-start mb-6">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 bg-white rounded-xl p-8 border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                Incoming Pharmacy Orders
                <span className="ml-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {orders.filter(o => o.status === 'pending').length} New
                </span>
              </h2>
              <button className="text-blue-600 font-bold text-xs uppercase hover:underline flex items-center">
                History <History className="w-3 h-3 ml-2" />
              </button>
           </div>
           
           <div className="space-y-4">
              {orders.length > 0 ? orders.map((order) => (
                <div key={order._id} className="p-6 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer bg-white group shadow-sm hover:shadow-md">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex items-start space-x-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-xs">
                        #{order._id.slice(-4).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{order.pharmacy?.shopName || 'Pharmacy Store'}</h4>
                        <p className="text-[11px] text-slate-500 font-bold mb-3 uppercase tracking-wider">
                          {order.items?.length || 0} Items • Total: ₹{order.totalAmount?.toFixed(2)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.items?.slice(0, 2).map((item: any, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-white text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-100">
                              {item.product?.name} x{item.quantity}
                            </span>
                          ))}
                          {order.items?.length > 2 && <span className="text-[9px] text-slate-400 font-bold">+ {order.items.length - 2} more</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <div className="flex items-center space-x-2">
                        {order.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(order._id, 'accepted')}
                              className="bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-blue-600 transition-all shadow-sm active:scale-95"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(order._id, 'rejected')}
                              className="p-2.5 bg-slate-50 text-rose-500 rounded-lg hover:bg-rose-50 transition-all active:scale-95 border border-slate-100"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center space-x-2 ${
                            order.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            <span>{order.status}</span>
                            {order.deliveryDate && (
                              <>
                                <span className="w-1 h-1 bg-emerald-200 rounded-full mx-2"></span>
                                <span className="text-[8px] font-black opacity-60">Del: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">Ordered today</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center">
                  <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium text-sm">No new orders found in your queue.</p>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-800 rounded-xl p-8 text-white shadow relative overflow-hidden">
              <h3 className="text-base font-bold mb-2">Delivery Proof</h3>
              <p className="text-slate-400 font-medium text-[11px] mb-8 leading-relaxed">Capture signatures and photos to finalize order fulfillment.</p>
              
              <div className="space-y-4">
                 <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Attach Photo</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Proof of delivery</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="p-3 bg-emerald-600 rounded-lg">
                      <Signature className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Sign-off</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Customer signature</p>
                    </div>
                 </div>
              </div>
              
              <button className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg mt-8 hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                Dispatch Items
              </button>
           </div>

           <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                Payment Pulse
                <TrendingUp className="w-4 h-4 ml-3 text-emerald-500" />
              </h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">Avg. Payout Time</span>
                    <span className="text-emerald-600 font-bold text-lg">4.2 Days</span>
                 </div>
                 <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-50">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-50 border-dashed">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Reliability Index</span>
                    <span className="text-slate-800 font-bold text-sm tracking-tight text-right">Excellent <br/><span className="text-emerald-500">+2%</span></span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;
