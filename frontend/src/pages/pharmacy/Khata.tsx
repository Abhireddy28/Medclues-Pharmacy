import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, User, CreditCard, ChevronLeft, PlusCircle, AlertTriangle, ArrowRightCircle, Users } from 'lucide-react';

const Khata = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Ledger Details state
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // New Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const getBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
  };

  const fetchKhataList = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getBaseUrl()}/api/khata/list`);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerLedger = async (id: string) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${getBaseUrl()}/api/khata/${id}`);
      setLedgerData(data);
      setSelectedCustomerId(id);
      setView('detail');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      // Find customer by phone and open ledger
      const fetchByPhone = async () => {
         try {
           setLoading(true);
           const { data } = await axios.get(`${getBaseUrl()}/api/khata/list`);
           const customer = data.find((c: any) => c.phone === phoneParam);
           if (customer) {
             fetchCustomerLedger(customer._id);
           } else {
             fetchKhataList();
           }
         } catch (err) {
           console.error(err);
           fetchKhataList();
         }
      };
      fetchByPhone();
    } else if (view === 'list') {
      fetchKhataList();
    }
  }, [view, searchParams]);

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    
    try {
      await axios.post(`${getBaseUrl()}/api/khata/payment`, {
        customerId: selectedCustomerId,
        amount: Number(paymentAmount),
        description: 'Cash Payment Received',
        date: new Date().toISOString()
      });
      
      setPaymentAmount('');
      // Refresh ledger
      fetchCustomerLedger(selectedCustomerId!);
    } catch (err) {
      console.error(err);
      alert('Failed to record payment');
    }
  };

  // Summaries from list
  const grandTotalPending = customers.reduce((acc, c) => acc + (c.totalBalance || 0), 0);

  // Helper date formatter
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); 
  };

  if (view === 'detail' && ledgerData) {
    const { customer, transactions, summary, familyMembers } = ledgerData;
    
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Ledger Header Area */}
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => setView('list')}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm text-slate-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center">
               <BookOpen className="w-6 h-6 mr-3 text-emerald-600" />
               {customer.name}'s Khata
            </h1>
            <p className="text-sm font-bold text-slate-500">{customer.phone}</p>
          </div>
        </div>

        {/* Notebook Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
             <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Total Credit Taken</p>
             <p className="text-xl font-black text-amber-700 mt-1">₹{summary.totalCredit.toFixed(2)}</p>
           </div>
           <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm">
             <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Total Paid</p>
             <p className="text-xl font-black text-emerald-700 mt-1">₹{summary.totalPayment.toFixed(2)}</p>
           </div>
           <div className={`p-4 rounded-xl shadow-sm border text-center flex items-center justify-between ${customer.totalBalance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
             <div className="text-left">
               <p className={`text-xs font-bold uppercase tracking-widest ${customer.totalBalance > 0 ? 'text-rose-500' : 'text-slate-500'}`}>Current Balance</p>
               <p className={`text-2xl font-black mt-1 ${customer.totalBalance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>₹{customer.totalBalance.toFixed(2)}</p>
             </div>
             {customer.totalBalance > 0 && customer.totalBalance > 2000 && (
               <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
             )}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Real Notebook Look Ledger Log */}
          <div className="col-span-1 md:col-span-2 bg-[#fdfaf6] border border-[#e0d6c8] p-8 rounded-sm shadow-md min-h-[500px] relative font-serif">
             {/* Note Lines & margin */}
             <div className="absolute left-16 top-0 bottom-0 w-[2px] bg-red-200 z-0"></div>
             
             <div className="relative z-10">
               <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-900 pb-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 pl-4">
                 <div className="col-span-2">Date</div>
                 <div className="col-span-4">Description</div>
                 <div className="col-span-2 text-right">Debit</div>
                 <div className="col-span-2 text-right">Credit</div>
                 <div className="col-span-2 text-right">Balance</div>
               </div>

               <div className="space-y-4 text-sm font-medium text-slate-800">
                 {/* Opening Balance Row if Needed, but we track all from zero usually. */}
                 {transactions.map((txn: any) => (
                   <div key={txn._id} className="grid grid-cols-12 gap-2 border-b border-dashed border-[#e0d6c8] pb-3 pl-4">
                     <div className="col-span-2 text-[#7c6f5d] font-bold">{formatDate(txn.createdAt)}</div>
                     <div className="col-span-4 text-[#3c362d]">{txn.description}</div>
                     {/* Pharmacist 'Debit' means Customer Took Credit (balance increases). 'Credit' means Customer Paid (balance decreases) */}
                     {/* So if txn.type === 'credit', that implies customer took udhaar. */}
                     <div className="col-span-2 text-right font-black text-rose-700">
                       {txn.type === 'credit' ? `₹${txn.amount}` : '-'}
                     </div>
                     <div className="col-span-2 text-right font-black text-emerald-700">
                       {txn.type === 'debit' || txn.type === 'payment' ? `₹${txn.amount}` : '-'}
                     </div>
                     <div className="col-span-2 text-right font-bold text-slate-700">
                       ₹{txn.balance}
                     </div>
                   </div>
                 ))}
                 
                 {transactions.length === 0 && (
                   <div className="text-center italic text-[#a39887] py-8">
                     No transactions yet.
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Action Log Panel */}
          <div className="col-span-1 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
             <h3 className="font-black text-lg text-slate-800 mb-6 flex items-center">
               <PlusCircle className="w-5 h-5 mr-2 text-emerald-500" />
               Accept Payment
             </h3>

             {/* Family Members Preview */}
             {familyMembers && familyMembers.length > 0 && (
               <div className="mb-6 p-4 bg-sky-50/70 border border-sky-100 rounded-2xl shadow-sm">
                 <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest mb-3 flex items-center">
                   <Users className="w-3 h-3 mr-1.5" /> Family Members
                 </p>
                 <div className="space-y-2">
                   {familyMembers.map((m: any) => (
                     <div key={m._id} className="flex justify-between items-center text-xs font-bold text-slate-700 bg-white/80 p-2.5 px-3 rounded-xl border border-sky-50 shadow-sm">
                       <span>{m.memberName}</span>
                       <span className="text-[10px] text-sky-500 uppercase px-2 py-0.5 bg-sky-50 rounded-md">{m.relation}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-2 block">Amount Received (₹)</label>
                  <input 
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-slate-50 p-4 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-50 text-xl font-bold"
                  />
               </div>
               <button 
                 onClick={handleAddPayment}
                 disabled={!paymentAmount || Number(paymentAmount) <= 0 || customer.totalBalance === 0}
                 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
               >
                 <span>Save Payment Entry</span>
               </button>
             </div>
             
             {customer.totalBalance === 0 && (
               <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-center text-sm font-bold border border-emerald-100 flex items-center justify-center gap-2">
                 <ArrowRightCircle className="w-5 h-5" /> All Dues Cleared
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  // Notebook List View
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Overview Head */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
            <BookOpen className="text-blue-600 w-8 h-8" />
            Digital Khata Book
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time credit tracking and payments across the store.</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 px-6 py-4 rounded-2xl text-right">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Total Market Due</p>
          <p className="text-3xl font-black text-rose-600 tracking-tighter leading-none mt-1">₹{grandTotalPending.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Checking records...</div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-widest">
                <th className="px-8 py-5">Customer Name</th>
                <th className="px-6 py-5">Phone</th>
                <th className="px-6 py-5">Last Transaction Date</th>
                <th className="px-6 py-5 text-right">Total Due Balance</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: any) => {
                let statusConfig = { color: 'text-emerald-500', bg: 'bg-emerald-50', text: 'Paid' };
                if (c.totalBalance > 0) {
                  statusConfig = { color: 'text-amber-500', bg: 'bg-amber-50', text: 'Pending' };
                }
                if (c.totalBalance > 2000) {
                  statusConfig = { color: 'text-rose-500', bg: 'bg-rose-50', text: 'Overdue / High Risk' };
                }

                return (
                  <tr 
                    key={c._id} 
                    onClick={() => fetchCustomerLedger(c._id)}
                    className="border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-600 group-hover:text-white transition">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-800 text-base">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-500 text-sm">
                      {c.phone}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-600 text-sm">
                      {formatDate(c.lastDate)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`font-black text-lg ${c.totalBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        ₹{c.totalBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.text}
                       </span>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold text-lg">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    Khata is completely empty. Start billing in credit to see records here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Khata;
