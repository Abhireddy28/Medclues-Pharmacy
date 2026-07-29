import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Search, Clock, CheckCircle2 } from 'lucide-react';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const hostname = window.location.hostname;
    return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
  };

  useEffect(() => {
    axios.get(`${getBaseUrl()}/api/orders`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
    }).then(({ data }) => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
          <ShoppingBag className="w-8 h-8 mr-3 text-emerald-600" />
          B2B Orders Management
        </h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">
          Review and process incoming bulk orders from connected pharmacies
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-3xl" />)
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <div key={order._id} className="bg-white border border-slate-100 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-xl">
               <div className="flex items-center space-x-6">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                     <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                        Order #{order._id.slice(-6).toUpperCase()}
                     </h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {order.items.length} Medicines • {order.paymentStatus}
                     </p>
                  </div>
               </div>
               
               <div className="flex items-center space-x-12">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                     <p className="text-xl font-black text-slate-900 tracking-tighter">₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{order.status}</span>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center bg-white border border-slate-100 rounded-[48px]">
             <Clock className="w-20 h-20 text-slate-50 mx-auto mb-6" />
             <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No active orders found in your partner network.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
