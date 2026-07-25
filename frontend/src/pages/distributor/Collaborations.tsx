import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Activity, ShoppingCart, DollarSign, AlertCircle, 
  Search, Filter, ChevronRight, Phone, Bell, Star,
  CheckCircle, Clock, ShieldAlert, ArrowLeft, TrendingUp
} from 'lucide-react';

interface Pharmacy {
  _id: string;
  pharmacyName: string;
  ownerName: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalBusinessAmount: number;
  pendingPayment: number;
  status: 'Active' | 'Inactive';
  lastOrderDate: string;
}

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const Collaborations: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [pharmacyDetails, setPharmacyDetails] = useState<any>(null);
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([]);
  const [pharmacyPayments, setPharmacyPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('pharma_user') || '{}');
      const res = await axios.get(`${getBaseUrl()}/api/collaborations?distributorId=${user._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setPharmacies(res.data);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPharmacyDetails = async (id: string) => {
    setSelectedPharmacyId(id);
    try {
      const user = JSON.parse(localStorage.getItem('pharma_user') || '{}');
      const [detailsRes, ordersRes, paymentsRes] = await Promise.all([
        axios.get(`${getBaseUrl()}/api/collaborations/${id}?distributorId=${user._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        }),
        axios.get(`${getBaseUrl()}/api/collaborations/orders/${id}?distributorId=${user._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        }),
        axios.get(`${getBaseUrl()}/api/collaborations/payments/${id}?distributorId=${user._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        })
      ]);
      setPharmacyDetails(detailsRes.data);
      setPharmacyOrders(ordersRes.data);
      setPharmacyPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const getRiskStatus = (pendingPayment: number, totalBusinessAmount: number) => {
    if (totalBusinessAmount === 0) return { label: 'Safe', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle };
    const ratio = pendingPayment / totalBusinessAmount;
    if (ratio >= 0.5) return { label: 'High Risk', color: 'text-rose-500', bg: 'bg-rose-50', icon: ShieldAlert };
    if (ratio >= 0.2) return { label: 'Medium Risk', color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertCircle };
    return { label: 'Safe', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle };
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const topPharmacy = pharmacies.reduce((prev, current) => (prev.totalBusinessAmount > current.totalBusinessAmount) ? prev : current, pharmacies[0]);
  const highValueThreshold = pharmacies.length > 0 ? (pharmacies.reduce((sum, p) => sum + p.totalBusinessAmount, 0) / pharmacies.length) * 1.5 : 0;

  const filteredPharmacies = pharmacies.filter(p => {
    const matchesSearch = p.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (filter === 'Active') matchesFilter = p.status === 'Active';
    if (filter === 'Inactive') matchesFilter = p.status === 'Inactive';
    if (filter === 'High Value') matchesFilter = p.totalBusinessAmount >= highValueThreshold;
    if (filter === 'Pending Payments') matchesFilter = p.pendingPayment > 0;
    
    return matchesSearch && matchesFilter;
  });

  const totals = {
    pharmacies: pharmacies.length,
    active: pharmacies.filter(p => p.status === 'Active').length,
    orders: pharmacies.reduce((sum, p) => sum + p.totalOrders, 0),
    revenue: pharmacies.reduce((sum, p) => sum + p.totalBusinessAmount, 0),
    pending: pharmacies.reduce((sum, p) => sum + p.pendingPayment, 0),
  };

  if (selectedPharmacyId && pharmacyDetails) {
    const risk = getRiskStatus(pharmacyDetails.pendingPayment, pharmacyDetails.totalBusinessAmount);
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={() => setSelectedPharmacyId(null)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pharmacy List
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Users className="w-32 h-32" />
             </div>
             <div className="relative z-10 flex justify-between items-start">
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                    {pharmacyDetails.pharmacyName}
                  </h1>
                  <p className="text-slate-500 font-medium flex items-center gap-2">
                    <UserCircle className="w-4 h-4" /> {pharmacyDetails.ownerName} &bull; <MapPin className="w-4 h-4" /> {pharmacyDetails.location}
                  </p>
               </div>
               <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold ${risk.bg} ${risk.color}`}>
                 <risk.icon className="w-5 h-5" /> {risk.label}
               </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orders</p>
                 <p className="text-2xl font-black text-slate-800">{pharmacyDetails.totalOrders}</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Business</p>
                 <p className="text-2xl font-black text-blue-600">{formatCurrency(pharmacyDetails.totalBusinessAmount)}</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Paid</p>
                 <p className="text-2xl font-black text-emerald-600">{formatCurrency(pharmacyDetails.totalPaid)}</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Due</p>
                 <p className="text-2xl font-black text-rose-600">{formatCurrency(pharmacyDetails.pendingPayment)}</p>
               </div>
             </div>
          </div>

          <div className="w-full md:w-80 bg-white shadow-sm border border-slate-100 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20">
                  <Phone className="w-4 h-4" /> Call {pharmacyDetails.phone}
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 p-3 rounded-xl font-bold hover:bg-rose-100 active:scale-95 transition-all border border-rose-100">
                  <Bell className="w-4 h-4" /> Send Payment Reminder
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" /> Order History
            </h3>
            {pharmacyOrders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No orders found.</p>
            ) : (
              <div className="space-y-3">
                {pharmacyOrders.map(order => (
                  <div key={order._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 tracking-tight">#{order._id.substring(0,8).toUpperCase()}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{formatCurrency(order.totalAmount)}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Payment Tracking
            </h3>
            {pharmacyPayments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No payments found.</p>
            ) : (
              <div className="space-y-3">
                {pharmacyPayments.map(payment => (
                  <div key={payment._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {payment.status === 'Paid' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-xs text-slate-500 font-medium">{new Date(payment.date).toLocaleDateString()}</p>
                         <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${payment.status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {payment.status}
                         </p>
                      </div>
                    </div>
                    <p className="font-black text-slate-900 text-lg">{formatCurrency(payment.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pharmacy Collaborations</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and track your pharmacy partner relationships</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard title="Total Pharmacies" value={totals.pharmacies} icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
          <SummaryCard title="Active Pharmacies" value={totals.active} icon={Activity} color="text-emerald-600" bg="bg-emerald-50" />
          <SummaryCard title="Total Orders" value={totals.orders} icon={ShoppingCart} color="text-blue-600" bg="bg-blue-50" />
          <SummaryCard title="Total Revenue" value={`₹${(totals.revenue / 1000).toFixed(1)}k`} icon={TrendingUp} color="text-violet-600" bg="bg-violet-50" />
          <SummaryCard title="Pending Payments" value={`₹${(totals.pending / 1000).toFixed(1)}k`} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
        </div>
      )}

      {/* AI Smart Insights */}
      {!loading && pharmacies.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row gap-6 items-center">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
             <Star className="w-8 h-8 text-yellow-300" fill="currentColor" />
          </div>
          <div className="flex-1">
             <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-1">Smart AI Insights</h3>
             <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-2">
               <div>
                 <p className="text-blue-100 text-xs">Top Buying Pharmacy</p>
                 <p className="font-bold text-lg">{topPharmacy?.pharmacyName || 'N/A'}</p>
               </div>
               <div className="hidden md:block w-px bg-white/20"></div>
               <div>
                 <p className="text-blue-100 text-xs">High Risk Partners</p>
                 <p className="font-bold text-lg">{pharmacies.filter(p => p.pendingPayment / (p.totalBusinessAmount||1) > 0.5).length} pharmacies</p>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Filters and List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search pharmacies by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            <Filter className="w-5 h-5 text-slate-400 mr-2" />
            {['All', 'Active', 'Inactive', 'High Value', 'Pending Payments'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filter === f 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 pl-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Pharmacy</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Orders</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Business</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Loading pharmacies...</td>
                </tr>
              ) : filteredPharmacies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No pharmacies found matching criteria.</td>
                </tr>
              ) : (
                filteredPharmacies.map((pharmacy) => {
                  const isHighValue = pharmacy.totalBusinessAmount >= highValueThreshold;
                  return (
                    <tr key={pharmacy._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => loadPharmacyDetails(pharmacy._id)}>
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          {pharmacy.pharmacyName}
                          {isHighValue && <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{pharmacy.ownerName} &bull; {pharmacy.phone}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-700">{pharmacy.location}</p>
                      </td>
                      <td className="p-4 font-bold text-slate-700">{pharmacy.totalOrders}</td>
                      <td className="p-4 font-black text-slate-900">{formatCurrency(pharmacy.totalBusinessAmount)}</td>
                      <td className="p-4">
                        <span className={`font-bold ${pharmacy.pendingPayment > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {formatCurrency(pharmacy.pendingPayment)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                          pharmacy.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {pharmacy.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); loadPharmacyDetails(pharmacy._id); }}
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
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

const SummaryCard = ({ title, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
    <div className={`p-4 rounded-2xl ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

// MapPin Icon (forgot in import, adding here)
const MapPin = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const UserCircle = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>
)

export default Collaborations;
