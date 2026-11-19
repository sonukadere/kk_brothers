import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/reportApi';
import { staffApi } from '../../api/staffApi';
import { clientApi } from '../../api/clientApi';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { formatDate } from '../../utils/dateUtils';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  Users,
  Building2,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Receipt,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [reportType, setReportType] = useState('staff_duties');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));

  // Entities for dropdown filters
  const [staffList, setStaffList] = useState([]);
  const [clientList, setClientList] = useState([]);

  // Report state
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load staff & client lists for filters
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const [staffRes, clientRes] = await Promise.all([
          staffApi.getAllStaff(),
          clientApi.getAllClients(),
        ]);
        if (staffRes.success) setStaffList(staffRes.data || []);
        if (clientRes.success) setClientList(clientRes.data || []);
      } catch (err) {
        console.error('Failed to load filter lists', err);
      }
    };
    fetchEntities();
  }, []);

  // Fetch report when reportType or date changes
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      let res;
      const baseParams = { startDate, endDate };

      switch (reportType) {
        case 'staff_duties':
          res = await reportApi.getStaffDutyReport({
            ...baseParams,
            ...(selectedStaffId && { staffId: selectedStaffId }),
          });
          break;
        case 'hotel_duties':
          res = await reportApi.getHotelDutyReport({
            ...baseParams,
            ...(selectedClientId && { clientId: selectedClientId }),
          });
          break;
        case 'catering_duties':
          res = await reportApi.getCateringDutyReport({
            ...baseParams,
            ...(selectedClientId && { clientId: selectedClientId }),
          });
          break;
        case 'date_duties':
          res = await reportApi.getDateWiseDutyReport({
            ...baseParams,
            ...(selectedStaffId && { staffId: selectedStaffId }),
            ...(selectedClientId && { clientId: selectedClientId }),
          });
          break;
        case 'staff_payments':
          res = await reportApi.getStaffPaymentReport({
            ...baseParams,
            ...(selectedStaffId && { staffId: selectedStaffId }),
          });
          break;
        case 'client_payments':
          res = await reportApi.getClientPaymentReport({
            ...baseParams,
            ...(selectedClientId && { clientId: selectedClientId }),
          });
          break;
        case 'pending_payments':
          res = await reportApi.getPendingPaymentReport();
          break;
        case 'monthly_business':
          res = await reportApi.getMonthlyBusinessReport({
            year: selectedYear,
            month: selectedMonth,
          });
          break;
        default:
          res = await reportApi.getStaffDutyReport(baseParams);
      }

      if (res && res.success) {
        setReportData(res);
      }
    } catch (err) {
      toast.error('Failed to generate report from MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (!reportData) return;

    let rows = [];
    let fileName = reportType;

    if (reportType === 'staff_duties') {
      rows = (reportData.data || []).map((s) => ({
        'Staff Code': s.staffCode,
        'Staff Name': s.name,
        'Phone Number': s.phone,
        Designation: s.designation,
        'Default Daily Rate': `₹${s.defaultDailyRate}`,
        'Duties Count': s.totalDuties,
        'Hours Worked': `${s.totalHours} hrs`,
        'Total Wages Earned': s.totalEarned,
        'Total Wages Paid': s.totalPaid,
        'Pending Balance': s.pendingAmount,
      }));
      fileName = 'Staff_Duty_Report';
    } else if (reportType === 'hotel_duties' || reportType === 'catering_duties') {
      rows = (reportData.data || []).map((c) => ({
        'Business ID': c.businessId,
        'Company Name': c.companyName,
        'Contact Person': c.contactPerson,
        'Phone Number': c.phone,
        City: c.city,
        'Duties Supplied': c.totalDuties,
        'Staff Sent': c.totalStaffSent,
        'Hours Delivered': `${c.totalHours} hrs`,
        'Total Billing': c.totalBilling,
        'Total Received': c.totalReceived,
        'Outstanding Balance': c.remainingBalance,
      }));
      fileName = reportType === 'hotel_duties' ? 'Hotel_Duty_Report' : 'Catering_Duty_Report';
    } else if (reportType === 'date_duties') {
      rows = (reportData.data || []).map((d) => ({
        'Duty Slip #': d.dutySlipNumber,
        Date: formatDate(d.dutyDate),
        'Staff Name': d.staffName,
        'Staff Code': d.staffCode,
        'Client Name': d.clientName,
        'Client Type': d.clientType,
        'In Time': d.inTime,
        'Out Time': d.outTime,
        'Hours Worked': d.hoursWorked,
        Location: d.location,
        Role: d.rolePerformed,
        'Staff Wage': d.staffWage,
        'Client Charge': d.clientBillingAmount,
        'Gross Margin': d.margin,
        Status: d.status,
      }));
      fileName = 'Date_Wise_Duty_Report';
    } else if (reportType === 'staff_payments') {
      rows = (reportData.data || []).map((p) => ({
        'Voucher #': p.paymentId,
        Date: formatDate(p.paymentDate),
        'Staff Name': p.staffName,
        'Staff Code': p.staffCode,
        'Phone Number': p.phone,
        'Amount Paid': p.amount,
        'Payment Type': p.paymentType,
        'Payment Method': p.paymentMethod,
        'Transaction Ref': p.transactionReference,
        'Recorded By': p.recordedBy,
        Status: p.status,
        Notes: p.notes,
      }));
      fileName = 'Staff_Wage_Payment_Report';
    } else if (reportType === 'client_payments') {
      rows = (reportData.data || []).map((p) => ({
        'Receipt Voucher #': p.paymentId,
        Date: formatDate(p.paymentDate),
        'Client Name': p.clientName,
        'Business Type': p.businessType,
        'Business ID': p.businessId,
        'Contact Person': p.contactPerson,
        'Amount Received': p.amount,
        'Payment Method': p.paymentMethod,
        'Transaction Ref': p.transactionReference,
        Status: p.status,
        Notes: p.notes,
      }));
      fileName = 'Client_Payment_Report';
    } else if (reportType === 'pending_payments') {
      rows = [
        ...(reportData.staffPayables || []).map((s) => ({
          Category: 'STAFF WAGE PAYABLE (Owed to Worker)',
          'Entity Name': s.name,
          'Entity ID / Code': s.staffCode,
          Phone: s.phone,
          'Duties / Invoices': s.dutyCount,
          'Total Gross Amount': s.totalEarned,
          'Amount Settled': s.totalPaid,
          'Pending Balance': s.pendingAmount,
        })),
        ...(reportData.clientReceivables || []).map((c) => ({
          Category: 'CLIENT RECEIVABLE (Owed by Hotel/Caterer)',
          'Entity Name': `${c.companyName} (${c.type})`,
          'Entity ID / Code': c.businessId,
          Phone: c.phone,
          'Duties / Invoices': c.dutyCount,
          'Total Gross Amount': c.totalBilled,
          'Amount Settled': c.totalReceived,
          'Pending Balance': c.remainingBalance,
        })),
      ];
      fileName = 'Pending_Payments_Report';
    } else if (reportType === 'monthly_business') {
      const m = reportData.metrics || {};
      rows = [
        { Metric: 'Reporting Month', Value: reportData.month },
        { Metric: 'Total Completed Duties', Value: m.totalDuties },
        { Metric: 'Total Shift Hours', Value: `${m.totalHours} hrs` },
        { Metric: 'Gross Client Billing (Revenue)', Value: `₹${m.grossClientBilling}` },
        { Metric: 'Client Receipts Collected', Value: `₹${m.clientReceiptsCollected}` },
        { Metric: 'Gross Staff Wages (Direct Labor)', Value: `₹${m.grossStaffWages}` },
        { Metric: 'Staff Wages Disbursed', Value: `₹${m.staffWagesDisbursed}` },
        { Metric: 'Gross Profit Margin', Value: `₹${m.grossMargin}` },
        { Metric: 'Profit Margin Percentage', Value: `${m.marginPercentage}%` },
        { Metric: 'Hotel Duties Count', Value: m.hotelSplit?.dutiesCount },
        { Metric: 'Hotel Billing Amount', Value: `₹${m.hotelSplit?.billingAmount}` },
        { Metric: 'Catering Duties Count', Value: m.cateringSplit?.dutiesCount },
        { Metric: 'Catering Billing Amount', Value: `₹${m.cateringSplit?.billingAmount}` },
      ];
      fileName = `Monthly_Business_Report_${reportData.month?.replace(' ', '_')}`;
    }

    exportToExcel(rows, fileName, reportType.toUpperCase());
    toast.success('Excel workbook downloaded successfully');
  };

  // Handle Export to PDF
  const handleExportPDF = () => {
    if (!reportData) return;

    let title = 'Report';
    let subtitle = `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`;
    let headers = [];
    let rows = [];
    let summaryCards = [];
    let fileName = reportType;

    if (reportType === 'staff_duties') {
      title = 'Staff-wise Duty & Wage Statement';
      headers = ['Staff Code', 'Staff Name', 'Phone', 'Duties', 'Hours', 'Wages Earned', 'Wages Paid', 'Pending'];
      rows = (reportData.data || []).map((s) => [
        s.staffCode,
        s.name,
        s.phone,
        String(s.totalDuties),
        `${s.totalHours}h`,
        `₹${s.totalEarned.toLocaleString()}`,
        `₹${s.totalPaid.toLocaleString()}`,
        `₹${s.pendingAmount.toLocaleString()}`,
      ]);
      const sum = reportData.summary || {};
      summaryCards = [
        { label: 'Staff Count', value: String(sum.totalStaffCount || 0) },
        { label: 'Total Duties', value: String(sum.grandTotalDuties || 0) },
        { label: 'Total Hours', value: `${sum.grandTotalHours || 0} hrs` },
        { label: 'Total Wages Earned', value: `₹${(sum.grandTotalEarned || 0).toLocaleString()}` },
        { label: 'Pending Wages', value: `₹${(sum.grandTotalPending || 0).toLocaleString()}` },
      ];
      fileName = 'Staff_Duty_Report';
    } else if (reportType === 'hotel_duties' || reportType === 'catering_duties') {
      const isHotel = reportType === 'hotel_duties';
      title = isHotel ? 'Hotel-wise Duty & Invoicing Statement' : 'Catering-wise Duty & Billing Statement';
      headers = ['Business ID', 'Client Name', 'Contact Person', 'City', 'Duties', 'Staff Sent', 'Hours', 'Billed', 'Received', 'Balance'];
      rows = (reportData.data || []).map((c) => [
        c.businessId,
        c.companyName,
        c.contactPerson,
        c.city,
        String(c.totalDuties),
        String(c.totalStaffSent),
        `${c.totalHours}h`,
        `₹${c.totalBilling.toLocaleString()}`,
        `₹${c.totalReceived.toLocaleString()}`,
        `₹${c.remainingBalance.toLocaleString()}`,
      ]);
      const sum = reportData.summary || {};
      summaryCards = [
        { label: 'Clients Count', value: String(isHotel ? sum.totalHotelsCount : sum.totalCateringCount) },
        { label: 'Total Duties', value: String(sum.grandTotalDuties || 0) },
        { label: 'Total Hours', value: `${sum.grandTotalHours || 0} hrs` },
        { label: 'Total Billing', value: `₹${(sum.grandTotalBilling || 0).toLocaleString()}` },
        { label: 'Outstanding Balance', value: `₹${(sum.grandTotalBalance || 0).toLocaleString()}` },
      ];
      fileName = isHotel ? 'Hotel_Duty_Report' : 'Catering_Duty_Report';
    } else if (reportType === 'date_duties') {
      title = 'Date-wise Duty Logbook Statement';
      headers = ['Slip #', 'Date', 'Staff Worker', 'Hotel/Catering', 'Hours', 'Staff Wage', 'Client Charge', 'Margin', 'Status'];
      rows = (reportData.data || []).map((d) => [
        d.dutySlipNumber,
        formatDate(d.dutyDate),
        d.staffName,
        d.clientName,
        `${d.hoursWorked}h`,
        `₹${(d.staffWage || 0).toLocaleString()}`,
        `₹${(d.clientBillingAmount || 0).toLocaleString()}`,
        `₹${(d.margin || 0).toLocaleString()}`,
        d.status,
      ]);
      const sum = reportData.summary || {};
      summaryCards = [
        { label: 'Total Duties', value: String(sum.totalDuties || 0) },
        { label: 'Total Hours', value: `${sum.totalHours || 0} hrs` },
        { label: 'Staff Wages', value: `₹${(sum.totalStaffWages || 0).toLocaleString()}` },
        { label: 'Client Billing', value: `₹${(sum.totalClientBilling || 0).toLocaleString()}` },
        { label: 'Gross Margin', value: `₹${(sum.grossMargin || 0).toLocaleString()}` },
      ];
      fileName = 'Date_Wise_Duty_Report';
    } else if (reportType === 'staff_payments') {
      title = 'Staff Wage Payment Voucher Ledger';
      headers = ['Voucher #', 'Date', 'Staff Worker', 'Phone', 'Amount Paid', 'Type', 'Method', 'Ref #', 'Status'];
      rows = (reportData.data || []).map((p) => [
        p.paymentId,
        formatDate(p.paymentDate),
        p.staffName,
        p.phone,
        `₹${p.amount.toLocaleString()}`,
        p.paymentType,
        p.paymentMethod,
        p.transactionReference,
        p.status,
      ]);
      const sum = reportData.summary || {};
      summaryCards = [
        { label: 'Vouchers Count', value: String(sum.totalVouchers || 0) },
        { label: 'Total Disbursed', value: `₹${(sum.totalAmountDisbursed || 0).toLocaleString()}` },
        { label: 'Cash', value: `₹${(sum.methodBreakdown?.Cash || 0).toLocaleString()}` },
        { label: 'UPI', value: `₹${(sum.methodBreakdown?.UPI || 0).toLocaleString()}` },
        { label: 'Bank Transfer', value: `₹${(sum.methodBreakdown?.['Bank Transfer'] || 0).toLocaleString()}` },
      ];
      fileName = 'Staff_Wage_Payment_Report';
    } else if (reportType === 'client_payments') {
      title = 'Client Payment Collections Statement';
      headers = ['Receipt #', 'Date', 'Hotel / Catering', 'Type', 'Amount Received', 'Method', 'Ref #', 'Status'];
      rows = (reportData.data || []).map((p) => [
        p.paymentId,
        formatDate(p.paymentDate),
        p.clientName,
        p.businessType,
        `₹${p.amount.toLocaleString()}`,
        p.paymentMethod,
        p.transactionReference,
        p.status,
      ]);
      const sum = reportData.summary || {};
      summaryCards = [
        { label: 'Total Receipts', value: String(sum.totalVouchers || 0) },
        { label: 'Total Collected', value: `₹${(sum.totalAmountReceived || 0).toLocaleString()}` },
        { label: 'Cash', value: `₹${(sum.methodBreakdown?.Cash || 0).toLocaleString()}` },
        { label: 'UPI', value: `₹${(sum.methodBreakdown?.UPI || 0).toLocaleString()}` },
        { label: 'Bank Transfer', value: `₹${(sum.methodBreakdown?.['Bank Transfer'] || 0).toLocaleString()}` },
      ];
      fileName = 'Client_Payment_Report';
    } else if (reportType === 'pending_payments') {
      title = 'Two-Sided Pending Payment Balance Sheet';
      subtitle = 'Internal Staff Wage Liabilities vs Client Receivables';
      headers = ['Category', 'Party Name', 'ID / Code', 'Phone', 'Total Billed/Earned', 'Paid/Received', 'Pending Balance'];
      rows = [
        ...(reportData.staffPayables || []).map((s) => [
          'STAFF WAGE (Owed to Worker)',
          s.name,
          s.staffCode,
          s.phone,
          `₹${s.totalEarned.toLocaleString()}`,
          `₹${s.totalPaid.toLocaleString()}`,
          `₹${s.pendingAmount.toLocaleString()}`,
        ]),
        ...(reportData.clientReceivables || []).map((c) => [
          `CLIENT (${c.type})`,
          c.companyName,
          c.businessId,
          c.phone,
          `₹${c.totalBilled.toLocaleString()}`,
          `₹${c.totalReceived.toLocaleString()}`,
          `₹${c.remainingBalance.toLocaleString()}`,
        ]),
      ];
      const sum = reportData.summary || {};
      summaryCards = [
        { label: 'Staff Wage Liability', value: `₹${(sum.totalStaffLiability || 0).toLocaleString()}` },
        { label: 'Client Receivables', value: `₹${(sum.totalClientReceivable || 0).toLocaleString()}` },
        { label: 'Net Cashflow Gap', value: `₹${(sum.netCashflowGap || 0).toLocaleString()}` },
      ];
      fileName = 'Pending_Payments_Report';
    } else if (reportType === 'monthly_business') {
      title = `Executive Monthly Business Review - ${reportData.month}`;
      subtitle = 'Gross Revenue, Direct Labor Costs, and Profit Margins';
      headers = ['Performance Metric', 'Reported Value'];
      const m = reportData.metrics || {};
      rows = [
        ['Total Duties Completed', String(m.totalDuties)],
        ['Total Working Hours', `${m.totalHours} hrs`],
        ['Gross Client Billing (Revenue)', `₹${(m.grossClientBilling || 0).toLocaleString()}`],
        ['Client Receipts Collected', `₹${(m.clientReceiptsCollected || 0).toLocaleString()}`],
        ['Gross Staff Wages (Direct Labor)', `₹${(m.grossStaffWages || 0).toLocaleString()}`],
        ['Staff Wages Disbursed', `₹${(m.staffWagesDisbursed || 0).toLocaleString()}`],
        ['Gross Profit Margin', `₹${(m.grossMargin || 0).toLocaleString()}`],
        ['Profit Margin Percentage', `${m.marginPercentage}%`],
        ['Hotel Duties & Billing', `${m.hotelSplit?.dutiesCount} duties | ₹${(m.hotelSplit?.billingAmount || 0).toLocaleString()}`],
        ['Catering Duties & Billing', `${m.cateringSplit?.dutiesCount} duties | ₹${(m.cateringSplit?.billingAmount || 0).toLocaleString()}`],
      ];
      summaryCards = [
        { label: 'Gross Revenue', value: `₹${(m.grossClientBilling || 0).toLocaleString()}` },
        { label: 'Staff Wages Cost', value: `₹${(m.grossStaffWages || 0).toLocaleString()}` },
        { label: 'Gross Profit', value: `₹${(m.grossMargin || 0).toLocaleString()}` },
        { label: 'Margin %', value: `${m.marginPercentage}%` },
      ];
      fileName = `Monthly_Report_${reportData.month?.replace(' ', '_')}`;
    }

    exportToPDF({
      title,
      subtitle,
      headers,
      rows,
      fileName,
      summaryCards,
    });
    toast.success('Official PDF report generated successfully');
  };

  const reportOptions = [
    { value: 'staff_duties', label: '1. Staff-wise Duty Report' },
    { value: 'hotel_duties', label: '2. Hotel-wise Duty Report' },
    { value: 'catering_duties', label: '3. Catering-wise Duty Report' },
    { value: 'date_duties', label: '4. Date-wise Duty Report' },
    { value: 'staff_payments', label: '5. Staff Payment Report' },
    { value: 'client_payments', label: '6. Client Payment Report' },
    { value: 'pending_payments', label: '7. Pending Payment Report' },
    { value: 'monthly_business', label: '8. Monthly Business Report' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics Center"
        subtitle="Generate and export official statements for duties, wage disbursals, client invoicing, and cashflow."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={handleExportExcel}
              disabled={isLoading || !reportData}
            >
              Excel (.xlsx)
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
              onClick={handleExportPDF}
              disabled={isLoading || !reportData}
            >
              Export PDF
            </Button>
          </div>
        }
      />

      {/* FILTER & CONFIGURATION CARD */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Select Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={reportOptions}
          />

          {reportType === 'monthly_business' ? (
            <>
              <Select
                label="Select Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                options={[
                  { value: '2025', label: '2025' },
                  { value: '2026', label: '2026' },
                  { value: '2027', label: '2027' },
                ]}
              />
              <Select
                label="Select Month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={[
                  { value: '1', label: 'January' },
                  { value: '2', label: 'February' },
                  { value: '3', label: 'March' },
                  { value: '4', label: 'April' },
                  { value: '5', label: 'May' },
                  { value: '6', label: 'June' },
                  { value: '7', label: 'July' },
                  { value: '8', label: 'August' },
                  { value: '9', label: 'September' },
                  { value: '10', label: 'October' },
                  { value: '11', label: 'November' },
                  { value: '12', label: 'December' },
                ]}
              />
            </>
          ) : reportType !== 'pending_payments' ? (
            <>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          ) : (
            <div className="col-span-2 flex items-center text-xs text-slate-500 pt-6">
              <span className="font-semibold text-slate-700">Live Dual Balance Ledger:</span>
              <span className="ml-1.5">Staff wage liabilities vs. client receivables to date.</span>
            </div>
          )}

          {/* Conditional secondary filters */}
          {(reportType === 'staff_duties' || reportType === 'date_duties' || reportType === 'staff_payments') && (
            <Select
              label="Filter by Staff"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              options={[
                { value: '', label: 'All Staff Members' },
                ...staffList.map((s) => ({ value: s._id, label: `${s.name} (${s.staffCode})` })),
              ]}
            />
          )}

          {(reportType === 'hotel_duties' || reportType === 'catering_duties' || reportType === 'date_duties' || reportType === 'client_payments') && (
            <Select
              label="Filter by Client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              options={[
                { value: '', label: 'All Clients' },
                ...clientList
                  .filter((c) =>
                    reportType === 'hotel_duties'
                      ? c.type === 'Hotel'
                      : reportType === 'catering_duties'
                      ? c.type === 'Catering'
                      : true
                  )
                  .map((c) => ({ value: c._id, label: `${c.companyName} (${c.type})` })),
              ]}
            />
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Active Report:{' '}
            <span className="font-semibold text-slate-800">
              {reportOptions.find((r) => r.value === reportType)?.label}
            </span>
          </div>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchReport}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Refresh Report'}
          </Button>
        </div>
      </Card>

      {/* REPORT CONTENT & PREVIEW */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" text="Querying MongoDB & assembling official statement..." />
        </div>
      ) : !reportData ? (
        <Card className="p-8 text-center text-slate-500 text-sm">
          Select parameters and click "Refresh Report" to generate data.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* SUMMARY STRIP */}
          {reportData.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {reportType === 'staff_duties' && (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Staff Count</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.totalStaffCount}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Duties</div>
                    <div className="text-lg font-bold text-sky-600 mt-0.5">{reportData.summary.grandTotalDuties}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Hours</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.grandTotalHours} hrs</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Wages Earned</div>
                    <div className="text-lg font-bold text-purple-600 mt-0.5">₹{reportData.summary.grandTotalEarned.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Pending Wages</div>
                    <div className="text-lg font-bold text-amber-600 mt-0.5">₹{reportData.summary.grandTotalPending.toLocaleString()}</div>
                  </div>
                </>
              )}

              {(reportType === 'hotel_duties' || reportType === 'catering_duties') && (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Clients Count</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {reportType === 'hotel_duties' ? reportData.summary.totalHotelsCount : reportData.summary.totalCateringCount}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Duties</div>
                    <div className="text-lg font-bold text-sky-600 mt-0.5">{reportData.summary.grandTotalDuties}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Hours Delivered</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.grandTotalHours} hrs</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Billing</div>
                    <div className="text-lg font-bold text-emerald-600 mt-0.5">₹{reportData.summary.grandTotalBilling.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Outstanding Balance</div>
                    <div className="text-lg font-bold text-rose-600 mt-0.5">₹{reportData.summary.grandTotalBalance.toLocaleString()}</div>
                  </div>
                </>
              )}

              {reportType === 'date_duties' && (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Duties</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.totalDuties}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Hours</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.totalHours} hrs</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Staff Wages</div>
                    <div className="text-lg font-bold text-purple-600 mt-0.5">₹{reportData.summary.totalStaffWages.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Client Billing</div>
                    <div className="text-lg font-bold text-emerald-600 mt-0.5">₹{reportData.summary.totalClientBilling.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Gross Margin</div>
                    <div className="text-lg font-bold text-sky-600 mt-0.5">₹{reportData.summary.grossMargin.toLocaleString()}</div>
                  </div>
                </>
              )}

              {reportType === 'staff_payments' && (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Vouchers Paid</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.totalVouchers}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Disbursed</div>
                    <div className="text-lg font-bold text-purple-600 mt-0.5">₹{reportData.summary.totalAmountDisbursed.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Cash Disbursal</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">₹{(reportData.summary.methodBreakdown?.Cash || 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">UPI Disbursal</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">₹{(reportData.summary.methodBreakdown?.UPI || 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Bank Transfer</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">₹{(reportData.summary.methodBreakdown?.['Bank Transfer'] || 0).toLocaleString()}</div>
                  </div>
                </>
              )}

              {reportType === 'client_payments' && (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Receipts Count</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.totalVouchers}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Collected</div>
                    <div className="text-lg font-bold text-emerald-600 mt-0.5">₹{reportData.summary.totalAmountReceived.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Cash Collected</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">₹{(reportData.summary.methodBreakdown?.Cash || 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">UPI Collected</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">₹{(reportData.summary.methodBreakdown?.UPI || 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Bank / Cheque</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">₹{(reportData.summary.methodBreakdown?.['Bank Transfer'] || 0).toLocaleString()}</div>
                  </div>
                </>
              )}

              {reportType === 'pending_payments' && (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-amber-700 uppercase">Staff Wage Liabilities</div>
                    <div className="text-lg font-bold text-amber-900 mt-0.5">₹{reportData.summary.totalStaffLiability.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-rose-700 uppercase">Client Receivables</div>
                    <div className="text-lg font-bold text-rose-900 mt-0.5">₹{reportData.summary.totalClientReceivable.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-emerald-700 uppercase">Net Cashflow Gap</div>
                    <div className="text-lg font-bold text-emerald-900 mt-0.5">₹{reportData.summary.netCashflowGap.toLocaleString()}</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MONTHLY BUSINESS REPORT VIEW */}
          {reportType === 'monthly_business' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Executive Profit & Loss Statement</span>
                  <Badge variant="indigo" size="sm">{reportData.month}</Badge>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Total Duties Completed:</span>
                    <span className="font-semibold text-slate-900">{reportData.metrics?.totalDuties} shifts</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Total Billable Working Hours:</span>
                    <span className="font-semibold text-slate-900">{reportData.metrics?.totalHours} hrs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Gross Client Billing (Revenue):</span>
                    <span className="font-bold text-emerald-600">₹{reportData.metrics?.grossClientBilling?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Direct Labor Wages (Staff Cost):</span>
                    <span className="font-bold text-purple-600">₹{reportData.metrics?.grossStaffWages?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-slate-50 px-2 rounded-lg font-semibold">
                    <span className="text-slate-800">Gross Operating Profit:</span>
                    <span className="font-bold text-indigo-700 text-sm">₹{reportData.metrics?.grossMargin?.toLocaleString()} ({reportData.metrics?.marginPercentage}%)</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Collections & Segment Breakdown
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Client Payments Collected:</span>
                    <span className="font-bold text-slate-900">₹{reportData.metrics?.clientReceiptsCollected?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Staff Wages Disbursed:</span>
                    <span className="font-bold text-slate-900">₹{reportData.metrics?.staffWagesDisbursed?.toLocaleString()}</span>
                  </div>
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">Segment Contribution</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100">
                        <div className="text-[11px] font-medium text-indigo-700">Hotel Clients</div>
                        <div className="text-base font-bold text-indigo-950 mt-1">
                          ₹{reportData.metrics?.hotelSplit?.billingAmount?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-indigo-600 mt-0.5">{reportData.metrics?.hotelSplit?.dutiesCount} duties</div>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-100">
                        <div className="text-[11px] font-medium text-purple-700">Catering Companies</div>
                        <div className="text-base font-bold text-purple-950 mt-1">
                          ₹{reportData.metrics?.cateringSplit?.billingAmount?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-purple-600 mt-0.5">{reportData.metrics?.cateringSplit?.dutiesCount} duties</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TABULAR REPORT TABLE */}
          {reportType !== 'monthly_business' && reportType !== 'pending_payments' && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        {reportType === 'staff_duties' && (
                          <>
                            <th className="py-3 px-4">Staff Code</th>
                            <th className="py-3 px-4">Staff Name</th>
                            <th className="py-3 px-4">Phone</th>
                            <th className="py-3 px-4 text-center">Duties</th>
                            <th className="py-3 px-4 text-center">Hours</th>
                            <th className="py-3 px-4 text-right">Wages Earned</th>
                            <th className="py-3 px-4 text-right">Wages Paid</th>
                            <th className="py-3 px-4 text-right">Pending Balance</th>
                          </>
                        )}
                        {(reportType === 'hotel_duties' || reportType === 'catering_duties') && (
                          <>
                            <th className="py-3 px-4">Business ID</th>
                            <th className="py-3 px-4">Client Name</th>
                            <th className="py-3 px-4">Contact</th>
                            <th className="py-3 px-4">City</th>
                            <th className="py-3 px-4 text-center">Duties</th>
                            <th className="py-3 px-4 text-center">Staff Sent</th>
                            <th className="py-3 px-4 text-center">Hours</th>
                            <th className="py-3 px-4 text-right">Total Billed</th>
                            <th className="py-3 px-4 text-right">Received</th>
                            <th className="py-3 px-4 text-right">Balance Due</th>
                          </>
                        )}
                        {reportType === 'date_duties' && (
                          <>
                            <th className="py-3 px-4">Duty Slip #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Staff</th>
                            <th className="py-3 px-4">Client</th>
                            <th className="py-3 px-4 text-center">Hours</th>
                            <th className="py-3 px-4 text-right">Staff Wage</th>
                            <th className="py-3 px-4 text-right">Client Charge</th>
                            <th className="py-3 px-4 text-right">Margin</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </>
                        )}
                        {reportType === 'staff_payments' && (
                          <>
                            <th className="py-3 px-4">Voucher #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Staff Worker</th>
                            <th className="py-3 px-4">Phone</th>
                            <th className="py-3 px-4 text-right">Amount Paid</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Method</th>
                            <th className="py-3 px-4">Transaction Ref</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </>
                        )}
                        {reportType === 'client_payments' && (
                          <>
                            <th className="py-3 px-4">Receipt #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Client Business</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4 text-right">Amount Received</th>
                            <th className="py-3 px-4">Method</th>
                            <th className="py-3 px-4">Transaction Ref</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportType === 'staff_duties' &&
                        (reportData.data || []).map((s) => (
                          <tr key={s.staffId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{s.staffCode}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono">{s.phone}</td>
                            <td className="py-3 px-4 text-center font-medium">{s.totalDuties}</td>
                            <td className="py-3 px-4 text-center">{s.totalHours} hrs</td>
                            <td className="py-3 px-4 text-right font-medium text-slate-900">₹{s.totalEarned.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-medium text-emerald-600">₹{s.totalPaid.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-bold text-amber-600">₹{s.pendingAmount.toLocaleString()}</td>
                          </tr>
                        ))}

                      {(reportType === 'hotel_duties' || reportType === 'catering_duties') &&
                        (reportData.data || []).map((c) => (
                          <tr key={c.clientId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{c.businessId}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{c.companyName}</td>
                            <td className="py-3 px-4 text-slate-600">{c.contactPerson}</td>
                            <td className="py-3 px-4 text-slate-500">{c.city}</td>
                            <td className="py-3 px-4 text-center font-medium">{c.totalDuties}</td>
                            <td className="py-3 px-4 text-center">{c.totalStaffSent} workers</td>
                            <td className="py-3 px-4 text-center">{c.totalHours} hrs</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">₹{c.totalBilling.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-medium text-emerald-600">₹{c.totalReceived.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-bold text-rose-600">₹{c.remainingBalance.toLocaleString()}</td>
                          </tr>
                        ))}

                      {reportType === 'date_duties' &&
                        (reportData.data || []).map((d) => (
                          <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">{d.dutySlipNumber}</td>
                            <td className="py-3 px-4 text-slate-600">
                              {formatDate(d.dutyDate)}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900">{d.staffName}</td>
                            <td className="py-3 px-4 text-slate-800">
                              {d.clientName}{' '}
                              <Badge variant={d.clientType === 'Hotel' ? 'indigo' : 'purple'} size="sm">
                                {d.clientType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center font-medium">{d.hoursWorked} hrs</td>
                            <td className="py-3 px-4 text-right font-medium">₹{(d.staffWage || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">₹{(d.clientBillingAmount || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{(d.margin || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              <StatusBadge status={d.status} />
                            </td>
                          </tr>
                        ))}

                      {reportType === 'staff_payments' &&
                        (reportData.data || []).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">{p.paymentId}</td>
                            <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                            <td className="py-3 px-4 font-medium text-slate-900">{p.staffName}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono">{p.phone}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">₹{p.amount.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <Badge variant="indigo" size="sm">{p.paymentType}</Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{p.transactionReference}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="success" size="sm">{p.status}</Badge>
                            </td>
                          </tr>
                        ))}

                      {reportType === 'client_payments' &&
                        (reportData.data || []).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">{p.paymentId}</td>
                            <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                            <td className="py-3 px-4 font-medium text-slate-900">{p.clientName}</td>
                            <td className="py-3 px-4">
                              <Badge variant={p.businessType === 'Hotel' ? 'indigo' : 'purple'} size="sm">
                                {p.businessType}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{p.transactionReference}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="success" size="sm">{p.status}</Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TWO-SIDED PENDING PAYMENTS BALANCE SHEET */}
          {reportType === 'pending_payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Staff Payables */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="text-amber-800">Staff Wage Liabilities</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">Wages owed to workers for completed duties</p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {(reportData.staffPayables || []).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">All staff wages settled!</div>
                    ) : (
                      (reportData.staffPayables || []).map((s) => (
                        <div key={s.staffId} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{s.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {s.staffCode} • {s.phone} • {s.dutyCount} duties
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-amber-600">₹{s.pendingAmount.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              Earned: ₹{s.totalEarned.toLocaleString()} | Paid: ₹{s.totalPaid.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Client Receivables */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="text-rose-800">Client Outstanding Receivables</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">Amounts due from hotel and catering clients</p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {(reportData.clientReceivables || []).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">All client bills collected!</div>
                    ) : (
                      (reportData.clientReceivables || []).map((c) => (
                        <div key={c.clientId} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              {c.companyName}{' '}
                              <Badge variant={c.type === 'Hotel' ? 'indigo' : 'purple'} size="sm">
                                {c.type}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {c.contactPerson} • {c.phone}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-rose-600">₹{c.remainingBalance.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              Billed: ₹{c.totalBilled.toLocaleString()} | Rcvd: ₹{c.totalReceived.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
