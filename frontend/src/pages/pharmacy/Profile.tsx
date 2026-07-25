import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  FileText, 
  Shield, 
  LogOut, 
  Lock,
  PhoneCall,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // User Data
  const [userData, setUserData] = useState<any>({ name: '', email: '', phone: '' });
  
  // Pharmacy Profile Data
  const [profileData, setProfileData] = useState<any>({
    pharmacyName: '', address: '', gstNumber: '', licenseNumber: '', openingTime: '', closingTime: ''
  });

  // Distributor Info
  const [distributor, setDistributor] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState(0);

  // Security Data
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const userId = JSON.parse(localStorage.getItem('pharma_user') || '{}')._id || JSON.parse(localStorage.getItem('pharma_user') || '{}').id;

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      if (!userId) return;
      const res = await axios.get(`${getBaseUrl()}/api/profile?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      if (res.data.user) {
        setUserData({ name: res.data.user.name, email: res.data.user.email, phone: res.data.user.phone || '' });
      }
      if (res.data.profile) {
        setProfileData({
          pharmacyName: res.data.profile.pharmacyName || '',
          address: res.data.profile.address || '',
          gstNumber: res.data.profile.gstNumber || '',
          licenseNumber: res.data.profile.licenseNumber || '',
          openingTime: res.data.profile.openingTime || '',
          closingTime: res.data.profile.closingTime || ''
        });
      }

      // Fetch Distributor info
      const distRes = await axios.get(`${getBaseUrl()}/api/profile/distributor?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      if(distRes.data.distributor) {
         setDistributor(distRes.data.distributor);
         setActiveOrders(distRes.data.activeOrdersCount || 0);
      }

    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${getBaseUrl()}/api/profile/update`, {
        userId,
        ...userData,
        ...profileData
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      showMessage('Profile updated successfully', 'success');
      
      // Update local storage name if it changed
      const localUser = JSON.parse(localStorage.getItem('pharma_user') || '{}');
      if (localUser.name !== userData.name) {
          localStorage.setItem('pharma_user', JSON.stringify({ ...localUser, name: userData.name }));
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return showMessage('New passwords do not match', 'error');
    }
    if (passwords.newPassword.length < 6) {
      return showMessage('Password must be at least 6 characters', 'error');
    }
    
    setSaving(true);
    try {
      await axios.put(`${getBaseUrl()}/api/profile/password`, {
        userId,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      showMessage('Password changed successfully', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await axios.post(`${getBaseUrl()}/api/profile/logout-all`, { userId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      showMessage('Logged out of all devices', 'success');
      setTimeout(() => {
        localStorage.removeItem('pharma_user');
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      showMessage('Logout failed', 'error');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pharmacy Profile</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage your identity, business details, and security.</p>
        </div>
        <button 
           onClick={handleUpdateProfile}
           disabled={saving}
           className="hidden md:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:bg-blue-300"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Floating Notifications */}
      {successMsg && (
        <div className="fixed top-6 right-1/2 translate-x-1/2 z-50 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-xl shadow-lg border border-emerald-200 flex items-center animate-slide-down">
          <CheckCircle2 className="w-5 h-5 mr-3" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-1/2 translate-x-1/2 z-50 bg-rose-50 text-rose-700 px-6 py-3 rounded-xl shadow-lg border border-rose-200 flex items-center animate-slide-down">
          <AlertCircle className="w-5 h-5 mr-3" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* 1. Basic Profile Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-white border-opacity-40">
          <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Personal Identification</h2>
        </div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group cursor-pointer">
            <div className="w-28 h-28 bg-slate-900 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-white text-4xl font-bold uppercase">{userData.name?.[0] || 'U'}</span>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full hidden group-hover:flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
               <span className="text-white text-xs font-bold">Edit Photo</span>
            </div>
          </div>
          
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Owner Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={userData.name}
                  onChange={e => setUserData({...userData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={userData.phone}
                  onChange={e => setUserData({...userData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={userData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pharmacy Business Info Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-white border-opacity-40">
          <h2 className="text-sm font-bold text-emerald-900 uppercase tracking-widest">Pharmacy Details</h2>
        </div>
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pharmacy Store Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={profileData.pharmacyName}
                onChange={e => setProfileData({...profileData, pharmacyName: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="Ex: LifeCare Pharmacy"
              />
            </div>
          </div>
          
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Store Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
              <textarea 
                value={profileData.address}
                onChange={e => setProfileData({...profileData, address: e.target.value})}
                rows={2}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                placeholder="Full operational address..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GST Number</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={profileData.gstNumber}
                onChange={e => setProfileData({...profileData, gstNumber: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none uppercase"
                placeholder="e.g. 29ABCDE1234F1Z5"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drug License Number</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={profileData.licenseNumber}
                onChange={e => setProfileData({...profileData, licenseNumber: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none uppercase"
                placeholder="DL12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-2 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Opening Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="time" 
                  value={profileData.openingTime}
                  onChange={e => setProfileData({...profileData, openingTime: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Closing Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="time" 
                  value={profileData.closingTime}
                  onChange={e => setProfileData({...profileData, closingTime: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Distributor Info Section */}
      {distributor && (
        <section className="bg-slate-900 rounded-2xl shadow-md border border-slate-800 overflow-hidden text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 opacity-10">
            <Store className="w-40 h-40" />
          </div>
          <div className="px-6 py-4 border-b border-slate-800 relative z-10">
            <h2 className="text-sm font-bold text-blue-300 uppercase tracking-widest">Linked Supply Distributor</h2>
          </div>
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="bg-blue-600/20 text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">Primary Supplier</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">{distributor.name || 'Unnamed Distributor'}</h3>
              <p className="text-slate-400 text-sm mt-1">{distributor.location || 'Location Not Provided'}</p>
              
              <div className="mt-4 flex gap-4">
                 <div className="bg-slate-800 px-4 py-2 rounded-lg text-sm border border-slate-700 group cursor-default">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Active Orders</p>
                    <p className="font-bold text-blue-400 group-hover:text-blue-300">{activeOrders}</p>
                 </div>
                 {distributor.phone && (
                   <div className="bg-slate-800 px-4 py-2 rounded-lg text-sm border border-slate-700">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Contact</p>
                      <p className="font-bold">{distributor.phone}</p>
                   </div>
                 )}
              </div>
            </div>
            
            {distributor.phone && (
              <a href={`tel:${distributor.phone}`} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all hover:bg-blue-500 active:scale-95 w-full md:w-auto">
                <PhoneCall className="w-4 h-4" />
                <span>Call Distributor</span>
              </a>
            )}
          </div>
        </section>
      )}

      {/* 4. Security Settings Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
         <div className="bg-gradient-to-r from-rose-50 to-orange-50 px-6 py-4 border-b border-white border-opacity-40">
          <h2 className="text-sm font-bold text-rose-900 uppercase tracking-widest">Account Security</h2>
        </div>
        <div className="p-6 md:p-8">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-6" onSubmit={handleChangePassword}>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-rose-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={passwords.newPassword}
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-rose-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-rose-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button 
                type="submit" 
                disabled={saving || !passwords.currentPassword || !passwords.newPassword}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border border-rose-200 disabled:opacity-50"
              >
                Update Password
              </button>
            </div>
          </form>

          <hr className="my-8 border-slate-100" />
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
             <div>
                <h4 className="font-bold text-slate-800 text-sm">Active Sessions</h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Log out from all devices if you suspect a security breach.</p>
             </div>
             <button 
               type="button"
               onClick={handleLogoutAll}
               className="flex items-center space-x-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-900 transition-all w-full md:w-auto justify-center"
             >
               <LogOut className="w-4 h-4" />
               <span>Log Out All Devices</span>
             </button>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:hidden z-40">
        <button 
           onClick={handleUpdateProfile}
           disabled={saving}
           className="w-full flex justify-center items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save className="w-5 h-5" />}
          <span>Save All Changes</span>
        </button>
      </div>
      
    </div>
  );
};

export default Profile;
