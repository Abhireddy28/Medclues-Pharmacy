import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  PackagePlus, 
  Search, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle,
  PackageOpen,
  CalendarDays,
  Trash2,
  Edit2,
  Plus,
  Barcode,
  X,
  FileSpreadsheet,
  Upload,
  LayoutGrid,
  List,
  Eye,
  TrendingUp,
  IndianRupee,
  Building2,
  Pill,
  Sparkles,
  ShieldAlert,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

// Rich Medicine Packaging Visual Container Component
const MedicinePackagingImage: React.FC<{ item: any; heightClass?: string }> = ({ item, heightClass = 'h-36' }) => {
  if (item.image) {
    return (
      <div className={`relative group/img overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50 w-full ${heightClass}`}>
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" 
          onError={(e: any) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
      </div>
    );
  }

  // Realistic thematic fallback medicine box artwork based on medicine category/name
  const lowerName = (item.name || '').toLowerCase();
  const isSyrup = lowerName.includes('syrup') || lowerName.includes('suspension') || lowerName.includes('liquid');
  const isInjection = lowerName.includes('inj') || lowerName.includes('vial') || lowerName.includes('ampoule');
  const isOintment = lowerName.includes('gel') || lowerName.includes('cream') || lowerName.includes('ointment');

  return (
    <div className={`relative overflow-hidden rounded-xl border border-emerald-200/60 shadow-xs flex flex-col justify-between p-3.5 w-full ${heightClass} transition-transform duration-300 group-hover:scale-[1.01] ${
      isSyrup 
        ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white' 
        : isInjection 
        ? 'bg-gradient-to-br from-sky-500 via-indigo-600 to-blue-800 text-white'
        : isOintment
        ? 'bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-800 text-white'
        : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white'
    }`}>
      {/* Background Pill Geometry Overlay */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xs pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-20 h-20 bg-white/10 rounded-full blur-xs pointer-events-none" />

      {/* Box Header */}
      <div className="flex justify-between items-center z-10">
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-white border border-white/20">
          {isSyrup ? 'Syrup Bottle' : isInjection ? 'Injection Ampoule' : isOintment ? 'Topical Tube' : 'Rx Tablets / Pack'}
        </span>
        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xs shadow-xs">
          {isSyrup ? '🍾' : isInjection ? '💉' : isOintment ? '🧴' : '💊'}
        </div>
      </div>

      {/* Box Title & Composition */}
      <div className="my-1.5 z-10">
        <div className="text-sm font-black tracking-tight leading-snug drop-shadow-sm truncate text-white">
          {item.name}
        </div>
        <div className="text-[10px] font-medium opacity-90 truncate text-emerald-100">
          {item.composition || item.dosageForm || 'Pharmaceutical Grade Formula'}
        </div>
      </div>

      {/* Box Footer Strip */}
      <div className="flex justify-between items-center pt-1.5 border-t border-white/20 z-10 text-[9px] font-bold opacity-90 text-white">
        <span className="flex items-center">
          <Sparkles className="w-2.5 h-2.5 mr-1" /> Verified Batch
        </span>
        <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded">{item.batchNumber || 'BATCH-001'}</span>
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPIRED' | 'NEAR_EXPIRY' | 'LOW_STOCK'>('ALL');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Layout View Mode (Table vs Container Cards)
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Computed KPI Metrics for Inventory Overview
  const metrics = useMemo(() => {
    let totalStockCount = 0;
    let totalStockValuation = 0;
    let lowStockAlertCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twentyDaysFromNow = new Date(today);
    twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);

    inventory.forEach(item => {
      const stock = Number(item.stock || 0);
      const price = Number(item.costPrice > 0 ? item.costPrice : item.price || 0);
      totalStockCount += stock;
      totalStockValuation += (stock * price);

      if (stock === 0) outOfStockCount++;
      else if (stock < 5) lowStockAlertCount++;

      if (item.expiryDate) {
        const exp = new Date(item.expiryDate);
        if (exp <= twentyDaysFromNow) expiringCount++;
      }
    });

    return {
      totalMedicines: inventory.length,
      totalStockCount,
      totalStockValuation,
      lowStockAlertCount,
      outOfStockCount,
      expiringCount
    };
  }, [inventory]);

  const [editItemData, setEditItemData] = useState<any>({
    _id: '',
    name: '',
    stock: '',
    expiryDate: '',
    price: '',
    costPrice: '',
    distributor: '',
    batchNumber: '',
    barcode: '',
    image: ''
  });

  const openEditModal = (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditItemData({
      _id: item._id,
      name: item.name || '',
      stock: item.stock || 0,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      price: item.price || item.costPrice || 0,
      costPrice: item.costPrice || item.price || 0,
      distributor: item.distributor || '',
      batchNumber: item.batchNumber || '',
      barcode: item.barcode || '',
      image: item.image || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${getBaseUrl()}/api/inventory/update/${editItemData._id}`, editItemData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setIsEditModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchInventory();
      alert('Medicine details & Image updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update item: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Computer Local Image File Picker
  const localImageInputRef = useRef<HTMLInputElement | null>(null);

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image file size is too large. Please select an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const rawUrl = event.target.result as string;
        
        // Canvas compression to shrink high-res PC photos into fast ~150KB Data URLs
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.80);
            if (isEditMode) {
              setEditItemData(prev => ({ ...prev, image: compressedDataUrl }));
            } else {
              setFormData(prev => ({ ...prev, image: compressedDataUrl }));
            }
          }
        };
        img.src = rawUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  // Excel Bulk Upload State
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setIsUploadingExcel(true);
    try {
      const token = localStorage.getItem('pharma_token');
      const response = await axios.post(`${getBaseUrl()}/api/inventory/bulk-upload`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      alert(response.data.message || 'Excel file imported successfully!');
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to process Excel file.');
    } finally {
      setIsUploadingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadExcelTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Medicine Name,Generic Composition,Category,Batch Number,Stock,Buying Price,MRP,Expiry Date,Distributor,Barcode\n" +
      "Paracetamol 650mg,Paracetamol 650mg,Tablet,BATCH-2025-01,100,12.50,18.00,2026-12-31,Cipla Wholesalers,8901234567890\n" +
      "Azithromycin 500mg,Azithromycin 500mg,Tablet,AZ-BATCH-99,50,45.00,65.00,2026-08-15,Sun Pharma,8909876543210\n" +
      "Amoxicillin 500mg,Amoxicillin 500mg,Capsule,AMX-BATCH-02,80,18.00,25.00,2025-11-20,Mankind Pharma,8905555444333";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Pharmacy_Medicines_Bulk_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/inventory';
      if (filterType === 'EXPIRED') endpoint = '/api/inventory/expired';
      else if (filterType === 'NEAR_EXPIRY') endpoint = '/api/inventory/near-expiry';
      
      const { data } = await axios.get(`${getBaseUrl()}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filterType]);

  const getStatus = (item: any) => {
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    // Remove time portion for accurate day calculation
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-200', icon: <AlertCircle />, daysLeft };
    if (daysLeft <= 20) return { label: 'Near Expiry', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: <AlertTriangle />, daysLeft };
    if (item.stock < 5) return { label: 'Low Stock', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <PackageOpen />, daysLeft };
    return { label: 'Normal', color: 'bg-green-50 text-green-600 border-green-200', icon: <CheckCircle />, daysLeft };
  };

  const filteredInventory = useMemo(() => {
    let result = inventory;
    
    // Apply local 'LOW STOCK' filter if needed because backend doesn't have a specific low-stock endpoint
    // Actually, I can just filter it on frontend if filterType === 'LOW_STOCK'
    if (filterType === 'LOW_STOCK') {
       result = result.filter(item => item.stock < 5);
    }

    if (searchTerm) {
      const lowerReq = searchTerm.toLowerCase();
      result = result.filter(
        item => item.name.toLowerCase().includes(lowerReq) || 
        (item.batchNumber && item.batchNumber.toLowerCase().includes(lowerReq)) ||
        (item.distributor && item.distributor.toLowerCase().includes(lowerReq))
      );
    }
    return result;
  }, [inventory, searchTerm, filterType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage, itemsPerPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalData = { ...formData, price: formData.costPrice }; // Set default MRP to BP for now
      await axios.post(`${getBaseUrl()}/api/inventory/add`, finalData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', stock: '', expiryDate: '', price: '', costPrice: '', distributor: '', batchNumber: '', barcode: '' });
      fetchInventory();
      alert('Pharmacy Stock updated successfully!');
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.statusText || err.message || 'Unknown error';
      alert("Error adding item: " + errorMsg + "\n\n(Tip: Did you restart the backend server?)");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this stock entry?')) {
      try {
         await axios.delete(`${getBaseUrl()}/api/inventory/${id}`, {
           headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
         });
         fetchInventory();
      } catch(err) {
         console.error(err);
      }
    }
  };

  const openDetails = (item: any) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const handleBarcodeSearch = async (code: string) => {
     try {
       setIsScanning(false);
       setFormData(prev => ({ ...prev, barcode: code }));
       // Attempt to fetch name from existing product catalog
       const { data } = await axios.get(`${getBaseUrl()}/api/products/barcode/${code}`, {
         headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
       });
       const product = Array.isArray(data) ? data[0] : data;
       if (product && product.name) {
         setFormData(prev => ({ ...prev, name: product.name }));
         alert(`Found: ${product.name}! Expiry must be typed manually.`);
       }
     } catch (err) {
       console.log('Product not found in master catalog, manual entry required.');
     }
  };

  const updateItemStock = async (id: string, newStock: number, e: React.MouseEvent) => {
     e.stopPropagation();
     const input = prompt("Enter new absolute stock amount:", String(newStock));
     if (input && !isNaN(Number(input))) {
        try {
           await axios.put(`${getBaseUrl()}/api/inventory/update/${id}`, { stock: Number(input) }, {
             headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
           });
           fetchInventory();
        } catch(err) {
           console.error(err);
        }
     }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
            <PackagePlus className="w-6 h-6 mr-3 text-blue-600" />
            Pharmacy Inventory Manager
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Real-time stock & expiry tracking</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Download Sample Template */}
          <button
            onClick={downloadExcelTemplate}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center border border-slate-200 shadow-xs"
            title="Download Sample Excel / CSV Format"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Sample Template
          </button>

          {/* Bulk Upload Excel */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleExcelUpload}
          />
          <button
            disabled={isUploadingExcel}
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 text-white rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center shadow-md active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {isUploadingExcel ? (
              <span className="flex items-center">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importing...
              </span>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload Excel
              </>
            )}
          </button>

          {/* Single Add Stock */}
          <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs tracking-wide transition-all active:scale-95 flex items-center shadow-sm">
             <Plus className="w-4 h-4 mr-2" />
             Add New Stock
          </button>
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Medicines</div>
            <div className="text-2xl font-black text-slate-800">{metrics.totalMedicines} <span className="text-xs font-bold text-slate-400">Items</span></div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">{metrics.totalStockCount} units in stock</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Valuation</div>
            <div className="text-2xl font-black text-slate-800">₹{metrics.totalStockValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div className="text-[11px] font-semibold text-blue-600 mt-0.5">Asset Inventory Worth</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Alerts</div>
            <div className="text-2xl font-black text-slate-800">{metrics.lowStockAlertCount + metrics.outOfStockCount} <span className="text-xs font-bold text-slate-400">Items</span></div>
            <div className="text-[11px] font-semibold text-amber-600 mt-0.5">{metrics.outOfStockCount} out of stock • {metrics.lowStockAlertCount} low</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Near / Expired</div>
            <div className="text-2xl font-black text-slate-800">{metrics.expiringCount} <span className="text-xs font-bold text-slate-400">Batches</span></div>
            <div className="text-[11px] font-semibold text-red-600 mt-0.5">Check expiry dates</div>
          </div>
        </div>
      </div>

      {/* Action Filters, Search and View Switcher */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button onClick={() => setFilterType('ALL')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${filterType === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
             All Stock
          </button>
          <button onClick={() => setFilterType('LOW_STOCK')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center ${filterType === 'LOW_STOCK' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}>
             {filterType === 'LOW_STOCK' && <PackageOpen className="w-3.5 h-3.5 mr-2" />}
             Low Stock
          </button>
          <button onClick={() => setFilterType('NEAR_EXPIRY')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center ${filterType === 'NEAR_EXPIRY' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}>
             {filterType === 'NEAR_EXPIRY' && <AlertTriangle className="w-3.5 h-3.5 mr-2" />}
             Near Expiry
          </button>
          <button onClick={() => setFilterType('EXPIRED')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center ${filterType === 'EXPIRED' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-red-500 border border-red-200 hover:bg-red-50'}`}>
             {filterType === 'EXPIRED' && <AlertCircle className="w-3.5 h-3.5 mr-2" />}
             Expired Items
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
               type="text" 
               placeholder="Search medicine, batch, distributor..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-white p-3.5 pl-11 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-medium text-sm text-slate-700 shadow-sm"
            />
          </div>

          {/* View Mode Toggle (Table vs Container Cards) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table View"
            >
              <List className="w-4 h-4 mr-1.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'GRID' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Container Cards View"
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              Containers
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Container Cards or Table */}
      {viewMode === 'GRID' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center font-bold text-slate-400 rounded-2xl border border-slate-200 shadow-sm">
              Loading medicine containers...
            </div>
          ) : filteredInventory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedInventory.map((item) => {
                const status = getStatus(item);
                return (
                  <div 
                    key={item._id} 
                    onClick={() => openDetails(item)}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Color Status Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${item.stock === 0 ? 'bg-red-500' : item.stock < 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                    <div>
                      {/* Top Packaging Photo Container */}
                      <div className="relative mb-3.5 pt-1">
                        <MedicinePackagingImage item={item} heightClass="h-36" />

                        {/* Floating Stock Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border ${
                            item.stock === 0 
                              ? 'bg-red-900/80 text-white border-red-400/50' 
                              : item.stock < 5 
                              ? 'bg-amber-900/80 text-amber-200 border-amber-400/50' 
                              : 'bg-emerald-900/80 text-emerald-200 border-emerald-400/50'
                          }`}>
                            {item.stock === 0 ? 'Out of Stock' : `${item.stock} Units`}
                          </span>
                        </div>

                        {/* Floating Add/Change Photo Button */}
                        <button
                          onClick={(e) => openEditModal(item, e)}
                          className="absolute bottom-2 right-2 z-10 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg backdrop-blur-md transition-all shadow-sm flex items-center text-[10px] font-bold"
                          title="Add/Edit Medicine Box Image"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1" />
                          {item.image ? 'Change Photo' : 'Add Photo'}
                        </button>
                      </div>

                      {/* Medicine Info Header */}
                      <h3 className="font-black text-slate-800 text-base group-hover:text-emerald-600 transition-colors line-clamp-1 tracking-tight">
                        {item.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-extrabold text-slate-500 font-mono">
                          {item.batchNumber || 'BATCH-001'}
                        </span>
                        {item.distributor && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold flex items-center border border-emerald-100">
                            <Building2 className="w-2.5 h-2.5 mr-1" />
                            {item.distributor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Action Toolbar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">BP (Buying)</div>
                        <div className="text-lg font-black text-emerald-600">₹{(item.costPrice > 0 ? item.costPrice : item.price || 0).toFixed(2)}</div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openDetails(item); }} 
                          title="Quick Details" 
                          className="p-2 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 rounded-xl transition-colors border border-slate-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => openEditModal(item, e)} 
                          title="Edit Medicine & Image" 
                          className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-xl transition-colors border border-slate-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(item._id, e)} 
                          title="Delete Item" 
                          className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-xl transition-colors border border-slate-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-16 text-center rounded-2xl border border-slate-200 shadow-sm">
              <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-600">No Inventory Found</h3>
              <p className="text-slate-400 text-sm mt-1">Adjust filters or add new stock.</p>
            </div>
          )}

          {/* Pagination Controls Footer for Grid Mode */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{filteredInventory.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="font-bold text-emerald-600">{filteredInventory.length}</span> medicines
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per Page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={filteredInventory.length || 500}>All ({filteredInventory.length})</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                >
                  Previous
                </button>

                <span className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Table Area */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs font-black uppercase tracking-widest">
                   <th className="p-5">Medicine Name</th>
                   <th className="p-5 text-center">Stock</th>
                   {filterType !== 'ALL' && <th className="p-5">Expiry Status</th>}
                   <th className="p-5 text-center text-blue-600 font-extrabold uppercase whitespace-nowrap">BP (BUY)</th>
                   <th className="p-5">Distributor</th>
                   <th className="p-5">Last Updated</th>
                   <th className="p-5 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {loading ? (
                   <tr>
                      <td colSpan={filterType === 'ALL' ? 6 : 7} className="p-10 text-center font-bold text-slate-400">Loading inventory...</td>
                   </tr>
                  ) : filteredInventory.length > 0 ? (
                    paginatedInventory.map((item) => {
                      const status = getStatus(item);
                      return (
                        <tr key={item._id} onClick={() => openDetails(item)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                          <td className="p-5">
                             <div className="flex items-center space-x-3.5">
                               <div className="w-12 h-12 flex-shrink-0">
                                 <MedicinePackagingImage item={item} heightClass="h-12" />
                               </div>
                               <div>
                                 <div className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors tracking-tight">{item.name}</div>
                                 <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase font-mono">Batch: {item.batchNumber || 'N/A'}</div>
                               </div>
                             </div>
                          </td>
                          <td className="p-5">
                            <span className={`px-3 py-1.5 rounded-lg font-black text-sm border ${item.stock === 0 ? 'bg-red-50 text-red-600 border-red-200' : item.stock < 5 ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                               {item.stock === 0 ? '0 Units' : `${item.stock} Units`}
                            </span>
                          </td>
                          {filterType !== 'ALL' && (
                           <td className="p-5">
                               <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-bold ${status.color} mb-2`}>
                                  <span className="w-3.5 h-3.5 mr-1.5 opacity-80">{status.icon}</span>
                                  {status.label} 
                                  {status.daysLeft > 0 && <span>&nbsp;• {status.daysLeft} days</span>}
                                  {status.daysLeft <= 0 && <span>&nbsp;• Expired</span>}
                               </div>
                               <div className="text-[10px] font-bold text-slate-400 flex items-center ml-1">
                                  <CalendarDays className="w-3 h-3 mr-1" />
                                  {new Date(item.expiryDate).toLocaleDateString()}
                               </div>
                           </td>
                          )}
                           <td className="p-5 text-center font-black text-blue-600 text-base">₹{(item.costPrice > 0 ? item.costPrice : item.price || 0).toFixed(2)}</td>
                          <td className="p-5">
                             <span className="px-2.5 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{item.distributor}</span>
                          </td>
                          <td className="p-5">
                            <div className="text-xs font-bold text-slate-500">{new Date(item.lastUpdated).toLocaleDateString()}</div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                                <button onClick={(e) => openEditModal(item, e)} title="Edit Medicine & Image" className="p-2 bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg transition-colors border border-slate-200">
                                   <Edit2 className="w-4 h-4" />
                                </button>
                               <button onClick={(e) => handleDelete(item._id, e)} title="Delete Item" className="p-2 bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors border border-slate-200">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                       <td colSpan={filterType === 'ALL' ? 6 : 7} className="p-20 text-center">
                          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-slate-600">No Inventory Found</h3>
                          <p className="text-slate-400 text-sm mt-1">Adjust filters or add new stock.</p>
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-slate-600">
                Showing <span className="font-bold text-slate-900">{filteredInventory.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="font-bold text-emerald-600">{filteredInventory.length}</span> medicines
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per Page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={filteredInventory.length || 500}>All ({filteredInventory.length})</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
         </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:justify-center items-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full lg:max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 lg:slide-in-from-bottom-4">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                 <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                    <PackagePlus className="w-5 h-5 mr-2 text-blue-600" />
                    Add Stock (Received from Distributor)
                 </h2>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white rounded-xl text-slate-400 hover:bg-slate-200 border border-slate-200 active:scale-95 transition-all">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6">
                 {isScanning ? (
                    <div className="bg-black rounded-2xl overflow-hidden relative min-h-[250px] mb-6 shadow-inner ring-4 ring-slate-100">
                       <BarcodeScannerComponent
                         width="100%"
                         height="auto"
                         onUpdate={(_err, result) => {
                           if (result) handleBarcodeSearch(result.getText());
                         }}
                       />
                       <button onClick={() => setIsScanning(false)} className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-bold text-xs uppercase rounded-xl tracking-wider shadow-md">
                         Stop Camera
                       </button>
                       <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
                         <div className="w-64 h-32 border-2 border-emerald-400 rounded-xl flex items-center p-2">
                             <div className="w-full h-1 bg-emerald-400/80 animate-pulse" />
                         </div>
                       </div>
                    </div>
                 ) : (
                    <button onClick={() => setIsScanning(true)} className="w-full mb-6 py-4 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-500 font-bold hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-[0.98]">
                      <Barcode className="w-5 h-5 mr-2" />
                      Add by Scan (Autofill Name)
                    </button>
                 )}

                 <form onSubmit={handleSaveItem} className="space-y-4">
                    <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">Medicine Name *</label>
                       <input autoFocus required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Dolo 650mg Tablet" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">Received Qty *</label>
                         <input required type="number" name="stock" value={formData.stock} onChange={handleInputChange} placeholder="100" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800" />
                       </div>
                       <div>
                         <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">Expiry Date *</label>
                         <input required type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800" />
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">Buying Price (BP) / Unit cost *</label>
                       <input required type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleInputChange} placeholder="50.00" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800 ring-2 ring-blue-500/50 shadow-lg" />
                    </div>
                    <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">Distributor *</label>
                       <input required type="text" name="distributor" value={formData.distributor} onChange={handleInputChange} placeholder="Shashank Distributor" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800" />
                    </div>

                    <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">Batch Number (Optional)</label>
                       <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleInputChange} placeholder="B-849320" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800" />
                    </div>

                    <button type="submit" className="w-full mt-4 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]">
                       Save Pharmacy Stock
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

       {/* View Details Modal */}
      {isDetailsModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsDetailsModalOpen(false)}>
           <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8 transform animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              
              {/* Medicine Image Banner */}
              {selectedItem.image ? (
                <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 border border-slate-200 bg-slate-50 relative">
                  <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                    Verified Package
                  </span>
                </div>
              ) : (
                <div className="w-full h-28 rounded-2xl mb-6 border border-slate-100 bg-emerald-50/50 flex flex-col items-center justify-center text-emerald-600">
                  <span className="text-3xl mb-1">💊</span>
                  <span className="text-xs font-semibold text-slate-400">No Image Uploaded</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedItem.name}</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Item Details</p>
                 </div>
                 <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Current Stock</span>
                     <span className={`px-4 py-1.5 rounded-lg text-sm font-black ${selectedItem.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>{selectedItem.stock} Units</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Expiry Date</span>
                     <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{new Date(selectedItem.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-50">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Buying Cost (BP)</span>
                     <span className="text-base font-black text-blue-600">₹{(selectedItem.costPrice > 0 ? selectedItem.costPrice : selectedItem.price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Distributor</span>
                     <span className="text-sm font-black text-slate-800">{selectedItem.distributor}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Batch Code</span>
                     <span className="text-sm font-bold text-slate-500">{selectedItem.batchNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Last Updated</span>
                     <span className="text-sm font-bold text-slate-500">{new Date(selectedItem.lastUpdated).toLocaleString()}</span>
                  </div>
              </div>
              
              <div className="mt-8 flex space-x-3">
                 <button onClick={() => { setIsDetailsModalOpen(false); openEditModal(selectedItem); }} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-md text-xs flex items-center justify-center space-x-2">
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Medicine & Image</span>
                 </button>
                 <button onClick={() => setIsDetailsModalOpen(false)} className="px-5 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors text-xs">
                    Done
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Medicine & Image Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsEditModalOpen(false)}>
           <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-7 transform animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-5 border-b border-slate-100 pb-3">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                       <Edit2 className="w-5 h-5 mr-2 text-emerald-600" />
                       Edit Medicine & Image
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Update stock details and product packaging photo</p>
                 </div>
                 <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-200 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4">
                 {/* Live Image Preview & Upload Controls */}
                 <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 block flex items-center justify-between">
                       <span className="flex items-center">
                          <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          Medicine Packaging Photo
                       </span>
                       <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Computer File / Web URL
                       </span>
                    </label>

                    {/* Button 1: Upload from Computer */}
                    <input
                      type="file"
                      ref={localImageInputRef}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={(e) => handleLocalImageSelect(e, true)}
                    />
                    
                    <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => localImageInputRef.current?.click()}
                         className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center active:scale-95"
                       >
                          <Camera className="w-4 h-4 mr-2" />
                          Upload from Computer
                       </button>

                       {editItemData.image && (
                          <button
                            type="button"
                            onClick={() => setEditItemData({ ...editItemData, image: '' })}
                            className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold text-xs transition-colors border border-red-200"
                          >
                             Remove Photo
                          </button>
                       )}
                    </div>

                    <div className="pt-1">
                        <div className="text-[10px] font-bold text-slate-400 mb-1">OR Paste Web Image URL:</div>
                        <input
                          type="url"
                          placeholder="https://example.com/medicine_packaging.jpg"
                          value={editItemData.image || ''}
                          onChange={(e) => setEditItemData({ ...editItemData, image: e.target.value })}
                          className="w-full bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                     </div>

                     {/* Image Preview Box */}
                     {editItemData.image ? (
                        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white mt-2">
                           <img 
                             src={editItemData.image} 
                             alt="Medicine Preview" 
                             className="w-full h-full object-cover" 
                             onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} 
                           />
                        </div>
                     ) : (
                        <p className="text-[10px] text-slate-400 italic">Select a photo from your PC or paste a web URL to display packaging photo to cashiers.</p>
                     )}
                 </div>

                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Medicine Name *</label>
                    <input required type="text" value={editItemData.name || ''} onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-800 focus:bg-white" />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Stock Quantity *</label>
                       <input required type="number" value={editItemData.stock ?? 0} onChange={(e) => setEditItemData({ ...editItemData, stock: Number(e.target.value) })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-800 focus:bg-white" />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Expiry Date *</label>
                       <input required type="date" value={editItemData.expiryDate || ''} onChange={(e) => setEditItemData({ ...editItemData, expiryDate: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-800 focus:bg-white" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Buying Price (BP) *</label>
                       <input required type="number" step="0.01" value={editItemData.costPrice ?? 0} onChange={(e) => setEditItemData({ ...editItemData, costPrice: Number(e.target.value) })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-800 focus:bg-white" />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Selling Price (MRP)</label>
                       <input type="number" step="0.01" value={editItemData.price ?? 0} onChange={(e) => setEditItemData({ ...editItemData, price: Number(e.target.value) })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-800 focus:bg-white" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Batch Number</label>
                       <input type="text" value={editItemData.batchNumber || ''} onChange={(e) => setEditItemData({ ...editItemData, batchNumber: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-800 focus:bg-white" />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Distributor</label>
                       <input type="text" value={editItemData.distributor || ''} onChange={(e) => setEditItemData({ ...editItemData, distributor: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-800 focus:bg-white" />
                    </div>
                 </div>

                 <div className="pt-2 flex space-x-3">
                    <button type="submit" className="flex-1 py-3.5 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95" style={{ backgroundColor: 'var(--primary)' }}>
                       Save Changes
                    </button>
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-200">
                       Cancel
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
