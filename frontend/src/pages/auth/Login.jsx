import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  ShieldCheck,
  User,
  ChefHat,
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
  IdCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [loginMode, setLoginMode] = useState('staff'); // 'staff' | 'admin'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error(
        loginMode === 'staff'
          ? 'Please enter your Mobile Number or Staff ID, and password.'
          : 'Please enter your Admin Email or Mobile, and password.'
      );
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

  const handleQuickDemoLogin = async (role, type = 'mobile') => {
    setIsLoading(true);
    let id;
    let pass;

    if (role === 'admin') {
      id = type === 'mobile' ? '6264791823' : 'admin@kkbrothers.com';
      pass = 'Admin@123';
      setLoginMode('admin');
    } else {
      id = type === 'staffId' ? 'STF-0001' : '9329148985';
      pass = 'Staff@123';
      setLoginMode('staff');
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

  const isStaffMode = loginMode === 'staff';
  const isPhone = identifier && !identifier.includes('@') && /^\+?[\d\s-]+$/.test(identifier);
  const isStaffId = identifier && /^stf/i.test(identifier.trim());

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
        <div className="bg-white py-7 px-6 sm:px-8 rounded-2xl shadow-sm border border-slate-200">
          {/* LOGIN ROLE TABS: STAFF vs ADMIN */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setLoginMode('staff');
                setIdentifier('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isStaffMode
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChefHat className={`w-4 h-4 ${isStaffMode ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Sign In as Staff</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setIdentifier('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isStaffMode
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${!isStaffMode ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Sign In as Admin</span>
            </button>
          </div>

          {/* Quick Demo Login Grid */}
          <div className="mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Quick Login Shortcuts
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Database className="w-2.5 h-2.5" /> Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Staff Worker Shortcut */}
              <div
                onClick={() => handleQuickDemoLogin('user', 'mobile')}
                className={`p-2.5 rounded-lg border shadow-2xs space-y-1 cursor-pointer transition ${
                  isStaffMode
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Staff Worker</span>
                  <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[10px] text-slate-500">Kishan (9329148985)</div>
                <div className="text-[10px] text-emerald-700 font-medium">Click to fill & login &rarr;</div>
              </div>

              {/* Admin Shortcut */}
              <div
                onClick={() => handleQuickDemoLogin('admin', 'mobile')}
                className={`p-2.5 rounded-lg border shadow-2xs space-y-1 cursor-pointer transition ${
                  !isStaffMode
                    ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Admin</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-[10px] text-slate-500">Full System Control</div>
                <div className="text-[10px] text-indigo-700 font-medium">Click to fill & login &rarr;</div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isStaffMode ? (
              <Input
                label="Staff Mobile Number or Staff ID"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9329148985 or STF-0001"
                leftIcon={
                  isStaffId ? (
                    <IdCard className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Phone className="w-4 h-4 text-emerald-600" />
                  )
                }
                helperText="Enter your 10-digit registered mobile number or your Staff ID"
              />
            ) : (
              <Input
                label="Admin Email or Mobile"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin@kkbrothers.com or 6264791823"
                leftIcon={
                  isPhone ? (
                    <Phone className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-indigo-600" />
                  )
                }
                helperText="Enter your administrator email or mobile phone"
              />
            )}

            <div>
              <div className="relative">
                <Input
                  label={isStaffMode ? 'Password / PIN' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  helperText={isStaffMode ? 'Default initial password is Staff@123' : undefined}
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
                variant={isStaffMode ? 'success' : 'primary'}
                size="lg"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isStaffMode ? 'Sign In as Staff Worker' : 'Sign In as Administrator'}
              </Button>
            </div>
          </form>

          {/* Security policy notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                {isStaffMode ? 'Staff Worker Access:' : 'Administrator Access:'}
              </span>{' '}
              {isStaffMode
                ? 'Workers can view their personal duty records, daily shifts, and payment voucher history.'
                : 'Access to workforce rosters, hotel/catering billing, client collections, and business reports.'}
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
