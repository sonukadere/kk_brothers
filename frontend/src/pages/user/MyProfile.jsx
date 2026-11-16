import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { User, Phone, Mail, CreditCard, Shield, Save, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export const MyProfile = () => {
  const { user, refreshUser } = useAuth();
  const staffProfile = user?.staffProfile || {};

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({ name, phone });
      if (res.success) {
        toast.success('Profile updated successfully!');
        refreshUser();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authApi.updatePassword({ currentPassword, newPassword });
      if (res.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="My Profile & Settings"
        subtitle="Manage your personal details, emergency contact, and bank settlement preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Worker Badge Card */}
        <Card className="p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 border-2 border-indigo-200 flex items-center justify-center font-bold text-2xl mx-auto uppercase mb-4 shadow-sm">
            {user?.name ? user.name.slice(0, 2) : 'KK'}
          </div>
          <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <StatusBadge status={staffProfile.designation || 'Staff Worker'} />
            <Badge variant="success" dot>
              Active Roster
            </Badge>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Staff Code:</span>
              <span className="font-mono font-semibold text-slate-800">
                {staffProfile.staffCode || 'STF-0001'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Default Rate:</span>
              <span className="font-semibold text-indigo-700">
                ₹{staffProfile.defaultDailyRate || 600} / shift
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ID Proof:</span>
              <span className="font-medium text-slate-800">
                {staffProfile.idProofType || 'Aadhaar'} ({staffProfile.idProofNumber || '•••'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UPI Id:</span>
              <span className="font-mono text-emerald-700 font-semibold">
                {staffProfile.bankDetails?.upiId || 'Not submitted'}
              </span>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Phone Number"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                  helperText="Wages notification SMS and WhatsApp will be sent to this phone."
                />

                <Input
                  label="Email Address"
                  disabled
                  value={user?.email || ''}
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="Email is managed by the system administrator."
                />

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Personal Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Current Password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="md"
                    isLoading={isChangingPassword}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
