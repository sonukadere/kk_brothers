const mongoose = require('mongoose');

const clientPaymentSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Hotel / Catering client reference is required'],
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientBill',
      default: null,
    },
    relatedDutyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Duty',
      },
    ],
    totalBillAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total bill amount cannot be negative'],
    },
    receivedAmount: {
      type: Number,
      required: [true, 'Received amount is required'],
      min: [0, 'Received amount cannot be negative'],
    },
    // Retain amount for backward compatibility
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative'],
    },
    receivedDate: {
      type: Date,
      required: [true, 'Received date is required'],
      default: Date.now,
    },
    // Retain paymentDate for backward compatibility
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Bank Transfer', 'NEFT / RTGS', 'UPI', 'Cheque', 'Cash', 'Direct Bank Deposit'],
      default: 'Bank Transfer',
    },
    // Retain paymentMode for backward compatibility
    paymentMode: {
      type: String,
      enum: ['Bank Transfer', 'NEFT / RTGS', 'UPI', 'Cheque', 'Cash', 'Direct Bank Deposit'],
      default: 'Bank Transfer',
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Received', 'Pending Clearance', 'Bounced'],
      default: 'Received',
    },
    // Retain status for backward compatibility
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Received', 'Pending Clearance', 'Bounced'],
      default: 'Received',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases
clientPaymentSchema.virtual('clientPaymentId').get(function () {
  return this.receiptNo;
});

// Auto-generate receipt number and synchronize aliases
clientPaymentSchema.pre('save', async function (next) {
  if (!this.receiptNo) {
    const count = await this.constructor.countDocuments();
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    this.receiptNo = `CLTPAY-${yearMonth}-${String(count + 1).padStart(4, '0')}`;
  }

  // Sync receivedAmount and amount
  if (this.receivedAmount !== undefined && !this.amount) {
    this.amount = this.receivedAmount;
  } else if (this.amount !== undefined && !this.receivedAmount) {
    this.receivedAmount = this.amount;
  }

  // Sync receivedDate and paymentDate
  if (this.receivedDate && !this.paymentDate) {
    this.paymentDate = this.receivedDate;
  } else if (this.paymentDate && !this.receivedDate) {
    this.receivedDate = this.paymentDate;
  }

  // Sync paymentMethod and paymentMode
  if (this.paymentMethod && !this.paymentMode) {
    this.paymentMode = this.paymentMethod;
  } else if (this.paymentMode && !this.paymentMethod) {
    this.paymentMethod = this.paymentMode;
  }

  // Sync status and paymentStatus
  if (this.paymentStatus && !this.status) {
    this.status = this.paymentStatus;
  } else if (this.status && !this.paymentStatus) {
    this.paymentStatus = this.status;
  }

  // Calculate remaining amount if totalBillAmount is set and remainingAmount is not set
  if (this.totalBillAmount !== undefined && this.receivedAmount !== undefined && this.remainingAmount === undefined) {
    this.remainingAmount = Math.max(0, this.totalBillAmount - this.receivedAmount);
  }

  next();
});

module.exports = mongoose.model('ClientPayment', clientPaymentSchema);
