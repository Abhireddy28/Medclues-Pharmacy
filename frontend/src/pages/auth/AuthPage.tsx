import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, Shield, Activity, User, Mail, Lock, Building, FileText, Eye, EyeOff, KeyRound, CheckCircle2, Pill } from 'lucide-react';
import pharmacyHero from '../../assets/pharmacy_hero.png';

interface AuthPageProps {
  onLogin: (user: any) => void;
}

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  return `http://${hostname === 'localhost' ? '127.0.0.1' : hostname}:5001`;
};

const features = [
  { icon: Shield, text: 'Secure Data Encryption' },
  { icon: Activity, text: 'Real-time Stock Tracking' },
  { icon: Pill, text: 'Smart Prescription Queue' },
  { icon: CheckCircle2, text: 'Multi-branch Management' },
];

const inputClass = `w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-11 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-slate-400`;
const inputFocusStyle = { '--tw-ring-color': '#059669' } as React.CSSProperties;

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'otp_reset'>('login');
  const [role, setRole] = useState<'pharmacy' | 'distributor'>('pharmacy');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', shopName: '', phone: '', address: '', otp: '', newPassword: ''
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const toggleView = (newView: 'login' | 'register' | 'forgot' | 'otp_reset') => {
    setView(newView); setError(''); setSuccessMsg(''); setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      let endpoint = '';
      let payload: any;
      if (view === 'login') {
        endpoint = '/api/auth/login';
        payload = { email: formData.email, password: formData.password };
      } else if (view === 'register') {
        endpoint = '/api/auth/register';
        const data = new FormData();
        data.append('name', formData.name); data.append('email', formData.email);
        data.append('role', role); data.append('shopName', formData.shopName);
        data.append('phone', formData.phone); data.append('address', formData.address);
        if (file) data.append('idProof', file);
        payload = data;
      } else if (view === 'forgot') {
        endpoint = '/api/auth/forgot-password';
        payload = { email: formData.email };
      } else if (view === 'otp_reset') {
        endpoint = '/api/auth/reset-password';
        payload = { email: formData.email, otp: formData.otp, newPassword: formData.newPassword };
      }
      const response = await axios.post(`${getBaseUrl()}${endpoint}`, payload);
      if (view === 'forgot') { setSuccessMsg(response.data.message); setView('otp_reset'); }
      else if (view === 'otp_reset') { setSuccessMsg(response.data.message); setTimeout(() => setView('login'), 2000); }
      else if (response.data.pending) {
        setSuccessMsg(response.data.message);
        setFormData({ ...formData, name: '', password: '', shopName: '', phone: '', address: '' });
        setFile(null);
      } else { onLogin(response.data); }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please check your connection.');
    } finally { setLoading(false); }
  };

  const titleMap = { login: 'Sign In', register: 'Create Account', forgot: 'Reset Password', otp_reset: 'Verify OTP' };
  const subtitleMap = {
    login: 'Enter your details to access your dashboard.',
    register: 'Join PharmaSync to manage your pharmacy.',
    forgot: 'Enter your registered email to receive an OTP.',
    otp_reset: 'Enter the 6-digit code and your new password.',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#F0FDF4', fontFamily: 'Poppins, Inter, sans-serif' }}
    >
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 rounded-[24px] overflow-hidden shadow-2xl" style={{ border: '1px solid #E2E8F0' }}>

        {/* ── Left: Image + Branding ── */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden" style={{ backgroundColor: '#0F172A' }}>
          {/* Background image */}
          <img
            src={pharmacyHero}
            alt="Pharmacy"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.85) 100%)' }} />

          {/* Logo */}
          <div className="relative z-10 flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#059669' }}>
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              PHARMA<span style={{ color: '#059669' }}>SYNC</span>
            </span>
          </div>

          {/* Hero text */}
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white leading-snug mb-3">
              {view === 'forgot' || view === 'otp_reset' ? 'Account\nRecovery' : 'Smarter Pharmacy\nManagement.'}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-[260px]">
              {view === 'otp_reset'
                ? 'Check your inbox for the 6-digit code we sent you.'
                : view === 'forgot'
                ? 'Lost your credentials? Enter your email to receive a verification code.'
                : 'Effortless billing, inventory, and prescription tracking for modern stores.'}
            </p>
            <div className="space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(5,150,105,0.2)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Pharmacy tagline */}
          <div className="relative z-10">
            <p className="text-xs text-slate-500 font-medium">© 2025 PharmaSync · Smart Pharmacy, Stronger Care.</p>
          </div>
        </div>

        {/* ── Right: Auth Form ── */}
        <div className="bg-white p-8 lg:p-12 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center space-x-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#059669' }}>
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: '#0F172A' }}>
              PHARMA<span style={{ color: '#059669' }}>SYNC</span>
            </span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold" style={{ color: '#0F172A' }}>{titleMap[view]}</h2>
            <p className="text-sm mt-1.5 font-medium" style={{ color: '#64748B' }}>{subtitleMap[view]}</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 p-4 rounded-xl border-l-4 text-sm font-medium" style={{ backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444', color: '#DC2626' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 p-4 rounded-xl border-l-4 text-sm font-medium" style={{ backgroundColor: '#ECFDF5', borderLeftColor: '#059669', color: '#059669' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Toggle (register only) */}
            {view === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl mb-1" style={{ backgroundColor: '#F1F5F9' }}>
                  {(['pharmacy', 'distributor'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                      style={{
                        backgroundColor: role === r ? '#059669' : 'transparent',
                        color: role === r ? '#fff' : '#64748B',
                        boxShadow: role === r ? '0 2px 8px rgba(5,150,105,0.3)' : 'none',
                      }}
                    >
                      {r === 'pharmacy' ? '🏥 Pharmacy' : '🚚 Distributor'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input required type="text" placeholder="Full Name" className={inputClass} style={inputFocusStyle}
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </>
            )}

            {/* Email */}
            {view !== 'otp_reset' && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                <input required type="email" placeholder="Email Address" className={inputClass} style={inputFocusStyle}
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            )}

            {/* OTP Reset Fields */}
            {view === 'otp_reset' && (
              <>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input required type="text" maxLength={6} placeholder="6-Digit OTP"
                    className={`${inputClass} tracking-[0.5em] text-center font-bold`} style={inputFocusStyle}
                    value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value })} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input required type={showPassword ? 'text' : 'password'} placeholder="New Password"
                    className={inputClass} style={inputFocusStyle}
                    value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {/* Login Password */}
            {view === 'login' && (
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input required type={showPassword ? 'text' : 'password'} placeholder="Password"
                    className={inputClass} style={inputFocusStyle}
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => toggleView('forgot')}
                    className="text-xs font-semibold hover:underline" style={{ color: '#059669' }}>
                    Forgot Password?
                  </button>
                </div>
              </div>
            )}

            {/* Register Extra Fields */}
            {view === 'register' && (
              <>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                  <input required type="text" placeholder="Shop / Company Name" className={inputClass} style={inputFocusStyle}
                    value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" placeholder="Phone Number"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  <input required type="text" placeholder="City / Location"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400"
                    value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="p-4 rounded-xl border border-dashed" style={{ backgroundColor: '#F0FDF4', borderColor: '#059669' }}>
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#059669' }}>
                      Upload Pharmacy / Distributor Proof <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input type="file" required accept="image/*,.pdf"
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold cursor-pointer"
                    style={{ '--file-bg': '#059669' } as any}
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                  <p className="text-[9px] text-slate-400 mt-2 italic">Verification ID or license is mandatory for approval.</p>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 flex items-center justify-center space-x-2 mt-2"
              style={{ backgroundColor: '#059669', boxShadow: '0 4px 20px rgba(5,150,105,0.35)' }}
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </span>
              ) : (
                <>
                  <span>
                    {view === 'login' && 'Sign In'}
                    {view === 'register' && 'Submit Application'}
                    {view === 'forgot' && 'Send OTP'}
                    {view === 'otp_reset' && 'Reset Password'}
                  </span>
                  {view === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            {!view.includes('forgot') && view !== 'otp_reset' ? (
              <button onClick={() => toggleView(view === 'login' ? 'register' : 'login')}
                className="text-sm font-medium" style={{ color: '#64748B' }}>
                {view === 'login' ? (
                  <>New to PharmaSync? <span className="font-semibold ml-1" style={{ color: '#059669' }}>Create account</span></>
                ) : (
                  <>Already have an account? <span className="font-semibold ml-1" style={{ color: '#059669' }}>Sign In</span></>
                )}
              </button>
            ) : (
              <button onClick={() => toggleView('login')} className="text-sm font-medium" style={{ color: '#64748B' }}>
                Back to <span className="font-semibold ml-1" style={{ color: '#059669' }}>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
