import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  PhoneCall, 
  Activity,
  CreditCard,
  History,
  AlertTriangle,
  Pill,
  CheckCircle,
  Clock
} from 'lucide-react';

const CustomerHistory: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalCustomers: 0, activeCustomers: 0, highValueCustomers: 0, pendingKhataCustomers: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  
  // Detail States
  const [combinedHistory, setCombinedHistory] = useState<any[]>([]);
  const [, setPurchases] = useState<any[]>([]);
  const [frequentMeds, setFrequentMeds] = useState<any[]>([]);
  const [khataRecords, setKhataRecords] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'history' | 'khata' | 'family'>('history');

  const getBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${getBaseUrl()}/api/customers`, {
        params: { search: searchTerm, filter: activeFilter }
      });
      setCustomers(res.data.customers);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, activeFilter]);

  const fetchCustomerDetails = async (id: string) => {
    try {
      // Parallel fetch
      const [histRes, purcRes, khataRes, famRes] = await Promise.all([
        axios.get(`${getBaseUrl()}/api/customers/${id}/history`),
        axios.get(`${getBaseUrl()}/api/customers/${id}/purchases`),
        axios.get(`${getBaseUrl()}/api/customers/${id}/khata`),
        axios.get(`${getBaseUrl()}/api/customers/${id}/family`)
      ]);
      
      setCombinedHistory(histRes.data);
      setPurchases(purcRes.data.purchases);
      setFrequentMeds(purcRes.data.frequentMedicines);
      setKhataRecords(khataRes.data);
      setFamilyMembers(famRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setActiveTab('history');
    fetchCustomerDetails(customer._id);
  };

  const handleAddPayment = async () => {
    if (!selectedCustomer) return;
    const amountStr = prompt(`Enter payment amount to clear due for ${selectedCustomer.name}:`);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

    try {
       await axios.post(`${getBaseUrl()}/api/customers/${selectedCustomer._id}/payment`, {
           amount,
           paymentMode: 'Cash',
           description: 'Manual payment added from History Panel'
       });
       alert('Payment recorded successfully!');
       // Refresh
       fetchCustomers();
       
       // Force update local selected state
       const updatedCustomer = {
         ...selectedCustomer,
         pendingKhata: Math.max(0, (selectedCustomer.pendingKhata || 0) - amount)
       };
       if (updatedCustomer.pendingKhata <= 2000) updatedCustomer.riskLevel = 'low';
       setSelectedCustomer(updatedCustomer);

       fetchCustomerDetails(selectedCustomer._id);

    } catch (err) {
       console.error(err);
       alert('Error adding payment');
    }
  };

  const handleAddFamilyMember = async () => {
    if (!selectedCustomer) return;
    const memberName = prompt(`Enter new family member name for ${selectedCustomer.name}:`);
    if (!memberName) return;
    const relation = prompt(`Enter relation (e.g., Mother, Father, Son):`);
    if (!relation) return;

    try {
      await axios.post(`${getBaseUrl()}/api/customers/${selectedCustomer._id}/family`, {
         memberName,
         relation
      });
      // Refresh family members
      fetchCustomerDetails(selectedCustomer._id);
    } catch (err) {
      console.error(err);
      alert('Error adding family member');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Customers</p>
             <h3 className="text-2xl font-black text-slate-800 mt-1">{summary.totalCustomers}</h3>
           </div>
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
             <Users className="w-6 h-6" />
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active (30 Days)</p>
             <h3 className="text-2xl font-black text-slate-800 mt-1">{summary.activeCustomers}</h3>
           </div>
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
             <Activity className="w-6 h-6" />
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">High Value</p>
             <h3 className="text-2xl font-black text-slate-800 mt-1">{summary.highValueCustomers}</h3>
           </div>
           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
             <CheckCircle className="w-6 h-6" />
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-red-200">
           <div>
             <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Pending Khata</p>
             <h3 className="text-2xl font-black text-slate-800 mt-1">{summary.pendingKhataCustomers}</h3>
           </div>
           <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
             <AlertTriangle className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic Customer Directory */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[75vh]">
          <div className="p-5 border-b border-slate-50 space-y-4">
             <h2 className="font-bold text-slate-800 text-lg flex items-center">
               <Users className="w-5 h-5 mr-2 text-blue-600" /> Customer Directory
             </h2>

             {/* Search */}
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name or phone..." 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-semibold text-slate-700"
                />
             </div>

             {/* Dynamic Filter Tags */}
             <div className="flex overflow-x-auto pb-1 gap-2 hide-scrollbar">
                {['All', 'Pending Khata', 'High Risk Customers', 'High Value Customers'].map(filter => (
                   <button 
                     key={filter}
                     onClick={() => setActiveFilter(filter)}
                     className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${activeFilter === filter ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                   >
                     {filter}
                   </button>
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {customers.map((c) => (
               <div 
                 key={c._id}
                 onClick={() => handleSelectCustomer(c)}
                 className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCustomer?._id === c._id ? 'border-blue-500 bg-blue-50/30 shadow-md' : 'border-slate-100 bg-white hover:border-blue-300'}`}
               >
                  <div className="flex justify-between items-start mb-2">
                     <div>
                       <h4 className="font-bold text-slate-800">{c.name}</h4>
                       <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center mt-1">
                          <PhoneCall className="w-3 h-3 mr-1" /> {c.phone}
                       </p>
                     </div>
                     {c.customerTag && c.customerTag !== 'None' && (
                       <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase ${c.customerTag === 'High Value' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                         {c.customerTag}
                       </span>
                     )}
                     {c.riskLevel === 'high' && (
                       <span className="text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase bg-red-100 text-red-600 ml-1">
                         High Risk
                       </span>
                     )}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                     <div className="flex-1">
                        <p className="text-slate-400 font-medium">Spent</p>
                        <p className="font-black text-slate-700">₹{(c.totalSpent || 0).toFixed(0)}</p>
                     </div>
                     <div className="flex-1">
                        <p className="text-slate-400 font-medium">Khata</p>
                        <p className={`font-black ${c.pendingKhata > 0 ? 'text-red-500' : 'text-slate-700'}`}>₹{(c.pendingKhata || 0).toFixed(0)}</p>
                     </div>
                     <div className="flex-1 text-right">
                        <p className="text-slate-400 font-medium">Visits</p>
                        <p className="font-black text-slate-700">{c.totalVisits || 0}</p>
                     </div>
                  </div>
               </div>
            ))}
            
            {customers.length === 0 && (
               <div className="text-center py-10 opacity-50">
                  <span className="text-slate-400 font-bold block mb-2">No customers match your search/filter.</span>
                  <span className="text-xs">Hint: Do some billing in the POS!</span>
               </div>
            )}
          </div>
        </div>

        {/* Right Side: Customer Detailed Insights & Ledger */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 h-[75vh] flex flex-col">
          {selectedCustomer ? (
            <>
              {/* Detailed Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center">
                      {selectedCustomer.name}
                      {selectedCustomer.customerTag === 'High Value' && <CheckCircle className="w-5 h-5 text-indigo-500 ml-3" />}
                    </h2>
                    <p className="text-sm font-bold text-slate-500 mt-1 flex items-center">
                      <PhoneCall className="w-4 h-4 mr-2" /> {selectedCustomer.phone}
                    </p>
                 </div>
                 
                 <div className="text-right flex space-x-3">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                       <p className="text-[10px] uppercase font-bold text-slate-400">Total Spent</p>
                       <p className="font-black text-lg text-slate-800">₹{(selectedCustomer.totalSpent || 0).toFixed(2)}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl shadow-sm border ${selectedCustomer.pendingKhata > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                       <p className={`text-[10px] uppercase font-bold ${selectedCustomer.pendingKhata > 0 ? 'text-red-400' : 'text-slate-400'}`}>Pending Khata</p>
                       <p className={`font-black text-lg ${selectedCustomer.pendingKhata > 0 ? 'text-red-600' : 'text-slate-800'}`}>₹{(selectedCustomer.pendingKhata || 0).toFixed(2)}</p>
                    </div>
                 </div>
              </div>

              {/* TABS */}
              <div className="flex border-b border-slate-100 p-2 space-x-2 bg-white">
                 <button 
                   onClick={() => setActiveTab('history')}
                   className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all ${activeTab === 'history' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   <History className="w-4 h-4 mr-2" /> Combined History
                 </button>
                 <button 
                   onClick={() => setActiveTab('khata')}
                   className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all ${activeTab === 'khata' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   <CreditCard className="w-4 h-4 mr-2" /> Khata Ledger
                 </button>
                 <button 
                   onClick={() => setActiveTab('family')}
                   className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all ${activeTab === 'family' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   <Users className="w-4 h-4 mr-2" /> Family Accounts
                 </button>
              </div>

              {/* Dynamic Content Viewport */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {activeTab === 'history' && (
                   <div className="space-y-6">
                      {/* Smart Insights Panel */}
                      {frequentMeds.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
                           <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center">
                             <Pill className="w-4 h-4 mr-2" /> Smart Medicine Insights
                           </h4>
                           <div className="flex flex-wrap gap-2">
                             {frequentMeds.map(f => (
                               <div key={f.name} className="bg-white px-3 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm border border-indigo-50 flex items-center">
                                 {f.name} <span className="ml-2 bg-indigo-100 text-indigo-600 px-1.5 rounded-md text-xs">{f.count}x visits</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                      {/* Unified Timeline List */}
                      <h4 className="text-sm font-black text-slate-800 mt-6">Timeline</h4>
                      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[1.125rem] before:h-full before:w-0.5 before:bg-slate-200 mt-4">
                         {combinedHistory.map((entry, idx) => (
                            <div key={idx} className="relative flex items-start group">
                               <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 bg-white shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110 mt-1">
                                  {entry.type === 'Payment' ? <CheckCircle className="text-emerald-500 w-5 h-5"/> : <Activity className="text-blue-500 w-5 h-5"/>}
                               </div>
                               <div className="ml-4 flex-1 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-xs font-bold text-slate-400"><Clock className="w-3 h-3 inline mr-1 -mt-0.5" />{new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(entry.date).toLocaleDateString()}</span>
                                     <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-md ${
                                       entry.type === 'Payment' ? 'bg-emerald-100 text-emerald-600' :
                                       entry.type === 'Credit Bill' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                     }`}>{entry.type}</span>
                                  </div>
                                  <p className="font-black text-lg text-slate-800 mb-1">
                                    {entry.type === 'Payment' ? `-₹${entry.amount}` : `+₹${entry.amount.toFixed(2)}`}
                                  </p>
                                  <p className="text-xs font-bold text-slate-500 leading-relaxed mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">{entry.medicines}</p>
                               </div>
                            </div>
                         ))}
                         {combinedHistory.length === 0 && <p className="text-sm font-bold text-slate-400 text-center py-10 w-full relative z-10">No History recorded internally yet. Process a POS bill!</p>}
                      </div>
                   </div>
                )}

                {activeTab === 'khata' && (
                   <div className="space-y-6">
                     <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                        <p className="text-sm font-black text-red-400 uppercase tracking-widest mb-2">Total Due Amount</p>
                        <h3 className="text-4xl font-black text-red-600 mb-4">₹{(selectedCustomer.pendingKhata || 0).toFixed(2)}</h3>
                        {selectedCustomer.pendingKhata > 0 && (
                          <button 
                            onClick={handleAddPayment}
                            className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all"
                          >
                            Collect Payment Now
                          </button>
                        )}
                     </div>

                     <div>
                       <h4 className="text-sm font-black text-slate-800 mb-3 block">Transaction Ledger</h4>
                       <table className="w-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden text-left">
                         <thead className="bg-slate-50">
                           <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             <th className="p-4">Date</th>
                             <th className="p-4">Description</th>
                             <th className="p-4 text-right">Debit / Credit</th>
                             <th className="p-4 text-right">Balance</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                           {khataRecords.map(k => (
                             <tr key={k._id} className="hover:bg-slate-50/50">
                               <td className="p-4 text-xs font-bold text-slate-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                               <td className="p-4 text-xs font-bold text-slate-700">{k.description || k.type}</td>
                               <td className={`p-4 text-sm font-black text-right ${k.type === 'debit' ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {k.type === 'debit' ? `-${k.amount}` : `+${k.amount}`}
                               </td>
                               <td className="p-4 text-sm font-black text-slate-800 text-right">₹{k.balance}</td>
                             </tr>
                           ))}
                           {khataRecords.length === 0 && (
                              <tr>
                                <td colSpan={4} className="p-6 text-center text-slate-400 font-bold text-sm">No Khata records found.</td>
                              </tr>
                           )}
                         </tbody>
                       </table>
                     </div>
                   </div>
                )}

                {activeTab === 'family' && (
                   <div className="space-y-4">
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                         <div className="flex items-center">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mr-4">
                               <Users className="w-6 h-6" />
                            </div>
                            <div>
                               <h3 className="font-bold text-slate-800 text-lg">Family Accounts Linked</h3>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{familyMembers.length} Members</p>
                            </div>
                         </div>
                         <button 
                           onClick={handleAddFamilyMember}
                           className="bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-all active:scale-95"
                         >
                            + Add Member
                         </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {familyMembers.map(f => (
                           <div key={f._id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-black text-slate-800 text-base">{f.memberName}</h4>
                                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{f.relation}</p>
                                </div>
                                <Activity className="w-4 h-4 text-slate-300" />
                             </div>
                             {f.notes && <p className="text-xs text-slate-500 border-l-2 border-indigo-200 pl-2">{f.notes}</p>}
                             <p className="text-[10px] text-slate-400 mt-4 text-center border-t border-slate-50 pt-2 font-medium italic">(Select Member during POS billing to route items to their distinct history block)</p>
                           </div>
                         ))}
                         {familyMembers.length === 0 && (
                           <p className="md:col-span-2 text-center py-10 text-slate-400 font-bold text-sm bg-white rounded-xl border border-dashed border-slate-200">
                             No family members mapped. <br/>You can map them inside settings to segregate individual purchase history.
                           </p>
                         )}
                      </div>
                   </div>
                )}
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                 <History className="w-10 h-10 text-slate-300" />
               </div>
               <h3 className="text-xl font-black text-slate-800 mb-2">Customer History Core</h3>
               <p className="text-sm font-semibold text-slate-400 max-w-sm">Select a customer from the directory to view live generated insights, family billing separation, and dynamic khata tracking.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory;
