import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  ClipboardList, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Search, 
  Check, 
  Plus, 
  PackageCheck, 
  Bike, 
  CreditCard, 
  Signature, 
  Eye, 
  ExternalLink,
  ChevronRight,
  FileCheck,
  CheckCircle,
  Truck
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const PrescriptionQueue: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [deliveryExecutives, setDeliveryExecutives] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // Selection states
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [detailModalMode, setDetailModalMode] = useState<'details' | 'verify' | 'pack' | 'dispatch' | 'pickup' | 'none'>('none');

  // Verification Overlay Form States
  const [verificationMedicines, setVerificationMedicines] = useState<any[]>([]);
  const [assignedBranch, setAssignedBranch] = useState<string>('');

  // Packing Form States
  const [barcodeVerified, setBarcodeVerified] = useState(false);
  const [expiryVerified, setExpiryVerified] = useState(false);
  const [packingNotes, setPackingNotes] = useState('');

  // Dispatch Form States
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');

  // Checkout Pickup Form States
  const [patientOtp, setPatientOtp] = useState('');

  // Alternative Brand search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeMedIndex, setActiveMedIndex] = useState<number | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('pharma_user') || '{}');

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('pharma_token');
      const branchParam = activeBranch ? `&branchId=${activeBranch}` : '';
      const { data } = await axios.get(`${getBaseUrl()}/api/prescriptions?1=1${branchParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/branches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setBranches(data);
      if (data.length > 0 && currentUser.role !== 'pharmacy') {
        setActiveBranch(currentUser.branchId || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/inventory`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setInventoryItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeliveryExecutives = async () => {
    try {
      // Find staff in default branch or query all branch staff
      if (branches.length > 0) {
        const { data } = await axios.get(`${getBaseUrl()}/api/branches/${branches[0]._id}/staff`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
        });
        setDeliveryExecutives(data.filter((u: any) => u.role === 'delivery_executive'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchInventory();
  }, []);

  useEffect(() => {
    fetchPrescriptions();
    if (activeBranch) {
      fetchDeliveryExecutives();
    }
  }, [activeBranch]);

  // Floating toast notification state
  const [newAlertToast, setNewAlertToast] = useState<string | null>(null);

  // Web Audio chime generator
  const playNewPrescriptionChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio alert browser policy check:', e);
    }
  };

  // Socket.io listeners
  useEffect(() => {
    const socket = io(getBaseUrl());
    
    socket.on('newPrescription', (prescription: any) => {
      console.log('[Socket] New Prescription Alert:', prescription);
      playNewPrescriptionChime();
      const patientName = prescription.patient?.name || 'New Patient';
      setNewAlertToast(patientName);
      setTimeout(() => setNewAlertToast(null), 6000);
      fetchPrescriptions();
    });

    socket.on('prescriptionQueueUpdate', () => {
      console.log('[Socket] Refreshing Queue...');
      fetchPrescriptions();
    });

    return () => {
      socket.disconnect();
    };
  }, [activeBranch]);

  const openActionModal = (p: any, mode: 'details' | 'verify' | 'pack' | 'dispatch' | 'pickup') => {
    setSelectedPrescription(p);
    setDetailModalMode(mode);

    // Populate initial states
    if (mode === 'verify') {
      setAssignedBranch(p.branch?._id || branches[0]?._id || '');
      // Match current medicines to inventory matches
      const meds = p.medicines.map((m: any) => {
        // Try finding a matching name in inventoryItems
        const invMatch = inventoryItems.find(inv => inv.name.toLowerCase() === m.name.toLowerCase());
        return {
          _id: m._id,
          name: m.name,
          dosage: m.dosage,
          quantity: m.quantity,
          verificationStatus: invMatch ? 'available' : 'pending',
          verifiedProduct: invMatch ? invMatch._id : ''
        };
      });
      setVerificationMedicines(meds);
    } else if (mode === 'pack') {
      setBarcodeVerified(false);
      setExpiryVerified(false);
      setPackingNotes('');
    } else if (mode === 'dispatch') {
      setFulfillmentType(p.fulfillmentType || 'pickup');
      if (deliveryExecutives.length > 0) {
        setSelectedExecutiveId(deliveryExecutives[0]._id);
      }
    } else if (mode === 'pickup') {
      setPatientOtp('');
    }
  };

  const handleVerifySubmit = async () => {
    try {
      await axios.put(`${getBaseUrl()}/api/prescriptions/${selectedPrescription._id}/verify`, {
        branchId: assignedBranch,
        medicines: verificationMedicines
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setDetailModalMode('none');
      fetchPrescriptions();
      fetchInventory(); // refresh stock numbers
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handlePackSubmit = async () => {
    if (!barcodeVerified || !expiryVerified) {
      alert('Please confirm all safety checklist checks.');
      return;
    }
    try {
      await axios.put(`${getBaseUrl()}/api/prescriptions/${selectedPrescription._id}/pack`, {
        barcodeVerified,
        expiryVerified,
        packingNotes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setDetailModalMode('none');
      fetchPrescriptions();
    } catch (err) {
      alert('Packing checklist submission failed');
    }
  };

  const handleDispatchSubmit = async () => {
    try {
      const payload = {
        fulfillmentType,
        deliveryExecutiveId: fulfillmentType === 'delivery' ? selectedExecutiveId : undefined
      };
      const { data } = await axios.post(`${getBaseUrl()}/api/prescriptions/${selectedPrescription._id}/dispatch`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      alert(`Dispatch triggered! OTP sent to Patient: ${data.otp}`);
      setDetailModalMode('none');
      fetchPrescriptions();
    } catch (err) {
      alert('Dispatch trigger failed');
    }
  };

  const handlePickupSubmit = async () => {
    try {
      await axios.post(`${getBaseUrl()}/api/prescriptions/${selectedPrescription._id}/complete-pickup`, {
        otp: patientOtp
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      alert('POS Transaction invoice generated! Checkout complete.');
      setDetailModalMode('none');
      fetchPrescriptions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  // Search alternatives
  const searchAlternative = (query: string, medIndex: number) => {
    setActiveMedIndex(medIndex);
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    const results = inventoryItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const selectAlternative = (item: any, medIndex: number) => {
    setVerificationMedicines(prev => {
      const copy = [...prev];
      copy[medIndex].verifiedProduct = item._id;
      copy[medIndex].name = item.name;
      copy[medIndex].verificationStatus = 'alternative';
      return copy;
    });
    setSearchResults([]);
    setActiveMedIndex(null);
  };

  // Sort columns
  const columns = [
    { title: 'Received', status: 'received', color: 'border-blue-500 bg-blue-50/20' },
    { title: 'Verified / Packing', status: 'verified', color: 'border-yellow-500 bg-yellow-50/20' },
    { title: 'Packed', status: 'packed', color: 'border-indigo-500 bg-indigo-50/20' },
    { title: 'Fulfillment', status: ['ready_for_pickup', 'out_for_delivery'], color: 'border-purple-500 bg-purple-50/20' },
    { title: 'Completed', status: 'delivered', color: 'border-emerald-500 bg-emerald-50/20' }
  ];

  const getStatusText = (status: string) => {
    if (status === 'ready_for_pickup') return 'Pickup Queue';
    if (status === 'out_for_delivery') return 'Out for Delivery';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <ClipboardList className="w-7 h-7 text-indigo-600 mr-3" />
            Digital Prescription Queue
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Real-time Doctor Consultation Bridge
          </p>
        </div>

        {/* Branch Selector Dropdown */}
        {currentUser.role === 'pharmacy' && (
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Viewing Branch</span>
            <select
              value={activeBranch}
              onChange={e => setActiveBranch(e.target.value)}
              className="bg-white border text-xs font-bold text-slate-700 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {newAlertToast && (
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            <span className="font-extrabold text-xs tracking-wide">🔔 NEW PRESCRIPTION ARRIVED for {newAlertToast}! In-House Routing Queue Updated.</span>
          </div>
          <button onClick={() => setNewAlertToast(null)} className="text-xs font-black uppercase text-indigo-200 hover:text-white bg-indigo-700 px-3 py-1 rounded-lg">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 font-bold text-slate-400">Loading prescription queue...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-x-auto pb-6 select-none">
          {columns.map(col => {
            const list = prescriptions.filter(p => 
              Array.isArray(col.status) ? col.status.includes(p.status) : p.status === col.status
            );

            return (
              <div key={col.title} className="flex flex-col space-y-4 min-w-[240px]">
                <div className={`p-4 rounded-2xl border-l-4 flex justify-between items-center ${col.color}`}>
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{col.title}</span>
                  <span className="bg-white px-2 py-0.5 rounded-lg border font-mono font-bold text-[10px] text-slate-500">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {list.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 text-xs font-bold">
                      Queue Empty
                    </div>
                  ) : (
                    list.map(p => (
                      <div
                        key={p._id}
                        className={`bg-white rounded-3xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer relative ${
                          p.priority === 'emergency' 
                            ? 'border-rose-200 bg-rose-50/10 shadow-[0_0_15px_rgba(244,63,94,0.06)] ring-1 ring-rose-500/10' 
                            : ''
                        }`}
                      >
                        {p.priority === 'emergency' && (
                          <div className="absolute top-3 right-3 flex items-center space-x-1 animate-pulse">
                            <span className="w-2 h-2 bg-rose-600 rounded-full" />
                            <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Emergency</span>
                          </div>
                        )}

                        <div className="space-y-2 text-xs font-semibold text-slate-500">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{p.patient.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{p.hospital?.name || 'MEDCLUES API'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 text-[10px]">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Dr. {p.doctorName} ({p.doctorSpecialty})</span>
                          </div>

                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              {p.medicines.length} Medicines
                            </span>
                            
                            {/* Action Redirect Buttons */}
                            {p.status === 'received' && (
                              <button
                                onClick={() => openActionModal(p, 'verify')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl transition-all"
                              >
                                Verify Stock
                              </button>
                            )}

                            {p.status === 'verified' && (
                              <button
                                onClick={() => openActionModal(p, 'pack')}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl transition-all"
                              >
                                Pack Order
                              </button>
                            )}

                            {p.status === 'packed' && (
                              <button
                                onClick={() => openActionModal(p, 'dispatch')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl transition-all"
                              >
                                Dispatch
                              </button>
                            )}

                            {p.status === 'ready_for_pickup' && (
                              <button
                                onClick={() => openActionModal(p, 'pickup')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-50"
                              >
                                Checkout POS
                              </button>
                            )}

                            {['out_for_delivery', 'delivered'].includes(p.status) && (
                              <button
                                onClick={() => openActionModal(p, 'details')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl transition-all flex items-center"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERLAY ACTIONS PANEL MODAL */}
      {detailModalMode !== 'none' && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] scale-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
                  Prescription Details ({selectedPrescription.externalPrescriptionId})
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Patient: {selectedPrescription.patient.name} • {selectedPrescription.patient.age} Yrs • {selectedPrescription.patient.gender}
                </p>
              </div>
              <button 
                onClick={() => setDetailModalMode('none')}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 px-3 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

            {/* ACTION FORMS */}
            {detailModalMode === 'verify' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign to Branch for Fulfillment</label>
                  <select
                    value={assignedBranch}
                    onChange={e => setAssignedBranch(e.target.value)}
                    className="w-full bg-slate-50 border p-4 rounded-xl font-bold text-slate-800"
                  >
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Pharmacist Medicines Stock Check</h3>
                  {verificationMedicines.map((med, index) => (
                    <div key={med._id} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{med.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">Dosage: {med.dosage} • Qty: {med.quantity}</p>
                        </div>

                        <div className="flex space-x-1 text-[10px] font-bold uppercase">
                          <button
                            onClick={() => {
                              const copy = [...verificationMedicines];
                              copy[index].verificationStatus = 'available';
                              setVerificationMedicines(copy);
                            }}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${
                              med.verificationStatus === 'available' 
                                ? 'bg-emerald-500 text-white border-emerald-600' 
                                : 'bg-white text-slate-500'
                            }`}
                          >
                            In Stock
                          </button>
                          <button
                            onClick={() => {
                              const copy = [...verificationMedicines];
                              copy[index].verificationStatus = 'out_of_stock';
                              copy[index].verifiedProduct = '';
                              setVerificationMedicines(copy);
                            }}
                            className={`px-3 py-1.5 rounded-lg border transition-colors ${
                              med.verificationStatus === 'out_of_stock' 
                                ? 'bg-rose-500 text-white border-rose-600' 
                                : 'bg-white text-slate-500'
                            }`}
                          >
                            Out of Stock
                          </button>
                        </div>
                      </div>

                      {/* Alternate brand search engine */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search alternative brand compositions..."
                          onClick={() => setActiveMedIndex(index)}
                          onChange={(e) => searchAlternative(e.target.value, index)}
                          className="w-full bg-white border px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700"
                        />
                        {activeMedIndex === index && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 w-full bg-white border rounded-xl shadow-2xl z-30 overflow-hidden max-h-[160px] divide-y text-xs">
                            {searchResults.map(item => (
                              <div 
                                key={item._id}
                                onClick={() => selectAlternative(item, index)}
                                className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between font-bold"
                              >
                                <span>{item.name} (Qty: {item.stock})</span>
                                <span className="text-indigo-600">₹{item.price || item.costPrice}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleVerifySubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-indigo-100"
                >
                  Verify Prescription & Reserve Stock
                </button>
              </div>
            )}

            {detailModalMode === 'pack' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-700 text-xs font-semibold space-y-1">
                  <p className="font-extrabold uppercase text-[10px] tracking-wider">Verified Medicines Roster:</p>
                  {selectedPrescription.medicines.map((m: any, idx: number) => (
                    <p key={idx}>• {m.name} (Qty: {m.quantity}) - {m.verificationStatus}</p>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Accuracy Packing Checklist</h3>
                  
                  <label className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={barcodeVerified}
                      onChange={e => setBarcodeVerified(e.target.checked)}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Barcode Simulation Scanned</p>
                      <p className="text-slate-400 font-semibold mt-0.5">Medicine batch barcode scanned and checked against dispenser logs.</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={expiryVerified}
                      onChange={e => setExpiryVerified(e.target.checked)}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Expiry Date Validated</p>
                      <p className="text-slate-400 font-semibold mt-0.5">Verified that no items expire within next 6 months.</p>
                    </div>
                  </label>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Packing Notes</label>
                    <textarea
                      value={packingNotes}
                      onChange={e => setPackingNotes(e.target.value)}
                      placeholder="Add any packing directions..."
                      className="w-full bg-slate-50 border p-4 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePackSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-indigo-100"
                >
                  Verify Barcode & Mark Packed
                </button>
              </div>
            )}

            {detailModalMode === 'dispatch' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fulfillment Routing Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFulfillmentType('pickup')}
                      className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-2 ${
                        fulfillmentType === 'pickup' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      <ClipboardList className="w-5 h-5" />
                      <span>Patient Counter Pickup</span>
                    </button>

                    <button
                      onClick={() => setFulfillmentType('delivery')}
                      className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-2 ${
                        fulfillmentType === 'delivery' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                      <span>Secure Courier Delivery</span>
                    </button>
                  </div>
                </div>

                {fulfillmentType === 'delivery' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Delivery Executive</label>
                    {deliveryExecutives.length === 0 ? (
                      <p className="text-xs text-rose-500 font-bold bg-rose-50 p-4 rounded-xl border border-rose-100">
                        No delivery executives registered in this branch. Register one first.
                      </p>
                    ) : (
                      <select
                        value={selectedExecutiveId}
                        onChange={e => setSelectedExecutiveId(e.target.value)}
                        className="w-full bg-slate-50 border p-4 rounded-xl font-bold text-slate-800"
                      >
                        {deliveryExecutives.map(e => (
                          <option key={e._id} value={e._id}>{e.name} ({e.phone})</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <button
                  onClick={handleDispatchSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-indigo-100"
                >
                  Generate Handover OTP & Dispatch
                </button>
              </div>
            )}

            {detailModalMode === 'pickup' && (
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-800 text-xs font-semibold text-center">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-widest mb-1.5">Prescription Payment Invoice Summary</h4>
                  <p className="text-2xl font-black mb-1">₹{selectedPrescription.estimatedCost.toFixed(2)}</p>
                  <p className="text-slate-500">Pickup OTP sent to client's phone: {selectedPrescription.patient.phone}</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Enter Patient Validation OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={patientOtp}
                    onChange={e => setPatientOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full bg-slate-50 border p-4 rounded-xl font-extrabold text-xl text-center text-slate-800 placeholder-slate-300 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handlePickupSubmit}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-emerald-50"
                >
                  Confirm Checkout Payment
                </button>
              </div>
            )}

            {detailModalMode === 'details' && (
              <div className="space-y-6 text-xs text-slate-600 font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Doctor Details</p>
                    <p className="font-bold text-slate-800">Dr. {selectedPrescription.doctorName}</p>
                    <p className="text-slate-500 font-semibold">{selectedPrescription.doctorSpecialty}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Origin: {selectedPrescription.hospital?.name}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Patient Details</p>
                    <p className="font-bold text-slate-800">{selectedPrescription.patient.name}</p>
                    <p className="text-slate-500 font-semibold">{selectedPrescription.patient.phone}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">{selectedPrescription.fulfillmentType}</p>
                  </div>
                </div>

                <div className="border rounded-2xl overflow-hidden divide-y">
                  <div className="bg-slate-50 p-3 text-[10px] font-bold uppercase text-slate-400">Medicine Dispensed</div>
                  {selectedPrescription.medicines.map((m: any, i: number) => (
                    <div key={i} className="p-3 flex justify-between bg-white text-slate-800 font-bold">
                      <span>{m.name}</span>
                      <span>Qty: {m.quantity} ({m.dosage})</span>
                    </div>
                  ))}
                </div>

                {selectedPrescription.status === 'delivered' && (
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-[10px] text-emerald-800 uppercase tracking-widest">Fulfillment Proof Logs</h4>
                    
                    {selectedPrescription.digitalSignature && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Client Digital Signature:</p>
                        <div className="bg-white border rounded-xl p-2 max-w-[200px]">
                          <img src={selectedPrescription.digitalSignature} alt="Digital Signature" className="max-h-[60px] mx-auto" />
                        </div>
                      </div>
                    )}

                    {selectedPrescription.deliveryProof && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Proof Photo:</p>
                        <img 
                          src={selectedPrescription.deliveryProof} 
                          alt="Delivery Proof" 
                          className="max-h-[120px] rounded-xl border object-cover" 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionQueue;
