import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200">
          HTTP 401 • Unauthorized
        </span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-4">
          Authentication Required
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Your session has expired or you are not signed in. Please sign in with your verified
          credentials to access this section.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            leftIcon={<LogIn className="w-4 h-4" />}
            onClick={() => navigate('/login')}
          >
            Sign In to Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
