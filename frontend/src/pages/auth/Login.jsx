import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  ShieldCheck,
  User,
  Sparkles,
  Building2,
  CalendarCheck,
  Wallet,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Database,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Please enter your email or mobile number, and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(identifier.trim(), password);
    setIsLoading(false);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  };

  const handleQuickDemoLogin = async (role, type = 'email') => {
    setIsLoading(true);
    let id;
    let pass;

    if (role === 'admin') {
      id = type === 'mobile' ? '9876543210' : 'admin@kkbrothers.com';
      pass = 'Admin@123';
    } else {
      id = type === 'mobile' ? '9765432109' : 'staff@kkbrothers.com';
      pass = 'Staff@123';
    }

    setIdentifier(id);
    setPassword(pass);

    const result = await login(id, pass);
    setIsLoading(false);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  };

  const isPhone = identifier && !identifier.includes('@') && /^\+?[\d\s-]+$/.test(identifier);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-indigo-200 mb-3.5">
          <span className="font-extrabold text-2xl tracking-wider">KK</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          KK BROTHERS
        </h2>
        <p className="mt-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Staff Duty & Payment Management System
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Workforce & Logistics for Hotels, Banquets & Catering Companies
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl shadow-sm border border-slate-200">
          {/* Quick Demo Login Grid */}
          <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Quick Demo Credentials
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Database className="w-2.5 h-2.5" /> MongoDB Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Admin</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-[10px] text-slate-400">Full System Access</div>
                <div className="pt-1 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin', 'email')}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 py-1 px-1.5 rounded transition text-left truncate cursor-pointer"
                  >
                    Via Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin', 'mobile')}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1 px-1.5 rounded transition text-left truncate cursor-pointer"
                  >
                    Via Mobile: 9876543210
                  </button>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Staff Worker</span>
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[10px] text-slate-400">Personal Duties & Pay</div>
                <div className="pt-1 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('user', 'email')}
                    className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100/70 py-1 px-1.5 rounded transition text-left truncate cursor-pointer"
                  >
                    Via Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('user', 'mobile')}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1 px-1.5 rounded transition text-left truncate cursor-pointer"
                  >
                    Via Mobile: 9765432109
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address or Mobile Number"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 9765432109 or admin@kkbrothers.com"
              leftIcon={
                isPhone ? (
                  <Phone className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Mail className="w-4 h-4 text-slate-400" />
                )
              }
              helperText={
                isPhone
                  ? 'Mobile login detected (10-digit number)'
                  : 'Enter your registered email address or mobile phone'
              }
            />

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Account
              </Button>
            </div>
          </form>

          {/* Security policy notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Strict Access Control:</span> Public
              registration is disabled. Worker and administrative accounts are provisioned
              exclusively by system administrators.
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          KK Brothers Workforce Logistics • Session Protected with JWT
        </div>
      </div>
    </div>
  );
};

export default Login;
