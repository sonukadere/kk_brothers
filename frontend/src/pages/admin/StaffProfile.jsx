import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { staffApi } from '../../api/staffApi';
import { dutyApi } from '../../api/dutyApi';
import { paymentApi } from '../../api/paymentApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { StatusBadge, Badge } from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Power,
  ArrowLeft,
  CalendarCheck,
  Building2,
  CreditCard,
  FileText,
  Plus,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [stats, setStats] = useState({});
  const [recentDuties, setRecentDuties] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [allDuties, setAllDuties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'duties' | 'payments' | 'info'
  const [dutyStatusFilter, setDutyStatusFilter] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    profilePhoto: '',
    address: '',
    dateOfBirth: '',
    age: '',
    joiningDate: '',
    designation: 'Waiter',
    defaultDailyRate: 600,
    status: 'active',
    idProofType: 'Aadhaar',
    idProofNumber: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      upiId: '',
    },
    emergencyContact: {
      name: '',
      relation: '',
      phone: '',
    },
    notes: '',
  });

  const loadStaffData = async () => {
    setIsLoading(true);
    try {
      const res = await staffApi.getById(id);
      if (res.success) {
        setStaff(res.data);
        setStats(res.stats || {});
        setRecentDuties(res.recentDuties || []);
        setRecentPayments(res.recentPayments || []);

        // Also fetch all duties for history tab
        const dutiesRes = await staffApi.getDutyHistory(id, {
          status: dutyStatusFilter || undefined,
        });
        if (dutiesRes.success) {
          setAllDuties(dutiesRes.data || []);
        }
      }
    } catch (err) {
      toast.error('Failed to load staff profile from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [id, dutyStatusFilter]);

  const openEditModal = () => {
    if (!staff) return;
    setEditFormData({
      name: staff.name || '',
      phone: staff.phone || '',
      alternatePhone: staff.alternatePhone || '',
      profilePhoto: staff.profilePhoto || '',
      address: staff.address || '',
      dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.slice(0, 10) : '',
      age: staff.age || '',
      joiningDate: staff.joiningDate
        ? staff.joiningDate.slice(0, 10)
        : staff.joinDate
        ? staff.joinDate.slice(0, 10)
        : '',
      designation: staff.designation || 'Waiter',
      defaultDailyRate: staff.defaultDailyRate ?? 600,
      status: staff.status || 'active',
      idProofType: staff.idProofType || 'Aadhaar',
      idProofNumber: staff.idProofNumber || '',
      bankDetails: {
        accountHolderName: staff.bankDetails?.accountHolderName || '',
        accountNumber: staff.bankDetails?.accountNumber || '',
        ifscCode: staff.bankDetails?.ifscCode || '',
        bankName: staff.bankDetails?.bankName || '',
        upiId: staff.bankDetails?.upiId || '',
      },
      emergencyContact: {
        name: staff.emergencyContact?.name || '',
        relation: staff.emergencyContact?.relation || '',
        phone: staff.emergencyContact?.phone || '',
      },
      notes: staff.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.phone) {
      toast.error('Full name and mobile number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await staffApi.update(id, editFormData);
      if (res.success) {
        toast.success(res.message || 'Staff profile updated successfully!');
        setIsEditModalOpen(false);
        loadStaffData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update staff profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!staff) return;
    const targetStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await staffApi.toggleStatus(staff._id, targetStatus);
      if (res.success) {
        toast.success(res.message || `Staff is now ${targetStatus}`);
        loadStaffData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDeleteOrDeactivate = async () => {
    setIsSubmitting(true);
    try {
      const res = await staffApi.deleteOrDeactivate(id);
      if (res.success) {
        toast.success(res.message);
        setIsDeleteModalOpen(false);
        if (res.deleted) {
          navigate('/staff');
        } else {
          loadStaffData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !staff) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Loading complete worker profile from MongoDB..." />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-lg font-bold text-slate-800">Staff Worker Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          The requested staff record does not exist or has been deleted.
        </p>
        <div className="mt-4">
          <Button variant="primary" size="md" onClick={() => navigate('/staff')}>
            Return to Staff List
          </Button>
        </div>
      </div>
    );
  }

  const dutyColumns = [
    {
      header: 'Duty Slip #',
      key: 'dutySlipNumber',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{val || '—'}</span>
      ),
    },
    {
      header: 'Duty Date',
      key: 'dutyDate',
      render: (val) => (
        <span className="text-xs font-medium text-slate-700">
          {val ? new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Hotel / Caterer Client',
      key: 'client',
      render: (client, row) => (
        <div>
          <div className="font-semibold text-slate-900">{client?.companyName}</div>
          <div className="text-[11px] text-slate-500">{row.location}</div>
        </div>
      ),
    },
    {
      header: 'Shift & Hours',
      key: 'shiftType',
      render: (val, row) => (
        <div>
          <div className="text-xs font-medium text-slate-800">{val}</div>
          <div className="text-[11px] text-slate-500">{row.hoursWorked} hrs</div>
        </div>
      ),
    },
    {
      header: 'Wage Amount',
      key: 'staffWage',
      render: (val) => (
        <span className="text-sm font-bold text-slate-900">₹{val?.toLocaleString() || 0}</span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Settlement',
      key: 'paymentStatus',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const paymentColumns = [
    {
      header: 'Voucher #',
      key: 'paymentVoucherNo',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{val || '—'}</span>
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
      header: 'Amount Paid',
      key: 'amount',
      render: (val) => (
        <span className="text-sm font-bold text-emerald-700">₹{val?.toLocaleString() || 0}</span>
      ),
    },
    {
      header: 'Payment Mode',
      key: 'paymentMode',
      render: (val) => (
        <Badge variant="neutral" size="sm">
          {val}
        </Badge>
      ),
    },
    {
      header: 'UTR / Ref No.',
      key: 'transactionReference',
      render: (val) => (
        <span className="font-mono text-xs text-slate-600">{val || 'Cash Settlement'}</span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Notes',
      key: 'notes',
      render: (val) => <span className="text-xs text-slate-500">{val || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/staff')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Roster
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant={staff.status === 'active' ? 'secondary' : 'success'}
            size="sm"
            leftIcon={<Power className="w-3.5 h-3.5" />}
            onClick={handleToggleStatus}
          >
            {staff.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={openEditModal}
          >
            Edit Profile
          </Button>

          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Worker
          </Button>
        </div>
      </div>

      {/* Staff Worker Hero Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Profile Photo / Avatar */}
            {staff.profilePhoto ? (
              <img
                src={staff.profilePhoto}
                alt={staff.name}
                className="w-18 h-18 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-indigo-100 uppercase">
                {staff.name ? staff.name.slice(0, 2) : 'ST'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {staff.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {staff.staffCode || staff.staffId}
                </span>
                <StatusBadge status={staff.status} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="font-semibold text-indigo-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> {staff.designation}
                </span>
                <span className="font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {staff.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined:{' '}
                  {staff.joiningDate || staff.joinDate
                    ? new Date(staff.joiningDate || staff.joinDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
                {staff.age && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    Age: {staff.age} yrs
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/duties')}
            >
              Log Duty
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Wallet className="w-4 h-4" />}
              onClick={() => navigate('/staff-payments')}
            >
              Pay Wage
            </Button>
          </div>
        </div>
      </Card>

      {/* 5 Primary Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Duties"
          value={stats.totalDuties ?? 0}
          subtitle="Shifts worked"
          icon={CalendarCheck}
          color="indigo"
          badgeText="Work History"
        />
        <StatCard
          title="Working Hours"
          value={`${stats.totalWorkingHours ?? 0} hrs`}
          subtitle="Total shift duration"
          icon={Clock}
          color="sky"
          badgeText="Logged Time"
        />
        <StatCard
          title="Total Earnings"
          value={`₹${(stats.totalEarnings ?? 0).toLocaleString()}`}
          subtitle="Approved duty wages"
          icon={DollarSign}
          color="emerald"
          badgeText="Gross Wage"
        />
        <StatCard
          title="Total Paid"
          value={`₹${(stats.totalPaid ?? 0).toLocaleString()}`}
          subtitle="Disbursed vouchers"
          icon={Wallet}
          color="purple"
          badgeText="Settled"
        />
        <StatCard
          title="Total Pending"
          value={`₹${(stats.totalPending ?? 0).toLocaleString()}`}
          subtitle="Unpaid balance"
          icon={AlertCircle}
          color={stats.totalPending > 0 ? 'amber' : 'emerald'}
          badgeText={stats.totalPending > 0 ? 'Due for Payment' : 'Fully Settled'}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Duty Records ({stats.totalDuties ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Payment History ({recentPayments.length})
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Personal & Banking Information
          </button>
        </nav>
      </div>

      {/* Tab 1: Complete Duty Records */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDutyStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  dutyStatusFilter === ''
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Duties ({allDuties.length})
              </button>
              <button
                onClick={() => setDutyStatusFilter('Approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  dutyStatusFilter === 'Approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setDutyStatusFilter('Pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  dutyStatusFilter === 'Pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setDutyStatusFilter('Rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  dutyStatusFilter === 'Rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Rejected
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/duties')}
            >
              Allocate New Duty
            </Button>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Historical Duty Logbook</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete record of shifts completed by {staff.name} across hotels and caterers
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={dutyColumns}
                data={allDuties}
                isLoading={isLoading}
                emptyTitle="No duty shifts found"
                emptyDescription={`No duty records found for ${staff.name} matching the selected status.`}
                emptyAction={
                  <Button variant="primary" size="sm" onClick={() => navigate('/duties')}>
                    Log Duty
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Payment History */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Wage Disbursal Register</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Vouchers issued to {staff.name} (UPI, Bank Transfer, Cash)
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/staff-payments')}
            >
              Record Wage Payout
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={paymentColumns}
              data={recentPayments}
              isLoading={isLoading}
              emptyTitle="No wage payouts recorded"
              emptyDescription="No payment vouchers have been disbursed to this worker yet."
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/staff-payments')}
                >
                  Record First Payout
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Personal & Banking Information */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity & Contact Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Personal Information
              </h4>
              <Button variant="ghost" size="sm" onClick={openEditModal}>
                Edit
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Full Legal Name:</span>
                <span className="font-semibold text-slate-800">{staff.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Auto-Generated Staff ID:</span>
                <span className="font-mono font-bold text-slate-900">{staff.staffCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Primary Mobile:</span>
                <span className="font-mono text-slate-800 font-semibold">{staff.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Alternate Contact:</span>
                <span className="font-mono text-slate-600">{staff.alternatePhone || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Designation / Role:</span>
                <Badge variant="indigo" size="sm">
                  {staff.designation}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Default Daily Wage Rate:</span>
                <span className="font-bold text-slate-900">
                  ₹{staff.defaultDailyRate} <span className="text-slate-400 font-normal">/ 8h shift</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Age / Date of Birth:</span>
                <span className="text-slate-800">
                  {staff.dateOfBirth
                    ? new Date(staff.dateOfBirth).toLocaleDateString('en-IN')
                    : 'Not specified'}{' '}
                  {staff.age ? `(${staff.age} years)` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Residential Address:</span>
                <span className="text-slate-800 text-right max-w-xs">{staff.address || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">ID Verification:</span>
                <span className="font-medium text-slate-800">
                  {staff.idProofType} ({staff.idProofNumber || 'Not submitted'})
                </span>
              </div>
            </div>
          </Card>

          {/* Banking & Settlement Details Card */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Banking & UPI Settlement
                </h4>
                <Button variant="ghost" size="sm" onClick={openEditModal}>
                  Edit
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {staff.bankDetails?.upiId || 'Not registered'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Account Holder:</span>
                  <span className="font-semibold text-slate-800">
                    {staff.bankDetails?.accountHolderName || staff.name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono text-slate-800">
                    {staff.bankDetails?.accountNumber || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-mono text-slate-800">
                    {staff.bankDetails?.ifscCode || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="text-slate-800">{staff.bankDetails?.bankName || 'Pending'}</span>
                </div>
              </div>
            </Card>

            {/* Emergency Contact & Notes */}
            <Card className="p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Emergency Contact & Operational Notes
              </h4>
              <div className="text-xs text-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Contact:</span>
                  <span className="font-medium text-slate-800">
                    {staff.emergencyContact?.name || 'None'}{' '}
                    {staff.emergencyContact?.relation ? `(${staff.emergencyContact.relation})` : ''} •{' '}
                    {staff.emergencyContact?.phone || 'No phone'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-1">Supervisory Notes:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-600 italic">
                    {staff.notes || 'No supervisor notes recorded for this worker.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Worker Profile"
        subtitle={`Updating information for ${staff.name} (${staff.staffCode})`}
        maxWidth="max-w-2xl"
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
              onClick={handleEditSubmit}
            >
              Save Profile Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />
            <Input
              label="Primary Mobile Number"
              required
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Designation / Role"
              required
              value={editFormData.designation}
              onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
              options={[
                'Waiter',
                'Kitchen Helper',
                'Chef',
                'Captain',
                'Housekeeping',
                'Dishwasher',
                'Bartender',
                'Cleaner',
                'Supervisor',
              ]}
            />
            <Input
              label="Default Daily Wage (₹)"
              type="number"
              value={editFormData.defaultDailyRate}
              onChange={(e) =>
                setEditFormData({ ...editFormData, defaultDailyRate: e.target.value })
              }
            />
            <Select
              label="Account Status"
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active Roster' },
                { value: 'inactive', label: 'Inactive / Deactivated' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Joining Date"
              type="date"
              value={editFormData.joiningDate}
              onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value })}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={editFormData.dateOfBirth}
              onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
            />
            <Input
              label="Age (Years)"
              type="number"
              value={editFormData.age}
              onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Profile Photo URL (Optional)"
              placeholder="https://..."
              value={editFormData.profilePhoto}
              onChange={(e) => setEditFormData({ ...editFormData, profilePhoto: e.target.value })}
            />
            <Input
              label="Alternate Mobile"
              placeholder="+91 ..."
              value={editFormData.alternatePhone}
              onChange={(e) => setEditFormData({ ...editFormData, alternatePhone: e.target.value })}
            />
          </div>

          <Input
            label="Residential Address"
            placeholder="Room/Flat, Street, Area, City"
            value={editFormData.address}
            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
          />

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
              Banking & UPI Details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="UPI ID"
                placeholder="ramesh@upi"
                value={editFormData.bankDetails.upiId}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    bankDetails: { ...editFormData.bankDetails, upiId: e.target.value },
                  })
                }
              />
              <Input
                label="Bank Account No."
                placeholder="A/C Number"
                value={editFormData.bankDetails.accountNumber}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    bankDetails: { ...editFormData.bankDetails, accountNumber: e.target.value },
                  })
                }
              />
              <Input
                label="IFSC Code"
                placeholder="HDFC0001234"
                value={editFormData.bankDetails.ifscCode}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    bankDetails: { ...editFormData.bankDetails, ifscCode: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <Input
            label="Supervisory Notes"
            placeholder="Experience, performance notes, dietary constraints..."
            value={editFormData.notes}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Safe Delete / Deactivation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete or Deactivate Worker"
        subtitle={`Action for: ${staff.name} (${staff.staffCode})`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isSubmitting}
              onClick={handleDeleteOrDeactivate}
            >
              Confirm Deletion / Deactivation
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Historical Audit Protection Rule</span>
              Workers with recorded duty shifts ({stats.totalDuties ?? 0} duties) or wage
              disbursals ({recentPayments.length} payouts) will be{' '}
              <strong>deactivated rather than permanently deleted</strong>. This guarantees that
              client billing invoices and financial audits remain intact.
            </div>
          </div>

          <p>
            If this worker has no historical records, the profile will be safely and permanently
            removed from MongoDB.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default StaffProfile;
