import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dutyApi } from '../../api/dutyApi';
import { clientApi } from '../../api/clientApi';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Send,
  AlertCircle,
  Moon,
  ShieldCheck,
  Search,
  CheckCircle2,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AddDuty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    client: '',
    dutyDate: new Date().toISOString().slice(0, 10),
    inTime: '10:00',
    outTime: '18:00',
    hoursWorked: 8,
    isOvernight: false,
    location: '',
    remarks: '',
  });

  // Calculate hours and overnight shift dynamically with safe fallback
  const calcHours = (inT, outT) => {
    if (!inT || !outT || typeof inT !== 'string' || typeof outT !== 'string') {
      return { hours: 8, isOvernight: false };
    }
    const [inH, inM] = inT.split(':').map(Number);
    const [outH, outM] = outT.split(':').map(Number);
    if (isNaN(inH) || isNaN(outH)) {
      return { hours: 8, isOvernight: false };
    }
    let diff = outH * 60 + (outM || 0) - (inH * 60 + (inM || 0));
    let isOvernight = false;
    if (diff <= 0) {
      isOvernight = true;
      diff += 24 * 60;
    }
    return { hours: Math.round((diff / 60) * 10) / 10, isOvernight };
  };

  useEffect(() => {
    let isMounted = true;
    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const res = await clientApi.getAll({ status: 'active' });
        if (isMounted && res && res.success) {
          const list = Array.isArray(res.data) ? res.data : [];
          setClients(list);
          if (list.length > 0) {
            setFormData((prev) => ({
              ...prev,
              client: prev.client || list[0]._id,
            }));
          }
        }
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to load hotel & catering list');
        }
      } finally {
        if (isMounted) {
          setIsLoadingClients(false);
        }
      }
    };

    loadClients();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleInTimeChange = (val) => {
    const { hours, isOvernight } = calcHours(val, formData.outTime);
    setFormData((prev) => ({
      ...prev,
      inTime: val,
      hoursWorked: hours,
      isOvernight,
    }));
  };

  const handleOutTimeChange = (val) => {
    const { hours, isOvernight } = calcHours(formData.inTime, val);
    setFormData((prev) => ({
      ...prev,
      outTime: val,
      hoursWorked: hours,
      isOvernight,
    }));
  };

  // Safe client filtering
  const safeClients = Array.isArray(clients) ? clients.filter(Boolean) : [];
  const filteredClients = safeClients.filter((c) => {
    const q = (clientSearch || '').toLowerCase().trim();
    if (!q) return true;
    const name = (c?.companyName || '').toLowerCase();
    const city = (c?.city || '').toLowerCase();
    const type = (c?.type || '').toLowerCase();
    return name.includes(q) || city.includes(q) || type.includes(q);
  });

  const selectedClientDoc = safeClients.find((c) => c?._id === formData.client);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.client) {
      newErrors.client = 'Please select a Hotel or Catering company.';
    }
    if (!formData.location || formData.location.trim().length === 0) {
      newErrors.location = 'Please enter the work location/section (e.g. Banquet Hall A).';
    }
    if (!formData.dutyDate) {
      newErrors.dutyDate = 'Please select the duty date.';
    }
    if (!formData.inTime) {
      newErrors.inTime = 'In-time is required.';
    }
    if (!formData.outTime) {
      newErrors.outTime = 'Out-time is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Open Confirmation Modal
  const handleReviewClick = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmModal(true);
    } else {
      toast.error('Please fill in all required fields marked below.');
    }
  };

  // Step 2: Final Submit to API
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await dutyApi.create(formData);
      if (res && res.success) {
        setShowConfirmModal(false);
        toast.success(
          res.message || 'Duty slip submitted successfully! Pending Admin verification.'
        );
        navigate('/user/my-duties');
      } else {
        toast.error(res?.message || 'Failed to submit duty record');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit duty record');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-6">
      {/* Back button & Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/user/dashboard')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Add New Duty
          </h1>
          <p className="text-xs text-slate-500">Record your work shift at a hotel or caterer</p>
        </div>
      </div>

      <Card className="shadow-xs border border-slate-200/90 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleReviewClick} className="space-y-5">
            {/* 1. SELECT HOTEL / CATERING (Searchable dropdown / picker) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Select Hotel / Catering Establishment <span className="text-rose-500">*</span>
              </label>

              {/* Search bar inside dropdown selector */}
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search hotel or caterer by name or city..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              {isLoadingClients ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <LoadingSpinner size="sm" text="Loading hotel partners..." />
                </div>
              ) : (
                <select
                  required
                  value={formData.client}
                  onChange={(e) => {
                    setFormData({ ...formData, client: e.target.value });
                    if (errors.client) setErrors({ ...errors, client: null });
                  }}
                  className={`w-full text-sm font-medium rounded-xl border bg-white p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition cursor-pointer ${
                    errors.client ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                  }`}
                >
                  <option value="" disabled>
                    -- Select Hotel or Catering Company --
                  </option>
                  {filteredClients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.type} - {c.city || 'Indore'})
                    </option>
                  ))}
                </select>
              )}

              {errors.client && (
                <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.client}</span>
                </p>
              )}
            </div>

            {/* 2. ENTER PLACE / LOCATION */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Enter Place / Location / Section <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Ballroom, 2nd Floor Dining Hall, Main Kitchen"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    if (errors.location) setErrors({ ...errors, location: null });
                  }}
                  className={`w-full text-sm rounded-xl border bg-white pl-10 pr-3 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition ${
                    errors.location ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.location && (
                <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.location}</span>
                </p>
              )}
            </div>

            {/* 3. SELECT DUTY DATE */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                3. Select Duty Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={formData.dutyDate}
                  onChange={(e) => setFormData({ ...formData, dutyDate: e.target.value })}
                  className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* 4 & 5. SELECT IN TIME AND OUT TIME */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4 & 5. Shift Timings (In-Time & Out-Time) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    In Time
                  </span>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="time"
                      required
                      value={formData.inTime}
                      onChange={(e) => handleInTimeChange(e.target.value)}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white pl-9 pr-2 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Out Time
                  </span>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="time"
                      required
                      value={formData.outTime}
                      onChange={(e) => handleOutTimeChange(e.target.value)}
                      className="w-full text-sm font-medium rounded-xl border border-slate-300 bg-white pl-9 pr-2 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Working Hours Calculation Banner */}
              <div className="mt-2.5 p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>
                    Calculated Working Hours: <strong>{formData.hoursWorked} Hours</strong>
                  </span>
                </div>
                {formData.isOvernight && (
                  <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs">
                    <Moon className="w-3 h-3" /> Overnight Shift
                  </span>
                )}
              </div>
            </div>

            {/* 6. OPTIONAL NOTES */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                6. Notes / Event Specifics <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Mention function name, banquet supervisor, or other details..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full text-sm rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {/* Read-Only Wage Policy Transparency */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Wage Policy:</strong> Your daily wage is set according to your registered employee profile rate. Users cannot enter or modify payment amounts.
              </p>
            </div>

            {/* BIG SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Review & Submit Duty</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* CONFIRMATION SCREEN BEFORE SUBMISSION (MODAL) */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Duty Shift Details"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please double-check your duty details before submitting for approval:
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-800">
            <div className="flex justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-500">Venue:</span>
              <span className="font-bold text-slate-900">
                {selectedClientDoc?.companyName || 'Selected Venue'} ({selectedClientDoc?.type || 'Hotel'})
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-500">Location:</span>
              <span className="font-semibold text-slate-900">{formData.location || '—'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-500">Date:</span>
              <span className="font-semibold text-slate-900">
                {formData.dutyDate ? formatDate(formData.dutyDate) : 'Today'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-500">Shift Timings:</span>
              <span className="font-semibold text-slate-900">
                {formData.inTime} to {formData.outTime}
                {formData.isOvernight && (
                  <span className="text-purple-600 font-bold ml-1">🌙 (Next Day)</span>
                )}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Calculated Hours:</span>
              <span className="font-bold text-indigo-700 text-sm">
                {formData.hoursWorked} Hours
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              ✏️ Edit Details
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmSubmit}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddDuty;
