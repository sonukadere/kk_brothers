import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../api/paymentApi';
import { dutyApi } from '../../api/dutyApi';
import { formatDate } from '../../utils/dateUtils';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Wallet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Receipt,
  DollarSign,
  Printer,
  CalendarCheck,
  Building2,
  Calendar,
  Lock,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MyPayments = () => {
  const [balanceData, setBalanceData] = useState(null);
  const [duties, setDuties] = useState([]);
  const [paymentVouchers, setPaymentVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('duties'); // 'duties' or 'vouchers'
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [balRes, dutiesRes, payRes] = await Promise.all([
        paymentApi.getStaffBalance('my-balance'),
        dutyApi.getAll({ status: 'Approved' }),
        paymentApi.getStaffPayments(),
      ]);

      if (balRes.success) setBalanceData(balRes.data);
      if (dutiesRes.success) setDuties(dutiesRes.data || []);
      if (payRes.success) setPaymentVouchers(payRes.data || []);
    } catch (err) {
      toast.error('Failed to load your payment information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalEarnings = balanceData?.totalEarnings ?? 0;
  const totalPaid = balanceData?.totalPaid ?? 0;
  const remainingAmount = balanceData?.pendingAmount ?? Math.max(0, totalEarnings - totalPaid);

  const openReceipt = (voucher) => {
    setSelectedVoucher(voucher);
    setIsReceiptModalOpen(true);
  };

  // Helper for Payment Status Badge
  const renderPaymentBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'paid' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Paid
        </span>
      );
    }
    if (s === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Payments</h1>
          <p className="text-xs text-slate-500">
            Review your approved earnings, received payouts, and remaining balance
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* 3 PROMINENT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Earnings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Earnings
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              ₹{totalEarnings.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Approved shift earnings</p>
          </div>
        </div>

        {/* Amount Received (Green) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider">Amount Received</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700">
              ₹{totalPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Disbursed to Bank / UPI</p>
          </div>
        </div>

        {/* Remaining Amount (Red / Rose) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-xs font-bold uppercase tracking-wider">Remaining Amount</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-rose-600">
              ₹{remainingAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Balance due to be settled</p>
          </div>
        </div>
      </div>

      {/* READ-ONLY WORKER NOTICE */}
      <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          Payment records are officially recorded by the administration. Workers cannot alter or edit payment amounts.
        </span>
      </div>

      {/* TABS: DUTY BREAKDOWN vs PAYMENT VOUCHERS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('duties')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'duties'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Duty Payment Breakdown ({duties.length})
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Received Payout Vouchers ({paymentVouchers.length})
        </button>
      </div>

      {/* CONTENT: DUTY PAYMENT BREAKDOWN */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" text="Loading payments ledger..." />
        </div>
      ) : activeTab === 'duties' ? (
        duties.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 text-xs">
            No approved duties available for payment tracking yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {/* MOBILE CARDS (md:hidden) */}
            <div className="md:hidden space-y-3">
              {duties.map((duty) => {
                const totalEarning = duty.staffWage || 0;
                const status = (duty.paymentStatus || 'Pending').toLowerCase();
                const paid = status === 'paid' ? totalEarning : 0;
                const remaining = totalEarning - paid;

                return (
                  <div
                    key={duty._id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {duty.client?.companyName}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {formatDate(duty.dutyDate)}
                          </span>
                        </div>
                      </div>
                      <div>{renderPaymentBadge(duty.paymentStatus)}</div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-slate-50">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Total Earning
                        </span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                          ₹{totalEarning.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-50/60">
                        <span className="text-[10px] text-emerald-600 uppercase block font-semibold">
                          Paid Amount
                        </span>
                        <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                          ₹{paid.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-rose-50/60">
                        <span className="text-[10px] text-rose-600 uppercase block font-semibold">
                          Remaining
                        </span>
                        <span className="text-xs font-bold text-rose-600 mt-0.5 block">
                          ₹{remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE (hidden md:block) */}
            <div className="hidden md:block">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Hotel / Catering Name</th>
                        <th className="py-3 px-4">Duty Date</th>
                        <th className="py-3 px-4 text-right">Total Earning</th>
                        <th className="py-3 px-4 text-right">Paid Amount</th>
                        <th className="py-3 px-4 text-right">Remaining Amount</th>
                        <th className="py-3 px-4 text-center">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {duties.map((duty) => {
                        const totalEarning = duty.staffWage || 0;
                        const status = (duty.paymentStatus || 'Pending').toLowerCase();
                        const paid = status === 'paid' ? totalEarning : 0;
                        const remaining = totalEarning - paid;

                        return (
                          <tr key={duty._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {duty.client?.companyName}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {formatDate(duty.dutyDate)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              ₹{totalEarning.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                              ₹{paid.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-rose-600">
                              ₹{remaining.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {renderPaymentBadge(duty.paymentStatus)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      ) : (
        /* VOUCHERS LIST */
        paymentVouchers.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 text-xs">
            No wage disbursal vouchers issued yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {paymentVouchers.map((v) => (
              <div
                key={v._id}
                onClick={() => openReceipt(v)}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-700">
                    {v.paymentVoucherNo || v.paymentId || 'VOUCHER'}
                  </span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Mode: <span className="font-semibold text-slate-800">{v.paymentMethod || v.paymentMode}</span> •{' '}
                    {formatDate(v.paymentDate)}
                  </div>
                  {v.transactionReference && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Ref: {v.transactionReference}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-emerald-700">
                    ₹{(v.paidAmount || v.amount || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold inline-block mt-0.5">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* RECEIPT VIEW MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Wage Disbursal Voucher"
        size="md"
      >
        {selectedVoucher && (
          <div className="space-y-4 text-xs text-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Voucher No:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedVoucher.paymentVoucherNo || selectedVoucher.paymentId}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Disbursed Date:</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(selectedVoucher.paymentDate)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-900">
                  {selectedVoucher.paymentMethod || selectedVoucher.paymentMode}
                </span>
              </div>
              {selectedVoucher.transactionReference && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono text-slate-900">
                    {selectedVoucher.transactionReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 text-sm font-bold">
                <span className="text-slate-700">Amount Paid:</span>
                <span className="text-emerald-700">
                  ₹{(selectedVoucher.paidAmount || selectedVoucher.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Voucher
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyPayments;
