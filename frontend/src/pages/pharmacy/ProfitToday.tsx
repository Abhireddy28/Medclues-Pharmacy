import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  Wallet, 
  ShoppingCart, 
  CreditCard,
  Banknote,
  Users,
  Search,
  ArrowRight,
  Package,
  Calendar,
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const ProfitToday: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [data, setData] = useState<any>(null);

  const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const hostname = window.location.hostname;
    return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('pharma_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return;
      
      const { data: insights } = await axios.get(`${getBaseUrl()}/api/analytics/${user._id || user.id}?filter=${filter}`);
      setData(insights);
    } catch (error) {
      console.error('Error fetching profit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  if (loading && !data) {
    return (
      <div className="p-8 text-center py-20">
         <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
         <p className="text-slate-500 font-bold">Loading Business Insights...</p>
      </div>
    );
  }

  const { summary, chartData, billingList, deadStock } = data || { 
    summary: {}, chartData: [], billingList: [], deadStock: [] 
  };

  const cards = [
    { label: "Total Sales", value: `₹${summary.totalSales || 0}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Purchase", value: `₹${summary.totalPurchaseToday || 0}`, icon: ShoppingCart, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Profit Today", value: `₹${summary.profitToday || 0}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "UPI Amount", value: `₹${summary.upiAmount || 0}`, icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Cash Amount", value: `₹${summary.cashAmount || 0}`, icon: Banknote, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Credit (Khata)", value: `₹${summary.khataAmount || 0}`, icon: Users, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Business Profit Insights</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">Real-time pharmacy performance tracker</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          {(['today', 'weekly', 'monthly'] as const).map((f) => (
            <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-800'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
             <div className={`${card.bg} ${card.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
             <h3 className="text-lg font-black text-slate-800">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Sales vs Purchase</h3>
                <p className="text-xs text-slate-400 font-bold">Volume comparison over time</p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
                 <div className="w-3 h-3 bg-blue-600 rounded-full" /> <span>Sales</span>
                 <div className="w-3 h-3 bg-slate-200 rounded-full ml-4" /> <span>Purchase</span>
              </div>
           </div>

           <div className="h-[350px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="date" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}}
                   dy={10}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}}
                 />
                 <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}}
                   itemStyle={{fontWeight: 'bold', fontSize: '12px'}}
                 />
                 <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                 <Area type="monotone" dataKey="purchase" stroke="#cbd5e1" strokeWidth={3} fill="none" strokeDasharray="5 5" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Dead Stock Section */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
           <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black tracking-tight">Dead Stock Monitor</h3>
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              
              <div className="space-y-4 flex-1">
                 {deadStock.length > 0 ? deadStock.slice(0, 5).map((item: any, i: number) => (
                   <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm group-hover:text-blue-400 transition-colors uppercase tracking-tight">{item.name}</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Stock: {item.stock} • Last Sold: --</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                      </div>
                   </div>
                 )) : (
                   <div className="py-20 text-center">
                      <p className="text-white/40 font-bold text-xs uppercase tracking-widest italic">Inventory looks healthy! No dead stock found.</p>
                   </div>
                 )}
              </div>

              <button className="mt-8 w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                 Analyze All Inventory
              </button>
           </div>
           
           {/* Abstract BG Decor */}
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl shadow-[0_0_100px_rgba(37,99,235,0.2)]" />
        </div>
      </div>

      {/* Today's Billing List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Transactions</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live billing feed from POS</p>
            </div>
            <div className="relative w-full md:w-72">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search by customer or bill ID..." 
                 className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
               />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                     <th className="px-8 py-5">Time</th>
                     <th className="px-8 py-5">Customer</th>
                     <th className="px-8 py-5 text-right">Amount</th>
                     <th className="px-8 py-5 text-center">Mode</th>
                     <th className="px-8 py-5 text-right">Profit</th>
                     <th className="px-8 py-5"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {billingList.length > 0 ? billingList.map((bill: any) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="flex items-center text-slate-800 font-bold text-xs uppercase">
                           <Calendar className="w-3.5 h-3.5 mr-2 text-slate-300" />
                           {bill.time}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] mr-3">
                             {bill.customer[0]}
                           </div>
                           <span className="font-bold text-slate-700 text-sm tracking-tight">{bill.customer}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-800">
                        ₹{bill.amount.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          bill.paymentType === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          bill.paymentType === 'upi' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {bill.paymentType}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className="text-emerald-600 font-black text-sm tracking-tight">+₹{bill.profit.toFixed(2)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
                           <ArrowRight className="w-3.5 h-3.5" />
                         </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={6} className="py-20 text-center">
                          <p className="text-slate-300 font-bold text-xs uppercase tracking-widest italic">No transactions found for this period.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
         
         {/* Simple Pagination Placeholder */}
         <div className="p-8 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-400">
            <p>Showing {billingList.length} recent bills</p>
            <div className="flex space-x-2">
               <button className="px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-800 transition-all opacity-50 cursor-not-allowed">Previous</button>
               <button className="px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-800 transition-all">Next</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProfitToday;
