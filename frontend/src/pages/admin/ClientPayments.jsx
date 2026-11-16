import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../api/paymentApi';
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
  Receipt,
  Plus,
  RefreshCw,
  Building2,
  UtensilsCrossed,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Users,
  Printer,
  Calendar,
  Eye,
  CheckSquare,
  Square,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ClientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]);
  const [clients, setClients] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receipts'); // 'receipts' | 'bills' | 'ledger' | 'report'

  // Summary state
  const [summary, setSummary] = useState({
    totalReceived: 0,
    totalBilled: 0,
    totalOutstanding: 0,
    hotelCollections: 0,
    cateringCollections: 0,
  });

  // Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');

  // Modals state
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isBillDetailsModalOpen, setIsBillDetailsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active view objects
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [currentBillDetails, setCurrentBillDetails] = useState(null);

  // Form state: Record Payment
  const [paymentForm, setPaymentForm] = useState({
    client: '',
    bill: '',
    receivedAmount: '',
    paymentMethod: 'Bank Transfer',
    transactionReference: '',
    invoiceNumber: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Client's pending bills when client is selected in payment modal
  const [clientPendingBills, setClientPendingBills] = useState([]);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);

  // Form state: Create Bill from Unbilled Duties
  const [billForm, setBillForm] = useState({
    client: '',
    selectedDutyIds: [],
    dueDate: '',
    notes: '',
  });
  const [unbilledDuties, setUnbilledDuties] = useState([]);
  const [isLoadingDuties, setIsLoadingDuties] = useState(false);

  // Load all data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [payRes, billRes, clientRes, repRes] = await Promise.all([
        paymentApi.getClientPayments({
          search: search || undefined,
          businessType: typeFilter || undefined,
          status: statusFilter || undefined,
          client: selectedClientFilter || undefined,
        }),
        paymentApi.getClientBills({
          search: search || undefined,
          businessType: typeFilter || undefined,
        }),
        clientApi.getAll(),
        paymentApi.getClientReport(),
      ]);

      if (payRes.success) {
        setPayments(payRes.data);
        if (payRes.summary) setSummary(payRes.summary);
      }

      if (billRes.success) {
        setBills(billRes.data);
      }

      if (clientRes.success) {
        setClients(clientRes.data);
      }

      if (repRes.success) {
        setReportData(repRes);
      }
    } catch (err) {
      toast.error('Failed to load client payments and billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, selectedClientFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setSelectedClientFilter('');
    setTimeout(() => {
      paymentApi.getClientPayments().then((res) => {
        if (res.success) setPayments(res.data);
      });
    }, 0);
  };

  // When Client changes in Record Payment Modal
  const handlePaymentClientChange = async (clientId) => {
    setPaymentForm((prev) => ({
      ...prev,
      client: clientId,
      bill: '',
      receivedAmount: '',
      invoiceNumber: '',
    }));
    setSelectedBillForPayment(null);

    if (!clientId) {
      setClientPendingBills([]);
      return;
    }

    try {
      const res = await paymentApi.getClientBills({ client: clientId });
      if (res.success) {
        const pending = res.data.filter((b) => b.status !== 'Paid');
        setClientPendingBills(pending);
      }
    } catch (err) {
      toast.error('Failed to load client bills');
    }
  };

  // When Bill changes in Record Payment Modal
  const handlePaymentBillChange = (billId) => {
    setPaymentForm((prev) => ({ ...prev, bill: billId }));
    const b = clientPendingBills.find((item) => item._id === billId);
    if (b) {
      setSelectedBillForPayment(b);
      setPaymentForm((prev) => ({
        ...prev,
        bill: billId,
        invoiceNumber: b.billNumber,
        receivedAmount: b.remainingAmount > 0 ? b.remainingAmount : '',
      }));
    } else {
      setSelectedBillForPayment(null);
    }
  };

  // When Client changes in Create Bill Modal
  const handleBillClientChange = async (clientId) => {
    setBillForm((prev) => ({ ...prev, client: clientId, selectedDutyIds: [] }));
    if (!clientId) {
      setUnbilledDuties([]);
      return;
    }

    setIsLoadingDuties(true);
    try {
      const res = await paymentApi.getUnbilledDuties(clientId);
      if (res.success) {
        setUnbilledDuties(res.data);
      }
    } catch (err) {
      toast.error('Failed to load completed duties for this client');
    } finally {
      setIsLoadingDuties(false);
    }
  };

  // Toggle selection of duty for billing
  const toggleDutySelection = (dutyId) => {
    setBillForm((prev) => {
      const exists = prev.selectedDutyIds.includes(dutyId);
      const newIds = exists
        ? prev.selectedDutyIds.filter((id) => id !== dutyId)
        : [...prev.selectedDutyIds, dutyId];
      return { ...prev, selectedDutyIds: newIds };
    });
  };

  const selectAllDuties = () => {
    if (billForm.selectedDutyIds.length === unbilledDuties.length) {
      setBillForm((prev) => ({ ...prev, selectedDutyIds: [] }));
    } else {
      setBillForm((prev) => ({
        ...prev,
        selectedDutyIds: unbilledDuties.map((d) => d._id),
      }));
    }
  };

  // Open Payment Modal prefilled for client or bill
  const openPaymentForClient = (clientId, billId = null) => {
    setPaymentForm({
      client: clientId,
      bill: billId || '',
      receivedAmount: '',
      paymentMethod: 'Bank Transfer',
      transactionReference: '',
      invoiceNumber: '',
      receivedDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setIsAddPaymentModalOpen(true);
    handlePaymentClientChange(clientId);
  };

  // Open Receipt Modal
  const openReceiptModal = async (paymentId) => {
    try {
      const res = await paymentApi.getClientPaymentById(paymentId);
      if (res.success) {
        setCurrentReceipt(res.receipt);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load client receipt voucher');
    }
  };

  // Open Bill Details Modal
  const openBillDetailsModal = async (billId) => {
    try {
      const res = await paymentApi.getClientBillById(billId);
      if (res.success) {
        setCurrentBillDetails(res.data);
        setIsBillDetailsModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load bill details');
    }
  };

  // Submit Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.client || !paymentForm.receivedAmount || Number(paymentForm.receivedAmount) <= 0) {
      toast.error('Client and positive payment amount are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentApi.createClientPayment(paymentForm);
      if (res.success) {
        toast.success(res.message || 'Client payment recorded successfully!');
        setIsAddPaymentModalOpen(false);
        setPaymentForm({
          client: '',
          bill: '',
          receivedAmount: '',
          paymentMethod: 'Bank Transfer',
          transactionReference: '',
          invoiceNumber: '',
          receivedDate: new Date().toISOString().slice(0, 10),
          notes: '',
        });
        setSelectedBillForPayment(null);
        loadData();

        if (res.data?._id) {
          openReceiptModal(res.data._id);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Bill Creation
  const handleCreateBillSubmit = async (e) => {
    e.preventDefault();
    if (!billForm.client || billForm.selectedDutyIds.length === 0) {
      toast.error('Please select an establishment and at least one completed duty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentApi.createClientBill({
        client: billForm.client,
        duties: billForm.selectedDutyIds,
        dueDate: billForm.dueDate || undefined,
        notes: billForm.notes || undefined,
      });

      if (res.success) {
        toast.success(res.message || 'Client bill generated successfully!');
        setIsCreateBillModalOpen(false);
        setBillForm({
          client: '',
          selectedDutyIds: [],
          dueDate: '',
          notes: '',
        });
        setUnbilledDuties([]);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Sum of selected duties in bill creation modal
  const selectedDutiesTotal = unbilledDuties
    .filter((d) => billForm.selectedDutyIds.includes(d._id))
    .reduce((sum, d) => sum + (d.clientBillingAmount || 0), 0);

  // Tab 1: Receipts Columns
  const receiptColumns = [
    {
      header: 'Receipt #',
      key: 'receiptNo',
      render: (val, row) => (
        <div>
          <span
            onClick={() => openReceiptModal(row._id)}
            className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline decoration-indigo-200"
          >
            {val || row.clientPaymentId || '—'}
          </span>
          <div className="text-[10px] text-slate-400 font-mono">
            Inv: {row.invoiceNumber || row.bill?.billNumber || 'Direct'}
          </div>
        </div>
      ),
    },
    {
      header: 'Establishment / Partner',
      key: 'client',
      render: (client) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1">
            {client?.type === 'Catering' || client?.type === 'Catering Company' ? (
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>{client?.companyName}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {client?.city || 'Mumbai'} • {client?.type}
          </div>
        </div>
      ),
    },
    {
      header: 'Total Bill Amount',
      key: 'totalBillAmount',
      render: (val, row) => (
        <span className="text-xs font-semibold text-slate-800">
          ₹{(val || row.bill?.totalBillAmount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Received Amount',
      key: 'receivedAmount',
      render: (val, row) => (
        <span className="text-sm font-bold text-emerald-700">
          ₹{(val ?? row.amount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Remaining Balance',
      key: 'remainingAmount',
      render: (val, row) => {
        const rem = val ?? row.bill?.remainingAmount ?? 0;
        return (
          <span
            className={`text-xs font-bold ${
              rem > 0 ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded' : 'text-slate-500'
            }`}
          >
            ₹{rem.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Payment Method',
      key: 'paymentMethod',
      render: (val, row) => {
        const method = val || row.paymentMode || 'Bank Transfer';
        return (
          <Badge variant="neutral" size="sm">
            {method}
          </Badge>
        );
      },
    },
    {
      header: 'Txn / UTR #',
      key: 'transactionReference',
      render: (val) => (
        <span className="font-mono text-[11px] text-slate-600 truncate max-w-[120px] block" title={val}>
          {val || 'Direct Deposit'}
        </span>
      ),
    },
    {
      header: 'Received Date',
      key: 'receivedDate',
      render: (val, row) => (
        <span className="text-xs text-slate-500">
          {val || row.paymentDate
            ? new Date(val || row.paymentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'paymentStatus',
      render: (val, row) => <StatusBadge status={val || row.status} />,
    },
    {
      header: 'Receipt',
      key: '_id',
      align: 'right',
      render: (id) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Receipt className="w-3.5 h-3.5" />}
          onClick={() => openReceiptModal(id)}
        >
          View Receipt
        </Button>
      ),
    },
  ];

  // Tab 2: Client Bills Columns
  const billColumns = [
    {
      header: 'Invoice #',
      key: 'billNumber',
      render: (val, row) => (
        <div>
          <span
            onClick={() => openBillDetailsModal(row._id)}
            className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline decoration-indigo-200"
          >
            {val}
          </span>
          <div className="text-[10px] text-slate-400">
            {row.duties?.length || row.totalDuties || 0} shifts included
          </div>
        </div>
      ),
    },
    {
      header: 'Client Establishment',
      key: 'client',
      render: (client) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{client?.companyName}</div>
          <div className="text-[11px] text-slate-500">{client?.type}</div>
        </div>
      ),
    },
    {
      header: 'Bill Date',
      key: 'billDate',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val ? new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Total Bill (₹)',
      key: 'totalBillAmount',
      render: (val) => (
        <span className="text-xs font-bold text-slate-900">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Received (₹)',
      key: 'totalReceivedAmount',
      render: (val) => (
        <span className="text-xs font-bold text-emerald-700">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Remaining Amount (₹)',
      key: 'remainingAmount',
      render: (val) => {
        const rem = val || 0;
        return (
          <span
            className={`text-sm font-bold ${
              rem > 0
                ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                : 'text-slate-500'
            }`}
          >
            ₹{rem.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Bill Status',
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
            title="View Bill Details & Duties"
            onClick={() => openBillDetailsModal(id)}
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          </Button>

          {row.remainingAmount > 0 && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3 h-3" />}
              onClick={() => openPaymentForClient(row.client?._id, id)}
            >
              Collect
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Tab 3: Outstanding Ledger Columns (Hotel-Wise & Catering-Wise)
  const ledgerColumns = [
    {
      header: 'Client Establishment',
      key: 'companyName',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
            {row.type?.toLowerCase().includes('catering') ? (
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>{val}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {row.businessId} • {row.city}
          </div>
        </div>
      ),
    },
    {
      header: 'Business Category',
      key: 'type',
      render: (val) => {
        const isCatering = val?.toLowerCase().includes('catering');
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
          <div className="text-xs font-medium text-slate-800">{val}</div>
          <div className="text-[11px] text-slate-500 font-mono">{row.phone}</div>
        </div>
      ),
    },
    {
      header: 'Duties Completed',
      key: 'totalDuties',
      render: (val) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {val || 0} shifts
        </span>
      ),
    },
    {
      header: 'Total Bill Amount',
      key: 'totalBill',
      render: (val) => (
        <span className="text-xs font-bold text-slate-900">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Total Received',
      key: 'totalReceived',
      render: (val) => (
        <span className="text-xs font-bold text-emerald-700">₹{(val || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Remaining Amount (Due)',
      key: 'remainingAmount',
      render: (val) => {
        const pending = val || 0;
        return (
          <span
            className={`text-sm font-bold ${
              pending > 0
                ? 'text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100'
                : 'text-slate-500 bg-slate-50 px-2 py-0.5 rounded'
            }`}
          >
            ₹{pending.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'paymentStatus',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Actions',
      key: 'clientId',
      align: 'right',
      render: (clientId, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreateBillModalOpen(true);
              handleBillClientChange(clientId);
            }}
          >
            Create Bill
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openPaymentForClient(clientId)}
          >
            Record Payment
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hotel & Catering Client Payments"
        subtitle="Manage client receivables, generate duty invoices, record settlements, and track outstanding balances."
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
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={() => setIsCreateBillModalOpen(true)}
            >
              Create Client Bill
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddPaymentModalOpen(true)}
            >
              Record Payment Receipt
            </Button>
          </div>
        }
      />

      {/* 5 Financial & Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Client Inflows"
          value={`₹${(summary.totalReceived || 0).toLocaleString()}`}
          subtitle="Cleared collections"
          icon={DollarSign}
          color="emerald"
          badgeText="Received"
        />

        <StatCard
          title="Total Billed Revenue"
          value={`₹${(summary.totalBilled || 0).toLocaleString()}`}
          subtitle="Cumulative duty charges"
          icon={Receipt}
          color="indigo"
          badgeText="Billed"
        />

        <StatCard
          title="Outstanding Balance"
          value={`₹${(summary.totalOutstanding || 0).toLocaleString()}`}
          subtitle="Pending receivables"
          icon={AlertCircle}
          color={summary.totalOutstanding > 0 ? 'amber' : 'emerald'}
          badgeText={summary.totalOutstanding > 0 ? 'Outstanding' : 'All Settled'}
        />

        <StatCard
          title="Hotel Collections"
          value={`₹${(summary.hotelCollections || 0).toLocaleString()}`}
          subtitle="Hospitality clients"
          icon={Building2}
          color="sky"
          badgeText="Hotels"
        />

        <StatCard
          title="Catering Collections"
          value={`₹${(summary.cateringCollections || 0).toLocaleString()}`}
          subtitle="Banquet & event clients"
          icon={UtensilsCrossed}
          color="purple"
          badgeText="Catering"
        />
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('receipts')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'receipts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Payment Receipts Ledger ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'bills'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Client Bills ({bills.length})
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Outstanding Balances ({reportData?.data?.length || clients.length})
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'report'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Revenue & Aging Report
          </button>
        </nav>
      </div>

      {/* Tab 1: Payment Receipts Ledger */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <Card className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by client name, receipt #, invoice #, or UTR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="w-full sm:w-44">
                <Select
                  placeholder="All Categories"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Categories' },
                    { value: 'Hotel', label: 'Hotels' },
                    { value: 'Catering', label: 'Catering Companies' },
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
                    { value: 'Paid', label: 'Paid (Full)' },
                    { value: 'Partial', label: 'Partial Payment' },
                    { value: 'Received', label: 'Received' },
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

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Client Payment Receipts ({payments.length})</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculation rule: Remaining Amount = Total Bill Amount - Total Received Amount
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={receiptColumns}
                data={payments}
                isLoading={isLoading}
                emptyTitle="No client payments logged"
                emptyDescription="Record settlements received from hotel or catering clients."
                emptyAction={
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsAddPaymentModalOpen(true)}
                  >
                    Record First Payment
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Client Bills (Generated from Duties) */}
      {activeTab === 'bills' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Client Invoices / Bills ({bills.length})</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Bills generated from verified duties. Multiple payment transactions can be recorded against one bill.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateBillModalOpen(true)}
            >
              Generate New Bill
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={billColumns}
              data={bills}
              isLoading={isLoading}
              emptyTitle="No client bills generated yet"
              emptyDescription="Bundle approved worker shifts into formal invoices for client billing."
              emptyAction={
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsCreateBillModalOpen(true)}
                >
                  Create First Bill
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Outstanding Balances (Hotel-Wise & Catering-Wise) */}
      {activeTab === 'ledger' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Client Accounts & Outstanding Balances</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Hotel-wise and Catering-wise payment status tracking total bill, received, and remaining dues.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={typeFilter === '' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('')}
              >
                All Clients
              </Button>
              <Button
                variant={typeFilter === 'Hotel' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('Hotel')}
              >
                Hotels Only
              </Button>
              <Button
                variant={typeFilter === 'Catering' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('Catering')}
              >
                Catering Only
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={ledgerColumns}
              data={
                reportData?.data?.filter((c) => {
                  if (!typeFilter) return true;
                  if (typeFilter === 'Catering') return (c.type || '').toLowerCase().includes('catering');
                  return c.type === typeFilter;
                }) || []
              }
              isLoading={isLoading}
              emptyTitle="No client records found"
              emptyDescription="Clients registered in the system will appear here with their balances."
            />
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Revenue & Aging Report */}
      {activeTab === 'report' && reportData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Commercial Revenue & Aging Report</h3>
              <p className="text-xs text-slate-500">
                Generated from live MongoDB collections for KK Brothers Staff Management
              </p>
            </div>
            <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Print Commercial Report
            </Button>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hotels Card */}
            <Card className="p-5 space-y-3 bg-sky-50/40 border-sky-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-600" /> Hotel Sector Collections
                </span>
                <Badge variant="sky" size="sm">Hotels & Banquets</Badge>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Billed to Hotels:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{reportData.summary?.hotels?.billed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Received from Hotels:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{reportData.summary?.hotels?.received.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-sky-200 font-bold">
                  <span className="text-sky-950">Outstanding Balance:</span>
                  <span className="text-amber-700">
                    ₹{reportData.summary?.hotels?.outstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Catering Card */}
            <Card className="p-5 space-y-3 bg-purple-50/40 border-purple-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-purple-600" /> Catering Sector Collections
                </span>
                <Badge variant="purple" size="sm">Catering Companies</Badge>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Billed to Catering:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{reportData.summary?.catering?.billed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Received from Catering:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{reportData.summary?.catering?.received.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-purple-200 font-bold">
                  <span className="text-purple-950">Outstanding Balance:</span>
                  <span className="text-amber-700">
                    ₹{reportData.summary?.catering?.outstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Ledger Table */}
          <Card>
            <CardHeader>
              <CardTitle>Client Ledger Statement</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table columns={ledgerColumns} data={reportData.data} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal 1: Record Client Payment */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="Record Hotel / Catering Payment Receipt"
        subtitle="Log settlement receipt from a client establishment."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsAddPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handlePaymentSubmit}
            >
              Confirm Receipt & Issue Voucher
            </Button>
          </>
        }
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <Select
            label="Client Establishment"
            required
            placeholder="Select hotel or catering client..."
            value={paymentForm.client}
            onChange={(e) => handlePaymentClientChange(e.target.value)}
            options={clients.map((c) => ({
              value: c._id,
              label: `${c.companyName} (${c.type} - ${c.city})`,
            }))}
          />

          {/* Link to specific bill if exists */}
          {clientPendingBills.length > 0 && (
            <Select
              label="Apply to Specific Invoice / Bill (Optional)"
              placeholder="Direct client deposit (General)"
              value={paymentForm.bill}
              onChange={(e) => handlePaymentBillChange(e.target.value)}
              options={[
                { value: '', label: 'Direct client deposit (General balance)' },
                ...clientPendingBills.map((b) => ({
                  value: b._id,
                  label: `${b.billNumber} (Billed: ₹${b.totalBillAmount.toLocaleString()} • Due: ₹${b.remainingAmount.toLocaleString()})`,
                })),
              ]}
            />
          )}

          {/* Bill preview calculation */}
          {selectedBillForPayment && (
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs space-y-1 text-indigo-900">
              <div className="flex justify-between">
                <span>Invoice Total:</span>
                <span className="font-semibold">₹{selectedBillForPayment.totalBillAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Previously Received:</span>
                <span className="font-semibold text-emerald-700">₹{selectedBillForPayment.totalReceivedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-indigo-200 font-bold">
                <span>Outstanding on this Invoice:</span>
                <span className="text-amber-800">₹{selectedBillForPayment.remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount Received (₹)"
              type="number"
              required
              placeholder="e.g. 12000"
              value={paymentForm.receivedAmount}
              onChange={(e) => setPaymentForm({ ...paymentForm, receivedAmount: e.target.value })}
            />
            <Select
              label="Payment Method"
              required
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              options={[
                { value: 'Bank Transfer', label: 'Bank Transfer (IMPS / NEFT)' },
                { value: 'NEFT / RTGS', label: 'NEFT / RTGS' },
                { value: 'UPI', label: 'UPI (Corporate)' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Cash', label: 'Cash (Hand Settlement)' },
                { value: 'Direct Bank Deposit', label: 'Direct Bank Deposit' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Invoice Number / Reference"
              placeholder="e.g. INV-202611-0001"
              value={paymentForm.invoiceNumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, invoiceNumber: e.target.value })}
            />
            <Input
              label="Bank Reference / UTR #"
              placeholder="HDFCN000... / Cheque #"
              value={paymentForm.transactionReference}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
            />
          </div>

          <Input
            label="Payment Date Credited"
            type="date"
            required
            value={paymentForm.receivedDate}
            onChange={(e) => setPaymentForm({ ...paymentForm, receivedDate: e.target.value })}
          />

          <Input
            label="Notes / Settlement Specifics"
            placeholder="e.g. Partial settlement for wedding banquet shifts at Royal Hall"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Modal 2: Create Bill from Completed Duties */}
      <Modal
        isOpen={isCreateBillModalOpen}
        onClose={() => setIsCreateBillModalOpen(false)}
        title="Create Client Bill from Completed Duties"
        subtitle="Bundle verified worker duty slips into a formal invoice. Duties cannot be billed twice."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCreateBillModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleCreateBillSubmit}
              disabled={billForm.selectedDutyIds.length === 0}
            >
              Generate Bill (₹{selectedDutiesTotal.toLocaleString()})
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBillSubmit} className="space-y-4">
          <Select
            label="Client Establishment"
            required
            placeholder="Select client to bill..."
            value={billForm.client}
            onChange={(e) => handleBillClientChange(e.target.value)}
            options={clients.map((c) => ({
              value: c._id,
              label: `${c.companyName} (${c.type})`,
            }))}
          />

          {isLoadingDuties && (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
              Loading unbilled completed duties...
            </div>
          )}

          {!isLoadingDuties && billForm.client && unbilledDuties.length === 0 && (
            <div className="p-4 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-200">
              No unbilled approved duties found for this client. Either all duties have already been billed, or no duties have been logged yet.
            </div>
          )}

          {unbilledDuties.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Select Duties to Include in Bill ({billForm.selectedDutyIds.length} of {unbilledDuties.length} selected)</span>
                <button
                  type="button"
                  onClick={selectAllDuties}
                  className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {billForm.selectedDutyIds.length === unbilledDuties.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 p-2 rounded-xl bg-slate-50">
                {unbilledDuties.map((d) => {
                  const isChecked = billForm.selectedDutyIds.includes(d._id);
                  return (
                    <div
                      key={d._id}
                      onClick={() => toggleDutySelection(d._id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-medium'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{d.dutySlipNumber}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(d.dutyDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {d.staff?.name} ({d.hoursWorked} hrs)
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-indigo-700 text-sm">
                          ₹{(d.clientBillingAmount || 0).toLocaleString()}
                        </span>
                        <div className="text-[10px] text-slate-400">{d.location || 'Main Hall'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Total Bill Amount for Selected Duties:</span>
                <span className="text-base text-emerald-700">₹{selectedDutiesTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payment Due Date (Optional)"
              type="date"
              value={billForm.dueDate}
              onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
            />
            <Input
              label="Invoice Notes (Optional)"
              placeholder="e.g. Terms: Payment due within 15 days"
              value={billForm.notes}
              onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 3: Official Printable Client Receipt */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Client Payment Receipt"
        subtitle={currentReceipt?.receiptNumber || 'Receipt'}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsReceiptModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
          </>
        }
      >
        {currentReceipt && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-5 text-slate-800 print:border-none print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight">KK BROTHERS</h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                  Hotel & Catering Workforce Solutions
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {currentReceipt.receiptNumber}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {new Date(currentReceipt.receiptDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Received From
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {currentReceipt.client.companyName}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {currentReceipt.client.type} • {currentReceipt.client.city}
                </div>
                {currentReceipt.client.gstNumber && currentReceipt.client.gstNumber !== 'Unregistered' && (
                  <div className="text-slate-500 font-mono text-[11px]">
                    GST: {currentReceipt.client.gstNumber}
                  </div>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Payment Mode
                </span>
                <div className="text-slate-700 text-[11px] mt-0.5">
                  <span className="font-medium text-slate-500">Method: </span>
                  <span className="font-semibold">{currentReceipt.paymentMethod}</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px] truncate">
                  <span className="font-medium text-slate-500">Ref: </span>
                  {currentReceipt.transactionReference}
                </div>
                <div className="text-slate-700 font-mono text-[11px]">
                  <span className="font-medium text-slate-500">Invoice: </span>
                  {currentReceipt.invoiceNumber}
                </div>
              </div>
            </div>

            {/* Financial Ledger Section */}
            <div className="space-y-2 border-y border-slate-200 py-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Bill Amount:</span>
                <span className="font-semibold text-slate-800">
                  ₹{currentReceipt.totalBillAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm py-1 font-bold text-slate-900 bg-emerald-50/60 p-2 rounded-lg">
                <span className="text-emerald-900">Amount Received:</span>
                <span className="text-emerald-700 font-black text-base">
                  ₹{currentReceipt.receivedAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Remaining Amount (Outstanding):</span>
                <span
                  className={
                    currentReceipt.remainingAmount > 0
                      ? 'font-bold text-amber-700 font-mono'
                      : 'font-semibold text-emerald-700'
                  }
                >
                  ₹{currentReceipt.remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* In Words */}
            <div className="text-xs text-slate-600 italic">
              <span className="font-semibold text-slate-700 not-italic">Amount in Words: </span>
              {currentReceipt.receivedAmountInWords}
            </div>

            {/* Notes */}
            {currentReceipt.notes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                {currentReceipt.notes}
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-6 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
              <div>
                <span className="block font-semibold text-slate-700">KK Brothers Accounts Desk</span>
                <span>Authorized Financial Representative</span>
              </div>
              <div className="text-right">
                <StatusBadge status={currentReceipt.status} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 4: Bill Details Modal */}
      <Modal
        isOpen={isBillDetailsModalOpen}
        onClose={() => setIsBillDetailsModalOpen(false)}
        title="Client Bill Details & Audit Breakdown"
        subtitle={currentBillDetails?.bill?.billNumber || 'Bill Details'}
        maxWidth="max-w-2xl"
        footer={
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsBillDetailsModalOpen(false)}
          >
            Close
          </Button>
        }
      >
        {currentBillDetails && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{currentBillDetails.bill.client?.companyName}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {currentBillDetails.bill.client?.type} • {currentBillDetails.bill.client?.phone}
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={currentBillDetails.bill.status} />
                <div className="text-[11px] text-slate-500 mt-1">
                  Remaining Due: <strong className="text-amber-700">₹{currentBillDetails.bill.remainingAmount?.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">
                Duties Included in this Bill ({currentBillDetails.bill.duties?.length || 0})
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 p-2 rounded-xl bg-slate-50">
                {currentBillDetails.bill.duties?.map((d) => (
                  <div key={d._id} className="p-2 bg-white rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{d.dutySlipNumber}</span>
                      <span className="text-slate-500 ml-2">
                        {new Date(d.dutyDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {d.staff?.name}
                      </span>
                    </div>
                    <span className="font-bold text-indigo-700">₹{d.clientBillingAmount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">
                Payment Transactions Logged Against this Bill ({currentBillDetails.payments?.length || 0})
              </span>
              {currentBillDetails.payments?.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-center italic">
                  No payment transactions have been logged against this bill yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentBillDetails.payments?.map((p) => (
                    <div key={p._id} className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{p.receiptNo || p.clientPaymentId}</span>
                        <div className="text-[11px] text-slate-500">
                          {new Date(p.receivedDate).toLocaleDateString('en-IN')} via {p.paymentMethod} (Ref: {p.transactionReference || 'N/A'})
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{(p.receivedAmount || p.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientPayments;
