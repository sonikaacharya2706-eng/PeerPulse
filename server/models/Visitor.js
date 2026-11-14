import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      trim: true,
    },
    personToMeet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host / Person to meet is required'],
    },
    idProofType: {
      type: String,
      required: [true, 'ID proof type is required'],
      trim: true,
    },
    idProofNumber: {
      type: String,
      required: [true, 'ID proof number is required'],
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    passCode: {
      type: String,
      required: [true, 'Pass code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    preRegistered: {
      type: Boolean,
      default: false,
    },
    expectedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['expected', 'checked_in', 'checked_out', 'cancelled'],
      default: 'expected',
    },
    checkInAt: {
      type: Date,
      default: null,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

visitorSchema.index({ status: 1, expectedDate: 1 });

const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;
