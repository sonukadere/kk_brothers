import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

export const Forbidden = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  React.useEffect(() => {
    // If an administrator lands on forbidden, immediately return them to the Admin Dashboard
    if (isAdmin || user?.role === 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, user, navigate]);

  const handleReturn = () => {
    if (isAdmin || user?.role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
          <ShieldX className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-full border border-rose-200">
          HTTP 403 • Forbidden Access
        </span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-4">
          Access Restricted
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          You do not have administrative permissions to view or modify this resource. Normal
          workers are strictly restricted to their own duty slips and wage vouchers.
        </p>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <div>
            Current Role:{' '}
            <span className="font-semibold text-slate-800 capitalize">{user?.role || 'User'}</span>
          </div>
          <div>
            Identity: <span className="font-mono text-slate-700">{user?.email || user?.phone}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={handleReturn}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
