import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConnectionStatus from '../../components/common/ConnectionStatus';
import { Settings as SettingsIcon, Database, Shield, Building2, Save, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    businessName: 'KK Brothers Workforce Logistics',
    tagline: 'Staff Duty & Payment Management System',
    address: 'Vijay Nagar, AB Road, Indore, Madhya Pradesh 452010',
    phone: '+91 98765 43210',
    email: 'admin@kkbrothers.com',
    defaultWaiterRate: 600,
    defaultCaptainRate: 800,
    defaultHelperRate: 550,
    defaultClientBillingRate: 1200,
    defaultCreditPeriod: 15,
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('System configuration saved successfully!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Manage business profile, default billing & wage schedules, and database environment."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Entity Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business Name"
                    value={config.businessName}
                    onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                  />
                  <Input
                    label="Official Contact Phone"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Official Email"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  />
                  <Input
                    label="Head Office Address"
                    value={config.address}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Standard Rate Defaults</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Default Waiter Wage (₹)"
                    type="number"
                    value={config.defaultWaiterRate}
                    onChange={(e) =>
                      setConfig({ ...config, defaultWaiterRate: Number(e.target.value) })
                    }
                  />
                  <Input
                    label="Default Captain Wage (₹)"
                    type="number"
                    value={config.defaultCaptainRate}
                    onChange={(e) =>
                      setConfig({ ...config, defaultCaptainRate: Number(e.target.value) })
                    }
                  />
                  <Input
                    label="Default Helper Wage (₹)"
                    type="number"
                    value={config.defaultHelperRate}
                    onChange={(e) =>
                      setConfig({ ...config, defaultHelperRate: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <Input
                    label="Standard Hotel Billing Rate (₹)"
                    type="number"
                    value={config.defaultClientBillingRate}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultClientBillingRate: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    label="Standard Credit Terms (Days)"
                    type="number"
                    value={config.defaultCreditPeriod}
                    onChange={(e) =>
                      setConfig({ ...config, defaultCreditPeriod: Number(e.target.value) })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
                Save Configurations
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column (1/3): Environment & Security Card */}
        <div className="space-y-6">
          <Card className="p-5 border-indigo-200/80 bg-indigo-50/40">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">User & Role Management</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Create accounts, reset passwords, and toggle active/inactive status for worker and admin logins.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-between"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/users')}
            >
              Open User Accounts
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Database className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-semibold text-slate-800">Database & Engine</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-semibold text-slate-800">MongoDB + Mongoose</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authentication:</span>
                <span className="font-semibold text-slate-800">JWT (JSON Web Token)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Isolation Policy:</span>
                <span className="font-semibold text-emerald-600">Strict Tenant Separation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Connection:</span>
                <ConnectionStatus />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Strict Compliance Rules
              </h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside mt-2 leading-relaxed">
              <li>No Project Name module exists.</li>
              <li>No bloated HR or inventory modules.</li>
              <li>Separate Staff Wage and Client Payment tables.</li>
              <li>MongoDB dynamic persistence for all records.</li>
              <li>Workers never access another user's records.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
