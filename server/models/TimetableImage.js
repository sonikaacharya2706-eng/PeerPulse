import mongoose from 'mongoose';

const timetableImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Timetable title is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      uppercase: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1,
      max: 4,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'A',
    },
    semester: {
      type: String,
      trim: true,
      default: 'Odd Semester 2026',
    },
    imageUrl: {
      type: String,
      required: [true, 'Timetable image is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

timetableImageSchema.index({ department: 1, year: 1, section: 1, isActive: 1 });
timetableImageSchema.index({ createdAt: -1 });

const TimetableImage = mongoose.model('TimetableImage', timetableImageSchema);

export default TimetableImage;
