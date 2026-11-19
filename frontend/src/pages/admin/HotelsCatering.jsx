import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '../../api/clientApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
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
  Building2,
  UtensilsCrossed,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  Power,
  Users,
  DollarSign,
  Receipt,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  CalendarCheck,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const HotelsCatering = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const initialFormState = {
    companyName: '',
    type: 'Hotel',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: 'Indore',
    gstNumber: '',
    defaultBillingRatePerStaff: 1200,
    creditPeriodDays: 15,
    status: 'active',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const res = await clientApi.getAll({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setClients(res.data);
      }
    } catch (err) {
      toast.error('Failed to load hotel & catering partners from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadClients();
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setTimeout(() => {
      clientApi.getAll().then((res) => {
        if (res.success) setClients(res.data);
      });
    }, 0);
  };

  // Open Add modal with specific type preset
  const openAddModal = (presetType = 'Hotel') => {
    setFormData({
      ...initialFormState,
      type: presetType,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setFormData({
      companyName: client.companyName || client.businessName || '',
      type: client.type || 'Hotel',
      contactPerson: client.contactPerson || '',
      phone: client.phone || client.mobileNumber || '',
      alternatePhone: client.alternatePhone || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || 'Indore',
      gstNumber: client.gstNumber || '',
      defaultBillingRatePerStaff: client.defaultBillingRatePerStaff ?? 1200,
      creditPeriodDays: client.creditPeriodDays ?? 15,
      status: client.status || 'active',
      notes: client.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  // Create Business
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactPerson || !formData.phone) {
      toast.error('Business Name, Contact Person and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clientApi.create(formData);
      if (res.success) {
        toast.success(res.message || 'Establishment registered successfully!');
        setIsAddModalOpen(false);
        setFormData(initialFormState);
        loadClients();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create business partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Business
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactPerson || !formData.phone) {
      toast.error('Business Name, Contact Person and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await clientApi.update(selectedClient._id, formData);
      if (res.success) {
        toast.success(res.message || 'Business information updated successfully!');
        setIsEditModalOpen(false);
        setSelectedClient(null);
        loadClients();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update business details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (client) => {
    const targetStatus = client.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await clientApi.toggleStatus(client._id, targetStatus);
      if (res.success) {
        toast.success(res.message || `Business is now ${targetStatus}`);
        loadClients();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  // Safe Deactivate or Delete
  const handleDeleteOrDeactivate = async () => {
    if (!selectedClient) return;
    setIsSubmitting(true);
    try {
      const res = await clientApi.deleteOrDeactivate(selectedClient._id);
      if (res.success) {
        toast.success(res.message);
        setIsDeleteModalOpen(false);
        setSelectedClient(null);
        loadClients();
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const totalBilledAggregate = clients.reduce((sum, c) => sum + (c.totalBillAmount || 0), 0);
  const totalReceivedAggregate = clients.reduce((sum, c) => sum + (c.totalReceived || 0), 0);
  const totalOutstandingAggregate = clients.reduce((sum, c) => sum + (c.remainingBalance || 0), 0);
  const hotelsCount = clients.filter((c) => c.type === 'Hotel').length;
  const cateringCount = clients.filter(
    (c) => c.type === 'Catering' || c.type === 'Catering Company'
  ).length;

  // Table Columns
  const columns = [
    {
      header: 'Business ID',
      key: 'businessId',
      render: (val, row) => (
        <span
          onClick={() => navigate(`/clients/${row._id}`)}
          className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline decoration-indigo-200"
        >
          {val || row.clientCode || '—'}
        </span>
      ),
    },
    {
      header: 'Establishment / Partner',
      key: 'companyName',
      render: (val, row) => (
        <div
          onClick={() => navigate(`/clients/${row._id}`)}
          className="cursor-pointer group"
        >
          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
            {row.type === 'Catering' || row.type === 'Catering Company' ? (
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            )}
            <span>{val}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>{row.city || 'Indore'}</span>
            {row.address && <span className="truncate max-w-[150px]"> • {row.address}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Business Type',
      key: 'type',
      render: (val) => {
        const isCatering = val === 'Catering' || val === 'Catering Company';
        return (
          <Badge variant={isCatering ? 'warning' : 'indigo'} size="sm">
            {val}
          </Badge>
        );
      },
    },
    {
      header: 'Contact Person & Mobile',
      key: 'contactPerson',
      render: (val, row) => (
        <div>
          <div className="font-medium text-slate-800 text-xs">{val}</div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Duties & Staff Sent',
      key: 'totalDuties',
      render: (val, row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">
            {val || 0} <span className="font-normal text-slate-500 text-[11px]">duties</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>{row.totalStaffProvided || 0} unique workers</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Total Charges',
      key: 'totalBillAmount',
      render: (val) => (
        <span className="text-xs font-bold text-slate-900">
          ₹{(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Received',
      key: 'totalReceived',
      render: (val) => (
        <span className="text-xs font-bold text-emerald-700">
          ₹{(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Outstanding Balance',
      key: 'remainingBalance',
      render: (val) => {
        const amount = val || 0;
        return (
          <span
            className={`text-xs font-bold ${
              amount > 0 ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded' : 'text-slate-500'
            }`}
          >
            ₹{amount.toLocaleString()}
          </span>
        );
      },
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
            title="View Details & Ledger"
            onClick={() => navigate(`/clients/${id}`)}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title="Edit Business"
            onClick={() => openEditModal(row)}
          >
            <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
            onClick={() => handleToggleStatus(row)}
          >
            <Power
              className={`w-3.5 h-3.5 ${
                row.status === 'active' ? 'text-amber-600' : 'text-emerald-600'
              }`}
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title="Delete / Safe Deactivate"
            onClick={() => openDeleteModal(row)}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with dedicated Add Hotel & Add Catering Buttons */}
      <PageHeader
        title="Hotels & Catering Management"
        subtitle="Manage client partners, worker allocation agreements, duty histories, and receivable accounts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={loadClients}
            >
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Building className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={() => openAddModal('Hotel')}
            >
              Add Hotel
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<UtensilsCrossed className="w-3.5 h-3.5 text-white" />}
              onClick={() => openAddModal('Catering Company')}
            >
              Add Catering Company
            </Button>
          </div>
        }
      />

      {/* 5 Financial & Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Businesses"
          value={clients.length}
          subtitle={`${hotelsCount} Hotels • ${cateringCount} Catering`}
          icon={Building2}
          color="indigo"
          badgeText="Active Partners"
        />
        <StatCard
          title="Hotels"
          value={hotelsCount}
          subtitle="Hospitality clients"
          icon={Building}
          color="sky"
          badgeText="Hotels"
        />
        <StatCard
          title="Catering Partners"
          value={cateringCount}
          subtitle="Banquet & event clients"
          icon={UtensilsCrossed}
          color="purple"
          badgeText="Catering"
        />
        <StatCard
          title="Total Charges"
          value={`₹${totalBilledAggregate.toLocaleString()}`}
          subtitle={`Received: ₹${totalReceivedAggregate.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          badgeText="Gross Billed"
        />
        <StatCard
          title="Outstanding Balance"
          value={`₹${totalOutstandingAggregate.toLocaleString()}`}
          subtitle="Pending collections"
          icon={AlertCircle}
          color={totalOutstandingAggregate > 0 ? 'amber' : 'emerald'}
          badgeText={totalOutstandingAggregate > 0 ? 'Due Receivables' : 'All Settled'}
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by business name, mobile, contact person, city, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              placeholder="All Business Types"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Business Types' },
                { value: 'Hotel', label: 'Hotel' },
                { value: 'Catering', label: 'Catering Company' },
                { value: 'Banquet Hall', label: 'Banquet Hall' },
                { value: 'Resort', label: 'Resort' },
                { value: 'Restaurant', label: 'Restaurant' },
              ]}
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active Partners' },
                { value: 'inactive', label: 'Inactive / Suspended' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
            {(search || typeFilter || statusFilter) && (
              <Button type="button" variant="ghost" size="md" onClick={handleResetFilters}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Clients Directory Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Hotels & Catering Directory ({clients.length})</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any business to view their detailed duty logs, staff sent, and billing ledger.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={clients}
            isLoading={isLoading}
            emptyTitle="No hotel or catering businesses found"
            emptyDescription="Create hotel or catering records to start dispatching staff duties and tracking charges."
            emptyAction={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openAddModal('Hotel')}>
                  Add Hotel
                </Button>
                <Button size="sm" variant="primary" onClick={() => openAddModal('Catering Company')}>
                  Add Catering Company
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Modal 1: Add Hotel or Catering Company */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={formData.type === 'Hotel' ? 'Add New Hotel' : 'Add New Catering Company'}
        subtitle="Business ID will be auto-generated (HTL-XXXX or CAT-XXXX). Fill in contact and rate details."
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
              Save Establishment
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              required
              placeholder="e.g. Grand Hyatt / Royal Caterers"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
            <Select
              label="Business Type"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'Hotel', label: 'Hotel' },
                { value: 'Catering Company', label: 'Catering Company' },
                { value: 'Banquet Hall', label: 'Banquet Hall' },
                { value: 'Resort', label: 'Resort' },
                { value: 'Restaurant', label: 'Restaurant' },
                { value: 'Event Organizer', label: 'Event Organizer' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              required
              placeholder="e.g. Sonu Kadere"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <Input
              label="Mobile Number"
              required
              placeholder="e.g. 6264791823"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. Indore, Ujjain, Dewas, Bhopal"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Select
              label="Initial Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active Partner' },
                { value: 'inactive', label: 'Inactive / Suspended' },
              ]}
            />
          </div>

          <Input
            label="Address"
            placeholder="Street address, landmark, area"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Staff Billing Rate (₹ / worker / shift)"
              type="number"
              placeholder="1200"
              value={formData.defaultBillingRatePerStaff}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultBillingRatePerStaff: Number(e.target.value),
                })
              }
            />
            <Input
              label="Credit Period (Days)"
              type="number"
              placeholder="15"
              value={formData.creditPeriodDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  creditPeriodDays: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GST Number (Optional)"
              placeholder="27AAAAA0000A1Z5"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="accounts@business.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Notes / Instructions"
            placeholder="Commercial terms, preferred worker uniforms, special instructions..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal 2: Edit Business Information */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Business Information"
        subtitle={
          selectedClient
            ? `Editing ${selectedClient.companyName} (${selectedClient.businessId || selectedClient.clientCode})`
            : 'Update partner records'
        }
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
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
            <Select
              label="Business Type"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'Hotel', label: 'Hotel' },
                { value: 'Catering Company', label: 'Catering Company' },
                { value: 'Banquet Hall', label: 'Banquet Hall' },
                { value: 'Resort', label: 'Resort' },
                { value: 'Restaurant', label: 'Restaurant' },
                { value: 'Event Organizer', label: 'Event Organizer' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              required
              placeholder="e.g. Sonu Kadere"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <Input
              label="Mobile Number"
              required
              placeholder="e.g. 6264791823"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active Partner' },
                { value: 'inactive', label: 'Inactive / Suspended' },
              ]}
            />
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Staff Billing Rate (₹)"
              type="number"
              placeholder="1200"
              value={formData.defaultBillingRatePerStaff}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultBillingRatePerStaff: Number(e.target.value),
                })
              }
            />
            <Input
              label="Credit Period (Days)"
              type="number"
              value={formData.creditPeriodDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  creditPeriodDays: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GST Number"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal 3: Safe Delete / Deactivate Safety Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete or Deactivate Business"
        subtitle={
          selectedClient
            ? `Confirm action for: ${selectedClient.companyName} (${selectedClient.businessId || selectedClient.clientCode})`
            : ''
        }
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
              Businesses with historical duty records or payment receipts will be{' '}
              <strong>deactivated instead of permanently deleted</strong>. This guarantees historical
              wages, billing charges, and tax records remain fully auditable.
            </div>
          </div>
          <p className="text-slate-500">
            If this partner has no associated duty records or payment receipts, their record will be
            permanently purged from MongoDB.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default HotelsCatering;
