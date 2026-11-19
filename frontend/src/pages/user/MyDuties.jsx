import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dutyApi } from '../../api/dutyApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { StatusBadge, Badge } from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import {
  CalendarCheck,
  Plus,
  RefreshCw,
  Clock,
  Building2,
  Moon,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MyDuties = () => {
  const [duties, setDuties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadDuties = async () => {
    setIsLoading(true);
    try {
      const res = await dutyApi.getAll({ status: statusFilter || undefined });
      if (res.success) {
        setDuties(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load your duty records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDuties();
  }, [statusFilter]);

  const openDetails = (duty) => {
    setSelectedDuty(duty);
    setIsDetailsModalOpen(true);
  };

  const filterTabs = [
    { label: 'All', value: '' },
    { label: 'Pending Approval', value: 'Pending Approval' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Completed', value: 'Completed' },
  ];

  // Desktop Table Columns
  const columns = [
    {
      header: 'Duty Slip #',
      key: 'dutySlipNumber',
      render: (val, row) => (
        <span
          onClick={() => openDetails(row)}
          className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline"
        >
          {val || row.dutyId || '—'}
        </span>
      ),
    },
    {
      header: 'Hotel / Caterer Client',
      key: 'client',
      render: (client, row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{client?.companyName}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{row.location || 'Main Venue'}</span>
          </div>
        </div>
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
      header: 'Shift & Hours',
      key: 'hoursWorked',
      render: (val, row) => (
        <div>
          <div className="text-xs font-mono font-semibold text-slate-800 flex items-center gap-1">
            {row.inTime || '09:00'} - {row.outTime || '18:00'}
            {row.isOvernight && (
              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5">
                <Moon className="w-2.5 h-2.5" /> Overnight
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{val} hours</div>
        </div>
      ),
    },
    {
      header: 'Wages Due',
      key: 'staffWage',
      render: (val) => (
        <span className="text-xs font-bold text-slate-900">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Approval Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Action',
      key: '_id',
      render: (_, row) => (
        <Button size="sm" variant="outline" onClick={() => openDetails(row)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Duties</h1>
          <p className="text-xs text-slate-500">Track all your submitted shifts and verification status</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadDuties}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/user/add-duty')}
          >
            + Add Duty
          </Button>
        </div>
      </div>

      {/* FILTER TABS (All, Pending Approval, Approved, Completed) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" text="Loading duty records..." />
        </div>
      ) : duties.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No duty records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {statusFilter
              ? `You have no duties with status '${statusFilter}'.`
              : "You haven't logged any shifts yet. Tap below to submit your first duty."}
          </p>
          <div className="mt-4">
            <Button size="sm" variant="primary" onClick={() => navigate('/user/add-duty')}>
              + Add Duty Now
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* MOBILE VIEW: SIMPLE CARDS (md:hidden) */}
          <div className="md:hidden space-y-3">
            {duties.map((duty) => (
              <div
                key={duty._id}
                onClick={() => openDetails(duty)}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs active:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {duty.client?.companyName || 'Hotel / Catering'}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{duty.location || 'Main Section'}</span>
                    </div>
                  </div>
                  <StatusBadge status={duty.status} />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(duty.dutyDate)}
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-slate-900">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {duty.inTime} - {duty.outTime} ({duty.hoursWorked}h)
                    {duty.isOvernight && <span className="text-purple-600 font-bold">🌙</span>}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400 font-medium">
                    {duty.dutySlipNumber || duty.dutyId || 'SLIP'}
                  </span>
                  <div className="flex items-center gap-1 text-indigo-600 text-xs font-semibold">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: CLEAN TABLE (hidden md:block) */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table columns={columns} data={duties} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* DUTY DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Duty Slip Details"
        size="md"
      >
        {selectedDuty && (
          <div className="space-y-4 text-xs text-slate-700">
            {/* Header Badge Strip */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Slip Number</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {selectedDuty.dutySlipNumber || selectedDuty.dutyId}
                </span>
              </div>
              <StatusBadge status={selectedDuty.status} />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-400 block">Hotel / Caterer</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedDuty.client?.companyName}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedDuty.client?.type} • {selectedDuty.client?.city}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Duty Date</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {formatDate(selectedDuty.dutyDate)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Shift Timing</span>
                <span className="font-semibold text-slate-900">
                  {selectedDuty.inTime} to {selectedDuty.outTime}
                </span>
                {selectedDuty.isOvernight && (
                  <span className="text-[10px] text-purple-600 font-bold block">
                    🌙 Overnight (Next Day Out)
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Total Hours</span>
                <span className="font-bold text-indigo-700 text-sm">
                  {selectedDuty.hoursWorked} Hours
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Work Location</span>
                <span className="font-medium text-slate-800">{selectedDuty.location || '—'}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Daily Wage Rate</span>
                <span className="font-bold text-emerald-700 text-sm">
                  ₹{(selectedDuty.staffWage || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Remarks / Notes */}
            {selectedDuty.remarks && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Notes
                </span>
                <p className="text-slate-800 leading-relaxed">{selectedDuty.remarks}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyDuties;
