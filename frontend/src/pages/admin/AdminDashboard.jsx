import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { overviewApi } from '../../api/overviewApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table from '../../components/common/Table';
import { StatusBadge, Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  Building2,
  UtensilsCrossed,
  Clock,
  Wallet,
  Receipt,
  UserPlus,
  Building,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Filter,
  DollarSign,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  const navigate = useNavigate();

  const loadData = async (filters = {}) => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.staff) params.staff = filters.staff;
      if (filters.client) params.client = filters.client;

      const res = await overviewApi.getAdminOverview(params);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to fetch dashboard metrics from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData({ date: filterDate, staff: selectedStaff, client: selectedClient });
  }, []);

  const handleApplyFilters = () => {
    loadData({ date: filterDate, staff: selectedStaff, client: selectedClient });
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setSelectedStaff('');
    setSelectedClient('');
    loadData({});
  };

  if (isLoading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Loading KK Brothers business metrics..." />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentDuties = data?.recentDuties || [];
  const pendingStaff = data?.pendingStaffPayments || [];
  const pendingClients = data?.pendingClientPayments || [];
  const allStaff = data?.allStaffList || [];
  const allClients = data?.allClientsList || [];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Operations Dashboard</h1>
          <p className="text-xs text-slate-500">Live workforce logistics, shift operations, and payment ledgers</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => loadData({ date: filterDate, staff: selectedStaff, client: selectedClient })}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="w-3.5 h-3.5" />}
            onClick={() => setIsFiltering(!isFiltering)}
          >
            {isFiltering ? 'Hide Filters' : 'Filter View'}
          </Button>
        </div>
      </div>

      {/* QUICK ACTIONS BAR (6 PRIMARY BUTTONS) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Add Staff */}
          <button
            onClick={() => navigate('/staff')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 mt-2">
              Add Staff
            </span>
          </button>

          {/* 2. Add Hotel */}
          <button
            onClick={() => navigate('/clients')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 mt-2">
              Add Hotel
            </span>
          </button>

          {/* 3. Add Catering */}
          <button
            onClick={() => navigate('/clients')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 mt-2">
              Add Catering
            </span>
          </button>

          {/* 4. Add Duty */}
          <button
            onClick={() => navigate('/duties')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700 mt-2">
              Add Duty
            </span>
          </button>

          {/* 5. Record Staff Payment */}
          <button
            onClick={() => navigate('/staff-payments')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 mt-2">
              Pay Staff
            </span>
          </button>

          {/* 6. Receive Client Payment */}
          <button
            onClick={() => navigate('/client-payments')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700 mt-2">
              Receive Payment
            </span>
          </button>
        </div>
      </div>

      {/* DYNAMIC FILTERS BAR */}
      {isFiltering && (
        <Card className="p-4 bg-slate-50/80 border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Date Filter"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            <Select
              label="Staff Member"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              options={[
                { value: '', label: 'All Staff Workers' },
                ...allStaff.map((s) => ({ value: s._id, label: `${s.name} (${s.staffCode})` })),
              ]}
            />

            <Select
              label="Hotel / Catering Partner"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              options={[
                { value: '', label: 'All Client Businesses' },
                ...allClients.map((c) => ({ value: c._id, label: `${c.companyName} (${c.type})` })),
              ]}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleResetFilters}>
              Reset Filters
            </Button>
            <Button size="sm" variant="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </Card>
      )}

      {/* 6 MAIN METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Staff */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{stats.totalStaff ?? 0}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {stats.activeStaff ?? 0} active workers
            </div>
          </div>
        </div>

        {/* 2. Total Hotels */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Hotels</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{stats.totalHotels ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Partner hotels</div>
          </div>
        </div>

        {/* 3. Total Catering */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Catering</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{stats.totalCatering ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Catering clients</div>
          </div>
        </div>

        {/* 4. Today's Duties */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Duties</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-sky-700">{stats.todaysDuties ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Shifts for today</div>
          </div>
        </div>

        {/* 5. Staff Payment Pending */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Staff Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-amber-600">
              ₹{(stats.staffPaymentsPending ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Owed to workers</div>
          </div>
        </div>

        {/* 6. Client Payment Pending */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Client Pending</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-rose-600">
              ₹{(stats.clientPaymentsPending ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Receivables due</div>
          </div>
        </div>
      </div>

      {/* RECENT DUTY RECORDS & FINANCIAL AUDIT LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left Column (2/3): Recent Duties */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base sm:text-lg">Recent Duty Records</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Latest shifts submitted across venues</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/duties')}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentDuties.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No duty shifts recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentDuties.slice(0, 6).map((duty) => (
                    <div
                      key={duty._id}
                      onClick={() => navigate('/duties')}
                      className="p-3.5 sm:p-4 hover:bg-slate-50 transition flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {duty.staff?.name || 'Staff Member'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            ({duty.staff?.staffCode || 'STF'})
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {duty.client?.companyName} •{' '}
                          <span className="text-slate-400">{duty.location || 'Main Section'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          {new Date(duty.dutyDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} •{' '}
                          {duty.inTime} - {duty.outTime} ({duty.hoursWorked}h)
                          {duty.isOvernight && <span className="text-purple-600 font-bold ml-1">🌙 Overnight</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-900">
                          ₹{(duty.staffWage || 0).toLocaleString()}
                        </div>
                        <div className="mt-1">
                          <StatusBadge status={duty.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Quick Reports & Balance Overview */}
        <div className="space-y-5">
          {/* Actionable Pending Wage Liabilities */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-amber-800">Pending Staff Wages</CardTitle>
                <p className="text-[11px] text-slate-500">Unsettled worker payments</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/staff-payments')}>
                Pay
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {pendingStaff.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">All staff wages settled!</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingStaff.slice(0, 4).map((s) => (
                    <div key={s.staffId} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.staffCode} • {s.dutyCount} duties</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-600">₹{s.pendingAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actionable Client Receivables */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-rose-800">Pending Client Dues</CardTitle>
                <p className="text-[11px] text-slate-500">Receivables owed by clients</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/client-payments')}>
                Collect
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {pendingClients.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400">All client bills collected!</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingClients.slice(0, 4).map((c) => (
                    <div key={c.clientId} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{c.companyName}</div>
                        <div className="text-[10px] text-slate-400">{c.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-rose-600">₹{c.pendingAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shortcut to Reports */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-bold text-white">Reports & Statement Generator</div>
              <div className="text-[11px] text-slate-300">Download Excel & PDF statements</div>
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate('/reports')}>
              Open Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
