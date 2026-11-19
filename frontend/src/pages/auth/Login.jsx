import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import {
  ShieldCheck,
  User,
  ChefHat,
  Sparkles,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Database,
  ShieldAlert,
  IdCard,
  UserPlus,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  // Modes: 'staff-login' | 'staff-register' | 'admin-login'
  const [loginMode, setLoginMode] = useState('staff-login');
  
  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Staff registration form state
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    designation: 'Kitchen Helper',
    city: 'Indore',
    password: '',
    confirmPassword: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const { login, registerStaff } = useAuth();
  const navigate = useNavigate();

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error(
        loginMode === 'staff-login'
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

  // Handle Staff Registration submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, designation, city, password: regPassword, confirmPassword } = registerData;

    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/[^\d]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    const result = await registerStaff({
      name: name.trim(),
      phone: cleanPhone,
      designation: designation || 'Kitchen Helper',
      city: city ? city.trim() : 'Indore',
      password: regPassword,
    });
    setIsLoading(false);

    if (result.success) {
      navigate('/user/dashboard');
    }
  };

  // Quick Demo Login
  const handleQuickDemoLogin = async (role, type = 'mobile') => {
    setIsLoading(true);
    let id;
    let pass;

    if (role === 'admin') {
      id = type === 'mobile' ? '6264791823' : 'admin@kkbrothers.com';
      pass = 'Admin@123';
      setLoginMode('admin-login');
    } else {
      id = type === 'staffId' ? 'STF-0001' : '9329148985';
      pass = 'Staff@123';
      setLoginMode('staff-login');
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

  const isStaffLogin = loginMode === 'staff-login';
  const isStaffRegister = loginMode === 'staff-register';
  const isAdminLogin = loginMode === 'admin-login';

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
          {/* NAVIGATION TABS: STAFF SIGN IN vs REGISTER STAFF vs ADMIN */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl mb-5 text-[11px] font-bold">
            {/* 1. Staff Sign In */}
            <button
              type="button"
              onClick={() => {
                setLoginMode('staff-login');
                setIdentifier('');
                setPassword('');
              }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                isStaffLogin
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChefHat className={`w-3.5 h-3.5 ${isStaffLogin ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Staff Login</span>
            </button>

            {/* 2. Register as Staff */}
            <button
              type="button"
              onClick={() => setLoginMode('staff-register')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer relative ${
                isStaffRegister
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-white/60'
              }`}
            >
              <UserPlus className={`w-3.5 h-3.5 ${isStaffRegister ? 'text-white' : 'text-emerald-600'}`} />
              <span className="font-semibold">Register Staff</span>
            </button>

            {/* 3. Admin Login */}
            <button
              type="button"
              onClick={() => {
                setLoginMode('admin-login');
                setIdentifier('');
                setPassword('');
              }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all cursor-pointer ${
                isAdminLogin
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAdminLogin ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Admin</span>
            </button>
          </div>

          {/* MODE 1 & 3: SIGN IN FORM (STAFF OR ADMIN) */}
          {!isStaffRegister && (
            <>
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
                      isStaffLogin
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
                      isAdminLogin
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
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {isStaffLogin ? (
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
                      label={isStaffLogin ? 'Password / PIN' : 'Password'}
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                      helperText={isStaffLogin ? 'Default initial password is Staff@123' : undefined}
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
                    variant={isStaffLogin ? 'success' : 'primary'}
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isStaffLogin ? 'Sign In as Staff Worker' : 'Sign In as Administrator'}
                  </Button>
                </div>
              </form>

              {/* Link to Staff Registration */}
              <div className="text-center pt-4 border-t border-slate-100 mt-5">
                <p className="text-xs text-slate-600">
                  New staff worker?{' '}
                  <button
                    type="button"
                    onClick={() => setLoginMode('staff-register')}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Register as Staff Worker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </p>
              </div>
            </>
          )}

          {/* MODE 2: REGISTER AS STAFF FORM */}
          {isStaffRegister && (
            <div>
              <div className="mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Staff Worker Registration</h3>
                    <p className="text-[11px] text-slate-500">Join KK Brothers workforce team (Indore)</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* 1. Full Name */}
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Sonu Kadere"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                />

                {/* 2. Mobile Number */}
                <Input
                  label="10-Digit Mobile Number"
                  type="tel"
                  required
                  placeholder="e.g. 6264791823"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  helperText="This mobile number will be your login ID"
                />

                {/* 3. Designation / Role (Only Kitchen Helper & Chef) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Role / Designation"
                    required
                    value={registerData.designation}
                    onChange={(e) => setRegisterData({ ...registerData, designation: e.target.value })}
                    options={[
                      { value: 'Kitchen Helper', label: 'Kitchen Helper (₹600/day)' },
                      { value: 'Chef', label: 'Chef (₹800/day)' },
                    ]}
                  />

                  <Input
                    label="City / Base Location"
                    placeholder="Indore"
                    value={registerData.city}
                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                    leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                  />
                </div>

                {/* 4. Password */}
                <div>
                  <Input
                    label="Create Password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters (e.g. Staff@123)"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                </div>

                {/* 5. Confirm Password */}
                <div>
                  <Input
                    label="Confirm Password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  />
                </div>

                {/* Registration Benefits Highlight */}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant Staff ID & Direct Duty Access</span>
                  </div>
                  <p className="text-emerald-700 pl-5">
                    Your official Staff ID (e.g. STF-XXXX) is generated instantly so you can track shifts and payments right away.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                    rightIcon={<UserPlus className="w-4 h-4" />}
                  >
                    Complete Staff Registration
                  </Button>
                </div>
              </form>

              {/* Back to Sign In Link */}
              <div className="text-center pt-4 border-t border-slate-100 mt-4">
                <p className="text-xs text-slate-600">
                  Already registered as staff?{' '}
                  <button
                    type="button"
                    onClick={() => setLoginMode('staff-login')}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Sign in with Mobile Number</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Security policy notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                {isStaffRegister
                  ? 'Staff Registration Policy:'
                  : isStaffLogin
                  ? 'Staff Worker Access:'
                  : 'Administrator Access:'}
              </span>{' '}
              {isStaffRegister
                ? 'Only Kitchen Helper and Chef roles are open for registration in Indore. Contact admin for supervisor roles.'
                : isStaffLogin
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
