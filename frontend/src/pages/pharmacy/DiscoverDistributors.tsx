import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Plus, Users, Zap } from 'lucide-react';

const DiscoverDistributors: React.FC = () => {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const getBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/connections/discover`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setDistributors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requestConnection = async (distributorId: string) => {
    try {
      await axios.post(`${getBaseUrl()}/api/connections/request`, { distributorId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      alert('Connection request sent!');
      fetchDistributors(); // Remove from discovery list
    } catch (err) {
      alert('Failed to send request');
    }
  };

  const filtered = distributors.filter(d => 
    d.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-indigo-600" />
            Discover Distributors
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">
            Build your B2B supply network to access medicine catalogs
          </p>
        </div>
        
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name or category..." 
            className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50 transition-all font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dist) => (
            <div key={dist._id} className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group border-b-4 border-b-slate-50">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-indigo-600">{dist.shopName[0]}</span>
                </div>
                <button 
                  onClick={() => requestConnection(dist._id)}
                  className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600 transition-all active:scale-90 shadow-lg shadow-slate-200 group-hover:shadow-indigo-200"
                >
                  <Plus className="w-5 h-5 font-black" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">{dist.shopName}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{dist.name} • Distributor</p>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-slate-500 text-sm font-bold">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {dist.address || 'Location Hidden'}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                     <Zap className="w-3 h-3 mr-1" /> Verified Supplier
                   </div>
                   <button 
                     onClick={() => requestConnection(dist._id)}
                     className="text-[11px] font-black text-slate-400 uppercase hover:text-indigo-600 transition-colors"
                   >
                     Request Connection
                   </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <Users className="w-16 h-16 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No distributors found to connect with.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscoverDistributors;
