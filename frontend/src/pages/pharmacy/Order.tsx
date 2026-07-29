import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Clock,
  XCircle,
  ArrowRight,
  Package
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const Order: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);

  const [distributors, setDistributors] = useState<any[]>([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('');
  const [showDistributorModal, setShowDistributorModal] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${getBaseUrl()}/api/products`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    const fetchDistributors = async () => {
      try {
        const { data } = await axios.get(`${getBaseUrl()}/api/profile/all-distributors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        setDistributors(data);
      } catch (error) {
        console.error('Error fetching distributors:', error);
      }
    };

    fetchProducts();
    fetchDistributors();

    // ERP UPGRADE: Auto-load items picked from Partner Network
    const pendingOrder = localStorage.getItem('pending_order_items');
    if (pendingOrder) {
      try {
        const { distributor, items } = JSON.parse(pendingOrder);
        setOrderItems(items);
        setSelectedDistributorId(distributor._id);
        // Clear it so it doesn't persist on reload
        localStorage.removeItem('pending_order_items');
      } catch (e) {
        console.error('Error loading pending order:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.composition.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  const addToCart = (product: any) => {
    const existing = orderItems.find(item => item._id === product._id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item._id === product._id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { ...product, qty: 1 }]);
    }
    setSearchQuery('');
  };

  const removeFromCart = (id: string) => {
    setOrderItems(orderItems.filter(item => item._id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setOrderItems(orderItems.map(item => 
      item._id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const total = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const placeOrder = async () => {
    if (orderItems.length === 0) return;
    setShowDistributorModal(true);
  };

  const confirmPlaceOrder = async () => {
    if (!selectedDistributorId) return alert('Please select a distributor');
    setIsPlacing(true);
    setShowDistributorModal(false);
    try {
      const userStr = localStorage.getItem('pharma_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) throw new Error('User not found');

      const distributorId = selectedDistributorId;

      const orderData = {
        pharmacy: user._id || user.id,
        distributor: distributorId,
        items: orderItems.map(item => ({
          product: item._id,
          quantity: item.qty,
          price: item.price
        })),
        totalAmount: total,
        status: 'pending'
      };

      await axios.post(`${getBaseUrl()}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      alert('Order placed successfully! It will now appear in the distributor dashboard.');
      setOrderItems([]);
      setSelectedDistributorId('');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. (Make sure you have an order route in backend)');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Distributor Selection Modal */}
      {showDistributorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select Distributor</h3>
              <p className="text-slate-500 font-medium text-xs mb-6">Choose which distributor should supply these medicines.</p>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {distributors.length === 0 ? (
                   <p className="text-sm text-slate-500">No distributors found in the system.</p>
                ) : (
                  distributors.map(dist => (
                    <label key={dist._id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedDistributorId === dist._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                       <input 
                         type="radio" 
                         name="distributor" 
                         value={dist._id}
                         checked={selectedDistributorId === dist._id}
                         onChange={(e) => setSelectedDistributorId(e.target.value)}
                         className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                       />
                       <div>
                         <p className="font-bold text-slate-800 text-sm">{dist.shopName || dist.name}</p>
                         <p className="text-[10px] text-slate-500 uppercase tracking-wider">{dist.location || dist.address || 'Unknown Location'}</p>
                       </div>
                    </label>
                  ))
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => setShowDistributorModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmPlaceOrder}
                  disabled={!selectedDistributorId || isPlacing}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {isPlacing ? 'Placing...' : 'Confirm Order'}
                </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
            <ShoppingCart className="w-5 h-5 mr-3 text-blue-600" />
            Distributor Orders
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-1">Search medicines and send orders directly to distributors.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-8 min-h-[70vh]">
           <div className="flex flex-col space-y-4 relative">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                Search & Add Medicines
                <span className="ml-3 text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Live Search</span>
              </h2>
              
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type 'para' to find Paracetamol..." 
                  className="w-full bg-slate-50 p-4 pl-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all font-medium text-sm text-slate-800 shadow-sm"
                  autoFocus
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-2 z-50 overflow-hidden">
                    {searchResults.map((product) => (
                      <div 
                        key={product._id}
                        onClick={() => addToCart(product)}
                        className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group/item"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.composition}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-blue-600 font-bold text-sm">₹{product.price}</span>
                          <button className="p-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead>
                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                       <th className="px-4 py-3">Medicine Info</th>
                       <th className="px-4 py-3 text-center">Quantity</th>
                       <th className="px-4 py-3 text-right">Subtotal</th>
                       <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                 </thead>
                 <tbody>
                    {orderItems.length > 0 ? orderItems.map((item) => (
                      <tr key={item._id} className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4">
                           <div className="flex flex-col">
                              <span className="font-bold text-sm text-slate-800">{item.name}</span>
                              <span className="text-[10px] font-medium text-slate-400">Distributor: Registered Firm</span>
                           </div>
                        </td>
                        <td className="px-4 py-4">
                           <div className="flex items-center justify-center space-x-3 bg-slate-50 p-1 rounded-lg w-fit mx-auto border border-slate-100">
                             <button onClick={() => updateQty(item._id, -1)} className="p-1.5 hover:bg-white hover:text-rose-500 rounded text-slate-400 transition-colors"><Minus className="w-3 h-3" /></button>
                             <span className="font-bold text-slate-800 text-sm w-8 text-center">{item.qty}</span>
                             <button onClick={() => updateQty(item._id, 1)} className="p-1.5 hover:bg-white hover:text-blue-600 rounded text-slate-400 transition-colors"><Plus className="w-3 h-3" /></button>
                           </div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900 text-sm">₹{(item.price * item.qty).toFixed(2)}</td>
                        <td className="px-4 py-4 text-center">
                           <button onClick={() => removeFromCart(item._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-400 font-medium text-sm">Your order list is empty. Use search to add medicines.</p>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>

           <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                 <button 
                  onClick={placeOrder}
                  disabled={orderItems.length === 0 || isPlacing}
                  className="bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-800 flex items-center space-x-2"
                 >
                   <span>{isPlacing ? 'Placing...' : 'Send to Distributor'}</span>
                   <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
              <div className="text-right">
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Estimated Total</p>
                 <p className="text-2xl font-bold text-slate-800 tracking-tight">₹{total.toFixed(2)}</p>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-xl p-6 text-white shadow relative overflow-hidden">
              <h3 className="text-base font-bold mb-6">Recent Sent Orders</h3>
              <div className="space-y-4 relative z-10">
                 <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">#ORD-001</span>
                       <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="font-bold text-sm">Paracetamol Bulk</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Awaiting Confirmation</p>
                 </div>
                 <button className="w-full bg-white/10 text-white py-3 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-white/20 transition-all mt-2">
                    Full Order History
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-rose-500" />
                Manual Entry
              </h3>
              <p className="text-slate-400 font-medium text-[11px] mb-6 leading-relaxed">Add orders noted via phone or manual registers for tracking.</p>
              <button className="w-full bg-slate-50 text-slate-900 py-3 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all border border-slate-100 active:scale-95">
                Add Manual Order
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
