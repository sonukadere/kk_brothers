import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overviewApi } from '../../api/overviewApi';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { StatusBadge, Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  CalendarCheck,
  Clock,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Building2,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const UserDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await overviewApi.getUserOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load your personal records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your duty & wage dashboard..." />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentDuties = data?.recentDuties || [];
  const staffProfile = data?.staffProfile || {};
  const userName = user?.name || staffProfile?.name || 'Worker';

  // Check today's duty
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysDuty = recentDuties.find((d) => {
    const dDate = new Date(d.dutyDate).toISOString().slice(0, 10);
    return dDate === todayStr && d.status !== 'Cancelled';
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* 1. WELCOME & TODAY'S DUTY BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-medium text-indigo-200 mb-2">
              <Sparkles className="w-3 h-3 text-amber-300" /> Staff Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Namaste, {userName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {staffProfile.staffCode ? `ID: ${staffProfile.staffCode} • ` : ''}
              {staffProfile.designation || 'Staff Member'}
            </p>
          </div>

          <button
            onClick={loadData}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Today's Duty Status Pill */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  todaysDuty ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  todaysDuty ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              ></span>
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-200">
              {todaysDuty ? (
                <>
                  <span className="text-emerald-300 font-semibold">Today's Duty:</span>{' '}
                  {todaysDuty.client?.companyName} ({todaysDuty.inTime} - {todaysDuty.outTime})
                </>
              ) : (
                'No duty shift scheduled for today'
              )}
            </span>
          </div>

          {todaysDuty && (
            <Badge variant="success" size="sm">
              {todaysDuty.status}
            </Badge>
          )}
        </div>
      </div>

      {/* 2. PROMINENT BIG BUTTON: "+ ADD NEW DUTY" */}
      <div>
        <button
          onClick={() => navigate('/user/add-duty')}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          + Add New Duty
        </button>
      </div>

      {/* 3. FOUR SIMPLE, HIGH-CONTRAST SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Duties */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Duties</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {stats.totalDuties ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{stats.totalHours ?? 0} hours worked</div>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-purple-700">
              ₹{(stats.totalEarned ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Approved duty wages</div>
          </div>
        </div>

        {/* Total Paid Amount */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Amount Received</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700">
              ₹{(stats.totalReceived ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Settled to Bank / UPI</div>
          </div>
        </div>

        {/* Pending Payment Amount */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Amount</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">
              ₹{(stats.pendingPaymentAmount ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting payout</div>
          </div>
        </div>
      </div>

      {/* 4. RECENT DUTY HISTORY (CLEAN MOBILE CARDS) */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Recent Duty History</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Your latest recorded shifts</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => navigate('/user/my-duties')}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentDuties.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No duties recorded yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tap the "+ Add New Duty" button above to submit your first work shift!
              </p>
              <div className="mt-4">
                <Button size="sm" variant="primary" onClick={() => navigate('/user/add-duty')}>
                  + Add Duty Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDuties.map((duty) => (
                <div
                  key={duty._id}
                  onClick={() => navigate('/user/my-duties')}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3 active:bg-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {duty.client?.companyName || 'Hotel / Catering'}
                      </h4>
                      <Badge variant={duty.client?.type === 'Hotel' ? 'indigo' : 'purple'} size="sm">
                        {duty.client?.type || 'Venue'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {duty.inTime} - {duty.outTime} ({duty.hoursWorked} hrs)
                        {duty.isOvernight && <span className="text-purple-600 font-bold">🌙</span>}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDate(duty.dutyDate)}
                      </span>
                    </div>

                    {duty.location && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{duty.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">
                      ₹{(duty.staffWage || 0).toLocaleString()}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={duty.status} />
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 hidden sm:block" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
