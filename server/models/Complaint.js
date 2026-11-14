import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Complainant reference is required'],
    },
    category: {
      type: String,
      enum: ['electrical', 'plumbing', 'internet', 'furniture', 'cleaning', 'other'],
      required: [true, 'Category is required'],
    },
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['submitted', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'submitted',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    slaDueAt: {
      type: Date,
      required: true,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    timeline: [
      {
        status: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        remark: { type: String, default: '' },
        at: { type: Date, default: Date.now },
        images: { type: [String], default: [] },
      },
    ],
    feedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ raisedBy: 1 });
complaintSchema.index({ assignedTo: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
