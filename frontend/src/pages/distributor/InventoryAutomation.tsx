import React, { useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  FileUp, 
  Barcode, 
  Zap, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  ChevronRight,
  Database,
  ArrowRight,
  FileSpreadsheet,
  AlertCircle,
  Hash
} from 'lucide-react';

const InventoryAutomation: React.FC = () => {
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'scanner'>('invoice');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const hostname = window.location.hostname;
    return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
  };

  const processExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { 
        type: 'array',
        cellDates: true,
        cellNF: true,
        cellText: false
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

      console.log("Raw Excel Data Found:", json[0]); 

      const findKey = (row: any, keywords: string[]) => {
        const keys = Object.keys(row);
        return keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
      };

      const mapped = json.map((row: any) => {
        const nameKey = findKey(row, ['name', 'medicine', 'product', 'item', 'desc']);
        const priceKey = findKey(row, ['price', 'rate', 'mrp', 'cost', 'val']);
        const costKey = findKey(row, ['purchase', 'cost', 'buy', 'base']);
        const stockKey = findKey(row, ['stock', 'qty', 'quantity', 'units', 'count']);
        const barcodeKey = findKey(row, ['barcode', 'batch', 'serial', 'code', 'hsn']);
        const compKey = findKey(row, ['comp', 'formula', 'salt', 'ingredient']);
        const expiryKey = findKey(row, ['exp', 'date', 'valid']);

        const price = parseFloat(row[priceKey || ''] || 0);
        const costPrice = parseFloat(row[costKey || ''] || (price * 0.75).toFixed(2));
        
        // Advanced Date Handling
        let expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);

        if (expiryKey && row[expiryKey]) {
           const parsedDate = new Date(row[expiryKey]);
           if (!isNaN(parsedDate.getTime())) {
             expiryDate = parsedDate;
           }
        }

        return {
          name: nameKey ? row[nameKey] : 'Unknown Item',
          composition: compKey ? row[compKey] : 'General Formula',
          price: price,
          costPrice: costPrice,
          stock: parseInt(row[stockKey || ''] || 0),
          barcode: barcodeKey ? String(row[barcodeKey]) : `AUTO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          expiryDate: expiryDate,
          category: 'Tablet',
          status: 'available'
        };
      });

      setExtractedProducts(mapped);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      processExcel(file);
    } else {
      // Simulate PDF parsing for now
      setTimeout(() => {
        handleMockInvoiceUpload();
      }, 1500);
    }
  };

  const handleMockInvoiceUpload = async () => {
    try {
      const { data } = await axios.post(`${getBaseUrl()}/api/products/parse-invoice`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setExtractedProducts(data.products);
    } catch (err) {
      alert('Failed to parse invoice');
    } finally {
      setLoading(false);
    }
  };

  const saveProducts = async () => {
    if (extractedProducts.length === 0) return;
    setLoading(true);
    try {
      await axios.post(`${getBaseUrl()}/api/products/bulk`, { products: extractedProducts }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      alert(`Success! ${extractedProducts.length} medicines added to your catalog.`);
      setExtractedProducts([]);
    } catch (err: any) {
      console.error('Final Save Error:', err.response?.data);
      alert(`Failed to save: ${err.response?.data?.message || 'Check console for details'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".xlsx,.xls,.csv,.pdf,image/*"
      />

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            Inventory Automation Engine
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1 italic">
            High-Speed Product Ingestion & Catalog Scaling
          </p>
        </div>
        {extractedProducts.length > 0 && (
           <div className="flex items-center space-x-3 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-right">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-xs font-black text-blue-700 uppercase tracking-widest">{extractedProducts.length} Items Locked</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Input Selection */}
        <div className="lg:col-span-1 space-y-4">
           <button 
             onClick={() => setActiveTab('invoice')}
             className={`w-full p-6 bg-white border rounded-[32px] text-left transition-all group ${activeTab === 'invoice' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
           >
             <div className="flex items-center justify-between mb-4">
               <div className={`p-3 rounded-2xl ${activeTab === 'invoice' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                 <FileSpreadsheet className="w-6 h-6" />
               </div>
               {activeTab === 'invoice' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
             </div>
             <h3 className="font-black text-slate-800 tracking-tight text-lg">Smart Excel Ingestion</h3>
             <p className="text-xs text-slate-400 font-bold mt-1 leading-relaxed">Instantly parse stock sheets, bills, or product lists from Excel/CSV.</p>
           </button>

           <div className="p-6 bg-slate-900 rounded-[32px] text-white overflow-hidden relative">
              <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-5" />
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Pro Tip</h4>
              <p className="text-sm font-medium leading-relaxed">Excel uploads are <span className="text-blue-400">10x faster</span> than manual entry. Ensure your column headers are clear!</p>
           </div>
        </div>

        {/* Right: Processing Console */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white border border-slate-100 rounded-[40px] p-8 min-h-[500px] flex flex-col shadow-sm">
              {extractedProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                   <div 
                     onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                     onDragLeave={() => setDragging(false)}
                     onDrop={(e) => { 
                       e.preventDefault(); 
                       setDragging(false); 
                       const file = e.dataTransfer.files[0];
                       if (file) {
                         setLoading(true);
                         if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
                           processExcel(file);
                         } else {
                           handleMockInvoiceUpload();
                         }
                       }
                     }}
                     className={`w-full max-w-md border-4 border-dashed rounded-[32px] p-12 transition-all cursor-pointer hover:border-blue-300 hover:bg-slate-50 ${dragging ? 'border-blue-500 bg-blue-50/50 scale-105' : 'border-slate-100'}`}
                     onClick={() => fileInputRef.current?.click()}
                   >
                     <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileUp className="w-10 h-10 text-blue-500" />
                     </div>
                     <h2 className="text-xl font-black text-slate-800 tracking-tight">Drop Excel Sheet Here</h2>
                     <p className="text-sm text-slate-400 font-bold mt-2 leading-relaxed uppercase tracking-widest text-[10px]">
                        Supports .xlsx, .csv, and .pdf
                     </p>
                     
                     <div className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                        Select File from Device
                     </div>
                   </div>
                   
                   {loading && (
                      <div className="flex flex-col items-center space-y-3 animate-pulse">
                         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Analyzing Data Engine...</p>
                      </div>
                   )}
                </div>
              ) : (
                <div className="flex-1 space-y-6">
                   <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                      <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Review Extraction</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Verify accuracy before final deployment</p>
                      </div>
                      <button 
                        onClick={() => setExtractedProducts([])}
                        className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {extractedProducts.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300">
                           <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                                 <Barcode className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                              </div>
                              <div>
                                 <h4 className="font-black text-slate-800 text-sm leading-tight">{p.name}</h4>
                                 <div className="flex items-center mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <Hash className="w-2.5 h-2.5 mr-1" /> {p.barcode.slice(0, 8)}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center space-x-4">
                              <div className="text-right">
                                 <p className="text-sm font-black text-slate-800">₹{p.price}</p>
                                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Qty: {p.stock}</p>
                              </div>
                              <button onClick={() => setExtractedProducts(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-200 hover:text-rose-500 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>

                   {/* Floating Footer Action */}
                   <div className="fixed bottom-10 right-1/2 translate-x-1/2 md:right-10 md:translate-x-0 z-50">
                      <button 
                        onClick={saveProducts}
                        disabled={loading}
                        className="bg-slate-900 text-white px-12 py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-blue-600 hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center group"
                      >
                        {loading ? 'Processing Master Catalog...' : 'Commit to Database'}
                        <div className="ml-4 bg-white/20 p-2 rounded-xl group-hover:bg-white group-hover:text-blue-600 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryAutomation;
