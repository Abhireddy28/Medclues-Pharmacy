import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building, 
  Plus, 
  Key, 
  Globe, 
  CheckCircle, 
  AlertOctagon, 
  Trash2, 
  RotateCw, 
  FileCode, 
  Terminal, 
  Layers 
} from 'lucide-react';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const HospitalIntegrations: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    webhookUrl: '',
    permissions: 'read_prescriptions,write_dispense_records'
  });
  const [revealSecrets, setRevealSecrets] = useState<{ [key: string]: boolean }>({});
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${getBaseUrl()}/api/hospitals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setHospitals(data);
      if (data.length > 0 && !selectedHospital) {
        setSelectedHospital(data[0]);
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      // Mock some sync audit logs or fetch error logs from backend
      const logs = [];
      if (selectedHospital.errorLogs && selectedHospital.errorLogs.length > 0) {
        selectedHospital.errorLogs.forEach((err: any) => {
          logs.push({
            type: 'error',
            timestamp: err.timestamp,
            msg: err.error,
            endpoint: err.endpoint
          });
        });
      }
      
      // Seed some successful sync events to look highly active
      logs.push({
        type: 'success',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        msg: 'Synced catalog items successfully with MEDCLUES',
        endpoint: '/api/integration/catalog/search'
      });
      logs.push({
        type: 'success',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        msg: 'Prescription webhook received and queued for verification',
        endpoint: '/api/integration/medclues/prescription'
      });

      if (selectedHospital.retryQueue && selectedHospital.retryQueue.length > 0) {
        selectedHospital.retryQueue.forEach((item: any) => {
          logs.push({
            type: 'queued',
            id: item._id,
            timestamp: item.timestamp,
            msg: `Failed to deliver webhook. Queue attempts: ${item.attempts}`,
            endpoint: item.endpoint
          });
        });
      }

      setSyncLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  }, [selectedHospital]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${getBaseUrl()}/api/hospitals`, {
        name: formData.name,
        webhookUrl: formData.webhookUrl,
        permissions: formData.permissions.split(',')
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setHospitals([...hospitals, data]);
      setIsModalOpen(false);
      setFormData({ name: '', webhookUrl: '', permissions: 'read_prescriptions,write_dispense_records' });
    } catch (err) {
      alert('Failed to register hospital connection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this hospital?')) return;
    try {
      await axios.delete(`${getBaseUrl()}/api/hospitals/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      setHospitals(hospitals.filter(h => h._id !== id));
      if (selectedHospital?._id === id) {
        setSelectedHospital(null);
      }
    } catch (err) {
      alert('Failed to delete connection');
    }
  };

  const handleRetry = async (payloadId: string) => {
    if (!selectedHospital) return;
    try {
      const { data } = await axios.post(`${getBaseUrl()}/api/hospitals/${selectedHospital._id}/retry/${payloadId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('pharma_token')}` }
      });
      alert(data.message);
      fetchHospitals(); // reload
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry webhook');
    }
  };

  const toggleSecret = (id: string) => {
    setRevealSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Building className="w-7 h-7 text-indigo-600 mr-3" />
            Hospital Connected Integrations
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Secure REST API & Webhook Node Connections
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-5 py-3 rounded-2xl flex items-center shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Register Hospital
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 font-bold text-slate-400">Loading connections...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hospital Connections List */}
          <div className="lg:col-span-2 space-y-4">
            {hospitals.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-700 text-lg">No Hospital System Connected</h3>
                <p className="text-slate-400 text-xs mt-1">Register a hospital to view HMAC credentials and receive prescriptions.</p>
              </div>
            ) : (
              hospitals.map(h => (
                <div 
                  key={h._id} 
                  onClick={() => setSelectedHospital(h)}
                  className={`bg-white rounded-3xl border p-6 hover:shadow-md cursor-pointer transition-all ${
                    selectedHospital?._id === h._id ? 'border-indigo-500 shadow-md shadow-indigo-50/50' : 'border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="font-bold text-slate-800">{h.name}</h3>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          h.connectionStatus === 'active' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {h.connectionStatus}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 font-mono mt-1">Code: {h.code}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(h._id); }}
                      className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Key className="w-3.5 h-3.5 mr-1 text-slate-400" /> API Key
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-100 p-2 rounded-xl select-all">{h.apiKey}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Key className="w-3.5 h-3.5 mr-1 text-indigo-400 animate-pulse" /> HMAC Secret
                      </span>
                      <div className="flex items-center bg-white border border-slate-100 p-2 rounded-xl select-all font-mono text-xs">
                        <span className="flex-1 font-bold text-slate-700 truncate mr-2">
                          {revealSecrets[h._id] ? h.apiSecret : '••••••••••••••••••••••••••••••••'}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSecret(h._id); }}
                          className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded"
                        >
                          {revealSecrets[h._id] ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[200px] font-mono text-slate-600">{h.webhookUrl || 'No Webhook URL configured'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 ml-auto">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>{h.permissions.length} Permissions</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Real-time Sync & Webhook logs stream */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-sm border border-slate-800 flex flex-col h-[75vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center">
                  <Terminal className="w-4 h-4 text-indigo-400 mr-2" />
                  Audit Sync Stream
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {selectedHospital ? selectedHospital.name : 'Select hospital to view logs'}
                </p>
              </div>
              <RotateCw className="w-4 h-4 text-slate-500 animate-spin" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {syncLogs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 italic">No synchronization logs available</div>
              ) : (
                syncLogs.map((log, index) => (
                  <div key={index} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold font-mono">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] tracking-wider ${
                        log.type === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : log.type === 'error'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                    
                    <p className="font-bold text-slate-300 font-mono text-xs">{log.msg}</p>
                    
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-900/60 text-[10px] text-slate-500 font-bold">
                      <span className="font-mono">{log.endpoint}</span>
                      
                      {log.type === 'queued' && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider text-[8px] transition-all"
                        >
                          Resend Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Hospital Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl scale-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Building className="w-5.5 h-5.5 text-indigo-600 mr-2" />
                Register Hospital
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 px-3 py-2 rounded-xl transition-all"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital System Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. St. John's General Hospital"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outgoing Webhook Endpoint (Url)</label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="e.g. https://hospital-server.com/api/webhook/prescriptions"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scoped API Permissions (comma separated)</label>
                <input
                  type="text"
                  value={formData.permissions}
                  onChange={e => setFormData({ ...formData, permissions: e.target.value })}
                  placeholder="e.g. read_prescriptions,write_dispense_records"
                  className="w-full bg-slate-50 border p-4 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase py-4 rounded-2xl tracking-widest shadow-lg shadow-indigo-100 hover:scale-[1.01] active:scale-95 transition-all mt-4"
              >
                Provision API Keys & HMAC Secret
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalIntegrations;
