const mongoose = require('mongoose');

const dutySchema = new mongoose.Schema(
  {
    dutySlipNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff member is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Associated user account is required'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Hotel / Catering client is required'],
    },
    dutyDate: {
      type: Date,
      required: [true, 'Duty date is required'],
      default: Date.now,
    },
    inTime: {
      type: String,
      trim: true,
      default: '09:00',
    },
    outTime: {
      type: String,
      trim: true,
      default: '18:00',
    },
    isOvernight: {
      type: Boolean,
      default: false,
    },
    shiftType: {
      type: String,
      required: [true, 'Shift type is required'],
      enum: [
        'Morning (6 AM - 2 PM)',
        'Evening (2 PM - 10 PM)',
        'Night (10 PM - 6 AM)',
        'Full Day (8-10 hrs)',
        'Double Shift',
        'Overtime',
        'Custom Timing',
      ],
      default: 'Full Day (8-10 hrs)',
    },
    hoursWorked: {
      type: Number,
      required: [true, 'Hours worked is required'],
      min: [0.5, 'Hours worked must be at least 0.5'],
      max: [24, 'Hours worked cannot exceed 24'],
      default: 8,
    },
    staffWage: {
      type: Number,
      required: [true, 'Staff wage amount is required'],
      min: [0, 'Wage cannot be negative'],
    },
    clientBillingAmount: {
      type: Number,
      required: [true, 'Client billing amount is required'],
      min: [0, 'Billing amount cannot be negative'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Hall',
    },
    rolePerformed: {
      type: String,
      trim: true,
      default: 'Waiter',
    },
    status: {
      type: String,
      enum: [
        'Pending Approval',
        'Approved',
        'Completed',
        'Cancelled',
        'Pending', // alias for backward-compatibility
        'Rejected', // alias for backward-compatibility
      ],
      default: 'Pending Approval',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Partial'],
      default: 'Unpaid',
    },
    clientBilled: {
      type: Boolean,
      default: false,
    },
    clientBill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientBill',
      default: null,
    },
    clientPaymentStatus: {
      type: String,
      enum: ['Unbilled', 'Billed', 'Partial', 'Paid'],
      default: 'Unbilled',
    },
    reportedBy: {
      type: String,
      enum: ['Admin', 'Staff User'],
      default: 'Staff User',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    changeLog: [
      {
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
        changeSummary: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases
dutySchema.virtual('dutyId').get(function () {
  return this.dutySlipNumber;
});
dutySchema.virtual('totalWorkingHours').get(function () {
  return this.hoursWorked;
});
dutySchema.virtual('staffPaymentRate').get(function () {
  return this.staffWage;
});
dutySchema.virtual('clientChargeRate').get(function () {
  return this.clientBillingAmount;
});
dutySchema.virtual('dutyNotes').get(function () {
  return this.remarks;
});
dutySchema.virtual('dutyStatus').get(function () {
  return this.status;
});

// Auto-generate duty slip number and calculate working hours
dutySchema.pre('save', async function (next) {
  if (!this.dutySlipNumber) {
    const count = await this.constructor.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.dutySlipNumber = `DUTY-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  // Automatic calculation of working hours and overnight shifts
  if (this.inTime && this.outTime) {
    const [inH, inM] = this.inTime.split(':').map(Number);
    const [outH, outM] = this.outTime.split(':').map(Number);
    const inMinutes = inH * 60 + (inM || 0);
    const outMinutes = outH * 60 + (outM || 0);
    let diff = outMinutes - inMinutes;
    if (diff <= 0) {
      this.isOvernight = true;
      diff += 24 * 60;
    } else {
      this.isOvernight = false;
    }
    this.hoursWorked = Math.round((diff / 60) * 10) / 10;
  }

  // Normalize 'Pending' to 'Pending Approval'
  if (this.status === 'Pending') {
    this.status = 'Pending Approval';
  }

  next();
});

module.exports = mongoose.model('Duty', dutySchema);
