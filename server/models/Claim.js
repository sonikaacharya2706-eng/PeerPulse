import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostFoundItem',
      required: [true, 'Item reference is required'],
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claimant reference is required'],
    },
    proofDescription: {
      type: String,
      required: [true, 'Proof description is required'],
      trim: true,
    },
    proofImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remark: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

claimSchema.index({ item: 1, claimant: 1 });

const Claim = mongoose.model('Claim', claimSchema);
export default Claim;
