import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building, 
  MapPin, 
  Phone, 
  Users, 
  Plus, 
  UserCheck, 
  Key, 
  LogOut 
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  
  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  
  // Form states
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    managerEmail: ''
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pharmacist'
  });

  const fetchBranches = async () => {
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/branches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setBranches(data);
      if (data.length > 0 && !selectedBranch) {
        setSelectedBranch(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchStaff = async () => {
    if (!selectedBranch) return;
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/branches/${selectedBranch._id}/staff`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setStaff(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchBranchStaff();
  }, [selectedBranch]);

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${getBaseUrl()}/api/branches`, branchForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setBranches([...branches, data]);
      setIsBranchModalOpen(false);
      setBranchForm({ name: '', address: '', phone: '', managerEmail: '' });
    } catch (err) {
      alert('Failed to create branch');
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${getBaseUrl()}/api/branches/${selectedBranch._id}/staff`, staffForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      fetchBranchStaff();
      setIsStaffModalOpen(false);
      setStaffForm({ name: '', email: '', password: '', role: 'pharmacist' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create staff member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Building className="w-7 h-7 text-indigo-600 mr-3" />
            Pharmacy Multi-Branch Manager
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Configure locations, manage rosters, and assign branch staff roles
          </p>
        </div>
        <button
          onClick={() => setIsBranchModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-5 py-3 rounded-2xl flex items-center shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Branch Location
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 font-bold text-slate-400">Loading branch lists...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Branch list */}
          <div className="space-y-4">
            {branches.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border">
                <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-bold">No branches registered</p>
              </div>
            ) : (
              branches.map(b => (
                <div
                  key={b._id}
                  onClick={() => setSelectedBranch(b)}
                  className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all ${
                    selectedBranch?._id === b._id ? 'border-indigo-500 shadow-indigo-50' : 'border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-extrabold text-slate-800 text-sm">{b.name}</h3>
                    <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      {b.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{b.address}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{b.phone}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Roster / Staff list under branch */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col h-[70vh]">
            <div className="flex justify-between items-center pb-4 border-b mb-6">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  {selectedBranch ? `${selectedBranch.name} - Roster` : 'Roster Details'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Manage branch staff allocations
                </p>
              </div>
              
              {selectedBranch && (
                <button
                  onClick={() => setIsStaffModalOpen(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold text-[10px] uppercase px-4 py-2.5 rounded-xl transition-all"
                >
                  Add Staff Member
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {staff.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold text-xs italic">
                  No staff members allocated to this branch.
                </div>
              ) : (
                staff.map(s => (
                  <div key={s._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                        <Users className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs">{s.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{s.email}</p>
                      </div>
                    </div>

                    <span className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-xl">
                      {s.role.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Add Pharmacy Branch</h2>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g. PharmaSync Branch 2"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Branch Address</label>
                <input
                  type="text"
                  required
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="e.g. Sector 5, HSR Layout, Bangalore"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Branch Phone</label>
                <input
                  type="text"
                  required
                  value={branchForm.phone}
                  onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="e.g. 080-4567890"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-indigo-100"
              >
                Create Branch Location
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Add Staff Roster</h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="e.g. suresh.pharmacist@pharmasync.com"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Password Credentials</label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Password"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Roster Role</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold"
                >
                  <option value="pharmacist">Pharmacist</option>
                  <option value="branch_manager">Branch Manager</option>
                  <option value="delivery_executive">Delivery Executive</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-indigo-100"
              >
                Register Staff Credentials
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Branches;
