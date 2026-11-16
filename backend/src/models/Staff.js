const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    staffCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Staff full name is required'],
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
    profilePhoto: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    age: {
      type: Number,
      min: [16, 'Age must be at least 16'],
      max: [80, 'Age cannot exceed 80'],
      default: null,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    // Retain joinDate for backward compatibility
    joinDate: {
      type: Date,
      default: Date.now,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      enum: [
        'Waiter',
        'Kitchen Helper',
        'Chef',
        'Captain',
        'Housekeeping',
        'Dishwasher',
        'Bartender',
        'Cleaner',
        'Supervisor',
        'Senior Steward',
        'Steward',
        'Helper',
        'Staff',
        'Other',
      ],
      default: 'Waiter',
    },
    defaultDailyRate: {
      type: Number,
      min: [0, 'Daily rate cannot be negative'],
      default: 600,
    },
    defaultHourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
      default: 75,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    idProofType: {
      type: String,
      enum: ['Aadhaar', 'PAN Card', 'Voter ID', 'Driving License', 'Passport', 'Other', 'None'],
      default: 'Aadhaar',
    },
    idProofNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' },
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

// Virtual for staffId alias
staffSchema.virtual('staffId').get(function () {
  return this.staffCode;
});

// Calculate age from DOB if DOB is provided but age is not
staffSchema.pre('save', async function (next) {
  if (this.dateOfBirth && !this.age) {
    const diffMs = Date.now() - new Date(this.dateOfBirth).getTime();
    const ageDt = new Date(diffMs);
    this.age = Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  // Keep joiningDate and joinDate synchronized
  if (this.joiningDate && !this.joinDate) {
    this.joinDate = this.joiningDate;
  } else if (this.joinDate && !this.joiningDate) {
    this.joiningDate = this.joinDate;
  }

  // Auto-generate staffCode if not provided
  if (!this.staffCode) {
    const count = await this.constructor.countDocuments();
    this.staffCode = `STF-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
