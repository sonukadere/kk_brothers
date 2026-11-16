import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/userApi';
import { staffApi } from '../../api/staffApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { StatusBadge, Badge } from '../../components/common/Badge';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User,
  KeyRound,
  Edit2,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    staffProfileId: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
  });

  const [newPassword, setNewPassword] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userRes, staffRes] = await Promise.all([
        userApi.getAll({
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        }),
        staffApi.getAll(),
      ]);

      if (userRes.success) setUsers(userRes.data);
      if (staffRes.success) setStaffList(staffRes.data);
    } catch (err) {
      toast.error('Failed to load user accounts from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.email || !createFormData.password) {
      toast.error('Name, email, and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userApi.create(createFormData);
      if (res.success) {
        toast.success(res.message || 'User account provisioned successfully!');
        setIsCreateModalOpen(false);
        setCreateFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'user',
          staffProfileId: '',
        });
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (targetUser) => {
    setSelectedUser(targetUser);
    setEditFormData({
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone || '',
      role: targetUser.role,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await userApi.update(selectedUser._id, editFormData);
      if (res.success) {
        toast.success('User updated successfully!');
        setIsEditModalOpen(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    if (targetUser._id === currentUser?.id) {
      toast.error('You cannot deactivate your own administrator account.');
      return;
    }

    const action = targetUser.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${targetUser.name}'s account?`)) {
      return;
    }

    try {
      const res = await userApi.toggleStatus(targetUser._id, !targetUser.isActive);
      if (res.success) {
        toast.success(res.message);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || `Failed to ${action} user`);
    }
  };

  const openResetPasswordModal = (targetUser) => {
    setSelectedUser(targetUser);
    setNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userApi.resetPassword(selectedUser._id, newPassword);
      if (res.success) {
        toast.success(res.message || 'Password reset successfully!');
        setIsResetPasswordModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Account User',
      key: 'name',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            {val}
            {row._id === currentUser?.id && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                You
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-slate-400" /> {row.email}
          </div>
        </div>
      ),
    },
    {
      header: 'Mobile Login',
      key: 'phone',
      render: (val) => (
        <div className="text-xs font-mono text-slate-700 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" /> {val || 'Not configured'}
        </div>
      ),
    },
    {
      header: 'Role',
      key: 'role',
      render: (val) => (
        <Badge
          variant={val === 'admin' ? 'indigo' : 'neutral'}
          size="sm"
          className="capitalize font-semibold"
        >
          {val === 'admin' ? 'Administrator' : 'Staff Worker'}
        </Badge>
      ),
    },
    {
      header: 'Linked Staff Profile',
      key: 'staffProfile',
      render: (profile) =>
        profile ? (
          <div>
            <span className="font-mono text-xs font-semibold text-slate-800">
              {profile.staffCode}
            </span>
            <span className="text-[11px] text-slate-500 block">{profile.designation}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">None (System Admin)</span>
        ),
    },
    {
      header: 'Account Status',
      key: 'isActive',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'danger'} dot size="sm">
          {isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      header: 'Last Login',
      key: 'lastLogin',
      render: (val) => (
        <span className="text-xs text-slate-500">
          {val ? new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never logged in'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: '_id',
      align: 'right',
      render: (id, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            title="Edit User"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => openResetPasswordModal(row)}
            title="Reset Password"
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleToggleStatus(row)}
            title={row.isActive ? 'Deactivate Account' : 'Activate Account'}
            disabled={row._id === currentUser?.id}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              row.isActive
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {row.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Role Management"
        subtitle="Manage authentication credentials, mobile/email sign-in access, roles, and status for administrators and workers."
        actions={
          <>
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
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create User Account
            </Button>
          </>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or mobile number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              placeholder="All Roles"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'admin', label: 'Administrator' },
                { value: 'user', label: 'Staff Worker' },
              ]}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'active', label: 'Active Only' },
                { value: 'false', label: 'Deactivated Only' },
              ]}
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Filter Accounts
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>System Accounts Directory ({users.length})</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely persisted in MongoDB with bcrypt hashing & role verification
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyTitle="No user accounts found"
            emptyDescription="Create an account to grant login access to an administrator or worker."
            emptyAction={
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Account
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New User Account"
        subtitle="Only administrators can create user credentials."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleCreateSubmit}
            >
              Create Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Anand Jadhav"
            value={createFormData.name}
            onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="user@kkbrothers.com"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
            />
            <Input
              label="Mobile Number (Login)"
              placeholder="e.g. 9812345678"
              value={createFormData.phone}
              onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Password"
              type="password"
              required
              placeholder="Min 6 characters"
              value={createFormData.password}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, password: e.target.value })
              }
            />
            <Select
              label="System Role"
              required
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
              options={[
                { value: 'user', label: 'Staff Worker (Duty & Pay)' },
                { value: 'admin', label: 'Administrator (Full Access)' },
              ]}
            />
          </div>

          {createFormData.role === 'user' && (
            <Select
              label="Link to Existing Staff Roster (Optional)"
              value={createFormData.staffProfileId}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, staffProfileId: e.target.value })
              }
              placeholder="-- Auto-create new staff profile --"
              options={staffList.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.staffCode} - ${s.designation})`,
              }))}
              helperText="If linked, this account will control duty entries for that worker."
            />
          )}
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Details"
        subtitle={`Editing account: ${selectedUser?.name}`}
        maxWidth="max-w-lg"
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
              Update Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <Input
              label="Mobile Number"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <Select
            label="System Role"
            required
            value={editFormData.role}
            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
            options={[
              { value: 'user', label: 'Staff Worker' },
              { value: 'admin', label: 'Administrator' },
            ]}
          />
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset User Password"
        subtitle={`Assign a new password for: ${selectedUser?.name} (${selectedUser?.email})`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsResetPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleResetPasswordSubmit}
            >
              Confirm Password Reset
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="The user will immediately be able to sign in with this new password."
          />
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
