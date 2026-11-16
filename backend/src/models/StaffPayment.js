const mongoose = require('mongoose');

const staffPaymentSchema = new mongoose.Schema(
  {
    paymentVoucherNo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff user reference is required'],
    },
    duty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Duty',
      default: null,
    },
    dutiesCovered: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Duty',
      },
    ],
    totalEarning: {
      type: Number,
      default: 0,
      min: [0, 'Total earning cannot be negative'],
    },
    paidAmount: {
      type: Number,
      required: [true, 'Paid amount is required'],
      min: [0, 'Paid amount cannot be negative'],
    },
    // Retain amount for backward compatibility
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Pending amount cannot be negative'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
      default: 'Cash',
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
      default: 'Cash',
    },
    paymentType: {
      type: String,
      enum: [
        'Full Payment',
        'Partial Payment',
        'Advance Payment',
        'Standard Payment',
        'Full',
        'Partial',
        'Advance',
      ],
      default: 'Standard Payment',
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Completed', 'Cancelled'],
      default: 'Paid',
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
staffPaymentSchema.virtual('paymentId').get(function () {
  return this.paymentVoucherNo;
});

staffPaymentSchema.virtual('paymentNotes').get(function () {
  return this.notes;
});

// Auto-generate voucher number and synchronize aliases
staffPaymentSchema.pre('save', async function (next) {
  if (!this.paymentVoucherNo) {
    const count = await this.constructor.countDocuments();
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    this.paymentVoucherNo = `STFPAY-${yearMonth}-${String(count + 1).padStart(4, '0')}`;
  }

  // Sync paidAmount and amount
  if (this.paidAmount !== undefined && !this.amount) {
    this.amount = this.paidAmount;
  } else if (this.amount !== undefined && !this.paidAmount) {
    this.paidAmount = this.amount;
  }

  // Sync paymentMethod and paymentMode
  if (this.paymentMethod && !this.paymentMode) {
    this.paymentMode = this.paymentMethod;
  } else if (this.paymentMode && !this.paymentMethod) {
    this.paymentMethod = this.paymentMode;
  }

  // Calculate pending amount if totalEarning is provided and pendingAmount not set
  if (this.totalEarning !== undefined && this.paidAmount !== undefined) {
    this.pendingAmount = Math.max(0, this.totalEarning - this.paidAmount);
  }

  next();
});

module.exports = mongoose.model('StaffPayment', staffPaymentSchema);
