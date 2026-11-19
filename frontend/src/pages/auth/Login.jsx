import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Select } from '../../components/common/Select';
import {
  ShieldCheck,
  User,
  ChefHat,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  KeyRound,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = ({ initialMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, registerStaff } = useAuth();

  // Determine active view mode: 'staff-login' | 'staff-register' | 'admin-login' | 'forgot-password'
  const determineInitialMode = () => {
    if (initialMode) return initialMode;
    if (location.pathname === '/admin/login' || location.search.includes('mode=admin')) {
      return 'admin-login';
    }
    if (location.search.includes('mode=register')) {
      return 'staff-register';
    }
    if (location.search.includes('mode=forgot')) {
      return 'forgot-password';
    }
    return 'staff-login';
  };

  const [loginMode, setLoginMode] = useState(determineInitialMode);
  const [previousMode, setPreviousMode] = useState('staff-login');

  // Sync mode if route or search param changes
  useEffect(() => {
    if (location.pathname === '/admin/login' || location.search.includes('mode=admin')) {
      setLoginMode('admin-login');
    } else if (location.search.includes('mode=register')) {
      setLoginMode('staff-register');
    }
  }, [location.pathname, location.search]);

  // Loading & Submission State
  const [isLoading, setIsLoading] = useState(false);

  // Staff & Admin Login Form State
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registrationBanner, setRegistrationBanner] = useState(null);

  // Staff Registration Form State
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    designation: 'Kitchen Helper',
    city: 'Indore',
    password: '',
    confirmPassword: '',
  });

  // Inline Validation & Touched States
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [mobileConflictError, setMobileConflictError] = useState(null);

  // =========================================================
  // Forgot Password State
  // =========================================================
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1 = Verify Account, 2 = Set New Password
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetError, setResetError] = useState(null);
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Refs for auto-focus
  const nameInputRef = useRef(null);
  const identifierInputRef = useRef(null);
  const loginPasswordRef = useRef(null);
  const resetInputRef = useRef(null);

  // Auto-focus when switching tabs/modes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loginMode === 'staff-register') {
        nameInputRef.current?.focus();
      } else if (loginMode === 'staff-login' || loginMode === 'admin-login') {
        if (!identifier) {
          identifierInputRef.current?.focus();
        } else {
          loginPasswordRef.current?.focus();
        }
      } else if (loginMode === 'forgot-password' && resetStep === 1) {
        resetInputRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [loginMode, resetStep]);

  // Real-time Field Validation Rules for Registration
  const validateField = (fieldName, value, allValues = registerData) => {
    switch (fieldName) {
      case 'name': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Full name is required';
        if (trimmed.length < 3) return 'Name must be at least 3 characters';
        if (!/^[a-zA-Z\s]+$/.test(trimmed)) return 'Name must contain only letters and spaces';
        return null;
      }
      case 'phone': {
        const digits = (value || '').replace(/\D/g, '');
        if (!digits) return 'Mobile number is required';
        if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
        if (!/^[6-9]/.test(digits)) return 'Mobile number must start with 6, 7, 8, or 9';
        return null;
      }
      case 'designation': {
        if (!value) return 'Please select a role';
        return null;
      }
      case 'city': {
        if (!value || !value.trim()) return 'City is required';
        return null;
      }
      case 'password': {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (!/\d/.test(value)) return 'Password must contain at least 1 number';
        if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least 1 letter';
        return null;
      }
      case 'confirmPassword': {
        if (!value) return 'Please confirm your password';
        if (value !== allValues.password) return 'Passwords do not match';
        return null;
      }
      default:
        return null;
    }
  };

  // Field change handler with live validation update
  const handleRegisterChange = (field, value) => {
    const updated = { ...registerData, [field]: value };
    setRegisterData(updated);

    if (field === 'phone') {
      setMobileConflictError(null);
    }

    if (touched[field]) {
      const err = validateField(field, value, updated);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }

    // Also update confirmPassword check if password changes
    if (field === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', updated.confirmPassword, updated);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  // Field blur handler
  const handleRegisterBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, registerData[field], registerData);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Phone input formatting (digits only, max 10)
  const handlePhoneInput = (e) => {
    const raw = e.target.value;
    const cleanDigits = raw.replace(/\D/g, '').slice(0, 10);
    handleRegisterChange('phone', cleanDigits);
  };

  // Switch to Staff Login tab with optional prefilled phone
  const switchToLogin = (prefilledPhone = '') => {
    setLoginMode('staff-login');
    setMobileConflictError(null);
    if (prefilledPhone) {
      setIdentifier(prefilledPhone);
    }
  };

  // Open Forgot Password screen
  const openForgotPassword = () => {
    setPreviousMode(loginMode === 'admin-login' ? 'admin-login' : 'staff-login');
    setResetIdentifier(identifier || '');
    setResetStep(1);
    setVerifiedAccount(null);
    setNewResetPassword('');
    setConfirmResetPassword('');
    setResetError(null);
    setLoginMode('forgot-password');
  };

  // =========================================================
  // Forgot Password: Step 1 Verify Identifier
  // =========================================================
  const handleVerifyResetIdentifier = async (e) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      toast.error('Please enter your registered mobile number, Staff ID, or email.');
      return;
    }

    setIsResetLoading(true);
    setResetError(null);

    try {
      const res = await authApi.verifyResetIdentifier(resetIdentifier.trim());
      if (res.success) {
        setVerifiedAccount(res.data);
        setResetStep(2);
        toast.success(res.message || 'Account verified successfully!');
      } else {
        setResetError(res.message || 'No account found matching these details.');
      }
    } catch (err) {
      setResetError(err.message || 'Account verification failed. Please check details.');
    } finally {
      setIsResetLoading(false);
    }
  };

  // =========================================================
  // Forgot Password: Step 2 Set New Password
  // =========================================================
  const handlePerformPasswordReset = async (e) => {
    e.preventDefault();

    if (!newResetPassword || newResetPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setIsResetLoading(true);

    try {
      const res = await authApi.resetPasswordWithIdentifier(
        resetIdentifier.trim(),
        newResetPassword
      );
      if (res.success) {
        toast.success('Password updated successfully! Please sign in.');
        setIdentifier(resetIdentifier.trim());
        setRegistrationBanner({
          phone: resetIdentifier.trim(),
          name: verifiedAccount?.name || 'Worker',
          isReset: true,
        });
        setLoginMode(previousMode || 'staff-login');
        setResetStep(1);
        setVerifiedAccount(null);
        setNewResetPassword('');
        setConfirmResetPassword('');
      } else {
        toast.error(res.message || 'Password reset failed.');
      }
    } catch (err) {
      toast.error(err.message || 'Password reset failed.');
    } finally {
      setIsResetLoading(false);
    }
  };

  // Handle Staff Registration Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      name: true,
      phone: true,
      designation: true,
      city: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    const newErrors = {};
    Object.keys(allTouched).forEach((field) => {
      const err = validateField(field, registerData[field], registerData);
      if (err) newErrors[field] = err;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please resolve the highlighted form errors.');
      return;
    }

    const cleanPhone = registerData.phone.replace(/\D/g, '');

    setIsLoading(true);
    setMobileConflictError(null);

    const result = await registerStaff(
      {
        name: registerData.name.trim(),
        phone: cleanPhone,
        designation: registerData.designation,
        city: registerData.city.trim() || 'Indore',
        password: registerData.password,
      },
      false
    );

    setIsLoading(false);

    if (result.success) {
      toast.success('Registration successful! Please sign in with your password.');
      setRegistrationBanner({
        phone: cleanPhone,
        name: registerData.name.trim(),
      });
      switchToLogin(cleanPhone);
      setRegisterData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } else {
      const msg = result.message || 'Registration failed.';
      if (
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('mobile') ||
        msg.toLowerCase().includes('phone')
      ) {
        setMobileConflictError(msg);
        setErrors((prev) => ({
          ...prev,
          phone: msg,
        }));
      } else {
        toast.error(msg);
      }
    }
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !loginPassword) {
      toast.error(
        loginMode === 'admin-login'
          ? 'Please enter your Admin Email or Mobile, and password.'
          : 'Please enter your Mobile Number or Staff ID, and password.'
      );
      return;
    }

    setIsLoading(true);
    const result = await login(identifier.trim(), loginPassword);
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
  const isForgotPassword = loginMode === 'forgot-password';

  const isNameValid = touched.name && !errors.name && registerData.name.trim().length >= 3;
  const isPhoneValid = touched.phone && !errors.phone && registerData.phone.length === 10;
  const isCityValid = touched.city && !errors.city && registerData.city.trim().length > 0;
  const isConfirmMatch =
    registerData.confirmPassword.length > 0 &&
    registerData.confirmPassword === registerData.password;

  const isResetPasswordMatch =
    confirmResetPassword.length > 0 && confirmResetPassword === newResetPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-emerald-50/30 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Background ambient decorative shapes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-indigo-200/20 via-emerald-200/10 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[480px] z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-4 ring-white mb-3 transition-transform hover:scale-105 duration-200">
            <span className="font-extrabold text-2xl tracking-wider select-none">KK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            KK BROTHERS
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-700 uppercase tracking-wide">
            Staff Duty & Payment Management System
          </p>
          <p className="text-xs text-slate-600 mt-0.5 max-w-sm mx-auto leading-relaxed">
            Workforce & Logistics for Hotels, Banquets & Catering
          </p>
        </div>

        {/* Card Component */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 transition-all relative">
          {/* Top Tabs (Only on normal Staff Login vs Register Staff mode) */}
          {!isAdminLogin && !isForgotPassword && (
            <div
              role="tablist"
              aria-label="Staff Authentication Mode"
              className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl mb-6 text-xs font-bold border border-slate-200/60 select-none"
            >
              {/* Tab 1: Staff Login */}
              <button
                type="button"
                role="tab"
                id="tab-staff-login"
                aria-selected={isStaffLogin}
                aria-controls="panel-staff-login"
                tabIndex={isStaffLogin ? 0 : -1}
                onClick={() => setLoginMode('staff-login')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-150 cursor-pointer ${
                  isStaffLogin
                    ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold hover:bg-white/50'
                }`}
              >
                <ChefHat className={`w-4 h-4 ${isStaffLogin ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Staff Login</span>
              </button>

              {/* Tab 2: Register Staff */}
              <button
                type="button"
                role="tab"
                id="tab-staff-register"
                aria-selected={isStaffRegister}
                aria-controls="panel-staff-register"
                tabIndex={isStaffRegister ? 0 : -1}
                onClick={() => setLoginMode('staff-register')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-150 cursor-pointer ${
                  isStaffRegister
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-emerald-700 font-semibold hover:bg-white/50'
                }`}
              >
                <UserPlus className={`w-4 h-4 ${isStaffRegister ? 'text-white' : 'text-emerald-600'}`} />
                <span>Register Staff</span>
              </button>
            </div>
          )}

          {/* Admin Mode Header */}
          {isAdminLogin && !isForgotPassword && (
            <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Administrator Portal</h2>
                  <p className="text-xs text-slate-600">Full system access & management</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginMode('staff-login')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Staff Login</span>
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW: FORGOT PASSWORD                                     */}
          {/* ========================================================= */}
          {isForgotPassword && (
            <div className="animate-in fade-in duration-200">
              {/* Back to sign in header */}
              <div className="mb-5 pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setLoginMode(previousMode || 'staff-login')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Forgot Password</h2>
                    <p className="text-xs text-slate-600">
                      {resetStep === 1
                        ? 'Verify your account details to reset your password'
                        : 'Set a new password for your account'}
                    </p>
                  </div>
                </div>
              </div>

              {/* STEP 1: Verify Identifier */}
              {resetStep === 1 && (
                <form onSubmit={handleVerifyResetIdentifier} className="space-y-4">
                  <Input
                    ref={resetInputRef}
                    id="reset-identifier"
                    label="Mobile Number or Staff ID"
                    required
                    placeholder="e.g. 9876543210 or STF-0001"
                    value={resetIdentifier}
                    onChange={(e) => {
                      setResetIdentifier(e.target.value);
                      setResetError(null);
                    }}
                    leftIcon={<Phone className="w-4 h-4 text-emerald-600" />}
                    helperText="Enter your 10-digit registered mobile number, Staff ID, or Admin email."
                    error={resetError}
                    focusColor="emerald"
                  />

                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="w-full h-12 text-sm font-bold shadow-md rounded-xl"
                    isLoading={isResetLoading}
                    disabled={isResetLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isResetLoading ? 'Verifying Account...' : 'Verify Account & Continue'}
                  </Button>

                  {/* Admin Helpline Notice */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Need Instant Help?</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      You can also call or WhatsApp management for immediate password reset:{' '}
                      <a
                        href="tel:6264791823"
                        className="font-bold text-slate-800 hover:text-indigo-600 underline"
                      >
                        +91 6264791823 (Sonu Kadere)
                      </a>
                    </p>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter New Password */}
              {resetStep === 2 && verifiedAccount && (
                <form onSubmit={handlePerformPasswordReset} className="space-y-4">
                  {/* Verified Worker Confirmation Banner */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">{verifiedAccount.name}</span>
                        <span className="text-emerald-700 ml-1.5">
                          ({verifiedAccount.designation})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="text-[11px] font-bold text-emerald-800 underline hover:no-underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* New Password */}
                  <PasswordInput
                    id="new-reset-password"
                    label="New Password"
                    required
                    placeholder="Create a new password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    showStrengthMeter={true}
                    showHints={true}
                    autoComplete="new-password"
                    focusColor="emerald"
                  />

                  {/* Confirm New Password */}
                  <div>
                    <PasswordInput
                      id="confirm-reset-password"
                      label="Confirm New Password"
                      required
                      placeholder="Re-enter your new password"
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      autoComplete="new-password"
                      success={isResetPasswordMatch}
                      focusColor="emerald"
                    />
                    {isResetPasswordMatch && confirmResetPassword.length >= 6 && (
                      <p className="mt-1.5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Passwords match</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="w-full h-12 text-sm font-bold shadow-md rounded-xl"
                    isLoading={isResetLoading}
                    disabled={isResetLoading}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    {isResetLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: REGISTER STAFF FORM                                */}
          {/* ========================================================= */}
          {isStaffRegister && !isForgotPassword && (
            <div
              id="panel-staff-register"
              role="tabpanel"
              aria-labelledby="tab-staff-register"
              className="animate-in fade-in duration-200"
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>New Staff Registration</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Indore Base
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Fill in your details to get an instant Staff ID and access duty shifts.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
                {/* 1. Full Name */}
                <Input
                  ref={nameInputRef}
                  id="register-name"
                  label="Full Name"
                  required
                  placeholder="Enter your full name"
                  value={registerData.name}
                  onChange={(e) => handleRegisterChange('name', e.target.value)}
                  onBlur={() => handleRegisterBlur('name')}
                  error={touched.name ? errors.name : undefined}
                  success={isNameValid}
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  autoComplete="name"
                  focusColor="emerald"
                />

                {/* 2. Mobile Number with +91 Prefix Chip */}
                <div>
                  <Input
                    id="register-phone"
                    label="Mobile Number"
                    type="tel"
                    inputMode="numeric"
                    required
                    prefix="+91"
                    placeholder="9876543210"
                    value={registerData.phone}
                    onChange={handlePhoneInput}
                    onBlur={() => handleRegisterBlur('phone')}
                    error={touched.phone ? errors.phone : undefined}
                    success={isPhoneValid}
                    helperText={
                      !errors.phone ? 'This will be your login ID for all future shifts.' : undefined
                    }
                    autoComplete="tel"
                    focusColor="emerald"
                  />

                  {/* Inline Conflict Action if Mobile Already Exists */}
                  {mobileConflictError && (
                    <div className="mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Account already exists with this mobile.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchToLogin(registerData.phone)}
                        className="font-bold text-emerald-700 hover:text-emerald-800 underline hover:no-underline whitespace-nowrap cursor-pointer shrink-0"
                      >
                        Login instead &rarr;
                      </button>
                    </div>
                  )}
                </div>

                {/* 3 & 4. Role / Designation and City Side-by-Side (Stacked on Mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Select
                    id="register-designation"
                    label="Role / Designation"
                    required
                    value={registerData.designation}
                    onChange={(e) => handleRegisterChange('designation', e.target.value)}
                    onBlur={() => handleRegisterBlur('designation')}
                    error={touched.designation ? errors.designation : undefined}
                    success={touched.designation && !errors.designation}
                    leftIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
                    options={[
                      'Kitchen Helper',
                      'Chef',
                      'Waiter',
                      'Captain',
                      'Driver',
                      'Cleaner',
                      'Other',
                    ]}
                    focusColor="emerald"
                  />

                  <Input
                    id="register-city"
                    label="City / Base"
                    required
                    placeholder="Indore"
                    value={registerData.city}
                    onChange={(e) => handleRegisterChange('city', e.target.value)}
                    onBlur={() => handleRegisterBlur('city')}
                    error={touched.city ? errors.city : undefined}
                    success={isCityValid}
                    leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                    focusColor="emerald"
                  />
                </div>

                {/* 5. Password with Live Strength Meter & Hints */}
                <PasswordInput
                  id="register-password"
                  label="Password"
                  required
                  placeholder="Create a password"
                  value={registerData.password}
                  onChange={(e) => handleRegisterChange('password', e.target.value)}
                  onBlur={() => handleRegisterBlur('password')}
                  error={touched.password ? errors.password : undefined}
                  showStrengthMeter={true}
                  showHints={true}
                  autoComplete="new-password"
                  focusColor="emerald"
                />

                {/* 6. Confirm Password with Real-Time Match Indicator */}
                <div>
                  <PasswordInput
                    id="register-confirm-password"
                    label="Confirm Password"
                    required
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    onBlur={() => handleRegisterBlur('confirmPassword')}
                    error={touched.confirmPassword ? errors.confirmPassword : undefined}
                    success={isConfirmMatch}
                    autoComplete="new-password"
                    focusColor="emerald"
                  />
                  {isConfirmMatch && registerData.confirmPassword.length >= 6 && (
                    <p className="mt-1.5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </p>
                  )}
                </div>

                {/* Value Guarantee Note */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant Staff ID & Shift Allocation</span>
                  </div>
                  <p className="text-slate-600 pl-5 leading-relaxed">
                    Once registered, your staff profile is activated immediately for duties and wage vouchers.
                  </p>
                </div>

                {/* Sticky Mobile Submit Button Container */}
                <div className="pt-2 sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1 sm:static sm:bg-transparent sm:pb-0 z-10 border-t border-slate-100 sm:border-0 -mx-6 px-6 sm:mx-0 sm:px-0">
                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="w-full h-12 text-sm font-bold shadow-md shadow-emerald-600/20 rounded-xl"
                    isLoading={isLoading}
                    disabled={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isLoading ? 'Creating Staff Account...' : 'Complete Staff Registration'}
                  </Button>
                </div>
              </form>

              {/* Footer Switcher */}
              <div className="text-center pt-4 border-t border-slate-100 mt-5">
                <p className="text-xs text-slate-700">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => switchToLogin()}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: STAFF LOGIN & ADMIN LOGIN FORM                    */}
          {/* ========================================================= */}
          {!isStaffRegister && !isForgotPassword && (
            <div
              id="panel-staff-login"
              role="tabpanel"
              aria-labelledby={isAdminLogin ? undefined : 'tab-staff-login'}
              className="animate-in fade-in duration-200"
            >
              {/* Registration / Reset Success Banner on Login Screen */}
              {registrationBanner && (
                <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      {registrationBanner.isReset ? 'Password Reset Successful!' : 'Registration Successful!'}
                    </span>
                    <p className="text-emerald-700 mt-0.5">
                      Welcome, {registrationBanner.name}! Your account{' '}
                      <span className="font-mono font-bold">{registrationBanner.phone}</span> is prefilled.
                      Enter your password to sign in.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Identifier Input */}
                <Input
                  ref={identifierInputRef}
                  id="login-identifier"
                  label={isAdminLogin ? 'Admin Email or Mobile' : 'Staff Mobile or Staff ID'}
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    isAdminLogin ? 'admin@kkbrothers.com or 6264791823' : '9876543210 or STF-0001'
                  }
                  leftIcon={
                    isAdminLogin ? (
                      <Mail className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Phone className="w-4 h-4 text-emerald-600" />
                    )
                  }
                  helperText={
                    isAdminLogin
                      ? 'Enter your registered administrator email or phone.'
                      : 'Enter your 10-digit registered mobile or Staff ID.'
                  }
                  autoComplete="username"
                  focusColor={isAdminLogin ? 'indigo' : 'emerald'}
                />

                {/* Password Input with "Forgot Password?" Action Link */}
                <PasswordInput
                  ref={loginPasswordRef}
                  id="login-password"
                  label={isAdminLogin ? 'Admin Password' : 'Password / PIN'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  focusColor={isAdminLogin ? 'indigo' : 'emerald'}
                  rightLabelAction={
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  }
                />

                {/* Submit Login Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant={isAdminLogin ? 'primary' : 'success'}
                    size="lg"
                    className="w-full h-12 text-sm font-bold shadow-md rounded-xl"
                    isLoading={isLoading}
                    disabled={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isAdminLogin ? 'Sign In as Administrator' : 'Sign In as Staff Worker'}
                  </Button>
                </div>
              </form>

              {/* Link to Register from Staff Login */}
              {!isAdminLogin && (
                <div className="text-center pt-4 border-t border-slate-100 mt-5">
                  <p className="text-xs text-slate-700">
                    New staff worker?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginMode('staff-register')}
                      className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <span>Register Staff</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Small Muted Admin Login Link Below Card (Strictly Required) */}
        {!isAdminLogin && !isForgotPassword && (
          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => {
                setLoginMode('admin-login');
                setIdentifier('');
                setLoginPassword('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Are you an administrator?</span>
              <span className="font-semibold text-slate-600 hover:underline">Admin login &rarr;</span>
            </button>
          </div>
        )}

        {isAdminLogin && !isForgotPassword && (
          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => {
                setLoginMode('staff-login');
                setIdentifier('');
                setLoginPassword('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>← Return to Staff Portal</span>
            </button>
          </div>
        )}

        {/* Security & System Info Footer */}
        <div className="text-center mt-4 text-[11px] text-slate-500">
          KK Brothers Workforce Logistics • Session Protected with JWT
        </div>
      </div>
    </div>
  );
};

export default Login;
