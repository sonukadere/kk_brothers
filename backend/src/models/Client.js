const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // Retain clientCode for backward compatibility
    clientCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    companyName: {
      type: String,
      required: [true, 'Business Name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Business type is required'],
      enum: [
        'Hotel',
        'Catering',
        'Catering Company',
        'Banquet Hall',
        'Resort',
        'Event Organizer',
        'Restaurant',
        'Other',
      ],
      default: 'Hotel',
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: 'Indore',
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    defaultBillingRatePerStaff: {
      type: Number,
      default: 900,
      min: [0, 'Billing rate cannot be negative'],
    },
    creditPeriodDays: {
      type: Number,
      default: 15,
      min: [0, 'Credit period cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases
clientSchema.virtual('businessName').get(function () {
  return this.companyName;
});

clientSchema.virtual('mobileNumber').get(function () {
  return this.phone;
});

// Auto-generate business ID and client code if not provided
clientSchema.pre('save', async function (next) {
  if (!this.businessId) {
    const count = await this.constructor.countDocuments();
    const prefix = this.type === 'Catering' || this.type === 'Catering Company' ? 'CAT' : 'HTL';
    this.businessId = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  if (!this.clientCode) {
    this.clientCode = this.businessId;
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema);
