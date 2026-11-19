import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi } from '../../api/staffApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Plus,
  Search,
  RefreshCw,
  Users,
  Phone,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Eye,
  Edit2,
  Trash2,
  Power,
  Calendar,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserManagement from './UserManagement';

export const StaffManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'users'
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New staff form state
  const initialFormState = {
    name: '',
    phone: '',
    alternatePhone: '',
    profilePhoto: '',
    address: '',
    dateOfBirth: '',
    age: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    designation: 'Kitchen Helper',
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
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState(initialFormState);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const res = await staffApi.getAll({
        search: search || undefined,
        designation: designationFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setStaffList(res.data);
      }
    } catch (err) {
      toast.error('Failed to load staff roster from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [designationFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStaff();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Staff full name and mobile number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await staffApi.create(formData);
      if (res.success) {
        toast.success(res.message || 'Staff member added successfully!');
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        loadStaff();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (staff) => {
    setSelectedStaff(staff);
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
      designation: staff.designation || 'Kitchen Helper',
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
    if (!selectedStaff) return;
    if (!editFormData.name || !editFormData.phone) {
      toast.error('Staff full name and mobile number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await staffApi.update(selectedStaff._id, editFormData);
      if (res.success) {
        toast.success(res.message || 'Staff details updated successfully!');
        setIsEditModalOpen(false);
        loadStaff();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    const targetStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await staffApi.toggleStatus(staff._id, targetStatus);
      if (res.success) {
        toast.success(res.message);
        loadStaff();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to change status');
    }
  };

  const openDeleteModal = (staff) => {
    setSelectedStaff(staff);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteOrDeactivate = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      const res = await staffApi.deleteOrDeactivate(selectedStaff._id);
      if (res.success) {
        toast.success(res.message);
        setIsDeleteModalOpen(false);
        loadStaff();
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Staff ID',
      key: 'staffCode',
      render: (val, row) => (
        <span
          onClick={() => navigate(`/staff/${row._id}`)}
          className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline decoration-indigo-300 underline-offset-2 whitespace-nowrap"
        >
          {val || row.staffId || '—'}
        </span>
      ),
    },
    {
      header: 'Full Name & Role',
      key: 'name',
      render: (val, row) => (
        <div
          onClick={() => navigate(`/staff/${row._id}`)}
          className="cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            {row.profilePhoto ? (
              <img
                src={row.profilePhoto}
                alt={val}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {val ? val.slice(0, 2) : 'ST'}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                {val}
              </div>
              <div className="text-[11px] text-slate-500">{row.designation}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Mobile Number',
      key: 'phone',
      render: (val) => (
        <div className="text-xs font-mono text-slate-800 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" />
          <span>{val}</span>
        </div>
      ),
    },
    {
      header: 'Duties & Hours',
      key: 'totalDuties',
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{val ?? 0} duties</span>
          <span className="text-[11px] text-slate-500 block">{row.totalHours ?? 0} hrs</span>
        </div>
      ),
    },
    {
      header: 'Total Earnings',
      key: 'totalEarnings',
      render: (val) => (
        <span className="text-xs font-semibold text-slate-900">
          ₹{(val ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Total Paid',
      key: 'totalPaid',
      render: (val) => (
        <span className="text-xs font-bold text-emerald-700">
          ₹{(val ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Pending Wage',
      key: 'totalPending',
      render: (val) => (
        <span
          className={`text-xs font-bold ${
            (val ?? 0) > 0 ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          ₹{(val ?? 0).toLocaleString()}
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
          <button
            onClick={() => navigate(`/staff/${id}`)}
            title="View Individual Profile & History"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => openEditModal(row)}
            title="Edit Staff Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToggleStatus(row)}
            title={row.status === 'active' ? 'Deactivate Worker' : 'Activate Worker'}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              row.status === 'active'
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>

          <button
            onClick={() => openDeleteModal(row)}
            title="Delete or Deactivate Worker"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Workforce Management"
        subtitle="Manage worker directory, profile details, duty histories, wage balances, and login accounts."
        actions={
          activeTab === 'staff' ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={loadStaff}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add New Staff
              </Button>
            </>
          ) : null
        }
      />

      {/* Module Tabs */}
      <div className="flex border-b border-slate-200 w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 sm:flex-initial pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === 'staff'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Staff Roster ({staffList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 sm:flex-initial pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">User Accounts & Login Credentials</span>
          <span className="sm:hidden">User Logins</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <UserManagement />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <Card className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by full name, mobile number or staff ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="w-full sm:w-44">
                <Select
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active Roster' },
                    { value: 'inactive', label: 'Inactive / Deactivated' },
                  ]}
                />
              </div>

              <div className="w-full sm:w-52">
                <Select
                  placeholder="All Designations"
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                  options={[
                    'Kitchen Helper',
                    'Chef',
                  ]}
                />
              </div>

              <Button type="submit" variant="secondary" size="md">
                Filter Roster
              </Button>
            </form>
          </Card>

          {/* Staff Table & Mobile Cards */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Staff Workforce Directory ({staffList.length})</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on any staff member or 'View Profile' to inspect complete historical duty
                  and payment records.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {/* MOBILE VIEW: CLEAN STAFF CARDS (block md:hidden) */}
              <div className="block md:hidden p-3 space-y-3">
                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <LoadingSpinner text="Loading staff workers..." />
                  </div>
                ) : staffList.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <p className="text-sm font-semibold text-slate-700">No staff workers found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      No workers found matching your filter criteria.
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="mt-4"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      Add Staff Member
                    </Button>
                  </div>
                ) : (
                  staffList.map((s) => (
                    <div
                      key={s._id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-indigo-300 transition-all"
                    >
                      {/* Top Row: Avatar, Name, Designation & Status */}
                      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                          onClick={() => navigate(`/staff/${s._id}`)}
                        >
                          {s.profilePhoto ? (
                            <img
                              src={s.profilePhoto}
                              alt={s.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                              {s.name ? s.name.slice(0, 2) : 'ST'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition truncate">
                                {s.name}
                              </h4>
                              <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded whitespace-nowrap">
                                {s.staffCode || s.staffId}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>{s.designation}</span>
                              {s.phone && (
                                <>
                                  <span>•</span>
                                  <a
                                    href={`tel:${s.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-mono text-slate-600 hover:text-indigo-600 flex items-center gap-0.5"
                                  >
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{s.phone}</span>
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>

                      {/* Middle: Financial & Duty Stats */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 text-center text-xs bg-slate-50/70 rounded-lg my-2 px-1">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">Duties</span>
                          <span className="font-bold text-slate-800">{s.totalDuties ?? 0}</span>
                          <span className="text-[10px] text-slate-400 block">{s.totalHours ?? 0}h</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">Earned</span>
                          <span className="font-bold text-slate-900">₹{(s.totalEarnings ?? 0).toLocaleString()}</span>
                          <span className="text-[10px] text-emerald-600 block">Paid: ₹{(s.totalPaid ?? 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">Pending</span>
                          <span className={`font-bold ${(s.totalPending ?? 0) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            ₹{(s.totalPending ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Action Buttons */}
                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/staff/${s._id}`)}
                          className="flex-1 text-xs py-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                        </Button>
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit Staff"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          title={s.status === 'active' ? 'Deactivate Worker' : 'Activate Worker'}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            s.status === 'active'
                              ? 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(s)}
                          title="Delete Worker"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* DESKTOP VIEW: FULL TABLE (hidden md:block) */}
              <div className="hidden md:block">
                <Table
                  columns={columns}
                  data={staffList}
                  isLoading={isLoading}
                  emptyTitle="No staff workers found"
                  emptyDescription="No workers found matching your filter criteria. Click below to add a worker."
                  emptyAction={
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      Add Staff Member
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Staff Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Register New Staff Worker"
            subtitle="Staff ID will be auto-generated upon saving."
            maxWidth="max-w-2xl"
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
                  Save Staff Record
                </Button>
              </>
            }
          >
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Mobile Number"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Designation / Role"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  options={[
                    'Kitchen Helper',
                    'Chef',
                  ]}
                />
                <Input
                  label="Default Daily Rate (₹)"
                  type="number"
                  placeholder="600"
                  value={formData.defaultDailyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultDailyRate: e.target.value })
                  }
                />
                <Select
                  label="Account Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'active', label: 'Active Roster' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Joining Date"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
                <Input
                  label="Date of Birth (Optional)"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
                <Input
                  label="Age (Years)"
                  type="number"
                  placeholder="e.g. 26"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Profile Photo URL (Optional)"
                  placeholder="https://..."
                  value={formData.profilePhoto}
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                />
                <Input
                  label="Alternate Mobile"
                  placeholder="+91 ..."
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                />
              </div>

              <Input
                label="Residential Address"
                placeholder="Room/Flat, Street, Area, City"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                  Banking & Settlement Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="UPI ID"
                    placeholder="ramesh@upi"
                    value={formData.bankDetails.upiId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, upiId: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Account Number"
                    placeholder="Account number"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="IFSC Code"
                    placeholder="HDFC0001234"
                    value={formData.bankDetails.ifscCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <Input
                label="Notes (Optional)"
                placeholder="Supervisor comments, special skills, certifications..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </form>
          </Modal>

          {/* Edit Staff Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Staff Worker Details"
            subtitle={`Editing: ${selectedStaff?.name} (${selectedStaff?.staffCode})`}
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
                  Save Changes
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
                  label="Mobile Number"
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
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, designation: e.target.value })
                  }
                  options={[
                    'Kitchen Helper',
                    'Chef',
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
                  label="Profile Photo URL"
                  value={editFormData.profilePhoto}
                  onChange={(e) => setEditFormData({ ...editFormData, profilePhoto: e.target.value })}
                />
                <Input
                  label="Alternate Mobile"
                  value={editFormData.alternatePhone}
                  onChange={(e) => setEditFormData({ ...editFormData, alternatePhone: e.target.value })}
                />
              </div>

              <Input
                label="Residential Address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                  Banking & UPI Settlement
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="UPI ID"
                    value={editFormData.bankDetails.upiId}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        bankDetails: { ...editFormData.bankDetails, upiId: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Account Number"
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
            title="Delete or Deactivate Staff Worker"
            subtitle={`Action for: ${selectedStaff?.name} (${selectedStaff?.staffCode})`}
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
                  Confirm Safe Action
                </Button>
              </>
            }
          >
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Historical Audit Protection Rule</span>
                  Workers who have logged duty records or received payments will be{' '}
                  <strong>deactivated instead of deleted</strong>. This preserves hotel billing
                  invoices and wage histories. Only workers with zero records are deleted
                  permanently.
                </div>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default StaffManagement;
