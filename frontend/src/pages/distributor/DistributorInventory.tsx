import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Package, 
  AlertCircle,
  TrendingDown,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface Product {
  _id?: string;
  name: string;
  composition: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  distributor?: string;
}

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const DistributorInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    composition: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    lowStockThreshold: 10,
    category: 'Tablet'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('pharma_user') || '{}');
      if (!user) return;
      
      const { data } = await axios.get(`${getBaseUrl()}/api/products?distributorId=${user._id || user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setProducts(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('pharma_user') || '{}');
      if (editMode && selectedProductId) {
        await axios.put(`${getBaseUrl()}/api/products/${selectedProductId}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        alert('Price & Stock Synchronized across network!');
      } else {
        const productPayload = {
          ...formData,
          distributor: user._id,
          expiryDate: new Date('2028-12-31').toISOString(),
        };
        await axios.post(`${getBaseUrl()}/api/products`, productPayload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        alert('Product added successfully!');
      }
      
      fetchInventory();
      setShowAddModal(false);
      setEditMode(false);
      setSelectedProductId(null);
      setFormData({
        name: '', composition: '', price: 0, costPrice: 0, stock: 0, lowStockThreshold: 10, category: 'Tablet'
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      composition: product.composition,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      category: product.category
    });
    setSelectedProductId(product._id!);
    setEditMode(true);
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this product from your catalog?')) return;
    try {
      await axios.delete(`${getBaseUrl()}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.composition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 max-w-lg w-full">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                 <Package className="w-5 h-5 mr-2 text-blue-600" /> {editMode ? 'Edit Product & Sync Price' : 'Add New Inventory Item'}
              </h3>
              
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Product Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Paracetamol 500mg" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Composition</label>
                    <input required type="text" value={formData.composition} onChange={e => setFormData({...formData, composition: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Paracetamol" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Powder">Powder</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Stock</label>
                    <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cost Price (₹)</label>
                    <input required type="number" min="0" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Selling Price (₹)</label>
                    <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button type="button" onClick={() => { setShowAddModal(false); setEditMode(false); }} className="flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
                    {editMode ? 'Update & Sync' : 'Save Product'}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Warehouse Inventory</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your catalog, pricing, and stock levels.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-5 py-3 flex items-center gap-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
           <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Package className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Products</p>
             <p className="text-3xl font-black text-slate-800 tracking-tight">{products.length}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
           <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><AlertTriangle className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low Stock Items</p>
             <p className="text-3xl font-black text-slate-800 tracking-tight">{lowStockCount}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
           <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl"><TrendingDown className="w-6 h-6" /></div>
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Out of Stock</p>
             <p className="text-3xl font-black text-slate-800 tracking-tight">{outOfStockCount}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 pl-6 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Item Details</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">In Stock</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Cost Price</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Selling Price</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Loading inventory...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                     <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                     <p className="font-bold text-slate-400 mb-2">No products found</p>
                     <p className="text-sm">Click 'Add Product' to expand your catalog.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
                  const isOut = p.stock === 0;
                  return (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800 text-sm tracking-tight">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.composition} • {p.category}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-black text-sm px-3 py-1 rounded-lg ${
                          isOut ? 'bg-rose-100 text-rose-700' : isLow ? 'bg-amber-100 text-amber-700' : 'text-slate-800 bg-slate-100'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-500">
                        ₹{p.costPrice.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-black text-slate-800">
                        ₹{p.price.toFixed(2)}
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${
                          isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                           {isOut ? <AlertCircle className="w-3 h-3" /> : isLow ? <AlertTriangle className="w-3 h-3" /> : null}
                           {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(p)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit Product">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p._id!)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors" title="Delete Product">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DistributorInventory;
