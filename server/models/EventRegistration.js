import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    status: {
      type: String,
      enum: ['registered', 'waitlisted', 'cancelled', 'attended'],
      default: 'registered',
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// UNIQUE compound index (event, user)
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ event: 1, status: 1, createdAt: 1 });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
export default EventRegistration;
