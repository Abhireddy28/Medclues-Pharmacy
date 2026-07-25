import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Activity, 
  Users, 
  ShieldCheck,
  Building,
  Mail,
  BarChart3,
  Trash2,
  Settings,
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  Search,
  CheckCircle2,
  History,
  FileText
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  shopName?: string;
  phone?: string;
  address?: string;
  idProof?: string;
  createdAt: string;
  status: string;
}

interface AdminStats {
  pharmaciesCount: number;
  distributorsCount: number;
  pendingCount: number;
  totalOrders: number;
  totalVolume: number;
}

interface AdminDashboardProps {
  activeTab: string;
}

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: usersData } = await axios.get(`${getBaseUrl()}/api/admin/pending-users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setPendingUsers(usersData);

      const { data: statsData } = await axios.get(`${getBaseUrl()}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setStats(statsData);

      const { data: allUsersData } = await axios.get(`${getBaseUrl()}/api/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setAllUsers(allUsersData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.put(`${getBaseUrl()}/api/admin/approve-user/${id}`, { status: 'approved' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      fetchData();
      alert('User approved successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm('Reject this registration?')) {
      try {
        await axios.put(`${getBaseUrl()}/api/admin/reject-user/${id}`, { status: 'rejected' }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      if (!window.confirm('PERMANENTLY remove this user? This cannot be undone.')) return;
      await axios.delete(`${getBaseUrl()}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setAllUsers(allUsers.filter(u => u._id !== id));
      fetchData(); // Refresh stats
      alert('User removed safely.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Delete failed.');
    }
  };

  const filteredUsers = allUsers.filter(u => 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.shopName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pharmacists = filteredUsers.filter(u => u.role === 'pharmacy');
  const distributors = filteredUsers.filter(u => u.role === 'distributor');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            {activeTab === 'dashboard' && <><Activity className="w-8 h-8 mr-3 text-blue-600" /> System Overview</>}
            {activeTab === 'approvals' && <><ShieldCheck className="w-8 h-8 mr-3 text-emerald-600" /> Registration Registry</>}
            {activeTab === 'distributors' && <><Building className="w-8 h-8 mr-3 text-indigo-600" /> Global Distributors</>}
            {activeTab === 'pharmacies' && <><Users className="w-8 h-8 mr-3 text-blue-600" /> Pharmacy Network</>}
            {activeTab === 'system' && <><Settings className="w-8 h-8 mr-3 text-slate-600" /> Infrastructure</>}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            {activeTab === 'dashboard' && 'Medchain Global Real-time Performance'}
            {activeTab === 'approvals' && 'Review pending access requests and historical logs'}
            {activeTab === 'distributors' && 'Directory of all approved supply partners'}
            {activeTab === 'pharmacies' && 'Complete registry of verified medical outlets'}
            {activeTab === 'system' && 'Core platform configuration and diagnostics'}
          </p>
        </div>
        
        {['distributors', 'pharmacies', 'approvals'].includes(activeTab) && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Stats Quick Cards (Always show on home, mini versions elsewhere) */}
      {(activeTab === 'dashboard' || activeTab === 'distributors' || activeTab === 'pharmacies') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-6 rounded-3xl border transition-all ${activeTab === 'pharmacies' ? 'border-blue-600 bg-blue-50' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pharmacies</p>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.pharmaciesCount || 0}</p>
          </div>
          <div className={`p-6 rounded-3xl border transition-all ${activeTab === 'distributors' ? 'border-indigo-600 bg-indigo-50' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Distributors</p>
              <Building className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.distributorsCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Orders</p>
              <ShoppingCart className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.totalOrders || 0}</p>
          </div>
          <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-600/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Economic Volume</p>
              <BarChart3 className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-2xl font-black">₹{(stats?.totalVolume || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        
        {/* VIEW: APPROVALS (Combined Pending & Accepted) */}
        {activeTab === 'approvals' && (
          <div className="divide-y divide-slate-100">
             {/* Pending Section */}
             <div className="p-6 bg-amber-50/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-amber-500" /> Pending Authorizations
                  </h3>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Needs Review: {pendingUsers.length}</span>
                </div>
                
                {pendingUsers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm italic font-medium">No active requests in queue</div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map(u => (
                      <div key={u._id} className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black">{u.name?.[0]}</div>
                            <div>
                               <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                               <p className="text-[11px] text-slate-500 mt-0.5">{u.email} • <span className="font-bold text-amber-600 uppercase tracking-tighter">{u.role}</span></p>
                            </div>
                         </div>
                         <div className="flex space-x-2">
                            {u.idProof && (
                               <a 
                                 href={u.idProof} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                 title="View Verification ID"
                               >
                                  <FileText className="w-5 h-5" />
                               </a>
                            )}
                            <button onClick={() => handleApprove(u._id)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                               <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleReject(u._id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                               <XCircle className="w-5 h-5" />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {/* Registry Section (Accepted Requests) */}
             <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <History className="w-4 h-4 mr-2 text-blue-500" /> Registration Registry (Accepted)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="pb-4">Entity</th>
                            <th className="pb-4">Authorized On</th>
                            <th className="pb-4 text-center">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {allUsers.length === 0 ? (
                           <tr><td colSpan={3} className="py-20 text-center text-slate-400">No finalized requests found</td></tr>
                         ) : (
                           allUsers.slice(0, 10).map(u => (
                             <tr key={u._id} className="group transition-colors hover:bg-slate-50/50">
                                <td className="py-4">
                                   <p className="font-bold text-slate-700 text-sm">{u.shopName || u.name}</p>
                                   <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{u.role}</p>
                                </td>
                                <td className="py-4 text-slate-500 text-xs font-medium">
                                   {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-center">
                                   <span className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                      <CheckCircle2 className="w-3 h-3 mr-1.5" /> Approved
                                   </span>
                                </td>
                             </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: DISTRIBUTORS */}
        {activeTab === 'distributors' && (
          <div className="p-0">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Authorized Supply Network</p>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-bold text-slate-400 italic">Total: {distributors.length}</span>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {distributors.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-400">0 supply partners found</div>
                ) : (
                  distributors.map(d => (
                    <div key={d._id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Building className="w-20 h-20" />
                       </div>
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                          <Building className="w-6 h-6" />
                       </div>
                       <h3 className="font-black text-slate-900 tracking-tight leading-tight mb-2">{d.name}</h3>
                       <div className="space-y-2 mt-4">
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                             <Mail className="w-3.5 h-3.5 mr-2 text-slate-300" /> {d.email}
                          </div>
                          <div className="flex items-center text-xs text-slate-400">
                             <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-400" /> Verified System Partner
                          </div>
                       </div>
                       <button onClick={() => handleDeleteUser(d._id)} className="mt-6 w-full py-2.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100">
                          Terminate Access
                       </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {/* VIEW: PHARMACIES */}
        {activeTab === 'pharmacies' && (
          <div className="p-0 text-center">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Authorized Medical Outlets</p>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-bold text-slate-400 italic">Total: {pharmacists.length}</span>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {pharmacists.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-400">0 verified pharmacies found</div>
                ) : (
                  pharmacists.map(p => (
                    <div key={p._id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Users className="w-20 h-20" />
                       </div>
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                          <ShoppingCart className="w-6 h-6" />
                       </div>
                       <h3 className="font-black text-slate-900 tracking-tight leading-tight mb-1">{p.shopName || p.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{p.address || 'Global Access'}</p>
                       <div className="space-y-1.5 border-t border-slate-50 pt-4">
                          <p className="text-[11px] font-medium text-slate-600 flex items-center opacity-70">
                             <Mail className="w-3 h-3 mr-2" /> {p.email}
                          </p>
                          <p className="text-[11px] font-bold text-emerald-600 flex items-center">
                             <CheckCircle2 className="w-3 h-3 mr-2" /> Active Pharmacy Hub
                          </p>
                       </div>
                       <button onClick={() => handleDeleteUser(p._id)} className="mt-6 w-full py-2.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100">
                          Revoke License
                       </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {/* VIEW: DASHBOARD (Full Stats) */}
        {activeTab === 'dashboard' && (
          <div className="p-10">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">System Infrastructure</h3>
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex items-center space-x-4 mb-4">
                         <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm"><Settings className="w-6 h-6" /></div>
                         <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Network Integrity</p>
                            <p className="font-bold text-slate-800">Verified & Operational</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
                         <TrendingUp className="w-3 h-3 text-emerald-500" />
                         <span>Real-time Ecosystem Sync Active</span>
                      </div>
                   </div>
                </div>
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-10">
                      <BarChart3 className="w-40 h-40" />
                   </div>
                   <h3 className="text-2xl font-black tracking-tight mb-8 relative z-10">Administrative Control Center</h3>
                   <p className="text-slate-400 text-sm font-medium mb-12 relative z-10 leading-relaxed">
                      You are overseeing {(stats?.pharmaciesCount || 0) + (stats?.distributorsCount || 0)} verified businesses. Manage registration flows and supply connectivity from your specialized console.
                   </p>
                   <div className="flex items-center space-x-3 relative z-10">
                      <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Live Monitoring Session</span>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: SYSTEM SETTINGS */}
        {activeTab === 'system' && (
          <div className="p-12 text-center py-20">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Settings className="w-10 h-10" />
             </div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">Backend Configuration</h3>
             <p className="text-slate-500 mt-4 max-w-md mx-auto text-sm font-medium">Core system protocols and region-based pricing logic controls will be situated here in the next update.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
