import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientApi } from '../../api/clientApi';
import { formatDate } from '../../utils/dateUtils';
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
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Receipt,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Power,
  ArrowLeft,
  CalendarCheck,
  Plus,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [stats, setStats] = useState({});
  const [staffSent, setStaffSent] = useState([]);
  const [recentDuties, setRecentDuties] = useState([]);
  const [allDuties, setAllDuties] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('duties'); // 'duties' | 'staff' | 'payments' | 'info'
  const [dutyStatusFilter, setDutyStatusFilter] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    type: 'Hotel',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    gstNumber: '',
    defaultBillingRatePerStaff: 1000,
    creditPeriodDays: 15,
    status: 'active',
    notes: '',
  });

  const loadBusinessData = async () => {
    setIsLoading(true);
    try {
      const res = await clientApi.getById(id);
      if (res.success) {
        setClient(res.data);
        setStats(res.stats || {});
        setStaffSent(res.staffSent || []);
        setRecentDuties(res.recentDuties || []);
        setPaymentHistory(res.paymentHistory || []);

        // Also fetch all duties for history tab
        const dutiesRes = await clientApi.getDuties(id, {
          status: dutyStatusFilter || undefined,
        });
        if (dutiesRes.success) {
          setAllDuties(dutiesRes.data || []);
        }
      }
    } catch (err) {
      toast.error('Failed to load business details from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [id, dutyStatusFilter]);

  const openEditModal = () => {
    if (!client) return;
    setEditFormData({
      companyName: client.companyName || client.businessName || '',
      type: client.type || 'Hotel',
      contactPerson: client.contactPerson || '',
      phone: client.phone || client.mobileNumber || '',
      alternatePhone: client.alternatePhone || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || 'Mumbai',
      gstNumber: client.gstNumber || '',
      defaultBillingRatePerStaff: client.defaultBillingRatePerStaff ?? 1000,
      creditPeriodDays: client.creditPeriodDays ?? 15,
      status: client.status || 'active',
      notes: client.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.companyName || !editFormData.contactPerson || !editFormData.phone) {
      toast.error('Business Name, Contact Person, and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clientApi.update(id, editFormData);
      if (res.success) {
        toast.success(res.message || 'Business details updated successfully!');
        setIsEditModalOpen(false);
        loadBusinessData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update business details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!client) return;
    const targetStatus = client.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await clientApi.toggleStatus(client._id, targetStatus);
      if (res.success) {
        toast.success(res.message || `Business is now ${targetStatus}`);
        loadBusinessData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDeleteOrDeactivate = async () => {
    setIsSubmitting(true);
    try {
      const res = await clientApi.deleteOrDeactivate(id);
      if (res.success) {
        toast.success(res.message);
        setIsDeleteModalOpen(false);
        if (res.deleted) {
          navigate('/clients');
        } else {
          loadBusinessData();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !client) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Loading establishment profile and ledgers from MongoDB..." />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-lg font-bold text-slate-800">Business Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          The requested hotel or catering partner does not exist or has been deleted.
        </p>
        <div className="mt-4">
          <Button variant="primary" size="md" onClick={() => navigate('/clients')}>
            Return to Partners
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
          {formatDate(val)}
        </span>
      ),
    },
    {
      header: 'Staff Assigned',
      key: 'staff',
      render: (staff, row) => (
        <div>
          <div
            onClick={() => staff?._id && navigate(`/staff/${staff._id}`)}
            className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer transition"
          >
            {staff?.name || 'Unassigned'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {staff?.staffCode} • {row.rolePerformed || staff?.designation}
          </div>
        </div>
      ),
    },
    {
      header: 'Venue Section',
      key: 'location',
      render: (val) => <span className="text-xs text-slate-700">{val || 'Main Hall'}</span>,
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
      header: 'Billed Amount',
      key: 'clientBillingAmount',
      render: (val) => (
        <span className="text-sm font-bold text-indigo-700">₹{val?.toLocaleString() || 0}</span>
      ),
    },
    {
      header: 'Approval',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const staffSentColumns = [
    {
      header: 'Staff ID',
      key: 'staffCode',
      render: (val, row) => (
        <span
          onClick={() => row.staffId && navigate(`/staff/${row.staffId}`)}
          className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline decoration-indigo-200"
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Worker Name',
      key: 'name',
      render: (val, row) => (
        <div
          onClick={() => row.staffId && navigate(`/staff/${row.staffId}`)}
          className="cursor-pointer group"
        >
          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
            {val}
          </div>
          <div className="text-[11px] text-slate-500">{row.designation}</div>
        </div>
      ),
    },
    {
      header: 'Mobile Contact',
      key: 'phone',
      render: (val) => (
        <span className="text-xs font-mono text-slate-700 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" /> {val}
        </span>
      ),
    },
    {
      header: 'Shifts at this Venue',
      key: 'shiftsCompleted',
      render: (val) => (
        <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
          {val} shifts
        </span>
      ),
    },
    {
      header: 'Hours Worked',
      key: 'hoursWorked',
      render: (val) => <span className="text-xs text-slate-600">{val} hrs</span>,
    },
    {
      header: 'Last Deployed',
      key: 'lastDutyDate',
      render: (val) => (
        <span className="text-xs text-slate-500">
          {formatDate(val)}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'staffId',
      align: 'right',
      render: (staffId) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => staffId && navigate(`/staff/${staffId}`)}
        >
          Worker Profile
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    {
      header: 'Receipt #',
      key: 'receiptNo',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{val || '—'}</span>
      ),
    },
    {
      header: 'Payment Date',
      key: 'paymentDate',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {formatDate(val)}
        </span>
      ),
    },
    {
      header: 'Amount Received',
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
      header: 'Invoice # / Ref',
      key: 'invoiceNumber',
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-mono font-medium text-slate-800">{val || 'Direct Deposit'}</span>
          {row.transactionReference && (
            <div className="text-[11px] text-slate-400 font-mono">
              Ref: {row.transactionReference}
            </div>
          )}
        </div>
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
      {/* Return & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hotel & Catering Partners
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant={client.status === 'active' ? 'secondary' : 'success'}
            size="sm"
            leftIcon={<Power className="w-3.5 h-3.5" />}
            onClick={handleToggleStatus}
          >
            {client.status === 'active' ? 'Deactivate Establishment' : 'Activate Establishment'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={openEditModal}
          >
            Edit Business Info
          </Button>

          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Business
          </Button>
        </div>
      </div>

      {/* Business Hero Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Building2 className="w-9 h-9" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {client.companyName || client.businessName}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {client.businessId || client.clientCode}
                </span>
                <StatusBadge status={client.type} />
                <StatusBadge status={client.status} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="font-medium flex items-center gap-1 text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400" /> {client.contactPerson}
                </span>
                <span className="font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {client.city || 'Mumbai'}{' '}
                  {client.address ? `• ${client.address}` : ''}
                </span>
                {client.gstNumber && (
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    GST: {client.gstNumber}
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
              Allocate Staff Duty
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Receipt className="w-4 h-4" />}
              onClick={() => navigate('/client-payments')}
            >
              Record Payment Receipt
            </Button>
          </div>
        </div>
      </Card>

      {/* 6 Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Duties"
          value={stats.totalDuties ?? 0}
          subtitle="Shifts hosted"
          icon={CalendarCheck}
          color="indigo"
          badgeText="Work History"
        />
        <StatCard
          title="Staff Provided"
          value={stats.totalStaffProvided ?? 0}
          subtitle="Unique workers"
          icon={Users}
          color="purple"
          badgeText="Workforce"
        />
        <StatCard
          title="Total Bill Amount"
          value={`₹${(stats.totalBillAmount ?? 0).toLocaleString()}`}
          subtitle="Gross charges"
          icon={DollarSign}
          color="sky"
          badgeText="Billed"
        />
        <StatCard
          title="Amount Received"
          value={`₹${(stats.totalReceived ?? 0).toLocaleString()}`}
          subtitle="Cleared receipts"
          icon={Receipt}
          color="emerald"
          badgeText="Settled"
        />
        <StatCard
          title="Remaining Balance"
          value={`₹${(stats.remainingBalance ?? 0).toLocaleString()}`}
          subtitle="Outstanding dues"
          icon={AlertCircle}
          color={stats.remainingBalance > 0 ? 'amber' : 'emerald'}
          badgeText={stats.remainingBalance > 0 ? 'Payment Due' : 'Zero Balance'}
        />
        <StatCard
          title="Daily Rate Terms"
          value={`₹${client.defaultBillingRatePerStaff || 900}`}
          subtitle={`Credit: ${client.creditPeriodDays || 15} days`}
          icon={Building2}
          color="indigo"
          badgeText="Standard Rate"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('duties')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'duties'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Duty Records ({stats.totalDuties ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Staff Sent ({stats.totalStaffProvided ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Payment History ({paymentHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Commercial & Contact Information
          </button>
        </nav>
      </div>

      {/* Tab 1: All Duty Records at this establishment */}
      {activeTab === 'duties' && (
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
                All Shifts ({allDuties.length})
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
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/duties')}
            >
              Allocate New Shift
            </Button>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Historical Duty Ledger</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  All workers and shifts billed to {client.companyName}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={dutyColumns}
                data={allDuties}
                isLoading={isLoading}
                emptyTitle="No duty records found"
                emptyDescription={`No shifts have been logged for ${client.companyName} matching the filter.`}
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

      {/* Tab 2: Staff Sent to this Business */}
      {activeTab === 'staff' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Workforce Provided ({staffSent.length} Workers)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff members who have executed duties and shifts at {client.companyName}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/duties')}
            >
              Deploy Staff
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={staffSentColumns}
              data={staffSent}
              isLoading={isLoading}
              emptyTitle="No staff sent yet"
              emptyDescription={`No workers have completed shifts at ${client.companyName} yet.`}
              emptyAction={
                <Button variant="primary" size="sm" onClick={() => navigate('/duties')}>
                  Allocate Staff
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Payment History (Receipts) */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Invoice Settlement Receipts ({paymentHistory.length})</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Payments credited by {client.companyName} to KK Brothers bank accounts
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/client-payments')}
            >
              Record Client Receipt
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={paymentColumns}
              data={paymentHistory}
              isLoading={isLoading}
              emptyTitle="No receipts recorded"
              emptyDescription="No payment receipts have been logged from this client yet."
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/client-payments')}
                >
                  Record First Receipt
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Commercial & Contact Information */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Establishment Information
              </h4>
              <Button variant="ghost" size="sm" onClick={openEditModal}>
                Edit Details
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Business Name:</span>
                <span className="font-semibold text-slate-800">{client.companyName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Business ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  {client.businessId || client.clientCode}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Business Category:</span>
                <Badge variant="indigo" size="sm">
                  {client.type}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Key Contact Person:</span>
                <span className="font-semibold text-slate-800">{client.contactPerson}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Mobile Number:</span>
                <span className="font-mono text-slate-800 font-semibold">{client.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Email Address:</span>
                <span className="text-slate-700">{client.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">City / Region:</span>
                <span className="font-medium text-slate-800">{client.city || 'Mumbai'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Address:</span>
                <span className="text-slate-800 text-right max-w-xs">{client.address || 'Not specified'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Commercial Billing Terms
              </h4>
              <Button variant="ghost" size="sm" onClick={openEditModal}>
                Edit Terms
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Billing Rate Per Staff:</span>
                <span className="font-bold text-indigo-700">
                  ₹{client.defaultBillingRatePerStaff || 900} / worker / shift
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Credit Period:</span>
                <span className="font-semibold text-slate-800">
                  {client.creditPeriodDays || 15} Days
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">GST Registration:</span>
                <span className="font-mono text-slate-800 font-medium">
                  {client.gstNumber || 'Unregistered'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Status:</span>
                <StatusBadge status={client.status} />
              </div>

              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Commercial Notes:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg text-slate-600 italic">
                  {client.notes || 'No commercial or logistical notes specified for this partner.'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Business Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Business Information"
        subtitle={`Updating details for ${client.companyName} (${client.businessId || client.clientCode})`}
        maxWidth="max-w-xl"
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
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              required
              value={editFormData.companyName}
              onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
            />
            <Select
              label="Business Type"
              required
              value={editFormData.type}
              onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
              options={[
                'Hotel',
                'Catering Company',
                'Banquet Hall',
                'Resort',
                'Event Organizer',
                'Restaurant',
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              required
              value={editFormData.contactPerson}
              onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
            />
            <Input
              label="Mobile Number"
              required
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              value={editFormData.city}
              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
            />
            <Select
              label="Status"
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active Partner' },
                { value: 'inactive', label: 'Inactive / Suspended' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Billing Rate Per Staff (₹)"
              type="number"
              value={editFormData.defaultBillingRatePerStaff}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  defaultBillingRatePerStaff: Number(e.target.value),
                })
              }
            />
            <Input
              label="Credit Period (Days)"
              type="number"
              value={editFormData.creditPeriodDays}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  creditPeriodDays: Number(e.target.value),
                })
              }
            />
          </div>

          <Input
            label="Establishment Address"
            value={editFormData.address}
            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
          />

          <Input
            label="GST Number"
            value={editFormData.gstNumber}
            onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value })}
          />

          <Input
            label="Notes"
            value={editFormData.notes}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete or Deactivate Safety Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete or Deactivate Business"
        subtitle={`Action for: ${client.companyName}`}
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
              <span className="font-bold block">Audit Trail Protection Rule</span>
              Businesses with historical duty records ({stats.totalDuties ?? 0} shifts) or
              payment receipts ({paymentHistory.length} receipts) will be{' '}
              <strong>deactivated instead of deleted</strong>. This ensures commercial and tax
              records remain intact.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BusinessDetails;
