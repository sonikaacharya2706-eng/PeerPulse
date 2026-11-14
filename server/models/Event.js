import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['academic', 'cultural', 'sports', 'technical', 'workshop', 'club', 'other'],
      required: [true, 'Event category is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    startAt: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endAt: {
      type: Date,
      required: [true, 'End time is required'],
    },
    poster: {
      type: String,
      default: '',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    targetDepartments: {
      type: [String],
      default: [],
    },
    targetYears: {
      type: [Number],
      default: [],
    },
    targetClubs: {
      type: [String],
      default: [],
    },
    qrSecret: {
      type: String,
      default: '',
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    reminded24: {
      type: Boolean,
      default: false,
    },
    reminded1: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ startAt: 1, isCancelled: 1 });
eventSchema.index({ category: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
