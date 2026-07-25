import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Network, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  ShoppingCart,
  Package,
  ArrowRight,
  TrendingUp,
  Search,
  Plus
} from 'lucide-react';

const Connections: React.FC = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistributor, setSelectedDistributor] = useState<any>(null);
  const [distributorProducts, setDistributorProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem('pharma_user') || '{}');

  const getBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/connections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setConnections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributorProducts = async (distributorId: string) => {
    setLoadingProducts(true);
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/products?distributorId=${distributorId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setDistributorProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenCatalog = (distributor: any) => {
    setSelectedDistributor(distributor);
    setSelectedItems([]);
    fetchDistributorProducts(distributor._id);
  };

  const toggleItemSelection = (product: any) => {
    if (selectedItems.find(item => item._id === product._id)) {
      setSelectedItems(selectedItems.filter(item => item._id !== product._id));
    } else {
      setSelectedItems([...selectedItems, product]);
    }
  };

  const proceedToOrder = () => {
    // Pass selected items to Order page via localStorage or state
    localStorage.setItem('pending_order_items', JSON.stringify({
      distributor: selectedDistributor,
      items: selectedItems.map(item => ({ ...item, qty: 1 }))
    }));
    navigate('/pharmacy/order');
  };

  const handleResponse = async (id: string, status: string) => {
    try {
      await axios.put(`${getBaseUrl()}/api/connections/respond`, { connectionId: id, status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      fetchConnections();
    } catch (err) {
      alert('Failed to update connection status');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen relative">
      
      {/* Slide-out Catalog Modal */}
      {selectedDistributor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500] flex justify-end animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDistributor.shopName}</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Distributor Live Catalog</p>
                </div>
                <button onClick={() => setSelectedDistributor(null)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                   <XCircle className="w-6 h-6 text-slate-400" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {loadingProducts ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                     <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching Stock Data...</p>
                  </div>
                ) : distributorProducts.length > 0 ? (
                  distributorProducts.map((p) => {
                    const isSelected = selectedItems.find(item => item._id === p._id);
                    return (
                      <div 
                        key={p._id} 
                        onClick={() => toggleItemSelection(p)}
                        className={`p-5 rounded-[24px] border transition-all cursor-pointer flex items-center justify-between group ${isSelected ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/10 shadow-lg shadow-emerald-500/5' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}
                      >
                         <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-300 border-slate-100'}`}>
                               <Package className="w-6 h-6" />
                            </div>
                            <div>
                               <h4 className="font-black text-slate-800 text-sm">{p.name}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.composition || 'General Formulation'}</p>
                            </div>
                         </div>
                         <div className="flex items-center space-x-6 text-right">
                            <div>
                               <p className="text-xs font-black text-slate-800">₹{p.price}</p>
                               <p className={`text-[9px] font-bold uppercase tracking-widest ${p.stock > 10 ? 'text-emerald-500' : 'text-rose-500'}`}>{p.stock} In Stock</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100'}`}>
                               <Plus className={`w-3 h-3 ${isSelected ? 'rotate-45' : ''} transition-transform`} />
                            </div>
                         </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20">
                     <Package className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                     <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">This distributor hasn't added any products to their digital catalog yet.</p>
                  </div>
                )}
             </div>

             {selectedItems.length > 0 && (
               <div className="p-8 border-t border-slate-100 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between mb-6">
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selection Summary</p>
                        <h3 className="text-xl font-black text-slate-900">{selectedItems.length} Medicines Picked</h3>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approx Total</p>
                        <h3 className="text-xl font-black text-emerald-600">₹{selectedItems.reduce((acc, i) => acc + i.price, 0)}</h3>
                     </div>
                  </div>
                  <button 
                    onClick={proceedToOrder}
                    className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center group"
                  >
                    Proceed to Quantities
                    <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
             )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Network className="w-8 h-8 mr-3 text-emerald-600" />
            Partner Network
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">
            {user.role === 'pharmacy' ? 'Access connected distributor catalogs' : 'Review incoming pharmacy connection requests'}
          </p>
        </div>
        {user.role === 'pharmacy' && (
           <div className="hidden md:flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Instant Market Access</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-[32px]" />)}
          </div>
        ) : connections.length > 0 ? (
          connections.map((conn) => {
            const partner = user.role === 'pharmacy' ? conn.distributor : conn.pharmacy;
            return (
              <div key={conn._id} className={`bg-white border rounded-[40px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all hover:shadow-2xl hover:-translate-y-1 group ${conn.status === 'active' ? 'border-emerald-100' : 'border-slate-100'}`}>
                <div className="flex items-center space-x-8">
                  <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110 duration-500 ${conn.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <span className="text-3xl font-black uppercase text-center">{partner.shopName[0]}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                         {partner.shopName}
                       </h3>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         conn.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 font-bold' : 
                         conn.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 font-bold' : 
                         'bg-rose-50 text-rose-600 border-rose-100 font-bold'
                       }`}>
                         {conn.status}
                       </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {partner.name} • {user.role === 'pharmacy' ? 'Gold Distributor' : 'Pharmacy Member'}
                    </p>
                    
                    <div className="flex flex-wrap gap-6 mt-4">
                      <div className="flex items-center text-xs font-black text-slate-500">
                        <Phone className="w-4 h-4 mr-2 text-slate-400" />
                        {partner.phone}
                      </div>
                      <div className="flex items-center text-xs font-black text-slate-500">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                        {partner.address || 'Location Hidden'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-4 min-w-[240px]">
                  {user.role === 'distributor' && conn.status === 'pending' ? (
                    <div className="flex space-x-3 w-full">
                       <button 
                         onClick={() => handleResponse(conn._id, 'active')}
                         className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 active:scale-95 shadow-xl shadow-emerald-200 transition-all"
                       >
                         Approve
                       </button>
                       <button 
                         onClick={() => handleResponse(conn._id, 'rejected')}
                         className="bg-slate-50 text-rose-500 border border-slate-100 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all"
                       >
                         Reject
                       </button>
                    </div>
                  ) : user.role === 'pharmacy' && conn.status === 'active' ? (
                    <button 
                      onClick={() => handleOpenCatalog(partner)}
                      className="w-full bg-slate-900 text-white px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-2xl flex items-center justify-center space-x-2"
                    >
                       <ShoppingCart className="w-4 h-4" />
                       <span>Browse Marketplace</span>
                    </button>
                  ) : conn.status === 'active' ? (
                    <div className="bg-emerald-50 text-emerald-600 py-3 px-6 rounded-2xl border border-emerald-100">
                       <p className="text-[10px] font-black uppercase tracking-widest flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                        Active Partner
                       </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-600 py-3 px-6 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-black uppercase tracking-widest flex items-center italic">
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        Awaiting Response
                      </p>
                    </div>
                  )}
                  
                  {conn.connectionDate && (
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Since {new Date(conn.connectionDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-32 text-center bg-white border border-slate-100 rounded-[64px] shadow-sm">
            <Network className="w-24 h-24 text-slate-50 mx-auto mb-8 animate-pulse" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Supply Network Empty</h3>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-3 max-w-sm mx-auto leading-relaxed">
              Accept connection requests from pharmacies or discover new suppliers to start business.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
