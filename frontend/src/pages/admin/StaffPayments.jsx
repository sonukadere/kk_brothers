import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../api/paymentApi';
import { staffApi } from '../../api/staffApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Wallet,
  Plus,
  RefreshCw,
  CreditCard,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Users,
  Building2,
  DollarSign,
  Printer,
  Calendar,
  Edit2,
  Check,
  Receipt,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StaffPayments = () => {
  const [payments, setPayments] = useState([]);
  const [liabilityList, setLiabilityList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'liability'

  // Summary state
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalLiability: 0,
    pendingCount: 0,
  });

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    staff: '',
    paymentType: 'Full Payment', // 'Full Payment' | 'Partial Payment' | 'Advance Payment'
    paidAmount: '',
    paymentMethod: 'UPI',
    transactionReference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Live balance details of staff currently selected in form
  const [staffBalanceInfo, setStaffBalanceInfo] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Load all payments, liability, and staff list
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [payRes, liabRes, staffRes] = await Promise.all([
        paymentApi.getStaffPayments({
          search: search || undefined,
          status: statusFilter || undefined,
          paymentMethod: methodFilter || undefined,
          staff: selectedStaffFilter || undefined,
        }),
        paymentApi.getStaffLiability(),
        staffApi.getAll({ status: 'active' }),
      ]);

      if (payRes.success) {
        setPayments(payRes.data);
        if (payRes.summary) {
          setSummary(payRes.summary);
        }
      }

      if (liabRes.success) {
        setLiabilityList(liabRes.data);
      }

      if (staffRes.success) {
        setStaffList(staffRes.data);
      }
    } catch (err) {
      toast.error('Failed to load staff payments and liability data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, methodFilter, selectedStaffFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setMethodFilter('');
    setSelectedStaffFilter('');
    setTimeout(() => {
      paymentApi.getStaffPayments().then((res) => {
        if (res.success) setPayments(res.data);
      });
    }, 0);
  };

  // When staff is selected in payment form, fetch their live pending wage balance
  const handleStaffChange = async (staffId) => {
    setFormData((prev) => ({ ...prev, staff: staffId }));
    if (!staffId) {
      setStaffBalanceInfo(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      const res = await paymentApi.getStaffBalance(staffId);
      if (res.success) {
        const bal = res.data;
        setStaffBalanceInfo(bal);

        // Pre-fill amount if Full Payment is selected
        if (formData.paymentType === 'Full Payment') {
          setFormData((prev) => ({
            ...prev,
            staff: staffId,
            paidAmount: bal.pendingAmount > 0 ? bal.pendingAmount : '',
          }));
        }
      }
    } catch (err) {
      toast.error('Failed to retrieve worker balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // When payment type changes (Full, Partial, Advance)
  const handlePaymentTypeChange = (type) => {
    setFormData((prev) => {
      let amount = prev.paidAmount;
      if (type === 'Full Payment' && staffBalanceInfo) {
        amount = staffBalanceInfo.pendingAmount > 0 ? staffBalanceInfo.pendingAmount : '';
      }
      return {
        ...prev,
        paymentType: type,
        paidAmount: amount,
      };
    });
  };

  // Open modal pre-selected for a specific staff member
  const openPayWorkerModal = (staffId) => {
    setFormData({
      staff: staffId,
      paymentType: 'Full Payment',
      paidAmount: '',
      paymentMethod: 'UPI',
      transactionReference: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setIsAddModalOpen(true);
    handleStaffChange(staffId);
  };

  // Open Receipt Modal
  const openReceiptModal = async (paymentId) => {
    try {
      const res = await paymentApi.getStaffPaymentById(paymentId);
      if (res.success) {
        setCurrentReceipt(res.receipt);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to generate payment voucher receipt');
    }
  };

  // Open Edit Modal
  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  // Submit New Payment
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staff || formData.paidAmount === '' || Number(formData.paidAmount) <= 0) {
      toast.error('Please select a worker and enter a valid positive payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentApi.createStaffPayment(formData);
      if (res.success) {
        toast.success(res.message || 'Staff wage payment voucher recorded!');
        setIsAddModalOpen(false);
        setFormData({
          staff: '',
          paymentType: 'Full Payment',
          paidAmount: '',
          paymentMethod: 'UPI',
          transactionReference: '',
          paymentDate: new Date().toISOString().slice(0, 10),
          notes: '',
        });
        setStaffBalanceInfo(null);
        loadData();

        // Optionally open receipt immediately
        if (res.data?._id) {
          openReceiptModal(res.data._id);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Payment Update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setIsSubmitting(true);
    try {
      const res = await paymentApi.updateStaffPayment(selectedPayment._id, {
        paymentMethod: selectedPayment.paymentMethod,
        transactionReference: selectedPayment.transactionReference,
        paymentDate: selectedPayment.paymentDate,
        status: selectedPayment.status,
        notes: selectedPayment.notes,
      });

      if (res.success) {
        toast.success(res.message || 'Payment record updated!');
        setIsEditModalOpen(false);
        setSelectedPayment(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Receipt Handler
  const handlePrintReceipt = () => {
    window.print();
  };

  // Columns for Tab 1: All Payment Transactions
  const transactionColumns = [
    {
      header: 'Payment ID / Voucher',
      key: 'paymentVoucherNo',
      render: (val, row) => (
        <div>
          <span
            onClick={() => openReceiptModal(row._id)}
            className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline decoration-indigo-200"
          >
            {val || row.paymentId || '—'}
          </span>
          <div className="text-[10px] text-slate-400 font-medium">
            {row.paymentType || 'Standard Payment'}
          </div>
        </div>
      ),
    },
    {
      header: 'Staff Recipient',
      key: 'staff',
      render: (staff) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{staff?.name || 'Unassigned'}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {staff?.staffCode} • {staff?.phone}
          </div>
        </div>
      ),
    },
    {
      header: 'Total Earning',
      key: 'totalEarning',
      render: (val) => (
        <span className="text-xs font-semibold text-slate-700">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Paid Amount',
      key: 'paidAmount',
      render: (val, row) => (
        <span className="text-sm font-bold text-emerald-700">
          ₹{(val ?? row.amount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Pending Balance',
      key: 'pendingAmount',
      render: (val) => {
        const p = val ?? 0;
        return (
          <span
            className={`text-xs font-bold ${
              p > 0 ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded' : 'text-slate-500'
            }`}
          >
            ₹{p.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Method',
      key: 'paymentMethod',
      render: (val, row) => {
        const mode = val || row.paymentMode || 'Cash';
        const isUPI = mode === 'UPI';
        const isBank = mode === 'Bank Transfer';
        return (
          <Badge variant={isUPI ? 'indigo' : isBank ? 'purple' : 'neutral'} size="sm">
            {mode}
          </Badge>
        );
      },
    },
    {
      header: 'Txn / UTR #',
      key: 'transactionReference',
      render: (val) => (
        <span className="font-mono text-[11px] text-slate-600 truncate max-w-[120px] block" title={val}>
          {val || 'Hand Settlement'}
        </span>
      ),
    },
    {
      header: 'Payment Date',
      key: 'paymentDate',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val ? new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Actions',
      key: '_id',
      align: 'right',
      render: (id, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            title="View Official Receipt"
            onClick={() => openReceiptModal(id)}
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title="Edit Payment Info"
            onClick={() => openEditModal(row)}
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Tab 2: Staff-Wise Liability Roster
  const liabilityColumns = [
    {
      header: 'Staff Worker',
      key: 'name',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{val}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {row.staffCode} • {row.designation}
          </div>
        </div>
      ),
    },
    {
      header: 'Mobile Contact',
      key: 'phone',
      render: (val) => <span className="font-mono text-xs text-slate-700">{val}</span>,
    },
    {
      header: 'Completed Duties',
      key: 'totalDuties',
      render: (val) => (
        <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {val || 0} shifts
        </span>
      ),
    },
    {
      header: 'Total Earnings',
      key: 'totalEarnings',
      render: (val) => (
        <span className="text-xs font-bold text-slate-800">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Total Paid',
      key: 'totalPaid',
      render: (val) => (
        <span className="text-xs font-bold text-emerald-700">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Pending Wage Liability',
      key: 'pendingAmount',
      render: (val) => {
        const pending = val || 0;
        return (
          <span
            className={`text-sm font-bold ${
              pending > 0
                ? 'text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100'
                : 'text-slate-500 bg-slate-50 px-2 py-0.5 rounded'
            }`}
          >
            ₹{pending.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Wage Status',
      key: 'paymentStatus',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Actions',
      key: 'staffId',
      align: 'right',
      render: (staffId, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={row.pendingAmount > 0 ? 'primary' : 'outline'}
            size="sm"
            leftIcon={<Wallet className="w-3.5 h-3.5" />}
            onClick={() => openPayWorkerModal(staffId)}
          >
            {row.pendingAmount > 0 ? 'Settle Wage' : 'Advance Pay'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Payment Management"
        subtitle="Track worker wage liabilities, record advance/partial/full payouts, and issue payment vouchers."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Record Wage Payout
            </Button>
          </div>
        }
      />

      {/* 4 Top Financial & Liability Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff Liability"
          value={`₹${(summary.totalLiability || 0).toLocaleString()}`}
          subtitle="Pending wages owed to workers"
          icon={AlertCircle}
          color={summary.totalLiability > 0 ? 'amber' : 'emerald'}
          badgeText={summary.totalLiability > 0 ? 'Pending Dues' : 'All Cleared'}
        />

        <StatCard
          title="Total Wages Disbursed"
          value={`₹${(summary.totalPaid || 0).toLocaleString()}`}
          subtitle="Cumulative payouts made"
          icon={DollarSign}
          color="emerald"
          badgeText="Disbursed"
        />

        <StatCard
          title="Payment Transactions"
          value={payments.length}
          subtitle="Vouchers logged in MongoDB"
          icon={FileText}
          color="indigo"
          badgeText="Ledger"
        />

        <StatCard
          title="Workers with Pending Dues"
          value={summary.pendingCount || 0}
          subtitle="Workers awaiting wage clearance"
          icon={Users}
          color="purple"
          badgeText="Active Staff"
        />
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            All Payment Vouchers ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab('liability')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'liability'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Staff-Wise Liability Roster ({liabilityList.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: All Payment Vouchers */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <Card className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by worker name, staff code, voucher ID, or UTR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="w-full sm:w-44">
                <Select
                  placeholder="All Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'Paid', label: 'Paid (Cleared)' },
                    { value: 'Partial', label: 'Partial Payment' },
                    { value: 'Pending', label: 'Pending Payment' },
                  ]}
                />
              </div>

              <div className="w-full sm:w-44">
                <Select
                  placeholder="All Methods"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Methods' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                    { value: 'Cash', label: 'Cash' },
                  ]}
                />
              </div>

              <div className="w-full sm:w-52">
                <Select
                  placeholder="All Workers"
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Staff Members' },
                    ...staffList.map((s) => ({ value: s._id, label: s.name })),
                  ]}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" variant="secondary" size="md">
                  Filter
                </Button>
                {(search || statusFilter || methodFilter || selectedStaffFilter) && (
                  <Button type="button" variant="ghost" size="md" onClick={handleResetFilters}>
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Vouchers Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Staff Payment Voucher Ledger</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable transaction history. Balance calculated as: Pending Amount = Total Earning - Paid Amount.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={transactionColumns}
                data={payments}
                isLoading={isLoading}
                emptyTitle="No staff payments recorded"
                emptyDescription="Disburse wages to workers for approved duty shifts."
                emptyAction={
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Record First Payout
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Staff-Wise Liability Roster */}
      {activeTab === 'liability' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Staff-Wise Wage Liability Roster ({liabilityList.length} Workers)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Current outstanding payment balances owed by KK Brothers to each worker.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Record Wage Payout
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={liabilityColumns}
              data={liabilityList}
              isLoading={isLoading}
              emptyTitle="No staff records found"
              emptyDescription="Staff members registered in the system will appear here with their wage balances."
            />
          </CardContent>
        </Card>
      )}

      {/* Modal 1: Add Payment Voucher */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setStaffBalanceInfo(null);
        }}
        title="Record Staff Wage Payout"
        subtitle="Maintain transaction history and disburse wages via Cash, UPI, or Bank Transfer."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setIsAddModalOpen(false);
                setStaffBalanceInfo(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleCreateSubmit}
            >
              Confirm Disbursal & Issue Voucher
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Worker Selector */}
          <Select
            label="Staff Recipient"
            required
            placeholder="Select worker to pay..."
            value={formData.staff}
            onChange={(e) => handleStaffChange(e.target.value)}
            options={staffList.map((s) => ({
              value: s._id,
              label: `${s.name} (${s.staffCode} - ${s.designation})`,
            }))}
          />

          {/* Live Worker Balance Preview Badge */}
          {isLoadingBalance && (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              Calculating live wage balance from MongoDB...
            </div>
          )}

          {staffBalanceInfo && !isLoadingBalance && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Approved Shifts:</span>
                <span className="font-semibold text-slate-800">
                  {staffBalanceInfo.totalDuties} duties ({staffBalanceInfo.totalHours} hrs)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Historical Earnings:</span>
                <span className="font-semibold text-slate-900">
                  ₹{staffBalanceInfo.totalEarnings.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Previously Paid:</span>
                <span className="font-semibold text-emerald-700">
                  ₹{staffBalanceInfo.totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Current Outstanding Wage Balance:</span>
                <span
                  className={
                    staffBalanceInfo.pendingAmount > 0 ? 'text-amber-700 font-mono text-sm' : 'text-emerald-700'
                  }
                >
                  ₹{staffBalanceInfo.pendingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Payment Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Classification
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Full Payment', 'Partial Payment', 'Advance Payment'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handlePaymentTypeChange(t)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                    formData.paymentType === t
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount and Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount to Disburse (₹)"
              type="number"
              required
              placeholder="e.g. 1500"
              value={formData.paidAmount}
              onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
            />
            <Select
              label="Payment Method"
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={[
                { value: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)' },
                { value: 'Cash', label: 'Cash (Hand Settlement)' },
                { value: 'Bank Transfer', label: 'Bank Transfer (IMPS / NEFT)' },
              ]}
            />
          </div>

          {/* Live Calculation Preview */}
          {staffBalanceInfo && formData.paidAmount && !isNaN(Number(formData.paidAmount)) && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1 text-indigo-900">
              <div className="flex justify-between">
                <span>Total Earning:</span>
                <span className="font-semibold">₹{staffBalanceInfo.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paying Now:</span>
                <span className="font-bold text-emerald-700">₹{Number(formData.paidAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-indigo-200 font-bold">
                <span>Calculated Pending Balance:</span>
                <span className="text-amber-800">
                  ₹{Math.max(0, staffBalanceInfo.pendingAmount - Number(formData.paidAmount)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Transaction / UTR Reference"
              placeholder="UPI txn id, bank ref #..."
              value={formData.transactionReference}
              onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
            />
            <Input
              label="Payment Date"
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <Input
            label="Payment Notes / Settlement Memo"
            placeholder="e.g. Settlement for catering shifts at Grand Hyatt banquet"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal 2: Official Printable Payment Receipt */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Staff Wage Voucher Receipt"
        subtitle={currentReceipt?.receiptNumber || 'Voucher Receipt'}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsReceiptModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrintReceipt}
            >
              Print Voucher Receipt
            </Button>
          </>
        }
      >
        {currentReceipt && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-5 text-slate-800 print:border-none print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">KK BROTHERS</h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                  Staff Duty & Payment Management System
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {currentReceipt.receiptNumber}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {new Date(currentReceipt.receiptDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Worker Details
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{currentReceipt.staff.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {currentReceipt.staff.code} • {currentReceipt.staff.designation}
                </div>
                <div className="text-slate-500 text-[11px]">{currentReceipt.staff.phone}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Payment Account
                </span>
                <div className="text-slate-700 text-[11px] mt-0.5">
                  <span className="font-medium text-slate-500">Method: </span>
                  <span className="font-semibold">{currentReceipt.paymentMethod}</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px] truncate">
                  <span className="font-medium text-slate-500">Ref: </span>
                  {currentReceipt.transactionReference}
                </div>
                {currentReceipt.staff.upiId && currentReceipt.staff.upiId !== 'N/A' && (
                  <div className="text-slate-700 font-mono text-[11px]">
                    <span className="font-medium text-slate-500">UPI: </span>
                    {currentReceipt.staff.upiId}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Ledger Section */}
            <div className="space-y-2 border-y border-slate-200 py-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Historical Earnings:</span>
                <span className="font-semibold text-slate-800">
                  ₹{currentReceipt.totalEarning.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm py-1 font-bold text-slate-900 bg-emerald-50/60 p-2 rounded-lg">
                <span className="text-emerald-900">Amount Paid (Disbursed):</span>
                <span className="text-emerald-700 font-black text-base">
                  ₹{currentReceipt.paidAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Pending Wage Liability After Payment:</span>
                <span
                  className={
                    currentReceipt.pendingAmount > 0
                      ? 'font-bold text-amber-700 font-mono'
                      : 'font-semibold text-emerald-700'
                  }
                >
                  ₹{currentReceipt.pendingAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Amount in words */}
            <div className="text-xs text-slate-600 italic">
              <span className="font-semibold text-slate-700 not-italic">Amount in Words: </span>
              {currentReceipt.paidAmountInWords}
            </div>

            {/* Notes */}
            {currentReceipt.notes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Payment Memo:</span>
                {currentReceipt.notes}
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
              <div>
                <span className="block font-semibold text-slate-700">KK Brothers Accounts Desk</span>
                <span>Authorized Signatory</span>
              </div>
              <div className="text-right">
                <StatusBadge status={currentReceipt.status} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Edit Payment Information */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Staff Payment Information"
        subtitle={selectedPayment?.paymentVoucherNo || 'Edit Voucher'}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleUpdateSubmit}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {selectedPayment && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Select
              label="Payment Method"
              value={selectedPayment.paymentMethod || selectedPayment.paymentMode}
              onChange={(e) =>
                setSelectedPayment({ ...selectedPayment, paymentMethod: e.target.value })
              }
              options={['UPI', 'Cash', 'Bank Transfer']}
            />

            <Input
              label="Transaction / UTR Reference"
              value={selectedPayment.transactionReference || ''}
              onChange={(e) =>
                setSelectedPayment({ ...selectedPayment, transactionReference: e.target.value })
              }
            />

            <Input
              label="Payment Date"
              type="date"
              value={
                selectedPayment.paymentDate
                  ? new Date(selectedPayment.paymentDate).toISOString().slice(0, 10)
                  : ''
              }
              onChange={(e) =>
                setSelectedPayment({ ...selectedPayment, paymentDate: e.target.value })
              }
            />

            <Select
              label="Payment Status"
              value={selectedPayment.status}
              onChange={(e) => setSelectedPayment({ ...selectedPayment, status: e.target.value })}
              options={['Paid', 'Partial', 'Pending']}
            />

            <Input
              label="Notes / Settlement Memo"
              value={selectedPayment.notes || ''}
              onChange={(e) => setSelectedPayment({ ...selectedPayment, notes: e.target.value })}
            />
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StaffPayments;
