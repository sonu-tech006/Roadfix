import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Lock, Mail, User, Phone, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, switchDemoRole } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    if (tab === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials');
      } else {
        onClose();
      }
    } else {
      const res = await register({ name, email, mobile, password });
      if (!res.success) {
        setError(res.error || 'Registration failed');
      } else {
        onClose();
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
              tab === 'login' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Citizen Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
              tab === 'signup' ? 'border-teal-600 text-teal-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Citizen Account
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya.citizen@roadfix.org"
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors mt-2"
          >
            {loading ? 'Authenticating...' : tab === 'login' ? 'Sign In to RoadFix' : 'Register Citizen Account'}
          </button>
        </form>

        {/* Demo Personas Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 mb-2 font-medium">
            Demo quick access (no password needed):
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={() => { switchDemoRole('citizen'); onClose(); }}
              className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-500 rounded font-medium text-slate-700"
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => { switchDemoRole('local_admin'); onClose(); }}
              className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-500 rounded font-medium text-slate-700"
            >
              Ward Admin
            </button>
            <button
              type="button"
              onClick={() => { switchDemoRole('district_admin'); onClose(); }}
              className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-500 rounded font-medium text-slate-700"
            >
              District Admin
            </button>
            <button
              type="button"
              onClick={() => { switchDemoRole('state_admin'); onClose(); }}
              className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-teal-500 rounded font-medium text-slate-700"
            >
              State Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
