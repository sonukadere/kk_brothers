import React, { useState, useEffect } from 'react';
import { dutyApi } from '../../api/dutyApi';
import { staffApi } from '../../api/staffApi';
import { clientApi } from '../../api/clientApi';
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
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Building2,
  Users,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Edit2,
  Trash2,
  Moon,
  Sun,
  Eye,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DutyManagement = () => {
  const [duties, setDuties] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Summary state
  const [summary, setSummary] = useState({
    totalDuties: 0,
    pendingApprovalCount: 0,
    approvedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalHours: 0,
    totalStaffWages: 0,
    totalClientBilling: 0,
  });

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state: Add Duty
  const initialFormState = {
    staff: '',
    client: '',
    dutyDate: new Date().toISOString().slice(0, 10),
    inTime: '09:00',
    outTime: '18:00',
    shiftType: 'Full Day (8-10 hrs)',
    hoursWorked: 9,
    staffWage: 750,
    clientBillingAmount: 1100,
    location: 'Main Hall',
    rolePerformed: 'Kitchen Helper',
    status: 'Approved',
    remarks: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Form state: Edit Duty
  const [editFormData, setEditFormData] = useState({});

  // Live calculation of hours for Add Modal
  const calcHours = (inT, outT) => {
    if (!inT || !outT) return { hours: 8, isOvernight: false };
    const [inH, inM] = inT.split(':').map(Number);
    const [outH, outM] = outT.split(':').map(Number);
    let diff = outH * 60 + (outM || 0) - (inH * 60 + (inM || 0));
    let isOvernight = false;
    if (diff <= 0) {
      isOvernight = true;
      diff += 24 * 60;
    }
    return { hours: Math.round((diff / 60) * 10) / 10, isOvernight };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dutyRes, staffRes, clientRes] = await Promise.all([
        dutyApi.getAll({
          search: search || undefined,
          status: statusFilter || undefined,
          staff: staffFilter || undefined,
          client: clientFilter || undefined,
          date: dateFilter || undefined,
        }),
        staffApi.getAll({ status: 'active' }),
        clientApi.getAll({ status: 'active' }),
      ]);

      if (dutyRes.success) {
        setDuties(dutyRes.data);
        if (dutyRes.summary) setSummary(dutyRes.summary);
      }
      if (staffRes.success) setStaffList(staffRes.data);
      if (clientRes.success) setClients(clientRes.data);
    } catch (err) {
      toast.error('Failed to load duty records from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, staffFilter, clientFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStaffFilter('');
    setClientFilter('');
    setDateFilter('');
    setTimeout(() => {
      dutyApi.getAll().then((res) => {
        if (res.success) setDuties(res.data);
      });
    }, 0);
  };

  // Change handlers for Add Modal with live auto-hours
  const handleInTimeChange = (val) => {
    const { hours, isOvernight } = calcHours(val, formData.outTime);
    setFormData((prev) => ({
      ...prev,
      inTime: val,
      hoursWorked: hours,
      shiftType: isOvernight ? 'Night (10 PM - 6 AM)' : prev.shiftType,
    }));
  };

  const handleOutTimeChange = (val) => {
    const { hours, isOvernight } = calcHours(formData.inTime, val);
    setFormData((prev) => ({
      ...prev,
      outTime: val,
      hoursWorked: hours,
      shiftType: isOvernight ? 'Night (10 PM - 6 AM)' : prev.shiftType,
    }));
  };

  // Edit Modal time changes
  const handleEditInTimeChange = (val) => {
    const { hours, isOvernight } = calcHours(val, editFormData.outTime);
    setEditFormData((prev) => ({
      ...prev,
      inTime: val,
      hoursWorked: hours,
      isOvernight,
    }));
  };

  const handleEditOutTimeChange = (val) => {
    const { hours, isOvernight } = calcHours(editFormData.inTime, val);
    setEditFormData((prev) => ({
      ...prev,
      outTime: val,
      hoursWorked: hours,
      isOvernight,
    }));
  };

  // Verify status action (Approve / Reject / Complete)
  const handleVerify = async (id, status) => {
    try {
      const res = await dutyApi.verify(id, { status });
      if (res.success) {
        toast.success(`Duty marked as ${status}!`);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Verification action failed');
    }
  };

  // Open Edit Modal
  const openEditModal = (duty) => {
    setSelectedDuty(duty);
    setEditFormData({
      client: duty.client?._id,
      dutyDate: duty.dutyDate ? new Date(duty.dutyDate).toISOString().slice(0, 10) : '',
      inTime: duty.inTime || '09:00',
      outTime: duty.outTime || '18:00',
      hoursWorked: duty.hoursWorked || 8,
      isOvernight: duty.isOvernight || false,
      shiftType: duty.shiftType || 'Full Day (8-10 hrs)',
      staffWage: duty.staffWage || 0,
      clientBillingAmount: duty.clientBillingAmount || 0,
      location: duty.location || '',
      rolePerformed: duty.rolePerformed || 'Kitchen Helper',
      status: duty.status || 'Approved',
      remarks: duty.remarks || '',
    });
    setIsEditModalOpen(true);
  };

  // Open Cancel Modal
  const openCancelModal = (duty) => {
    setSelectedDuty(duty);
    setIsCancelModalOpen(true);
  };

  // Open Details Modal
  const openDetailsModal = (duty) => {
    setSelectedDuty(duty);
    setIsDetailsModalOpen(true);
  };

  // Create Duty Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staff || !formData.client) {
      toast.error('Both staff member and client hotel/caterer must be selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await dutyApi.create(formData);
      if (res.success) {
        toast.success(res.message || 'Duty shift recorded successfully!');
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save duty');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Duty Submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDuty) return;

    setIsSubmitting(true);
    try {
      const res = await dutyApi.update(selectedDuty._id, editFormData);
      if (res.success) {
        toast.success(res.message || 'Duty record updated successfully!');
        setIsEditModalOpen(false);
        setSelectedDuty(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update duty record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Duty Submit
  const handleCancelSubmit = async () => {
    if (!selectedDuty) return;

    setIsSubmitting(true);
    try {
      const res = await dutyApi.cancel(selectedDuty._id);
      if (res.success) {
        toast.success(res.message || 'Duty cancelled successfully');
        setIsCancelModalOpen(false);
        setSelectedDuty(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel duty');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Duty Slip #',
      key: 'dutySlipNumber',
      render: (val, row) => (
        <div>
          <span
            onClick={() => openDetailsModal(row)}
            className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline decoration-indigo-200"
          >
            {val || row.dutyId || '—'}
          </span>
          <div className="text-[10px] text-slate-400 font-mono">
            {row.reportedBy || 'Admin'}
          </div>
        </div>
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
      header: 'Staff Assigned',
      key: 'staff',
      render: (staff, row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{staff?.name || 'Unassigned'}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            {staff?.staffCode} • {row.rolePerformed || staff?.designation}
          </div>
        </div>
      ),
    },
    {
      header: 'Establishment & Location',
      key: 'client',
      render: (client, row) => (
        <div>
          <div className="font-medium text-slate-900 text-xs">{client?.companyName}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{row.location || 'Main Hall'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Timings & Working Hours',
      key: 'hoursWorked',
      render: (val, row) => (
        <div>
          <div className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1">
            {row.inTime || '09:00'} - {row.outTime || '18:00'}
            {row.isOvernight && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-sans flex items-center gap-0.5">
                <Moon className="w-2.5 h-2.5 text-indigo-600" /> +1 day
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {val} hrs ({row.shiftType})
          </div>
        </div>
      ),
    },
    {
      header: 'Rates (Wage / Charge)',
      key: 'staffWage',
      render: (val, row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">Wage: ₹{val?.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-700 font-medium">
            Bill: ₹{row.clientBillingAmount?.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Duty Status',
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
            title="View Details"
            onClick={() => openDetailsModal(row)}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          </Button>

          {row.status === 'Pending Approval' || row.status === 'Pending' ? (
            <>
              <button
                onClick={() => handleVerify(id, 'Approved')}
                title="Approve Duty"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleVerify(id, 'Cancelled')}
                title="Cancel Duty"
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          ) : row.status === 'Approved' ? (
            <button
              onClick={() => handleVerify(id, 'Completed')}
              title="Mark as Completed"
              className="p-1 rounded text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer font-medium"
            >
              Complete
            </button>
          ) : null}

          {row.status !== 'Cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              title="Edit Duty Information"
              onClick={() => openEditModal(row)}
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
            </Button>
          )}

          {row.status !== 'Cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              title="Cancel Duty Record"
              onClick={() => openCancelModal(row)}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duty Management & Tracking"
        subtitle="Track which staff worked at which hotel or catering company, working hours, and billing rates."
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
              Log New Duty Shift
            </Button>
          </div>
        }
      />

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Shifts Logged"
          value={summary.totalDuties}
          subtitle={`${summary.totalHours} Total Hours`}
          icon={CalendarCheck}
          color="indigo"
          badgeText="All Duties"
        />
        <StatCard
          title="Pending Approval"
          value={summary.pendingApprovalCount}
          subtitle="Awaiting admin verification"
          icon={Clock}
          color={summary.pendingApprovalCount > 0 ? 'amber' : 'emerald'}
          badgeText={summary.pendingApprovalCount > 0 ? 'Action Needed' : 'All Verified'}
        />
        <StatCard
          title="Approved Shifts"
          value={summary.approvedCount}
          subtitle="Ready for duty / in progress"
          icon={CheckCircle2}
          color="sky"
          badgeText="Approved"
        />
        <StatCard
          title="Completed Shifts"
          value={summary.completedCount}
          subtitle="Finalized for payroll & billing"
          icon={CheckCircle}
          color="emerald"
          badgeText="Completed"
        />
        <StatCard
          title="Cancelled Shifts"
          value={summary.cancelledCount}
          subtitle="Excluded from finances"
          icon={XCircle}
          color="rose"
          badgeText="Cancelled"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by worker name, staff code, hotel/caterer, duty slip #, or place..."
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
                  { value: '', label: 'All Statuses' },
                  { value: 'Pending Approval', label: 'Pending Approval' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                placeholder="All Staff"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Staff Members' },
                  ...staffList.map((s) => ({ value: s._id, label: s.name })),
                ]}
              />
            </div>

            <div className="w-full sm:w-52">
              <Select
                placeholder="All Establishments"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Hotels & Caterers' },
                  ...clients.map((c) => ({ value: c._id, label: c.companyName })),
                ]}
              />
            </div>

            <div className="w-full sm:w-40">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" variant="secondary" size="md">
                Filter
              </Button>
              {(search || statusFilter || staffFilter || clientFilter || dateFilter) && (
                <Button type="button" variant="ghost" size="md" onClick={handleResetFilters}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Duties Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Staff Duty Shift Logbook ({duties.length})</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict accounting rule: Only Approved and Completed shifts count toward finalized payroll and billing.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={duties}
            isLoading={isLoading}
            emptyTitle="No duty records matching filter"
            emptyDescription="Log duty allocations or wait for staff members to report shifts."
            emptyAction={
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                Log First Duty Shift
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Modal 1: Add Duty Shift */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Staff Duty Allocation"
        subtitle="Assign a worker to a hotel or catering company with automatic hours calculation."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleCreateSubmit}
            >
              Save Duty Entry
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Staff Member"
              required
              placeholder="Select worker..."
              value={formData.staff}
              onChange={(e) => {
                const selected = staffList.find((s) => s._id === e.target.value);
                setFormData({
                  ...formData,
                  staff: e.target.value,
                  staffWage: selected?.defaultDailyRate || formData.staffWage,
                  rolePerformed: selected?.designation || formData.rolePerformed,
                });
              }}
              options={staffList.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.staffCode} - ${s.designation})`,
              }))}
            />

            <Select
              label="Hotel / Catering Establishment"
              required
              placeholder="Select establishment..."
              value={formData.client}
              onChange={(e) => {
                const selected = clients.find((c) => c._id === e.target.value);
                setFormData({
                  ...formData,
                  client: e.target.value,
                  clientBillingAmount:
                    selected?.defaultBillingRatePerStaff || formData.clientBillingAmount,
                });
              }}
              options={clients.map((c) => ({
                value: c._id,
                label: `${c.companyName} (${c.type})`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Duty Date"
              type="date"
              required
              value={formData.dutyDate}
              onChange={(e) => setFormData({ ...formData, dutyDate: e.target.value })}
            />
            <Input
              label="In Time"
              type="time"
              required
              value={formData.inTime}
              onChange={(e) => handleInTimeChange(e.target.value)}
            />
            <Input
              label="Out Time"
              type="time"
              required
              value={formData.outTime}
              onChange={(e) => handleOutTimeChange(e.target.value)}
            />
          </div>

          {/* Automatic calculation preview banner */}
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>
                Calculated Working Duration: <strong>{formData.hoursWorked} Hours</strong>
              </span>
            </div>
            {calcHours(formData.inTime, formData.outTime).isOvernight && (
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <Moon className="w-3 h-3" /> Overnight Shift (Out-time next day)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Staff Wage Rate (₹)"
              type="number"
              required
              value={formData.staffWage}
              onChange={(e) => setFormData({ ...formData, staffWage: Number(e.target.value) })}
            />
            <Input
              label="Client Billing Charge (₹)"
              type="number"
              required
              value={formData.clientBillingAmount}
              onChange={(e) =>
                setFormData({ ...formData, clientBillingAmount: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Work Location / Place"
              placeholder="e.g. Grand Ballroom 2, Banquet Hall, Kitchen"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Input
              label="Role Performed"
              placeholder="e.g. Kitchen Helper, Chef"
              value={formData.rolePerformed}
              onChange={(e) => setFormData({ ...formData, rolePerformed: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Initial Duty Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'Approved', label: 'Approved (Verified)' },
                { value: 'Pending Approval', label: 'Pending Approval' },
                { value: 'Completed', label: 'Completed' },
              ]}
            />
            <Input
              label="Duty Notes / Supervisor Memo"
              placeholder="Event specifics, uniform, overtime..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Duty Record */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Duty Information"
        subtitle={selectedDuty?.dutySlipNumber || 'Update Shift'}
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
              onClick={handleUpdateSubmit}
            >
              Save Corrections
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Duty Date"
              type="date"
              required
              value={editFormData.dutyDate || ''}
              onChange={(e) => setEditFormData({ ...editFormData, dutyDate: e.target.value })}
            />
            <Input
              label="In Time"
              type="time"
              required
              value={editFormData.inTime || '09:00'}
              onChange={(e) => handleEditInTimeChange(e.target.value)}
            />
            <Input
              label="Out Time"
              type="time"
              required
              value={editFormData.outTime || '18:00'}
              onChange={(e) => handleEditOutTimeChange(e.target.value)}
            />
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <span>
              Calculated Hours: <strong>{editFormData.hoursWorked} Hours</strong>
            </span>
            {editFormData.isOvernight && (
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                Overnight Shift
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Staff Wage (₹)"
              type="number"
              required
              value={editFormData.staffWage ?? 0}
              onChange={(e) => setEditFormData({ ...editFormData, staffWage: Number(e.target.value) })}
            />
            <Input
              label="Client Billing Charge (₹)"
              type="number"
              required
              value={editFormData.clientBillingAmount ?? 0}
              onChange={(e) =>
                setEditFormData({ ...editFormData, clientBillingAmount: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Work Location"
              value={editFormData.location || ''}
              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
            />
            <Select
              label="Duty Status"
              value={editFormData.status || 'Approved'}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              options={[
                'Pending Approval',
                'Approved',
                'Completed',
                'Cancelled',
              ]}
            />
          </div>

          <Input
            label="Correction Notes / Remarks"
            value={editFormData.remarks || ''}
            onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal 3: Cancel Duty Confirmation */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Duty Record"
        subtitle={selectedDuty?.dutySlipNumber}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Keep Active
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isSubmitting}
              onClick={handleCancelSubmit}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Financial Integrity Notice</span>
              Cancelled duty records are automatically excluded from client billing, staff wage
              settlements, and liability totals.
            </div>
          </div>
          <p>
            Are you sure you want to cancel shift <strong>{selectedDuty?.dutySlipNumber}</strong> for{' '}
            <strong>{selectedDuty?.staff?.name}</strong> at <strong>{selectedDuty?.client?.companyName}</strong>?
          </p>
        </div>
      </Modal>

      {/* Modal 4: Duty Details & Audit Log */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Duty Slip Details & Audit Trail"
        subtitle={selectedDuty?.dutySlipNumber}
        maxWidth="max-w-lg"
        footer={
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsDetailsModalOpen(false)}
          >
            Close
          </Button>
        }
      >
        {selectedDuty && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Worker</span>
                <span className="font-bold text-slate-900 text-sm">{selectedDuty.staff?.name}</span>
                <div className="text-slate-500 font-mono text-[11px]">
                  {selectedDuty.staff?.staffCode} • {selectedDuty.rolePerformed || selectedDuty.staff?.designation}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Establishment</span>
                <span className="font-bold text-slate-900 text-sm">{selectedDuty.client?.companyName}</span>
                <div className="text-slate-500 text-[11px]">{selectedDuty.location || 'Main Hall'}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Shift Timing</span>
                <span className="font-bold text-slate-900 font-mono text-xs">{selectedDuty.inTime} - {selectedDuty.outTime}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Hours Worked</span>
                <span className="font-bold text-slate-900 text-xs">{selectedDuty.hoursWorked} hrs</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                <div className="mt-0.5"><StatusBadge status={selectedDuty.status} /></div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[11px]">Worker Wage: <strong>₹{selectedDuty.staffWage}</strong></span>
                <span className="text-indigo-700 block text-[11px]">Client Bill: <strong>₹{selectedDuty.clientBillingAmount}</strong></span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Reported By: {selectedDuty.reportedBy}</span>
                {selectedDuty.verifiedAt && (
                  <span className="text-[10px] text-emerald-600 block">Verified on {new Date(selectedDuty.verifiedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Audit Change History */}
            <div>
              <span className="font-bold text-slate-800 block mb-1">
                Audit Trail & History ({selectedDuty.changeLog?.length || 0})
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-lg bg-slate-50 border border-slate-200">
                {selectedDuty.changeLog?.length === 0 ? (
                  <span className="text-slate-400 italic">No modifications logged.</span>
                ) : (
                  selectedDuty.changeLog?.map((c, i) => (
                    <div key={i} className="text-[11px] text-slate-600 border-b border-slate-100 pb-1">
                      <span className="text-slate-400 font-mono">
                        {new Date(c.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      </span>
                      <span>{c.changeSummary}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DutyManagement;
