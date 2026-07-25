import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Compass, 
  Clock, 
  DollarSign, 
  LogOut, 
  CheckCircle, 
  Map, 
  Signature as SigIcon 
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const DeliveryModule: React.FC = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Signature and OTP state
  const [otp, setOtp] = useState('');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('pharma_user') || '{}');

  const fetchDeliveries = async () => {
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/prescriptions?status=out_for_delivery`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setDeliveries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pharma_token');
    localStorage.removeItem('pharma_user');
    navigate('/auth');
  };

  // Drawing signature Canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900

    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const openCompletionModal = (order: any) => {
    setSelectedOrder(order);
    setIsSubmitOpen(true);
    setOtp('');
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = 140;
      }
    }, 100);
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      alert('OTP code is mandatory');
      return;
    }

    let sigData = '';
    if (canvasRef.current) {
      sigData = canvasRef.current.toDataURL('image/png');
    }

    try {
      await axios.post(`${getBaseUrl()}/api/prescriptions/${selectedOrder._id}/complete-delivery`, {
        otp,
        digitalSignature: sigData,
        deliveryProof: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });

      alert('Order delivered and closed successfully!');
      setIsSubmitOpen(false);
      setSelectedOrder(null);
      fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-12 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-b-[32px] shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Bike className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">{currentUser.name}</h2>
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Delivery Executive</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300">Active Run Status:</span>
          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-wider border border-emerald-500/20">
            Online
          </span>
        </div>
      </div>

      {/* Main Courier Queue */}
      <div className="p-4 flex-1 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Assigned Deliveries Queue</h3>
        
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 text-xs">Loading queue...</div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border shadow-sm">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h4 className="font-bold text-slate-700">All Runs Complete!</h4>
            <p className="text-xs text-slate-400 mt-1">Check back later for new prescription dispatch assignments.</p>
          </div>
        ) : (
          deliveries.map(item => (
            <div key={item._id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{item.patient.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Order: {item.externalPrescriptionId}</p>
                </div>
                <div className="bg-slate-50 border p-2.5 rounded-xl text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider leading-none mb-1">Cash Due</span>
                  <span className="font-black text-slate-800 text-xs">₹{item.estimatedCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{item.deliveryAddress}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <a href={`tel:${item.patient.phone}`} className="text-indigo-600 underline font-bold">{item.patient.phone}</a>
                </div>
              </div>

              {/* SIMULATED MAP MOCK */}
              <div className="bg-slate-100 rounded-2xl h-24 overflow-hidden relative border border-slate-200">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Route path */}
                  <path d="M 40,80 Q 150,20 320,60" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="6,4" />
                </svg>
                {/* Pharmacy marker */}
                <div className="absolute left-[30px] bottom-[10px] bg-indigo-600 text-white p-1 rounded-lg shadow-md border-2 border-white">
                  <Compass className="w-3 h-3" />
                </div>
                {/* Destination marker */}
                <div className="absolute right-[60px] top-[20px] bg-rose-500 text-white p-1 rounded-lg shadow-md border-2 border-white animate-pulse">
                  <MapPin className="w-3 h-3" />
                </div>
                <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-indigo-400" /> 12 Mins
                </div>
              </div>

              <button
                onClick={() => openCompletionModal(item)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase py-4 rounded-2xl tracking-widest transition-all"
              >
                Complete Delivery
              </button>
            </div>
          ))
        )}
      </div>

      {/* Completion Modal Overlay */}
      {isSubmitOpen && selectedOrder && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-t-[32px] w-full max-w-md p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Verify Handover</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Order ID: {selectedOrder.externalPrescriptionId}</p>
              </div>
              <button 
                onClick={() => setIsSubmitOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 px-3 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitDelivery} className="space-y-5 text-xs font-semibold text-slate-700">
              
              {/* OTP */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Patient Validation Code (OTP)</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  className="w-full bg-slate-50 border p-4 rounded-2xl font-extrabold text-xl text-center placeholder-slate-300 focus:outline-none"
                />
              </div>

              {/* Signature Canvas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <SigIcon className="w-3.5 h-3.5 mr-1" />
                    Recipient Digital Signature
                  </label>
                  <button 
                    type="button"
                    onClick={clearCanvas}
                    className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    Clear
                  </button>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 h-[140px] relative">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-indigo-100 transition-all"
              >
                Submit Handover Verification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryModule;
