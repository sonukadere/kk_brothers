const mongoose = require('mongoose');

const clientBillSchema = new mongoose.Schema(
  {
    billNumber: {
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
    duties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Duty',
      },
    ],
    totalDuties: {
      type: Number,
      default: 0,
    },
    totalBillAmount: {
      type: Number,
      required: [true, 'Total bill amount is required'],
      min: [0, 'Bill amount cannot be negative'],
    },
    totalReceivedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Received amount cannot be negative'],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid'],
      default: 'Pending',
    },
    billDate: {
      type: Date,
      required: [true, 'Bill date is required'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
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
clientBillSchema.virtual('invoiceNumber').get(function () {
  return this.billNumber;
});

// Auto-generate invoice/bill number
clientBillSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const count = await this.constructor.countDocuments();
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    this.billNumber = `INV-${yearMonth}-${String(count + 1).padStart(4, '0')}`;
  }

  // Calculate remaining amount
  this.remainingAmount = Math.max(0, this.totalBillAmount - this.totalReceivedAmount);

  // Set status
  if (this.totalReceivedAmount === 0) {
    this.status = 'Pending';
  } else if (this.remainingAmount === 0) {
    this.status = 'Paid';
  } else {
    this.status = 'Partial';
  }

  next();
});

module.exports = mongoose.model('ClientBill', clientBillSchema);
